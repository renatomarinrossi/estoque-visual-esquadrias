begin;
-- Log obrigatório; falhas abortam a transação. UPDATE guarda somente campos alterados.
create or replace function public.auditar_operacao_financeira()
returns trigger language plpgsql security definer set search_path=public as $$
declare antes jsonb; depois jsonb; linha jsonb; modulo text;
begin
 if current_setting('app.restaurando_backup',true)='true' then return coalesce(new,old); end if;
 if tg_op='UPDATE' and to_jsonb(old)=to_jsonb(new) then return new; end if;
 antes:=case when tg_op<>'INSERT' then to_jsonb(old) end;
 depois:=case when tg_op<>'DELETE' then to_jsonb(new) end;
 linha:=coalesce(depois,antes);
 if tg_op='UPDATE' then
 select jsonb_object_agg(key,value) into antes from jsonb_each(antes) where value is distinct from depois->key;
 select jsonb_object_agg(key,value) into depois from jsonb_each(depois) where antes ? key;
 end if;
 modulo:=case tg_table_name when 'contas_pagar' then 'CONTAS_A_PAGAR' when 'vendas_recebimentos' then 'RECEBIMENTOS' else 'VENDAS' end;
 perform registrar_log_financeiro(modulo,tg_op,tg_table_name,(linha->>'id')::bigint,
 format('%s em %s #%s',tg_op,tg_table_name,linha->>'id'),jsonb_build_object('antes',antes,'depois',depois));
 return coalesce(new,old);
end $$;

create function public.salvar_conta_pagar(p_conta jsonb,p_id bigint default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare c contas_pagar%rowtype; v_id bigint;
begin
 if not usuario_ativo() then raise exception 'Acesso não permitido.'; end if;
 if p_id is not null then
 select * into c from contas_pagar where id=p_id for update;
 if not found then raise exception 'Conta não encontrada.'; end if;
 if c.status<>'EM_ABERTO' then raise exception 'Somente contas em aberto podem ser editadas.'; end if;
 end if;
 if (p_conta->>'valor')::numeric is null or (p_conta->>'valor')::numeric<=0 or (p_conta->>'valor') in ('NaN','Infinity','-Infinity')
 or length(trim(coalesce(p_conta->>'favorecido','')))=0 or length(trim(coalesce(p_conta->>'descricao','')))=0
 then raise exception 'Preencha favorecido, descrição e valor positivo.'; end if;
 if p_id is null then
 insert into contas_pagar(data_lancamento,favorecido,descricao,valor,forma_pagamento,data_vencimento,observacoes)
 values((p_conta->>'data_lancamento')::date,trim(p_conta->>'favorecido'),trim(p_conta->>'descricao'),(p_conta->>'valor')::numeric,p_conta->>'forma_pagamento',(p_conta->>'data_vencimento')::date,p_conta->>'observacoes') returning id into v_id;
 else
 update contas_pagar set data_lancamento=(p_conta->>'data_lancamento')::date,favorecido=trim(p_conta->>'favorecido'),descricao=trim(p_conta->>'descricao'),valor=(p_conta->>'valor')::numeric,forma_pagamento=p_conta->>'forma_pagamento',data_vencimento=(p_conta->>'data_vencimento')::date,observacoes=p_conta->>'observacoes' where id=p_id;
 v_id:=p_id;
 end if;
 return v_id;
end $$;
create function public.operar_conta_pagar(p_id bigint,p_acao text,p_data date default null)
returns void language plpgsql security definer set search_path=public as $$
declare c contas_pagar%rowtype;
begin
 if not usuario_ativo() then raise exception 'Acesso não permitido.'; end if;
 select * into c from contas_pagar where id=p_id for update;
 if not found then raise exception 'Conta não encontrada.'; end if;
 if p_acao='PAGAR' then
 if p_data is null or p_data>(now() at time zone 'America/Sao_Paulo')::date then raise exception 'Informe data de pagamento válida.'; end if;
 if c.status='PAGO' and c.data_pagamento=p_data then return; end if;
 if c.status<>'EM_ABERTO' then raise exception 'Conta não está em aberto.'; end if;
 update contas_pagar set status='PAGO',data_pagamento=p_data where id=p_id;
 elsif p_acao='CANCELAR' then
 if c.status='PAGO' then raise exception 'Conta paga não pode ser cancelada.'; end if;
 update contas_pagar set status='CANCELADO',data_pagamento=null where id=p_id;
 else raise exception 'Operação inválida.'; end if;
end $$;
create function public.operar_venda(p_id bigint,p_acao text)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not usuario_ativo() then raise exception 'Acesso não permitido.'; end if;
 perform 1 from vendas where id=p_id for update;
 if not found then raise exception 'Venda não encontrada.'; end if;
 if p_acao='RESTAURAR' then update vendas set arquivada=false,arquivada_em=null where id=p_id;
 elsif p_acao='EXCLUIR' then delete from vendas where id=p_id;
 else raise exception 'Operação inválida.'; end if;
end $$;
revoke insert,update,delete on public.contas_pagar,public.vendas,public.vendas_parcelas,public.vendas_recebimentos from authenticated;
revoke all on function public.salvar_conta_pagar(jsonb,bigint),public.operar_conta_pagar(bigint,text,date),public.operar_venda(bigint,text) from public;
grant execute on function public.salvar_conta_pagar(jsonb,bigint),public.operar_conta_pagar(bigint,text,date),public.operar_venda(bigint,text) to authenticated;

-- Retenção deliberada: exportar, conferir o arquivo e confirmar o lote antes de purgar.
-- Não há exclusão automática nem prazo legal presumido.
create table public.auditoria_exportacoes (
 id bigint generated always as identity primary key, created_at timestamptz not null default now(),
 usuario_auth uuid not null, corte timestamptz not null, max_id bigint not null, quantidade bigint not null,
 resumo_sha256 text, confirmado_em timestamptz
);
alter table public.auditoria_exportacoes enable row level security;
grant select on public.auditoria_exportacoes to authenticated;
create policy auditoria_exportacoes_leitura on public.auditoria_exportacoes for select to authenticated using(eh_desenvolvedor());
create function public.exportar_logs_antigos(p_corte timestamptz) returns jsonb language plpgsql security definer set search_path=public as $$
declare lote bigint; dados jsonb; ultimo bigint; n bigint;
begin
 if not eh_desenvolvedor() then raise exception 'Acesso não permitido.'; end if;
 if p_corte is null or p_corte>now()-interval '90 days' then raise exception 'Mantenha pelo menos 90 dias no histórico online.'; end if;
 select coalesce(jsonb_agg(t order by id),'[]'),coalesce(max(id),0),count(*) into dados,ultimo,n from (select * from logs_financeiros where created_at<p_corte order by id limit 5000) t;
 insert into auditoria_exportacoes(usuario_auth,corte,max_id,quantidade) values(auth.uid(),p_corte,ultimo,n) returning id into lote;
 return jsonb_build_object('lote',lote,'registros',dados,'quantidade',n);
end $$;
create function public.confirmar_arquivo_logs(p_lote bigint,p_sha256 text) returns bigint language plpgsql security definer set search_path=public as $$
declare lote auditoria_exportacoes%rowtype; n bigint;
begin
 if not eh_desenvolvedor() then raise exception 'Acesso não permitido.'; end if;
 if p_sha256 is null or p_sha256!~'^[0-9a-f]{64}$' then raise exception 'Informe o SHA-256 do arquivo conferido.'; end if;
 select * into lote from auditoria_exportacoes where id=p_lote for update;
 if not found or lote.usuario_auth<>auth.uid() then raise exception 'Lote não encontrado.'; end if;
 if lote.confirmado_em is not null then return 0; end if;
 delete from logs_financeiros where created_at<lote.corte and id<=lote.max_id;
 get diagnostics n=row_count;
 if n<>lote.quantidade then raise exception 'O lote mudou. Exporte novamente.'; end if;
 update auditoria_exportacoes set resumo_sha256=p_sha256,confirmado_em=now() where id=p_lote;
 return n;
end $$;
revoke all on function public.exportar_logs_antigos(timestamptz),public.confirmar_arquivo_logs(bigint,text) from public;
grant execute on function public.exportar_logs_antigos(timestamptz),public.confirmar_arquivo_logs(bigint,text) to authenticated;
create index if not exists vendas_listagem on public.vendas(arquivada,data_venda desc,id desc);
create index if not exists movimentos_listagem on public.movimentacoes_estoque(data_movimentacao desc,id desc);
create function public.resumo_vendas(p_ids bigint[])
returns table(venda_id bigint,total_recebido numeric,proxima jsonb)
language sql stable security invoker set search_path=public as $$
 select v.id,
 (select coalesce(sum(r.valor),0) from vendas_recebimentos r join vendas_parcelas p on p.id=r.parcela_id where p.venda_id=v.id),
 (select to_jsonb(p) from vendas_parcelas p where p.venda_id=v.id and p.status in ('A_RECEBER','PARCIALMENTE_RECEBIDO') order by p.data_vencimento,p.id limit 1)
 from vendas v where v.id=any(p_ids) and cardinality(p_ids)<=100;
$$;
revoke all on function public.resumo_vendas(bigint[]) from public;
grant execute on function public.resumo_vendas(bigint[]) to authenticated;
notify pgrst,'reload schema';
commit;

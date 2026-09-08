-- Reconcilia a admissão sem apagar históricos e permite exclusão definitiva solicitada pelo usuário.
begin;
alter table public.dp_periodos_ferias add column substituido_em timestamptz;

create function public.dp_reconciliar_periodos(p_funcionario_id bigint)
returns integer language plpgsql security definer set search_path=public as $$
declare f dp_funcionarios%rowtype; inicio date; direito date; limite date;
 esperados date[] := array[]::date[]; n integer := 0;
begin
 select * into f from dp_funcionarios where id=p_funcionario_id for update;
 if not found then return 0; end if;
 inicio:=f.data_admissao;
 limite:=least(coalesce(f.data_inativacao,(now() at time zone 'America/Sao_Paulo')::date),(now() at time zone 'America/Sao_Paulo')::date);
 direito:=(inicio+interval '1 year')::date;
 while direito<=limite loop
  esperados:=array_append(esperados,inicio);
  insert into dp_periodos_ferias(funcionario_id,periodo_aquisitivo_inicio,periodo_aquisitivo_fim,data_direito,limite_concessao)
  values(f.id,inicio,direito-1,direito,(direito+interval '1 year')::date-1)
  on conflict(funcionario_id,periodo_aquisitivo_inicio) do nothing;
  if found then n:=n+1; end if;
  inicio:=direito; direito:=(inicio+interval '1 year')::date;
 end loop;
 -- Guarda o período anterior para explicar também os lançamentos cancelados.
 -- Períodos com férias efetivas exigem revisão; nunca são ocultados automaticamente.
 update dp_periodos_ferias p set substituido_em=now()
 where funcionario_id=f.id and substituido_em is null
 and not (periodo_aquisitivo_inicio=any(esperados))
 and not exists(select 1 from dp_ferias_movimentacoes m where m.periodo_id=p.id and m.cancelado_em is null)
 and not exists(select 1 from dp_ferias a where a.periodo_id=p.id and a.status<>'CANCELADO');
 update dp_periodos_ferias set substituido_em=null
 where funcionario_id=f.id and substituido_em is not null and periodo_aquisitivo_inicio=any(esperados);
 return n;
end $$;
revoke all on function public.dp_reconciliar_periodos(bigint) from public,anon,authenticated;

create or replace function public.dp_sincronizar_periodos_ferias()
returns integer language plpgsql security definer set search_path=public as $$
declare f record; n integer:=0;
begin
 if auth.uid() is not null and not dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
 for f in select id from dp_funcionarios where (ativo or data_inativacao is not null) order by id loop
  n:=n+dp_reconciliar_periodos(f.id);
 end loop;
 return n;
end $$;

create function public.dp_validar_edicao_funcionario()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if current_setting('app.restaurando_backup',true)='true' then return new; end if;
 if new.data_admissao is distinct from old.data_admissao and (
  exists(select 1 from dp_ferias_movimentacoes where funcionario_id=old.id and cancelado_em is null)
  or exists(select 1 from dp_ferias where funcionario_id=old.id and status<>'CANCELADO')
 ) then raise exception 'Revise as férias já lançadas antes de alterar a admissão. O histórico não será modificado automaticamente.'; end if;
 return new;
end $$;
create trigger dp_validar_edicao before update on public.dp_funcionarios
 for each row execute function public.dp_validar_edicao_funcionario();

create function public.dp_reconciliar_apos_edicao()
returns trigger language plpgsql security definer set search_path=public as $$
begin
 if current_setting('app.restaurando_backup',true)='true' then return new; end if;
 perform dp_reconciliar_periodos(new.id);
 return new;
end $$;
create trigger dp_reconciliar_apos_edicao after insert or update of data_admissao,data_inativacao on public.dp_funcionarios
 for each row execute function public.dp_reconciliar_apos_edicao();
create trigger dp_auditoria after insert or update or delete on public.dp_periodos_ferias
 for each row execute function public.dp_auditar();

create function public.dp_excluir_funcionario(p_id bigint,p_nome_confirmacao text)
returns void language plpgsql security definer set search_path=public as $$
declare f dp_funcionarios%rowtype; pagamentos bigint[]; ferias bigint[]; periodos bigint[];
begin
 if not dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
 -- Mesma ordem de bloqueio do backup, evitando exclusão concorrente com restauração.
 lock table dp_funcionarios,dp_periodos_ferias,dp_ferias,dp_ferias_pagamentos,
 dp_ferias_movimentacoes,dp_pagamentos,dp_pagamento_lancamentos,dp_auditoria in share row exclusive mode;
 select * into f from dp_funcionarios where id=p_id for update;
 if not found then raise exception 'Funcionário não encontrado.'; end if;
 if p_nome_confirmacao is distinct from f.nome then raise exception 'Digite o nome completo do funcionário para confirmar.'; end if;
 select coalesce(array_agg(id),array[]::bigint[]) into pagamentos from dp_pagamentos where funcionario_id=p_id;
 select coalesce(array_agg(id),array[]::bigint[]) into ferias from dp_ferias where funcionario_id=p_id;
 select coalesce(array_agg(id),array[]::bigint[]) into periodos from dp_periodos_ferias where funcionario_id=p_id;
 delete from dp_pagamento_lancamentos where pagamento_id=any(pagamentos);
 delete from dp_ferias_pagamentos where ferias_id=any(ferias);
 delete from dp_ferias_movimentacoes where funcionario_id=p_id or periodo_id=any(periodos);
 delete from dp_ferias where funcionario_id=p_id;
 delete from dp_pagamentos where funcionario_id=p_id;
 delete from dp_periodos_ferias where funcionario_id=p_id;
 delete from dp_funcionarios where id=p_id;
 -- Inclui os eventos de DELETE produzidos pelos gatilhos nesta transação.
 delete from dp_auditoria where
  (tabela='dp_funcionarios' and registro_id=p_id)
  or antes->>'funcionario_id'=p_id::text or depois->>'funcionario_id'=p_id::text
  or (tabela='dp_pagamento_lancamentos' and (
   antes->>'pagamento_id'=any(array(select x::text from unnest(pagamentos) x))
   or depois->>'pagamento_id'=any(array(select x::text from unnest(pagamentos) x))))
  or (tabela='dp_ferias_pagamentos' and (
   antes->>'ferias_id'=any(array(select x::text from unnest(ferias) x))
   or depois->>'ferias_id'=any(array(select x::text from unnest(ferias) x))));
end $$;
revoke all on function public.dp_excluir_funcionario(bigint,text),public.dp_validar_edicao_funcionario(),public.dp_reconciliar_apos_edicao() from public,anon,authenticated;
grant execute on function public.dp_excluir_funcionario(bigint,text) to authenticated;

create function public.dp_validar_periodo_movimento()
returns trigger language plpgsql security definer set search_path=public as $$
declare p dp_periodos_ferias%rowtype;
begin
 if current_setting('app.restaurando_backup',true)='true' then return new; end if;
 if tg_op='UPDATE' and new.cancelado_em is not null then return new; end if;
 select * into p from dp_periodos_ferias where id=new.periodo_id for update;
 if p.substituido_em is not null then
  raise exception 'Período substituído: não permite novos lançamentos de férias.';
 end if;
 return new;
end $$;
create trigger dp_validar_periodo before insert or update on public.dp_ferias_movimentacoes
 for each row execute function public.dp_validar_periodo_movimento();
revoke all on function public.dp_validar_periodo_movimento() from public,anon,authenticated;

-- As substituições de dp_gerar_folha e dp_salvar_funcionario seguem abaixo.

create or replace function public.dp_gerar_folha(p_competencia date)
returns integer language plpgsql security definer set search_path=public as $$
declare f dp_funcionarios%rowtype; total numeric; adiant numeric; tipo text; valor numeric; n int:=0; venc date;
begin
 if auth.uid() is not null and not dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
 if p_competencia is null or extract(day from p_competencia)<>1 then raise exception 'Informe o primeiro dia da competência.'; end if;
 perform pg_advisory_xact_lock(19092026,p_competencia-date '2000-01-01');
 for f in select * from dp_funcionarios where (ativo or data_inativacao is not null)
 and data_admissao<(p_competencia+interval '1 month')::date and (data_inativacao is null or data_inativacao>=p_competencia) order by id for update loop
 total:=dp_valor_proporcional(f.salario,f.data_admissao,f.data_inativacao,p_competencia);
 adiant:=case when f.data_admissao>p_competencia+19 or f.data_inativacao<p_competencia+19 then 0 else round(total*0.4,2) end;
 foreach tipo in array array['ADIANTAMENTO','SALARIO'] loop
 valor:=case when tipo='ADIANTAMENTO' then adiant else total-adiant end;
 if valor<=0 then continue; end if;
 venc:=case when tipo='ADIANTAMENTO' then p_competencia+19 else dp_quinto_dia_util(p_competencia) end;
 insert into dp_pagamentos(funcionario_id,competencia,tipo,nome_funcionario,funcao_funcionario,salario_base,valor,forma_pagamento,data_vencimento,status)
 values(f.id,p_competencia,tipo,f.nome,f.funcao,f.salario,valor,'PIX',venc,'EM_ABERTO') on conflict do nothing;
 if found then n:=n+1; end if;
 end loop; end loop; return n;
end $$;

create or replace function public.dp_salvar_funcionario(p_dados jsonb,p_id bigint default null,p_decisoes jsonb default '{}'::jsonb)
returns bigint language plpgsql security definer set search_path=public as $$
declare f dp_funcionarios%rowtype; p dp_pagamentos%rowtype; v_id bigint; decisao text; total numeric; pagos numeric; abertos numeric; novo numeric;
begin
 if not dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
 if (p_dados->>'ativo')::boolean is false and nullif(p_dados->>'data_inativacao','') is null then raise exception 'Informe a data da inativação.'; end if;
 if p_id is not null then
 select * into f from dp_funcionarios where id=p_id for update;
 if not found then raise exception 'Funcionário não encontrado.'; end if;
 -- Bloqueia a mesma folha usada pela baixa e exige decisão para cada competência.
 perform 1 from dp_pagamentos where funcionario_id=p_id order by id for update;
 if f.data_admissao is distinct from (p_dados->>'data_admissao')::date or f.data_inativacao is distinct from (p_dados->>'data_inativacao')::date or f.ativo is distinct from (p_dados->>'ativo')::boolean or p_decisoes<>'{}'::jsonb then
 for p in select distinct on (competencia) * from dp_pagamentos where funcionario_id=p_id and status='EM_ABERTO' order by competencia,id loop
 decisao:=p_decisoes->>p.competencia::text;
 if decisao is null or decisao not in ('MANTER','CANCELAR','RECALCULAR') then raise exception 'Revise os pagamentos pendentes da competência %.',p.competencia; end if;
 if decisao='CANCELAR' then
 update dp_pagamentos set status='CANCELADO' where funcionario_id=p_id and competencia=p.competencia and status='EM_ABERTO';
 elsif decisao='RECALCULAR' then
 total:=dp_valor_proporcional((p_dados->>'salario')::numeric,(p_dados->>'data_admissao')::date,(p_dados->>'data_inativacao')::date,p.competencia);
 select coalesce(sum(valor),0) into pagos from dp_pagamentos where funcionario_id=p_id and competencia=p.competencia and status='PAGO';
 if pagos>total then raise exception 'Valores já pagos excedem o proporcional em %. Mantenha e revise os ajustes.',p.competencia; end if;
 select sum(valor) into abertos from dp_pagamentos where funcionario_id=p_id and competencia=p.competencia and status='EM_ABERTO';
 novo:=total-pagos;
 -- Distribui o saldo por valor anterior; última parcela absorve arredondamento.
 with pendentes as (select id,round(novo*valor/abertos,2) v,row_number() over(order by id desc) rn from dp_pagamentos where funcionario_id=p_id and competencia=p.competencia and status='EM_ABERTO'),
 valores as(select id,case when rn=1 then v+novo-sum(v) over() else v end v from pendentes)
 update dp_pagamentos x set valor=case when v.v>0 then v.v else x.valor end,status=case when v.v=0 then 'CANCELADO' else x.status end from valores v where x.id=v.id;
 end if;
 end loop; end if;
 update dp_funcionarios set nome=trim(p_dados->>'nome'),funcao=trim(p_dados->>'funcao'),salario=(p_dados->>'salario')::numeric,
 data_admissao=(p_dados->>'data_admissao')::date,data_inativacao=(p_dados->>'data_inativacao')::date,ativo=(p_dados->>'ativo')::boolean,observacoes=coalesce(p_dados->>'observacoes','') where id=p_id;
 v_id:=p_id;
 else
 insert into dp_funcionarios(nome,funcao,salario,data_admissao,data_inativacao,ativo,observacoes)
 values(trim(p_dados->>'nome'),trim(p_dados->>'funcao'),(p_dados->>'salario')::numeric,(p_dados->>'data_admissao')::date,(p_dados->>'data_inativacao')::date,(p_dados->>'ativo')::boolean,coalesce(p_dados->>'observacoes','')) returning id into v_id;
 end if;
 return v_id;
end $$;

drop policy dp_auditoria_leitura on public.dp_auditoria;
create policy dp_auditoria_leitura on public.dp_auditoria for select to authenticated using(public.eh_desenvolvedor());
select public.dp_sincronizar_periodos_ferias();
notify pgrst,'reload schema';
commit;

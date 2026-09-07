begin;
create table public.backup_historico (
 id bigint generated always as identity primary key, created_at timestamptz not null default now(),
 usuario_auth uuid not null, versao integer not null, versao_sistema text not null,
 quantidades jsonb not null, finalidade text not null
);
-- Cópia atômica anterior à restauração, sem FK para dados substituídos.
create table public.backup_seguranca (
 id bigint generated always as identity primary key, created_at timestamptz not null default now(),
 usuario_auth uuid not null, conteudo jsonb not null
);
alter table public.backup_historico enable row level security;
alter table public.backup_seguranca enable row level security;
grant select on public.backup_historico,public.backup_seguranca to authenticated;
create policy backup_historico_leitura on public.backup_historico for select to authenticated using(eh_desenvolvedor());
create policy backup_seguranca_leitura on public.backup_seguranca for select to authenticated using(eh_desenvolvedor());
create function public.backup_tabelas() returns text[] language sql immutable set search_path=public as $$
 select array['fornecedores','produtos','lixeira','usuarios','entradas','movimentacoes_estoque',
 'vendas','vendas_parcelas','vendas_recebimentos','contas_pagar','dp_funcionarios','dp_periodos_ferias',
 'dp_ferias','dp_ferias_pagamentos','dp_ferias_movimentacoes','dp_pagamentos','dp_pagamento_lancamentos',
 'dp_feriados','logs_financeiros','dp_auditoria','auditoria_exportacoes'];
$$;
create function public.gerar_backup_operacional(p_versao_sistema text,p_finalidade text default 'MANUAL')
returns jsonb language plpgsql security definer set search_path=public as $$
declare t text; dados jsonb; resultado jsonb; quantidades jsonb:='{}'; lista text;
begin
 if not pode_restaurar_backup() then raise exception 'Apenas desenvolvedores podem gerar backups.'; end if;
 -- Bloqueia escritas durante a leitura de todas as tabelas: snapshot coerente mesmo
 -- quando PostgREST executa em READ COMMITTED.
 select string_agg(format('public.%I',x),',') into lista from unnest(backup_tabelas()) x;
 execute 'lock table '||lista||' in share mode';
 resultado:=jsonb_build_object('sistema','Estoque Visual Esquadrias','empresa','Visual Esquadrias',
 'backupVersion',6,'versaoSistema',p_versao_sistema,'dataBackup',now(),'escopo','DADOS_OPERACIONAIS_SEM_AUTH');
 foreach t in array backup_tabelas() loop
 execute format('select coalesce(jsonb_agg(%s order by id),''[]''::jsonb) from public.%I r',case when t='usuarios' then 'to_jsonb(r)-''senha''' else 'to_jsonb(r)' end,t) into dados;
 resultado:=resultado||jsonb_build_object(t,dados);
 quantidades:=quantidades||jsonb_build_object(t,jsonb_array_length(dados));
 end loop;
 insert into backup_historico(usuario_auth,versao,versao_sistema,quantidades,finalidade)
 values(auth.uid(),6,p_versao_sistema,quantidades,p_finalidade);
 return resultado||jsonb_build_object('quantidades',quantidades);
end $$;

create or replace function public.restaurar_backup_completo(p_backup jsonb)
returns jsonb language plpgsql security definer set search_path=public as $$
declare t text; versao int; linha jsonb; colunas text; valores text; lista text; seguranca jsonb;
 total bigint; importados bigint:=0; n bigint; maximo bigint; seq text; existe boolean;
begin
 if not pode_restaurar_backup() then raise exception 'Apenas desenvolvedores podem restaurar backups.'; end if;
 if p_backup->>'sistema' is distinct from 'Estoque Visual Esquadrias' then raise exception 'Backup de outro sistema.'; end if;
 versao:=(p_backup->>'backupVersion')::int;
 if versao is null or versao not in (2,4,5,6) then raise exception 'Formatos aceitos: 2, 4, 5 e 6. O formato 3 exige converter a folha vinculada às contas a pagar antes da importação.'; end if;
 foreach t in array case when versao=6 then backup_tabelas() else array['fornecedores','produtos','lixeira','usuarios','vendas','vendas_parcelas','vendas_recebimentos','contas_pagar']||case when versao>=4 then array['dp_funcionarios','dp_periodos_ferias','dp_ferias','dp_ferias_pagamentos','dp_pagamentos'] else array[]::text[] end||case when versao=5 then array['dp_ferias_movimentacoes'] else array[]::text[] end end loop
 if jsonb_typeof(p_backup->t) is distinct from 'array' then raise exception 'Seção ausente ou inválida: %.',t; end if;
 if versao=6 and (p_backup->'quantidades'->>t)::bigint is distinct from jsonb_array_length(p_backup->t)::bigint then raise exception 'Contagem inválida: %.',t; end if;
 select count(*),count(distinct x->>'id') into total,n from jsonb_array_elements(p_backup->t) x;
 if total<>n then raise exception 'IDs ausentes ou duplicados: %.',t; end if;
 end loop;
 -- As identidades são externas ao arquivo; não remover o próprio acesso.
 if versao=6 and not exists(select 1 from jsonb_array_elements(p_backup->'usuarios') u where u->>'auth_user_id'=auth.uid()::text and u->>'perfil'='DESENVOLVEDOR' and (u->>'ativo')::boolean) then raise exception 'O backup não preserva o acesso do desenvolvedor atual.'; end if;
 if exists(select 1 from jsonb_array_elements(p_backup->'usuarios') u where u->>'auth_user_id' is not null and not exists(select 1 from auth.users a where a.id=(u->>'auth_user_id')::uuid)) then raise exception 'Recupere primeiro as identidades do Supabase Auth referenciadas no backup.'; end if;
 select string_agg(format('public.%I',x),',') into lista from unnest(backup_tabelas()) x;
 execute 'lock table '||lista||' in access exclusive mode';
 seguranca:=gerar_backup_operacional(coalesce(p_backup->>'versaoSistema',''),'PRE_RESTAURACAO');
 insert into backup_seguranca(usuario_auth,conteudo) values(auth.uid(),seguranca);
 perform set_config('app.restaurando_backup','true',true);
 if versao=6 then execute 'truncate table '||lista||' restart identity'; end if;
 foreach t in array backup_tabelas() loop
 if not p_backup ? t then continue; end if;
 for linha in select value from jsonb_array_elements(p_backup->t) loop
 -- Formatos 4/5 são importações aditivas: nunca substituem registros nem apagam
 -- históricos ausentes. O formato 6 restaura todas as tabelas explicitamente.
 if versao<6 then
 execute format('select exists(select 1 from public.%I where id=$1)',t) into existe using (linha->>'id')::bigint;
 if existe then continue; end if;
 end if;
 select string_agg(format('%I',a.attname),',' order by a.attnum),
 string_agg(format('r.%I',a.attname),',' order by a.attnum)
 into colunas,valores from pg_attribute a where a.attrelid=format('public.%I',t)::regclass
 and a.attnum>0 and not a.attisdropped and a.attgenerated='' and linha ? a.attname;
 if colunas is null then raise exception 'Registro inválido em %.',t; end if;
 execute format('insert into public.%I (%s) overriding system value select %s from jsonb_populate_record(null::public.%I,$1) r',t,colunas,valores,t) using linha;
 importados:=importados+1;
 end loop;
 seq:=pg_get_serial_sequence('public.'||t,'id');
 if seq is not null then
 execute format('select max(id) from public.%I',t) into maximo;
 perform setval(seq,coalesce(maximo,1),maximo is not null);
 end if;
 if versao=6 then
 execute format('select count(*) from public.%I',t) into n;
 if n<>jsonb_array_length(p_backup->t) then raise exception 'Contagem divergente após restaurar %.',t; end if;
 end if;
 end loop;
 if versao<6 then
 perform dp_migrar_ferias_legadas();
 insert into dp_pagamento_lancamentos(pagamento_id,valor,descricao,idempotencia)
 select p.id,p.valor_extra,coalesce(nullif(trim(p.observacoes_extra),''),'Extra importado'),gen_random_uuid()
 from dp_pagamentos p where p.valor_extra<>0 and not exists(select 1 from dp_pagamento_lancamentos l where l.pagamento_id=p.id);
 end if;
 if exists(select 1 from dp_periodos_ferias p join dp_ferias_movimentacoes m on m.periodo_id=p.id where m.cancelado_em is null group by p.id,p.dias_direito having sum(m.quantidade_dias) not between 0 and p.dias_direito) then raise exception 'Backup contém saldo de férias inválido.'; end if;
 if exists(select 1 from dp_pagamentos p where p.valor_extra<>(select coalesce(sum(l.valor),0) from dp_pagamento_lancamentos l where l.pagamento_id=p.id)) then raise exception 'Backup contém ajustes de folha inconsistentes.'; end if;
 perform set_config('app.restaurando_backup','false',true);
 return jsonb_build_object('sucesso',true,'modo',case when versao=6 then 'RESTAURACAO' else 'IMPORTACAO_ADITIVA' end,'importados',importados,
 'produtos',(select count(*) from produtos),'fornecedores',(select count(*) from fornecedores),'usuarios',(select count(*) from usuarios),
 'vendas',(select count(*) from vendas),'parcelas',(select count(*) from vendas_parcelas),'recebimentos',(select count(*) from vendas_recebimentos),'contas_pagar',(select count(*) from contas_pagar));
end $$;
-- Desativa o restaurador parcial antigo, que contornaria a validação completa.
revoke all on function public.restaurar_backup(jsonb,jsonb,jsonb,jsonb) from public,anon,authenticated;
revoke all on function public.backup_tabelas(),public.gerar_backup_operacional(text,text) from public;
grant execute on function public.gerar_backup_operacional(text,text) to authenticated;
notify pgrst,'reload schema';
commit;

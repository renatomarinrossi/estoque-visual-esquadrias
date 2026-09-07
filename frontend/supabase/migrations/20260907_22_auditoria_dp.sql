-- Correções da auditoria: 5–10, 12 e 15. Aplicar somente após backup.
begin;

create table public.dp_feriados (
  id bigint generated always as identity primary key,
  data date not null unique,
  descricao text not null check(length(trim(descricao)) > 0),
  abrangencia text not null check(abrangencia in ('NACIONAL','ESTADUAL','MUNICIPAL'))
);
alter table public.dp_feriados enable row level security;
grant select, insert, update, delete on public.dp_feriados to authenticated;
grant usage on sequence public.dp_feriados_id_seq to authenticated;
create policy dp_feriados_acesso on public.dp_feriados to authenticated
  using (public.dp_pode_acessar()) with check (public.dp_pode_acessar());

-- Datas fixas de Fernandópolis/SP. Pontos facultativos não são feriados.
insert into public.dp_feriados(data,descricao,abrangencia)
select make_date(ano, mes, dia), descricao, abrangencia
from generate_series(2026,2036) ano cross join (values
 (1,1,'Confraternização universal','NACIONAL'),(4,21,'Tiradentes','NACIONAL'),
 (5,1,'Dia do Trabalho','NACIONAL'),(5,22,'Aniversário de Fernandópolis','MUNICIPAL'),
 (7,9,'Revolução Constitucionalista','ESTADUAL'),(9,7,'Independência','NACIONAL'),
 (10,12,'Nossa Senhora Aparecida','NACIONAL'),(11,2,'Finados','NACIONAL'),
 (11,15,'Proclamação da República','NACIONAL'),(11,20,'Consciência Negra','NACIONAL'),
 (12,25,'Natal','NACIONAL')
) d(mes,dia,descricao,abrangencia);
-- Páscoa gregoriana: Sexta-feira Santa e Corpus Christi.
do $$ declare y int; a int; b int; c int; d int; e int; f int; g int; h int; i int; k int; l int; m int; pascoa date;
begin for y in 2026..2036 loop
 a:=y%19; b:=y/100; c:=y%100; d:=b/4; e:=b%4; f:=(b+8)/25; g:=(b-f+1)/3;
 h:=(19*a+b-d-g+15)%30; i:=c/4; k:=c%4; l:=(32+2*e+2*i-h-k)%7; m:=(a+11*h+22*l)/451;
 pascoa:=make_date(y,(h+l-7*m+114)/31,(h+l-7*m+114)%31+1);
 insert into public.dp_feriados(data,descricao,abrangencia) values
 (pascoa-2,'Sexta-feira Santa','MUNICIPAL'),(pascoa+60,'Corpus Christi','MUNICIPAL');
end loop; end $$;

create or replace function public.dp_quinto_dia_util(p_competencia date)
returns date language plpgsql stable set search_path=public as $$
declare dia date:=(date_trunc('month',p_competencia)+interval '1 month')::date; n int:=0;
begin
 if p_competencia is null then raise exception 'Competência obrigatória.'; end if;
 if extract(year from dia) not between 2026 and 2036 then
   raise exception 'Revise e amplie o calendário de feriados para esta competência.';
 end if;
 while n<5 loop
   if extract(isodow from dia)<=6 and not exists(select 1 from dp_feriados where data=dia) then n:=n+1; end if;
   if n<5 then dia:=dia+1; end if;
 end loop;
 while extract(isodow from dia)>5 or exists(select 1 from dp_feriados where data=dia) loop dia:=dia-1; end loop;
 return dia;
end $$;

create table public.dp_auditoria (
 id bigint generated always as identity primary key,
 created_at timestamptz not null default now(), usuario_auth uuid,
 tabela text not null, registro_id bigint not null, acao text not null,
 antes jsonb, depois jsonb
);
alter table public.dp_auditoria enable row level security;
grant select on public.dp_auditoria to authenticated;
create policy dp_auditoria_leitura on public.dp_auditoria for select to authenticated using(public.dp_pode_acessar());
create index dp_auditoria_data on public.dp_auditoria(created_at desc,id desc);
create function public.dp_auditar() returns trigger language plpgsql security definer set search_path=public as $$
begin
 if current_setting('app.restaurando_backup',true)='true' then return coalesce(new,old); end if;
 if tg_op='UPDATE' and to_jsonb(old)=to_jsonb(new) then return new; end if;
 insert into dp_auditoria(usuario_auth,tabela,registro_id,acao,antes,depois)
 values(auth.uid(),tg_table_name,coalesce(new.id,old.id),tg_op,
 case when tg_op<>'INSERT' then to_jsonb(old) end,case when tg_op<>'DELETE' then to_jsonb(new) end);
 return coalesce(new,old);
end $$;
revoke all on function public.dp_auditar() from public;

alter table public.dp_ferias_movimentacoes
 add column tipo_movimentacao text not null default 'LEGADO',
 add column valor numeric(12,2) not null default 0,
 add column origem_ferias_id bigint,
 add column origem_pagamento_id bigint;
alter table public.dp_ferias_movimentacoes drop constraint dp_ferias_movimentacoes_quantidade_dias_check;
alter table public.dp_ferias_movimentacoes add constraint dp_movimento_tipo check(
 tipo_movimentacao in ('GOZO','ABONO','PAGAMENTO_FERIAS','PAGAMENTO_TERCO','PAGAMENTO_ABONO','AJUSTE','LEGADO')),
 add constraint dp_movimento_valores check (
 valor>=0 and valor::text not in ('NaN','Infinity','-Infinity') and
 ((tipo_movimentacao in ('PAGAMENTO_FERIAS','PAGAMENTO_TERCO','PAGAMENTO_ABONO') and quantidade_dias=0 and valor>0)
 or (tipo_movimentacao in ('GOZO','ABONO','LEGADO') and quantidade_dias between 1 and 30)
 or (tipo_movimentacao='AJUSTE' and quantidade_dias between -30 and 30 and quantidade_dias<>0)));
create unique index dp_movimento_origem on public.dp_ferias_movimentacoes(origem_ferias_id,tipo_movimentacao) where origem_pagamento_id is null;
create unique index dp_movimento_pagamento_origem on public.dp_ferias_movimentacoes(origem_pagamento_id);

-- Migração explícita dos registros estruturados. Descrições livres continuam LEGADO
-- até revisão humana: inferir pelo texto poderia alterar saldos incorretamente.
create function public.dp_migrar_ferias_legadas() returns void language plpgsql security definer set search_path=public as $$
begin
 if exists(select 1 from public.dp_ferias where periodo_id is null) then
   raise exception 'Existem férias antigas sem período aquisitivo. Vincule-as antes de migrar.';
 end if;
insert into public.dp_ferias_movimentacoes(periodo_id,funcionario_id,descricao,quantidade_dias,data_movimentacao,observacoes,idempotencia,cancelado_em,tipo_movimentacao,origem_ferias_id)
select periodo_id,funcionario_id,'Gozo migrado #'||id,dias_gozo,inicio,observacoes,gen_random_uuid(),case when status='CANCELADO' then now() end,'GOZO',id from public.dp_ferias on conflict do nothing;
insert into public.dp_ferias_movimentacoes(periodo_id,funcionario_id,descricao,quantidade_dias,data_movimentacao,observacoes,idempotencia,cancelado_em,tipo_movimentacao,origem_ferias_id)
select periodo_id,funcionario_id,'Abono migrado #'||id,abono_dias,inicio,observacoes,gen_random_uuid(),case when status='CANCELADO' then now() end,'ABONO',id from public.dp_ferias where abono_dias>0 on conflict do nothing;
insert into public.dp_ferias_movimentacoes(periodo_id,funcionario_id,descricao,quantidade_dias,data_movimentacao,observacoes,idempotencia,tipo_movimentacao,valor,origem_ferias_id,origem_pagamento_id)
select f.periodo_id,f.funcionario_id,'Pagamento migrado #'||p.id,0,p.data_pagamento,p.observacoes,gen_random_uuid(),
 case p.componente when 'TERCO' then 'PAGAMENTO_TERCO' when 'ABONO' then 'PAGAMENTO_ABONO' else 'PAGAMENTO_FERIAS' end,p.valor,f.id,p.id
from public.dp_ferias_pagamentos p join public.dp_ferias f on f.id=p.ferias_id on conflict do nothing;
end $$;
revoke all on function public.dp_migrar_ferias_legadas() from public;
select public.dp_migrar_ferias_legadas();
-- As tabelas antigas ficam como arquivo somente leitura para preservar programação
-- e documentos originais. Não participam mais do saldo nem aceitam operações.
drop function public.dp_programar_ferias_v2(bigint,date,date,integer,numeric,numeric,numeric,date,date,date,text,uuid);
drop function public.dp_registrar_pagamento_ferias(bigint,text,numeric,date,text,text,uuid);
drop function public.dp_cancelar_ferias(bigint);
drop function public.dp_registrar_movimento_ferias(bigint,text,integer,date,text,uuid);
drop function public.dp_atualizar_movimento_ferias(bigint,text,integer,date,text);

create function public.dp_salvar_movimento_ferias(p_dados jsonb,p_id bigint default null)
returns bigint language plpgsql security definer set search_path=public as $$
declare per dp_periodos_ferias%rowtype; m dp_ferias_movimentacoes%rowtype; v_id bigint;
 v_periodo bigint:=(p_dados->>'periodo_id')::bigint; v_dias int:=(p_dados->>'quantidade_dias')::int;
 v_tipo text:=p_dados->>'tipo_movimentacao'; v_usados int;
begin
 if not dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
 select * into per from dp_periodos_ferias where id=v_periodo for update;
 if not found then raise exception 'Período não encontrado.'; end if;
 if p_id is null then
   select id into v_id from dp_ferias_movimentacoes where idempotencia=(p_dados->>'idempotencia')::uuid;
   if found then return v_id; end if;
 else
   select * into m from dp_ferias_movimentacoes where id=p_id and periodo_id=v_periodo for update;
   if not found or m.cancelado_em is not null then raise exception 'Movimento indisponível.'; end if;
 end if;
 if v_tipo is null or (v_tipo='LEGADO' and (p_id is null or m.tipo_movimentacao<>'LEGADO')) then raise exception 'Selecione um tipo estruturado.'; end if;
 if v_tipo='AJUSTE' and length(trim(coalesce(p_dados->>'observacoes','')))=0 then raise exception 'Justifique o ajuste.'; end if;
 select coalesce(sum(quantidade_dias),0) into v_usados from dp_ferias_movimentacoes
 where periodo_id=v_periodo and cancelado_em is null and id is distinct from p_id;
 if v_usados+v_dias not between 0 and per.dias_direito then raise exception 'Movimentação ultrapassa o saldo de férias.'; end if;
 if p_id is null then
 insert into dp_ferias_movimentacoes(periodo_id,funcionario_id,descricao,quantidade_dias,data_movimentacao,observacoes,idempotencia,tipo_movimentacao,valor)
 values(v_periodo,per.funcionario_id,trim(p_dados->>'descricao'),v_dias,(p_dados->>'data_movimentacao')::date,coalesce(p_dados->>'observacoes',''),(p_dados->>'idempotencia')::uuid,v_tipo,(p_dados->>'valor')::numeric) returning id into v_id;
 else
 update dp_ferias_movimentacoes set descricao=trim(p_dados->>'descricao'),quantidade_dias=v_dias,
 data_movimentacao=(p_dados->>'data_movimentacao')::date,observacoes=coalesce(p_dados->>'observacoes',''),tipo_movimentacao=v_tipo,valor=(p_dados->>'valor')::numeric where id=p_id;
 v_id:=p_id;
 end if;
 return v_id;
end $$;
create or replace function public.dp_cancelar_movimento_ferias(p_movimento_id bigint)
returns void language plpgsql security definer set search_path=public as $$
declare m dp_ferias_movimentacoes%rowtype; per dp_periodos_ferias%rowtype; usados int;
begin
 if not dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
 select * into m from dp_ferias_movimentacoes where id=p_movimento_id;
 if not found then raise exception 'Movimento não encontrado.'; end if;
 select * into per from dp_periodos_ferias where id=m.periodo_id for update;
 select * into m from dp_ferias_movimentacoes where id=p_movimento_id for update;
 if m.cancelado_em is not null then return; end if;
 select coalesce(sum(quantidade_dias),0) into usados from dp_ferias_movimentacoes where periodo_id=m.periodo_id and cancelado_em is null and id<>m.id;
 if usados not between 0 and per.dias_direito then raise exception 'Cancelamento deixaria saldo inválido.'; end if;
 update dp_ferias_movimentacoes set cancelado_em=now() where id=m.id;
end $$;

create table public.dp_pagamento_lancamentos (
 id bigint generated always as identity primary key,
 pagamento_id bigint not null references public.dp_pagamentos(id) on delete restrict,
 valor numeric(12,2) not null check(valor<>0 and valor::text not in ('NaN','Infinity','-Infinity')),
 descricao text not null check(length(trim(descricao)) between 1 and 200),
 idempotencia uuid not null unique, created_at timestamptz not null default now()
);
alter table public.dp_pagamento_lancamentos enable row level security;
grant select on public.dp_pagamento_lancamentos to authenticated;
create policy dp_lancamentos_leitura on public.dp_pagamento_lancamentos for select to authenticated using(dp_pode_acessar());
insert into public.dp_pagamento_lancamentos(pagamento_id,valor,descricao,idempotencia)
select id,valor_extra,coalesce(nullif(trim(observacoes_extra),''),'Extra anterior à auditoria'),gen_random_uuid() from public.dp_pagamentos where valor_extra<>0;
alter table public.dp_pagamentos drop constraint dp_pagamentos_valor_extra_check;
alter table public.dp_pagamentos add constraint dp_pagamentos_total_check check(valor+valor_extra>=0 and valor_extra::text not in ('NaN','Infinity','-Infinity'));
create function public.dp_lancar_ajuste(p_pagamento_id bigint,p_valor numeric,p_descricao text,p_idempotencia uuid)
returns void language plpgsql security definer set search_path=public as $$
declare p dp_pagamentos%rowtype;
begin
 if not dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
 select * into p from dp_pagamentos where id=p_pagamento_id for update;
 if not found then raise exception 'Pagamento não encontrado.'; end if;
 if exists(select 1 from dp_pagamento_lancamentos where idempotencia=p_idempotencia) then return; end if;
 if p.status<>'EM_ABERTO' then raise exception 'Somente pagamentos pendentes aceitam ajustes.'; end if;
 insert into dp_pagamento_lancamentos(pagamento_id,valor,descricao,idempotencia) values(p.id,p_valor,trim(p_descricao),p_idempotencia);
 update dp_pagamentos set valor_extra=valor_extra+p_valor,observacoes_extra=trim(p_descricao) where id=p.id;
end $$;
-- Remove a substituição silenciosa de extras; ajustes são lançamentos imutáveis.
drop function public.dp_atualizar_valor_extra(bigint,numeric,text);

create function public.dp_valor_proporcional(p_salario numeric,p_admissao date,p_demissao date,p_competencia date)
returns numeric language sql immutable set search_path=public as $$
 select case when p_admissao<=p_competencia and (p_demissao is null or p_demissao>=(p_competencia+interval '1 month')::date-1)
 then p_salario else round(p_salario/30*least(30,greatest(0,
 least(coalesce(p_demissao,(p_competencia+interval '1 month')::date-1),(p_competencia+interval '1 month')::date-1)-greatest(p_admissao,p_competencia)+1)),2) end;
$$;
create or replace function public.dp_sincronizar_periodos_ferias()
returns integer language plpgsql security definer set search_path=public as $$
declare f dp_funcionarios%rowtype; inicio date; direito date; limite date; n int:=0;
begin
 if auth.uid() is not null and not dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
 for f in select * from dp_funcionarios where ativo or data_inativacao is not null order by id loop
 inicio:=f.data_admissao; direito:=(inicio+interval '1 year')::date;
 limite:=least(coalesce(f.data_inativacao,(now() at time zone 'America/Sao_Paulo')::date),(now() at time zone 'America/Sao_Paulo')::date);
 while direito<=limite loop
 insert into dp_periodos_ferias(funcionario_id,periodo_aquisitivo_inicio,periodo_aquisitivo_fim,data_direito,limite_concessao)
 values(f.id,inicio,direito-1,direito,(direito+interval '1 year')::date-1) on conflict do nothing;
 if found then n:=n+1; end if;
 inicio:=direito; direito:=(inicio+interval '1 year')::date;
 end loop; end loop; return n;
end $$;
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

create function public.dp_salvar_funcionario(p_dados jsonb,p_id bigint default null,p_decisoes jsonb default '{}'::jsonb)
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
 if f.data_inativacao is distinct from (p_dados->>'data_inativacao')::date or f.ativo is distinct from (p_dados->>'ativo')::boolean or p_decisoes<>'{}'::jsonb then
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
create function public.dp_baixar_com_ajuste(p_id bigint,p_data date,p_forma text,p_valor numeric,p_descricao text,p_idempotencia uuid)
returns void language plpgsql security definer set search_path=public as $$
begin
 if not dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
 if p_data is null or p_data>(now() at time zone 'America/Sao_Paulo')::date then raise exception 'Data de pagamento inválida.'; end if;
 if p_forma is null or p_forma not in ('PIX','DINHEIRO','TRANSFERENCIA','OUTRO') then raise exception 'Forma de pagamento inválida.'; end if;
 perform 1 from dp_pagamentos where id=p_id for update;
 if p_valor<>0 then perform dp_lancar_ajuste(p_id,p_valor,p_descricao,p_idempotencia); end if;
 perform dp_pagar_folha(p_id,p_data,p_forma);
end $$;
revoke all on function public.dp_baixar_com_ajuste(bigint,date,text,numeric,text,uuid) from public;
grant execute on function public.dp_baixar_com_ajuste(bigint,date,text,numeric,text,uuid) to authenticated;
revoke all on function public.dp_pagar_folha(bigint,date,text) from public,authenticated;
revoke insert,update on public.dp_funcionarios from authenticated;
do $$ declare t text; begin foreach t in array array['dp_funcionarios','dp_pagamentos','dp_pagamento_lancamentos','dp_ferias_movimentacoes','dp_feriados'] loop
 execute format('create trigger dp_auditoria after insert or update or delete on public.%I for each row execute function public.dp_auditar()',t);
end loop; end $$;
-- Corrige somente vencimentos de salários ainda pendentes, sem alterar baixas.
update public.dp_pagamentos set data_vencimento=dp_quinto_dia_util(competencia)
where status='EM_ABERTO' and tipo='SALARIO' and competencia between date '2026-01-01' and date '2036-11-01';
revoke all on function public.dp_salvar_funcionario(jsonb,bigint,jsonb),public.dp_salvar_movimento_ferias(jsonb,bigint),public.dp_lancar_ajuste(bigint,numeric,text,uuid),public.dp_valor_proporcional(numeric,date,date,date) from public;
grant execute on function public.dp_salvar_funcionario(jsonb,bigint,jsonb),public.dp_salvar_movimento_ferias(jsonb,bigint),public.dp_lancar_ajuste(bigint,numeric,text,uuid) to authenticated;
notify pgrst,'reload schema';
commit;

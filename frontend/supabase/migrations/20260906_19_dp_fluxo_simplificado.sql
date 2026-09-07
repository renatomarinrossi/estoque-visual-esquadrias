-- Departamento Pessoal: quinto dia útil, valores extras e movimentações simples de férias.
-- Executar depois de 20260906_18_dp_isolado_ferias_anuais.sql.

begin;

alter table public.dp_pagamentos
  add column if not exists valor_extra numeric(12,2) not null default 0,
  add column if not exists observacoes_extra text not null default '';

alter table public.dp_pagamentos drop constraint if exists dp_pagamentos_valor_extra_check;
alter table public.dp_pagamentos add constraint dp_pagamentos_valor_extra_check
  check (valor_extra >= 0 and valor_extra::text <> 'NaN');

create or replace function public.dp_quinto_dia_util(p_competencia date)
returns date language plpgsql immutable set search_path = public
as $$
declare
  v_data date := (date_trunc('month', p_competencia) + interval '1 month')::date;
  v_contagem integer := 0;
begin
  while v_contagem < 5 loop
    if extract(isodow from v_data) between 1 and 6 then
      v_contagem := v_contagem + 1;
    end if;
    if v_contagem < 5 then v_data := v_data + 1; end if;
  end loop;
  if extract(isodow from v_data) = 6 then v_data := v_data - 1; end if;
  return v_data;
end;
$$;

update public.dp_pagamentos
set data_vencimento = public.dp_quinto_dia_util(competencia)
where tipo = 'SALARIO' and status = 'EM_ABERTO';

create or replace function public.dp_gerar_folha(p_competencia date)
returns integer language plpgsql security definer set search_path = public
as $$
declare
  f public.dp_funcionarios%rowtype;
  v_tipo text;
  v_valor numeric(12,2);
  v_adiantamento numeric(12,2);
  v_vencimento date;
  v_total integer := 0;
begin
  if auth.uid() is not null and not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  if p_competencia is null or extract(day from p_competencia) <> 1 then
    raise exception 'Informe o primeiro dia do mês de competência.';
  end if;
  perform pg_advisory_xact_lock(19092026, (p_competencia - date '2000-01-01'));
  for f in select * from public.dp_funcionarios
    where ativo and data_admissao <= least((p_competencia + interval '1 month')::date - 1,
      (now() at time zone 'America/Sao_Paulo')::date)
    order by id for update
  loop
    v_adiantamento := round(f.salario * 0.40, 2);
    foreach v_tipo in array array['ADIANTAMENTO', 'SALARIO'] loop
      if exists (select 1 from public.dp_pagamentos
        where funcionario_id=f.id and competencia=p_competencia and tipo=v_tipo) then continue; end if;
      v_valor := case when v_tipo='ADIANTAMENTO' then v_adiantamento else f.salario-v_adiantamento end;
      v_vencimento := case when v_tipo='ADIANTAMENTO' then p_competencia+19
        else public.dp_quinto_dia_util(p_competencia) end;
      insert into public.dp_pagamentos
        (funcionario_id,competencia,tipo,nome_funcionario,funcao_funcionario,
         salario_base,valor,valor_extra,observacoes_extra,forma_pagamento,data_vencimento,status)
      values (f.id,p_competencia,v_tipo,f.nome,f.funcao,f.salario,
              v_valor,0,'','PIX',v_vencimento,'EM_ABERTO');
      v_total := v_total + 1;
    end loop;
  end loop;
  return v_total;
end;
$$;

create or replace function public.dp_atualizar_valor_extra(
  p_pagamento_id bigint, p_valor_extra numeric, p_observacoes text
)
returns void language plpgsql security definer set search_path = public
as $$
declare p public.dp_pagamentos%rowtype;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  if p_valor_extra is null or p_valor_extra < 0 or p_valor_extra::text='NaN' then
    raise exception 'Informe um valor extra válido.';
  end if;
  select * into p from public.dp_pagamentos where id=p_pagamento_id for update;
  if not found then raise exception 'Pagamento não encontrado.'; end if;
  if p.status <> 'EM_ABERTO' then raise exception 'Somente pagamentos pendentes podem ser alterados.'; end if;
  update public.dp_pagamentos set valor_extra=p_valor_extra,
    observacoes_extra=left(trim(coalesce(p_observacoes,'')),200) where id=p_pagamento_id;
end;
$$;

create table if not exists public.dp_ferias_movimentacoes (
  id bigint generated always as identity primary key,
  periodo_id bigint not null references public.dp_periodos_ferias(id) on delete restrict,
  funcionario_id bigint not null references public.dp_funcionarios(id) on delete restrict,
  descricao text not null check (length(trim(descricao)) between 1 and 200),
  quantidade_dias smallint not null check (quantidade_dias between 1 and 30),
  data_movimentacao date not null,
  observacoes text not null default '',
  idempotencia uuid not null unique,
  cancelado_em timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists dp_ferias_movimentacoes_periodo
  on public.dp_ferias_movimentacoes(periodo_id,data_movimentacao,id);

alter table public.dp_ferias_movimentacoes enable row level security;
revoke all on public.dp_ferias_movimentacoes from anon,authenticated;
grant select on public.dp_ferias_movimentacoes to authenticated;
drop policy if exists dp_ferias_movimentacoes_leitura on public.dp_ferias_movimentacoes;
create policy dp_ferias_movimentacoes_leitura on public.dp_ferias_movimentacoes
  for select to authenticated using (public.dp_pode_acessar());

create or replace function public.dp_registrar_movimento_ferias(
  p_periodo_id bigint, p_descricao text, p_quantidade_dias integer,
  p_data_movimentacao date, p_observacoes text, p_idempotencia uuid
)
returns bigint language plpgsql security definer set search_path = public
as $$
declare
  periodo public.dp_periodos_ferias%rowtype;
  v_id bigint;
  v_usados integer;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  select id into v_id from public.dp_ferias_movimentacoes where idempotencia=p_idempotencia;
  if found then return v_id; end if;
  if p_idempotencia is null or length(trim(coalesce(p_descricao,''))) not between 1 and 200
     or p_quantidade_dias is null or p_quantidade_dias not between 1 and 30
     or p_data_movimentacao is null then raise exception 'Preencha a descrição, os dias e a data.'; end if;
  select * into periodo from public.dp_periodos_ferias where id=p_periodo_id for update;
  if not found then raise exception 'Período aquisitivo não encontrado.'; end if;
  select coalesce(sum(dias_gozo+abono_dias),0) into v_usados from public.dp_ferias
    where periodo_id=periodo.id and status<>'CANCELADO';
  select v_usados+coalesce(sum(quantidade_dias),0) into v_usados
    from public.dp_ferias_movimentacoes where periodo_id=periodo.id and cancelado_em is null;
  if v_usados+p_quantidade_dias>periodo.dias_direito then
    raise exception 'A quantidade ultrapassa o saldo de férias deste período.';
  end if;
  insert into public.dp_ferias_movimentacoes
    (periodo_id,funcionario_id,descricao,quantidade_dias,data_movimentacao,observacoes,idempotencia)
  values (periodo.id,periodo.funcionario_id,trim(p_descricao),p_quantidade_dias,
          p_data_movimentacao,trim(coalesce(p_observacoes,'')),p_idempotencia)
  returning id into v_id;
  return v_id;
end;
$$;

create or replace function public.dp_cancelar_movimento_ferias(p_movimento_id bigint)
returns void language plpgsql security definer set search_path = public
as $$
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  update public.dp_ferias_movimentacoes set cancelado_em=coalesce(cancelado_em,now())
    where id=p_movimento_id;
  if not found then raise exception 'Lançamento não encontrado.'; end if;
end;
$$;

revoke all on function public.dp_quinto_dia_util(date) from public;
revoke all on function public.dp_atualizar_valor_extra(bigint,numeric,text) from public;
revoke all on function public.dp_registrar_movimento_ferias(bigint,text,integer,date,text,uuid) from public;
revoke all on function public.dp_cancelar_movimento_ferias(bigint) from public;
grant execute on function public.dp_quinto_dia_util(date) to authenticated;
grant execute on function public.dp_atualizar_valor_extra(bigint,numeric,text) to authenticated;
grant execute on function public.dp_registrar_movimento_ferias(bigint,text,integer,date,text,uuid) to authenticated;
grant execute on function public.dp_cancelar_movimento_ferias(bigint) to authenticated;

create or replace function public.restaurar_backup_completo(p_backup jsonb)
returns jsonb
language plpgsql
security definer
set search_path to public
as $$
declare
  tabela text;
begin
  if not public.pode_restaurar_backup() then
    raise exception 'Apenas desenvolvedores autenticados podem restaurar backups.';
  end if;

  if p_backup ->> 'sistema' is distinct from 'Estoque Visual Esquadrias' then
    raise exception 'Arquivo não pertence ao Estoque Visual Esquadrias.';
  end if;

  if coalesce((p_backup ->> 'backupVersion')::integer, 0) <> 5 then
    raise exception 'Versão de backup não suportada.';
  end if;

  foreach tabela in array array[
    'fornecedores', 'produtos', 'lixeira', 'usuarios', 'vendas',
    'vendas_parcelas', 'vendas_recebimentos', 'contas_pagar', 'dp_funcionarios', 'dp_periodos_ferias', 'dp_ferias', 'dp_ferias_pagamentos', 'dp_ferias_movimentacoes', 'dp_pagamentos'
  ] loop
    if jsonb_typeof(p_backup -> tabela) is distinct from 'array' then
      raise exception 'A tabela % está ausente ou inválida no backup.', tabela;
    end if;
  end loop;

  perform set_config('app.restaurando_backup', 'true', true);

  truncate table
    public.dp_ferias_pagamentos, public.dp_ferias_movimentacoes, public.dp_pagamentos, public.dp_ferias, public.dp_periodos_ferias, public.dp_funcionarios, public.vendas_recebimentos, public.vendas_parcelas, public.vendas,
    public.contas_pagar, public.lixeira, public.produtos,
    public.fornecedores, public.usuarios
  restart identity cascade;

  insert into public.fornecedores overriding system value
  select * from jsonb_populate_recordset(null::public.fornecedores, p_backup -> 'fornecedores');
  insert into public.produtos overriding system value
  select * from jsonb_populate_recordset(null::public.produtos, p_backup -> 'produtos');
  insert into public.lixeira overriding system value
  select * from jsonb_populate_recordset(null::public.lixeira, p_backup -> 'lixeira');
  insert into public.usuarios overriding system value
  select * from jsonb_populate_recordset(null::public.usuarios, p_backup -> 'usuarios');
  insert into public.vendas overriding system value
  select * from jsonb_populate_recordset(null::public.vendas, p_backup -> 'vendas');
  insert into public.vendas_parcelas overriding system value
  select * from jsonb_populate_recordset(null::public.vendas_parcelas, p_backup -> 'vendas_parcelas');
  insert into public.vendas_recebimentos overriding system value
  select * from jsonb_populate_recordset(null::public.vendas_recebimentos, p_backup -> 'vendas_recebimentos');
  insert into public.contas_pagar overriding system value
  select * from jsonb_populate_recordset(null::public.contas_pagar, p_backup -> 'contas_pagar');

  insert into public.dp_funcionarios overriding system value
  select * from jsonb_populate_recordset(null::public.dp_funcionarios, p_backup -> 'dp_funcionarios');
  insert into public.dp_periodos_ferias overriding system value
  select * from jsonb_populate_recordset(null::public.dp_periodos_ferias, p_backup -> 'dp_periodos_ferias');
  insert into public.dp_ferias overriding system value
  select * from jsonb_populate_recordset(null::public.dp_ferias, p_backup -> 'dp_ferias');
  insert into public.dp_ferias_pagamentos overriding system value
  select * from jsonb_populate_recordset(null::public.dp_ferias_pagamentos, p_backup -> 'dp_ferias_pagamentos');
  insert into public.dp_ferias_movimentacoes overriding system value
  select * from jsonb_populate_recordset(null::public.dp_ferias_movimentacoes, p_backup -> 'dp_ferias_movimentacoes');
  insert into public.dp_pagamentos overriding system value
  select * from jsonb_populate_recordset(null::public.dp_pagamentos, p_backup -> 'dp_pagamentos');
  perform setval(pg_get_serial_sequence('public.fornecedores', 'id'), coalesce((select max(id) from public.fornecedores), 1), true);
  perform setval(pg_get_serial_sequence('public.produtos', 'id'), coalesce((select max(id) from public.produtos), 1), true);
  perform setval(pg_get_serial_sequence('public.lixeira', 'id'), coalesce((select max(id) from public.lixeira), 1), true);
  perform setval(pg_get_serial_sequence('public.usuarios', 'id'), coalesce((select max(id) from public.usuarios), 1), true);
  perform setval(pg_get_serial_sequence('public.vendas', 'id'), coalesce((select max(id) from public.vendas), 1), true);
  perform setval(pg_get_serial_sequence('public.vendas_parcelas', 'id'), coalesce((select max(id) from public.vendas_parcelas), 1), true);
  perform setval(pg_get_serial_sequence('public.vendas_recebimentos', 'id'), coalesce((select max(id) from public.vendas_recebimentos), 1), true);
  perform setval(pg_get_serial_sequence('public.contas_pagar', 'id'), coalesce((select max(id) from public.contas_pagar), 1), true);

  perform setval(pg_get_serial_sequence('public.dp_funcionarios', 'id'), coalesce((select max(id) from public.dp_funcionarios), 1), true);
  perform setval(pg_get_serial_sequence('public.dp_periodos_ferias', 'id'), coalesce((select max(id) from public.dp_periodos_ferias), 1), true);
  perform setval(pg_get_serial_sequence('public.dp_ferias', 'id'), coalesce((select max(id) from public.dp_ferias), 1), true);
  perform setval(pg_get_serial_sequence('public.dp_ferias_pagamentos', 'id'), coalesce((select max(id) from public.dp_ferias_pagamentos), 1), true);
  perform setval(pg_get_serial_sequence('public.dp_ferias_movimentacoes', 'id'), coalesce((select max(id) from public.dp_ferias_movimentacoes), 1), true);
  perform setval(pg_get_serial_sequence('public.dp_pagamentos', 'id'), coalesce((select max(id) from public.dp_pagamentos), 1), true);
  perform set_config('app.restaurando_backup', 'false', true);
  return jsonb_build_object('sucesso', true);
end;
$$;

notify pgrst, 'reload schema';
commit;



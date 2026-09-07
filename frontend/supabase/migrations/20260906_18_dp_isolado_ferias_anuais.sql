-- Departamento Pessoal isolado: folha interna, períodos anuais de férias,
-- fracionamento, abono, terço e pagamentos parciais.
-- Executar uma única vez depois de 20260902_17_departamento_pessoal.sql.

begin;

-- Remove a ligação criada na primeira versão do módulo, preservando os dados.
create temporary table dp_contas_para_remover on commit drop as
select conta_pagar_id as id from public.dp_pagamentos;

alter table public.dp_pagamentos
  add column valor numeric(12,2),
  add column forma_pagamento text,
  add column data_vencimento date,
  add column data_pagamento date,
  add column status text;

update public.dp_pagamentos p
set valor = c.valor,
    forma_pagamento = c.forma_pagamento,
    data_vencimento = c.data_vencimento,
    data_pagamento = c.data_pagamento,
    status = c.status
from public.contas_pagar c
where c.id = p.conta_pagar_id;

alter table public.dp_pagamentos
  alter column valor set not null,
  alter column forma_pagamento set not null,
  alter column forma_pagamento set default 'PIX',
  alter column data_vencimento set not null,
  alter column status set not null,
  alter column status set default 'EM_ABERTO',
  add constraint dp_pagamentos_valor_check check (valor > 0 and valor::text <> 'NaN'),
  add constraint dp_pagamentos_forma_check check (forma_pagamento in ('PIX', 'DINHEIRO', 'TRANSFERENCIA', 'OUTRO')),
  add constraint dp_pagamentos_status_check check (status in ('EM_ABERTO', 'PAGO', 'CANCELADO')),
  add constraint dp_pagamentos_baixa_check check (
    (status = 'PAGO' and data_pagamento is not null)
    or (status <> 'PAGO' and data_pagamento is null)
  );

drop policy if exists dp_contas_restritas on public.contas_pagar;
drop trigger if exists dp_validar_conta on public.contas_pagar;
drop function if exists public.dp_validar_conta();
drop function if exists public.dp_conta_protegida(bigint);
alter table public.dp_pagamentos drop column conta_pagar_id cascade;
delete from public.contas_pagar where id in (select id from dp_contas_para_remover);

create table public.dp_periodos_ferias (
  id bigint generated always as identity primary key,
  funcionario_id bigint not null references public.dp_funcionarios(id) on delete restrict,
  periodo_aquisitivo_inicio date not null,
  periodo_aquisitivo_fim date not null,
  data_direito date not null,
  limite_concessao date not null,
  dias_direito smallint not null default 30 check (dias_direito between 0 and 30),
  created_at timestamptz not null default now(),
  unique (funcionario_id, periodo_aquisitivo_inicio),
  check (periodo_aquisitivo_fim >= periodo_aquisitivo_inicio),
  check (data_direito > periodo_aquisitivo_fim),
  check (limite_concessao >= data_direito)
);
create index dp_periodos_ferias_funcionario on public.dp_periodos_ferias(funcionario_id, data_direito);

alter table public.dp_ferias
  rename column valor to valor_ferias;
alter table public.dp_ferias
  add column periodo_id bigint references public.dp_periodos_ferias(id) on delete restrict,
  add column dias_gozo smallint,
  add column abono_dias smallint not null default 0,
  add column valor_terco numeric(12,2) not null default 0,
  add column valor_abono numeric(12,2) not null default 0,
  add column data_prevista_terco date,
  add column data_prevista_abono date;
update public.dp_ferias set dias_gozo = (fim - inicio + 1)::smallint;
alter table public.dp_ferias
  alter column dias_gozo set not null,
  drop constraint dp_ferias_status_check,
  add constraint dp_ferias_status_check check (status in ('EM_ABERTO', 'PARCIAL', 'PAGO', 'CANCELADO')),
  add constraint dp_ferias_dias_gozo_check check (dias_gozo between 1 and 30),
  add constraint dp_ferias_abono_dias_check check (abono_dias between 0 and 30),
  add constraint dp_ferias_valor_terco_check check (valor_terco >= 0 and valor_terco::text <> 'NaN'),
  add constraint dp_ferias_valor_abono_check check (valor_abono >= 0 and valor_abono::text <> 'NaN');

create table public.dp_ferias_pagamentos (
  id bigint generated always as identity primary key,
  ferias_id bigint not null references public.dp_ferias(id) on delete restrict,
  componente text not null check (componente in ('FERIAS', 'TERCO', 'ABONO')),
  valor numeric(12,2) not null check (valor > 0 and valor::text <> 'NaN'),
  data_pagamento date not null,
  forma_pagamento text not null check (forma_pagamento in ('PIX', 'DINHEIRO', 'TRANSFERENCIA', 'OUTRO')),
  observacoes text not null default '',
  idempotencia uuid not null unique,
  created_at timestamptz not null default now()
);
create index dp_ferias_pagamentos_ferias on public.dp_ferias_pagamentos(ferias_id, data_pagamento);

-- Transforma baixas antigas em histórico interno.
insert into public.dp_ferias_pagamentos
  (ferias_id, componente, valor, data_pagamento, forma_pagamento, observacoes, idempotencia)
select id, 'FERIAS', valor_ferias, data_pagamento, 'PIX', 'Pagamento migrado da versão anterior.',
       gen_random_uuid()
from public.dp_ferias
where status = 'PAGO' and data_pagamento is not null;

alter table public.dp_periodos_ferias enable row level security;
alter table public.dp_ferias_pagamentos enable row level security;
revoke all on public.dp_periodos_ferias, public.dp_ferias_pagamentos from anon, authenticated;
grant select on public.dp_periodos_ferias, public.dp_ferias_pagamentos to authenticated;
create policy dp_periodos_ferias_leitura on public.dp_periodos_ferias
  for select to authenticated using (public.dp_pode_acessar());
create policy dp_ferias_pagamentos_leitura on public.dp_ferias_pagamentos
  for select to authenticated using (public.dp_pode_acessar());

create or replace function public.dp_sincronizar_periodos_ferias()
returns integer language plpgsql security definer set search_path = public
as $$
declare
  f public.dp_funcionarios%rowtype;
  v_inicio date;
  v_direito date;
  v_total integer := 0;
begin
  if auth.uid() is not null and not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  for f in select * from public.dp_funcionarios where ativo order by id loop
    v_inicio := f.data_admissao;
    v_direito := (v_inicio + interval '1 year')::date;
    while v_direito <= (now() at time zone 'America/Sao_Paulo')::date loop
      insert into public.dp_periodos_ferias
        (funcionario_id, periodo_aquisitivo_inicio, periodo_aquisitivo_fim,
         data_direito, limite_concessao)
      values (f.id, v_inicio, v_direito - 1, v_direito,
              (v_direito + interval '1 year')::date - 1)
      on conflict (funcionario_id, periodo_aquisitivo_inicio) do nothing;
      if found then v_total := v_total + 1; end if;
      v_inicio := v_direito;
      v_direito := (v_inicio + interval '1 year')::date;
    end loop;
  end loop;
  return v_total;
end;
$$;

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
  perform pg_advisory_xact_lock(18092026, (p_competencia - date '2000-01-01'));
  for f in select * from public.dp_funcionarios
    where ativo and data_admissao <= least((p_competencia + interval '1 month')::date - 1,
      (now() at time zone 'America/Sao_Paulo')::date)
    order by id for update
  loop
    v_adiantamento := round(f.salario * 0.40, 2);
    foreach v_tipo in array array['ADIANTAMENTO', 'SALARIO'] loop
      if exists (select 1 from public.dp_pagamentos
        where funcionario_id = f.id and competencia = p_competencia and tipo = v_tipo) then continue; end if;
      v_valor := case when v_tipo = 'ADIANTAMENTO' then v_adiantamento else f.salario - v_adiantamento end;
      v_vencimento := case when v_tipo = 'ADIANTAMENTO' then p_competencia + 19
        else (p_competencia + interval '1 month')::date + 4 end;
      insert into public.dp_pagamentos
        (funcionario_id, competencia, tipo, nome_funcionario, funcao_funcionario,
         salario_base, valor, forma_pagamento, data_vencimento, status)
      values (f.id, p_competencia, v_tipo, f.nome, f.funcao, f.salario,
              v_valor, 'PIX', v_vencimento, 'EM_ABERTO');
      v_total := v_total + 1;
    end loop;
  end loop;
  return v_total;
end;
$$;

create or replace function public.dp_pagar_folha(
  p_pagamento_id bigint, p_data_pagamento date, p_forma_pagamento text
)
returns void language plpgsql security definer set search_path = public
as $$
declare p public.dp_pagamentos%rowtype;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  if p_data_pagamento is null or p_forma_pagamento not in ('PIX','DINHEIRO','TRANSFERENCIA','OUTRO') then
    raise exception 'Informe data e forma de pagamento válidas.';
  end if;
  select * into p from public.dp_pagamentos where id = p_pagamento_id for update;
  if not found then raise exception 'Pagamento não encontrado.'; end if;
  if p.status = 'CANCELADO' then raise exception 'Pagamento cancelado não pode ser pago.'; end if;
  if p.status = 'PAGO' then
    if p.data_pagamento <> p_data_pagamento or p.forma_pagamento <> p_forma_pagamento then
      raise exception 'Este pagamento já foi baixado com outros dados.';
    end if;
    return;
  end if;
  update public.dp_pagamentos set status='PAGO', data_pagamento=p_data_pagamento,
    forma_pagamento=p_forma_pagamento where id=p_pagamento_id;
end;
$$;

drop function if exists public.dp_programar_ferias(bigint,date,date,numeric,date,text,uuid);
create or replace function public.dp_programar_ferias_v2(
  p_periodo_id bigint, p_inicio date, p_fim date, p_abono_dias integer,
  p_valor_ferias numeric, p_valor_terco numeric, p_valor_abono numeric,
  p_data_ferias date, p_data_terco date, p_data_abono date,
  p_observacoes text, p_idempotencia uuid
)
returns bigint language plpgsql security definer set search_path = public
as $$
declare
  periodo public.dp_periodos_ferias%rowtype;
  f public.dp_funcionarios%rowtype;
  v_id bigint;
  v_dias integer;
  v_usados integer;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  if p_idempotencia is null then raise exception 'Solicitação inválida.'; end if;
  select id into v_id from public.dp_ferias where idempotencia=p_idempotencia;
  if found then return v_id; end if;
  select * into periodo from public.dp_periodos_ferias where id=p_periodo_id for update;
  if not found then raise exception 'Período aquisitivo não encontrado.'; end if;
  select * into f from public.dp_funcionarios where id=periodo.funcionario_id;
  if not f.ativo then raise exception 'Funcionário inativo.'; end if;
  if p_inicio is null or p_fim is null or p_fim < p_inicio then raise exception 'Período de férias inválido.'; end if;
  v_dias := p_fim - p_inicio + 1;
  if v_dias < 1 then raise exception 'A parte das férias deve ter pelo menos 1 dia.'; end if;
  if coalesce(p_abono_dias,0) < 0 or coalesce(p_abono_dias,0) > periodo.dias_direito then
    raise exception 'Os dias comprados não podem exceder o saldo do período.';
  end if;
  if p_valor_ferias is null or p_valor_ferias < 0 or p_valor_terco is null or p_valor_terco < 0
    or p_valor_abono is null or p_valor_abono < 0
    or p_valor_ferias::text='NaN' or p_valor_terco::text='NaN' or p_valor_abono::text='NaN'
    or p_valor_ferias + p_valor_terco + p_valor_abono <= 0 then
    raise exception 'Informe valores válidos para férias, terço e abono.';
  end if;
  if (p_valor_ferias > 0 and p_data_ferias is null) or (p_valor_terco > 0 and p_data_terco is null)
    or (p_valor_abono > 0 and p_data_abono is null) then
    raise exception 'Informe quando cada valor será pago.';
  end if;
  select coalesce(sum(dias_gozo + abono_dias),0)
    into v_usados from public.dp_ferias
    where periodo_id=periodo.id and status <> 'CANCELADO';
  if v_usados + v_dias + coalesce(p_abono_dias,0) > periodo.dias_direito then
    raise exception 'Dias de férias e abono excedem o saldo deste período.';
  end if;
  if exists (select 1 from public.dp_ferias d where d.funcionario_id=f.id and d.status <> 'CANCELADO'
    and d.inicio <= p_fim and d.fim >= p_inicio) then raise exception 'Já existem férias nessas datas.'; end if;
  insert into public.dp_ferias
    (funcionario_id, periodo_id, inicio, fim, dias_gozo, abono_dias,
     nome_funcionario, funcao_funcionario, valor_ferias, valor_terco, valor_abono,
     data_prevista_pagamento, data_prevista_terco, data_prevista_abono,
     status, data_pagamento, observacoes, idempotencia)
  values (f.id, periodo.id, p_inicio, p_fim, v_dias, coalesce(p_abono_dias,0),
    f.nome, f.funcao, p_valor_ferias, p_valor_terco, p_valor_abono,
    p_data_ferias, p_data_terco, p_data_abono, 'EM_ABERTO', null,
    coalesce(p_observacoes,''), p_idempotencia)
  returning id into v_id;
  return v_id;
end;
$$;

drop function if exists public.dp_pagar_ferias(bigint,date);
create or replace function public.dp_registrar_pagamento_ferias(
  p_ferias_id bigint, p_componente text, p_valor numeric, p_data_pagamento date,
  p_forma_pagamento text, p_observacoes text, p_idempotencia uuid
)
returns bigint language plpgsql security definer set search_path = public
as $$
declare
  f public.dp_ferias%rowtype;
  v_limite numeric(12,2);
  v_pago numeric(12,2);
  v_total_pago numeric(12,2);
  v_id bigint;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  select id into v_id from public.dp_ferias_pagamentos where idempotencia=p_idempotencia;
  if found then return v_id; end if;
  if p_componente not in ('FERIAS','TERCO','ABONO') or p_valor is null or p_valor <= 0
    or p_valor::text='NaN' or p_data_pagamento is null
    or p_forma_pagamento not in ('PIX','DINHEIRO','TRANSFERENCIA','OUTRO') then
    raise exception 'Informe componente, valor, data e forma de pagamento válidos.';
  end if;
  select * into f from public.dp_ferias where id=p_ferias_id for update;
  if not found then raise exception 'Férias não encontradas.'; end if;
  if f.status='CANCELADO' then raise exception 'Férias canceladas não podem receber pagamentos.'; end if;
  v_limite := case p_componente when 'FERIAS' then f.valor_ferias when 'TERCO' then f.valor_terco else f.valor_abono end;
  select coalesce(sum(valor),0) into v_pago from public.dp_ferias_pagamentos
    where ferias_id=f.id and componente=p_componente;
  if v_pago + p_valor > v_limite then raise exception 'O pagamento excede o saldo deste componente.'; end if;
  insert into public.dp_ferias_pagamentos
    (ferias_id,componente,valor,data_pagamento,forma_pagamento,observacoes,idempotencia)
  values (f.id,p_componente,p_valor,p_data_pagamento,p_forma_pagamento,
          coalesce(p_observacoes,''),p_idempotencia) returning id into v_id;
  select coalesce(sum(valor),0) into v_total_pago from public.dp_ferias_pagamentos where ferias_id=f.id;
  update public.dp_ferias set
    status=case when v_total_pago >= valor_ferias+valor_terco+valor_abono then 'PAGO' else 'PARCIAL' end,
    data_pagamento=case when v_total_pago >= valor_ferias+valor_terco+valor_abono then
      (select max(data_pagamento) from public.dp_ferias_pagamentos where ferias_id=f.id) else null end
  where id=f.id;
  return v_id;
end;
$$;

create or replace function public.dp_cancelar_ferias(p_ferias_id bigint)
returns void language plpgsql security definer set search_path = public
as $$
declare f public.dp_ferias%rowtype;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  select * into f from public.dp_ferias where id=p_ferias_id for update;
  if not found then raise exception 'Férias não encontradas.'; end if;
  if exists(select 1 from public.dp_ferias_pagamentos where ferias_id=f.id) then
    raise exception 'Férias com pagamentos não podem ser canceladas.';
  end if;
  update public.dp_ferias set status='CANCELADO',data_pagamento=null where id=f.id;
end;
$$;

revoke all on function public.dp_sincronizar_periodos_ferias() from public;
revoke all on function public.dp_gerar_folha(date) from public;
revoke all on function public.dp_pagar_folha(bigint,date,text) from public;
revoke all on function public.dp_programar_ferias_v2(bigint,date,date,integer,numeric,numeric,numeric,date,date,date,text,uuid) from public;
revoke all on function public.dp_registrar_pagamento_ferias(bigint,text,numeric,date,text,text,uuid) from public;
grant execute on function public.dp_sincronizar_periodos_ferias() to authenticated;
grant execute on function public.dp_gerar_folha(date) to authenticated;
grant execute on function public.dp_pagar_folha(bigint,date,text) to authenticated;
grant execute on function public.dp_programar_ferias_v2(bigint,date,date,integer,numeric,numeric,numeric,date,date,date,text,uuid) to authenticated;
grant execute on function public.dp_registrar_pagamento_ferias(bigint,text,numeric,date,text,text,uuid) to authenticated;

create or replace function public.dp_apos_cadastrar_funcionario()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if current_setting('app.restaurando_backup', true) = 'true' then
    return new;
  end if;
  perform public.dp_sincronizar_periodos_ferias();
  perform public.dp_gerar_folha(date_trunc('month', now() at time zone 'America/Sao_Paulo')::date);
  return new;
end;
$$;
revoke all on function public.dp_apos_cadastrar_funcionario() from public;
create trigger dp_apos_cadastrar_funcionario
after insert on public.dp_funcionarios for each row execute function public.dp_apos_cadastrar_funcionario();

-- Cria os períodos anuais já adquiridos e a folha atual dos cadastros existentes.
select public.dp_sincronizar_periodos_ferias();

-- Vincula férias criadas na versão anterior ao direito anual correspondente.
update public.dp_ferias as f
set periodo_id = (
  select p.id
  from public.dp_periodos_ferias as p
  where p.funcionario_id = f.funcionario_id
    and p.data_direito <= f.inicio
  order by p.data_direito desc
  limit 1
)
where f.periodo_id is null
  and exists (
    select 1
    from public.dp_periodos_ferias as p
    where p.funcionario_id = f.funcionario_id
      and p.data_direito <= f.inicio
  );

select public.dp_gerar_folha(date_trunc('month', now() at time zone 'America/Sao_Paulo')::date);

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

  if coalesce((p_backup ->> 'backupVersion')::integer, 0) <> 4 then
    raise exception 'Versão de backup não suportada.';
  end if;

  foreach tabela in array array[
    'fornecedores', 'produtos', 'lixeira', 'usuarios', 'vendas',
    'vendas_parcelas', 'vendas_recebimentos', 'contas_pagar', 'dp_funcionarios', 'dp_periodos_ferias', 'dp_ferias', 'dp_ferias_pagamentos', 'dp_pagamentos'
  ] loop
    if jsonb_typeof(p_backup -> tabela) is distinct from 'array' then
      raise exception 'A tabela % está ausente ou inválida no backup.', tabela;
    end if;
  end loop;

  perform set_config('app.restaurando_backup', 'true', true);

  truncate table
    public.dp_ferias_pagamentos, public.dp_pagamentos, public.dp_ferias, public.dp_periodos_ferias, public.dp_funcionarios, public.vendas_recebimentos, public.vendas_parcelas, public.vendas,
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
  perform setval(pg_get_serial_sequence('public.dp_pagamentos', 'id'), coalesce((select max(id) from public.dp_pagamentos), 1), true);
  perform set_config('app.restaurando_backup', 'false', true);
  return jsonb_build_object('sucesso', true);
end;
$$;

notify pgrst, 'reload schema';
commit;


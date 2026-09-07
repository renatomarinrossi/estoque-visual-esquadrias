-- Estoque Visual Esquadrias — Departamento Pessoal
-- ETAPA 1: salvar em frontend/supabase/migrations.
-- Executar somente junto da entrega completa do frontend e após backup.
-- Não modifica contas financeiras existentes nem gera pagamentos ao instalar.

begin;

create or replace function public.dp_pode_acessar()
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.usuarios
    where auth_user_id = auth.uid() and ativo is true
      and perfil in ('DESENVOLVEDOR', 'GERENCIAL')
  );
$$;
revoke all on function public.dp_pode_acessar() from public;
grant execute on function public.dp_pode_acessar() to authenticated;

create table public.dp_funcionarios (
  id bigint generated always as identity primary key,
  nome text not null check (length(trim(nome)) between 1 and 160),
  funcao text not null check (length(trim(funcao)) between 1 and 160),
  salario numeric(12,2) not null check (salario > 0 and salario::text <> 'NaN'),
  data_admissao date not null,
  data_aviso_ferias date,
  ativo boolean not null default true,
  observacoes text not null default '',
  created_at timestamptz not null default now()
);

create table public.dp_ferias (
  id bigint generated always as identity primary key,
  funcionario_id bigint not null references public.dp_funcionarios(id) on delete restrict,
  inicio date not null,
  fim date not null,
  nome_funcionario text not null,
  funcao_funcionario text not null,
  valor numeric(12,2) not null check (valor > 0 and valor::text <> 'NaN'),
  data_prevista_pagamento date not null,
  data_pagamento date,
  status text not null default 'EM_ABERTO' check (status in ('EM_ABERTO', 'PAGO', 'CANCELADO')),
  observacoes text not null default '',
  idempotencia uuid not null unique,
  created_at timestamptz not null default now(),
  constraint dp_ferias_periodo check (fim >= inicio),
  constraint dp_ferias_baixa check (
    (status = 'PAGO' and data_pagamento is not null)
    or (status <> 'PAGO' and data_pagamento is null)
  )
);

-- Para salários e adiantamentos, a situação e a baixa existem em contas_pagar.
-- Férias são independentes e nunca geram contas a pagar.
-- Salário, nome e função são fotografados na geração para preservar o histórico.
create table public.dp_pagamentos (
  id bigint generated always as identity primary key,
  funcionario_id bigint not null references public.dp_funcionarios(id) on delete restrict,
  conta_pagar_id bigint not null unique references public.contas_pagar(id) on delete restrict,
  competencia date not null check (extract(day from competencia) = 1),
  tipo text not null check (tipo in ('ADIANTAMENTO', 'SALARIO')),
  nome_funcionario text not null,
  funcao_funcionario text not null,
  salario_base numeric(12,2) not null check (salario_base > 0),
  created_at timestamptz not null default now()
);
create unique index dp_pagamentos_folha_unica
  on public.dp_pagamentos(funcionario_id, competencia, tipo)
  where tipo in ('ADIANTAMENTO', 'SALARIO');
create index dp_pagamentos_competencia on public.dp_pagamentos(competencia);
create index dp_ferias_funcionario_periodo on public.dp_ferias(funcionario_id, inicio, fim);

alter table public.dp_funcionarios enable row level security;
alter table public.dp_ferias enable row level security;
alter table public.dp_pagamentos enable row level security;

revoke all on public.dp_funcionarios, public.dp_ferias, public.dp_pagamentos from anon, authenticated;
grant select, insert, update on public.dp_funcionarios to authenticated;
grant select on public.dp_ferias, public.dp_pagamentos to authenticated;
grant usage, select on sequence public.dp_funcionarios_id_seq to authenticated;

create policy dp_funcionarios_leitura on public.dp_funcionarios
  for select to authenticated using (public.dp_pode_acessar());
create policy dp_funcionarios_cadastro on public.dp_funcionarios
  for insert to authenticated with check (public.dp_pode_acessar());
create policy dp_funcionarios_edicao on public.dp_funcionarios
  for update to authenticated using (public.dp_pode_acessar()) with check (public.dp_pode_acessar());
create policy dp_ferias_leitura on public.dp_ferias
  for select to authenticated using (public.dp_pode_acessar());
create policy dp_pagamentos_leitura on public.dp_pagamentos
  for select to authenticated using (public.dp_pode_acessar());

-- A política é restritiva: mantém a política financeira atual para outras contas.
create or replace function public.dp_conta_protegida(p_conta_id bigint)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.dp_pagamentos where conta_pagar_id = p_conta_id);
$$;
revoke all on function public.dp_conta_protegida(bigint) from public;
grant execute on function public.dp_conta_protegida(bigint) to authenticated;
create policy dp_contas_restritas on public.contas_pagar as restrictive
  for all to authenticated
  using (not public.dp_conta_protegida(id) or public.dp_pode_acessar())
  with check (not public.dp_conta_protegida(id) or public.dp_pode_acessar());

-- Geração mensal explícita, atômica e repetível sem duplicar lançamentos.
-- Dia 20 pertence à competência; dia 5 pertence ao mês seguinte.
-- Usa salário integral cadastrado; não calcula descontos ou proporcionalidade.
create or replace function public.dp_gerar_folha(p_competencia date)
returns integer language plpgsql security definer set search_path = public
as $$
declare
  f public.dp_funcionarios%rowtype;
  v_tipo text;
  v_conta bigint;
  v_valor numeric(12,2);
  v_adiantamento numeric(12,2);
  v_vencimento date;
  v_total integer := 0;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  if p_competencia is null or extract(day from p_competencia) <> 1 then
    raise exception 'Informe o primeiro dia do mês de competência.';
  end if;
  perform pg_advisory_xact_lock(17092026, (p_competencia - date '2000-01-01'));
  for f in select * from public.dp_funcionarios
    where ativo and data_admissao < (p_competencia + interval '1 month')::date
    order by id for update
  loop
    v_adiantamento := round(f.salario * 0.40, 2);
    foreach v_tipo in array array['ADIANTAMENTO', 'SALARIO'] loop
      if exists (select 1 from public.dp_pagamentos
        where funcionario_id = f.id and competencia = p_competencia and tipo = v_tipo) then
        continue;
      end if;
      v_valor := case when v_tipo = 'ADIANTAMENTO' then v_adiantamento else f.salario - v_adiantamento end;
      v_vencimento := case when v_tipo = 'ADIANTAMENTO' then p_competencia + 19
        else (p_competencia + interval '1 month')::date + 4 end;
      insert into public.contas_pagar
        (data_lancamento, favorecido, descricao, valor, forma_pagamento,
         data_vencimento, status, observacoes)
      values
        ((now() at time zone 'America/Sao_Paulo')::date, f.nome,
         case when v_tipo = 'ADIANTAMENTO' then 'Adiantamento salarial 40%' else 'Saldo salarial 60%' end
           || ' — competência ' || to_char(p_competencia, 'MM/YYYY'),
         v_valor, 'PIX', v_vencimento, 'EM_ABERTO', 'Gerado pelo Departamento Pessoal.')
      returning id into v_conta;
      insert into public.dp_pagamentos
        (funcionario_id, conta_pagar_id, competencia, tipo, nome_funcionario, funcao_funcionario, salario_base)
      values (f.id, v_conta, p_competencia, v_tipo, f.nome, f.funcao, f.salario);
      v_total := v_total + 1;
    end loop;
  end loop;
  return v_total;
end;
$$;

-- Valor de férias e vencimento são informados pelo responsável.
-- O bloqueio do funcionário impede programações concorrentes sobrepostas.
create or replace function public.dp_programar_ferias(
  p_funcionario_id bigint, p_inicio date, p_fim date, p_valor numeric,
  p_vencimento date, p_observacoes text, p_idempotencia uuid
)
returns bigint language plpgsql security definer set search_path = public
as $$
declare
  f public.dp_funcionarios%rowtype;
  v_ferias bigint;
  v_anterior public.dp_ferias%rowtype;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  if p_inicio is null or p_fim is null or p_fim < p_inicio then
    raise exception 'Informe um período de férias válido.';
  end if;
  if p_valor is null or p_valor <= 0 or p_valor <> round(p_valor, 2)
    or p_valor >= 10000000000 or p_valor::text in ('NaN', 'Infinity', '-Infinity')
    or p_vencimento is null or p_idempotencia is null then
    raise exception 'Informe valor positivo com até duas casas decimais e vencimento.';
  end if;
  select * into f from public.dp_funcionarios where id = p_funcionario_id for update;
  if not found then raise exception 'Funcionário não encontrado.'; end if;
  select * into v_anterior from public.dp_ferias where idempotencia = p_idempotencia;
  if found then
    if v_anterior.funcionario_id <> p_funcionario_id or v_anterior.inicio <> p_inicio
      or v_anterior.fim <> p_fim or v_anterior.observacoes <> coalesce(p_observacoes, '')
      or v_anterior.valor <> p_valor or v_anterior.data_prevista_pagamento <> p_vencimento then
      raise exception 'Esta solicitação já foi usada para outra programação.';
    end if;
    return v_anterior.id;
  end if;
  if not f.ativo then raise exception 'Funcionário inativo.'; end if;
  if p_inicio < f.data_admissao then raise exception 'As férias não podem preceder a admissão.'; end if;
  if exists (
    select 1 from public.dp_ferias d
    where d.funcionario_id = f.id and d.status <> 'CANCELADO'
      and d.inicio <= p_fim and d.fim >= p_inicio
  ) then raise exception 'Já existem férias nesse período para o funcionário.'; end if;
  insert into public.dp_ferias
    (funcionario_id, inicio, fim, nome_funcionario, funcao_funcionario,
     valor, data_prevista_pagamento, observacoes, idempotencia)
    values (f.id, p_inicio, p_fim, f.nome, f.funcao, p_valor, p_vencimento,
      coalesce(p_observacoes, ''), p_idempotencia)
    returning id into v_ferias;
  return v_ferias;
end;
$$;

-- Baixa exclusiva do DP, sem inserir ou atualizar contas_pagar.
create or replace function public.dp_pagar_ferias(p_ferias_id bigint, p_data_pagamento date)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_ferias public.dp_ferias%rowtype;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  if p_data_pagamento is null then raise exception 'Informe a data do pagamento.'; end if;
  select * into v_ferias from public.dp_ferias where id = p_ferias_id for update;
  if not found then raise exception 'Férias não encontradas.'; end if;
  if v_ferias.status = 'CANCELADO' then raise exception 'Férias canceladas não podem ser pagas.'; end if;
  if v_ferias.status = 'PAGO' then
    if v_ferias.data_pagamento <> p_data_pagamento then
      raise exception 'O pagamento destas férias já foi registrado em outra data.';
    end if;
    return;
  end if;
  update public.dp_ferias set status = 'PAGO', data_pagamento = p_data_pagamento where id = p_ferias_id;
end;
$$;

create or replace function public.dp_cancelar_ferias(p_ferias_id bigint)
returns void language plpgsql security definer set search_path = public
as $$
declare
  v_ferias public.dp_ferias%rowtype;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  select * into v_ferias from public.dp_ferias where id = p_ferias_id for update;
  if not found then raise exception 'Férias não encontradas.'; end if;
  if v_ferias.status = 'PAGO' then raise exception 'Férias pagas não podem ser canceladas.'; end if;
  update public.dp_ferias set status = 'CANCELADO' where id = p_ferias_id;
end;
$$;

-- A edição genérica de contas não pode alterar os valores históricos da folha.
-- A baixa pode ser feita em qualquer uma das duas telas, na mesma conta.
create or replace function public.dp_validar_conta()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not public.dp_conta_protegida(old.id) then return new; end if;
  if new.id is distinct from old.id or new.valor is distinct from old.valor
    or new.data_vencimento is distinct from old.data_vencimento
    or new.favorecido is distinct from old.favorecido
    or new.descricao is distinct from old.descricao then
    raise exception 'Conta vinculada ao Departamento Pessoal: nome, descrição, valor e vencimento são preservados.';
  end if;
  if new.status not in ('EM_ABERTO', 'PAGO', 'CANCELADO') or new.status is null then
    raise exception 'Status de pagamento inválido.';
  end if;
  if (new.status = 'PAGO' and new.data_pagamento is null)
    or (new.status <> 'PAGO' and new.data_pagamento is not null) then
    raise exception 'A data de pagamento deve existir somente em contas pagas.';
  end if;
  if old.status = 'PAGO' and (new.status is distinct from old.status
    or new.data_pagamento is distinct from old.data_pagamento) then
    raise exception 'Um pagamento confirmado não pode ser alterado pela edição de contas.';
  end if;
  if old.status = 'CANCELADO' and new.status <> 'CANCELADO' then
    raise exception 'Pagamento cancelado não pode ser reaberto.';
  end if;
  return new;
end;
$$;
create trigger dp_validar_conta before update on public.contas_pagar
  for each row execute function public.dp_validar_conta();

revoke all on function public.dp_validar_conta() from public;
revoke all on function public.dp_gerar_folha(date) from public;
revoke all on function public.dp_programar_ferias(bigint,date,date,numeric,date,text,uuid) from public;
grant execute on function public.dp_gerar_folha(date) to authenticated;
grant execute on function public.dp_programar_ferias(bigint,date,date,numeric,date,text,uuid) to authenticated;
revoke all on function public.dp_pagar_ferias(bigint,date) from public;
revoke all on function public.dp_cancelar_ferias(bigint) from public;
grant execute on function public.dp_pagar_ferias(bigint,date) to authenticated;
grant execute on function public.dp_cancelar_ferias(bigint) to authenticated;

-- Restauração completa: exige backup v3 contendo as três novas coleções.
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

  if coalesce((p_backup ->> 'backupVersion')::integer, 0) < 3 then
    raise exception 'Versão de backup não suportada.';
  end if;

  foreach tabela in array array[
    'fornecedores', 'produtos', 'lixeira', 'usuarios', 'vendas',
    'vendas_parcelas', 'vendas_recebimentos', 'contas_pagar', 'dp_funcionarios', 'dp_ferias', 'dp_pagamentos'
  ] loop
    if jsonb_typeof(p_backup -> tabela) is distinct from 'array' then
      raise exception 'A tabela % está ausente ou inválida no backup.', tabela;
    end if;
  end loop;

  truncate table
    public.dp_pagamentos, public.dp_ferias, public.dp_funcionarios, public.vendas_recebimentos, public.vendas_parcelas, public.vendas,
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
  insert into public.dp_ferias overriding system value
  select * from jsonb_populate_recordset(null::public.dp_ferias, p_backup -> 'dp_ferias');
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
  perform setval(pg_get_serial_sequence('public.dp_ferias', 'id'), coalesce((select max(id) from public.dp_ferias), 1), true);
  perform setval(pg_get_serial_sequence('public.dp_pagamentos', 'id'), coalesce((select max(id) from public.dp_pagamentos), 1), true);
  return jsonb_build_object('sucesso', true);
end;
$$;


notify pgrst, 'reload schema';
commit;

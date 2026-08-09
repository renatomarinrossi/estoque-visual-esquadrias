-- Estoque Visual Esquadrias
-- Operações atômicas para recebimentos e lixeira de produtos.
-- Execute uma única vez no SQL Editor do Supabase.

create or replace function public.recalcular_status_financeiro(
  p_parcela_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venda_id bigint;
  v_valor_parcela numeric;
  v_total_recebido numeric;
  v_status_parcela text;
  v_total_parcelas integer;
  v_todas_recebidas boolean;
begin
  select parcela.venda_id, parcela.valor
    into v_venda_id, v_valor_parcela
    from public.vendas_parcelas as parcela
   where parcela.id = p_parcela_id
   for update;

  if not found then
    raise exception 'Parcela não encontrada.';
  end if;

  select coalesce(sum(recebimento.valor), 0)
    into v_total_recebido
    from public.vendas_recebimentos as recebimento
   where recebimento.parcela_id = p_parcela_id;

  v_status_parcela := case
    when v_total_recebido <= 0 then 'A_RECEBER'
    when v_total_recebido < v_valor_parcela then 'PARCIALMENTE_RECEBIDO'
    else 'RECEBIDO'
  end;

  update public.vendas_parcelas
     set status = v_status_parcela
   where id = p_parcela_id;

  select count(*), coalesce(bool_and(status = 'RECEBIDO'), false)
    into v_total_parcelas, v_todas_recebidas
    from public.vendas_parcelas
   where venda_id = v_venda_id;

  update public.vendas
     set status = case
       when v_total_parcelas > 0 and v_todas_recebidas then 'RECEBIDO'
       else 'A_RECEBER'
     end
   where id = v_venda_id;
end;
$$;

create or replace function public.registrar_recebimento(
  p_parcela_id bigint,
  p_data_recebimento date,
  p_valor numeric,
  p_observacao text default null
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_valor_parcela numeric;
  v_total_recebido numeric;
  v_recebimento_id bigint;
begin
  if not public.usuario_ativo() then
    raise exception 'Usuário não autorizado.';
  end if;

  if p_data_recebimento is null or p_valor is null or p_valor <= 0 then
    raise exception 'Informe uma data e um valor de recebimento maior que zero.';
  end if;

  select parcela.valor
    into v_valor_parcela
    from public.vendas_parcelas as parcela
   where parcela.id = p_parcela_id
   for update;

  if not found then
    raise exception 'Parcela não encontrada.';
  end if;

  select coalesce(sum(recebimento.valor), 0)
    into v_total_recebido
    from public.vendas_recebimentos as recebimento
   where recebimento.parcela_id = p_parcela_id;

  if v_total_recebido + p_valor > v_valor_parcela then
    raise exception 'O recebimento não pode ultrapassar o saldo da parcela.';
  end if;

  insert into public.vendas_recebimentos (
    parcela_id,
    data_recebimento,
    valor,
    observacao
  )
  values (
    p_parcela_id,
    p_data_recebimento,
    p_valor,
    nullif(trim(coalesce(p_observacao, '')), '')
  )
  returning id into v_recebimento_id;

  perform public.recalcular_status_financeiro(p_parcela_id);

  return v_recebimento_id;
end;
$$;

create or replace function public.alterar_recebimento(
  p_recebimento_id bigint,
  p_data_recebimento date,
  p_valor numeric,
  p_observacao text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parcela_id bigint;
  v_valor_parcela numeric;
  v_total_outros_recebimentos numeric;
begin
  if not public.usuario_ativo() then
    raise exception 'Usuário não autorizado.';
  end if;

  if p_data_recebimento is null or p_valor is null or p_valor <= 0 then
    raise exception 'Informe uma data e um valor de recebimento maior que zero.';
  end if;

  select recebimento.parcela_id
    into v_parcela_id
    from public.vendas_recebimentos as recebimento
   where recebimento.id = p_recebimento_id
   for update;

  if not found then
    raise exception 'Recebimento não encontrado.';
  end if;

  select parcela.valor
    into v_valor_parcela
    from public.vendas_parcelas as parcela
   where parcela.id = v_parcela_id
   for update;

  select coalesce(sum(recebimento.valor), 0)
    into v_total_outros_recebimentos
    from public.vendas_recebimentos as recebimento
   where recebimento.parcela_id = v_parcela_id
     and recebimento.id <> p_recebimento_id;

  if v_total_outros_recebimentos + p_valor > v_valor_parcela then
    raise exception 'O recebimento não pode ultrapassar o saldo da parcela.';
  end if;

  update public.vendas_recebimentos
     set data_recebimento = p_data_recebimento,
         valor = p_valor,
         observacao = nullif(trim(coalesce(p_observacao, '')), '')
   where id = p_recebimento_id;

  perform public.recalcular_status_financeiro(v_parcela_id);
end;
$$;

create or replace function public.excluir_recebimento(
  p_recebimento_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_parcela_id bigint;
begin
  if not public.usuario_ativo() then
    raise exception 'Usuário não autorizado.';
  end if;

  select recebimento.parcela_id
    into v_parcela_id
    from public.vendas_recebimentos as recebimento
   where recebimento.id = p_recebimento_id
   for update;

  if not found then
    raise exception 'Recebimento não encontrado.';
  end if;

  perform 1
    from public.vendas_parcelas as parcela
   where parcela.id = v_parcela_id
   for update;

  delete from public.vendas_recebimentos
   where id = p_recebimento_id;

  perform public.recalcular_status_financeiro(v_parcela_id);
end;
$$;

create or replace function public.mover_produto_para_lixeira(
  p_produto_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_produto public.produtos%rowtype;
begin
  if not public.usuario_ativo() then
    raise exception 'Usuário não autorizado.';
  end if;

  select *
    into v_produto
    from public.produtos
   where id = p_produto_id
   for update;

  if not found then
    raise exception 'Produto não encontrado.';
  end if;

  insert into public.lixeira (
    produto_id,
    codigo,
    descricao,
    categoria,
    unidade,
    quantidade,
    estoque_minimo,
    preco_compra,
    observacao,
    fornecedor_id,
    ultima_entrada,
    data_exclusao
  )
  values (
    v_produto.id,
    v_produto.codigo,
    v_produto.descricao,
    v_produto.categoria,
    v_produto.unidade,
    v_produto.quantidade,
    v_produto.estoque_minimo,
    v_produto.preco_compra,
    v_produto.observacao,
    v_produto.fornecedor_id,
    v_produto.ultima_entrada,
    now()
  );

  delete from public.produtos
   where id = v_produto.id;
end;
$$;

create or replace function public.restaurar_produto_da_lixeira(
  p_lixeira_id bigint
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lixeira public.lixeira%rowtype;
begin
  if not public.usuario_ativo() then
    raise exception 'Usuário não autorizado.';
  end if;

  select *
    into v_lixeira
    from public.lixeira
   where id = p_lixeira_id
   for update;

  if not found then
    raise exception 'Produto não encontrado na lixeira.';
  end if;

  if exists (select 1 from public.produtos where id = v_lixeira.produto_id) then
    raise exception 'Já existe um produto ativo com o mesmo identificador.';
  end if;

  insert into public.produtos (
    id,
    codigo,
    descricao,
    categoria,
    unidade,
    quantidade,
    estoque_minimo,
    preco_compra,
    observacao,
    fornecedor_id,
    ultima_entrada
  )
  values (
    v_lixeira.produto_id,
    v_lixeira.codigo,
    v_lixeira.descricao,
    v_lixeira.categoria,
    v_lixeira.unidade,
    v_lixeira.quantidade,
    v_lixeira.estoque_minimo,
    v_lixeira.preco_compra,
    v_lixeira.observacao,
    v_lixeira.fornecedor_id,
    v_lixeira.ultima_entrada
  );

  delete from public.lixeira
   where id = v_lixeira.id;

  perform public.reset_produtos_sequence();
end;
$$;

revoke all on function public.recalcular_status_financeiro(bigint) from public;
revoke all on function public.registrar_recebimento(bigint, date, numeric, text) from public;
revoke all on function public.alterar_recebimento(bigint, date, numeric, text) from public;
revoke all on function public.excluir_recebimento(bigint) from public;
revoke all on function public.mover_produto_para_lixeira(bigint) from public;
revoke all on function public.restaurar_produto_da_lixeira(bigint) from public;

grant execute on function public.registrar_recebimento(bigint, date, numeric, text) to authenticated;
grant execute on function public.alterar_recebimento(bigint, date, numeric, text) to authenticated;
grant execute on function public.excluir_recebimento(bigint) to authenticated;
grant execute on function public.mover_produto_para_lixeira(bigint) to authenticated;
grant execute on function public.restaurar_produto_da_lixeira(bigint) to authenticated;

notify pgrst, 'reload schema';


-- Estoque Visual Esquadrias
-- Correção da lixeira para produtos que possuem movimentações de estoque.
-- Execute uma única vez no SQL Editor do Supabase.

-- O produto permanece no banco para que o histórico de movimentações continue
-- íntegro. A aplicação deixa de exibi-lo enquanto estiver na lixeira.
alter table public.produtos
  add column if not exists excluido_em timestamptz null;

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
     and excluido_em is null
   for update;

  if not found then
    raise exception 'Produto não encontrado ou já está na lixeira.';
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

  update public.produtos
     set excluido_em = now()
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

  -- Produtos recém-enviados à lixeira continuam no banco, apenas marcados.
  if exists (select 1 from public.produtos where id = v_lixeira.produto_id) then
    update public.produtos
       set excluido_em = null
     where id = v_lixeira.produto_id;
  else
    -- Compatibilidade com produtos enviados à lixeira antes desta correção.
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
      ultima_entrada,
      excluido_em
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
      v_lixeira.ultima_entrada,
      null
    );

    perform public.reset_produtos_sequence();
  end if;

  delete from public.lixeira
   where id = v_lixeira.id;
end;
$$;

revoke all on function public.mover_produto_para_lixeira(bigint) from public;
revoke all on function public.restaurar_produto_da_lixeira(bigint) from public;
grant execute on function public.mover_produto_para_lixeira(bigint) to authenticated;
grant execute on function public.restaurar_produto_da_lixeira(bigint) to authenticated;

notify pgrst, 'reload schema';


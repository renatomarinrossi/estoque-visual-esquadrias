-- Estoque Visual Esquadrias
-- Salva uma venda e todas as suas parcelas em uma única transação.
-- Execute uma única vez no SQL Editor do Supabase.

create or replace function public.salvar_venda_com_parcelas(
  p_venda_id bigint,
  p_data_venda date,
  p_cliente text,
  p_valor_total numeric,
  p_responsavel text,
  p_observacoes text,
  p_parcelas jsonb
)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  v_venda_id bigint;
  v_parcela jsonb;
  v_parcela_id bigint;
  v_ids_mantidos bigint[] := array[]::bigint[];
  v_numero_parcela integer;
  v_total_parcelas integer;
  v_valor_parcela numeric;
  v_data_vencimento date;
  v_forma_pagamento text;
  v_descricao_entrega text;
  v_condicionado boolean;
  v_soma_parcelas numeric := 0;
  v_total_recebido numeric;
  v_status_venda text;
begin
  if not public.usuario_ativo() then
    raise exception 'Usuário não autorizado.';
  end if;

  if p_data_venda is null then
    raise exception 'Informe a data da venda.';
  end if;

  if nullif(trim(coalesce(p_cliente, '')), '') is null then
    raise exception 'Informe o cliente.';
  end if;

  if p_valor_total is null or p_valor_total <= 0 then
    raise exception 'Informe um valor total maior que zero.';
  end if;

  if jsonb_typeof(p_parcelas) <> 'array' or jsonb_array_length(p_parcelas) = 0 then
    raise exception 'Cadastre ao menos uma parcela para a venda.';
  end if;

  if p_venda_id is null then
    insert into public.vendas (
      data_venda,
      cliente,
      valor_total,
      responsavel,
      status,
      observacoes
    )
    values (
      p_data_venda,
      trim(p_cliente),
      p_valor_total,
      trim(coalesce(p_responsavel, '')),
      'A_RECEBER',
      trim(coalesce(p_observacoes, ''))
    )
    returning id into v_venda_id;
  else
    select id
      into v_venda_id
      from public.vendas
     where id = p_venda_id
     for update;

    if not found then
      raise exception 'Venda não encontrada.';
    end if;

    update public.vendas
       set data_venda = p_data_venda,
           cliente = trim(p_cliente),
           valor_total = p_valor_total,
           responsavel = trim(coalesce(p_responsavel, '')),
           observacoes = trim(coalesce(p_observacoes, ''))
     where id = v_venda_id;

    -- Bloqueia as parcelas atuais durante esta edição para evitar concorrência.
    perform 1
      from public.vendas_parcelas
     where venda_id = v_venda_id
     for update;
  end if;

  for v_parcela in
    select value
      from jsonb_array_elements(p_parcelas)
  loop
    v_numero_parcela := coalesce(nullif(v_parcela ->> 'numero_parcela', '')::integer, 0);
    v_total_parcelas := coalesce(nullif(v_parcela ->> 'total_parcelas', '')::integer, 0);
    v_valor_parcela := coalesce(nullif(v_parcela ->> 'valor', '')::numeric, 0);
    v_forma_pagamento := nullif(trim(coalesce(v_parcela ->> 'forma_pagamento', '')), '');
    v_condicionado := v_forma_pagamento = 'CONDICIONADO_ENTREGA';
    v_descricao_entrega := case
      when v_condicionado then trim(coalesce(v_parcela ->> 'descricao_entrega', ''))
      else ''
    end;

    if v_numero_parcela <= 0 or v_total_parcelas <= 0 then
      raise exception 'A numeração das parcelas é inválida.';
    end if;

    if v_valor_parcela <= 0 then
      raise exception 'Informe um valor maior que zero para todas as parcelas.';
    end if;

    if v_forma_pagamento is null then
      raise exception 'Informe a forma de pagamento de todas as parcelas.';
    end if;

    begin
      v_data_vencimento := nullif(v_parcela ->> 'data_vencimento', '')::date;
    exception
      when invalid_text_representation or datetime_field_overflow then
        raise exception 'Informe um vencimento válido para as parcelas.';
    end;

    if not v_condicionado and v_data_vencimento is null then
      raise exception 'Informe o vencimento das parcelas que não são condicionadas à entrega.';
    end if;

    v_soma_parcelas := v_soma_parcelas + v_valor_parcela;
    v_parcela_id := nullif(v_parcela ->> 'id', '')::bigint;

    if v_parcela_id is null then
      insert into public.vendas_parcelas (
        venda_id,
        numero_parcela,
        total_parcelas,
        valor,
        data_vencimento,
        forma_pagamento,
        status,
        condicionado_entrega,
        descricao_entrega
      )
      values (
        v_venda_id,
        v_numero_parcela,
        v_total_parcelas,
        v_valor_parcela,
        v_data_vencimento,
        v_forma_pagamento,
        'A_RECEBER',
        v_condicionado,
        v_descricao_entrega
      )
      returning id into v_parcela_id;
    else
      select coalesce(sum(recebimento.valor), 0)
        into v_total_recebido
        from public.vendas_recebimentos as recebimento
       where recebimento.parcela_id = v_parcela_id;

      if v_valor_parcela < v_total_recebido then
        raise exception 'O valor de uma parcela não pode ser menor que o total já recebido (%).', v_total_recebido;
      end if;

      update public.vendas_parcelas
         set numero_parcela = v_numero_parcela,
             total_parcelas = v_total_parcelas,
             valor = v_valor_parcela,
             data_vencimento = v_data_vencimento,
             forma_pagamento = v_forma_pagamento,
             condicionado_entrega = v_condicionado,
             descricao_entrega = v_descricao_entrega
       where id = v_parcela_id
         and venda_id = v_venda_id;

      if not found then
        raise exception 'Uma das parcelas não pertence a esta venda.';
      end if;

      perform public.recalcular_status_financeiro(v_parcela_id);
    end if;

    v_ids_mantidos := array_append(v_ids_mantidos, v_parcela_id);
  end loop;

  if abs(v_soma_parcelas - p_valor_total) > 0.01 then
    raise exception 'O total das parcelas deve ser igual ao valor da venda.';
  end if;

  -- O trigger já impede excluir parcela que possui recebimentos.
  delete from public.vendas_parcelas
   where venda_id = v_venda_id
     and not (id = any(v_ids_mantidos));

  select case
    when count(*) > 0 and bool_and(status = 'RECEBIDO') then 'RECEBIDO'
    else 'A_RECEBER'
  end
    into v_status_venda
    from public.vendas_parcelas
   where venda_id = v_venda_id;

  update public.vendas
     set status = v_status_venda
   where id = v_venda_id;

  return v_venda_id;
end;
$$;

revoke all on function public.salvar_venda_com_parcelas(
  bigint, date, text, numeric, text, text, jsonb
) from public;

grant execute on function public.salvar_venda_com_parcelas(
  bigint, date, text, numeric, text, text, jsonb
) to authenticated;

notify pgrst, 'reload schema';


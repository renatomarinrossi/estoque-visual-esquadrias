-- Estoque Visual Esquadrias
-- Auditoria automática das operações financeiras.
-- Execute uma única vez no SQL Editor do Supabase.

create table if not exists public.logs_financeiros (
  id bigint generated always as identity primary key,
  created_at timestamptz not null default now(),
  usuario_id bigint references public.usuarios(id) on delete set null,
  modulo text not null,
  acao text not null,
  entidade text not null,
  entidade_id bigint,
  descricao text not null,
  detalhes jsonb not null default '{}'::jsonb
);

create index if not exists logs_financeiros_created_at_idx
  on public.logs_financeiros (created_at desc);

create index if not exists logs_financeiros_modulo_created_at_idx
  on public.logs_financeiros (modulo, created_at desc);

alter table public.logs_financeiros enable row level security;

drop policy if exists logs_financeiros_desenvolvedor_consulta
  on public.logs_financeiros;

create policy logs_financeiros_desenvolvedor_consulta
  on public.logs_financeiros
  for select
  to authenticated
  using (public.eh_desenvolvedor());

create or replace function public.registrar_log_financeiro(
  p_modulo text,
  p_acao text,
  p_entidade text,
  p_entidade_id bigint,
  p_descricao text,
  p_detalhes jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_usuario_id bigint;
begin
  select id
    into v_usuario_id
    from public.usuarios
   where auth_user_id = auth.uid();

  insert into public.logs_financeiros (
    usuario_id,
    modulo,
    acao,
    entidade,
    entidade_id,
    descricao,
    detalhes
  ) values (
    v_usuario_id,
    p_modulo,
    p_acao,
    p_entidade,
    p_entidade_id,
    p_descricao,
    coalesce(p_detalhes, '{}'::jsonb)
  );
end;
$$;

create or replace function public.auditar_operacao_financeira()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_linha jsonb;
  v_detalhes jsonb;
  v_id bigint;
  v_venda_id bigint;
  v_cliente text;
  v_modulo text;
  v_acao text;
  v_entidade text;
  v_descricao text;
begin
  if tg_op = 'DELETE' then
    v_linha := to_jsonb(old);
    v_detalhes := jsonb_build_object('antes', to_jsonb(old));
  elsif tg_op = 'INSERT' then
    v_linha := to_jsonb(new);
    v_detalhes := jsonb_build_object('depois', to_jsonb(new));
  else
    v_linha := to_jsonb(new);
    v_detalhes := jsonb_build_object('antes', to_jsonb(old), 'depois', to_jsonb(new));
  end if;

  v_id := nullif(v_linha ->> 'id', '')::bigint;

  if tg_table_name = 'vendas' then
    v_modulo := 'VENDAS';
    v_entidade := 'VENDA';
    v_cliente := coalesce(v_linha ->> 'cliente', '-');

    if tg_op = 'INSERT' then
      v_acao := 'CRIADA';
      v_descricao := format('Venda #%s criada para %s.', v_id, v_cliente);
    elsif tg_op = 'DELETE' then
      v_acao := 'EXCLUÍDA';
      v_descricao := format('Venda #%s de %s excluída.', v_id, v_cliente);
    elsif coalesce((to_jsonb(old) ->> 'arquivada')::boolean, false) is false
      and coalesce((to_jsonb(new) ->> 'arquivada')::boolean, false) is true then
      v_acao := 'ARQUIVADA';
      v_descricao := format('Obra da venda #%s de %s finalizada.', v_id, v_cliente);
    elsif coalesce((to_jsonb(old) ->> 'arquivada')::boolean, false) is true
      and coalesce((to_jsonb(new) ->> 'arquivada')::boolean, false) is false then
      v_acao := 'RESTAURADA';
      v_descricao := format('Obra da venda #%s de %s restaurada para vendas.', v_id, v_cliente);
    elsif old.status is distinct from new.status then
      v_acao := 'STATUS_ATUALIZADO';
      v_descricao := format('Status da venda #%s de %s alterado para %s.', v_id, v_cliente, replace(new.status, '_', ' '));
    else
      v_acao := 'ALTERADA';
      v_descricao := format('Venda #%s de %s alterada.', v_id, v_cliente);
    end if;

  elsif tg_table_name = 'vendas_parcelas' then
    v_modulo := 'VENDAS';
    v_entidade := 'PARCELA';
    v_venda_id := nullif(v_linha ->> 'venda_id', '')::bigint;
    select cliente into v_cliente from public.vendas where id = v_venda_id;
    v_cliente := coalesce(v_cliente, '-');

    if tg_op = 'INSERT' then
      v_acao := 'CRIADA';
      v_descricao := format('Parcela %s/%s criada na venda #%s de %s.', v_linha ->> 'numero_parcela', v_linha ->> 'total_parcelas', v_venda_id, v_cliente);
    elsif tg_op = 'DELETE' then
      v_acao := 'EXCLUÍDA';
      v_descricao := format('Parcela %s/%s da venda #%s excluída.', v_linha ->> 'numero_parcela', v_linha ->> 'total_parcelas', v_venda_id);
    elsif old.status is distinct from new.status then
      v_acao := 'STATUS_ATUALIZADO';
      v_descricao := format('Status da parcela %s/%s da venda #%s alterado para %s.', new.numero_parcela, new.total_parcelas, v_venda_id, replace(new.status, '_', ' '));
    else
      v_acao := 'ALTERADA';
      v_descricao := format('Parcela %s/%s da venda #%s alterada.', v_linha ->> 'numero_parcela', v_linha ->> 'total_parcelas', v_venda_id);
    end if;

  elsif tg_table_name = 'vendas_recebimentos' then
    v_modulo := 'RECEBIMENTOS';
    v_entidade := 'RECEBIMENTO';
    select venda_id into v_venda_id from public.vendas_parcelas where id = nullif(v_linha ->> 'parcela_id', '')::bigint;
    select cliente into v_cliente from public.vendas where id = v_venda_id;
    v_cliente := coalesce(v_cliente, '-');

    if tg_op = 'INSERT' then
      v_acao := 'REGISTRADO';
      v_descricao := format('Recebimento de R$ %s registrado para %s.', v_linha ->> 'valor', v_cliente);
    elsif tg_op = 'DELETE' then
      v_acao := 'EXCLUÍDO';
      v_descricao := format('Recebimento de R$ %s excluído.', v_linha ->> 'valor');
    else
      v_acao := 'ALTERADO';
      v_descricao := format('Recebimento de %s alterado.', v_cliente);
    end if;

  elsif tg_table_name = 'contas_pagar' then
    v_modulo := 'CONTAS_A_PAGAR';
    v_entidade := 'CONTA_A_PAGAR';

    if tg_op = 'INSERT' then
      v_acao := 'CRIADA';
      v_descricao := format('Conta a pagar #%s criada para %s.', v_id, v_linha ->> 'favorecido');
    elsif tg_op = 'DELETE' then
      v_acao := 'EXCLUÍDA';
      v_descricao := format('Conta a pagar #%s de %s excluída.', v_id, v_linha ->> 'favorecido');
    elsif old.status is distinct from new.status and new.status = 'PAGO' then
      v_acao := 'PAGAMENTO_CONFIRMADO';
      v_descricao := format('Pagamento da conta #%s de %s confirmado.', v_id, new.favorecido);
    else
      v_acao := 'ALTERADA';
      v_descricao := format('Conta a pagar #%s de %s alterada.', v_id, v_linha ->> 'favorecido');
    end if;
  else
    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
  end if;

  perform public.registrar_log_financeiro(
    v_modulo,
    v_acao,
    v_entidade,
    v_id,
    v_descricao,
    v_detalhes
  );

  if tg_op = 'DELETE' then
    return old;
  end if;

  return new;
exception
  when others then
    raise warning 'Falha ao registrar log financeiro: %', sqlerrm;

    if tg_op = 'DELETE' then
      return old;
    end if;

    return new;
end;
$$;

drop trigger if exists logs_financeiros_vendas on public.vendas;
create trigger logs_financeiros_vendas
after insert or update or delete on public.vendas
for each row execute function public.auditar_operacao_financeira();

drop trigger if exists logs_financeiros_vendas_parcelas on public.vendas_parcelas;
create trigger logs_financeiros_vendas_parcelas
after insert or update or delete on public.vendas_parcelas
for each row execute function public.auditar_operacao_financeira();

drop trigger if exists logs_financeiros_vendas_recebimentos on public.vendas_recebimentos;
create trigger logs_financeiros_vendas_recebimentos
after insert or update or delete on public.vendas_recebimentos
for each row execute function public.auditar_operacao_financeira();

drop trigger if exists logs_financeiros_contas_pagar on public.contas_pagar;
create trigger logs_financeiros_contas_pagar
after insert or update or delete on public.contas_pagar
for each row execute function public.auditar_operacao_financeira();

revoke all on function public.registrar_log_financeiro(text, text, text, bigint, text, jsonb) from public;
revoke all on function public.auditar_operacao_financeira() from public;

notify pgrst, 'reload schema';


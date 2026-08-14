-- Estoque Visual Esquadrias
-- Permite mover vendas completamente recebidas para Obras Finalizadas.
-- Execute uma única vez no SQL Editor do Supabase.

alter table public.vendas
  add column if not exists arquivada boolean not null default false;

alter table public.vendas
  add column if not exists arquivada_em timestamptz;

create index if not exists vendas_arquivada_data_venda_idx
  on public.vendas (arquivada, data_venda desc);

create or replace function public.arquivar_venda(p_venda_id bigint)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_arquivada boolean;
begin
  if not public.usuario_ativo() then
    raise exception 'Usuário não autorizado.';
  end if;

  select arquivada
    into v_arquivada
    from public.vendas
   where id = p_venda_id
   for update;

  if not found then
    raise exception 'Venda não encontrada.';
  end if;

  if v_arquivada then
    return;
  end if;

  if not exists (
    select 1
      from public.vendas_parcelas
     where venda_id = p_venda_id
  ) or exists (
    select 1
      from public.vendas_parcelas
     where venda_id = p_venda_id
       and status is distinct from 'RECEBIDO'
  ) then
    raise exception 'A obra só pode ser finalizada quando todas as parcelas estiverem recebidas.';
  end if;

  update public.vendas
     set arquivada = true,
         arquivada_em = now()
   where id = p_venda_id;
end;
$$;

revoke all on function public.arquivar_venda(bigint) from public;
grant execute on function public.arquivar_venda(bigint) to authenticated;

notify pgrst, 'reload schema';


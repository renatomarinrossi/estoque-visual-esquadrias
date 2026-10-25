-- Garante que nenhuma alteração de saldo fique sem histórico.
-- A função oficial continua registrando a movimentação explicitamente.
-- Alterações diretas em produtos.quantidade passam a ser auditadas por gatilho.

begin;

alter table public.movimentacoes_estoque
  add column if not exists origem text not null default 'ENTRADA_SAIDA';

alter table public.movimentacoes_estoque
  drop constraint if exists movimentacoes_estoque_origem_check;

alter table public.movimentacoes_estoque
  add constraint movimentacoes_estoque_origem_check
  check (origem in ('ENTRADA_SAIDA', 'CADASTRO_INICIAL', 'AJUSTE_DIRETO'));

create or replace function public.ajustar_estoque(
  p_produto_id bigint,
  p_variacao bigint,
  p_fornecedor_id bigint default null,
  p_preco_compra numeric default null,
  p_registrar_entrada boolean default false
)
returns table(id bigint, quantidade bigint)
language plpgsql
security definer
set search_path to public
as $$
declare
  v_usuario_id bigint;
  v_saldo_resultante bigint;
  v_saldo_anterior bigint;
begin
  if auth.uid() is null then
    raise exception 'Usuário não autenticado.';
  end if;

  if p_variacao = 0 then
    raise exception 'A quantidade da movimentação deve ser diferente de zero.';
  end if;

  select usuario.id
    into v_usuario_id
    from public.usuarios as usuario
   where usuario.auth_user_id = auth.uid()
     and usuario.ativo = true;

  if v_usuario_id is null then
    raise exception 'Usuário sem perfil ativo.';
  end if;

  -- Impede que o gatilho de proteção duplique a movimentação criada abaixo.
  perform set_config('app.ajustando_estoque_rpc', 'true', true);

  update public.produtos as produto
     set quantidade = coalesce(produto.quantidade, 0) + p_variacao,
         fornecedor_id = case when p_registrar_entrada then p_fornecedor_id else produto.fornecedor_id end,
         preco_compra = case when p_registrar_entrada then p_preco_compra else produto.preco_compra end,
         ultima_entrada = case when p_registrar_entrada then now() else produto.ultima_entrada end
   where produto.id = p_produto_id
  returning produto.quantidade into v_saldo_resultante;

  if not found then
    raise exception 'Produto não encontrado.';
  end if;

  perform set_config('app.ajustando_estoque_rpc', 'false', true);

  v_saldo_anterior := v_saldo_resultante - p_variacao;

  insert into public.movimentacoes_estoque (
    produto_id, usuario_id, tipo, quantidade, saldo_anterior,
    saldo_resultante, fornecedor_id, preco_compra, origem
  ) values (
    p_produto_id,
    v_usuario_id,
    case when p_variacao > 0 then 'ENTRADA' else 'SAIDA' end,
    abs(p_variacao),
    v_saldo_anterior,
    v_saldo_resultante,
    case when p_registrar_entrada then p_fornecedor_id else null end,
    case when p_registrar_entrada then p_preco_compra else null end,
    'ENTRADA_SAIDA'
  );

  return query select p_produto_id, v_saldo_resultante;
end;
$$;

create or replace function public.registrar_ajuste_direto_estoque()
returns trigger
language plpgsql
security definer
set search_path to public
as $$
declare
  v_usuario_id bigint;
  v_variacao bigint;
begin
  if current_setting('app.restaurando_backup', true) = 'true'
     or current_setting('app.ajustando_estoque_rpc', true) = 'true'
     or new.quantidade is not distinct from old.quantidade then
    return new;
  end if;

  v_variacao := coalesce(new.quantidade, 0) - coalesce(old.quantidade, 0);
  if v_variacao = 0 then
    return new;
  end if;

  select id into v_usuario_id
    from public.usuarios
   where auth_user_id = auth.uid()
     and ativo = true;

  if v_usuario_id is null then
    raise exception 'Alteração de estoque bloqueada: usuário sem perfil ativo.';
  end if;

  if v_variacao > 0 then
    new.ultima_entrada := now();
  end if;

  insert into public.movimentacoes_estoque (
    produto_id, usuario_id, tipo, quantidade, saldo_anterior,
    saldo_resultante, fornecedor_id, preco_compra, origem
  ) values (
    new.id,
    v_usuario_id,
    case when v_variacao > 0 then 'ENTRADA' else 'SAIDA' end,
    abs(v_variacao),
    coalesce(old.quantidade, 0),
    coalesce(new.quantidade, 0),
    case when v_variacao > 0 then new.fornecedor_id else null end,
    case when v_variacao > 0 then new.preco_compra else null end,
    'AJUSTE_DIRETO'
  );

  return new;
end;
$$;

create or replace function public.registrar_estoque_inicial_produto()
returns trigger
language plpgsql
security definer
set search_path to public
as $$
declare
  v_usuario_id bigint;
begin
  if current_setting('app.restaurando_backup', true) = 'true'
     or coalesce(new.quantidade, 0) = 0 then
    return new;
  end if;

  select id into v_usuario_id
    from public.usuarios
   where auth_user_id = auth.uid()
     and ativo = true;

  if v_usuario_id is null then
    raise exception 'Estoque inicial bloqueado: usuário sem perfil ativo.';
  end if;

  insert into public.movimentacoes_estoque (
    produto_id, usuario_id, tipo, quantidade, saldo_anterior,
    saldo_resultante, fornecedor_id, preco_compra, origem
  ) values (
    new.id, v_usuario_id, 'ENTRADA', new.quantidade, 0,
    new.quantidade, new.fornecedor_id, new.preco_compra, 'CADASTRO_INICIAL'
  );

  update public.produtos
     set ultima_entrada = coalesce(ultima_entrada, now())
   where id = new.id;

  return new;
end;
$$;

drop trigger if exists proteger_movimentacao_estoque_update on public.produtos;
create trigger proteger_movimentacao_estoque_update
before update of quantidade on public.produtos
for each row execute function public.registrar_ajuste_direto_estoque();

drop trigger if exists registrar_estoque_inicial_insert on public.produtos;
create trigger registrar_estoque_inicial_insert
after insert on public.produtos
for each row execute function public.registrar_estoque_inicial_produto();

revoke all on function public.registrar_ajuste_direto_estoque() from public;
revoke all on function public.registrar_estoque_inicial_produto() from public;
revoke all on function public.ajustar_estoque(bigint,bigint,bigint,numeric,boolean) from public;
grant execute on function public.ajustar_estoque(bigint,bigint,bigint,numeric,boolean) to authenticated;

notify pgrst, 'reload schema';
commit;

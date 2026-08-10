-- Estoque Visual Esquadrias
-- Funções existentes de estoque, backup e validações.
-- Esta migration também restringe a execução das funções ao papel autenticado.

create or replace function public.usuario_ativo()
returns boolean
language sql
stable
security definer
set search_path to public
as $$
  select exists (
    select 1
      from public.usuarios
     where auth_user_id = auth.uid()
       and ativo = true
  );
$$;

create or replace function public.eh_desenvolvedor()
returns boolean
language sql
stable
security definer
set search_path to public
as $$
  select exists (
    select 1
      from public.usuarios
     where auth_user_id = auth.uid()
       and perfil = 'DESENVOLVEDOR'
       and ativo = true
  );
$$;

create or replace function public.pode_restaurar_backup()
returns boolean
language sql
stable
security definer
set search_path to public
as $$
  select public.eh_desenvolvedor();
$$;

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

  v_saldo_anterior := v_saldo_resultante - p_variacao;

  insert into public.movimentacoes_estoque (
    produto_id, usuario_id, tipo, quantidade, saldo_anterior,
    saldo_resultante, fornecedor_id, preco_compra
  ) values (
    p_produto_id,
    v_usuario_id,
    case when p_variacao > 0 then 'ENTRADA' else 'SAIDA' end,
    abs(p_variacao),
    v_saldo_anterior,
    v_saldo_resultante,
    case when p_registrar_entrada then p_fornecedor_id else null end,
    case when p_registrar_entrada then p_preco_compra else null end
  );

  return query select p_produto_id, v_saldo_resultante;
end;
$$;

create or replace function public.reset_produtos_sequence()
returns void
language sql
set search_path to public
as $$
  select setval(
    pg_get_serial_sequence('public.produtos', 'id'),
    coalesce((select max(id) from public.produtos), 1),
    true
  );
$$;

-- Compatibilidade com o formato de backup antigo. Não é usado pela interface atual.
create or replace function public.restaurar_backup(
  p_produtos jsonb,
  p_fornecedores jsonb,
  p_usuarios jsonb,
  p_lixeira jsonb
)
returns void
language plpgsql
security definer
set search_path to public
as $$
begin
  if not public.pode_restaurar_backup() then
    raise exception 'Apenas desenvolvedores autenticados podem restaurar backups.';
  end if;

  delete from public.lixeira;
  delete from public.produtos;
  delete from public.fornecedores;
  delete from public.usuarios;

  insert into public.produtos
  select * from jsonb_populate_recordset(null::public.produtos, p_produtos);

  insert into public.fornecedores
  select * from jsonb_populate_recordset(null::public.fornecedores, p_fornecedores);

  insert into public.usuarios
  select * from jsonb_populate_recordset(null::public.usuarios, p_usuarios);

  insert into public.lixeira
  select * from jsonb_populate_recordset(null::public.lixeira, p_lixeira);
end;
$$;

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

  if p_backup ->> 'sistema' <> 'Estoque Visual Esquadrias' then
    raise exception 'Arquivo não pertence ao Estoque Visual Esquadrias.';
  end if;

  if coalesce((p_backup ->> 'backupVersion')::integer, 0) < 2 then
    raise exception 'Versão de backup não suportada.';
  end if;

  foreach tabela in array array[
    'fornecedores', 'produtos', 'lixeira', 'usuarios', 'vendas',
    'vendas_parcelas', 'vendas_recebimentos', 'contas_pagar'
  ] loop
    if jsonb_typeof(p_backup -> tabela) <> 'array' then
      raise exception 'A tabela % está ausente ou inválida no backup.', tabela;
    end if;
  end loop;

  truncate table
    public.vendas_recebimentos, public.vendas_parcelas, public.vendas,
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

  perform setval(pg_get_serial_sequence('public.fornecedores', 'id'), coalesce((select max(id) from public.fornecedores), 1), true);
  perform setval(pg_get_serial_sequence('public.produtos', 'id'), coalesce((select max(id) from public.produtos), 1), true);
  perform setval(pg_get_serial_sequence('public.lixeira', 'id'), coalesce((select max(id) from public.lixeira), 1), true);
  perform setval(pg_get_serial_sequence('public.usuarios', 'id'), coalesce((select max(id) from public.usuarios), 1), true);
  perform setval(pg_get_serial_sequence('public.vendas', 'id'), coalesce((select max(id) from public.vendas), 1), true);
  perform setval(pg_get_serial_sequence('public.vendas_parcelas', 'id'), coalesce((select max(id) from public.vendas_parcelas), 1), true);
  perform setval(pg_get_serial_sequence('public.vendas_recebimentos', 'id'), coalesce((select max(id) from public.vendas_recebimentos), 1), true);
  perform setval(pg_get_serial_sequence('public.contas_pagar', 'id'), coalesce((select max(id) from public.contas_pagar), 1), true);

  return jsonb_build_object('sucesso', true);
end;
$$;

create or replace function public.validar_alteracao_parcela_com_recebimentos()
returns trigger
language plpgsql
set search_path to public
as $$
declare
  v_total_recebido numeric;
begin
  select coalesce(sum(recebimento.valor), 0)
    into v_total_recebido
    from public.vendas_recebimentos as recebimento
   where recebimento.parcela_id = old.id;

  if tg_op = 'DELETE' and v_total_recebido > 0 then
    raise exception 'Não é possível excluir uma parcela que possui recebimentos registrados.';
  end if;

  if tg_op = 'UPDATE' and new.valor < v_total_recebido then
    raise exception 'O valor da parcela não pode ser menor que o total já recebido (%).', v_total_recebido;
  end if;

  return case when tg_op = 'DELETE' then old else new end;
end;
$$;

create or replace function public.validar_exclusao_venda_com_recebimentos()
returns trigger
language plpgsql
set search_path to public
as $$
begin
  if exists (
    select 1
      from public.vendas_parcelas as parcela
      join public.vendas_recebimentos as recebimento on recebimento.parcela_id = parcela.id
     where parcela.venda_id = old.id
  ) then
    raise exception 'Não é possível excluir uma venda que possui recebimentos registrados.';
  end if;

  return old;
end;
$$;

revoke all on function public.usuario_ativo() from public;
revoke all on function public.eh_desenvolvedor() from public;
revoke all on function public.pode_restaurar_backup() from public;
revoke all on function public.ajustar_estoque(bigint, bigint, bigint, numeric, boolean) from public;
revoke all on function public.restaurar_backup(jsonb, jsonb, jsonb, jsonb) from public;
revoke all on function public.restaurar_backup_completo(jsonb) from public;

grant execute on function public.usuario_ativo() to authenticated;
grant execute on function public.eh_desenvolvedor() to authenticated;
grant execute on function public.pode_restaurar_backup() to authenticated;
grant execute on function public.ajustar_estoque(bigint, bigint, bigint, numeric, boolean) to authenticated;
grant execute on function public.restaurar_backup_completo(jsonb) to authenticated;

notify pgrst, 'reload schema';


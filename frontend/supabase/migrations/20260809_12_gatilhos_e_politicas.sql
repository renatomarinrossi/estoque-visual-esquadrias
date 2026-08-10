-- Estoque Visual Esquadrias
-- Gatilhos e políticas RLS atuais.
-- A política antiga de "entradas" foi corrigida: antes aceitava acesso anônimo.

drop trigger if exists validar_venda_com_recebimentos on public.vendas;
create trigger validar_venda_com_recebimentos
before delete on public.vendas
for each row
execute function public.validar_exclusao_venda_com_recebimentos();

drop trigger if exists validar_parcela_com_recebimentos on public.vendas_parcelas;
create trigger validar_parcela_com_recebimentos
before delete or update on public.vendas_parcelas
for each row
execute function public.validar_alteracao_parcela_com_recebimentos();

alter table public.contas_pagar enable row level security;
alter table public.entradas enable row level security;
alter table public.fornecedores enable row level security;
alter table public.lixeira enable row level security;
alter table public.movimentacoes_estoque enable row level security;
alter table public.produtos enable row level security;
alter table public.usuarios enable row level security;
alter table public.vendas enable row level security;
alter table public.vendas_parcelas enable row level security;
alter table public.vendas_recebimentos enable row level security;

drop policy if exists contas_pagar_usuarios_ativos on public.contas_pagar;
create policy contas_pagar_usuarios_ativos on public.contas_pagar
for all to authenticated using (public.usuario_ativo()) with check (public.usuario_ativo());

drop policy if exists "Permitir tudo entrada" on public.entradas;
drop policy if exists entradas_usuarios_ativos on public.entradas;
create policy entradas_usuarios_ativos on public.entradas
for all to authenticated using (public.usuario_ativo()) with check (public.usuario_ativo());

drop policy if exists fornecedores_usuarios_ativos on public.fornecedores;
create policy fornecedores_usuarios_ativos on public.fornecedores
for all to authenticated using (public.usuario_ativo()) with check (public.usuario_ativo());

drop policy if exists lixeira_usuarios_ativos on public.lixeira;
create policy lixeira_usuarios_ativos on public.lixeira
for all to authenticated using (public.usuario_ativo()) with check (public.usuario_ativo());

drop policy if exists "desenvolvedor consulta movimentacoes de estoque" on public.movimentacoes_estoque;
create policy "desenvolvedor consulta movimentacoes de estoque" on public.movimentacoes_estoque
for select to authenticated using (public.eh_desenvolvedor());

drop policy if exists produtos_usuarios_ativos on public.produtos;
create policy produtos_usuarios_ativos on public.produtos
for all to authenticated using (public.usuario_ativo()) with check (public.usuario_ativo());

drop policy if exists "desenvolvedor administra perfis" on public.usuarios;
create policy "desenvolvedor administra perfis" on public.usuarios
for all to authenticated using (public.eh_desenvolvedor()) with check (public.eh_desenvolvedor());

drop policy if exists "usuario le o proprio perfil" on public.usuarios;
create policy "usuario le o proprio perfil" on public.usuarios
for select to authenticated using (auth_user_id = auth.uid());

drop policy if exists vendas_usuarios_ativos on public.vendas;
create policy vendas_usuarios_ativos on public.vendas
for all to authenticated using (public.usuario_ativo()) with check (public.usuario_ativo());

drop policy if exists vendas_parcelas_usuarios_ativos on public.vendas_parcelas;
create policy vendas_parcelas_usuarios_ativos on public.vendas_parcelas
for all to authenticated using (public.usuario_ativo()) with check (public.usuario_ativo());

drop policy if exists vendas_recebimentos_usuarios_ativos on public.vendas_recebimentos;
create policy vendas_recebimentos_usuarios_ativos on public.vendas_recebimentos
for all to authenticated using (public.usuario_ativo()) with check (public.usuario_ativo());

notify pgrst, 'reload schema';


-- Acesso ao DP igual ao Gerencial, autorizado expressamente pelo usuário.
begin;
create or replace function public.dp_pode_acessar()
returns boolean language sql stable security definer set search_path=public as $$
 select exists (
  select 1 from public.usuarios
  where auth_user_id=auth.uid() and ativo is true
  and perfil in ('DESENVOLVEDOR','GERENCIAL','OPERADOR')
 );
$$;
revoke all on function public.dp_pode_acessar() from public,anon;
grant execute on function public.dp_pode_acessar() to authenticated;
-- A política dp_auditoria_leitura continua exigindo eh_desenvolvedor().
notify pgrst,'reload schema';
commit;

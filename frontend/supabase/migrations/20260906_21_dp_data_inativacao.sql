-- Data de demissão ou inativação do funcionário.
-- Executar depois de 20260906_20_dp_editar_movimento_ferias.sql.

begin;

alter table public.dp_funcionarios
  add column if not exists data_inativacao date;

alter table public.dp_funcionarios
  drop constraint if exists dp_funcionarios_data_inativacao_check;

alter table public.dp_funcionarios
  add constraint dp_funcionarios_data_inativacao_check
  check (data_inativacao is null or data_inativacao >= data_admissao);

notify pgrst, 'reload schema';
commit;


-- Permite corrigir uma movimentação de férias sem perder o histórico do período.
-- Executar depois de 20260906_19_dp_fluxo_simplificado.sql.

begin;

create or replace function public.dp_atualizar_movimento_ferias(
  p_movimento_id bigint, p_descricao text, p_quantidade_dias integer,
  p_data_movimentacao date, p_observacoes text
)
returns void language plpgsql security definer set search_path = public
as $$
declare
  movimento public.dp_ferias_movimentacoes%rowtype;
  periodo public.dp_periodos_ferias%rowtype;
  v_usados integer;
begin
  if not public.dp_pode_acessar() then raise exception 'Acesso não permitido.'; end if;
  if length(trim(coalesce(p_descricao,''))) not between 1 and 200
     or p_quantidade_dias is null or p_quantidade_dias not between 1 and 30
     or p_data_movimentacao is null then
    raise exception 'Preencha a descrição, os dias e a data.';
  end if;
  select * into movimento from public.dp_ferias_movimentacoes
    where id=p_movimento_id for update;
  if not found then raise exception 'Lançamento não encontrado.'; end if;
  if movimento.cancelado_em is not null then raise exception 'Lançamento cancelado não pode ser editado.'; end if;
  select * into periodo from public.dp_periodos_ferias
    where id=movimento.periodo_id for update;
  select coalesce(sum(dias_gozo+abono_dias),0) into v_usados
    from public.dp_ferias where periodo_id=periodo.id and status<>'CANCELADO';
  select v_usados+coalesce(sum(quantidade_dias),0) into v_usados
    from public.dp_ferias_movimentacoes
    where periodo_id=periodo.id and cancelado_em is null and id<>movimento.id;
  if v_usados+p_quantidade_dias>periodo.dias_direito then
    raise exception 'A quantidade ultrapassa o saldo de férias deste período.';
  end if;
  update public.dp_ferias_movimentacoes
  set descricao=trim(p_descricao), quantidade_dias=p_quantidade_dias,
      data_movimentacao=p_data_movimentacao,
      observacoes=trim(coalesce(p_observacoes,''))
  where id=movimento.id;
end;
$$;

revoke all on function public.dp_atualizar_movimento_ferias(bigint,text,integer,date,text) from public;
grant execute on function public.dp_atualizar_movimento_ferias(bigint,text,integer,date,text) to authenticated;

notify pgrst, 'reload schema';
commit;

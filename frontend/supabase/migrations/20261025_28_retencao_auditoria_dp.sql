begin;

-- A tabela de lotes existente passa a identificar a origem do arquivo.
-- Backups v6 anteriores continuam restauráveis: a coluna ausente recebe o padrão.
alter table public.auditoria_exportacoes
 add column if not exists origem text not null default 'FINANCEIRO';

alter table public.auditoria_exportacoes
 drop constraint if exists auditoria_exportacoes_origem_check;
alter table public.auditoria_exportacoes
 add constraint auditoria_exportacoes_origem_check
 check (origem in ('FINANCEIRO','DEPARTAMENTO_PESSOAL'));

create or replace function public.exportar_auditoria_dp_antiga(p_corte timestamptz)
returns jsonb
language plpgsql
security definer
set search_path=public
as $$
declare lote bigint; dados jsonb; ultimo bigint; n bigint;
begin
 if not eh_desenvolvedor() then raise exception 'Acesso não permitido.'; end if;
 if p_corte is null or p_corte>now()-interval '90 days' then
  raise exception 'Mantenha pelo menos 90 dias no histórico online.';
 end if;
 select coalesce(jsonb_agg(t order by id),'[]'),coalesce(max(id),0),count(*)
 into dados,ultimo,n
 from (select * from dp_auditoria where created_at<p_corte order by id limit 5000) t;
 insert into auditoria_exportacoes(usuario_auth,corte,max_id,quantidade,origem)
 values(auth.uid(),p_corte,ultimo,n,'DEPARTAMENTO_PESSOAL') returning id into lote;
 return jsonb_build_object('lote',lote,'origem','DEPARTAMENTO_PESSOAL','registros',dados,'quantidade',n);
end $$;

create or replace function public.confirmar_arquivo_auditoria_dp(p_lote bigint,p_sha256 text)
returns bigint
language plpgsql
security definer
set search_path=public
as $$
declare lote auditoria_exportacoes%rowtype; n bigint;
begin
 if not eh_desenvolvedor() then raise exception 'Acesso não permitido.'; end if;
 if p_sha256 is null or p_sha256!~'^[0-9a-f]{64}$' then
  raise exception 'Informe o SHA-256 do arquivo conferido.';
 end if;
 select * into lote from auditoria_exportacoes where id=p_lote for update;
 if not found or lote.usuario_auth<>auth.uid() or lote.origem<>'DEPARTAMENTO_PESSOAL' then
  raise exception 'Lote não encontrado.';
 end if;
 if lote.confirmado_em is not null then return 0; end if;
 delete from dp_auditoria where created_at<lote.corte and id<=lote.max_id;
 get diagnostics n=row_count;
 if n<>lote.quantidade then raise exception 'O lote mudou. Exporte novamente.'; end if;
 update auditoria_exportacoes
 set resumo_sha256=p_sha256,confirmado_em=now()
 where id=p_lote;
 return n;
end $$;

revoke all on function public.exportar_auditoria_dp_antiga(timestamptz),public.confirmar_arquivo_auditoria_dp(bigint,text) from public;
grant execute on function public.exportar_auditoria_dp_antiga(timestamptz),public.confirmar_arquivo_auditoria_dp(bigint,text) to authenticated;

notify pgrst,'reload schema';
commit;

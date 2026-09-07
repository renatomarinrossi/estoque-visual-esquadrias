-- Ensaio transacional: executar somente no projeto demo jnaojtkggsedzauizxgh.
-- Todos os dados de teste são revertidos; sequências podem avançar.
begin;
select set_config('request.jwt.claim.sub',(select auth_user_id::text from public.usuarios where perfil='DESENVOLVEDOR' and ativo and auth_user_id is not null order by id limit 1),true);
set local role authenticated;
do $$
declare f bigint; p bigint; c bigint; b jsonb;
begin
 if not public.dp_pode_acessar() then raise exception 'Acesso DP indisponível'; end if;
 f:=public.dp_salvar_funcionario('{"nome":"Teste transacional demo","funcao":"Validação","salario":3000,"data_admissao":"2026-09-16","ativo":true,"data_inativacao":null}');
 perform public.dp_gerar_folha('2026-09-01');
 if (select sum(valor) from public.dp_pagamentos where funcionario_id=f)<>1500 then raise exception 'Proporcional incorreto'; end if;
 select id into p from public.dp_pagamentos where funcionario_id=f order by id limit 1;
 perform public.dp_baixar_com_ajuste(p,current_date,'PIX',-100,'Desconto de teste revertido','4d1dce7e-b269-4d70-a660-e099f162b2cd');
 if not exists(select 1 from public.dp_pagamentos where id=p and status='PAGO' and valor_extra=-100) then raise exception 'Baixa com ajuste falhou'; end if;
 if public.dp_quinto_dia_util('2026-04-01')<>'2026-05-07'::date then raise exception 'Calendário incorreto'; end if;
 c:=public.salvar_conta_pagar(jsonb_build_object('data_lancamento',current_date,'favorecido','Teste revertido','descricao','Teste transacional','valor',10,'forma_pagamento','PIX','data_vencimento',current_date));
 perform public.operar_conta_pagar(c,'PAGAR',current_date);
 if not exists(select 1 from public.logs_financeiros where entidade_id=c and entidade='contas_pagar') then raise exception 'Log financeiro ausente'; end if;
 b:=public.gerar_backup_operacional('validacao-demo','TESTE_TRANSACIONAL');
 if (b->>'backupVersion')::int<>6 or jsonb_array_length(b->'dp_pagamentos')<1 then raise exception 'Backup v6 falhou'; end if;
 begin
   update public.contas_pagar set valor=1 where id=c;
   raise exception 'Escrita direta foi permitida';
 exception when insufficient_privilege then null;
 end;
 if not exists(select 1 from public.dp_auditoria where tabela='dp_pagamentos') then raise exception 'Auditoria DP ausente'; end if;
end $$;
rollback;
select 'PASS: RLS, proporcional, baixa com desconto, calendário, logs e backup; dados de teste revertidos.' as resultado;

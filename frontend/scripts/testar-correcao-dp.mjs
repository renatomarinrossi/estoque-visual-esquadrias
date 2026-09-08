import assert from 'node:assert/strict';

export async function testarCorrecaoDP(db) {
  const q = async (sql, args = []) => (await db.query(sql, args)).rows;
  const v = async (sql, args = []) => (await q(sql, args))[0].v;
  await q("select set_config('app.uid','00000000-0000-0000-0000-000000000001',false)");
  const dados = { nome: 'Regressão edição', funcao: 'Teste', salario: 2000, data_admissao: '2025-05-01', data_inativacao: null, ativo: true };
  const id = Number(await v('select dp_salvar_funcionario($1) v', [dados]));
  const periodo = Number(await v('select min(id) v from dp_periodos_ferias where funcionario_id=$1', [id]));
  const mov = Number(await v('select dp_salvar_movimento_ferias($1) v', [{ periodo_id: periodo, descricao: 'Teste anterior', tipo_movimentacao: 'GOZO', quantidade_dias: 10, valor: 0, data_movimentacao: '2026-09-01', idempotencia: 'aaaaaaaa-1111-4111-8111-111111111111' }]));
  const decisoes = Object.fromEntries((await q('select distinct competencia::text from dp_pagamentos where funcionario_id=$1 and status=\'EM_ABERTO\'', [id])).map(p => [p.competencia, 'MANTER']));
  await assert.rejects(q('select dp_salvar_funcionario($1,$2,$3)', [{ ...dados, data_admissao: '2026-08-14' }, id, decisoes]), /férias já lançadas/);
  assert.equal(await v('select data_admissao::text v from dp_funcionarios where id=$1', [id]), '2025-05-01');
  await q('select dp_cancelar_movimento_ferias($1)', [mov]);
  await assert.rejects(q('select dp_salvar_funcionario($1,$2)', [{ ...dados, data_admissao: '2026-08-14' }, id]), /Revise/);
  await q('select dp_salvar_funcionario($1,$2,$3)', [{ ...dados, data_admissao: '2026-08-14' }, id, decisoes]);
  assert.equal(Number(await v('select count(*) v from dp_periodos_ferias where funcionario_id=$1 and substituido_em is null', [id])), 0);
  assert.equal(Number(await v('select count(*) v from dp_ferias_movimentacoes where id=$1', [mov])), 1);
  await q('select dp_sincronizar_periodos_ferias()');
  assert.equal(Number(await v('select count(*) v from dp_periodos_ferias where funcionario_id=$1 and substituido_em is null', [id])), 0);
  await assert.rejects(q('select dp_salvar_movimento_ferias($1)', [{ periodo_id: periodo, descricao: 'Não permitir', tipo_movimentacao: 'GOZO', quantidade_dias: 1, valor: 0, data_movimentacao: '2026-09-01', idempotencia: 'aaaaaaaa-1111-4111-8111-111111111112' }]), /substituído/);

  const pagamento = Number(await v('select min(id) v from dp_pagamentos where funcionario_id=$1 and status=\'EM_ABERTO\'', [id]));
  await q("select dp_baixar_com_ajuste($1,'2026-09-01','PIX',50,'Ajuste teste','aaaaaaaa-1111-4111-8111-111111111113')", [pagamento]);
  await assert.rejects(q('select dp_excluir_funcionario($1,$2)', [id, 'Nome incorreto']), /nome completo/);

  // Uma falha no último DELETE deve recuperar também filhos e auditorias.
  const antes = await v("select gerar_backup_operacional('teste') v");
  await db.exec("reset role; create function bloquear_exclusao_teste() returns trigger language plpgsql as $$begin raise exception 'Falha controlada'; end$$; create trigger bloquear_exclusao_teste before delete on dp_funcionarios for each row execute function bloquear_exclusao_teste(); set role authenticated;");
  await assert.rejects(q('select dp_excluir_funcionario($1,$2)', [id, dados.nome]), /Falha controlada/);
  const rollback = await v("select gerar_backup_operacional('teste') v");
  for (const t of Object.keys(antes.quantidades)) assert.deepEqual(rollback[t], antes[t], 'rollback ' + t);
  await db.exec('reset role; drop trigger bloquear_exclusao_teste on dp_funcionarios; drop function bloquear_exclusao_teste(); set role authenticated;');
  await q('select dp_excluir_funcionario($1,$2)', [id, dados.nome]);
  for (const t of ['dp_funcionarios','dp_pagamentos','dp_periodos_ferias','dp_ferias_movimentacoes']) {
    assert.equal(Number(await v(`select count(*) v from ${t} where ${t === 'dp_funcionarios' ? 'id' : 'funcionario_id'}=$1`, [id])), 0, t);
  }
  assert.equal(Number(await v('select count(*) v from dp_pagamento_lancamentos where pagamento_id=$1', [pagamento])), 0);
  assert.equal(Number(await v("select count(*) v from dp_auditoria where (tabela='dp_funcionarios' and registro_id=$1) or antes->>'funcionario_id'=$1::text or depois->>'funcionario_id'=$1::text or (tabela='dp_pagamento_lancamentos' and (antes->>'pagamento_id'=$2::text or depois->>'pagamento_id'=$2::text))", [id, pagamento])), 0);
  // Fixture histórica com programação de férias e pagamento parcial.
  await q("select dp_excluir_funcionario(900,'Histórico')");
  assert.equal(Number(await v('select count(*) v from dp_ferias where funcionario_id=900')), 0);
  assert.equal(Number(await v('select count(*) v from dp_ferias_pagamentos where ferias_id=900')), 0);
  const depois = await v("select gerar_backup_operacional('teste') v");
  for (const t of ['produtos','vendas','contas_pagar','logs_financeiros','usuarios']) assert.deepEqual(depois[t], antes[t], 'isolamento ' + t);

  await db.exec("reset role; insert into auth.users values('00000000-0000-0000-0000-000000000003'); insert into usuarios(nome,login,perfil,ativo,auth_user_id) values('Gerente teste','gerente_teste','GERENCIAL',true,'00000000-0000-0000-0000-000000000003'); set role authenticated;");
  assert(Number(await v('select count(*) v from dp_auditoria')) > 0);
  await q("select set_config('app.uid','00000000-0000-0000-0000-000000000003',false)");
  assert.equal(Number(await v('select count(*) v from dp_auditoria')), 0);
  assert.equal(await v('select dp_pode_acessar() v'), true);
  await q("select set_config('app.uid','00000000-0000-0000-0000-000000000002',false)");
  await assert.rejects(q("select dp_excluir_funcionario(1,'Teste')"), /Acesso/);
  await q("select set_config('app.uid','00000000-0000-0000-0000-000000000001',false)");
  // O arquivo anterior à correção permanece restaurável no esquema novo.
  await q('select restaurar_backup_completo($1)', [antes]);
  const restaurado = await v("select gerar_backup_operacional('teste') v");
  for (const t of Object.keys(antes.quantidades)) assert.deepEqual(restaurado[t], antes[t], 'restauração ' + t);
  console.log('PASS: admissão reconciliada, histórico cancelado preservado, exclusão integral/isolada, rollback, backup e auditoria restrita ao desenvolvedor.');
}

import { test } from "node:test";
import assert from "node:assert/strict";
import {
  validarBackup,
  tabelasBackup,
} from "../src/services/backup/restaurarBackup.ts";
import { selecionarProximoPagamento } from "../src/components/DepartamentoPessoal/proximoPagamento.ts";
import { prepararCors } from "../supabase/functions/_shared/cors.ts";
import { converterBackupV3 } from "../src/services/backup/converterBackupV3.ts";

test("próximo pagamento prefere futuro e, se todos vencidos, o atraso mais recente", () => {
  const p = (id, data, status = "EM_ABERTO") => ({
    id,
    data_vencimento: data,
    status,
  });
  const vencidos = [
    p(1, "2026-08-01"),
    p(2, "2026-09-05"),
    p(3, "2026-09-06", "PAGO"),
  ];
  assert.equal(selecionarProximoPagamento(vencidos, "2026-09-07").id, 2);
  assert.equal(
    selecionarProximoPagamento(
      [...vencidos, p(4, "2026-10-01"), p(5, "2026-09-20")],
      "2026-09-07",
    ).id,
    5,
  );
  assert.equal(
    selecionarProximoPagamento([p(1, "2026-09-07", "CANCELADO")], "2026-09-07"),
    undefined,
  );
  assert.deepEqual(
    vencidos.map((p) => p.id),
    [1, 2, 3],
  );
});
test("backup rejeita tabelas/contagens/IDs inválidos e aceita 4/5 sem inventar históricos vazios", () => {
  const backup = {
    sistema: "Estoque Visual Esquadrias",
    backupVersion: 6,
    quantidades: {},
  };
  for (const t of tabelasBackup) {
    backup[t] = [];
    backup.quantidades[t] = 0;
  }
  assert.equal(validarBackup(backup).backupVersion, 6);
  const ausente = structuredClone(backup);
  delete ausente.movimentacoes_estoque;
  assert.throws(() => validarBackup(ausente), /ausente/);
  const conta = structuredClone(backup);
  conta.produtos = [{ id: 1 }];
  assert.throws(() => validarBackup(conta), /Contagem/);
  conta.quantidades.produtos = 2;
  conta.produtos.push({ id: 1 });
  assert.throws(() => validarBackup(conta), /duplicado/);
  for (const versao of [2, 4, 5]) {
    const antigo = { ...backup, backupVersion: versao };
    delete antigo.movimentacoes_estoque;
    delete antigo.logs_financeiros;
    assert.equal(validarBackup(antigo).movimentacoes_estoque, undefined);
  }
  assert.throws(
    () => validarBackup({ ...backup, backupVersion: 99 }),
    /Formatos/,
  );
});
test("CORS é específico à origem e não aceita subdomínios falsos", () => {
  assert.equal(
    prepararCors("https://demo.visualesquadrias.com")[
      "Access-Control-Allow-Origin"
    ],
    "https://demo.visualesquadrias.com",
  );
  assert.equal(
    prepararCors("https://app.visualesquadrias.com")[
      "Access-Control-Allow-Origin"
    ],
    "https://app.visualesquadrias.com",
  );
  assert.equal(
    prepararCors("http://localhost:5173")["Access-Control-Allow-Origin"],
    "http://localhost:5173",
  );
  assert.equal(
    prepararCors("https://app.visualesquadrias.com.evil.test"),
    null,
  );
  assert.equal(prepararCors("null"), null);
  assert.equal(prepararCors(null)["Access-Control-Allow-Origin"], undefined);
});
test("converte o formato 3 sem duplicar folha em contas a pagar nem perder férias pagas", () => {
  const origem = {
    dp_funcionarios: [{ id: 1, data_admissao: "2023-01-01" }],
    contas_pagar: [
      {
        id: 4,
        valor: 1200,
        forma_pagamento: "PIX",
        data_vencimento: "2026-09-20",
        status: "EM_ABERTO",
      },
    ],
    dp_pagamentos: [{ id: 1, conta_pagar_id: 4 }],
    dp_ferias: [
      {
        id: 1,
        funcionario_id: 1,
        inicio: "2024-03-01",
        fim: "2024-03-10",
        valor: 1000,
        status: "PAGO",
        data_pagamento: "2024-02-28",
      },
    ],
  };
  const convertido = converterBackupV3(origem, {
    dp_periodos_ferias: [],
    dp_ferias: [],
    dp_ferias_pagamentos: [],
  });
  assert.equal(convertido.backupVersion, 4);
  assert.equal(convertido.contas_pagar.length, 0);
  assert.equal(convertido.dp_pagamentos[0].valor, 1200);
  assert.equal(convertido.dp_pagamentos[0].conta_pagar_id, undefined);
  assert.equal(convertido.dp_ferias[0].dias_gozo, 10);
  assert.equal(convertido.dp_ferias_pagamentos[0].valor, 1000);
  assert.equal(
    convertido.dp_periodos_ferias[0].periodo_aquisitivo_inicio,
    "2023-01-01",
  );
  assert.equal(origem.dp_pagamentos[0].conta_pagar_id, 4);
});

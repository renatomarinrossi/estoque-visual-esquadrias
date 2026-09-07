
export const tabelasBackup = [
 "fornecedores", "produtos", "lixeira", "usuarios", "entradas", "movimentacoes_estoque",
 "vendas", "vendas_parcelas", "vendas_recebimentos", "contas_pagar", "dp_funcionarios",
 "dp_periodos_ferias", "dp_ferias", "dp_ferias_pagamentos", "dp_ferias_movimentacoes",
 "dp_pagamentos", "dp_pagamento_lancamentos", "dp_feriados", "logs_financeiros",
 "dp_auditoria", "auditoria_exportacoes",
] as const;
type TabelaBackup = typeof tabelasBackup[number];
export type BackupCompleto = Record<TabelaBackup, Record<string, unknown>[]> & {
 sistema: string; empresa: string; versaoSistema: string; backupVersion: number;
 dataBackup: string; quantidades: Record<TabelaBackup, number>;
};
export function validarBackup(backup: unknown): BackupCompleto {
 if (!backup || typeof backup !== "object") throw new Error("Backup inválido.");
 const dados = backup as BackupCompleto;
 if (dados.sistema !== "Estoque Visual Esquadrias") throw new Error("Backup de outro sistema.");
 if (![2, 4, 5, 6].includes(dados.backupVersion)) throw new Error("Formatos aceitos: 2, 4, 5 e 6. O formato 3 exige converter a folha vinculada às contas a pagar antes da importação.");
 const anteriores = ["fornecedores", "produtos", "lixeira", "usuarios", "vendas", "vendas_parcelas", "vendas_recebimentos", "contas_pagar", "dp_funcionarios", "dp_periodos_ferias", "dp_ferias", "dp_ferias_pagamentos", "dp_pagamentos"];
 for (const tabela of tabelasBackup) {
  const obrigatoria = dados.backupVersion === 6 || (anteriores.includes(tabela) && (dados.backupVersion >= 4 || !tabela.startsWith("dp_"))) || (dados.backupVersion === 5 && tabela === "dp_ferias_movimentacoes");
  if (!obrigatoria && dados[tabela] === undefined) continue;
  const registros = dados[tabela];
  if (!Array.isArray(registros)) throw new Error("Seção ausente ou inválida: " + tabela);
  if (dados.backupVersion === 6 && dados.quantidades?.[tabela] !== registros.length) throw new Error("Contagem inválida: " + tabela);
  const ids = new Set<string>();
  for (const registro of registros) {
   if (!registro || typeof registro !== "object" || Array.isArray(registro) || !/^\d+$/.test(String(registro.id))) throw new Error("Registro sem ID válido: " + tabela);
   const id = String(registro.id);
   if (ids.has(id)) throw new Error("ID duplicado: " + tabela + " #" + id);
   ids.add(id);
  }
 }
 return dados;
}
export async function lerArquivoBackup(arquivo: File): Promise<BackupCompleto> {
 if (arquivo.size > 50 * 1024 * 1024) throw new Error("Limite de 50 MB por arquivo.");
 let backup: unknown;
 try { backup = JSON.parse(await arquivo.text()); } catch { throw new Error("O arquivo não é um JSON válido."); }
 if(backup && typeof backup === "object" && (backup as Record<string,unknown>).backupVersion===3){
   if((backup as Record<string,unknown>).sistema!=="Estoque Visual Esquadrias")throw new Error("Backup de outro sistema.");
   const [{gerarBackup},{converterBackupV3}]=await Promise.all([import("../sistemaSupabase"),import("./converterBackupV3")]);
   backup=converterBackupV3(backup as Record<string,unknown>,await gerarBackup("CONVERSAO_V3"));
 }
 return validarBackup(backup);
}

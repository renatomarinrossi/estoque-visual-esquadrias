export type BackupCompleto = {
  sistema: string;
  empresa: string;
  versaoSistema: string;
  backupVersion: number;
  dataBackup: string;
  fornecedores: unknown[];
  produtos: unknown[];
  lixeira: unknown[];
  usuarios: unknown[];
  vendas: unknown[];
  vendas_parcelas: unknown[];
  vendas_recebimentos: unknown[];
  contas_pagar: unknown[];
};

const colecoesObrigatorias: Array<keyof BackupCompleto> = [
  "fornecedores",
  "produtos",
  "lixeira",
  "usuarios",
  "vendas",
  "vendas_parcelas",
  "vendas_recebimentos",
  "contas_pagar",
];

export async function lerArquivoBackup(arquivo: File): Promise<BackupCompleto> {
  if (arquivo.size > 50 * 1024 * 1024) {
    throw new Error("O arquivo de backup é maior que o limite de 50 MB.");
  }

  let backup: unknown;

  try {
    backup = JSON.parse(await arquivo.text());
  } catch {
    throw new Error("O arquivo selecionado não é um JSON válido.");
  }

  if (!backup || typeof backup !== "object") {
    throw new Error("O arquivo de backup é inválido.");
  }

  const dados = backup as Partial<BackupCompleto>;

  if (dados.sistema !== "Estoque Visual Esquadrias") {
    throw new Error("Este arquivo não pertence ao Estoque Visual Esquadrias.");
  }

  if (!dados.backupVersion || dados.backupVersion < 2) {
    throw new Error(
      "Este backup é de uma versão antiga e não pode ser restaurado com segurança."
    );
  }

  for (const colecao of colecoesObrigatorias) {
    if (!Array.isArray(dados[colecao])) {
      throw new Error(`A seção ${colecao} está ausente ou inválida no backup.`);
    }
  }

  return dados as BackupCompleto;
}


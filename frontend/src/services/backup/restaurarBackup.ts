export type BackupCompleto = {
  sistema: string;
  empresa: string;
  versaoSistema: string;
  backupVersion: number;
  dataBackup: string;

  produtos: any[];
  fornecedores: any[];
  usuarios: any[];
  lixeira: any[];
};

export async function lerArquivoBackup(
  arquivo: File
): Promise<BackupCompleto> {
  const texto =
    await arquivo.text();

  const backup =
    JSON.parse(texto);

  if (
    backup.sistema !==
    "Controle de Estoque - Visual Esquadrias"
  ) {
    throw new Error(
      "Este arquivo não pertence ao sistema Visual Esquadrias."
    );
  }

  if (!backup.backupVersion) {
    throw new Error(
      "Versão do backup inválida."
    );
  }

  return backup;
}

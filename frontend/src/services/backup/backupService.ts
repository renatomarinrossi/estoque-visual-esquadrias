import { gerarBackup } from "../sistemaSupabase";

export async function fazerBackupCompleto() {
  const backup =
    await gerarBackup();

  const json = JSON.stringify(
    {
      sistema:
        "Controle de Estoque - Visual Esquadrias",

      empresa:
        "Visual Esquadrias",

      versaoSistema:
        backup.versaoSistema,

      backupVersion:
        backup.backupVersion,

      dataBackup:
        backup.dataBackup,

      produtos:
        backup.produtos,

      fornecedores:
        backup.fornecedores,

      usuarios:
        backup.usuarios,

      lixeira:
        backup.lixeira,
    },
    null,
    2
  );

  const blob =
    new Blob(
      [json],
      {
        type: "application/json",
      }
    );

  const url =
    URL.createObjectURL(blob);

  const link =
    document.createElement("a");

  const data =
    new Date()
      .toLocaleDateString("pt-BR")
      .replace(/\//g, "-");

  link.href = url;

  link.download =
    `Backup-Visual-Esquadrias-${data}.json`;

  document.body.appendChild(link);

  link.click();

  document.body.removeChild(link);

  URL.revokeObjectURL(url);

  const dataHora =
    new Date().toLocaleString(
      "pt-BR"
    );

  localStorage.setItem(
    "ultimoBackup",
    dataHora
  );

  return dataHora;
}

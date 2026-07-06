import { useEffect, useState } from "react";

import BancoCard from "../../components/sistema/BancoCard";
import BackupCard from "../../components/sistema/BackupCard";
import RestaurarCard from "../../components/sistema/RestaurarCard";
import InformacoesCard from "../../components/sistema/InformacoesCard";

import { SYSTEM } from "../../config/system";

import {
  gerarBackup,
  verificarBanco,
} from "../../services/sistemaSupabase";

export default function Sistema() {
  const [arquivoBackup, setArquivoBackup] =
    useState<File | null>(null);

  const [
    ultimoBackup,
    setUltimoBackup,
  ] = useState(() => {
    return (
      localStorage.getItem(
        "ultimoBackup"
      ) || "Nunca realizado"
    );
  });

  const [
    statusBanco,
    setStatusBanco,
  ] = useState<
    "ONLINE" | "OFFLINE"
  >("OFFLINE");

  useEffect(() => {
    async function carregarStatus() {
      const online =
        await verificarBanco();

      setStatusBanco(
        online
          ? "ONLINE"
          : "OFFLINE"
      );
    }

    carregarStatus();
  }, []);

  async function fazerBackup() {
    try {
      const backup =
        await gerarBackup();

      const json =
        JSON.stringify(
          {
            sistema:
              "Controle de Estoque - Visual Esquadrias",

            empresa:
              "Visual Esquadrias",

            versao:
              backup.versao,

            dataBackup:
              backup.dataBackup,

            produtos:
              backup.produtos,

            fornecedores:
              backup.fornecedores,

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
        URL.createObjectURL(
          blob
        );

      const link =
        document.createElement(
          "a"
        );

      const data =
        new Date()
          .toLocaleDateString(
            "pt-BR"
          )
          .replace(
            /\//g,
            "-"
          );

      link.href = url;

      link.download =
        `Backup-Visual-Esquadrias-${data}.json`;

      document.body.appendChild(
        link
      );

      link.click();

      document.body.removeChild(
        link
      );

      URL.revokeObjectURL(
        url
      );

      const dataHora =
        new Date().toLocaleString(
          "pt-BR"
        );

      setUltimoBackup(
        dataHora
      );

      localStorage.setItem(
        "ultimoBackup",
        dataHora
      );

      alert(
        "Backup realizado com sucesso!"
      );
    } catch (erro) {
      console.error(
        erro
      );

      alert(
        "Erro ao gerar o backup."
      );
    }
  }

  function restaurarBackup() {
    if (!arquivoBackup) {
      alert(
        "Selecione um arquivo de backup."
      );
      return;
    }

    alert(
      "A restauração será implementada na próxima sprint."
    );
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Sistema
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <BancoCard
          status={
            statusBanco
          }
        />

        <BackupCard
          ultimoBackup={
            ultimoBackup
          }
          onBackup={
            fazerBackup
          }
        />

        <RestaurarCard
          onSelecionarArquivo={
            setArquivoBackup
          }
          onRestaurar={
            restaurarBackup
          }
        />

        <InformacoesCard
          versao={
            SYSTEM.version
          }
          ultimaAtualizacao={
            SYSTEM.lastUpdate
          }
        />

      </div>

    </>
  );
}

import { useEffect, useState } from "react";

import BancoCard from "../../components/sistema/BancoCard";
import BackupCard from "../../components/sistema/BackupCard";
import RestaurarCard from "../../components/sistema/RestaurarCard";
import InformacoesCard from "../../components/sistema/InformacoesCard";

import { SYSTEM } from "../../config/system";

import {
  verificarBanco,
} from "../../services/sistemaSupabase";

import {
  fazerBackupCompleto,
} from "../../services/backup/backupService";

import {
  lerArquivoBackup,
} from "../../services/backup/restaurarBackup";

import useUsuario from "../../hooks/useUsuario";

export default function Sistema() {
  const usuario = useUsuario();

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
      const dataHora =
        await fazerBackupCompleto();

      setUltimoBackup(
        dataHora
      );

      alert(
        "Backup realizado com sucesso!"
      );
    } catch (erro) {
      console.error(erro);

      alert(
        "Erro ao gerar o backup."
      );
    }
  }

  async function restaurarBackup(
    arquivo: File
  ) {
    try {
      const backup =
        await lerArquivoBackup(
          arquivo
        );

      alert(
        `Backup válido!

Versão do Sistema:
${backup.versaoSistema}

Data:
${new Date(
  backup.dataBackup
).toLocaleString("pt-BR")}

Produtos:
${backup.produtos.length}

Fornecedores:
${backup.fornecedores.length}

Usuários:
${backup.usuarios.length}

Lixeira:
${backup.lixeira.length}

A restauração será implementada no próximo passo.`
      );
    } catch (erro: any) {
      console.error(erro);

      alert(
        erro.message ??
          "Arquivo de backup inválido."
      );
    }
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Sistema
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <BancoCard
          status={statusBanco}
        />

        {usuario?.perfil ===
          "DESENVOLVEDOR" && (
          <>
            <BackupCard
              ultimoBackup={
                ultimoBackup
              }
              onBackup={
                fazerBackup
              }
            />

            <RestaurarCard
              onRestaurar={
                restaurarBackup
              }
            />
          </>
        )}

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

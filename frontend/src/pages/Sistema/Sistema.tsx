import { useEffect, useState } from "react";

import BackupCard from "../../components/sistema/BackupCard";
import BancoCard from "../../components/sistema/BancoCard";
import InformacoesCard from "../../components/sistema/InformacoesCard";
import RestaurarCard from "../../components/sistema/RestaurarCard";
import { SYSTEM } from "../../config/system";
import useUsuario from "../../hooks/useUsuario";
import { fazerBackupCompleto } from "../../services/backup/backupService";
import { lerArquivoBackup } from "../../services/backup/restaurarBackup";
import { restaurarBackupCompleto } from "../../services/backup/restaurarBackupCompleto";
import { verificarBanco } from "../../services/sistemaSupabase";

export default function Sistema() {
  const usuario = useUsuario();
  const [ultimoBackup, setUltimoBackup] = useState(
    () => localStorage.getItem("ultimoBackup") || "Nunca realizado"
  );
  const [statusBanco, setStatusBanco] = useState<"ONLINE" | "OFFLINE">(
    "OFFLINE"
  );
  const [processando, setProcessando] = useState(false);

  useEffect(() => {
    async function carregarStatus() {
      setStatusBanco((await verificarBanco()) ? "ONLINE" : "OFFLINE");
    }

    void carregarStatus();
  }, []);

  async function fazerBackup() {
    setProcessando(true);

    try {
      const dataHora = await fazerBackupCompleto();
      setUltimoBackup(dataHora);
      alert("Backup completo gerado e baixado com sucesso.");
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível gerar o backup completo.");
    } finally {
      setProcessando(false);
    }
  }

  async function restaurarBackup(arquivo: File) {
    try {
      const backup = await lerArquivoBackup(arquivo);
      const resumo = [
        `Produtos: ${backup.produtos.length}`,
        `Fornecedores: ${backup.fornecedores.length}`,
        `Usuários: ${backup.usuarios.length}`,
        `Vendas: ${backup.vendas.length}`,
        `Parcelas: ${backup.vendas_parcelas.length}`,
        `Recebimentos: ${backup.vendas_recebimentos.length}`,
        `Contas a pagar: ${backup.contas_pagar.length}`,
      ].join("\n");

      const confirmar = window.confirm(
        `ATENÇÃO: a restauração substituirá todos os dados atuais do sistema.\n\n${resumo}\n\nDeseja continuar?`
      );

      if (!confirmar) return;

      const textoConfirmacao = window.prompt(
        'Para confirmar definitivamente, digite RESTAURAR:'
      );

      if (textoConfirmacao !== "RESTAURAR") {
        alert("Restauração cancelada.");
        return;
      }

      setProcessando(true);
      const resultado = await restaurarBackupCompleto(backup);

      alert(
        `Restauração concluída com sucesso.\n\nProdutos: ${resultado.produtos}\nVendas: ${resultado.vendas}\nParcelas: ${resultado.parcelas}\nRecebimentos: ${resultado.recebimentos}\nContas a pagar: ${resultado.contas_pagar}\n\nFaça login novamente para continuar.`
      );

      sessionStorage.removeItem("visual_usuario");
      window.location.href = "/";
    } catch (erro) {
      console.error(erro);
      const mensagem = erro instanceof Error ? erro.message : "Erro ao restaurar backup.";
      alert(mensagem);
    } finally {
      setProcessando(false);
    }
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">Sistema</h1>

      {processando && (
        <div className="mb-6 rounded-lg bg-amber-100 text-amber-900 p-4">
          Processando. Não feche a página até a operação terminar.
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BancoCard status={statusBanco} />

        {usuario?.perfil === "DESENVOLVEDOR" && (
          <>
            <BackupCard ultimoBackup={ultimoBackup} onBackup={fazerBackup} />
            <RestaurarCard onRestaurar={restaurarBackup} />
          </>
        )}

        <InformacoesCard
          versao={SYSTEM.version}
          ultimaAtualizacao={SYSTEM.lastUpdate}
        />
      </div>
    </>
  );
}


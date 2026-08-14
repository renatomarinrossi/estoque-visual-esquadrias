import { useCallback, useEffect, useMemo, useState } from "react";

import type { ModuloLogFinanceiro } from "../../types/LogFinanceiro";
import { buscarLogsFinanceiros } from "../../services/logsFinanceirosSupabase";

function dataParaISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function adicionarDias(data: string, quantidade: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const resultado = new Date(ano, mes - 1, dia);
  resultado.setDate(resultado.getDate() + quantidade);
  return dataParaISO(resultado);
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", {
    dateStyle: "short",
    timeStyle: "medium",
  });
}

function rotuloModulo(modulo: ModuloLogFinanceiro) {
  return modulo.replace(/_/g, " ");
}

function rotuloAcao(acao: string) {
  return acao.replace(/_/g, " ");
}

type Periodo = {
  dataInicial: string;
  dataFinal: string;
};

export default function LogsFinanceiros() {
  const criarPeriodoPadrao = () => {
    const dataFinalPadrao = dataParaISO(new Date());

    return {
      dataInicial: adicionarDias(dataFinalPadrao, -1),
      dataFinal: dataFinalPadrao,
    };
  };

  const periodoPadrao = useMemo(criarPeriodoPadrao, []);
  const [dataInicial, setDataInicial] = useState(periodoPadrao.dataInicial);
  const [dataFinal, setDataFinal] = useState(periodoPadrao.dataFinal);
  const [filtrosAplicados, setFiltrosAplicados] = useState(periodoPadrao);
  const [modulo, setModulo] = useState<"" | ModuloLogFinanceiro>("");
  const [moduloAplicado, setModuloAplicado] = useState<"" | ModuloLogFinanceiro>("");
  const [logs, setLogs] = useState<Awaited<ReturnType<typeof buscarLogsFinanceiros>>>([]);
  const [carregando, setCarregando] = useState(true);

  const carregarLogs = useCallback(async (filtros: Periodo) => {
    setCarregando(true);

    try {
      setLogs(await buscarLogsFinanceiros(filtros.dataInicial, filtros.dataFinal));
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar os logs financeiros.");
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => {
    void carregarLogs(periodoPadrao);
  }, [carregarLogs, periodoPadrao]);

  const logsFiltrados = useMemo(
    () =>
      moduloAplicado
        ? logs.filter((log) => log.modulo === moduloAplicado)
        : logs,
    [logs, moduloAplicado]
  );

  function aplicarFiltros() {
    if (dataInicial && dataFinal && dataInicial > dataFinal) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }

    const novosFiltros = { dataInicial, dataFinal };
    setFiltrosAplicados(novosFiltros);
    setModuloAplicado(modulo);
    void carregarLogs(novosFiltros);
  }

  function limparFiltros() {
    const novosFiltros = criarPeriodoPadrao();
    setDataInicial(novosFiltros.dataInicial);
    setDataFinal(novosFiltros.dataFinal);
    setFiltrosAplicados(novosFiltros);
    setModulo("");
    setModuloAplicado("");
    void carregarLogs(novosFiltros);
  }

  return (
    <>
      <div className="mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-blue-900">Logs Financeiros</h1>
          <p className="mt-1 text-gray-600">
            Histórico de alterações nas vendas, recebimentos e contas a pagar.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void carregarLogs(filtrosAplicados)}
          className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800"
        >
          Atualizar
        </button>
      </div>

      <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="mb-2 block font-semibold">Data inicial</label>
            <input
              type="date"
              value={dataInicial}
              onChange={(event) => setDataInicial(event.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold">Data final</label>
            <input
              type="date"
              value={dataFinal}
              onChange={(event) => setDataFinal(event.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold">Módulo</label>
            <select
              value={modulo}
              onChange={(event) => setModulo(event.target.value as "" | ModuloLogFinanceiro)}
              className="w-full rounded-lg border p-3"
            >
              <option value="">Todos</option>
              <option value="VENDAS">Vendas</option>
              <option value="RECEBIMENTOS">Recebimentos</option>
              <option value="CONTAS_A_PAGAR">Contas a Pagar</option>
            </select>
          </div>
        </div>

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={aplicarFiltros}
            className="rounded-lg bg-blue-700 px-4 py-2 text-white hover:bg-blue-800"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={limparFiltros}
            className="rounded-lg bg-gray-500 px-4 py-2 text-white hover:bg-gray-600"
          >
            Últimos 2 dias
          </button>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-md">
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-b">
              <th className="py-3 text-left">Data e hora</th>
              <th className="text-left">Usuário</th>
              <th className="text-center">Módulo</th>
              <th className="text-center">Ação</th>
              <th className="text-left">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  Carregando logs financeiros...
                </td>
              </tr>
            )}
            {!carregando && logsFiltrados.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-gray-500">
                  Nenhuma alteração encontrada para os filtros informados.
                </td>
              </tr>
            )}
            {!carregando && logsFiltrados.map((log) => (
              <tr key={log.id} className="border-b hover:bg-slate-50">
                <td className="py-3">{formatarDataHora(log.created_at)}</td>
                <td>{log.usuario_nome}</td>
                <td className="text-center">{rotuloModulo(log.modulo)}</td>
                <td className="text-center font-semibold text-blue-800">
                  {rotuloAcao(log.acao)}
                </td>
                <td>{log.descricao}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

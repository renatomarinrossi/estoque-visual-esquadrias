import { type FormEvent, useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type {
  ContaPagar,
  FormaPagamentoContaPagar,
} from "../../types/ContaPagar";

import {
  atualizarContaPagar,
  buscarContasPagar,
  confirmarPagamentoContaPagar,
  excluirContaPagar,
  inserirContaPagar,
} from "../../services/contaPagarSupabase";

const formasPagamento: FormaPagamentoContaPagar[] = [
  "PIX",
  "BOLETO",
  "CHEQUE_FISICA",
  "CHEQUE_JURIDICA",
];

function hoje() {
  return new Date().toISOString().split("T")[0];
}

function criarContaVazia(): ContaPagar {
  return {
    data_lancamento: hoje(),
    favorecido: "",
    descricao: "",
    valor: 0,
    forma_pagamento: "PIX",
    data_vencimento: hoje(),
    status: "EM_ABERTO",
    observacoes: "",
  };
}

function formatarMoeda(valor: number) {
  return Number(valor).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

function formatarData(data: string) {
  if (!data) return "-";

  const [ano, mes, dia] = data.split("-");

  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function rotulo(valor: string) {
  return valor.replace(/_/g, " ");
}

export default function ContasPagar() {
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [conta, setConta] = useState<ContaPagar>(criarContaVazia);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [carregando, setCarregando] = useState(true);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");
  const [favorecido, setFavorecido] = useState("");
  const [formaPagamento, setFormaPagamento] =
    useState<"" | FormaPagamentoContaPagar>("");

  async function carregarContas() {
    setCarregando(true);

    try {
      setContas(await buscarContasPagar());
    } catch (error) {
      console.error(error);
      alert("Não foi possível carregar as contas a pagar.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarContas();
  }, []);

  const contasFiltradas = useMemo(() => {
    const termoFavorecido = favorecido.trim().toLocaleLowerCase("pt-BR");

    return contas.filter((item) => {
      const dataInicialOk =
        !dataInicial || item.data_vencimento >= dataInicial;
      const dataFinalOk = !dataFinal || item.data_vencimento <= dataFinal;
      const favorecidoOk =
        !termoFavorecido ||
        item.favorecido.toLocaleLowerCase("pt-BR").includes(termoFavorecido);
      const formaOk =
        !formaPagamento || item.forma_pagamento === formaPagamento;

      return dataInicialOk && dataFinalOk && favorecidoOk && formaOk;
    });
  }, [contas, dataFinal, dataInicial, favorecido, formaPagamento]);

  const totalPendente = contasFiltradas
    .filter((item) => item.status === "EM_ABERTO")
    .reduce((total, item) => total + Number(item.valor), 0);
  const totalVencido = contasFiltradas
    .filter(
      (item) =>
        item.status === "EM_ABERTO" && item.data_vencimento < hoje()
    )
    .reduce((total, item) => total + Number(item.valor), 0);

  function fecharFormulario() {
    setConta(criarContaVazia());
    setMostrarFormulario(false);
  }

  async function salvarConta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!conta.favorecido.trim()) {
      alert("Informe o nome do favorecido.");
      return;
    }

    if (!conta.data_vencimento) {
      alert("Informe a data de vencimento.");
      return;
    }

    if (Number(conta.valor) <= 0) {
      alert("Informe um valor maior que zero.");
      return;
    }

    try {
      const dados = {
        ...conta,
        favorecido: conta.favorecido.trim(),
        valor: Number(conta.valor),
      };

      if (dados.id) {
        await atualizarContaPagar(dados);
      } else {
        await inserirContaPagar(dados);
      }

      await carregarContas();
      fecharFormulario();
    } catch (error) {
      console.error(error);
      alert("Não foi possível salvar a conta a pagar.");
    }
  }

  function editarConta(item: ContaPagar) {
    setConta({ ...item });
    setMostrarFormulario(true);
  }

  async function removerConta(item: ContaPagar) {
    if (!item.id) return;

    if (!window.confirm(`Excluir a conta de ${item.favorecido}?`)) return;

    try {
      await excluirContaPagar(item.id);
      await carregarContas();
    } catch (error) {
      console.error(error);
      alert("Não foi possível excluir a conta a pagar.");
    }
  }

  async function confirmarPagamento(item: ContaPagar) {
    if (!item.id) return;

    const confirmar = window.confirm(
      `Confirmar o pagamento de ${formatarMoeda(item.valor)} para ${item.favorecido}?`
    );

    if (!confirmar) return;

    try {
      await confirmarPagamentoContaPagar(item.id);
      await carregarContas();
    } catch (error) {
      console.error(error);
      alert("Não foi possível confirmar o pagamento.");
    }
  }

  function limparFiltros() {
    setDataInicial("");
    setDataFinal("");
    setFavorecido("");
    setFormaPagamento("");
  }

  function gerarRelatorio() {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Estoque Visual Esquadrias", 14, 18);
    doc.setFontSize(13);
    doc.text("Relatório de Contas a Pagar", 14, 27);
    doc.setFontSize(10);
    doc.text(
      `Período: ${dataInicial ? formatarData(dataInicial) : "Início"} até ${
        dataFinal ? formatarData(dataFinal) : "Hoje"
      }`,
      14,
      36
    );
    doc.text(`Total pendente: ${formatarMoeda(totalPendente)}`, 14, 42);
    doc.text(`Contas no relatório: ${contasFiltradas.length}`, 14, 48);

    autoTable(doc, {
      startY: 56,
      head: [["Favorecido", "Vencimento", "Valor", "Forma", "Status"]],
      body: contasFiltradas.map((item) => [
        item.favorecido,
        formatarData(item.data_vencimento),
        formatarMoeda(item.valor),
        rotulo(item.forma_pagamento),
        rotulo(item.status),
      ]),
      styles: { fontSize: 9 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    doc.save("contas-a-pagar.pdf");
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-4xl font-bold text-blue-900">Contas a Pagar</h1>
          <p className="mt-1 text-gray-600">
            Despesas e compromissos financeiros cadastrados.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={gerarRelatorio}
            disabled={carregando || contasFiltradas.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-3 rounded-lg"
          >
            Gerar PDF
          </button>
          <button
            type="button"
            onClick={() => {
              setConta(criarContaVazia());
              setMostrarFormulario(true);
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
          >
            Nova conta
          </button>
        </div>
      </div>

      {mostrarFormulario && (
        <form onSubmit={salvarConta} className="bg-white rounded-xl shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-blue-900 mb-6">
            {conta.id ? "Editar conta a pagar" : "Nova conta a pagar"}
          </h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4">
            <div>
              <label className="block mb-2 font-semibold">Nome</label>
              <input
                type="text"
                value={conta.favorecido}
                onChange={(event) =>
                  setConta((anterior) => ({
                    ...anterior,
                    favorecido: event.target.value,
                  }))
                }
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Data de vencimento</label>
              <input
                type="date"
                value={conta.data_vencimento}
                onChange={(event) =>
                  setConta((anterior) => ({
                    ...anterior,
                    data_vencimento: event.target.value,
                    data_lancamento: event.target.value,
                  }))
                }
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Valor</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={conta.valor || ""}
                onChange={(event) =>
                  setConta((anterior) => ({
                    ...anterior,
                    valor: Number(event.target.value),
                  }))
                }
                className="w-full border rounded-lg p-3"
              />
            </div>
            <div>
              <label className="block mb-2 font-semibold">Forma de pagamento</label>
              <select
                value={conta.forma_pagamento}
                onChange={(event) =>
                  setConta((anterior) => ({
                    ...anterior,
                    forma_pagamento: event.target.value as FormaPagamentoContaPagar,
                  }))
                }
                className="w-full border rounded-lg p-3"
              >
                {formasPagamento.map((forma) => (
                  <option key={forma} value={forma}>
                    {rotulo(forma)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={fecharFormulario}
              className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg"
            >
              Salvar
            </button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500">Total pendente</div>
          <div className="mt-1 text-2xl font-bold text-blue-900">
            {formatarMoeda(totalPendente)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500">Valor vencido</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {formatarMoeda(totalVencido)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500">Contas encontradas</div>
          <div className="mt-1 text-2xl font-bold text-blue-900">
            {contasFiltradas.length}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="block mb-2 font-semibold">Vencimento inicial</label>
            <input type="date" value={dataInicial} onChange={(event) => setDataInicial(event.target.value)} className="w-full border rounded-lg p-3" />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Vencimento final</label>
            <input type="date" value={dataFinal} onChange={(event) => setDataFinal(event.target.value)} className="w-full border rounded-lg p-3" />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Nome</label>
            <input type="text" value={favorecido} onChange={(event) => setFavorecido(event.target.value)} placeholder="Buscar nome" className="w-full border rounded-lg p-3" />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Forma de pagamento</label>
            <select value={formaPagamento} onChange={(event) => setFormaPagamento(event.target.value as "" | FormaPagamentoContaPagar)} className="w-full border rounded-lg p-3">
              <option value="">Todas</option>
              {formasPagamento.map((forma) => <option key={forma} value={forma}>{rotulo(forma)}</option>)}
            </select>
          </div>
        </div>
        <button type="button" onClick={limparFiltros} className="mt-5 bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg">
          Limpar filtros
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Nome</th>
              <th className="text-center">Vencimento</th>
              <th className="text-right">Valor</th>
              <th className="text-center">Forma de pagamento</th>
              <th className="text-center">Status</th>
              <th className="text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {carregando && <tr><td colSpan={6} className="py-8 text-center text-gray-500">Carregando contas a pagar...</td></tr>}
            {!carregando && contasFiltradas.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">Nenhuma conta encontrada para os filtros informados.</td></tr>}
            {!carregando && contasFiltradas.map((item) => (
              <tr key={item.id} className="border-b hover:bg-slate-50">
                <td className="py-3">{item.favorecido}</td>
                <td className="text-center">{formatarData(item.data_vencimento)}</td>
                <td className="text-right">{formatarMoeda(item.valor)}</td>
                <td className="text-center">{rotulo(item.forma_pagamento)}</td>
                <td className={`text-center font-bold ${item.status === "PAGO" ? "text-green-600" : "text-yellow-600"}`}>
                  {rotulo(item.status)}
                </td>
                <td>
                  <div className="flex justify-center gap-2">
                    {item.status === "EM_ABERTO" && (
                      <button
                        type="button"
                        onClick={() => void confirmarPagamento(item)}
                        className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                      >
                        Confirmar pagamento
                      </button>
                    )}
                    <button type="button" onClick={() => editarConta(item)} className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded">Editar</button>
                    <button type="button" onClick={() => void removerConta(item)} className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded">Excluir</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


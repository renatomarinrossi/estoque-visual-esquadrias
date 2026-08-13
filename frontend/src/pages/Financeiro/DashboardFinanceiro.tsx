import { useEffect, useMemo, useState } from "react";

import type { ContaPagar } from "../../types/ContaPagar";
import type { ContaReceber } from "../../types/ContaReceber";

import {
  buscarContasPagar,
} from "../../services/contaPagarSupabase";
import {
  buscarContasReceber,
} from "../../services/contasReceberSupabase";
import { carregarGeradorPdf } from "../../services/geradorPdf";

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

export default function DashboardFinanceiro() {
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  async function carregarDados() {
    setCarregando(true);

    try {
      const [dadosReceber, dadosPagar] = await Promise.all([
        buscarContasReceber(),
        buscarContasPagar(),
      ]);

      setContasReceber(dadosReceber);
      setContasPagar(dadosPagar);
    } catch (error) {
      console.error(error);
      alert("Não foi possível carregar o dashboard financeiro.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  const contasReceberFiltradas = useMemo(
    () =>
      contasReceber.filter((conta) => {
        if (conta.forma_pagamento === "CONDICIONADO_ENTREGA") return true;

        return (
          (!dataInicial || conta.data_vencimento >= dataInicial) &&
          (!dataFinal || conta.data_vencimento <= dataFinal)
        );
      }),
    [contasReceber, dataFinal, dataInicial]
  );

  const contasPagarFiltradas = useMemo(
    () =>
      contasPagar.filter(
        (conta) =>
          conta.status === "EM_ABERTO" &&
          (!dataInicial || conta.data_vencimento >= dataInicial) &&
          (!dataFinal || conta.data_vencimento <= dataFinal)
      ),
    [contasPagar, dataFinal, dataInicial]
  );

  const hoje = new Date().toISOString().split("T")[0];
  const totalReceber = contasReceberFiltradas.reduce(
    (total, conta) => total + conta.saldo,
    0
  );
  const totalPagar = contasPagarFiltradas.reduce(
    (total, conta) => total + Number(conta.valor),
    0
  );
  const saldoProjetado = totalReceber - totalPagar;
  const receberAtrasado = contasReceberFiltradas
    .filter(
      (conta) =>
        conta.forma_pagamento !== "CONDICIONADO_ENTREGA" &&
        conta.data_vencimento < hoje
    )
    .reduce((total, conta) => total + conta.saldo, 0);
  const pagarVencido = contasPagarFiltradas
    .filter((conta) => conta.data_vencimento < hoje)
    .reduce((total, conta) => total + Number(conta.valor), 0);

  function limparPeriodo() {
    setDataInicial("");
    setDataFinal("");
  }

  async function gerarRelatorio() {
    const { jsPDF, autoTable } = await carregarGeradorPdf();
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Estoque Visual Esquadrias", 14, 18);
    doc.setFontSize(13);
    doc.text("Relatório do Dashboard Financeiro", 14, 27);
    doc.setFontSize(10);
    doc.text(
      `Período: ${dataInicial ? formatarData(dataInicial) : "Início"} até ${
        dataFinal ? formatarData(dataFinal) : "Hoje"
      }`,
      14,
      36
    );
    doc.text(`Total a receber: ${formatarMoeda(totalReceber)}`, 14, 43);
    doc.text(`Total a pagar: ${formatarMoeda(totalPagar)}`, 14, 50);
    doc.text(`Saldo projetado: ${formatarMoeda(saldoProjetado)}`, 14, 57);

    autoTable(doc, {
      startY: 65,
      head: [["Contas a receber", "Vencimento", "Forma", "Saldo"]],
      body: contasReceberFiltradas.map((conta) => [
        conta.cliente,
        formatarData(conta.data_vencimento),
        rotulo(conta.forma_pagamento),
        formatarMoeda(conta.saldo),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [22, 163, 74] },
    });

    const primeiraTabela = doc as typeof doc & {
      lastAutoTable?: { finalY: number };
    };
    const inicioPagar = (primeiraTabela.lastAutoTable?.finalY ?? 65) + 12;

    doc.setFontSize(12);
    doc.text("Contas a pagar", 14, inicioPagar);

    autoTable(doc, {
      startY: inicioPagar + 5,
      head: [["Nome", "Vencimento", "Forma", "Valor"]],
      body: contasPagarFiltradas.map((conta) => [
        conta.favorecido,
        formatarData(conta.data_vencimento),
        rotulo(conta.forma_pagamento),
        formatarMoeda(conta.valor),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [220, 38, 38] },
    });

    doc.save("dashboard-financeiro.pdf");
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-4xl font-bold text-blue-900">Dashboard Financeiro</h1>
          <p className="mt-1 text-gray-600">
            Visão consolidada de valores a receber e a pagar.
          </p>
        </div>

        <div className="flex gap-3">
          <button type="button" onClick={() => void carregarDados()} className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg">
            Atualizar
          </button>
          <button type="button" onClick={gerarRelatorio} disabled={carregando} className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-3 rounded-lg">
            Gerar PDF
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div>
            <label className="block mb-2 font-semibold">Data inicial</label>
            <input type="date" value={dataInicial} onChange={(event) => setDataInicial(event.target.value)} className="w-full border rounded-lg p-3" />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Data final</label>
            <input type="date" value={dataFinal} onChange={(event) => setDataFinal(event.target.value)} className="w-full border rounded-lg p-3" />
          </div>
          <div className="flex items-end">
            <button type="button" onClick={limparPeriodo} className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-3 rounded-lg">
              Limpar período
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-green-600">
          <div className="text-sm text-gray-500">A receber</div>
          <div className="mt-1 text-2xl font-bold text-green-700">{formatarMoeda(totalReceber)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-red-600">
          <div className="text-sm text-gray-500">A pagar</div>
          <div className="mt-1 text-2xl font-bold text-red-600">{formatarMoeda(totalPagar)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-blue-700">
          <div className="text-sm text-gray-500">Saldo projetado</div>
          <div className={`mt-1 text-2xl font-bold ${saldoProjetado >= 0 ? "text-blue-900" : "text-red-600"}`}>{formatarMoeda(saldoProjetado)}</div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5 border-l-4 border-amber-500">
          <div className="text-sm text-gray-500">Em atraso / vencido</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">{formatarMoeda(receberAtrasado + pagarVencido)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
          <h2 className="text-xl font-bold text-green-700 mb-4">Contas a Receber</h2>
          <table className="w-full min-w-[520px]">
            <thead><tr className="border-b"><th className="text-left py-3">Cliente</th><th className="text-center">Vencimento</th><th className="text-right">Saldo</th></tr></thead>
            <tbody>
              {carregando && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Carregando...</td></tr>}
              {!carregando && contasReceberFiltradas.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhuma conta a receber.</td></tr>}
              {!carregando && contasReceberFiltradas.map((conta) => <tr key={conta.parcela_id} className="border-b"><td className="py-3">{conta.cliente}</td><td className="text-center">{conta.forma_pagamento === "CONDICIONADO_ENTREGA" ? "Condicionado" : formatarData(conta.data_vencimento)}</td><td className="text-right text-green-700">{formatarMoeda(conta.saldo)}</td></tr>)}
            </tbody>
          </table>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
          <h2 className="text-xl font-bold text-red-600 mb-4">Contas a Pagar</h2>
          <table className="w-full min-w-[520px]">
            <thead><tr className="border-b"><th className="text-left py-3">Nome</th><th className="text-center">Vencimento</th><th className="text-right">Valor</th></tr></thead>
            <tbody>
              {carregando && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Carregando...</td></tr>}
              {!carregando && contasPagarFiltradas.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhuma conta a pagar.</td></tr>}
              {!carregando && contasPagarFiltradas.map((conta) => <tr key={conta.id} className="border-b"><td className="py-3">{conta.favorecido}</td><td className="text-center">{formatarData(conta.data_vencimento)}</td><td className="text-right text-red-600">{formatarMoeda(conta.valor)}</td></tr>)}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

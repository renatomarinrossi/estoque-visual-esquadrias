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
import { adicionarCabecalhoPdf } from "../../services/cabecalhoPdf";

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

function dataParaISO(data: Date) {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
}

function obterHoje() {
  return dataParaISO(new Date());
}

function adicionarDias(data: string, quantidade: number) {
  const [ano, mes, dia] = data.split("-").map(Number);
  const resultado = new Date(ano, mes - 1, dia);
  resultado.setDate(resultado.getDate() + quantidade);
  return dataParaISO(resultado);
}

export default function DashboardFinanceiro() {
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dataInicial, setDataInicial] = useState(() => obterHoje());
  const [dataFinal, setDataFinal] = useState(() => adicionarDias(obterHoje(), 15));

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
      contasReceber.filter(
        (conta) =>
          conta.forma_pagamento !== "CONDICIONADO_ENTREGA" &&
          (!dataInicial || conta.data_vencimento >= dataInicial) &&
          (!dataFinal || conta.data_vencimento <= dataFinal)
      ),
    [contasReceber, dataFinal, dataInicial]
  );

  const contasCondicionadas = useMemo(
    () =>
      contasReceber.filter(
        (conta) => conta.forma_pagamento === "CONDICIONADO_ENTREGA"
      ),
    [contasReceber]
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
  const totalCondicionado = contasCondicionadas.reduce(
    (total, conta) => total + conta.saldo,
    0
  );
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

    await adicionarCabecalhoPdf(doc, "Relatório do Dashboard Financeiro");
    doc.setFontSize(10);
    doc.text(
      `Período: ${dataInicial ? formatarData(dataInicial) : "Início"} até ${
        dataFinal ? formatarData(dataFinal) : "Hoje"
      }`,
      14,
      43
    );

    const adicionarFaixaResumo = (
      texto: string,
      cor: [number, number, number],
      posicaoInicial: number
    ) => {
      const alturaFaixa = 9;
      const limitePagina = doc.internal.pageSize.getHeight() - 14;
      let posicaoFaixa = posicaoInicial;

      if (posicaoFaixa + alturaFaixa > limitePagina) {
        doc.addPage();
        posicaoFaixa = 14;
      }

      doc.setFillColor(...cor);
      doc.rect(14, posicaoFaixa, 182, alturaFaixa, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(texto, 105, posicaoFaixa + 5.8, { align: "center" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      return posicaoFaixa + alturaFaixa;
    };

    const adicionarTituloSecao = (
      titulo: string,
      cor: [number, number, number],
      posicaoInicial: number
    ) => {
      const alturaFaixa = 8;
      const limitePagina = doc.internal.pageSize.getHeight() - 14;
      let posicaoFaixa = posicaoInicial;

      if (posicaoFaixa + 18 > limitePagina) {
        doc.addPage();
        posicaoFaixa = 14;
      }

      doc.setFillColor(...cor);
      doc.rect(14, posicaoFaixa, 182, alturaFaixa, "F");
      doc.setFontSize(10);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(titulo, 16, posicaoFaixa + 5.5);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      return posicaoFaixa + alturaFaixa;
    };

    const obterFinalTabela = (posicaoPadrao: number) => {
      const tabela = doc as typeof doc & {
        lastAutoTable?: { finalY: number };
      };

      return tabela.lastAutoTable?.finalY ?? posicaoPadrao;
    };

    const prepararInicioSecao = (posicaoAnterior: number) => {
      const limitePagina = doc.internal.pageSize.getHeight() - 14;
      const inicioSugerido = posicaoAnterior + 4;

      if (inicioSugerido + 18 > limitePagina) {
        doc.addPage();
        return 20;
      }

      return inicioSugerido;
    };

    const inicioTabelaReceber = adicionarTituloSecao(
      "Contas a receber",
      [22, 163, 74],
      50
    );

    autoTable(doc, {
      startY: inicioTabelaReceber,
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

    const fimReceber = adicionarFaixaResumo(
      `Total a receber: ${formatarMoeda(totalReceber)}`,
      [22, 163, 74],
      obterFinalTabela(inicioTabelaReceber)
    );
    const inicioCondicionados = prepararInicioSecao(fimReceber);
    const inicioTabelaCondicionados = adicionarTituloSecao(
      "Condicionados à entrega",
      [161, 98, 7],
      inicioCondicionados
    );

    autoTable(doc, {
      startY: inicioTabelaCondicionados,
      head: [["Cliente", "Parcela", "Saldo"]],
      body: contasCondicionadas.map((conta) => [
        conta.cliente,
        `${conta.numero_parcela}/${conta.total_parcelas}`,
        formatarMoeda(conta.saldo),
      ]),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [161, 98, 7] },
    });

    const fimCondicionados = adicionarFaixaResumo(
      `Total condicionado à entrega: ${formatarMoeda(totalCondicionado)}`,
      [161, 98, 7],
      obterFinalTabela(inicioTabelaCondicionados)
    );
    const inicioPagar = prepararInicioSecao(fimCondicionados);
    const inicioTabelaPagar = adicionarTituloSecao(
      "Contas a pagar",
      [220, 38, 38],
      inicioPagar
    );

    autoTable(doc, {
      startY: inicioTabelaPagar,
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

    adicionarFaixaResumo(
      `Total a pagar: ${formatarMoeda(totalPagar)}`,
      [220, 38, 38],
      obterFinalTabela(inicioTabelaPagar)
    );

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
        <div className="flex items-center gap-4 rounded-xl border-l-4 border-green-600 bg-white p-5 shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-600 text-lg font-bold text-white">R$</div>
          <div><div className="text-sm font-semibold text-green-700">Total a receber</div><div className="mt-1 text-2xl font-bold text-green-700">{formatarMoeda(totalReceber)}</div></div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border-l-4 border-amber-600 bg-white p-5 shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-600 text-xl font-bold text-white">C</div>
          <div><div className="text-sm font-semibold text-amber-700">Condicionado à entrega</div><div className="mt-1 text-2xl font-bold text-amber-700">{formatarMoeda(totalCondicionado)}</div></div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border-l-4 border-red-600 bg-white p-5 shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-2xl font-bold text-white">-</div>
          <div><div className="text-sm font-semibold text-red-600">Total a pagar</div><div className="mt-1 text-2xl font-bold text-red-600">{formatarMoeda(totalPagar)}</div></div>
        </div>
        <div className="flex items-center gap-4 rounded-xl border-l-4 border-orange-500 bg-white p-5 shadow-md">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-orange-500 text-xl font-bold text-white">!</div>
          <div><div className="text-sm font-semibold text-orange-700">Em atraso / vencido</div><div className="mt-1 text-2xl font-bold text-orange-700">{formatarMoeda(receberAtrasado + pagarVencido)}</div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 border-b pb-2.5 text-lg font-bold text-green-700">Contas a Receber</h2>
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="border-b text-xs uppercase tracking-wide text-slate-600"><th className="text-left py-2.5">Cliente</th><th className="text-center">Vencimento</th><th className="text-right">Saldo</th></tr></thead>
            <tbody>
              {carregando && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Carregando...</td></tr>}
              {!carregando && contasReceberFiltradas.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhuma conta a receber.</td></tr>}
              {!carregando && contasReceberFiltradas.map((conta, index) => <tr key={conta.parcela_id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-blue-50/35"}`}><td className="py-2 text-[13px] font-medium text-slate-800">{conta.cliente}</td><td className="text-center">{formatarData(conta.data_vencimento)}</td><td className="text-right text-green-700">{formatarMoeda(conta.saldo)}</td></tr>)}
            </tbody>
            <tfoot><tr className="border-t-2 border-green-600 font-bold text-green-700"><td colSpan={2} className="py-2.5">Total</td><td className="text-right">{formatarMoeda(totalReceber)}</td></tr></tfoot>
          </table>
        </div>
        <div className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm">
          <h2 className="mb-2 border-b pb-2.5 text-lg font-bold text-red-600">Contas a Pagar</h2>
          <table className="w-full min-w-[520px] text-sm">
            <thead><tr className="border-b text-xs uppercase tracking-wide text-slate-600"><th className="text-left py-2.5">Nome</th><th className="text-center">Vencimento</th><th className="text-right">Valor</th></tr></thead>
            <tbody>
              {carregando && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Carregando...</td></tr>}
              {!carregando && contasPagarFiltradas.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhuma conta a pagar.</td></tr>}
              {!carregando && contasPagarFiltradas.map((conta, index) => <tr key={conta.id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-blue-50/35"}`}><td className="py-2 text-[13px] font-medium text-slate-800">{conta.favorecido}</td><td className="text-center">{formatarData(conta.data_vencimento)}</td><td className="text-right text-red-600">{formatarMoeda(conta.valor)}</td></tr>)}
            </tbody>
            <tfoot><tr className="border-t-2 border-red-600 font-bold text-red-600"><td colSpan={2} className="py-2.5">Total</td><td className="text-right">{formatarMoeda(totalPagar)}</td></tr></tfoot>
          </table>
        </div>
        <div className="overflow-x-auto rounded-xl bg-white p-5 shadow-sm xl:col-span-2">
          <h2 className="mb-2 border-b pb-2.5 text-lg font-bold text-amber-700">Condicionados à Entrega</h2>
          <table className="w-full min-w-[720px] text-sm">
            <thead><tr className="border-b text-xs uppercase tracking-wide text-slate-600"><th className="text-left py-2.5">Cliente</th><th className="text-center">Parcela</th><th className="text-right">Saldo</th></tr></thead>
            <tbody>
              {carregando && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Carregando...</td></tr>}
              {!carregando && contasCondicionadas.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhuma conta condicionada à entrega.</td></tr>}
              {!carregando && contasCondicionadas.map((conta, index) => <tr key={conta.parcela_id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-blue-50/35"}`}><td className="py-2 text-[13px] font-medium text-slate-800">{conta.cliente}</td><td className="text-center">{conta.numero_parcela}/{conta.total_parcelas}</td><td className="text-right text-amber-700">{formatarMoeda(conta.saldo)}</td></tr>)}
            </tbody>
            <tfoot><tr className="border-t-2 border-amber-600 font-bold text-amber-700"><td colSpan={2} className="py-2.5">Total</td><td className="text-right">{formatarMoeda(totalCondicionado)}</td></tr></tfoot>
          </table>
        </div>
      </div>
    </>
  );
}



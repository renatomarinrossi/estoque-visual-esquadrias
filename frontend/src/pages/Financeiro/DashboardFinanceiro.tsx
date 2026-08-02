import { useEffect, useMemo, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { ContaPagar } from "../../types/ContaPagar";
import type { ContaReceber } from "../../types/ContaReceber";
import { buscarContasPagar } from "../../services/contaPagarSupabase";
import { buscarContasReceber } from "../../services/contasReceberSupabase";

const formatarMoeda = (valor: number) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatarData = (data: string) => { if (!data) return "-"; const [ano, mes, dia] = data.split("-"); return ano && mes && dia ? `${dia}/${mes}/${ano}` : data; };
const rotulo = (valor: string) => valor.replace(/_/g, " ");
const hoje = () => new Date().toISOString().slice(0, 10);

export default function DashboardFinanceiro() {
  const [contasReceber, setContasReceber] = useState<ContaReceber[]>([]);
  const [contasPagar, setContasPagar] = useState<ContaPagar[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dataInicial, setDataInicial] = useState("");
  const [dataFinal, setDataFinal] = useState("");

  async function carregarDados() {
    setCarregando(true);
    try {
      const [dadosReceber, dadosPagar] = await Promise.all([buscarContasReceber(), buscarContasPagar()]);
      setContasReceber(dadosReceber);
      setContasPagar(dadosPagar);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar o dashboard financeiro.");
    } finally { setCarregando(false); }
  }

  useEffect(() => { void carregarDados(); }, []);

  const contasReceberNoPeriodo = useMemo(() => contasReceber.filter((conta) =>
    conta.forma_pagamento !== "CONDICIONADO_ENTREGA" &&
    (!dataInicial || conta.data_vencimento >= dataInicial) &&
    (!dataFinal || conta.data_vencimento <= dataFinal)
  ), [contasReceber, dataFinal, dataInicial]);

  const condicionadosEntrega = useMemo(() => contasReceber.filter((conta) => conta.forma_pagamento === "CONDICIONADO_ENTREGA"), [contasReceber]);

  const contasPagarNoPeriodo = useMemo(() => contasPagar.filter((conta) =>
    conta.status === "EM_ABERTO" &&
    (!dataInicial || conta.data_vencimento >= dataInicial) &&
    (!dataFinal || conta.data_vencimento <= dataFinal)
  ), [contasPagar, dataFinal, dataInicial]);

  const totalReceber = contasReceberNoPeriodo.reduce((total, conta) => total + conta.saldo, 0);
  const totalCondicionados = condicionadosEntrega.reduce((total, conta) => total + conta.saldo, 0);
  const totalPagar = contasPagarNoPeriodo.reduce((total, conta) => total + Number(conta.valor), 0);
  const saldoProjetado = totalReceber - totalPagar;
  const receberAtrasado = contasReceber.filter((conta) => conta.forma_pagamento !== "CONDICIONADO_ENTREGA" && conta.data_vencimento < hoje()).reduce((total, conta) => total + conta.saldo, 0);
  const pagarVencido = contasPagar.filter((conta) => conta.status === "EM_ABERTO" && conta.data_vencimento < hoje()).reduce((total, conta) => total + Number(conta.valor), 0);

  function gerarRelatorio() {
    const doc = new jsPDF();
    doc.setFontSize(18); doc.text("Estoque Visual Esquadrias", 14, 18);
    doc.setFontSize(13); doc.text("Relatório do Dashboard Financeiro", 14, 27);
    doc.setFontSize(10); doc.text(`Período: ${dataInicial ? formatarData(dataInicial) : "Início"} até ${dataFinal ? formatarData(dataFinal) : "Sem limite"}`, 14, 36);
    doc.text(`A receber no período: ${formatarMoeda(totalReceber)}`, 14, 43);
    doc.text(`A pagar no período: ${formatarMoeda(totalPagar)}`, 14, 50);
    doc.text(`Saldo projetado: ${formatarMoeda(saldoProjetado)}`, 14, 57);
    autoTable(doc, { startY: 65, head: [["Contas a receber no período", "Vencimento", "Forma", "Saldo"]], body: contasReceberNoPeriodo.map((conta) => [conta.cliente, formatarData(conta.data_vencimento), rotulo(conta.forma_pagamento), formatarMoeda(conta.saldo)]), styles: { fontSize: 8 }, headStyles: { fillColor: [22, 163, 74] } });
    const tabelaReceber = doc as jsPDF & { lastAutoTable?: { finalY: number } };
    const inicioPagar = (tabelaReceber.lastAutoTable?.finalY ?? 65) + 12;
    doc.setFontSize(12); doc.text("Contas a pagar no período", 14, inicioPagar);
    autoTable(doc, { startY: inicioPagar + 5, head: [["Nome", "Vencimento", "Meio", "Valor"]], body: contasPagarNoPeriodo.map((conta) => [conta.favorecido, formatarData(conta.data_vencimento), rotulo(conta.forma_pagamento), formatarMoeda(conta.valor)]), styles: { fontSize: 8 }, headStyles: { fillColor: [220, 38, 38] } });
    const tabelaPagar = doc as jsPDF & { lastAutoTable?: { finalY: number } };
    const inicioCondicionados = (tabelaPagar.lastAutoTable?.finalY ?? inicioPagar + 5) + 12;
    doc.setFontSize(12); doc.text("Condicionados à entrega", 14, inicioCondicionados);
    autoTable(doc, { startY: inicioCondicionados + 5, head: [["Cliente", "Descrição", "Saldo"]], body: condicionadosEntrega.length ? condicionadosEntrega.map((conta) => [conta.cliente, conta.descricao_entrega || "-", formatarMoeda(conta.saldo)]) : [["-", "Nenhum condicionado pendente.", "-"]], styles: { fontSize: 8 }, headStyles: { fillColor: [217, 119, 6] } });
    doc.save("dashboard-financeiro.pdf");
  }

  const Card = ({ titulo, valor, cor }: { titulo: string; valor: number; cor: string }) => <div className={`rounded-xl border-l-4 bg-white p-5 shadow-sm ${cor}`}><div className="text-sm text-gray-500">{titulo}</div><div className="mt-1 text-2xl font-bold">{formatarMoeda(valor)}</div></div>;

  return <>
    <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between"><div><h1 className="text-4xl font-bold text-blue-900">Dashboard Financeiro</h1><p className="mt-1 text-gray-600">Visão consolidada de valores a receber e a pagar.</p></div><div className="flex gap-3"><button type="button" onClick={() => void carregarDados()} className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800">Atualizar</button><button type="button" onClick={gerarRelatorio} disabled={carregando} className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700 disabled:bg-red-400">Gerar PDF</button></div></div>
    <div className="mb-6 rounded-xl bg-white p-6 shadow-md"><div className="grid grid-cols-1 gap-4 md:grid-cols-3"><div><label className="mb-2 block font-semibold">Data inicial</label><input type="date" value={dataInicial} onChange={(event) => setDataInicial(event.target.value)} className="w-full rounded-lg border p-3" /></div><div><label className="mb-2 block font-semibold">Data final</label><input type="date" value={dataFinal} onChange={(event) => setDataFinal(event.target.value)} className="w-full rounded-lg border p-3" /></div><div className="flex items-end"><button type="button" onClick={() => { setDataInicial(""); setDataFinal(""); }} className="rounded-lg bg-gray-500 px-4 py-3 text-white hover:bg-gray-600">Limpar período</button></div></div></div>
    <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5"><Card titulo="A receber no período" valor={totalReceber} cor="border-green-600 text-green-700" /><Card titulo="Condicionados à entrega" valor={totalCondicionados} cor="border-amber-500 text-amber-700" /><Card titulo="A pagar no período" valor={totalPagar} cor="border-red-600 text-red-600" /><Card titulo="Saldo projetado" valor={saldoProjetado} cor={saldoProjetado >= 0 ? "border-blue-700 text-blue-900" : "border-red-600 text-red-600"} /><Card titulo="Em atraso / vencido" valor={receberAtrasado + pagarVencido} cor="border-orange-500 text-orange-700" /></div>
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-2"><div className="overflow-x-auto rounded-xl bg-white p-6 shadow-md"><h2 className="mb-4 text-xl font-bold text-green-700">Contas a Receber no Período</h2><table className="w-full min-w-[520px]"><thead><tr className="border-b"><th className="py-3 text-left">Cliente</th><th className="text-center">Vencimento</th><th className="text-right">Saldo</th></tr></thead><tbody>{carregando && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Carregando...</td></tr>}{!carregando && contasReceberNoPeriodo.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhuma conta a receber no período.</td></tr>}{!carregando && contasReceberNoPeriodo.map((conta) => <tr key={conta.parcela_id} className="border-b"><td className="py-3">{conta.cliente}</td><td className="text-center">{formatarData(conta.data_vencimento)}</td><td className="text-right text-green-700">{formatarMoeda(conta.saldo)}</td></tr>)}</tbody></table></div><div className="overflow-x-auto rounded-xl bg-white p-6 shadow-md"><h2 className="mb-4 text-xl font-bold text-red-600">Contas a Pagar no Período</h2><table className="w-full min-w-[520px]"><thead><tr className="border-b"><th className="py-3 text-left">Nome</th><th className="text-center">Vencimento</th><th className="text-right">Valor</th></tr></thead><tbody>{carregando && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Carregando...</td></tr>}{!carregando && contasPagarNoPeriodo.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhuma conta a pagar no período.</td></tr>}{!carregando && contasPagarNoPeriodo.map((conta) => <tr key={conta.id} className="border-b"><td className="py-3">{conta.favorecido}</td><td className="text-center">{formatarData(conta.data_vencimento)}</td><td className="text-right text-red-600">{formatarMoeda(conta.valor)}</td></tr>)}</tbody></table></div></div>
    <div className="mt-6 overflow-x-auto rounded-xl bg-white p-6 shadow-md"><div className="mb-4 flex items-center justify-between"><h2 className="text-xl font-bold text-amber-700">Condicionados à Entrega</h2><span className="font-semibold text-amber-700">{formatarMoeda(totalCondicionados)}</span></div><table className="w-full min-w-[620px]"><thead><tr className="border-b"><th className="py-3 text-left">Cliente</th><th className="text-left">Descrição</th><th className="text-right">Saldo</th></tr></thead><tbody>{!carregando && condicionadosEntrega.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-gray-500">Nenhum condicionado à entrega pendente.</td></tr>}{!carregando && condicionadosEntrega.map((conta) => <tr key={conta.parcela_id} className="border-b"><td className="py-3">{conta.cliente}</td><td>{conta.descricao_entrega || "-"}</td><td className="text-right text-amber-700">{formatarMoeda(conta.saldo)}</td></tr>)}</tbody></table></div>
  </>;
}


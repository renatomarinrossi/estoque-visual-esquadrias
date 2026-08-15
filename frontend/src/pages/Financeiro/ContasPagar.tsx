import { type FormEvent, useEffect, useMemo, useState } from "react";
import type { ContaPagar, FormaPagamentoContaPagar } from "../../types/ContaPagar";
import { atualizarContaPagar, buscarContasPagar, confirmarPagamentoContaPagar, excluirContaPagar, inserirContaPagar } from "../../services/contaPagarSupabase";
import ConfirmarPagamentoModal from "../../components/Financeiro/ConfirmarPagamentoModal";
import { carregarGeradorPdf } from "../../services/geradorPdf";
import { adicionarCabecalhoPdf } from "../../services/cabecalhoPdf";

const formasPagamento: FormaPagamentoContaPagar[] = ["PIX", "BOLETO", "CHEQUE_FISICA", "CHEQUE_JURIDICA"];
const dataParaISO = (data: Date) => {
  const ano = data.getFullYear();
  const mes = String(data.getMonth() + 1).padStart(2, "0");
  const dia = String(data.getDate()).padStart(2, "0");
  return `${ano}-${mes}-${dia}`;
};
const hoje = () => dataParaISO(new Date());
const adicionarDias = (data: string, quantidade: number) => {
  const [ano, mes, dia] = data.split("-").map(Number);
  const resultado = new Date(ano, mes - 1, dia);
  resultado.setDate(resultado.getDate() + quantidade);
  return dataParaISO(resultado);
};
const criarContaVazia = (): ContaPagar => ({ data_lancamento: hoje(), favorecido: "", descricao: "", valor: 0, forma_pagamento: "PIX", data_vencimento: hoje(), data_pagamento: null, status: "EM_ABERTO", observacoes: "" });
const formatarMoeda = (valor: number) => Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
const formatarData = (data?: string | null) => { if (!data) return "-"; const [ano, mes, dia] = data.split("-"); return ano && mes && dia ? `${dia}/${mes}/${ano}` : data; };
const rotulo = (valor: string) => valor.replace(/_/g, " ");

export default function ContasPagar() {
  const criarFiltrosPadrao = () => {
    const dataInicialPadrao = hoje();
    return {
      dataInicial: dataInicialPadrao,
      dataFinal: adicionarDias(dataInicialPadrao, 15),
      favorecido: "",
      formaPagamento: "" as "" | FormaPagamentoContaPagar,
    };
  };
  const [contas, setContas] = useState<ContaPagar[]>([]);
  const [conta, setConta] = useState<ContaPagar>(criarContaVazia);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [contaParaPagamento, setContaParaPagamento] = useState<ContaPagar | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [dataInicial, setDataInicial] = useState(() => hoje());
  const [dataFinal, setDataFinal] = useState(() => adicionarDias(hoje(), 15));
  const [favorecido, setFavorecido] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<"" | FormaPagamentoContaPagar>("");
  const [filtrosAplicados, setFiltrosAplicados] = useState(criarFiltrosPadrao);

  async function carregarContas() {
    setCarregando(true);
    try { setContas(await buscarContasPagar()); }
    catch (erro) { console.error(erro); alert("Não foi possível carregar as contas a pagar."); }
    finally { setCarregando(false); }
  }

  useEffect(() => { void carregarContas(); }, []);

  function restaurarFiltros() {
    const filtrosPadrao = criarFiltrosPadrao();
    setDataInicial(filtrosPadrao.dataInicial);
    setDataFinal(filtrosPadrao.dataFinal);
    setFavorecido("");
    setFormaPagamento("");
    setFiltrosAplicados(filtrosPadrao);
  }

  function aplicarFiltros() {
    if (dataInicial && dataFinal && dataInicial > dataFinal) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }

    setFiltrosAplicados({ dataInicial, dataFinal, favorecido, formaPagamento });
  }

  const contasFiltradas = useMemo(() => {
    const termo = filtrosAplicados.favorecido.trim().toLocaleLowerCase("pt-BR");
    return contas.filter((item) => (!filtrosAplicados.dataInicial || item.data_vencimento >= filtrosAplicados.dataInicial) && (!filtrosAplicados.dataFinal || item.data_vencimento <= filtrosAplicados.dataFinal) && (!termo || item.favorecido.toLocaleLowerCase("pt-BR").includes(termo)) && (!filtrosAplicados.formaPagamento || item.forma_pagamento === filtrosAplicados.formaPagamento));
  }, [contas, filtrosAplicados]);

  const totalPendente = contasFiltradas.filter((item) => item.status === "EM_ABERTO").reduce((total, item) => total + Number(item.valor), 0);
  const totalVencido = contasFiltradas.filter((item) => item.status === "EM_ABERTO" && item.data_vencimento < hoje()).reduce((total, item) => total + Number(item.valor), 0);

  function fecharFormulario() { setConta(criarContaVazia()); setMostrarFormulario(false); }

  async function salvarConta(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!conta.favorecido.trim()) return alert("Informe o nome do favorecido.");
    if (!conta.data_vencimento) return alert("Informe a data de vencimento.");
    if (Number(conta.valor) <= 0) return alert("Informe um valor maior que zero.");
    try {
      const dados = { ...conta, favorecido: conta.favorecido.trim(), valor: Number(conta.valor) };
      if (dados.id) await atualizarContaPagar(dados); else await inserirContaPagar(dados);
      await carregarContas(); fecharFormulario();
    } catch (erro) { console.error(erro); alert("Não foi possível salvar a conta a pagar."); }
  }

  async function removerConta(item: ContaPagar) {
    if (!item.id || !window.confirm(`Excluir a conta de ${item.favorecido}?`)) return;
    try { await excluirContaPagar(item.id); await carregarContas(); }
    catch (erro) { console.error(erro); alert("Não foi possível excluir a conta a pagar."); }
  }

  async function confirmarPagamento(dataPagamento: string) {
    if (!contaParaPagamento?.id) return;
    try { await confirmarPagamentoContaPagar(contaParaPagamento.id, dataPagamento); await carregarContas(); setContaParaPagamento(null); }
    catch (erro) { console.error(erro); alert(erro instanceof Error ? erro.message : "Não foi possível confirmar o pagamento."); }
  }

  async function gerarRelatorio() {
    const { jsPDF, autoTable } = await carregarGeradorPdf();
    const doc = new jsPDF();
    await adicionarCabecalhoPdf(doc, "Relatório de Contas a Pagar");
    doc.setFontSize(10); doc.text(`Período: ${filtrosAplicados.dataInicial ? formatarData(filtrosAplicados.dataInicial) : "Início"} até ${filtrosAplicados.dataFinal ? formatarData(filtrosAplicados.dataFinal) : "Hoje"}`, 14, 43);
    autoTable(doc, { startY: 49, head: [["Favorecido", "Vencimento", "Pagamento", "Valor", "Forma", "Status"]], body: contasFiltradas.map((item) => [item.favorecido, formatarData(item.data_vencimento), formatarData(item.data_pagamento), formatarMoeda(item.valor), rotulo(item.forma_pagamento), rotulo(item.status)]), styles: { fontSize: 8 }, headStyles: { fillColor: [30, 64, 175] } });

    const finalTabela = (doc as typeof doc & { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? 49;
    const alturaCampoTotal = 10;
    const limitePagina = doc.internal.pageSize.getHeight() - 14;
    let posicaoTotal = finalTabela;

    if (posicaoTotal + alturaCampoTotal > limitePagina) {
      doc.addPage();
      posicaoTotal = 14;
    }

    doc.setFillColor(30, 64, 175);
    doc.rect(14, posicaoTotal, 182, alturaCampoTotal, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(`Total pendente: ${formatarMoeda(totalPendente)}`, 192, posicaoTotal + 6.5, { align: "right" });
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    doc.save("contas-a-pagar.pdf");
  }

  return (
    <>
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-4xl font-bold text-blue-900">Contas a Pagar</h1>
          <p className="mt-1 text-gray-600">Despesas e compromissos financeiros cadastrados.</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={gerarRelatorio} disabled={carregando || contasFiltradas.length === 0} className="rounded-lg bg-red-600 px-5 py-3 text-white hover:bg-red-700 disabled:bg-red-400">Gerar PDF</button>
          <button type="button" onClick={() => { setConta(criarContaVazia()); setMostrarFormulario(true); }} className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800">Nova conta</button>
        </div>
      </div>
    {mostrarFormulario && <form onSubmit={salvarConta} className="mb-6 rounded-xl bg-white p-6 shadow-md"><h2 className="mb-6 text-2xl font-bold text-blue-900">{conta.id ? "Editar conta a pagar" : "Nova conta a pagar"}</h2><div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-4"><div><label className="mb-2 block font-semibold">Nome</label><input value={conta.favorecido} onChange={(event) => setConta((atual) => ({ ...atual, favorecido: event.target.value }))} className="w-full rounded-lg border p-3" /></div><div><label className="mb-2 block font-semibold">Data de vencimento</label><input type="date" value={conta.data_vencimento} onChange={(event) => setConta((atual) => ({ ...atual, data_vencimento: event.target.value, data_lancamento: event.target.value }))} className="w-full rounded-lg border p-3" /></div><div><label className="mb-2 block font-semibold">Valor</label><input type="number" min="0" step="0.01" value={conta.valor || ""} onChange={(event) => setConta((atual) => ({ ...atual, valor: Number(event.target.value) }))} className="w-full rounded-lg border p-3" /></div><div><label className="mb-2 block font-semibold">Forma de pagamento</label><select value={conta.forma_pagamento} onChange={(event) => setConta((atual) => ({ ...atual, forma_pagamento: event.target.value as FormaPagamentoContaPagar }))} className="w-full rounded-lg border p-3">{formasPagamento.map((forma) => <option key={forma} value={forma}>{rotulo(forma)}</option>)}</select></div></div><div className="mt-6 flex justify-end gap-3"><button type="button" onClick={fecharFormulario} className="rounded-lg bg-gray-500 px-5 py-2 text-white hover:bg-gray-600">Cancelar</button><button type="submit" className="rounded-lg bg-blue-700 px-5 py-2 text-white hover:bg-blue-800">Salvar</button></div></form>}
      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-blue-600 bg-white px-5 py-4 shadow-sm">
          <div className="text-sm text-gray-500">Total pendente</div>
          <div className="mt-1 text-xl font-bold text-blue-900">{formatarMoeda(totalPendente)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-red-500 bg-white px-5 py-4 shadow-sm">
          <div className="text-sm text-gray-500">Valor vencido</div>
          <div className="mt-1 text-xl font-bold text-red-600">{formatarMoeda(totalVencido)}</div>
        </div>
        <div className="rounded-xl border border-slate-200 border-l-4 border-l-blue-600 bg-white px-5 py-4 shadow-sm">
          <div className="text-sm text-gray-500">Contas encontradas</div>
          <div className="mt-1 text-xl font-bold text-blue-900">{contasFiltradas.length}</div>
        </div>
      </div>
      <div className="mb-5 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div><label className="mb-1.5 block text-sm font-semibold">Vencimento inicial</label><input type="date" value={dataInicial} onChange={(event) => setDataInicial(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold">Vencimento final</label><input type="date" value={dataFinal} onChange={(event) => setDataFinal(event.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold">Nome</label><input value={favorecido} onChange={(event) => setFavorecido(event.target.value)} placeholder="Buscar nome" className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm" /></div>
          <div><label className="mb-1.5 block text-sm font-semibold">Forma de pagamento</label><select value={formaPagamento} onChange={(event) => setFormaPagamento(event.target.value as "" | FormaPagamentoContaPagar)} className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"><option value="">Todas</option>{formasPagamento.map((forma) => <option key={forma} value={forma}>{rotulo(forma)}</option>)}</select></div>
        </div>
        <div className="mt-4 flex gap-3">
          <button type="button" onClick={aplicarFiltros} className="rounded-lg bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800">Aplicar filtros</button>
          <button type="button" onClick={restaurarFiltros} className="rounded-lg bg-slate-500 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-600">Limpar filtros</button>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[980px] text-sm">
            <thead className="bg-slate-100/80">
              <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
                <th className="px-4 py-3 text-left">Nome</th>
                <th className="text-center">Vencimento</th>
                <th className="text-center">Pago em</th>
                <th className="text-right">Valor</th>
                <th className="text-center">Meio</th>
                <th className="text-center">Status</th>
                <th className="text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {carregando && <tr><td colSpan={7} className="py-8 text-center text-gray-500">Carregando contas a pagar...</td></tr>}
              {!carregando && contasFiltradas.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-500">Nenhuma conta encontrada para os filtros informados.</td></tr>}
              {!carregando && contasFiltradas.map((item, index) => (
                <tr key={item.id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-blue-50/35"} hover:bg-blue-50/70`}>
                  <td className="px-4 py-2.5 text-[13px] font-medium text-slate-800">{item.favorecido}</td>
                  <td className="text-center">{formatarData(item.data_vencimento)}</td>
                  <td className="text-center">{formatarData(item.data_pagamento)}</td>
                  <td className="text-right font-medium">{formatarMoeda(item.valor)}</td>
                  <td className="text-center">{rotulo(item.forma_pagamento)}</td>
                  <td className="text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${item.status === "PAGO" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>{rotulo(item.status)}</span>
                  </td>
                  <td>
                    <div className="flex justify-center gap-2">
                      {item.status === "EM_ABERTO" && <button type="button" onClick={() => setContaParaPagamento(item)} className="rounded-md border border-green-200 bg-green-50 px-2.5 py-1 text-xs font-semibold text-green-700 transition hover:bg-green-100">Confirm. pagam.</button>}
                      <button type="button" onClick={() => { setConta({ ...item }); setMostrarFormulario(true); }} className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">Editar</button>
                      <button type="button" onClick={() => void removerConta(item)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100">Excluir</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    <ConfirmarPagamentoModal aberto={Boolean(contaParaPagamento)} favorecido={contaParaPagamento?.favorecido ?? ""} onCancelar={() => setContaParaPagamento(null)} onConfirmar={(data) => void confirmarPagamento(data)} />
    </>
  );
}




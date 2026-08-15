import { useEffect, useMemo, useState } from "react";

import type { ContaReceber } from "../../types/ContaReceber";
import type { FormaPagamento } from "../../types/VendaParcela";

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

function corStatus(status: ContaReceber["status"]) {
  return status === "PARCIALMENTE_RECEBIDO"
    ? "bg-orange-100 text-orange-700"
    : "bg-amber-100 text-amber-700";
}

function hoje() {
  return dataParaISO(new Date());
}

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

export default function ContasReceber() {
  const criarFiltrosPadrao = () => {
    const dataInicialPadrao = hoje();
    return {
      dataInicial: dataInicialPadrao,
      dataFinal: adicionarDias(dataInicialPadrao, 15),
      cliente: "",
      formaPagamento: "" as "" | FormaPagamento,
    };
  };
  const [contas, setContas] = useState<ContaReceber[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [dataInicial, setDataInicial] = useState(() => hoje());
  const [dataFinal, setDataFinal] = useState(() => adicionarDias(hoje(), 15));
  const [cliente, setCliente] = useState("");
  const [formaPagamento, setFormaPagamento] = useState<"" | FormaPagamento>("");
  const [filtrosAplicados, setFiltrosAplicados] = useState(criarFiltrosPadrao);

  async function carregarContas() {
    setCarregando(true);

    try {
      setContas(await buscarContasReceber());
    } catch (error) {
      console.error(error);
      alert("Não foi possível carregar as contas a receber.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    void carregarContas();
  }, []);

  const contasFiltradas = useMemo(() => {
    const termoCliente = filtrosAplicados.cliente.trim().toLocaleLowerCase("pt-BR");

    return contas.filter((conta) => {
      const ehCondicionado =
        conta.forma_pagamento === "CONDICIONADO_ENTREGA";
      const clienteOk =
        !termoCliente ||
        conta.cliente.toLocaleLowerCase("pt-BR").includes(termoCliente);
      const formaOk =
        !filtrosAplicados.formaPagamento || conta.forma_pagamento === filtrosAplicados.formaPagamento;
      const estaAtrasada =
        !ehCondicionado && conta.data_vencimento < hoje();
      const dataInicialOk =
        ehCondicionado || estaAtrasada || !filtrosAplicados.dataInicial || conta.data_vencimento >= filtrosAplicados.dataInicial;
      const dataFinalOk =
        ehCondicionado || estaAtrasada || !filtrosAplicados.dataFinal || conta.data_vencimento <= filtrosAplicados.dataFinal;

      return dataInicialOk && dataFinalOk && clienteOk && formaOk;
    });
  }, [contas, filtrosAplicados]);

  const totalAReceber = contasFiltradas.reduce(
    (total, conta) =>
      conta.forma_pagamento === "CONDICIONADO_ENTREGA"
        ? total
        : total + conta.saldo,
    0
  );
  const dataDeHoje = hoje();
  const contasCondicionadas = contasFiltradas.filter(
    (conta) => conta.forma_pagamento === "CONDICIONADO_ENTREGA"
  );
  const contasNormais = contasFiltradas.filter(
    (conta) => conta.forma_pagamento !== "CONDICIONADO_ENTREGA"
  );
  const contasAtrasadas = contasFiltradas.filter(
    (conta) =>
      conta.forma_pagamento !== "CONDICIONADO_ENTREGA" &&
      conta.data_vencimento < dataDeHoje
  );
  const contasEmDia = contasNormais.filter(
    (conta) => conta.data_vencimento >= dataDeHoje
  );
  const totalVencido = contasAtrasadas
    .reduce((total, conta) => total + conta.saldo, 0);
  const totalCondicionado = contasCondicionadas.reduce(
    (total, conta) => total + conta.saldo,
    0
  );
  const totalNoPeriodo = contasFiltradas
    .filter((conta) => {
      if (conta.forma_pagamento === "CONDICIONADO_ENTREGA") return false;

      const respeitaDataInicial =
        !filtrosAplicados.dataInicial ||
        conta.data_vencimento >= filtrosAplicados.dataInicial;
      const respeitaDataFinal =
        !filtrosAplicados.dataFinal ||
        conta.data_vencimento <= filtrosAplicados.dataFinal;

      return respeitaDataInicial && respeitaDataFinal;
    })
    .reduce((total, conta) => total + conta.saldo, 0);

  function limparFiltros() {
    const filtrosPadrao = criarFiltrosPadrao();
    setDataInicial(filtrosPadrao.dataInicial);
    setDataFinal(filtrosPadrao.dataFinal);
    setCliente("");
    setFormaPagamento("");
    setFiltrosAplicados(filtrosPadrao);
  }

  function aplicarFiltros() {
    if (dataInicial && dataFinal && dataInicial > dataFinal) {
      alert("A data inicial não pode ser maior que a data final.");
      return;
    }

    setFiltrosAplicados({ dataInicial, dataFinal, cliente, formaPagamento });
  }

  async function gerarRelatorio() {
    const { jsPDF, autoTable } = await carregarGeradorPdf();
    const doc = new jsPDF();

    await adicionarCabecalhoPdf(doc, "Relatório de Contas a Receber");

    doc.setFontSize(10);
    doc.text(
      `Período: ${filtrosAplicados.dataInicial ? formatarData(filtrosAplicados.dataInicial) : "Início"} até ${
        filtrosAplicados.dataFinal ? formatarData(filtrosAplicados.dataFinal) : "Hoje"
      }`,
      14,
      43
    );

    const adicionarTotalTabela = (
      texto: string,
      cor: [number, number, number]
    ) => {
      const tabela = doc as typeof doc & {
        lastAutoTable?: { finalY: number };
      };
      const finalTabela = tabela.lastAutoTable?.finalY ?? 42;
      const alturaCampoTotal = 9;
      const limitePagina = doc.internal.pageSize.getHeight() - 14;
      let posicaoTotal = finalTabela;

      if (posicaoTotal + alturaCampoTotal > limitePagina) {
        doc.addPage();
        posicaoTotal = 14;
      }

      doc.setFillColor(...cor);
      doc.rect(14, posicaoTotal, 182, alturaCampoTotal, "F");
      doc.setFontSize(8);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(255, 255, 255);
      doc.text(texto, 192, posicaoTotal + 5.8, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(0, 0, 0);

      return posicaoTotal + alturaCampoTotal;
    };

    const prepararInicioSecao = (posicaoAnterior: number) => {
      const limitePagina = doc.internal.pageSize.getHeight() - 14;
      const inicioSugerido = posicaoAnterior + 12;

      if (inicioSugerido + 18 > limitePagina) {
        doc.addPage();
        return 20;
      }

      return inicioSugerido;
    };

    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28);
    doc.text("Contas atrasadas", 14, 52);
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: 57,
      head: [[
        "Cliente",
        "Parcela",
        "Vencimento",
        "Forma",
        "Valor",
        "Recebido",
        "Saldo",
        "Status",
      ]],
      body:
        contasAtrasadas.length > 0
          ? contasAtrasadas.map((conta) => [
              conta.cliente,
              `${conta.numero_parcela}/${conta.total_parcelas}`,
              formatarData(conta.data_vencimento),
              rotulo(conta.forma_pagamento),
              formatarMoeda(conta.valor),
              formatarMoeda(conta.valor_recebido),
              formatarMoeda(conta.saldo),
              rotulo(conta.status),
            ])
          : [["-", "-", "-", "-", "-", "-", "-", "Nenhuma conta atrasada."]],
      styles: { fontSize: 7 },
      headStyles: { fillColor: [185, 28, 28] },
    });

    const fimAtrasadas = adicionarTotalTabela(
      `Total contas atrasadas: ${formatarMoeda(totalVencido)}`,
      [185, 28, 28]
    );
    const inicioDemaisContas = prepararInicioSecao(fimAtrasadas);

    doc.setFontSize(12);
    doc.text("Demais contas a receber", 14, inicioDemaisContas);

    autoTable(doc, {
      startY: inicioDemaisContas + 5,
      head: [[
        "Cliente",
        "Parcela",
        "Vencimento",
        "Forma",
        "Valor",
        "Recebido",
        "Saldo",
        "Status",
      ]],
      body: contasEmDia.map((conta) => [
        conta.cliente,
        `${conta.numero_parcela}/${conta.total_parcelas}`,
        formatarData(conta.data_vencimento),
        rotulo(conta.forma_pagamento),
        formatarMoeda(conta.valor),
        formatarMoeda(conta.valor_recebido),
        formatarMoeda(conta.saldo),
        rotulo(conta.status),
      ]),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    const fimDemaisContas = adicionarTotalTabela(
      `Total a receber no período: ${formatarMoeda(totalNoPeriodo)}`,
      [30, 64, 175]
    );
    const inicioCondicionados = prepararInicioSecao(fimDemaisContas);

    doc.setFontSize(12);
    doc.text("Condicionados à entrega", 14, inicioCondicionados);

    autoTable(doc, {
      startY: inicioCondicionados + 5,
      head: [["Cliente", "Parcela", "Valor", "Recebido", "Saldo", "Descrição"]],
      body:
        contasCondicionadas.length > 0
          ? contasCondicionadas.map((conta) => [
              conta.cliente,
              `${conta.numero_parcela}/${conta.total_parcelas}`,
              formatarMoeda(conta.valor),
              formatarMoeda(conta.valor_recebido),
              formatarMoeda(conta.saldo),
              conta.descricao_entrega || "-",
            ])
          : [["-", "-", "-", "-", "-", "Nenhuma parcela condicionada."]],
      styles: { fontSize: 8 },
      headStyles: { fillColor: [161, 98, 7] },
    });

    adicionarTotalTabela(
      `Total condicionado à entrega: ${formatarMoeda(totalCondicionado)}`,
      [161, 98, 7]
    );

    doc.save("contas-a-receber.pdf");
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-6 lg:flex-row lg:justify-between lg:items-center">
        <div>
          <h1 className="text-4xl font-bold text-blue-900">Contas a Receber</h1>
          <p className="mt-1 text-gray-600">
            Parcelas pendentes e parcialmente recebidas das vendas.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => void carregarContas()}
            className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
          >
            Atualizar
          </button>
          <button
            type="button"
            onClick={gerarRelatorio}
            disabled={carregando || contasFiltradas.length === 0}
            className="bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white px-5 py-3 rounded-lg"
          >
            Gerar PDF
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 mb-5 md:grid-cols-3">
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-blue-600 shadow-sm px-5 py-4">
          <div className="text-sm text-gray-500">Total a receber</div>
          <div className="mt-1 text-xl font-bold text-blue-900">
            {formatarMoeda(totalAReceber)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-red-500 shadow-sm px-5 py-4">
          <div className="text-sm text-gray-500">Vencido</div>
          <div className="mt-1 text-xl font-bold text-red-600">
            {formatarMoeda(totalVencido)}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-slate-200 border-l-4 border-l-amber-500 shadow-sm px-5 py-4">
          <div className="text-sm text-gray-500">Condicionado à entrega</div>
          <div className="mt-1 text-xl font-bold text-amber-700">
            {formatarMoeda(totalCondicionado)}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 mb-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="block mb-1.5 text-sm font-semibold">Vencimento inicial</label>
            <input
              type="date"
              value={dataInicial}
              onChange={(event) => setDataInicial(event.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold">Vencimento final</label>
            <input
              type="date"
              value={dataFinal}
              onChange={(event) => setDataFinal(event.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold">Cliente</label>
            <input
              type="text"
              value={cliente}
              onChange={(event) => setCliente(event.target.value)}
              placeholder="Buscar cliente"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
            />
          </div>
          <div>
            <label className="block mb-1.5 text-sm font-semibold">Forma de pagamento</label>
            <select
              value={formaPagamento}
              onChange={(event) =>
                setFormaPagamento(event.target.value as "" | FormaPagamento)
              }
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm"
            >
              <option value="">Todas</option>
              <option value="PIX">PIX</option>
              <option value="DINHEIRO">DINHEIRO</option>
              <option value="CARTAO">CARTÃO</option>
              <option value="BOLETO">BOLETO</option>
              <option value="CHEQUE">CHEQUE</option>
              <option value="CONDICIONADO_ENTREGA">CONDICIONADO ENTREGA</option>
            </select>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button
            type="button"
            onClick={aplicarFiltros}
            className="bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={limparFiltros}
            className="bg-slate-500 hover:bg-slate-600 text-white text-sm font-semibold px-4 py-2 rounded-lg"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm mb-5 border border-red-200 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-red-100">
          <h2 className="text-lg font-bold text-red-700">Contas atrasadas</h2>
          <span className="text-sm font-bold text-red-700">
            {formatarMoeda(totalVencido)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-sm">
            <thead className="bg-red-50/70">
              <tr className="border-b border-red-100 text-xs uppercase tracking-wide text-red-700">
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-center">Parcela</th>
                <th className="text-center">Vencimento</th>
                <th className="text-center">Forma</th>
                <th className="text-right">Valor</th>
                <th className="text-right">Recebido</th>
                <th className="text-right">Saldo</th>
                <th className="text-center">Status</th>
              </tr>
            </thead>
            <tbody>
              {!carregando && contasAtrasadas.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-6 text-center text-gray-500">
                    Nenhuma conta atrasada para os filtros informados.
                  </td>
                </tr>
              )}
              {!carregando && contasAtrasadas.map((conta, index) => (
                <tr key={conta.parcela_id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-red-50/30"} hover:bg-red-50/60`}>
                  <td className="px-4 py-2.5 text-[13px] font-medium text-slate-800">{conta.cliente}</td>
                  <td className="text-center">
                    {conta.numero_parcela}/{conta.total_parcelas}
                  </td>
                  <td className="text-center font-semibold text-red-700">
                    {formatarData(conta.data_vencimento)}
                  </td>
                  <td className="text-center">{rotulo(conta.forma_pagamento)}</td>
                  <td className="text-right">{formatarMoeda(conta.valor)}</td>
                  <td className="text-right text-green-700">
                    {formatarMoeda(conta.valor_recebido)}
                  </td>
                  <td className="text-right font-semibold text-red-700">
                    {formatarMoeda(conta.saldo)}
                  </td>
                  <td className="text-center">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${corStatus(conta.status)}`}>
                      {rotulo(conta.status)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-blue-900">
            Demais contas a receber
          </h2>
          <span className="text-sm font-bold text-blue-900">
            {formatarMoeda(totalNoPeriodo)}
          </span>
        </div>
        <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-sm">
          <thead className="bg-slate-100/80">
            <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-center">Parcela</th>
              <th className="text-center">Vencimento</th>
              <th className="text-center">Forma</th>
              <th className="text-right">Valor</th>
              <th className="text-right">Recebido</th>
              <th className="text-right">Saldo</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {carregando && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  Carregando contas a receber...
                </td>
              </tr>
            )}
            {!carregando && contasNormais.length > 0 && contasEmDia.length === 0 && (
              <tr>
                <td colSpan={8} className="py-8 text-center text-gray-500">
                  Nenhuma conta encontrada para os filtros informados.
                </td>
              </tr>
            )}
            {!carregando && contasEmDia.map((conta, index) => (
              <tr key={conta.parcela_id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-blue-50/35"} hover:bg-blue-50/70`}>
                <td className="px-4 py-2.5 text-[13px] font-medium text-slate-800">{conta.cliente}</td>
                <td className="text-center">
                  {conta.numero_parcela}/{conta.total_parcelas}
                </td>
                <td className="text-center">{formatarData(conta.data_vencimento)}</td>
                <td className="text-center">{rotulo(conta.forma_pagamento)}</td>
                <td className="text-right">{formatarMoeda(conta.valor)}</td>
                <td className="text-right text-green-700">
                  {formatarMoeda(conta.valor_recebido)}
                </td>
                <td className="text-right font-semibold text-orange-600">
                  {formatarMoeda(conta.saldo)}
                </td>
                <td className="text-center">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${corStatus(conta.status)}`}>
                    {rotulo(conta.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm mt-5 border border-amber-200 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-amber-100">
          <div>
            <h2 className="text-lg font-bold text-amber-700">
              Condicionados à entrega
            </h2>
            <p className="text-sm text-gray-600">
              Parcelas que serão recebidas após a entrega, sem vencimento obrigatório.
            </p>
          </div>
          <span className="text-sm font-bold text-amber-700">
            {formatarMoeda(totalCondicionado)}
          </span>
        </div>

        <div className="overflow-x-auto">
        <table className="w-full min-w-[850px] text-sm">
          <thead className="bg-amber-50/70">
            <tr className="border-b border-amber-100 text-xs uppercase tracking-wide text-amber-700">
              <th className="text-left px-4 py-3">Cliente</th>
              <th className="text-center">Parcela</th>
              <th className="text-right">Valor</th>
              <th className="text-right">Recebido</th>
              <th className="text-right">Saldo</th>
              <th className="text-left">Descrição</th>
              <th className="text-center">Status</th>
            </tr>
          </thead>
          <tbody>
            {!carregando && contasCondicionadas.length === 0 && (
              <tr>
                <td colSpan={7} className="py-6 text-center text-gray-500">
                  Nenhuma parcela condicionada à entrega para os filtros informados.
                </td>
              </tr>
            )}
            {!carregando && contasCondicionadas.map((conta, index) => (
              <tr key={conta.parcela_id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-amber-50/35"} hover:bg-amber-50/70`}>
                <td className="px-4 py-2.5 text-[13px] font-medium text-slate-800">{conta.cliente}</td>
                <td className="text-center">
                  {conta.numero_parcela}/{conta.total_parcelas}
                </td>
                <td className="text-right">{formatarMoeda(conta.valor)}</td>
                <td className="text-right text-green-700">
                  {formatarMoeda(conta.valor_recebido)}
                </td>
                <td className="text-right font-semibold text-amber-700">
                  {formatarMoeda(conta.saldo)}
                </td>
                <td>{conta.descricao_entrega || "-"}</td>
                <td className="text-center">
                  <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${corStatus(conta.status)}`}>
                    {rotulo(conta.status)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </>
  );
}




import { useEffect, useMemo, useState } from "react";

import type { ContaReceber } from "../../types/ContaReceber";
import type { FormaPagamento } from "../../types/VendaParcela";

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

function corStatus(status: ContaReceber["status"]) {
  return status === "PARCIALMENTE_RECEBIDO"
    ? "text-orange-600"
    : "text-yellow-600";
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

    doc.setFontSize(18);
    doc.text("Estoque Visual Esquadrias", 14, 18);

    doc.setFontSize(13);
    doc.text("Relatório de Contas a Receber", 14, 27);

    doc.setFontSize(10);
    doc.text(
      `Período: ${filtrosAplicados.dataInicial ? formatarData(filtrosAplicados.dataInicial) : "Início"} até ${
        filtrosAplicados.dataFinal ? formatarData(filtrosAplicados.dataFinal) : "Hoje"
      }`,
      14,
      36
    );
    doc.text(`Total a receber: ${formatarMoeda(totalAReceber)}`, 14, 42);
    doc.text(`Contas no relatório: ${contasFiltradas.length}`, 14, 48);

    doc.setFontSize(12);
    doc.setTextColor(185, 28, 28);
    doc.text("Contas atrasadas", 14, 56);
    doc.setTextColor(0, 0, 0);

    autoTable(doc, {
      startY: 61,
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

    const tabelaAtrasadas = doc as typeof doc & {
      lastAutoTable?: { finalY: number };
    };
    const inicioDemaisContas =
      (tabelaAtrasadas.lastAutoTable?.finalY ?? 61) + 12;

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

    const tabelaDemaisContas = doc as typeof doc & {
      lastAutoTable?: { finalY: number };
    };
    const inicioCondicionados =
      (tabelaDemaisContas.lastAutoTable?.finalY ?? inicioDemaisContas + 5) + 12;

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

    doc.save("contas-a-receber.pdf");
  }

  return (
    <>
      <div className="flex flex-col gap-4 mb-8 lg:flex-row lg:justify-between lg:items-center">
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

      <div className="grid grid-cols-1 gap-4 mb-6 md:grid-cols-3">
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500">Total a receber</div>
          <div className="mt-1 text-2xl font-bold text-blue-900">
            {formatarMoeda(totalAReceber)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500">Contas pendentes</div>
          <div className="mt-1 text-2xl font-bold text-blue-900">
            {contasFiltradas.length}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500">Valor vencido</div>
          <div className="mt-1 text-2xl font-bold text-red-600">
            {formatarMoeda(totalVencido)}
          </div>
        </div>
        <div className="bg-white rounded-xl shadow-sm p-5">
          <div className="text-sm text-gray-500">Condicionado à entrega</div>
          <div className="mt-1 text-2xl font-bold text-amber-700">
            {formatarMoeda(
              contasCondicionadas.reduce(
                (total, conta) => total + conta.saldo,
                0
              )
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <label className="block mb-2 font-semibold">Vencimento inicial</label>
            <input
              type="date"
              value={dataInicial}
              onChange={(event) => setDataInicial(event.target.value)}
              className="w-full border rounded-lg p-3"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Vencimento final</label>
            <input
              type="date"
              value={dataFinal}
              onChange={(event) => setDataFinal(event.target.value)}
              className="w-full border rounded-lg p-3"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Cliente</label>
            <input
              type="text"
              value={cliente}
              onChange={(event) => setCliente(event.target.value)}
              placeholder="Buscar cliente"
              className="w-full border rounded-lg p-3"
            />
          </div>
          <div>
            <label className="block mb-2 font-semibold">Forma de pagamento</label>
            <select
              value={formaPagamento}
              onChange={(event) =>
                setFormaPagamento(event.target.value as "" | FormaPagamento)
              }
              className="w-full border rounded-lg p-3"
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

        <div className="mt-5 flex gap-3">
          <button
            type="button"
            onClick={aplicarFiltros}
            className="bg-blue-700 hover:bg-blue-800 text-white px-4 py-2 rounded-lg"
          >
            Aplicar filtros
          </button>
          <button
            type="button"
            onClick={limparFiltros}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg"
          >
            Limpar filtros
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-red-200">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-red-700">Contas atrasadas</h2>
          <span className="font-bold text-red-700">
            {formatarMoeda(totalVencido)}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="border-b text-red-700">
                <th className="text-left py-3">Cliente</th>
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
              {!carregando && contasAtrasadas.map((conta) => (
                <tr key={conta.parcela_id} className="border-b bg-red-50/50">
                  <td className="py-3">{conta.cliente}</td>
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
                  <td className={`text-center font-bold ${corStatus(conta.status)}`}>
                    {rotulo(conta.status)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
        <h2 className="text-xl font-bold text-blue-900 mb-4">
          Demais contas a receber
        </h2>
        <table className="w-full min-w-[980px]">
          <thead>
            <tr className="border-b">
              <th className="text-left py-3">Cliente</th>
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
            {!carregando && contasEmDia.map((conta) => (
              <tr key={conta.parcela_id} className="border-b hover:bg-slate-50">
                <td className="py-3">{conta.cliente}</td>
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
                <td className={`text-center font-bold ${corStatus(conta.status)}`}>
                  {rotulo(conta.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mt-6 border border-amber-200 overflow-x-auto">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h2 className="text-xl font-bold text-amber-700">
              Condicionados à entrega
            </h2>
            <p className="text-sm text-gray-600">
              Parcelas que serão recebidas após a entrega, sem vencimento obrigatório.
            </p>
          </div>
          <span className="font-bold text-amber-700">
            {formatarMoeda(
              contasCondicionadas.reduce(
                (total, conta) => total + conta.saldo,
                0
              )
            )}
          </span>
        </div>

        <table className="w-full min-w-[850px]">
          <thead>
            <tr className="border-b text-amber-700">
              <th className="text-left py-3">Cliente</th>
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
            {!carregando && contasCondicionadas.map((conta) => (
              <tr key={conta.parcela_id} className="border-b bg-amber-50/50">
                <td className="py-3">{conta.cliente}</td>
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
                <td className={`text-center font-bold ${corStatus(conta.status)}`}>
                  {rotulo(conta.status)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}


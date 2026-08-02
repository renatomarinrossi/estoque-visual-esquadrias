import { useCallback, useEffect, useState } from "react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";
import { buscarParcelasVenda } from "../../services/vendaParcelaSupabase";
import {
  buscarRecebimentosParcela,
  editarRecebimento,
  excluirRecebimento,
  inserirRecebimento,
  type VendaRecebimento,
} from "../../services/vendaRecebimentoSupabase";
import EditarRecebimentoModal from "./EditarRecebimentoModal";
import ReceberParcelaModal from "./ReceberParcelaModal";

type Props = { venda: Venda; onAtualizar: () => Promise<void> };
type RecebimentosPorParcela = Record<number, VendaRecebimento[]>;

function formatarMoeda(valor: number) {
  return Number(valor).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

function formatarData(data: string) {
  if (!data) return "-";
  const [ano, mes, dia] = data.split("-");
  return ano && mes && dia ? `${dia}/${mes}/${ano}` : data;
}

function rotuloStatus(status: string) {
  return status.replace(/_/g, " ");
}

function corStatus(status: string) {
  if (status === "RECEBIDO") return "text-green-600";
  if (status === "PARCIALMENTE_RECEBIDO") return "text-orange-600";
  if (status === "CANCELADO") return "text-red-600";
  return "text-yellow-600";
}

export default function VendaDetalhes({ venda, onAtualizar }: Props) {
  const [parcelas, setParcelas] = useState<VendaParcela[]>([]);
  const [recebimentosPorParcela, setRecebimentosPorParcela] = useState<RecebimentosPorParcela>({});
  const [modalAberto, setModalAberto] = useState(false);
  const [parcelaSelecionada, setParcelaSelecionada] = useState<VendaParcela | null>(null);
  const [recebimentoEditando, setRecebimentoEditando] = useState<VendaRecebimento | null>(null);
  const [carregando, setCarregando] = useState(false);

  const carregarDetalhes = useCallback(async () => {
    if (!venda.id) return;
    setCarregando(true);

    try {
      const dadosParcelas = await buscarParcelasVenda(venda.id);
      const recebimentos = await Promise.all(
        dadosParcelas.map(async (parcela) => {
          if (!parcela.id) return [0, []] as const;
          return [parcela.id, await buscarRecebimentosParcela(parcela.id)] as const;
        })
      );
      setParcelas(dadosParcelas);
      setRecebimentosPorParcela(Object.fromEntries(recebimentos));
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar os detalhes da venda.");
    } finally {
      setCarregando(false);
    }
  }, [venda.id]);

  useEffect(() => { void carregarDetalhes(); }, [carregarDetalhes]);

  function totalRecebido(parcelaId?: number) {
    if (!parcelaId) return 0;
    return (recebimentosPorParcela[parcelaId] ?? []).reduce((total, recebimento) => total + Number(recebimento.valor), 0);
  }

  function abrirRecebimento(parcela: VendaParcela) {
    setParcelaSelecionada(parcela);
    setModalAberto(true);
  }

  function fecharRecebimento() {
    setModalAberto(false);
    setParcelaSelecionada(null);
  }

  async function atualizarTela() {
    await Promise.all([carregarDetalhes(), onAtualizar()]);
  }

  async function confirmarRecebimento(data: string, valor: number, observacao: string) {
    if (!parcelaSelecionada?.id) return;
    if (!data || !Number.isFinite(valor) || valor <= 0) {
      alert("Informe a data e um valor de recebimento maior que zero.");
      return;
    }

    try {
      await inserirRecebimento({ parcela_id: parcelaSelecionada.id, data_recebimento: data, valor, observacao });
      await atualizarTela();
      fecharRecebimento();
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao registrar recebimento.");
    }
  }

  async function salvarEdicaoRecebimento(recebimento: VendaRecebimento) {
    try {
      await editarRecebimento(recebimento);
      await atualizarTela();
      setRecebimentoEditando(null);
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao alterar recebimento.");
    }
  }

  async function removerRecebimento(recebimento: VendaRecebimento) {
    if (!recebimento.id) return;
    if (!window.confirm(`Excluir o recebimento de ${formatarMoeda(recebimento.valor)}?`)) return;

    try {
      await excluirRecebimento(recebimento.id);
      await atualizarTela();
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao excluir recebimento.");
    }
  }

  function gerarRelatorio() {
    const doc = new jsPDF();
    const totalRecebidoVenda = parcelas.reduce((total, parcela) => total + totalRecebido(parcela.id), 0);
    const saldoVenda = Number(venda.valor_total) - totalRecebidoVenda;

    doc.setFontSize(18);
    doc.text("Estoque Visual Esquadrias", 14, 18);
    doc.setFontSize(13);
    doc.text(`Relatório da Venda #${venda.id ?? "-"}`, 14, 27);
    doc.setFontSize(10);
    doc.text(`Cliente: ${venda.cliente}`, 14, 36);
    doc.text(`Responsável: ${venda.responsavel || "-"}`, 14, 42);
    doc.text(`Data da venda: ${formatarData(venda.data_venda)}`, 14, 48);
    doc.text(`Status: ${rotuloStatus(venda.status)}`, 14, 54);
    doc.text(`Valor total: ${formatarMoeda(venda.valor_total)}`, 112, 36);
    doc.text(`Total recebido: ${formatarMoeda(totalRecebidoVenda)}`, 112, 42);
    doc.text(`Saldo: ${formatarMoeda(saldoVenda)}`, 112, 48);
    doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 112, 54);

    autoTable(doc, {
      startY: 62,
      head: [["Parcela", "Vencimento", "Forma", "Valor", "Recebido", "Saldo", "Status"]],
      body: parcelas.map((parcela) => {
        const recebido = totalRecebido(parcela.id);
        return [`${parcela.numero_parcela}/${parcela.total_parcelas}`, formatarData(parcela.data_vencimento), rotuloStatus(parcela.forma_pagamento), formatarMoeda(parcela.valor), formatarMoeda(recebido), formatarMoeda(Number(parcela.valor) - recebido), rotuloStatus(parcela.status)];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    const tabelaParcelas = doc as jsPDF & { lastAutoTable?: { finalY: number } };
    const inicioHistorico = (tabelaParcelas.lastAutoTable?.finalY ?? 62) + 12;
    doc.setFontSize(12);
    doc.text("Histórico de recebimentos", 14, inicioHistorico);
    const historico = parcelas.flatMap((parcela) => (recebimentosPorParcela[parcela.id ?? 0] ?? []).map((recebimento) => [`${parcela.numero_parcela}/${parcela.total_parcelas}`, formatarData(recebimento.data_recebimento), formatarMoeda(recebimento.valor), recebimento.observacao || "-"]));

    autoTable(doc, {
      startY: inicioHistorico + 5,
      head: [["Parcela", "Data", "Valor", "Observação"]],
      body: historico.length > 0 ? historico : [["-", "-", "-", "Nenhum recebimento registrado."]],
      styles: { fontSize: 9 },
      headStyles: { fillColor: [22, 163, 74] },
    });
    doc.save(`relatorio-venda-${venda.id ?? "sem-id"}.pdf`);
  }

  return (
    <>
      <div className="rounded-lg bg-slate-100 p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <p><strong>Cliente</strong><br />{venda.cliente}</p>
            <p><strong>Responsável</strong><br />{venda.responsavel || "-"}</p>
            <p><strong>Data da venda</strong><br />{formatarData(venda.data_venda)}</p>
            <p><strong>Valor total</strong><br />{formatarMoeda(venda.valor_total)}</p>
          </div>
          <button type="button" onClick={gerarRelatorio} disabled={carregando} className="rounded-lg bg-red-600 px-4 py-2 text-white hover:bg-red-700 disabled:bg-red-400">Gerar PDF</button>
        </div>

        <div className="mb-6"><strong>Observações</strong><div className="mt-2 rounded-lg bg-white p-3">{venda.observacoes || "-"}</div></div>
        <h3 className="mb-4 text-xl font-bold">Parcelas</h3>
        {carregando && <div className="italic text-gray-500">Carregando parcelas...</div>}
        {!carregando && parcelas.length === 0 && <div className="italic text-gray-500">Nenhuma parcela cadastrada.</div>}

        {parcelas.map((parcela) => {
          const recebimentos = recebimentosPorParcela[parcela.id ?? 0] ?? [];
          const recebido = totalRecebido(parcela.id);
          const saldo = Number(parcela.valor) - recebido;
          const podeReceber = parcela.status === "A_RECEBER" || parcela.status === "PARCIALMENTE_RECEBIDO";

          return (
            <div key={parcela.id ?? parcela.numero_parcela} className="mb-3 rounded-lg border bg-white p-4">
              <div className="grid grid-cols-1 items-center gap-4 md:grid-cols-3 xl:grid-cols-6">
                <div><strong>Parcela</strong><div>{parcela.numero_parcela}/{parcela.total_parcelas}</div></div>
                <div><strong>Vencimento</strong><div>{formatarData(parcela.data_vencimento)}</div></div>
                <div><strong>Forma</strong><div>{rotuloStatus(parcela.forma_pagamento)}</div></div>
                <div><strong>Valor</strong><div>{formatarMoeda(parcela.valor)}</div></div>
                <div><strong>Status</strong><div className={`font-bold ${corStatus(parcela.status)}`}>{rotuloStatus(parcela.status)}</div></div>
                <div className="md:text-right">{podeReceber && <button type="button" onClick={() => abrirRecebimento(parcela)} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">{parcela.status === "PARCIALMENTE_RECEBIDO" ? "Receber saldo" : "Receber"}</button>}</div>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 border-t pt-3 sm:grid-cols-3">
                <div><strong>Recebido</strong><div className="text-green-700">{formatarMoeda(recebido)}</div></div>
                <div><strong>Saldo</strong><div className={saldo > 0 ? "text-orange-600" : "text-green-700"}>{formatarMoeda(saldo)}</div></div>
                {parcela.forma_pagamento === "CONDICIONADO_ENTREGA" && <div><strong>Descrição do condicionado</strong><div>{parcela.descricao_entrega || "-"}</div></div>}
              </div>

              <div className="mt-4 border-t pt-3">
                <strong>Histórico de recebimentos</strong>
                {recebimentos.length === 0 ? <div className="mt-2 text-gray-500">Nenhum recebimento registrado.</div> : (
                  <div className="mt-2 overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead><tr className="border-b text-left text-gray-500"><th className="py-2 pr-3">Data</th><th className="py-2 pr-3">Valor</th><th className="py-2 pr-3">Observação</th><th className="py-2 text-right">Ações</th></tr></thead>
                      <tbody>{recebimentos.map((recebimento) => (
                        <tr key={recebimento.id} className="border-b last:border-0">
                          <td className="py-2 pr-3">{formatarData(recebimento.data_recebimento)}</td>
                          <td className="py-2 pr-3 text-green-700">{formatarMoeda(recebimento.valor)}</td>
                          <td className="py-2 pr-3">{recebimento.observacao || "-"}</td>
                          <td className="py-2 text-right"><button type="button" onClick={() => setRecebimentoEditando(recebimento)} className="mr-2 text-blue-700 hover:underline">Alterar</button><button type="button" onClick={() => void removerRecebimento(recebimento)} className="text-red-600 hover:underline">Excluir</button></td>
                        </tr>
                      ))}</tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <ReceberParcelaModal aberto={modalAberto} valorParcela={parcelaSelecionada?.valor ?? 0} totalRecebido={totalRecebido(parcelaSelecionada?.id)} onCancelar={fecharRecebimento} onConfirmar={confirmarRecebimento} />
      <EditarRecebimentoModal recebimento={recebimentoEditando} onCancelar={() => setRecebimentoEditando(null)} onConfirmar={(recebimento) => void salvarEdicaoRecebimento(recebimento)} />
    </>
  );
}



import { Fragment, useCallback, useEffect, useState } from "react";

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
import { carregarGeradorPdf } from "../../services/geradorPdf";
import { adicionarCabecalhoPdf } from "../../services/cabecalhoPdf";

type Props = {
  venda: Venda;
  onAtualizar: () => Promise<void>;
  onArquivar?: (venda: Venda) => Promise<void>;
};
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

export default function VendaDetalhes({ venda, onAtualizar, onArquivar }: Props) {
  const [parcelas, setParcelas] = useState<VendaParcela[]>([]);
  const [recebimentosPorParcela, setRecebimentosPorParcela] = useState<RecebimentosPorParcela>({});
  const [parcelaExpandida, setParcelaExpandida] = useState<number | null>(null);
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

  async function gerarRelatorio() {
    const { jsPDF, autoTable } = await carregarGeradorPdf();
    const doc = new jsPDF();
    const totalRecebidoVenda = parcelas.reduce((total, parcela) => total + totalRecebido(parcela.id), 0);
    const saldoVenda = Number(venda.valor_total) - totalRecebidoVenda;

    await adicionarCabecalhoPdf(doc, `Relatório da Venda #${venda.id ?? "-"}`);
    doc.setFontSize(10);
    doc.text(`Cliente: ${venda.cliente}`, 14, 43);
    doc.text(`Responsável: ${venda.responsavel || "-"}`, 14, 49);
    doc.text(`Data da venda: ${formatarData(venda.data_venda)}`, 14, 55);
    doc.text(`Endereço: ${(venda.endereco ?? "").trim() || "-"}`, 14, 61);
    doc.text(`Cidade: ${(venda.cidade ?? "").trim() || "-"}`, 14, 67);
    doc.text(`Status: ${rotuloStatus(venda.status)}`, 14, 73);
    doc.text(`Valor total: ${formatarMoeda(venda.valor_total)}`, 112, 43);
    doc.text(`Total recebido: ${formatarMoeda(totalRecebidoVenda)}`, 112, 49);
    doc.text(`Saldo: ${formatarMoeda(saldoVenda)}`, 112, 55);
    doc.text(`Emitido em: ${new Date().toLocaleDateString("pt-BR")}`, 112, 61);

    autoTable(doc, {
      startY: 81,
      head: [["Parcela", "Vencimento", "Forma", "Valor", "Recebido", "Saldo", "Status"]],
      body: parcelas.map((parcela) => {
        const recebido = totalRecebido(parcela.id);
        return [`${parcela.numero_parcela}/${parcela.total_parcelas}`, formatarData(parcela.data_vencimento), rotuloStatus(parcela.forma_pagamento), formatarMoeda(parcela.valor), formatarMoeda(recebido), formatarMoeda(Number(parcela.valor) - recebido), rotuloStatus(parcela.status)];
      }),
      styles: { fontSize: 8 },
      headStyles: { fillColor: [30, 64, 175] },
    });

    const tabelaParcelas = doc as typeof doc & { lastAutoTable?: { finalY: number } };
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

  async function confirmarArquivamento() {
    if (!onArquivar) return;

    if (venda.status !== "RECEBIDO") {
      alert("Somente obras com todas as parcelas recebidas podem ser finalizadas.");
      return;
    }

    if (!window.confirm(`Finalizar a obra de ${venda.cliente}? Ela ficará disponível em Obras Finalizadas.`)) {
      return;
    }

    try {
      await onArquivar(venda);
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Não foi possível finalizar a obra.");
    }
  }

  return (
    <>
      <div className="min-w-0 max-w-full overflow-hidden rounded-lg bg-slate-100 p-4 text-sm">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="grid min-w-0 flex-1 grid-cols-1 gap-3 md:grid-cols-2">
            <p><strong>Cliente</strong><br />{venda.cliente}</p>
            <p><strong>Responsável</strong><br />{venda.responsavel || "-"}</p>
            <p><strong>Data da venda</strong><br />{formatarData(venda.data_venda)}</p>
            <p><strong>Valor total</strong><br />{formatarMoeda(venda.valor_total)}</p>
            <p><strong>Endereço</strong><br />{(venda.endereco ?? "").trim() || "-"}</p>
            <p><strong>Cidade</strong><br />{(venda.cidade ?? "").trim() || "-"}</p>
          </div>
          <div className="flex shrink-0 flex-wrap gap-2">
            <button type="button" onClick={gerarRelatorio} disabled={carregando} className="rounded-md bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:bg-red-400">Gerar PDF</button>
            {onArquivar && (
              <button
                type="button"
                onClick={() => void confirmarArquivamento()}
                disabled={carregando || venda.status !== "RECEBIDO"}
                title={venda.status !== "RECEBIDO" ? "A obra só pode ser finalizada quando todas as parcelas estiverem recebidas." : ""}
                className="rounded-md bg-blue-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
              >
                Arquivar
              </button>
            )}
          </div>
        </div>

        <div className="mb-4"><strong>Observações</strong><div className="mt-1.5 rounded-lg bg-white p-2.5">{venda.observacoes || "-"}</div></div>
        <h3 className="mb-3 text-lg font-bold">Parcelas</h3>
        {carregando && <div className="italic text-gray-500">Carregando parcelas...</div>}
        {!carregando && parcelas.length === 0 && <div className="italic text-gray-500">Nenhuma parcela cadastrada.</div>}

        {!carregando && parcelas.length > 0 && (
          <div className="max-w-full overflow-x-auto rounded-lg border bg-white">
            <table className="w-full min-w-[860px] text-xs">
              <thead><tr className="border-b bg-blue-50/70 text-blue-950"><th className="w-8 px-2 py-2.5"></th><th className="px-2 text-left">Parcela</th><th className="px-2 text-left">Vencimento</th><th className="px-2 text-left">Forma</th><th className="px-2 text-right">Valor</th><th className="px-2 text-right">Recebido</th><th className="px-2 text-right">Saldo</th><th className="px-2 text-center">Status</th><th className="px-2 text-right">Ações</th></tr></thead>
              <tbody>{parcelas.map((parcela, indice) => {
                const recebimentos = recebimentosPorParcela[parcela.id ?? 0] ?? [];
                const recebido = totalRecebido(parcela.id);
                const saldo = Number(parcela.valor) - recebido;
                const podeReceber = parcela.status === "A_RECEBER" || parcela.status === "PARCIALMENTE_RECEBIDO";
                const chaveParcela = parcela.id ?? -parcela.numero_parcela;
                const expandida = parcelaExpandida === chaveParcela;

                return (
                  <Fragment key={chaveParcela}>
                    <tr className={`border-b transition-colors hover:bg-blue-50 ${indice % 2 === 0 ? "bg-white" : "bg-slate-50/70"}`}>
                      <td className="px-2 py-2.5 text-center"><button type="button" onClick={() => setParcelaExpandida(expandida ? null : chaveParcela)} className="text-base font-bold text-blue-700" aria-label={expandida ? "Fechar detalhes" : "Abrir detalhes"}>{expandida ? "⌄" : "›"}</button></td>
                      <td className="px-2 py-2.5 font-semibold">{parcela.numero_parcela}/{parcela.total_parcelas}</td>
                      <td className="px-2">{formatarData(parcela.data_vencimento)}</td>
                      <td className="px-2">{rotuloStatus(parcela.forma_pagamento)}</td>
                      <td className="px-2 text-right tabular-nums">{formatarMoeda(parcela.valor)}</td>
                      <td className="px-2 text-right text-green-700 tabular-nums">{formatarMoeda(recebido)}</td>
                      <td className={`px-2 text-right font-semibold tabular-nums ${saldo > 0 ? "text-orange-600" : "text-green-700"}`}>{formatarMoeda(saldo)}</td>
                      <td className={`px-2 text-center font-bold ${corStatus(parcela.status)}`}>{rotuloStatus(parcela.status)}</td>
                      <td className="px-2 text-right">{podeReceber && <button type="button" onClick={() => abrirRecebimento(parcela)} className="whitespace-nowrap rounded-md bg-green-600 px-2.5 py-1 text-xs font-semibold text-white hover:bg-green-700">{parcela.status === "PARCIALMENTE_RECEBIDO" ? "Receber saldo" : "Receber"}</button>}</td>
                    </tr>
                    {expandida && <tr className="border-b bg-slate-50"><td colSpan={9} className="p-4">
                      {parcela.forma_pagamento === "CONDICIONADO_ENTREGA" && <div className="mb-3 text-sm"><strong>Descrição do condicionado:</strong> {parcela.descricao_entrega || "-"}</div>}
                      <strong>Histórico de recebimentos</strong>
                      {recebimentos.length === 0 ? <div className="mt-2 text-gray-500">Nenhum recebimento registrado.</div> : <div className="mt-2 overflow-x-auto"><table className="w-full text-sm"><thead><tr className="border-b text-left text-gray-500"><th className="py-2 pr-3">Data</th><th className="py-2 pr-3">Valor</th><th className="py-2 pr-3">Observação</th><th className="py-2 text-right">Ações</th></tr></thead><tbody>{recebimentos.map((recebimento) => <tr key={recebimento.id} className="border-b last:border-0"><td className="py-2 pr-3">{formatarData(recebimento.data_recebimento)}</td><td className="py-2 pr-3 text-green-700">{formatarMoeda(recebimento.valor)}</td><td className="py-2 pr-3">{recebimento.observacao || "-"}</td><td className="py-2 text-right"><button type="button" onClick={() => setRecebimentoEditando(recebimento)} className="mr-2 text-blue-700 hover:underline">Alterar</button><button type="button" onClick={() => void removerRecebimento(recebimento)} className="text-red-600 hover:underline">Excluir</button></td></tr>)}</tbody></table></div>}
                    </td></tr>}
                  </Fragment>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </div>

      <ReceberParcelaModal aberto={modalAberto} valorParcela={parcelaSelecionada?.valor ?? 0} totalRecebido={totalRecebido(parcelaSelecionada?.id)} onCancelar={fecharRecebimento} onConfirmar={confirmarRecebimento} />
      <EditarRecebimentoModal recebimento={recebimentoEditando} onCancelar={() => setRecebimentoEditando(null)} onConfirmar={(recebimento) => void salvarEdicaoRecebimento(recebimento)} />
    </>
  );
}





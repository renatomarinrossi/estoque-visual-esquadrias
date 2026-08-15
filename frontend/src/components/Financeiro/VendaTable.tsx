import { Fragment, useCallback, useEffect, useState } from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";
import { buscarProximaParcela, buscarTotaisRecebidosVendas } from "../../services/vendaParcelaSupabase";
import VendaDetalhes from "./VendaDetalhes";

type Props = {
  vendas: Venda[];
  onEditar?: (venda: Venda) => void;
  onExcluir?: (venda: Venda) => void;
  onAtualizar: () => Promise<void>;
  onArquivar?: (venda: Venda) => Promise<void>;
  onRestaurar?: (venda: Venda) => Promise<void>;
  obrasFinalizadas?: boolean;
};

type ProximasParcelas = Record<number, VendaParcela | null>;

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
  if (status === "RECEBIDO") return "bg-green-100 text-green-700";
  if (status === "CANCELADO") return "bg-red-100 text-red-700";
  return "bg-amber-100 text-amber-700";
}

export default function VendaTable({
  vendas,
  onEditar,
  onExcluir,
  onAtualizar,
  onArquivar,
  onRestaurar,
  obrasFinalizadas = false,
}: Props) {
  const [vendaExpandida, setVendaExpandida] = useState<number | null>(null);
  const [proximasParcelas, setProximasParcelas] = useState<ProximasParcelas>({});
  const [totaisRecebidos, setTotaisRecebidos] = useState<Record<number, number>>({});
  const [carregandoResumo, setCarregandoResumo] = useState(false);

  const carregarResumoVendas = useCallback(async () => {
    const vendasComId = vendas.filter((venda): venda is Venda & { id: number } => venda.id !== undefined);
    if (vendasComId.length === 0) {
      setProximasParcelas({});
      setTotaisRecebidos({});
      return;
    }

    setCarregandoResumo(true);
    try {
      const [proximas, totais] = await Promise.all([
        Promise.all(vendasComId.map(async (venda) => [venda.id, await buscarProximaParcela(venda.id)] as const)),
        buscarTotaisRecebidosVendas(vendasComId.map((venda) => venda.id)),
      ]);
      setProximasParcelas(Object.fromEntries(proximas));
      setTotaisRecebidos(totais);
    } catch (erro) {
      console.error(erro);
      setProximasParcelas({});
      setTotaisRecebidos({});
    } finally {
      setCarregandoResumo(false);
    }
  }, [vendas]);

  useEffect(() => { void carregarResumoVendas(); }, [carregarResumoVendas]);

  function alternarVenda(id: number) {
    setVendaExpandida((atual) => (atual === id ? null : id));
  }

  async function atualizarDadosVenda() {
    await onAtualizar();
    await carregarResumoVendas();
  }

  return (
    <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-md">
      <table className="w-full min-w-[980px]">
        <thead><tr className="border-b bg-blue-50/70 text-blue-950"><th className="rounded-l-lg px-3 py-4 text-left">Cliente</th><th className="w-52 px-3 text-center">Próx. Recebimento</th><th className="w-40 px-3 text-right">Total venda</th><th className="w-40 px-3 text-center">Status</th><th className="w-44 px-3 text-right">Receb. restante</th><th className="w-44 rounded-r-lg px-3 text-center">Ações</th></tr></thead>
        <tbody>
          {vendas.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">{obrasFinalizadas ? "Nenhuma obra finalizada encontrada." : "Nenhuma venda cadastrada."}</td></tr>}
          {vendas.map((venda, indice) => {
            const proximaParcela = venda.id ? proximasParcelas[venda.id] : null;
            const recebido = venda.id ? totaisRecebidos[venda.id] ?? 0 : 0;
            const restante = Math.max(0, Number(venda.valor_total) - recebido);

            return (
              <Fragment key={venda.id}>
                <tr className={`border-b transition-colors hover:bg-blue-50 ${indice % 2 === 0 ? "bg-white" : "bg-slate-50/70"}`}>
                  <td className="px-3 py-4">{venda.id ? <button type="button" onClick={() => alternarVenda(venda.id!)} className="font-semibold text-blue-700 hover:text-blue-900">{vendaExpandida === venda.id ? "⌄ " : "› "}{venda.cliente}</button> : <span className="font-semibold">{venda.cliente}</span>}</td>
                  <td className="text-center">{carregandoResumo ? <span className="text-gray-500">Carregando...</span> : proximaParcela ? <div><div>{formatarData(proximaParcela.data_vencimento)}</div><div className="text-sm text-gray-500">{formatarMoeda(proximaParcela.valor)}</div></div> : <span className="text-gray-500">-</span>}</td>
                  <td className="px-3 text-right tabular-nums">{formatarMoeda(venda.valor_total)}</td>
                  <td className="px-3 text-center"><span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${corStatus(venda.status)}`}>{rotuloStatus(venda.status)}</span></td>
                  <td className={`px-3 text-right font-semibold tabular-nums ${restante > 0 ? "text-orange-600" : "text-green-700"}`}>{carregandoResumo ? "-" : formatarMoeda(restante)}</td>
                  <td className="py-2">
                    <div className="flex justify-center gap-2">
                      {obrasFinalizadas ? (
                        <button
                          type="button"
                          onClick={() => onRestaurar && void onRestaurar(venda)}
                          className="rounded-md border border-blue-600 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50"
                        >
                          Restaurar
                        </button>
                      ) : (
                        <>
                          {onEditar && <button type="button" onClick={() => onEditar(venda)} className="rounded-md border border-blue-500 px-3 py-1.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-50">Editar</button>}
                          {onExcluir && <button type="button" onClick={() => onExcluir(venda)} className="rounded-md border border-red-400 px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50">Excluir</button>}
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {vendaExpandida === venda.id && <tr className="bg-slate-50"><td colSpan={6} className="p-4"><VendaDetalhes venda={venda} onAtualizar={atualizarDadosVenda} onArquivar={obrasFinalizadas ? undefined : onArquivar} /></td></tr>}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}




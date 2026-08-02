import { Fragment, useCallback, useEffect, useState } from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";
import { buscarProximaParcela, buscarTotaisRecebidosVendas } from "../../services/vendaParcelaSupabase";
import VendaDetalhes from "./VendaDetalhes";

type Props = {
  vendas: Venda[];
  onEditar: (venda: Venda) => void;
  onExcluir: (venda: Venda) => void;
  onAtualizar: () => Promise<void>;
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
  if (status === "RECEBIDO") return "text-green-600";
  if (status === "CANCELADO") return "text-red-600";
  return "text-yellow-600";
}

export default function VendaTable({ vendas, onEditar, onExcluir, onAtualizar }: Props) {
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
        <thead><tr className="border-b"><th className="py-3 text-left">Cliente</th><th className="w-52 text-center">Próx. Recebimento</th><th className="w-40 text-center">Total venda</th><th className="w-40 text-center">Status</th><th className="w-44 text-center">Receb. restante</th><th className="w-44 text-center">Ações</th></tr></thead>
        <tbody>
          {vendas.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-500">Nenhuma venda cadastrada.</td></tr>}
          {vendas.map((venda) => {
            const proximaParcela = venda.id ? proximasParcelas[venda.id] : null;
            const recebido = venda.id ? totaisRecebidos[venda.id] ?? 0 : 0;
            const restante = Math.max(0, Number(venda.valor_total) - recebido);

            return (
              <Fragment key={venda.id}>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3">{venda.id ? <button type="button" onClick={() => alternarVenda(venda.id!)} className="font-semibold text-blue-700 hover:text-blue-900">{vendaExpandida === venda.id ? "▼ " : "▶ "}{venda.cliente}</button> : <span className="font-semibold">{venda.cliente}</span>}</td>
                  <td className="text-center">{carregandoResumo ? <span className="text-gray-500">Carregando...</span> : proximaParcela ? <div><div>{formatarData(proximaParcela.data_vencimento)}</div><div className="text-sm text-gray-500">{formatarMoeda(proximaParcela.valor)}</div></div> : <span className="text-gray-500">-</span>}</td>
                  <td className="text-center">{formatarMoeda(venda.valor_total)}</td>
                  <td className={`text-center font-bold ${corStatus(venda.status)}`}>{rotuloStatus(venda.status)}</td>
                  <td className={`text-center font-semibold ${restante > 0 ? "text-orange-600" : "text-green-700"}`}>{carregandoResumo ? "-" : formatarMoeda(restante)}</td>
                  <td className="py-2"><div className="flex justify-center gap-2"><button type="button" onClick={() => onEditar(venda)} className="rounded bg-yellow-500 px-3 py-1 text-white hover:bg-yellow-600">Editar</button><button type="button" onClick={() => onExcluir(venda)} className="rounded bg-red-600 px-3 py-1 text-white hover:bg-red-700">Excluir</button></div></td>
                </tr>
                {vendaExpandida === venda.id && <tr className="bg-slate-50"><td colSpan={6} className="p-4"><VendaDetalhes venda={venda} onAtualizar={atualizarDadosVenda} /></td></tr>}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


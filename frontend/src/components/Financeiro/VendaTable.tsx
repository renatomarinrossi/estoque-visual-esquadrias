import { Fragment, useCallback, useEffect, useState } from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";

import {
  buscarProximaParcela,
} from "../../services/vendaParcelaSupabase";

import VendaDetalhes from "./VendaDetalhes";

type Props = {
  vendas: Venda[];
  onEditar: (venda: Venda) => void;
  onExcluir: (venda: Venda) => void;
  onAtualizar: () => Promise<void>;
};

type ProximasParcelas = Record<number, VendaParcela | null>;

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

function rotuloStatus(status: string) {
  return status.replace(/_/g, " ");
}

function corStatus(status: string) {
  switch (status) {
    case "RECEBIDO":
      return "text-green-600";
    case "CANCELADO":
      return "text-red-600";
    default:
      return "text-yellow-600";
  }
}

export default function VendaTable({
  vendas,
  onEditar,
  onExcluir,
  onAtualizar,
}: Props) {
  const [vendaExpandida, setVendaExpandida] = useState<number | null>(null);
  const [proximasParcelas, setProximasParcelas] =
    useState<ProximasParcelas>({});
  const [carregandoProximas, setCarregandoProximas] = useState(false);

  const carregarProximasParcelas = useCallback(async () => {
    const vendasComId = vendas.filter(
      (venda): venda is Venda & { id: number } => venda.id !== undefined
    );

    if (vendasComId.length === 0) {
      setProximasParcelas({});
      return;
    }

    setCarregandoProximas(true);

    try {
      const resultados = await Promise.all(
        vendasComId.map(async (venda) => {
          const parcela = (await buscarProximaParcela(
            venda.id
          )) as VendaParcela | null;

          return [venda.id, parcela] as const;
        })
      );

      setProximasParcelas(Object.fromEntries(resultados));
    } catch (error) {
      console.error(error);
      setProximasParcelas({});
    } finally {
      setCarregandoProximas(false);
    }
  }, [vendas]);

  useEffect(() => {
    void carregarProximasParcelas();
  }, [carregarProximasParcelas]);

  function alternarVenda(id: number) {
    setVendaExpandida((atual) => (atual === id ? null : id));
  }

  async function atualizarDadosVenda() {
    await onAtualizar();
    await carregarProximasParcelas();
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 overflow-x-auto">
      <table className="w-full min-w-[800px]">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3">Cliente</th>
            <th className="text-center w-52">Próximo recebimento</th>
            <th className="text-center w-44">Valor total</th>
            <th className="text-center w-40">Status</th>
            <th className="text-center w-44">Ações</th>
          </tr>
        </thead>

        <tbody>
          {vendas.length === 0 && (
            <tr>
              <td colSpan={5} className="py-8 text-center text-gray-500">
                Nenhuma venda cadastrada.
              </td>
            </tr>
          )}

          {vendas.map((venda) => {
            const proximaParcela = venda.id
              ? proximasParcelas[venda.id]
              : null;

            return (
              <Fragment key={venda.id}>
                <tr className="border-b hover:bg-slate-50">
                  <td className="py-3">
                    {venda.id ? (
                      <button
                        type="button"
                        onClick={() => alternarVenda(venda.id!)}
                        className="font-semibold text-blue-700 hover:text-blue-900"
                      >
                        {vendaExpandida === venda.id ? "▼ " : "▶ "}
                        {venda.cliente}
                      </button>
                    ) : (
                      <span className="font-semibold">{venda.cliente}</span>
                    )}
                  </td>

                  <td className="text-center">
                    {carregandoProximas ? (
                      <span className="text-gray-500">Carregando...</span>
                    ) : proximaParcela ? (
                      <div>
                        <div>{formatarData(proximaParcela.data_vencimento)}</div>
                        <div className="text-sm text-gray-500">
                          {formatarMoeda(proximaParcela.valor)}
                        </div>
                      </div>
                    ) : (
                      <span className="text-gray-500">-</span>
                    )}
                  </td>

                  <td className="text-center">
                    {formatarMoeda(venda.valor_total)}
                  </td>

                  <td
                    className={`text-center font-bold ${corStatus(
                      venda.status
                    )}`}
                  >
                    {rotuloStatus(venda.status)}
                  </td>

                  <td className="py-2">
                    <div className="flex justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => onEditar(venda)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                      >
                        Editar
                      </button>

                      <button
                        type="button"
                        onClick={() => onExcluir(venda)}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                      >
                        Excluir
                      </button>
                    </div>
                  </td>
                </tr>

                {vendaExpandida === venda.id && (
                  <tr className="bg-slate-50">
                    <td colSpan={5} className="p-4">
                      <VendaDetalhes
                        venda={venda}
                        onAtualizar={atualizarDadosVenda}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}


import { Fragment, useState } from "react";

import type { Venda } from "../../types/Venda";

import VendaDetalhes from "./VendaDetalhes";

type Props = {
  vendas: Venda[];

  onEditar: (venda: Venda) => void;

  onExcluir: (venda: Venda) => void;

  onAtualizar: () => Promise<void>;
};

export default function VendaTable({
  vendas,
  onEditar,
  onExcluir,
  onAtualizar,
}: Props) {
  const [vendaExpandida, setVendaExpandida] =
    useState<number | null>(null);

  function alternarVenda(id: number) {
    setVendaExpandida((old) =>
      old === id ? null : id
    );
  }

  function statusCor(status: string) {
    switch (status) {
      case "RECEBIDO":
        return "text-green-600 font-bold";

      case "CANCELADO":
        return "text-red-600 font-bold";

      default:
        return "text-yellow-600 font-bold";
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <table className="w-full">

        <thead>

          <tr className="border-b">

            <th className="text-left py-3">
              Cliente
            </th>

            <th className="text-center w-48">
              Próximo Recebimento
            </th>

            <th className="text-center w-44">
              Valor Total
            </th>

            <th className="text-center w-40">
              Status
            </th>

            <th className="text-center w-44">
              Ações
            </th>

          </tr>

        </thead>

        <tbody>

          {vendas.map((venda) => (

            <Fragment key={venda.id}>

              <tr className="border-b hover:bg-slate-50">

                <td className="py-3">

                  <button
                    onClick={() =>
                      alternarVenda(
                        venda.id!
                      )
                    }
                    className="font-semibold text-blue-700 hover:text-blue-900"
                  >

                    {vendaExpandida === venda.id
                      ? "▼ "
                      : "▶ "}

                    {venda.cliente}

                  </button>

                </td>

                <td className="text-center">

                  --

                </td>

                <td className="text-center">

                  {venda.valor_total.toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    }
                  )}

                </td>

                <td
                  className={`text-center ${statusCor(
                    venda.status
                  )}`}
                >

                  {venda.status.replace(/_/g, " ")}

                </td>

                <td className="py-2">

                  <div className="flex justify-center gap-2">

                    <button
                      onClick={() =>
                        onEditar(venda)
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        onExcluir(venda)
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Excluir
                    </button>

                  </div>

                </td>

              </tr>

              {vendaExpandida === venda.id && (

                <tr>

                  <td colSpan={5}>

                    <VendaDetalhes
                      venda={venda}
                      onAtualizar={
                        onAtualizar
                      }
                    />

                  </td>

                </tr>

              )}

            </Fragment>

          ))}

        </tbody>

      </table>
    </div>
  );
}

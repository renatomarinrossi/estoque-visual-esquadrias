import { Dispatch, SetStateAction, useState } from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";

import ParcelasForm from "./ParcelasForm";

type Props = {
  venda: Venda;
  setVenda: Dispatch<SetStateAction<Venda>>;
  onSalvar: (
    venda: Venda,
    parcelas: VendaParcela[]
  ) => void;
  onCancelar: () => void;
};

const statusVenda = [
  "A_RECEBER",
  "RECEBIDO",
  "CANCELADO",
];

export default function VendaForm({
  venda,
  setVenda,
  onSalvar,
  onCancelar,
}: Props) {

  const [parcelas, setParcelas] =
    useState<VendaParcela[]>([]);

  function alterarCampo(
    campo: keyof Venda,
    valor: any
  ) {
    setVenda((old) => ({
      ...old,
      [campo]: valor,
    }));
  }

  function salvar() {

    const totalParcelas =
      parcelas.reduce(
        (total, parcela) =>
          total + Number(parcela.valor),
        0
      );

    if (
      parcelas.length > 0 &&
      totalParcelas !== venda.valor_total
    ) {

      alert(
        "O total das parcelas deve ser igual ao valor da venda."
      );

      return;

    }

    onSalvar(
      venda,
      parcelas
    );

  }

  return (

    <div className="bg-white rounded-xl shadow-md p-6 mb-8">

      <h2 className="text-2xl font-bold text-blue-900 mb-6">

        {venda.id
          ? "Editar Venda"
          : "Nova Venda"}

      </h2>

      <div className="grid grid-cols-2 gap-5">

        <div>

          <label className="block mb-2 font-semibold">

            Cliente

          </label>

          <input
            type="text"
            value={venda.cliente}
            onChange={(e) =>
              alterarCampo(
                "cliente",
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">

            Data da Venda

          </label>

          <input
            type="date"
            value={venda.data_venda}
            onChange={(e) =>
              alterarCampo(
                "data_venda",
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">

            Valor Total

          </label>

          <input
            type="number"
            step="0.01"
            value={venda.valor_total}
            onChange={(e) =>
              alterarCampo(
                "valor_total",
                Number(
                  e.target.value
                )
              )
            }
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">

            Responsável

          </label>

          <input
            type="text"
            value={venda.responsavel}
            onChange={(e) =>
              alterarCampo(
                "responsavel",
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div>

          <label className="block mb-2 font-semibold">

            Status

          </label>

          <select
            value={venda.status}
            onChange={(e) =>
              alterarCampo(
                "status",
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          >

            {statusVenda.map(
              (status) => (

                <option
                  key={status}
                  value={status}
                >

                  {status.replace(
                    /_/g,
                    " "
                  )}

                </option>

              )
            )}

          </select>

        </div>

      </div>

      <div className="mt-5">

        <label className="block mb-2 font-semibold">

          Observações

        </label>

        <textarea
          rows={4}
          value={venda.observacoes}
          onChange={(e) =>
            alterarCampo(
              "observacoes",
              e.target.value
            )
          }
          className="w-full border rounded-lg p-3"
        />

      </div>

      <ParcelasForm
        parcelas={parcelas}
        setParcelas={setParcelas}
      />

      <div className="flex justify-end gap-3 mt-8">

        <button
          type="button"
          onClick={onCancelar}
          className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
        >

          Cancelar

        </button>

        <button
          type="button"
          onClick={salvar}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-2 rounded-lg"
        >

          Salvar

        </button>

      </div>

    </div>

  );

}
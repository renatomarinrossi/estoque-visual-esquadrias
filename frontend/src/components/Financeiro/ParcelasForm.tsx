import {
  Dispatch,
  SetStateAction,
} from "react";

import type {
  VendaParcela,
  FormaPagamento,
} from "../../types/VendaParcela";

type Props = {
  parcelas: VendaParcela[];

  setParcelas: Dispatch<
    SetStateAction<VendaParcela[]>
  >;
};

const formasPagamento: FormaPagamento[] = [
  "PIX",
  "DINHEIRO",
  "CARTAO",
  "BOLETO",
  "CHEQUE",
  "CONDICIONADO_ENTREGA",
];

export default function ParcelasForm({
  parcelas,
  setParcelas,
}: Props) {

  function adicionarParcela() {

    setParcelas((old) => [

      ...old,

      {

        venda_id: 0,

        numero_parcela: old.length + 1,

        total_parcelas: old.length + 1,

        valor: 0,

        data_vencimento: "",

        forma_pagamento: "PIX",

        condicionado_entrega: false,

        descricao_entrega: "",

        status: "A_RECEBER",

      },

    ]);

  }

  function removerParcela(
    index: number
  ) {

    const lista = [...parcelas];

    lista.splice(index, 1);

    setParcelas(

      lista.map((parcela, i) => ({

        ...parcela,

        numero_parcela: i + 1,

        total_parcelas: lista.length,

      }))

    );

  }

  function alterarCampo(
    index: number,
    campo: keyof VendaParcela,
    valor: any
  ) {

    const lista = [...parcelas];

    lista[index] = {

      ...lista[index],

      [campo]: valor,

    };

    if (
      campo === "forma_pagamento"
    ) {

      lista[index].condicionado_entrega =
        valor ===
        "CONDICIONADO_ENTREGA";

      if (
        valor !==
        "CONDICIONADO_ENTREGA"
      ) {

        lista[index].descricao_entrega =
          "";

      }

    }

    setParcelas(lista);

  }  return (

    <div className="mt-8">

      <div className="flex justify-between items-center mb-5">

        <h3 className="text-xl font-bold text-blue-900">

          Parcelas

        </h3>

        <button
          type="button"
          onClick={adicionarParcela}
          className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
        >

          + Adicionar Parcela

        </button>

      </div>

      {parcelas.length === 0 && (

        <div className="bg-slate-100 rounded-lg p-5 text-center text-gray-500">

          Nenhuma parcela cadastrada.

        </div>

      )}

      {parcelas.map((parcela, index) => (

        <div
          key={parcela.id ?? index}
          className="border rounded-xl p-5 mb-5 bg-white shadow-sm"
        >

          <div className="flex justify-between items-center mb-5">

            <h4 className="font-bold text-lg">

              Parcela {parcela.numero_parcela} de {parcela.total_parcelas}

            </h4>

            <button
              type="button"
              onClick={() =>
                removerParcela(index)
              }
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded"
            >

              Remover

            </button>

          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

            <div>

              <label className="block mb-2 font-semibold">

                Valor

              </label>

              <input
                type="number"
                step="0.01"
                value={parcela.valor}
                onChange={(e) =>
                  alterarCampo(
                    index,
                    "valor",
                    Number(e.target.value)
                  )
                }
                className="w-full border rounded-lg p-3"
              />

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Vencimento

              </label>

              <input
                type="date"
                value={parcela.data_vencimento}
                onChange={(e) =>
                  alterarCampo(
                    index,
                    "data_vencimento",
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
              />

            </div>            <div>

              <label className="block mb-2 font-semibold">

                Forma de Pagamento

              </label>

              <select
                value={parcela.forma_pagamento}
                onChange={(e) =>
                  alterarCampo(
                    index,
                    "forma_pagamento",
                    e.target.value as FormaPagamento
                  )
                }
                className="w-full border rounded-lg p-3"
              >

                {formasPagamento.map((forma) => (

                  <option
                    key={forma}
                    value={forma}
                  >

                    {forma.replace(/_/g, " ")}

                  </option>

                ))}

              </select>

            </div>

            <div>

              <label className="block mb-2 font-semibold">

                Status

              </label>

              <select
                value={parcela.status}
                onChange={(e) =>
                  alterarCampo(
                    index,
                    "status",
                    e.target.value as VendaParcela["status"]
                  )
                }
                className="w-full border rounded-lg p-3"
              >

                <option value="A_RECEBER">
                  A Receber
                </option>

                <option value="PARCIALMENTE_RECEBIDO">
                  Parcialmente Recebido
                </option>

                <option value="RECEBIDO">
                  Recebido
                </option>

                <option value="CANCELADO">
                  Cancelado
                </option>

              </select>

            </div>

          </div>

          {parcela.forma_pagamento ===
            "CONDICIONADO_ENTREGA" && (

            <div className="mt-5">

              <label className="block mb-2 font-semibold">

                Descrição do Condicionado

              </label>

              <textarea
                rows={3}
                value={parcela.descricao_entrega}
                onChange={(e) =>
                  alterarCampo(
                    index,
                    "descricao_entrega",
                    e.target.value
                  )
                }
                className="w-full border rounded-lg p-3"
              />

            </div>

          )}        </div>

      ))}

    </div>

  );

}

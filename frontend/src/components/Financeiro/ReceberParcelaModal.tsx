import { useEffect, useState } from "react";

type Props = {
  aberto: boolean;

  valorParcela: number;

  totalRecebido: number;

  onCancelar: () => void;

  onConfirmar: (
    data: string,
    valor: number,
    observacao: string
  ) => void;
};

export default function ReceberParcelaModal({
  aberto,
  valorParcela,
  totalRecebido,
  onCancelar,
  onConfirmar,
}: Props) {

  const hoje = new Date()
    .toISOString()
    .split("T")[0];

  const saldo =
    valorParcela - totalRecebido;

  const [dataRecebimento, setDataRecebimento] =
    useState(hoje);

  const [valorRecebido, setValorRecebido] =
    useState(saldo);

  const [observacao, setObservacao] =
    useState("");

  useEffect(() => {

    setValorRecebido(saldo);

    setDataRecebimento(hoje);

    setObservacao("");

  }, [aberto, saldo]);

  if (!aberto) return null;

  return (

    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">

      <div className="bg-white rounded-xl shadow-xl w-[520px] p-6">

        <h2 className="text-2xl font-bold text-blue-900 mb-6">

          Receber Parcela

        </h2>

        <div className="grid grid-cols-3 gap-4 mb-6">

          <div>

            <div className="text-sm text-gray-500">

              Valor da Parcela

            </div>

            <div className="font-bold text-lg">

              {valorParcela.toLocaleString(
                "pt-BR",
                {
                  style: "currency",
                  currency: "BRL",
                }
              )}

            </div>

          </div>

          <div>

            <div className="text-sm text-gray-500">

              Já Recebido

            </div>

            <div className="font-bold text-green-700 text-lg">

              {totalRecebido.toLocaleString(
                "pt-BR",
                {
                  style: "currency",
                  currency: "BRL",
                }
              )}

            </div>

          </div>

          <div>

            <div className="text-sm text-gray-500">

              Saldo

            </div>

            <div className="font-bold text-orange-600 text-lg">

              {saldo.toLocaleString(
                "pt-BR",
                {
                  style: "currency",
                  currency: "BRL",
                }
              )}

            </div>

          </div>

        </div>

        <div className="space-y-4">

          <div>

            <label className="block mb-2 font-semibold">

              Data do Recebimento

            </label>

            <input
              type="date"
              value={dataRecebimento}
              onChange={(e) =>
                setDataRecebimento(
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">

              Valor deste Recebimento

            </label>

            <input
              type="number"
              step="0.01"
              value={valorRecebido}
              onChange={(e) =>
                setValorRecebido(
                  Number(e.target.value)
                )
              }
              className="w-full border rounded-lg p-3"
            />

          </div>

          <div>

            <label className="block mb-2 font-semibold">

              Observação

            </label>

            <textarea
              rows={4}
              value={observacao}
              onChange={(e) =>
                setObservacao(
                  e.target.value
                )
              }
              className="w-full border rounded-lg p-3"
            />

          </div>

        </div>

        <div className="flex justify-end gap-3 mt-8">

          <button
            onClick={onCancelar}
            className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
          >

            Cancelar

          </button>

          <button
            onClick={() =>
              onConfirmar(
                dataRecebimento,
                valorRecebido,
                observacao
              )
            }
            className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
          >

            Confirmar

          </button>

        </div>

      </div>

    </div>

  );

}

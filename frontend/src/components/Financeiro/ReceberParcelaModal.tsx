import { useEffect, useState } from "react";

type Props = {
  aberto: boolean;
  valorParcela: number;
  totalRecebido: number;
  onCancelar: () => void;
  onConfirmar: (data: string, valor: number, observacao: string) => void;
};

function dataDeHoje() {
  return new Date().toISOString().split("T")[0];
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export default function ReceberParcelaModal({
  aberto,
  valorParcela,
  totalRecebido,
  onCancelar,
  onConfirmar,
}: Props) {
  const saldo = valorParcela - totalRecebido;
  const [dataRecebimento, setDataRecebimento] = useState(dataDeHoje);
  const [valorRecebido, setValorRecebido] = useState(saldo);
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (!aberto) return;

    setValorRecebido(saldo);
    setDataRecebimento(dataDeHoje());
    setObservacao("");
  }, [aberto, saldo]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-[520px] rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-blue-900">Receber Parcela</h2>

        <div className="mb-6 grid grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500">Valor da Parcela</div>
            <div className="text-lg font-bold">{formatarMoeda(valorParcela)}</div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Já Recebido</div>
            <div className="text-lg font-bold text-green-700">
              {formatarMoeda(totalRecebido)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500">Saldo</div>
            <div className="text-lg font-bold text-orange-600">
              {formatarMoeda(saldo)}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-semibold">Data do Recebimento</label>
            <input
              type="date"
              value={dataRecebimento}
              onChange={(event) => setDataRecebimento(event.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold">Valor deste Recebimento</label>
            <input
              type="number"
              step="0.01"
              value={valorRecebido}
              onChange={(event) => setValorRecebido(Number(event.target.value))}
              className="w-full rounded-lg border p-3"
            />
          </div>
          <div>
            <label className="mb-2 block font-semibold">Observação</label>
            <textarea
              rows={4}
              value={observacao}
              onChange={(event) => setObservacao(event.target.value)}
              className="w-full rounded-lg border p-3"
            />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancelar}
            className="rounded-lg bg-gray-500 px-5 py-2 text-white hover:bg-gray-600"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => onConfirmar(dataRecebimento, valorRecebido, observacao)}
            className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700"
          >
            Confirmar
          </button>
        </div>
      </div>
    </div>
  );
}


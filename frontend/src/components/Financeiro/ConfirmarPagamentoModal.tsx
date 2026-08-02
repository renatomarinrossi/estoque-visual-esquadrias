import { useEffect, useState } from "react";

type Props = {
  aberto: boolean;
  favorecido: string;
  onCancelar: () => void;
  onConfirmar: (dataPagamento: string) => void;
};

export default function ConfirmarPagamentoModal({ aberto, favorecido, onCancelar, onConfirmar }: Props) {
  const [dataPagamento, setDataPagamento] = useState("");

  useEffect(() => {
    if (aberto) setDataPagamento(new Date().toISOString().slice(0, 10));
  }, [aberto]);

  if (!aberto) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-2 text-2xl font-bold text-blue-900">Confirmar pagamento</h2>
        <p className="mb-6 text-gray-600">Informe a data do pagamento para {favorecido}.</p>
        <label className="mb-2 block font-semibold">Data de pagamento</label>
        <input type="date" value={dataPagamento} onChange={(event) => setDataPagamento(event.target.value)} className="w-full rounded-lg border p-3" />
        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className="rounded-lg bg-gray-500 px-5 py-2 text-white hover:bg-gray-600">Cancelar</button>
          <button type="button" onClick={() => { if (!dataPagamento) { alert("Informe a data do pagamento."); return; } onConfirmar(dataPagamento); }} className="rounded-lg bg-green-600 px-5 py-2 text-white hover:bg-green-700">Confirmar</button>
        </div>
      </div>
    </div>
  );
}


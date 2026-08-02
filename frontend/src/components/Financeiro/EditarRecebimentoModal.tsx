import { useEffect, useState } from "react";

import type { VendaRecebimento } from "../../services/vendaRecebimentoSupabase";

type Props = {
  recebimento: VendaRecebimento | null;
  onCancelar: () => void;
  onConfirmar: (recebimento: VendaRecebimento) => void;
};

export default function EditarRecebimentoModal({
  recebimento,
  onCancelar,
  onConfirmar,
}: Props) {
  const [dataRecebimento, setDataRecebimento] = useState("");
  const [valor, setValor] = useState(0);
  const [observacao, setObservacao] = useState("");

  useEffect(() => {
    if (!recebimento) return;
    setDataRecebimento(recebimento.data_recebimento);
    setValor(Number(recebimento.valor));
    setObservacao(recebimento.observacao ?? "");
  }, [recebimento]);

  if (!recebimento || !recebimento.parcela_id) return null;
  const recebimentoAtual = recebimento;

  function confirmar() {
    if (!dataRecebimento) {
      alert("Informe a data do recebimento.");
      return;
    }

    if (!Number.isFinite(valor) || valor <= 0) {
      alert("Informe um valor maior que zero.");
      return;
    }

    onConfirmar({
      id: recebimentoAtual.id,
      parcela_id: recebimentoAtual.parcela_id,
      data_recebimento: dataRecebimento,
      valor,
      observacao: observacao.trim(),
      created_at: recebimentoAtual.created_at,
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h2 className="mb-6 text-2xl font-bold text-blue-900">Alterar recebimento</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block font-semibold">Data do recebimento</label>
            <input type="date" value={dataRecebimento} onChange={(event) => setDataRecebimento(event.target.value)} className="w-full rounded-lg border p-3" />
          </div>

          <div>
            <label className="mb-2 block font-semibold">Valor recebido</label>
            <input type="number" min="0.01" step="0.01" value={valor || ""} onChange={(event) => setValor(Number(event.target.value))} className="w-full rounded-lg border p-3" />
          </div>

          <div>
            <label className="mb-2 block font-semibold">Observação</label>
            <textarea rows={4} value={observacao} onChange={(event) => setObservacao(event.target.value)} className="w-full rounded-lg border p-3" />
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3">
          <button type="button" onClick={onCancelar} className="rounded-lg bg-gray-500 px-5 py-2 text-white hover:bg-gray-600">Cancelar</button>
          <button type="button" onClick={confirmar} className="rounded-lg bg-blue-700 px-5 py-2 text-white hover:bg-blue-800">Salvar alteração</button>
        </div>
      </div>
    </div>
  );
}


import { type Dispatch, type SetStateAction } from "react";

import type { FormaPagamento, VendaParcela } from "../../types/VendaParcela";

type Props = {
  parcelas: VendaParcela[];
  setParcelas: Dispatch<SetStateAction<VendaParcela[]>>;
};

const formasPagamento: FormaPagamento[] = ["PIX", "DINHEIRO", "CARTAO", "BOLETO", "CHEQUE", "CONDICIONADO_ENTREGA"];

function normalizarParcelas(parcelas: VendaParcela[]) {
  return parcelas.map((parcela, index) => ({
    ...parcela,
    numero_parcela: index + 1,
    total_parcelas: parcelas.length,
    condicionado_entrega: parcela.forma_pagamento === "CONDICIONADO_ENTREGA",
    descricao_entrega: parcela.forma_pagamento === "CONDICIONADO_ENTREGA" ? parcela.descricao_entrega : "",
  }));
}

function rotuloStatus(status: VendaParcela["status"]) {
  return status.replace(/_/g, " ");
}

export default function ParcelasForm({ parcelas, setParcelas }: Props) {
  function adicionarParcela() {
    setParcelas((anteriores) => normalizarParcelas([...anteriores, {
      venda_id: 0,
      numero_parcela: anteriores.length + 1,
      total_parcelas: anteriores.length + 1,
      valor: 0,
      data_vencimento: "",
      forma_pagamento: "PIX",
      condicionado_entrega: false,
      descricao_entrega: "",
      status: "A_RECEBER",
    }]));
  }

  function removerParcela(index: number) {
    setParcelas((anteriores) => normalizarParcelas(anteriores.filter((_, indiceAtual) => indiceAtual !== index)));
  }

  function alterarParcela(index: number, campo: "valor" | "data_vencimento" | "forma_pagamento" | "descricao_entrega", valor: number | string) {
    setParcelas((anteriores) => {
      const atualizadas = anteriores.map((parcela, indiceAtual) => {
        if (indiceAtual !== index) return parcela;
        if (campo === "forma_pagamento") {
          const formaPagamento = valor as FormaPagamento;
          return { ...parcela, forma_pagamento: formaPagamento, condicionado_entrega: formaPagamento === "CONDICIONADO_ENTREGA", descricao_entrega: formaPagamento === "CONDICIONADO_ENTREGA" ? parcela.descricao_entrega : "" };
        }
        if (campo === "valor") return { ...parcela, valor: Number(valor) };
        if (campo === "data_vencimento") return { ...parcela, data_vencimento: String(valor) };
        return { ...parcela, descricao_entrega: String(valor) };
      });
      return normalizarParcelas(atualizadas);
    });
  }

  return (
    <div className="mt-8">
      <div className="mb-5 flex items-center justify-between"><h3 className="text-xl font-bold text-blue-900">Parcelas</h3><button type="button" onClick={adicionarParcela} className="rounded-lg bg-green-600 px-4 py-2 text-white hover:bg-green-700">+ Adicionar parcela</button></div>
      {parcelas.length === 0 && <div className="rounded-lg bg-slate-100 p-5 text-center text-gray-500">Nenhuma parcela cadastrada.</div>}
      {parcelas.map((parcela, index) => {
        const possuiRecebimentos = parcela.status !== "A_RECEBER";
        return (
          <div key={parcela.id ?? index} className="mb-5 rounded-xl border bg-white p-5 shadow-sm">
            <div className="mb-5 flex items-center justify-between"><div><h4 className="text-lg font-bold">Parcela {parcela.numero_parcela} de {parcela.total_parcelas}</h4>{possuiRecebimentos && <p className="mt-1 text-sm text-amber-700">Esta parcela possui recebimento e não pode ser removida.</p>}</div><button type="button" onClick={() => removerParcela(index)} disabled={possuiRecebimentos} title={possuiRecebimentos ? "Remova os recebimentos antes de excluir esta parcela." : "Remover parcela"} className="rounded bg-red-600 px-3 py-2 text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:bg-red-300">Remover</button></div>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div><label className="mb-2 block font-semibold">Valor</label><input type="number" min="0" step="0.01" value={parcela.valor || ""} onChange={(event) => alterarParcela(index, "valor", Number(event.target.value))} className="w-full rounded-lg border p-3" /></div>
              <div><label className="mb-2 block font-semibold">Vencimento</label><input type="date" value={parcela.data_vencimento} onChange={(event) => alterarParcela(index, "data_vencimento", event.target.value)} className="w-full rounded-lg border p-3" /></div>
              <div><label className="mb-2 block font-semibold">Forma de pagamento</label><select value={parcela.forma_pagamento} onChange={(event) => alterarParcela(index, "forma_pagamento", event.target.value as FormaPagamento)} className="w-full rounded-lg border p-3">{formasPagamento.map((forma) => <option key={forma} value={forma}>{forma.replace(/_/g, " ")}</option>)}</select></div>
              <div><label className="mb-2 block font-semibold">Status</label><div className="w-full rounded-lg border bg-slate-100 p-3 text-gray-600">{rotuloStatus(parcela.status)}</div><p className="mt-1 text-sm text-gray-500">Atualizado pelos recebimentos.</p></div>
            </div>
            {parcela.forma_pagamento === "CONDICIONADO_ENTREGA" && <div className="mt-5"><label className="mb-2 block font-semibold">Descrição do condicionado</label><textarea rows={3} value={parcela.descricao_entrega} onChange={(event) => alterarParcela(index, "descricao_entrega", event.target.value)} className="w-full rounded-lg border p-3" /></div>}
          </div>
        );
      })}
    </div>
  );
}


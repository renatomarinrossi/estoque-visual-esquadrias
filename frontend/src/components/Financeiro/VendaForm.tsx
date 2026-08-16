import {
  type Dispatch,
  type FormEvent,
  type SetStateAction,
  useEffect,
  useState,
} from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";

import {
  buscarParcelasVenda,
} from "../../services/vendaParcelaSupabase";

import ParcelasForm from "./ParcelasForm";

type Props = {
  venda: Venda;
  setVenda: Dispatch<SetStateAction<Venda>>;
  onSalvar: (venda: Venda, parcelas: VendaParcela[]) => void;
  onCancelar: () => void;
};

function rotuloStatus(status: Venda["status"]) {
  return status.replace(/_/g, " ");
}

export default function VendaForm({
  venda,
  setVenda,
  onSalvar,
  onCancelar,
}: Props) {
  const [parcelas, setParcelas] = useState<VendaParcela[]>([]);
  const [carregandoParcelas, setCarregandoParcelas] = useState(false);

  useEffect(() => {
    let componenteAtivo = true;

    async function carregarParcelas() {
      if (!venda.id) {
        setParcelas([]);
        return;
      }

      setCarregandoParcelas(true);

      try {
        const dados = (await buscarParcelasVenda(
          venda.id
        )) as VendaParcela[];

        if (componenteAtivo) {
          setParcelas(dados);
        }
      } catch (error) {
        console.error(error);

        if (componenteAtivo) {
          alert("Não foi possível carregar as parcelas da venda.");
        }
      } finally {
        if (componenteAtivo) {
          setCarregandoParcelas(false);
        }
      }
    }

    void carregarParcelas();

    return () => {
      componenteAtivo = false;
    };
  }, [venda.id]);

  function alterarCampo<K extends keyof Venda>(campo: K, valor: Venda[K]) {
    setVenda((anterior) => ({
      ...anterior,
      [campo]: valor,
    }));
  }

  function salvar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cliente = venda.cliente.trim();
    const responsavel = venda.responsavel.trim();
    const endereco = (venda.endereco ?? "").trim();
    const cidade = (venda.cidade ?? "").trim();
    const observacoes = venda.observacoes.trim();
    const valorTotal = Number(venda.valor_total);
    const totalParcelas = parcelas.reduce(
      (total, parcela) => total + Number(parcela.valor),
      0
    );

    if (!cliente) {
      alert("Informe o cliente.");
      return;
    }

    if (!venda.data_venda) {
      alert("Informe a data da venda.");
      return;
    }

    if (valorTotal <= 0) {
      alert("Informe um valor total maior que zero.");
      return;
    }

    if (parcelas.length === 0) {
      alert("Cadastre ao menos uma parcela para a venda.");
      return;
    }

    if (
      parcelas.some(
        (parcela) =>
          Number(parcela.valor) <= 0 ||
          (parcela.forma_pagamento !== "CONDICIONADO_ENTREGA" &&
            !parcela.data_vencimento)
      )
    ) {
      alert(
        "Preencha o valor de todas as parcelas e o vencimento das parcelas que não são condicionadas à entrega."
      );
      return;
    }

    if (Math.abs(totalParcelas - valorTotal) > 0.01) {
      alert("O total das parcelas deve ser igual ao valor da venda.");
      return;
    }

    onSalvar(
      {
        ...venda,
        cliente,
        responsavel,
        endereco,
        cidade,
        observacoes,
        valor_total: valorTotal,
      },
      parcelas
    );
  }

  return (
    <form
      onSubmit={salvar}
      className="mb-6 rounded-xl border border-slate-200 bg-white p-5 text-sm shadow-sm"
    >
      <h2 className="mb-5 text-xl font-bold text-blue-900">
        {venda.id ? "Editar venda" : "Nova venda"}
      </h2>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 block font-semibold">Cliente</label>
          <input
            type="text"
            value={venda.cliente}
            onChange={(event) => alterarCampo("cliente", event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-semibold">Data da venda</label>
          <input
            type="date"
            value={venda.data_venda}
            onChange={(event) =>
              alterarCampo("data_venda", event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-semibold">Valor total</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={venda.valor_total || ""}
            onChange={(event) =>
              alterarCampo("valor_total", Number(event.target.value))
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-semibold">Responsável</label>
          <input
            type="text"
            value={venda.responsavel}
            onChange={(event) =>
              alterarCampo("responsavel", event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-semibold">Endereço</label>
          <input
            type="text"
            value={venda.endereco ?? ""}
            onChange={(event) =>
              alterarCampo("endereco", event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-semibold">Cidade</label>
          <input
            type="text"
            value={venda.cidade ?? ""}
            onChange={(event) =>
              alterarCampo("cidade", event.target.value)
            }
            className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
          />
        </div>

        <div>
          <label className="mb-1.5 block font-semibold">Status da venda</label>
          <div className="w-full rounded-lg border border-slate-300 bg-slate-100 px-3 py-2.5 text-sm text-gray-600">
            {rotuloStatus(venda.status)}
          </div>
          <p className="mt-1 text-xs text-gray-500">
            O status é atualizado automaticamente conforme os recebimentos das
            parcelas.
          </p>
        </div>
      </div>

      <div className="mt-4">
        <label className="mb-1.5 block font-semibold">Observações</label>
        <textarea
          rows={3}
          value={venda.observacoes}
          onChange={(event) =>
            alterarCampo("observacoes", event.target.value)
          }
          className="w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm"
        />
      </div>

      <div className="mt-4 flex justify-end gap-3 border-b border-slate-200 pb-5">
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-lg bg-gray-500 px-5 py-2 text-sm font-medium text-white hover:bg-gray-600"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={carregandoParcelas}
          className="rounded-lg bg-blue-700 px-5 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:bg-blue-400"
        >
          Salvar
        </button>
      </div>

      {carregandoParcelas ? (
        <div className="mt-5 text-gray-500">Carregando parcelas...</div>
      ) : (
        <ParcelasForm parcelas={parcelas} setParcelas={setParcelas} />
      )}
    </form>
  );
}


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
        observacoes,
        valor_total: valorTotal,
      },
      parcelas
    );
  }

  return (
    <form
      onSubmit={salvar}
      className="bg-white rounded-xl shadow-md p-6 mb-8"
    >
      <h2 className="text-2xl font-bold text-blue-900 mb-6">
        {venda.id ? "Editar venda" : "Nova venda"}
      </h2>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        <div>
          <label className="block mb-2 font-semibold">Cliente</label>
          <input
            type="text"
            value={venda.cliente}
            onChange={(event) => alterarCampo("cliente", event.target.value)}
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Data da venda</label>
          <input
            type="date"
            value={venda.data_venda}
            onChange={(event) =>
              alterarCampo("data_venda", event.target.value)
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Valor total</label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={venda.valor_total || ""}
            onChange={(event) =>
              alterarCampo("valor_total", Number(event.target.value))
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Responsável</label>
          <input
            type="text"
            value={venda.responsavel}
            onChange={(event) =>
              alterarCampo("responsavel", event.target.value)
            }
            className="w-full border rounded-lg p-3"
          />
        </div>

        <div>
          <label className="block mb-2 font-semibold">Status da venda</label>
          <div className="w-full border rounded-lg p-3 bg-slate-100 text-gray-600">
            {rotuloStatus(venda.status)}
          </div>
          <p className="mt-1 text-sm text-gray-500">
            O status é atualizado automaticamente conforme os recebimentos das
            parcelas.
          </p>
        </div>
      </div>

      <div className="mt-5">
        <label className="block mb-2 font-semibold">Observações</label>
        <textarea
          rows={4}
          value={venda.observacoes}
          onChange={(event) =>
            alterarCampo("observacoes", event.target.value)
          }
          className="w-full border rounded-lg p-3"
        />
      </div>

      {carregandoParcelas ? (
        <div className="mt-8 text-gray-500">Carregando parcelas...</div>
      ) : (
        <ParcelasForm parcelas={parcelas} setParcelas={setParcelas} />
      )}

      <div className="flex justify-end gap-3 mt-8">
        <button
          type="button"
          onClick={onCancelar}
          className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-2 rounded-lg"
        >
          Cancelar
        </button>

        <button
          type="submit"
          disabled={carregandoParcelas}
          className="bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white px-5 py-2 rounded-lg"
        >
          Salvar
        </button>
      </div>
    </form>
  );
}

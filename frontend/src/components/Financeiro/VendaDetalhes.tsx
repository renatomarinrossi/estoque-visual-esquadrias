import { useEffect, useState } from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";

import {
  buscarParcelasVenda,
  receberParcela,
} from "../../services/vendaParcelaSupabase";

import {
  atualizarStatusVenda,
} from "../../services/vendaSupabase";

import ReceberParcelaModal from "./ReceberParcelaModal";

type Props = {
  venda: Venda;
  onAtualizar: () => Promise<void>;
};

export default function VendaDetalhes({
  venda,
  onAtualizar,
}: Props) {
  const [parcelas, setParcelas] =
    useState<VendaParcela[]>([]);

  const [modalAberto, setModalAberto] =
    useState(false);

  const [
    parcelaSelecionada,
    setParcelaSelecionada,
  ] = useState<VendaParcela | null>(
    null
  );

  useEffect(() => {
  carregarParcelas();
}, [venda.id]);

  async function carregarParcelas() {
    if (!venda.id) return;

    const dados =
      await buscarParcelasVenda(
        venda.id
      );

    setParcelas(
      dados as VendaParcela[]
    );
  }

  async function confirmarRecebimento(
    data: string,
    valor: number,
    observacao: string
  ) {
    if (!parcelaSelecionada?.id) return;

    try {
      await receberParcela(
  parcelaSelecionada.id,
  data,
  valor,
  observacao
);

await atualizarStatusVenda(
  venda.id!
);

await onAtualizar();

await carregarParcelas();

      setModalAberto(false);

      setParcelaSelecionada(null);

    } catch (error) {
      console.error(error);

      alert(
        "Erro ao receber parcela."
      );
    }
  }

  function corStatus(
    status: string
  ) {
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
    <>
      <div className="bg-slate-100 rounded-lg p-6">

        <div className="grid grid-cols-2 gap-4 mb-6">

          <p>
            <strong>Cliente</strong>
            <br />
            {venda.cliente}
          </p>

          <p>
            <strong>Responsável</strong>
            <br />
            {venda.responsavel}
          </p>

          <p>
            <strong>Forma de Pagamento</strong>
            <br />
            {venda.forma_pagamento}
          </p>

          <p>
            <strong>Data da Venda</strong>
            <br />
            {venda.data_venda}
          </p>

        </div>

        <div className="mb-6">

          <strong>Observações</strong>

          <div className="bg-white rounded-lg p-3 mt-2">

            {venda.observacoes || "-"}

          </div>

        </div>

        <h3 className="text-xl font-bold mb-4">
          Parcelas
        </h3>

        {parcelas.length === 0 && (
          <div className="italic text-gray-500">
            Nenhuma parcela cadastrada.
          </div>
        )}

        {parcelas.map((parcela) => (

          <div
            key={parcela.id}
            className="bg-white rounded-lg border p-4 mb-3"
          >

            <div className="grid grid-cols-5 gap-4 items-center">

              <div>

                <strong>Parcela</strong>

                <div>

                  {parcela.numero_parcela}/
                  {parcela.total_parcelas}

                </div>

              </div>

              <div>

                <strong>Vencimento</strong>

                <div>

                  {parcela.data_vencimento}

                </div>

              </div>

              <div>

                <strong>Valor</strong>

                <div>

                  {parcela.valor.toLocaleString(
                    "pt-BR",
                    {
                      style: "currency",
                      currency: "BRL",
                    }
                  )}

                </div>

              </div>

              <div>

                <strong>Status</strong>

                <div
                  className={corStatus(
                    parcela.status
                  )}
                >

                  {parcela.status}

                </div>

              </div>

              <div className="text-right">

                {parcela.status ===
                  "A_RECEBER" && (

                  <button
                    onClick={() => {
                      setParcelaSelecionada(
                        parcela
                      );

                      setModalAberto(
                        true
                      );
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg"
                  >
                    Receber
                  </button>

                )}

              </div>

            </div>

          </div>

        ))}

      </div>

      <ReceberParcelaModal
        aberto={modalAberto}
        valorPadrao={
          parcelaSelecionada?.valor || 0
        }
        onCancelar={() => {
          setModalAberto(false);
          setParcelaSelecionada(null);
        }}
        onConfirmar={
          confirmarRecebimento
        }
      />
    </>
  );
}

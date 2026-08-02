import { useEffect, useState } from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";

import {
  buscarVendas,
  inserirVenda,
  atualizarVenda,
  atualizarStatusVenda,
  excluirVenda,
} from "../../services/vendaSupabase";

import {
  inserirParcela,
  salvarParcelasVenda,
} from "../../services/vendaParcelaSupabase";

import VendaForm from "../../components/Financeiro/VendaForm";
import VendaTable from "../../components/Financeiro/VendaTable";

const vendaVazia: Venda = {
  data_venda: "",
  cliente: "",
  valor_total: 0,
  forma_pagamento: "PIX",
  responsavel: "",
  status: "A_RECEBER",
  observacoes: "",
};

export default function Vendas() {

  const [vendas, setVendas] =
    useState<Venda[]>([]);

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [venda, setVenda] =
    useState<Venda>(vendaVazia);

  const [
    vendaEditando,
    setVendaEditando,
  ] = useState<Venda | null>(null);

  async function carregarDados() {

    const dados =
      await buscarVendas();

    setVendas(
      dados as Venda[]
    );

  }

  useEffect(() => {

    carregarDados();

  }, []);

  async function salvarVenda(
    venda: Venda,
    parcelas: VendaParcela[]
  ) {

    try {

      if (vendaEditando?.id) {

        await atualizarVenda(
          venda
        );

        await salvarParcelasVenda(
          venda.id!,
          parcelas
        );

        await atualizarStatusVenda(
          venda.id!
        );

      } else {

        const novaVenda =
          await inserirVenda(
            venda
          );

        for (const parcela of parcelas) {

          await inserirParcela({

            ...parcela,

            venda_id:
              novaVenda.id,

          });

        }

        await atualizarStatusVenda(
          novaVenda.id
        );

      }

      await carregarDados();

      setVenda(
        vendaVazia
      );

      setVendaEditando(
        null
      );

      setMostrarFormulario(
        false
      );

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao salvar venda."
      );

    }

  }
    function editarVenda(
    item: Venda
  ) {

    setVenda(item);

    setVendaEditando(item);

    setMostrarFormulario(
      true
    );

  }

  async function removerVenda(
    item: Venda
  ) {

    if (!item.id) return;

    const confirmar = confirm(
      `Excluir a venda de ${item.cliente}?`
    );

    if (!confirmar) return;

    try {

      await excluirVenda(
        item.id
      );

      await carregarDados();

    } catch (error) {

      console.error(error);

      alert(
        "Erro ao excluir venda."
      );

    }

  }

  return (
    <>

      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold text-blue-900">

          Vendas

        </h1>

        <button
          onClick={() => {

            setVendaEditando(
              null
            );

            setVenda(
              vendaVazia
            );

            setMostrarFormulario(
              true
            );

          }}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
        >

          Nova Venda

        </button>

      </div>

      {mostrarFormulario && (

        <VendaForm
          venda={venda}
          setVenda={setVenda}
          onSalvar={salvarVenda}
          onCancelar={() => {

            setMostrarFormulario(
              false
            );

            setVendaEditando(
              null
            );

            setVenda(
              vendaVazia
            );

          }}
        />

      )}
            <VendaTable
        vendas={vendas}
        onEditar={editarVenda}
        onExcluir={removerVenda}
        onAtualizar={carregarDados}
      />

    </>
  );

}

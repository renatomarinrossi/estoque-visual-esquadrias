import { useEffect, useState } from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";

import {
  atualizarStatusVenda,
  atualizarVenda,
  buscarVendas,
  excluirVenda,
  inserirVenda,
} from "../../services/vendaSupabase";

import {
  salvarParcelasVenda,
} from "../../services/vendaParcelaSupabase";

import VendaForm from "../../components/Financeiro/VendaForm";
import VendaTable from "../../components/Financeiro/VendaTable";

function criarVendaVazia(): Venda {
  return {
    data_venda: new Date().toISOString().split("T")[0],
    cliente: "",
    valor_total: 0,
    responsavel: "",
    status: "A_RECEBER",
    observacoes: "",
  };
}

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [venda, setVenda] = useState<Venda>(criarVendaVazia);

  async function carregarDados() {
    try {
      const dados = await buscarVendas();
      setVendas(dados as Venda[]);
    } catch (error) {
      console.error(error);
      alert("Não foi possível carregar as vendas.");
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  function fecharFormulario() {
    setMostrarFormulario(false);
    setVenda(criarVendaVazia());
  }

  async function salvarVenda(
    dadosVenda: Venda,
    parcelas: VendaParcela[]
  ) {
    try {
      let vendaSalva: Venda;

      if (dadosVenda.id) {
        vendaSalva = await atualizarVenda(dadosVenda);
      } else {
        vendaSalva = await inserirVenda({
          ...dadosVenda,
          status: "A_RECEBER",
        });
      }

      if (!vendaSalva.id) {
        throw new Error("A venda foi salva sem um identificador.");
      }

      await salvarParcelasVenda(vendaSalva.id, parcelas);
      await atualizarStatusVenda(vendaSalva.id);

      await carregarDados();
      fecharFormulario();
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar venda.");
    }
  }

  function editarVenda(item: Venda) {
    setVenda({ ...item });
    setMostrarFormulario(true);
  }

  async function removerVenda(item: Venda) {
    if (!item.id) return;

    const confirmar = window.confirm(
      `Excluir a venda de ${item.cliente}?`
    );

    if (!confirmar) return;

    try {
      await excluirVenda(item.id);
      await carregarDados();
    } catch (error) {
      console.error(error);
      alert("Erro ao excluir venda.");
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-900">Vendas</h1>

        <button
          type="button"
          onClick={() => {
            setVenda(criarVendaVazia());
            setMostrarFormulario(true);
          }}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
        >
          Nova venda
        </button>
      </div>

      {mostrarFormulario && (
        <VendaForm
          venda={venda}
          setVenda={setVenda}
          onSalvar={salvarVenda}
          onCancelar={fecharFormulario}
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

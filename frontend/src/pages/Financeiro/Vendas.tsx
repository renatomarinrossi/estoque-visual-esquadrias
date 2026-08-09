import { type FormEvent, useEffect, useMemo, useState } from "react";

import type { Venda } from "../../types/Venda";
import type { VendaParcela } from "../../types/VendaParcela";
import {
  atualizarStatusVenda,
  atualizarVenda,
  buscarVendas,
  excluirVenda,
  inserirVenda,
} from "../../services/vendaSupabase";
import { salvarParcelasVenda } from "../../services/vendaParcelaSupabase";
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

function mensagemErro(erro: unknown, padrao: string) {
  return erro instanceof Error && erro.message ? erro.message : padrao;
}

export default function Vendas() {
  const [vendas, setVendas] = useState<Venda[]>([]);
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [venda, setVenda] = useState<Venda>(criarVendaVazia);
  const [busca, setBusca] = useState("");
  const [termoBusca, setTermoBusca] = useState("");

  async function carregarDados() {
    try {
      setVendas(await buscarVendas());
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar as vendas.");
    }
  }

  useEffect(() => {
    void carregarDados();
  }, []);

  const vendasFiltradas = useMemo(() => {
    const termo = termoBusca.trim().toLocaleLowerCase("pt-BR");

    if (!termo) return vendas;

    return vendas.filter((item) =>
      item.cliente.toLocaleLowerCase("pt-BR").includes(termo)
    );
  }, [termoBusca, vendas]);

  function buscar(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTermoBusca(busca);
  }

  function limparBusca() {
    setBusca("");
    setTermoBusca("");
  }

  function fecharFormulario() {
    setMostrarFormulario(false);
    setVenda(criarVendaVazia());
  }

  async function salvarVenda(dadosVenda: Venda, parcelas: VendaParcela[]) {
    try {
      const vendaSalva = dadosVenda.id
        ? await atualizarVenda(dadosVenda)
        : await inserirVenda({ ...dadosVenda, status: "A_RECEBER" });

      if (!vendaSalva.id) {
        throw new Error("A venda foi salva sem um identificador.");
      }

      await salvarParcelasVenda(vendaSalva.id, parcelas);
      await atualizarStatusVenda(vendaSalva.id);
      await carregarDados();
      fecharFormulario();
    } catch (erro) {
      console.error(erro);
      alert(mensagemErro(erro, "Erro ao salvar venda."));
    }
  }

  function editarVenda(item: Venda) {
    setVenda({ ...item });
    setMostrarFormulario(true);
  }

  async function removerVenda(item: Venda) {
    if (!item.id || !window.confirm(`Excluir a venda de ${item.cliente}?`)) {
      return;
    }

    try {
      await excluirVenda(item.id);
      await carregarDados();
    } catch (erro) {
      console.error(erro);
      alert(mensagemErro(erro, "Erro ao excluir venda."));
    }
  }

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-4xl font-bold text-blue-900">Vendas</h1>
        <button
          type="button"
          onClick={() => {
            setVenda(criarVendaVazia());
            setMostrarFormulario(true);
          }}
          className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800"
        >
          Nova venda
        </button>
      </div>

      <form
        onSubmit={buscar}
        className="mb-6 flex flex-col gap-3 rounded-xl bg-white p-5 shadow-md sm:flex-row sm:items-end"
      >
        <div className="flex-1">
          <label className="mb-2 block font-semibold" htmlFor="buscar-venda">
            Buscar venda
          </label>
          <input
            id="buscar-venda"
            value={busca}
            onChange={(event) => setBusca(event.target.value)}
            placeholder="Buscar pelo nome do cliente"
            className="w-full rounded-lg border p-3"
          />
        </div>
        <div className="flex gap-3">
          <button
            type="submit"
            className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800"
          >
            Buscar
          </button>
          <button
            type="button"
            onClick={limparBusca}
            className="rounded-lg bg-gray-500 px-5 py-3 text-white hover:bg-gray-600"
          >
            Limpar
          </button>
        </div>
      </form>

      {mostrarFormulario && (
        <VendaForm
          venda={venda}
          setVenda={setVenda}
          onSalvar={salvarVenda}
          onCancelar={fecharFormulario}
        />
      )}

      <VendaTable
        vendas={vendasFiltradas}
        onEditar={editarVenda}
        onExcluir={removerVenda}
        onAtualizar={carregarDados}
      />
    </>
  );
}


import { useEffect, useState } from "react";

import BuscaProduto, {
  type ProdutoBuscavel,
} from "../../components/produtos/BuscaProduto";
import {
  buscarProdutos,
  registrarSaidaProduto,
} from "../../services/produtoSupabase";

type ProdutoEstoque = ProdutoBuscavel & {
  quantidade: number | string;
};

export default function Saida() {
  const [produtos, setProdutos] = useState<ProdutoEstoque[]>([]);
  const [produtoId, setProdutoId] = useState<number | null>(null);
  const [quantidade, setQuantidade] = useState("");

  async function carregarProdutos() {
    try {
      const dados = await buscarProdutos();
      const produtosOrdenados = (dados as ProdutoEstoque[]).sort((a, b) =>
        a.descricao.localeCompare(b.descricao, "pt-BR")
      );

      setProdutos(produtosOrdenados);
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar os produtos.");
    }
  }

  useEffect(() => {
    void carregarProdutos();
  }, []);

  const produtoSelecionado = produtos.find((produto) => produto.id === produtoId);

  async function registrarSaida() {
    const quantidadeNumerica = Number(quantidade);

    if (produtoId === null) {
      alert("Selecione um produto.");
      return;
    }

    if (!Number.isFinite(quantidadeNumerica) || quantidadeNumerica <= 0) {
      alert("Informe uma quantidade maior que zero.");
      return;
    }

    try {
      await registrarSaidaProduto(produtoId, quantidadeNumerica);
      alert("Saída registrada.");
      setProdutoId(null);
      setQuantidade("");
      await carregarProdutos();
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Erro ao registrar saída.");
    }
  }

  return (
    <>
      <h1 className="mb-8 text-4xl font-bold text-blue-900">Saída de Estoque</h1>

      <div className="max-w-xl rounded-xl bg-white p-6 shadow-md">
        <div className="mb-4">
          <label className="mb-2 block">Produto</label>
          <BuscaProduto produtos={produtos} onSelecionar={(produto) => setProdutoId(produto.id)} />
        </div>

        {produtoSelecionado && (
          <div className="mb-4 rounded bg-slate-100 p-3">
            Estoque Atual: <strong>{produtoSelecionado.quantidade}</strong>
          </div>
        )}

        <div className="mb-4">
          <label className="mb-2 block">Quantidade</label>
          <input type="number" min="0" step="any" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} className="w-full rounded-lg border p-2" />
        </div>

        <button type="button" onClick={() => void registrarSaida()} className="rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700">
          Registrar Saída
        </button>
      </div>
    </>
  );
}


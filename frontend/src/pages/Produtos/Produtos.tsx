import { useEffect, useState } from "react";

import ProdutoForm from "../../components/produtos/ProdutoForm";
import ProdutoTable from "../../components/produtos/ProdutoTable";

import type { Produto } from "../../types/produto";

import {
  carregarProdutos,
  salvarProdutos,
} from "../../services/produtoStorage";

export default function Produtos() {
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [produtoEditando, setProdutoEditando] =
    useState<Produto | null>(null);

  const [pesquisa, setPesquisa] =
    useState("");

  const [produtos, setProdutos] = useState<Produto[]>(
    carregarProdutos()
  );

  useEffect(() => {
    salvarProdutos(produtos);
  }, [produtos]);

  function salvarProduto(produto: Produto) {
    if (produtoEditando) {
      const atualizados = produtos.map((p) =>
        p.codigo === produtoEditando.codigo
          ? produto
          : p
      );

      setProdutos(atualizados);
      setProdutoEditando(null);
    } else {
      setProdutos([
        ...produtos,
        produto,
      ]);
    }

    setMostrarFormulario(false);
  }

  function editarProduto(produto: Produto) {
    setProdutoEditando(produto);
    setMostrarFormulario(true);
  }

  function excluirProduto(produto: Produto) {
    const produtosAtualizados =
      produtos.filter(
        (p) => p.codigo !== produto.codigo
      );

    setProdutos(produtosAtualizados);

    const lixeiraAtual = JSON.parse(
      localStorage.getItem(
        "visual_esquadrias_lixeira"
      ) || "[]"
    );

    const itemLixeira = {
      codigo: produto.codigo,
      descricao: produto.descricao,
      unidade: produto.unidade,
      quantidade: produto.quantidade,
      estoqueMinimo:
        produto.estoqueMinimo,
      precoCompra:
        produto.precoCompra,
      observacao:
        produto.observacao || "",
      dataExclusao:
        new Date().toISOString(),
    };

    lixeiraAtual.push(itemLixeira);

    localStorage.setItem(
      "visual_esquadrias_lixeira",
      JSON.stringify(lixeiraAtual)
    );
  }

  const produtosFiltrados =
    produtos.filter((produto) => {
      const texto =
        pesquisa.toLowerCase();

      return (
        produto.codigo
          .toLowerCase()
          .includes(texto) ||
        produto.descricao
          .toLowerCase()
          .includes(texto)
      );
    });

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-900">
          Produtos
        </h1>

        <button
          onClick={() => {
            setProdutoEditando(null);
            setMostrarFormulario(true);
          }}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
        >
          Novo Produto
        </button>
      </div>

      <div className="mb-6">
        <input
          type="text"
          placeholder="Pesquisar..."
          value={pesquisa}
          onChange={(e) =>
            setPesquisa(e.target.value)
          }
          className="w-full bg-white border rounded-xl p-4"
        />
      </div>

      {mostrarFormulario && (
        <ProdutoForm
          produtoInicial={
            produtoEditando
          }
          onSalvar={salvarProduto}
          onCancelar={() => {
            setMostrarFormulario(false);
            setProdutoEditando(null);
          }}
        />
      )}

      <ProdutoTable
        produtos={produtosFiltrados}
        onExcluir={excluirProduto}
        onEditar={editarProduto}
      />
    </>
  );
}

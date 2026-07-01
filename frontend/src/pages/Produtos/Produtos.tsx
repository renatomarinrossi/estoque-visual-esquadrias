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

  const [produtos, setProdutos] = useState<Produto[]>(
    carregarProdutos()
  );

  useEffect(() => {
    salvarProdutos(produtos);
  }, [produtos]);

  function adicionarProduto(produto: Produto) {
    setProdutos((anterior) => [
      ...anterior,
      produto,
    ]);

    setMostrarFormulario(false);
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

    lixeiraAtual.push({
      ...produto,
      dataExclusao: new Date().toISOString(),
    });

    localStorage.setItem(
      "visual_esquadrias_lixeira",
      JSON.stringify(lixeiraAtual)
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-4xl font-bold text-blue-900">
          Produtos
        </h1>

        <button
          onClick={() => setMostrarFormulario(true)}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
        >
          Novo Produto
        </button>
      </div>

      {mostrarFormulario && (
        <ProdutoForm
          onSalvar={adicionarProduto}
          onCancelar={() =>
            setMostrarFormulario(false)
          }
        />
      )}

      <ProdutoTable
        produtos={produtos}
        onExcluir={excluirProduto}
      />
    </>
  );
}

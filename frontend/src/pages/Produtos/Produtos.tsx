import { useEffect, useState } from "react";

import ProdutoForm from "../../components/produtos/ProdutoForm";
import ProdutoTable from "../../components/produtos/ProdutoTable";

import type { Produto } from "../../types/produto";

import {
  buscarProdutos,
  inserirProduto,
  atualizarProduto,
  moverParaLixeira,
  excluirProduto as excluirProdutoSupabase,
} from "../../services/produtoSupabase";

import {
  buscarFornecedores,
} from "../../services/fornecedorSupabase";

export default function Produtos() {
  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [produtoEditando, setProdutoEditando] =
    useState<Produto | null>(null);

  const [pesquisa, setPesquisa] =
    useState("");

  const [produtos, setProdutos] =
    useState<Produto[]>([]);

  async function carregarDados() {
    const dados =
      await buscarProdutos();

    const fornecedores =
      await buscarFornecedores();

    const produtosConvertidos =
      dados.map((produto: any) => {
        const fornecedor =
          fornecedores.find(
            (f: any) =>
              f.id ===
              produto.fornecedor_id
          );

        return {
          codigo: produto.codigo,

          descricao:
            produto.descricao,

          unidade:
            produto.unidade,

          quantidade:
            produto.quantidade,

          estoqueMinimo:
            produto.estoque_minimo,

          precoCompra:
            produto.preco_compra,

          observacao:
            produto.observacao || "",

          fornecedorId:
            produto.fornecedor_id,

          fornecedorNome:
            fornecedor?.nome_fantasia ||
            "-",

          ultimaEntrada:
            produto.ultima_entrada || "",
        };
      });

    setProdutos(
      produtosConvertidos
    );
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function salvarProduto(
    produto: Produto
  ) {
    try {
      if (
        produtoEditando
      ) {
        await atualizarProduto(
          produtoEditando.codigo,
          produto
        );

        setProdutoEditando(
          null
        );
      } else {
        await inserirProduto(
          produto
        );
      }

      await carregarDados();

      setMostrarFormulario(
        false
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao salvar produto"
      );
    }
  }

  function editarProduto(
    produto: Produto
  ) {
    setProdutoEditando(
      produto
    );

    setMostrarFormulario(
      true
    );
  }

  async function excluirProduto(
    produto: Produto
  ) {
    const confirmar =
      confirm(
        `Excluir o produto ${produto.descricao}?`
      );

    if (!confirmar) return;

    try {
      await moverParaLixeira(
        produto
      );

      await excluirProdutoSupabase(
        produto.codigo
      );

      await carregarDados();

      alert(
        "Produto enviado para a lixeira"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao excluir produto"
      );
    }
  }

  const produtosFiltrados =
    produtos.filter(
      (produto) => {
        const texto =
          pesquisa.toLowerCase();

        return (
          produto.codigo
            .toLowerCase()
            .includes(
              texto
            ) ||
          produto.descricao
            .toLowerCase()
            .includes(
              texto
            )
        );
      }
    );

  return (
    <>
      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold text-blue-900">
          Produtos
        </h1>

        <button
          onClick={() => {
            setProdutoEditando(
              null
            );

            setMostrarFormulario(
              true
            );
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
            setPesquisa(
              e.target.value
            )
          }
          className="w-full bg-white border rounded-xl p-4"
        />

      </div>

      {mostrarFormulario && (
        <ProdutoForm
          produtoInicial={
            produtoEditando
          }
          onSalvar={
            salvarProduto
          }
          onCancelar={() => {
            setMostrarFormulario(
              false
            );

            setProdutoEditando(
              null
            );
          }}
        />
      )}

      <ProdutoTable
        produtos={
          produtosFiltrados
        }
        onExcluir={
          excluirProduto
        }
        onEditar={
          editarProduto
        }
      />
    </>
  );
}

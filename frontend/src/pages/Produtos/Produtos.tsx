import { useEffect, useState } from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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

  const [categoria, setCategoria] =
    useState("Todas");

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
          id: produto.id,

          codigo: produto.codigo,

          descricao:
            produto.descricao,

          categoria:
            produto.categoria || "",

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
        await atualizarProduto(produto);

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
  produto.id!
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

        const pesquisaOk =
          produto.codigo
            .toLowerCase()
            .includes(
              texto
            ) ||
          produto.descricao
            .toLowerCase()
            .includes(
              texto
            );

        const categoriaOk =
          categoria === "Todas"
            ? true
            : produto.categoria ===
              categoria;

        return (
          pesquisaOk &&
          categoriaOk
        );
      }
    );

  function gerarPDF() {
    const doc = new jsPDF();

    doc.setFontSize(18);

    doc.text(
      "Visual Esquadrias",
      14,
      20
    );

    doc.setFontSize(12);

    doc.text(
      `Relatório de Produtos - ${categoria}`,
      14,
      30
    );

    doc.text(
      `Data: ${new Date().toLocaleDateString(
        "pt-BR"
      )}`,
      14,
      38
    );

    autoTable(doc, {
      startY: 45,

      head: [[
        "Código",
        "Descrição",
        "Categoria",
        "Unidade",
        "Estoque",
        "Mínimo",
        "Preço Compra",
      ]],

      body: produtosFiltrados.map(
  (produto) => [
    produto.codigo,
    produto.descricao,
    produto.categoria || "-",
    produto.unidade,
    produto.quantidade,
    produto.estoqueMinimo,
    `R$ ${produto.precoCompra.toFixed(2)}`,
  ]
),
    });

    doc.save(
      `produtos-${categoria}.pdf`
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold text-blue-900">
          Produtos
        </h1>

        <div className="flex gap-3">

          <button
            onClick={gerarPDF}
            className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg"
          >
            Gerar PDF
          </button>

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

      </div>      <div className="mb-6">

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

      <div className="mb-6">

        <label className="block mb-2 font-semibold">
          Categoria
        </label>

        <select
          value={categoria}
          onChange={(e) =>
            setCategoria(
              e.target.value
            )
          }
          className="border rounded-xl p-3 w-80 bg-white"
        >
          <option>
            Todas
          </option>

          <option>
            Vidros
          </option>

          <option>
            Alumínio
          </option>

          <option>
            Acessórios
          </option>

          <option>
            Ferramentas
          </option>

          <option>
            Parafusos/Brocas
          </option>

          <option>
            Silicone/PU
          </option>

          <option>
            Borrachas
          </option>

        </select>

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
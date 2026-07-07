import { useEffect, useState } from "react";

import {
  buscarProdutos,
  registrarEntradaProduto,
} from "../../services/produtoSupabase";

import { buscarFornecedores } from "../../services/fornecedorSupabase";

import BuscaProduto from "../../components/produtos/BuscaProduto";

export default function Entrada() {
  const [produtos, setProdutos] =
    useState<any[]>([]);

  const [fornecedores, setFornecedores] =
    useState<any[]>([]);

  const [produtoId, setProdutoId] =
  useState<number | null>(null);

  const [fornecedorId, setFornecedorId] =
    useState("");

  const [precoCompra, setPrecoCompra] =
    useState("");

  const [quantidade, setQuantidade] =
    useState("");

  async function carregarDados() {
    const produtosBanco =
      (await buscarProdutos()).sort(
        (a: any, b: any) =>
          a.descricao.localeCompare(
            b.descricao
          )
      );

    const fornecedoresBanco =
      await buscarFornecedores();

    setProdutos(produtosBanco);

    setFornecedores(
      fornecedoresBanco
    );
  }

  useEffect(() => {
    carregarDados();
  }, []);

  const produtoSelecionado =
  produtos.find(
    (p) => p.id === produtoId
  );

  useEffect(() => {
    if (!produtoSelecionado)
      return;

    setFornecedorId(
      produtoSelecionado.fornecedor_id
        ? String(
            produtoSelecionado.fornecedor_id
          )
        : ""
    );

    setPrecoCompra(
      produtoSelecionado.preco_compra
        ? String(
            produtoSelecionado.preco_compra
          )
        : ""
    );
  }, [produtoSelecionado]);

  async function registrarEntrada() {
    if (!produtoId) {
      alert(
        "Selecione um produto"
      );
      return;
    }

    if (!fornecedorId) {
      alert(
        "Selecione um fornecedor"
      );
      return;
    }

    try {
      await registrarEntradaProduto(
  produtoId,
  Number(quantidade),
  Number(fornecedorId),
  Number(precoCompra)
);

      alert(
        "Entrada registrada"
      );

      setProdutoId(null);
      setFornecedorId("");
      setPrecoCompra("");
      setQuantidade("");

      await carregarDados();
    } catch {
      alert(
        "Erro ao registrar entrada"
      );
    }
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Entrada de Estoque
      </h1>

      <div className="bg-white rounded-xl shadow-md p-6 max-w-xl">

        <div className="mb-4">

          <label className="block mb-2">
            Produto
          </label>

          <BuscaProduto
            produtos={produtos}
            onSelecionar={(produto) =>
  setProdutoId(
    produto.id
  )
}
          />

        </div>

        {produtoSelecionado && (

          <div className="mb-4 p-3 bg-slate-100 rounded">

            Estoque Atual:

            <strong>
              {" "}
              {
                produtoSelecionado.quantidade
              }
            </strong>

          </div>

        )}

        <div className="mb-4">

          <label className="block mb-2">
            Fornecedor
          </label>

          <select
            value={
              fornecedorId
            }
            onChange={(e) =>
              setFornecedorId(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-2"
          >
            <option value="">
              Selecione
            </option>

            {fornecedores.map(
              (
                fornecedor
              ) => (
                <option
                  key={
                    fornecedor.id
                  }
                  value={
                    fornecedor.id
                  }
                >
                  {
                    fornecedor.nome_fantasia
                  }
                </option>
              )
            )}
          </select>

        </div>

        <div className="mb-4">

          <label className="block mb-2">
            Preço Compra
          </label>

          <input
            type="number"
            step="0.01"
            value={
              precoCompra
            }
            onChange={(e) =>
              setPrecoCompra(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-2"
          />

        </div>

        <div className="mb-4">

          <label className="block mb-2">
            Quantidade
          </label>

          <input
            type="number"
            value={
              quantidade
            }
            onChange={(e) =>
              setQuantidade(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-2"
          />

        </div>

        <button
          onClick={
            registrarEntrada
          }
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
        >
          Registrar Entrada
        </button>

      </div>
    </>
  );
}

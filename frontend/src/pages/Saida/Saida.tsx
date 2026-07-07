import { useEffect, useState } from "react";

import {
  buscarProdutos,
  registrarSaidaProduto,
} from "../../services/produtoSupabase";

import BuscaProduto from "../../components/produtos/BuscaProduto";

export default function Saida() {
  const [produtos, setProdutos] =
    useState<any[]>([]);

  const [produtoId, setProdutoId] =
    useState<number | null>(null);

  const [quantidade, setQuantidade] =
    useState("");

  async function carregarProdutos() {
    const dados =
      (await buscarProdutos()).sort(
        (a: any, b: any) =>
          a.descricao.localeCompare(
            b.descricao
          )
      );

    setProdutos(dados);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtoSelecionado =
    produtos.find(
      (p) => p.id === produtoId
    );

  async function registrarSaida() {
    if (!produtoId) {
      alert(
        "Selecione um produto"
      );
      return;
    }

    try {
      await registrarSaidaProduto(
        produtoId,
        Number(quantidade)
      );

      alert(
        "Saída registrada"
      );

      setProdutoId(null);
      setQuantidade("");

      await carregarProdutos();
    } catch (erro: any) {
      alert(
        erro?.message ||
          "Erro ao registrar saída"
      );
    }
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Saída de Estoque
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
            registrarSaida
          }
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg"
        >
          Registrar Saída
        </button>

      </div>
    </>
  );
}

import { useEffect, useState } from "react";

import {
  buscarProdutos,
  registrarEntradaProduto,
} from "../../services/produtoSupabase";

export default function Entrada() {
  const [produtos, setProdutos] =
    useState<any[]>([]);

  const [codigo, setCodigo] =
    useState("");

  const [quantidade, setQuantidade] =
    useState("");

  async function carregarProdutos() {
    const dados =
      await buscarProdutos();

    setProdutos(dados);
  }

  useEffect(() => {
    carregarProdutos();
  }, []);

  const produtoSelecionado =
    produtos.find(
      (p) => p.codigo === codigo
    );

  async function registrarEntrada() {
    if (!codigo) {
      alert("Selecione um produto");
      return;
    }

    try {
      await registrarEntradaProduto(
        codigo,
        Number(quantidade)
      );

      alert("Entrada registrada");

      setCodigo("");
      setQuantidade("");

      await carregarProdutos();
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

          <select
            value={codigo}
            onChange={(e) =>
              setCodigo(e.target.value)
            }
            className="w-full border rounded-lg p-2"
          >
            <option value="">
              Selecione
            </option>

            {produtos.map((produto) => (
              <option
                key={produto.codigo}
                value={produto.codigo}
              >
                {produto.codigo} - {produto.descricao}
              </option>
            ))}
          </select>
        </div>

        {produtoSelecionado && (
          <div className="mb-4 p-3 bg-slate-100 rounded">
            Estoque Atual:
            <strong>
              {" "}
              {produtoSelecionado.quantidade}
            </strong>
          </div>
        )}

        <div className="mb-4">
          <label className="block mb-2">
            Quantidade
          </label>

          <input
            type="number"
            value={quantidade}
            onChange={(e) =>
              setQuantidade(e.target.value)
            }
            className="w-full border rounded-lg p-2"
          />
        </div>

        <button
          onClick={registrarEntrada}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
        >
          Registrar Entrada
        </button>

      </div>
    </>
  );
}

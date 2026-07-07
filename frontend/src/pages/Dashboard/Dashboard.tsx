import { useEffect, useState } from "react";

import useUsuario from "../../hooks/useUsuario";

import { buscarProdutos } from "../../services/produtoSupabase";
import { buscarFornecedores } from "../../services/fornecedorSupabase";

export default function Dashboard() {
  const usuario =
    useUsuario();

  const [totalProdutos, setTotalProdutos] =
    useState(0);

  const [estoqueBaixo, setEstoqueBaixo] =
    useState(0);

  const [totalFornecedores, setTotalFornecedores] =
    useState(0);

  const [valorEstoque, setValorEstoque] =
    useState(0);

  async function carregarDashboard() {
    const produtos =
      await buscarProdutos();

    const fornecedores =
      await buscarFornecedores();

    setTotalProdutos(
      produtos.length
    );

    setTotalFornecedores(
      fornecedores.length
    );

    const abaixoMinimo =
      produtos.filter(
        (produto: any) =>
          produto.quantidade <=
          produto.estoque_minimo
      );

    setEstoqueBaixo(
      abaixoMinimo.length
    );

    const valorTotal =
      produtos.reduce(
        (
          total: number,
          produto: any
        ) =>
          total +
          produto.quantidade *
            Number(
              produto.preco_compra || 0
            ),
        0
      );

    setValorEstoque(
      valorTotal
    );
  }

  useEffect(() => {
    carregarDashboard();
  }, []);

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Dashboard
      </h1>

      <div className="grid grid-cols-4 gap-6">

        {usuario?.perfil !==
          "OPERADOR" && (
          <div className="bg-white rounded-xl shadow-md p-6">

            <div className="text-gray-500">
              Valor do Estoque
            </div>

            <div className="text-3xl font-bold text-green-700 mt-2">
              {valorEstoque.toLocaleString(
                "pt-BR",
                {
                  style: "currency",
                  currency:
                    "BRL",
                }
              )}
            </div>

          </div>
        )}

        <div className="bg-white rounded-xl shadow-md p-6">

          <div className="text-gray-500">
            Produtos
          </div>

          <div className="text-4xl font-bold text-blue-900 mt-2">
            {totalProdutos}
          </div>

        </div>

        <div className="bg-white rounded-xl shadow-md p-6">

          <div className="text-gray-500">
            Estoque Baixo
          </div>

          <div className="text-4xl font-bold text-red-600 mt-2">
            {estoqueBaixo}
          </div>

        </div>

        <div className="bg-white rounded-xl shadow-md p-6">

          <div className="text-gray-500">
            Fornecedores
          </div>

          <div className="text-4xl font-bold text-purple-600 mt-2">
            {totalFornecedores}
          </div>

        </div>

      </div>
    </>
  );
}

import { useEffect, useState } from "react";

import { buscarProdutos } from "../../services/produtoSupabase";

export default function Dashboard() {
  const [totalProdutos, setTotalProdutos] =
    useState(0);

  const [estoqueBaixo, setEstoqueBaixo] =
    useState(0);

  const [totalLixeira, setTotalLixeira] =
    useState(0);

  async function carregarDashboard() {
    const produtos =
      await buscarProdutos();

    setTotalProdutos(
      produtos.length
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

    setTotalLixeira(0);
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
            Lixeira
          </div>

          <div className="text-4xl font-bold text-orange-600 mt-2">
            {totalLixeira}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6">
          <div className="text-gray-500">
            Sistema
          </div>

          <div className="text-xl font-bold text-green-600 mt-3">
            Online
          </div>
        </div>

      </div>
    </>
  );
}

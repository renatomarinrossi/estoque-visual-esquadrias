import { useEffect, useState } from "react";

import useUsuario from "../../hooks/useUsuario";
import { buscarFornecedores } from "../../services/fornecedorSupabase";
import { buscarProdutos } from "../../services/produtoSupabase";

type ProdutoEstoque = {
  id: number;
  quantidade: number | string;
  estoque_minimo: number | string;
  preco_compra: number | string | null;
};

export default function Dashboard() {
  const usuario = useUsuario();
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [estoqueBaixo, setEstoqueBaixo] = useState(0);
  const [totalFornecedores, setTotalFornecedores] = useState(0);
  const [valorEstoque, setValorEstoque] = useState(0);

  async function carregarDashboard() {
    try {
      const [produtosBanco, fornecedores] = await Promise.all([
        buscarProdutos(),
        buscarFornecedores(),
      ]);
      const produtos = produtosBanco as ProdutoEstoque[];

      setTotalProdutos(produtos.length);
      setTotalFornecedores(fornecedores.length);
      setEstoqueBaixo(
        produtos.filter((produto) => Number(produto.quantidade) <= Number(produto.estoque_minimo)).length
      );
      setValorEstoque(
        produtos.reduce(
          (total, produto) => total + Number(produto.quantidade) * Number(produto.preco_compra ?? 0),
          0
        )
      );
    } catch (erro) {
      console.error(erro);
      alert("Não foi possível carregar o dashboard.");
    }
  }

  useEffect(() => {
    void carregarDashboard();
  }, []);

  return (
    <>
      <h1 className="mb-8 text-4xl font-bold text-blue-900">Dashboard</h1>

      <div className="grid grid-cols-4 gap-6">
        {usuario?.perfil !== "OPERADOR" && (
          <div className="rounded-xl bg-white p-6 shadow-md">
            <div className="text-gray-500">Valor do Estoque</div>
            <div className="mt-2 text-3xl font-bold text-green-700">
              {valorEstoque.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}
            </div>
          </div>
        )}

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="text-gray-500">Produtos</div>
          <div className="mt-2 text-4xl font-bold text-blue-900">{totalProdutos}</div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="text-gray-500">Estoque Baixo</div>
          <div className="mt-2 text-4xl font-bold text-red-600">{estoqueBaixo}</div>
        </div>

        <div className="rounded-xl bg-white p-6 shadow-md">
          <div className="text-gray-500">Fornecedores</div>
          <div className="mt-2 text-4xl font-bold text-purple-600">{totalFornecedores}</div>
        </div>
      </div>
    </>
  );
}


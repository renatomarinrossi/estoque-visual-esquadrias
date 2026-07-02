import { useEffect, useState } from "react";

import {
  buscarLixeira,
  restaurarProdutoLixeira,
  excluirLixeira,
} from "../../services/produtoSupabase";

export default function Lixeira() {
  const [produtos, setProdutos] =
    useState<any[]>([]);

  async function carregarDados() {
    const dados =
      await buscarLixeira();

    setProdutos(dados);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function restaurarProduto(
    produto: any
  ) {
    try {
      await restaurarProdutoLixeira(
        produto
      );

      await carregarDados();

      alert(
        "Produto restaurado"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao restaurar produto"
      );
    }
  }

  async function excluirDefinitivo(
    produto: any
  ) {
    const confirmar = confirm(
      "Excluir definitivamente?"
    );

    if (!confirmar) return;

    try {
      await excluirLixeira(
        produto.id
      );

      await carregarDados();

      alert(
        "Produto removido definitivamente"
      );
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao excluir produto"
      );
    }
  }

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Lixeira
      </h1>

      <div className="bg-white rounded-xl shadow-md p-6">

        <table className="w-full">

          <thead>

            <tr className="border-b">

              <th className="text-left py-3">
                Código
              </th>

              <th className="text-left">
                Descrição
              </th>

              <th>
                Data Exclusão
              </th>

              <th>
                Ações
              </th>

            </tr>

          </thead>

          <tbody>

            {produtos.length === 0 ? (
              <tr>

                <td
                  colSpan={4}
                  className="text-center py-8 text-gray-500"
                >
                  Lixeira vazia
                </td>

              </tr>
            ) : (
              produtos.map((produto) => (

                <tr
                  key={produto.id}
                  className="border-b"
                >

                  <td>
                    {produto.codigo}
                  </td>

                  <td>
                    {produto.descricao}
                  </td>

                  <td>
                    {new Date(
                      produto.data_exclusao
                    ).toLocaleDateString(
                      "pt-BR"
                    )}
                  </td>

                  <td className="flex gap-2 py-2">

                    <button
                      onClick={() =>
                        restaurarProduto(
                          produto
                        )
                      }
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded"
                    >
                      Restaurar
                    </button>

                    <button
                      onClick={() =>
                        excluirDefinitivo(
                          produto
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Excluir
                    </button>

                  </td>

                </tr>

              ))
            )}

          </tbody>

        </table>

      </div>
    </>
  );
}

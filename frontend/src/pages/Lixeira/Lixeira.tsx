import { useEffect, useState } from "react";

type ProdutoLixeira = {
  codigo: string;
  descricao: string;
  unidade: string;
  quantidade: number;
  estoqueMinimo: number;
  precoCompra: number;
  observacao: string;
  dataExclusao: string;
};

export default function Lixeira() {
  const [produtos, setProdutos] =
    useState<ProdutoLixeira[]>([]);

  function carregarDados() {
    const dados = JSON.parse(
      localStorage.getItem(
        "visual_esquadrias_lixeira"
      ) || "[]"
    );

    setProdutos(dados);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  function restaurarProduto(
    produto: ProdutoLixeira
  ) {
    const produtosAtuais = JSON.parse(
      localStorage.getItem(
        "visual_esquadrias_produtos"
      ) || "[]"
    );

    produtosAtuais.push({
      codigo: produto.codigo,
      descricao: produto.descricao,
      unidade: produto.unidade,
      quantidade: produto.quantidade,
      estoqueMinimo:
        produto.estoqueMinimo,
      precoCompra: produto.precoCompra,
      observacao: produto.observacao,
    });

    localStorage.setItem(
      "visual_esquadrias_produtos",
      JSON.stringify(produtosAtuais)
    );

    const novaLixeira =
      produtos.filter(
        (p) => p.codigo !== produto.codigo
      );

    localStorage.setItem(
      "visual_esquadrias_lixeira",
      JSON.stringify(novaLixeira)
    );

    carregarDados();
  }

  function excluirDefinitivo(
    produto: ProdutoLixeira
  ) {
    const novaLixeira =
      produtos.filter(
        (p) => p.codigo !== produto.codigo
      );

    localStorage.setItem(
      "visual_esquadrias_lixeira",
      JSON.stringify(novaLixeira)
    );

    carregarDados();
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
              produtos.map((produto, index) => (

                <tr
                  key={index}
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
                      produto.dataExclusao
                    ).toLocaleDateString("pt-BR")}
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

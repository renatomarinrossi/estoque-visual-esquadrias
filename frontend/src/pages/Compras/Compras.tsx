import { useEffect, useState } from "react";

export default function Compras() {
  const [produtos, setProdutos] = useState<any[]>([]);

  useEffect(() => {
    const dados = JSON.parse(
      localStorage.getItem(
        "visual_esquadrias_produtos"
      ) || "[]"
    );

    const abaixoMinimo = dados.filter(
      (produto: any) =>
        produto.quantidade <=
        produto.estoqueMinimo
    );

    setProdutos(abaixoMinimo);
  }, []);

  return (
    <>
      <h1 className="text-4xl font-bold text-blue-900 mb-8">
        Compras
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
                Estoque Atual
              </th>

              <th>
                Estoque Mínimo
              </th>

              <th>
                Comprar
              </th>

            </tr>

          </thead>

          <tbody>

            {produtos.length === 0 ? (
              <tr>

                <td
                  colSpan={5}
                  className="text-center py-8 text-gray-500"
                >
                  Nenhum item precisa de reposição
                </td>

              </tr>
            ) : (
              produtos.map((produto) => {

                const comprar =
                  produto.estoqueMinimo -
                  produto.quantidade;

                return (
                  <tr
                    key={produto.codigo}
                    className="border-b"
                  >

                    <td>
                      {produto.codigo}
                    </td>

                    <td>
                      {produto.descricao}
                    </td>

                    <td className="text-center text-red-600 font-bold">
                      {produto.quantidade}
                    </td>

                    <td className="text-center">
                      {produto.estoqueMinimo}
                    </td>

                    <td className="text-center font-bold text-orange-600">
                      {comprar}
                    </td>

                  </tr>
                );
              })
            )}

          </tbody>

        </table>

      </div>
    </>
  );
}

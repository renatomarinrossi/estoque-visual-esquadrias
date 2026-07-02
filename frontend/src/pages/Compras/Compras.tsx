import { useEffect, useState } from "react";

import { buscarProdutos } from "../../services/produtoSupabase";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function Compras() {
  const [produtos, setProdutos] =
    useState<any[]>([]);

  const [categoria, setCategoria] =
    useState("Todas");

  async function carregarCompras() {
    const dados =
      await buscarProdutos();

    const abaixoMinimo =
      dados.filter(
        (produto: any) =>
          produto.quantidade <=
          produto.estoque_minimo
      );

    setProdutos(abaixoMinimo);
  }

  useEffect(() => {
    carregarCompras();
  }, []);

  const produtosFiltrados =
    categoria === "Todas"
      ? produtos
      : produtos.filter(
          (produto) =>
            produto.categoria ===
            categoria
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
      `Lista de Compras - ${categoria}`,
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

      head: [
        [
          "Código",
          "Descrição",
          "Categoria",
          "Estoque",
          "Mínimo",
          "Comprar",
        ],
      ],

      body: produtosFiltrados.map(
        (produto) => [
          produto.codigo,
          produto.descricao,
          produto.categoria,
          produto.quantidade,
          produto.estoque_minimo,
          produto.estoque_minimo -
            produto.quantidade,
        ]
      ),
    });

    doc.save(
      `compras-${categoria}.pdf`
    );
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold text-blue-900">
          Compras
        </h1>

        <button
          onClick={gerarPDF}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-3 rounded-lg"
        >
          Gerar PDF
        </button>

      </div>

      <div className="bg-white rounded-xl shadow-md p-6 mb-6">

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
          className="border rounded-lg p-2 w-80"
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
                Categoria
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

            {produtosFiltrados.length ===
            0 ? (
              <tr>

                <td
                  colSpan={6}
                  className="text-center py-8 text-gray-500"
                >
                  Nenhum item precisa
                  de reposição
                </td>

              </tr>
            ) : (
              produtosFiltrados.map(
                (produto) => {
                  const comprar =
                    produto.estoque_minimo -
                    produto.quantidade;

                  return (
                    <tr
                      key={
                        produto.codigo
                      }
                      className="border-b"
                    >

                      <td>
                        {produto.codigo}
                      </td>

                      <td>
                        {
                          produto.descricao
                        }
                      </td>

                      <td className="text-center">
                        {
                          produto.categoria
                        }
                      </td>

                      <td className="text-center text-red-600 font-bold">
                        {
                          produto.quantidade
                        }
                      </td>

                      <td className="text-center">
                        {
                          produto.estoque_minimo
                        }
                      </td>

                      <td className="text-center font-bold text-orange-600">
                        {comprar}
                      </td>

                    </tr>
                  );
                }
              )
            )}

          </tbody>

        </table>

      </div>
    </>
  );
}

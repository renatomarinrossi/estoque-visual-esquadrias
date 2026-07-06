import { useState } from "react";

import type { Fornecedor } from "../../types/fornecedor";

import FornecedorDetalhes from "./FornecedorDetalhes";

type Props = {
  fornecedores: Fornecedor[];
  onEditar: (fornecedor: Fornecedor) => void;
  onExcluir: (fornecedor: Fornecedor) => void;
};

export default function FornecedorTable({
  fornecedores,
  onEditar,
  onExcluir,
}: Props) {
  const [
    fornecedorExpandido,
    setFornecedorExpandido,
  ] = useState<number | null>(
    null
  );

  function alternarFornecedor(
    id: number
  ) {
    if (
      fornecedorExpandido === id
    ) {
      setFornecedorExpandido(
        null
      );
    } else {
      setFornecedorExpandido(
        id
      );
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <table className="w-full">

        <thead>

          <tr className="border-b">

            <th className="text-left py-3 w-1/4">
              Nome
            </th>

            <th className="w-40">
              Categoria
            </th>

            <th className="w-44">
              Contato
            </th>

            <th className="w-40">
              Telefone
            </th>

            <th className="w-40">
              Ações
            </th>

          </tr>

        </thead>

        <tbody>

          {fornecedores.map(
            (fornecedor) => (
              <>
                <tr
                  key={
                    fornecedor.id
                  }
                  className="border-b hover:bg-slate-50"
                >

                  <td className="py-3">

                    <button
                      onClick={() =>
                        alternarFornecedor(
                          fornecedor.id!
                        )
                      }
                      className="font-semibold text-blue-700 hover:text-blue-900"
                    >

                      {fornecedorExpandido ===
                      fornecedor.id
                        ? "▼ "
                        : "▶ "}

                      {
                        fornecedor.nome_fantasia
                      }

                    </button>

                  </td>

                  <td className="text-center">
                    {
                      fornecedor.categoria
                    }
                  </td>

                  <td className="text-center">
                    {
                      fornecedor.contato
                    }
                  </td>

                  <td className="text-center">
                    {
                      fornecedor.telefone
                    }
                  </td>

                  <td className="flex gap-2 justify-center py-2">

                    <button
                      onClick={() =>
                        onEditar(
                          fornecedor
                        )
                      }
                      className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        onExcluir(
                          fornecedor
                        )
                      }
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Excluir
                    </button>

                  </td>

                </tr>

                {fornecedorExpandido ===
                  fornecedor.id && (
                  <tr>

                    <td
                      colSpan={5}
                    >

                      <FornecedorDetalhes
                        fornecedor={
                          fornecedor
                        }
                      />

                    </td>

                  </tr>
                )}

              </>
            )
          )}

        </tbody>

      </table>

    </div>
  );
}

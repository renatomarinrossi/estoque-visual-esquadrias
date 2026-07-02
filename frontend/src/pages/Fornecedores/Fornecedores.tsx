import { useEffect, useState } from "react";

import type { Fornecedor } from "../../types/fornecedor";

import {
  buscarFornecedores,
  inserirFornecedor,
  atualizarFornecedor,
  excluirFornecedor,
} from "../../services/fornecedorSupabase";

const categorias = [
  "Vidros",
  "Alumínio",
  "Acessórios",
  "Ferramentas",
  "Parafusos/Brocas",
  "Silicone/PU",
  "Borrachas",
];

export default function Fornecedores() {
  const [fornecedores, setFornecedores] =
    useState<Fornecedor[]>([]);

  const [mostrarFormulario, setMostrarFormulario] =
    useState(false);

  const [fornecedorEditando, setFornecedorEditando] =
    useState<Fornecedor | null>(null);

  const [categoriaFiltro, setCategoriaFiltro] =
    useState("Todos");

  const [fornecedor, setFornecedor] =
    useState<Fornecedor>({
      razao_social: "",
      nome_fantasia: "",
      categoria: "Vidros",
      contato: "",
      telefone: "",
      whatsapp: "",
      email: "",
      cidade: "",
      estado: "",
      observacoes: "",
    });

  async function carregarDados() {
    const dados =
      await buscarFornecedores();

    setFornecedores(dados as Fornecedor[]);
  }

  useEffect(() => {
    carregarDados();
  }, []);

  async function salvarFornecedor() {
    try {
      if (
        fornecedorEditando?.id
      ) {
        await atualizarFornecedor(
          fornecedorEditando.id,
          fornecedor
        );
      } else {
        await inserirFornecedor(
          fornecedor
        );
      }

      await carregarDados();

      setFornecedor({
        razao_social: "",
        nome_fantasia: "",
        categoria: "Vidros",
        contato: "",
        telefone: "",
        whatsapp: "",
        email: "",
        cidade: "",
        estado: "",
        observacoes: "",
      });

      setFornecedorEditando(null);

      setMostrarFormulario(false);
    } catch (error) {
      console.error(error);

      alert(
        "Erro ao salvar fornecedor"
      );
    }
  }

  function editarFornecedor(
    item: Fornecedor
  ) {
    setFornecedor(item);

    setFornecedorEditando(item);

    setMostrarFormulario(true);
  }

  async function removerFornecedor(
    item: Fornecedor
  ) {
    if (!item.id) return;

    const confirmar = confirm(
      `Excluir ${item.nome_fantasia}?`
    );

    if (!confirmar) return;

    await excluirFornecedor(
      item.id
    );

    await carregarDados();
  }

  const lista =
    categoriaFiltro === "Todos"
      ? fornecedores
      : fornecedores.filter(
          (f) =>
            f.categoria ===
            categoriaFiltro
        );

  return (
    <>
      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold text-blue-900">
          Fornecedores
        </h1>

        <button
          onClick={() => {
            setFornecedorEditando(
              null
            );

            setFornecedor({
              razao_social: "",
              nome_fantasia: "",
              categoria: "Vidros",
              contato: "",
              telefone: "",
              whatsapp: "",
              email: "",
              cidade: "",
              estado: "",
              observacoes: "",
            });

            setMostrarFormulario(
              true
            );
          }}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
        >
          Novo Fornecedor
        </button>

      </div>

      <div className="mb-6">

        <select
          value={categoriaFiltro}
          onChange={(e) =>
            setCategoriaFiltro(
              e.target.value
            )
          }
          className="border rounded-lg p-3 bg-white"
        >
          <option>
            Todos
          </option>

          {categorias.map(
            (categoria) => (
              <option
                key={categoria}
              >
                {categoria}
              </option>
            )
          )}
        </select>

      </div>

      {mostrarFormulario && (
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">

          <div className="grid grid-cols-3 gap-4">

            <input
              placeholder="Razão Social"
              value={
                fornecedor.razao_social
              }
              onChange={(e) =>
                setFornecedor({
                  ...fornecedor,
                  razao_social:
                    e.target.value,
                })
              }
              className="border rounded-lg p-2"
            />

            <input
              placeholder="Nome Fantasia"
              value={
                fornecedor.nome_fantasia
              }
              onChange={(e) =>
                setFornecedor({
                  ...fornecedor,
                  nome_fantasia:
                    e.target.value,
                })
              }
              className="border rounded-lg p-2"
            />

            <select
              value={
                fornecedor.categoria
              }
              onChange={(e) =>
                setFornecedor({
                  ...fornecedor,
                  categoria:
                    e.target.value,
                })
              }
              className="border rounded-lg p-2"
            >
              {categorias.map(
                (categoria) => (
                  <option
                    key={categoria}
                  >
                    {categoria}
                  </option>
                )
              )}
            </select>

            <input
              placeholder="Contato"
              value={
                fornecedor.contato
              }
              onChange={(e) =>
                setFornecedor({
                  ...fornecedor,
                  contato:
                    e.target.value,
                })
              }
              className="border rounded-lg p-2"
            />

            <input
              placeholder="Telefone"
              value={
                fornecedor.telefone
              }
              onChange={(e) =>
                setFornecedor({
                  ...fornecedor,
                  telefone:
                    e.target.value,
                })
              }
              className="border rounded-lg p-2"
            />

            <input
              placeholder="WhatsApp"
              value={
                fornecedor.whatsapp
              }
              onChange={(e) =>
                setFornecedor({
                  ...fornecedor,
                  whatsapp:
                    e.target.value,
                })
              }
              className="border rounded-lg p-2"
            />

            <input
              placeholder="E-mail"
              value={
                fornecedor.email
              }
              onChange={(e) =>
                setFornecedor({
                  ...fornecedor,
                  email:
                    e.target.value,
                })
              }
              className="border rounded-lg p-2"
            />

            <input
              placeholder="Cidade"
              value={
                fornecedor.cidade
              }
              onChange={(e) =>
                setFornecedor({
                  ...fornecedor,
                  cidade:
                    e.target.value,
                })
              }
              className="border rounded-lg p-2"
            />

            <input
              placeholder="Estado"
              value={
                fornecedor.estado
              }
              onChange={(e) =>
                setFornecedor({
                  ...fornecedor,
                  estado:
                    e.target.value,
                })
              }
              className="border rounded-lg p-2"
            />

          </div>

          <textarea
            placeholder="Observações"
            value={
              fornecedor.observacoes
            }
            onChange={(e) =>
              setFornecedor({
                ...fornecedor,
                observacoes:
                  e.target.value,
              })
            }
            className="border rounded-lg p-2 w-full mt-4"
          />

          <div className="flex gap-3 mt-4">

            <button
              onClick={
                salvarFornecedor
              }
              className="bg-green-600 text-white px-5 py-2 rounded-lg"
            >
              Salvar
            </button>

            <button
              onClick={() =>
                setMostrarFormulario(
                  false
                )
              }
              className="bg-gray-300 px-5 py-2 rounded-lg"
            >
              Cancelar
            </button>

          </div>

        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6">

        <table className="w-full">

          <thead>
            <tr className="border-b">
              <th className="text-left py-3">
                Nome
              </th>

              <th>
                Categoria
              </th>

              <th>
                Contato
              </th>

              <th>
                Telefone
              </th>

              <th>
                Ações
              </th>
            </tr>
          </thead>

          <tbody>

            {lista.map(
              (fornecedor) => (
                <tr
                  key={
                    fornecedor.id
                  }
                  className="border-b"
                >
                  <td>
                    {
                      fornecedor.nome_fantasia
                    }
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
                        editarFornecedor(
                          fornecedor
                        )
                      }
                      className="bg-yellow-500 text-white px-3 py-1 rounded"
                    >
                      Editar
                    </button>

                    <button
                      onClick={() =>
                        removerFornecedor(
                          fornecedor
                        )
                      }
                      className="bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Excluir
                    </button>

                  </td>
                </tr>
              )
            )}

          </tbody>

        </table>

      </div>
    </>
  );
}

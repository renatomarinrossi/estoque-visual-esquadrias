import { useEffect, useState } from "react";

import type { Fornecedor } from "../../types/fornecedor";

import {
  buscarFornecedores,
  inserirFornecedor,
  atualizarFornecedor,
  excluirFornecedor,
} from "../../services/fornecedorSupabase";

import FornecedorForm from "../../components/fornecedores/FornecedorForm";
import FornecedorTable from "../../components/fornecedores/FornecedorTable";

const categorias = [
  "Vidros",
  "Alumínio",
  "Acessórios",
  "Ferramentas",
  "Parafusos/Brocas",
  "Silicone/PU",
  "Borrachas",
];

const fornecedorVazio: Fornecedor = {
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
};

export default function Fornecedores() {
  const [
    fornecedores,
    setFornecedores,
  ] = useState<Fornecedor[]>([]);

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [
    fornecedorEditando,
    setFornecedorEditando,
  ] =
    useState<Fornecedor | null>(
      null
    );

  const [
    categoriaFiltro,
    setCategoriaFiltro,
  ] = useState("Todos");

  const [
    fornecedor,
    setFornecedor,
  ] =
    useState<Fornecedor>(
      fornecedorVazio
    );

  async function carregarDados() {
    const dados =
      await buscarFornecedores();

    setFornecedores(
      dados as Fornecedor[]
    );
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

      setFornecedor(
        fornecedorVazio
      );

      setFornecedorEditando(
        null
      );

      setMostrarFormulario(
        false
      );
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

    setFornecedorEditando(
      item
    );

    setMostrarFormulario(
      true
    );
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

            setFornecedor(
              fornecedorVazio
            );

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

      </div>      {mostrarFormulario && (
        <FornecedorForm
          fornecedor={fornecedor}
          setFornecedor={setFornecedor}
          categorias={categorias}
          onSalvar={salvarFornecedor}
          onCancelar={() => {
            setMostrarFormulario(false);

            setFornecedorEditando(
              null
            );

            setFornecedor(
              fornecedorVazio
            );
          }}
        />
      )}

      <FornecedorTable
        fornecedores={lista}
        onEditar={
          editarFornecedor
        }
        onExcluir={
          removerFornecedor
        }
      />    </>
  );
}
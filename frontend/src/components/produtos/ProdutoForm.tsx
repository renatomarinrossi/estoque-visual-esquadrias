import { useEffect, useState } from "react";

import type { Produto } from "../../types/produto";

import { buscarFornecedores } from "../../services/fornecedorSupabase";

type Props = {
  onSalvar: (produto: Produto) => void;
  onCancelar: () => void;
  produtoInicial?: Produto | null;
};

export default function ProdutoForm({
  onSalvar,
  onCancelar,
  produtoInicial,
}: Props) {
  const [fornecedores, setFornecedores] =
    useState<any[]>([]);

  const [produto, setProduto] =
    useState<Produto>(
      produtoInicial || {
        id: undefined,
        codigo: "",
        descricao: "",
        categoria: "",
        unidade: "UN",
        quantidade: 0,
        estoqueMinimo: 0,
        precoCompra: 0,
        observacao: "",
        fornecedorId: undefined,
      }
    );

  useEffect(() => {
    async function carregarFornecedores() {
      const dados =
        await buscarFornecedores();

      setFornecedores(dados);
    }

    carregarFornecedores();
  }, []);

  // Atualiza o formulário sempre que um novo produto for selecionado
  useEffect(() => {
    if (produtoInicial) {
      setProduto(produtoInicial);
    } else {
      setProduto({
        id: undefined,
        codigo: "",
        descricao: "",
        categoria: "",
        unidade: "UN",
        quantidade: 0,
        estoqueMinimo: 0,
        precoCompra: 0,
        observacao: "",
        fornecedorId: undefined,
      });
    }
  }, [produtoInicial]);

  function salvar() {
    if (!produto.categoria) {
      alert(
        "Selecione uma categoria"
      );
      return;
    }

    onSalvar(produto);
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">

      <h2 className="text-xl font-semibold mb-6">
        {produtoInicial
          ? "Editar Produto"
          : "Cadastro de Produto"}
      </h2>

      <div className="grid grid-cols-4 gap-4">

        <div>
          <label className="block mb-2">
            Código
          </label>

          <input
            placeholder="Código"
            className="border rounded-lg p-2 w-full"
            value={produto.codigo}
            onChange={(e) =>
              setProduto({
                ...produto,
                codigo: e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="block mb-2">
            Descrição
          </label>

          <input
            placeholder="Descrição"
            className="border rounded-lg p-2 w-full"
            value={produto.descricao}
            onChange={(e) =>
              setProduto({
                ...produto,
                descricao:
                  e.target.value,
              })
            }
          />
        </div>

        <div>
          <label className="block mb-2">
            Categoria
          </label>

          <select
            className="border rounded-lg p-2 w-full"
            value={
              produto.categoria || ""
            }
            onChange={(e) =>
              setProduto({
                ...produto,
                categoria:
                  e.target.value,
              })
            }
          >
            <option value="">
              Selecione
            </option>

            <option>Vidros</option>
            <option>Alumínio</option>
            <option>Acessórios</option>
            <option>Ferramentas</option>
            <option>Parafusos/Brocas</option>
            <option>Silicone/PU</option>
            <option>Borrachas</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">
            Unidade
          </label>

          <select
            className="border rounded-lg p-2 w-full"
            value={produto.unidade}
            onChange={(e) =>
              setProduto({
                ...produto,
                unidade:
                  e.target.value,
              })
            }
          >
            <option>UN</option>
            <option>Barra</option>
            <option>Kg</option>
            <option>M²</option>
            <option>M³</option>
            <option>Caixa</option>
          </select>
        </div>

        <div>
          <label className="block mb-2">
            Quantidade
          </label>

          <input
            type="number"
            className="border rounded-lg p-2 w-full"
            value={produto.quantidade}
            onChange={(e) =>
              setProduto({
                ...produto,
                quantidade:
                  Number(
                    e.target.value
                  ),
              })
            }
          />
        </div>

        <div>
          <label className="block mb-2">
            Estoque Mínimo
          </label>

          <input
            type="number"
            className="border rounded-lg p-2 w-full"
            value={
              produto.estoqueMinimo
            }
            onChange={(e) =>
              setProduto({
                ...produto,
                estoqueMinimo:
                  Number(
                    e.target.value
                  ),
              })
            }
          />
        </div>

        <div>
          <label className="block mb-2">
            Preço de Compra
          </label>

          <input
            type="number"
            step="0.01"
            className="border rounded-lg p-2 w-full"
            value={
              produto.precoCompra
            }
            onChange={(e) =>
              setProduto({
                ...produto,
                precoCompra:
                  Number(
                    e.target.value
                  ),
              })
            }
          />
        </div>

        <div>
          <label className="block mb-2">
            Fornecedor
          </label>

          <select
            className="border rounded-lg p-2 w-full"
            value={
              produto.fornecedorId ||
              ""
            }
            onChange={(e) =>
              setProduto({
                ...produto,
                fornecedorId:
                  e.target.value
                    ? Number(
                        e.target.value
                      )
                    : undefined,
              })
            }
          >
            <option value="">
              Selecione
            </option>

            {fornecedores.map(
              (fornecedor) => (
                <option
                  key={
                    fornecedor.id
                  }
                  value={
                    fornecedor.id
                  }
                >
                  {
                    fornecedor.nome_fantasia
                  }
                </option>
              )
            )}
          </select>
        </div>

        <div className="col-span-4">
          <label className="block mb-2">
            Observação
          </label>

          <input
            className="border rounded-lg p-2 w-full"
            value={
              produto.observacao
            }
            onChange={(e) =>
              setProduto({
                ...produto,
                observacao:
                  e.target.value,
              })
            }
          />
        </div>

      </div>

      <div className="flex gap-3 mt-6">

        <button
          onClick={salvar}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg"
        >
          Salvar
        </button>

        <button
          onClick={onCancelar}
          className="bg-gray-300 hover:bg-gray-400 px-5 py-2 rounded-lg"
        >
          Cancelar
        </button>

      </div>

    </div>
  );
}

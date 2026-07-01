import { useState } from "react";
import type { Produto } from "../../types/produto";

type Props = {
  onSalvar: (produto: Produto) => void;
  onCancelar: () => void;
};

export default function ProdutoForm({
  onSalvar,
  onCancelar,
}: Props) {
  const [produto, setProduto] = useState<Produto>({
    codigo: "",
    descricao: "",
    unidade: "UN",
    quantidade: 0,
    estoqueMinimo: 0,
    precoCompra: 0,
    observacao: "",
  });

  function salvar() {
    onSalvar(produto);
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-xl font-semibold mb-6">
        Cadastro de Produto
      </h2>

      <div className="grid grid-cols-4 gap-4">

        <input
          placeholder="Código"
          className="border rounded-lg p-2"
          value={produto.codigo}
          onChange={(e) =>
            setProduto({
              ...produto,
              codigo: e.target.value,
            })
          }
        />

        <input
          placeholder="Descrição"
          className="border rounded-lg p-2"
          value={produto.descricao}
          onChange={(e) =>
            setProduto({
              ...produto,
              descricao: e.target.value,
            })
          }
        />

        <select
          className="border rounded-lg p-2"
          value={produto.unidade}
          onChange={(e) =>
            setProduto({
              ...produto,
              unidade: e.target.value,
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

        <input
          type="number"
          placeholder="Quantidade"
          className="border rounded-lg p-2"
          onChange={(e) =>
            setProduto({
              ...produto,
              quantidade: Number(e.target.value),
            })
          }
        />

        <input
          type="number"
          placeholder="Estoque Mínimo"
          className="border rounded-lg p-2"
          onChange={(e) =>
            setProduto({
              ...produto,
              estoqueMinimo: Number(e.target.value),
            })
          }
        />

        <input
          type="number"
          step="0.01"
          placeholder="Preço Compra"
          className="border rounded-lg p-2"
          onChange={(e) =>
            setProduto({
              ...produto,
              precoCompra: Number(e.target.value),
            })
          }
        />

        <input
          placeholder="Observação"
          className="border rounded-lg p-2 col-span-2"
          onChange={(e) =>
            setProduto({
              ...produto,
              observacao: e.target.value,
            })
          }
        />

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

import type { Produto } from "../../types/produto";

type Props = {
  produtos: Produto[];
  onExcluir: (produto: Produto) => void;
  onEditar: (produto: Produto) => void;
};

export default function ProdutoTable({
  produtos,
  onExcluir,
  onEditar,
}: Props) {
  return (
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

            <th>Unidade</th>

            <th>Estoque</th>

            <th>Mínimo</th>

            <th>Preço Compra</th>

            <th>Última Entrada</th>

            <th>Ações</th>
          </tr>

        </thead>

        <tbody>

          {produtos.map((produto) => (

            <tr
              key={produto.codigo}
              className="border-b"
            >

              <td>{produto.codigo}</td>

              <td>{produto.descricao}</td>

              <td className="text-center">
                {produto.unidade}
              </td>

              <td className="text-center">
                {produto.quantidade}
              </td>

              <td className="text-center">
                {produto.estoqueMinimo}
              </td>

              <td className="text-center">
                R$ {produto.precoCompra.toFixed(2)}
              </td>

              <td className="text-center text-sm">
                {produto.ultimaEntrada
                  ? new Date(
                      produto.ultimaEntrada
                    ).toLocaleString(
                      "pt-BR"
                    )
                  : "-"}
              </td>

              <td className="flex gap-2 justify-center py-2">

                <button
                  onClick={() =>
                    onEditar(produto)
                  }
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded"
                >
                  Editar
                </button>

                <button
                  onClick={() =>
                    onExcluir(produto)
                  }
                  className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                >
                  Excluir
                </button>

              </td>

            </tr>

          ))}

        </tbody>

      </table>
    </div>
  );
}

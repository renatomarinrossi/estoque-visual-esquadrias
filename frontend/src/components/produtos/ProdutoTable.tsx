import type { Produto } from "../../types/produto";

type Props = {
  produtos: Produto[];
  onExcluir: (produto: Produto) => void;
};

export default function ProdutoTable({
  produtos,
  onExcluir,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6">
      <table className="w-full">
        <thead>
          <tr className="border-b">
            <th className="text-left py-3">Código</th>
            <th className="text-left">Descrição</th>
            <th>Unidade</th>
            <th>Estoque</th>
            <th>Mínimo</th>
            <th>Preço Compra</th>
            <th>Ações</th>
          </tr>
        </thead>

        <tbody>
          {produtos.length === 0 ? (
            <tr>
              <td
                colSpan={7}
                className="text-center py-8 text-gray-500"
              >
                Nenhum produto cadastrado
              </td>
            </tr>
          ) : (
            produtos.map((produto, index) => (
              <tr
                key={index}
                className="border-b"
              >
                <td>{produto.codigo}</td>

                <td>{produto.descricao}</td>

                <td className="text-center">
                  {produto.unidade}
                </td>

                <td
                  className={`text-center font-semibold ${
                    produto.quantidade <= produto.estoqueMinimo
                      ? "text-red-600"
                      : ""
                  }`}
                >
                  {produto.quantidade}
                </td>

                <td className="text-center">
                  {produto.estoqueMinimo}
                </td>

                <td className="text-center">
                  R$ {produto.precoCompra.toFixed(2)}
                </td>

                <td className="text-center">
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
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

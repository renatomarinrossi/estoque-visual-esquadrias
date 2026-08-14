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
    <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-md">
      <table className="w-full min-w-[1050px]">
        <thead>
          <tr className="border-b">
            <th className="border-r py-3 pr-2 text-left whitespace-nowrap">Código</th>
            <th className="border-r px-2 text-left">Descrição</th>
            <th className="border-r px-2 text-center whitespace-nowrap">Categ.</th>
            <th className="border-r px-2 text-center whitespace-nowrap">UND.</th>
            <th className="border-r px-2 text-center whitespace-nowrap">Estoque</th>
            <th className="border-r px-2 text-center leading-tight whitespace-nowrap">
              <span className="block">Estoque</span>
              <span className="block">Mínimo</span>
            </th>
            <th className="border-r px-2 text-center leading-tight whitespace-nowrap">
              <span className="block">Preço</span>
              <span className="block">Compra</span>
            </th>
            <th className="border-r px-2 text-center leading-tight whitespace-nowrap">
              <span className="block">Último</span>
              <span className="block">Fornecedor</span>
            </th>
            <th className="border-r px-2 text-center leading-tight whitespace-nowrap">
              <span className="block">Última</span>
              <span className="block">Entrada</span>
            </th>
            <th className="pl-2 text-center whitespace-nowrap">Ações</th>
          </tr>
        </thead>

        <tbody>
          {produtos.map((produto) => (
            <tr key={produto.id} className="border-b">
              <td className="border-r py-2 pr-2">{produto.codigo}</td>
              <td className="border-r px-2">{produto.descricao}</td>
              <td className="border-r px-2 text-center">{produto.categoria || "-"}</td>
              <td className="border-r px-2 text-center">{produto.unidade}</td>
              <td className="border-r px-2 text-center">{produto.quantidade}</td>
              <td className="border-r px-2 text-center">{produto.estoqueMinimo}</td>
              <td className="border-r px-2 text-center">
                R$ {(produto.precoCompra || 0).toFixed(2)}
              </td>
              <td className="border-r px-2 text-center">{produto.fornecedorNome || "-"}</td>
              <td className="border-r px-2 text-center text-sm">
                {produto.ultimaEntrada
                  ? new Date(produto.ultimaEntrada).toLocaleString("pt-BR")
                  : "-"}
              </td>
              <td className="flex justify-center gap-2 py-2 pl-2">
                <button
                  type="button"
                  onClick={() => onEditar(produto)}
                  className="rounded-md bg-yellow-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-yellow-600"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onExcluir(produto)}
                  className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-red-700"
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


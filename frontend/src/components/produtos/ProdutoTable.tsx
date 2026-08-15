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
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[1050px] text-sm">
        <thead className="bg-slate-100/80">
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
            <th className="px-4 py-3 text-left whitespace-nowrap">Código</th>
            <th className="px-2 text-left">Descrição</th>
            <th className="px-2 text-center whitespace-nowrap">Categ.</th>
            <th className="px-2 text-center whitespace-nowrap">UND.</th>
            <th className="px-2 text-center whitespace-nowrap">Estoque</th>
            <th className="px-2 text-center leading-tight whitespace-nowrap">
              <span className="block">Estoque</span>
              <span className="block">Mínimo</span>
            </th>
            <th className="px-2 text-center leading-tight whitespace-nowrap">
              <span className="block">Preço</span>
              <span className="block">Compra</span>
            </th>
            <th className="px-2 text-center leading-tight whitespace-nowrap">
              <span className="block">Último</span>
              <span className="block">Fornecedor</span>
            </th>
            <th className="px-2 text-center leading-tight whitespace-nowrap">
              <span className="block">Última</span>
              <span className="block">Entrada</span>
            </th>
            <th className="px-3 text-center whitespace-nowrap">Ações</th>
          </tr>
        </thead>

        <tbody>
          {produtos.map((produto, index) => (
            <tr key={produto.id} className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-blue-50/35"} hover:bg-blue-50/70`}>
              <td className="px-4 py-2.5">{produto.codigo}</td>
              <td className="px-2 text-[13px] font-medium text-slate-800">{produto.descricao}</td>
              <td className="px-2 text-center">{produto.categoria || "-"}</td>
              <td className="px-2 text-center">{produto.unidade}</td>
              <td className="px-2 text-center">{produto.quantidade}</td>
              <td className="px-2 text-center">{produto.estoqueMinimo}</td>
              <td className="px-2 text-center">
                R$ {(produto.precoCompra || 0).toFixed(2)}
              </td>
              <td className="px-2 text-center">{produto.fornecedorNome || "-"}</td>
              <td className="px-2 text-center text-xs">
                {produto.ultimaEntrada
                  ? new Date(produto.ultimaEntrada).toLocaleString("pt-BR")
                  : "-"}
              </td>
              <td className="flex justify-center gap-2 px-3 py-2">
                <button
                  type="button"
                  onClick={() => onEditar(produto)}
                  className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => onExcluir(produto)}
                  className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100"
                >
                  Excluir
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}


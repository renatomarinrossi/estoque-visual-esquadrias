import { Fragment, useState } from "react";

import type { Fornecedor } from "../../types/fornecedor";
import FornecedorDetalhes from "./FornecedorDetalhes";

type Props = {
  fornecedores: Fornecedor[];
  onEditar: (fornecedor: Fornecedor) => void;
  onExcluir: (fornecedor: Fornecedor) => void;
};

export default function FornecedorTable({ fornecedores, onEditar, onExcluir }: Props) {
  const [fornecedorExpandido, setFornecedorExpandido] = useState<number | null>(null);

  function alternarFornecedor(id: number) {
    setFornecedorExpandido((atual) => (atual === id ? null : id));
  }

  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
      <div className="overflow-x-auto">
      <table className="w-full min-w-[780px] text-sm">
        <thead className="bg-slate-100/80">
          <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-600">
            <th className="w-1/4 px-4 py-3 text-left">Nome</th>
            <th className="w-40 text-center">Categoria</th>
            <th className="w-44 text-center">Contato</th>
            <th className="w-40 text-center">Telefone</th>
            <th className="w-40 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {fornecedores.map((fornecedor, index) => (
            <Fragment key={fornecedor.id}>
              <tr className={`border-b border-slate-100 ${index % 2 === 0 ? "bg-white" : "bg-blue-50/35"} hover:bg-blue-50/70`}>
                <td className="px-4 py-2.5">
                  <button type="button" onClick={() => alternarFornecedor(fornecedor.id!)} className="flex items-center gap-2 text-[13px] font-semibold text-blue-700 hover:text-blue-900">
                    <span className="w-3 text-xs">{fornecedorExpandido === fornecedor.id ? "▼" : "▶"}</span>
                    {fornecedor.nome_fantasia}
                  </button>
                </td>
                <td className="text-center">{fornecedor.categoria}</td>
                <td className="text-center">{fornecedor.contato}</td>
                <td className="text-center">{fornecedor.telefone}</td>
                <td className="py-2"><div className="flex justify-center gap-1.5"><button type="button" onClick={() => onEditar(fornecedor)} className="rounded-md border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100">Editar</button><button type="button" onClick={() => onExcluir(fornecedor)} className="rounded-md border border-red-200 bg-red-50 px-2.5 py-1 text-xs font-semibold text-red-700 transition hover:bg-red-100">Excluir</button></div></td>
              </tr>
              {fornecedorExpandido === fornecedor.id && <tr><td colSpan={5}><FornecedorDetalhes fornecedor={fornecedor} /></td></tr>}
            </Fragment>
          ))}
        </tbody>
      </table>
      </div>
    </div>
  );
}




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
    <div className="overflow-x-auto rounded-xl bg-white p-6 shadow-md">
      <table className="w-full min-w-[780px]">
        <thead>
          <tr className="border-b">
            <th className="w-1/4 border-r border-black py-3 text-left">Nome</th>
            <th className="w-40 border-r border-black text-center">Categoria</th>
            <th className="w-44 border-r border-black text-center">Contato</th>
            <th className="w-40 border-r border-black text-center">Telefone</th>
            <th className="w-40 text-center">Ações</th>
          </tr>
        </thead>
        <tbody>
          {fornecedores.map((fornecedor) => (
            <Fragment key={fornecedor.id}>
              <tr className="border-b hover:bg-slate-50">
                <td className="border-r border-black py-3">
                  <button type="button" onClick={() => alternarFornecedor(fornecedor.id!)} className="font-semibold text-blue-700 hover:text-blue-900">
                    {fornecedorExpandido === fornecedor.id ? "▼ " : "▶ "}{fornecedor.nome_fantasia}
                  </button>
                </td>
                <td className="border-r border-black text-center">{fornecedor.categoria}</td>
                <td className="border-r border-black text-center">{fornecedor.contato}</td>
                <td className="border-r border-black text-center">{fornecedor.telefone}</td>
                <td className="py-2"><div className="flex justify-center gap-1.5"><button type="button" onClick={() => onEditar(fornecedor)} className="rounded-md bg-yellow-500 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-yellow-600">Editar</button><button type="button" onClick={() => onExcluir(fornecedor)} className="rounded-md bg-red-600 px-2.5 py-1 text-xs font-semibold text-white shadow-sm transition hover:-translate-y-px hover:bg-red-700">Excluir</button></div></td>
              </tr>
              {fornecedorExpandido === fornecedor.id && <tr><td colSpan={5}><FornecedorDetalhes fornecedor={fornecedor} /></td></tr>}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}



import type { Fornecedor } from "../../types/fornecedor";

type Props = {
  fornecedor: Fornecedor;
};

export default function FornecedorDetalhes({
  fornecedor,
}: Props) {
  return (
    <div className="mx-4 my-2 rounded-lg border border-blue-100 bg-slate-50 p-4 text-sm">

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">

        <div>

          <p>
            <strong>Razão Social:</strong>
          </p>

          <p className="mb-3 mt-1 text-slate-700">
            {fornecedor.razao_social || "-"}
          </p>

          <p>
            <strong>Categoria:</strong>
          </p>

          <p className="mb-3 mt-1 text-slate-700">
            {fornecedor.categoria || "-"}
          </p>

          <p>
            <strong>Contato:</strong>
          </p>

          <p className="mt-1 text-slate-700">
            {fornecedor.contato || "-"}
          </p>

        </div>

        <div>

          <p>
            <strong>Telefone:</strong>
          </p>

          <p className="mb-3 mt-1 text-slate-700">
            {fornecedor.telefone || "-"}
          </p>

          <p>
            <strong>WhatsApp:</strong>
          </p>

          <p className="mb-3 mt-1 text-slate-700">
            {fornecedor.whatsapp || "-"}
          </p>

          <p>
            <strong>E-mail:</strong>
          </p>

          <p className="mb-3 mt-1 text-slate-700">
            {fornecedor.email || "-"}
          </p>

        </div>

      </div>

      <div className="mt-4 grid grid-cols-1 gap-4 border-t border-slate-200 pt-4 md:grid-cols-2">

        <div>

          <p>
            <strong>Cidade:</strong>
          </p>

          <p className="mt-1 text-slate-700">
            {fornecedor.cidade || "-"}
          </p>

        </div>

        <div>

          <p>
            <strong>Estado:</strong>
          </p>

          <p className="mt-1 text-slate-700">
            {fornecedor.estado || "-"}
          </p>

        </div>

      </div>

      <div className="mt-4 border-t border-slate-200 pt-4">

        <p>
          <strong>Observações:</strong>
        </p>

        <div className="mt-2 whitespace-pre-wrap rounded-lg border border-slate-200 bg-white p-3 text-slate-700">
          {fornecedor.observacoes || "Nenhuma observação cadastrada."}
        </div>

      </div>

    </div>
  );
}


import type { Fornecedor } from "../../types/fornecedor";

type Props = {
  fornecedor: Fornecedor;
};

export default function FornecedorDetalhes({
  fornecedor,
}: Props) {
  return (
    <div className="bg-slate-100 rounded-lg p-5 my-2">

      <div className="grid grid-cols-2 gap-6">

        <div>

          <p>
            <strong>Razão Social:</strong>
          </p>

          <p className="mb-4">
            {fornecedor.razao_social || "-"}
          </p>

          <p>
            <strong>Categoria:</strong>
          </p>

          <p className="mb-4">
            {fornecedor.categoria || "-"}
          </p>

          <p>
            <strong>Contato:</strong>
          </p>

          <p>
            {fornecedor.contato || "-"}
          </p>

        </div>

        <div>

          <p>
            <strong>Telefone:</strong>
          </p>

          <p className="mb-4">
            {fornecedor.telefone || "-"}
          </p>

          <p>
            <strong>WhatsApp:</strong>
          </p>

          <p className="mb-4">
            {fornecedor.whatsapp || "-"}
          </p>

          <p>
            <strong>E-mail:</strong>
          </p>

          <p className="mb-4">
            {fornecedor.email || "-"}
          </p>

        </div>

      </div>

      <div className="grid grid-cols-2 gap-6 mt-4">

        <div>

          <p>
            <strong>Cidade:</strong>
          </p>

          <p>
            {fornecedor.cidade || "-"}
          </p>

        </div>

        <div>

          <p>
            <strong>Estado:</strong>
          </p>

          <p>
            {fornecedor.estado || "-"}
          </p>

        </div>

      </div>

      <div className="mt-6">

        <p>
          <strong>Observações:</strong>
        </p>

        <div className="bg-white border rounded-lg p-3 mt-2 whitespace-pre-wrap">
          {fornecedor.observacoes || "Nenhuma observação cadastrada."}
        </div>

      </div>

    </div>
  );
}
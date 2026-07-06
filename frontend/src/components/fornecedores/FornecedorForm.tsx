import type { Fornecedor } from "../../types/fornecedor";

type Props = {
  fornecedor: Fornecedor;
  setFornecedor: React.Dispatch<
    React.SetStateAction<Fornecedor>
  >;
  categorias: string[];
  onSalvar: () => void;
  onCancelar: () => void;
};

export default function FornecedorForm({
  fornecedor,
  setFornecedor,
  categorias,
  onSalvar,
  onCancelar,
}: Props) {
  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">

      <div className="grid grid-cols-3 gap-4">

        <input
          placeholder="Razão Social"
          value={fornecedor.razao_social}
          onChange={(e) =>
            setFornecedor({
              ...fornecedor,
              razao_social: e.target.value,
            })
          }
          className="border rounded-lg p-2"
        />

        <input
          placeholder="Nome Fantasia"
          value={fornecedor.nome_fantasia}
          onChange={(e) =>
            setFornecedor({
              ...fornecedor,
              nome_fantasia: e.target.value,
            })
          }
          className="border rounded-lg p-2"
        />

        <select
          value={fornecedor.categoria}
          onChange={(e) =>
            setFornecedor({
              ...fornecedor,
              categoria: e.target.value,
            })
          }
          className="border rounded-lg p-2"
        >
          {categorias.map((categoria) => (
            <option
              key={categoria}
            >
              {categoria}
            </option>
          ))}
        </select>

        <input
          placeholder="Contato"
          value={fornecedor.contato}
          onChange={(e) =>
            setFornecedor({
              ...fornecedor,
              contato: e.target.value,
            })
          }
          className="border rounded-lg p-2"
        />

        <input
          placeholder="Telefone"
          value={fornecedor.telefone}
          onChange={(e) =>
            setFornecedor({
              ...fornecedor,
              telefone: e.target.value,
            })
          }
          className="border rounded-lg p-2"
        />

        <input
          placeholder="WhatsApp"
          value={fornecedor.whatsapp}
          onChange={(e) =>
            setFornecedor({
              ...fornecedor,
              whatsapp: e.target.value,
            })
          }
          className="border rounded-lg p-2"
        />

        <input
          placeholder="E-mail"
          value={fornecedor.email}
          onChange={(e) =>
            setFornecedor({
              ...fornecedor,
              email: e.target.value,
            })
          }
          className="border rounded-lg p-2"
        />

        <input
          placeholder="Cidade"
          value={fornecedor.cidade}
          onChange={(e) =>
            setFornecedor({
              ...fornecedor,
              cidade: e.target.value,
            })
          }
          className="border rounded-lg p-2"
        />

        <input
          placeholder="Estado"
          value={fornecedor.estado}
          onChange={(e) =>
            setFornecedor({
              ...fornecedor,
              estado: e.target.value,
            })
          }
          className="border rounded-lg p-2"
        />

      </div>

      <textarea
        placeholder="Observações"
        value={fornecedor.observacoes}
        onChange={(e) =>
          setFornecedor({
            ...fornecedor,
            observacoes: e.target.value,
          })
        }
        className="border rounded-lg p-2 w-full mt-4"
        rows={4}
      />

      <div className="flex gap-3 mt-5">

        <button
          onClick={onSalvar}
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

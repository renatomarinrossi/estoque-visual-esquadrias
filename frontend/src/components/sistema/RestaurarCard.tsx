import { useRef } from "react";

type Props = {
  onSelecionarArquivo: (file: File | null) => void;
  onRestaurar: () => void;
};

export default function RestaurarCard({
  onSelecionarArquivo,
  onRestaurar,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  return (
    <div className="bg-white rounded-xl shadow-md p-6">

      <h2 className="text-xl font-bold text-blue-900 mb-5">
        Restaurar Backup
      </h2>

      <input
        ref={inputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={(e) =>
          onSelecionarArquivo(
            e.target.files?.[0] || null
          )
        }
      />

      <div className="flex gap-3">

        <button
          onClick={() =>
            inputRef.current?.click()
          }
          className="bg-gray-600 hover:bg-gray-700 text-white px-5 py-3 rounded-lg"
        >
          Selecionar Arquivo
        </button>

        <button
          onClick={onRestaurar}
          className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg"
        >
          Restaurar Backup
        </button>

      </div>

      <p className="text-sm text-gray-500 mt-4">
        Apenas arquivos de backup (.json)
      </p>

    </div>
  );
}

import { useRef } from "react";

type Props = {
  onRestaurar: (arquivo: File) => void;
};

export default function RestaurarCard({
  onRestaurar,
}: Props) {
  const inputRef =
    useRef<HTMLInputElement>(null);

  function selecionarArquivo(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
    const arquivo =
      e.target.files?.[0];

    if (!arquivo) return;

    onRestaurar(arquivo);

    e.target.value = "";
  }

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
        onChange={selecionarArquivo}
      />

      <button
        onClick={() =>
          inputRef.current?.click()
        }
        className="bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-lg"
      >
        Restaurar Backup
      </button>

      <p className="text-sm text-gray-500 mt-4">
        Selecione um arquivo de backup (.json)
      </p>

    </div>
  );
}

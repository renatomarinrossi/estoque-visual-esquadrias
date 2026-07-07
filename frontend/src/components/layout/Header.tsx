import SearchBar from "../dashboard/SearchBar";

import useUsuario from "../../hooks/useUsuario";

export default function Header() {
  const usuario =
    useUsuario();

  function sair() {
    sessionStorage.removeItem(
      "visual_usuario"
    );

    window.location.reload();
  }

  return (
    <header className="bg-white h-20 border-b px-8 flex items-center justify-between">

      <div className="w-96">
        <SearchBar />
      </div>

      <div className="flex items-center gap-6">

        <div className="text-right">

          <div className="font-semibold text-lg">
            {usuario?.nome}
          </div>

          <div className="text-sm text-gray-500">
            {usuario?.perfil}
          </div>

        </div>

        <button
          onClick={sair}
          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg"
        >
          Sair
        </button>

      </div>

    </header>
  );
}

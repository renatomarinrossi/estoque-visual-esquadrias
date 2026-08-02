import SearchBar from "../dashboard/SearchBar";

import useUsuario from "../../hooks/useUsuario";
import { sairDoSistema } from "../../services/authUsuario";

export default function Header() {
  const usuario = useUsuario();

  async function sair() {
    await sairDoSistema();
    window.location.href = "/";
  }

  return (
    <header className="bg-white h-20 border-b px-8 flex items-center justify-between">
      <div className="w-96"><SearchBar /></div>
      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="font-semibold text-lg">{usuario?.nome}</div>
          <div className="text-sm text-gray-500">{usuario?.perfil}</div>
        </div>
        <button onClick={() => void sair()} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg">
          Sair
        </button>
      </div>
    </header>
  );
}


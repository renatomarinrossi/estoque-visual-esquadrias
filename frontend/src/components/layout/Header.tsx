import useUsuario from "../../hooks/useUsuario";
import { sairDoSistema } from "../../services/authUsuario";

export default function Header() {
  const usuario = useUsuario();

  async function sair() {
    await sairDoSistema();
    window.location.href = "/";
  }

  return (
    <header className="flex h-[54px] items-center justify-end border-b border-slate-200 bg-white px-5 shadow-sm lg:px-6">
      <div className="flex items-center gap-3">
        <div className="text-right leading-tight">
          <div className="text-sm font-semibold text-slate-900">
            {usuario?.nome}
          </div>
          <div className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500">
            {usuario?.perfil}
          </div>
        </div>
        <div className="h-7 w-px bg-slate-200" />
        <button
          type="button"
          onClick={() => void sair()}
          className="rounded-md border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-semibold text-red-700 transition-colors hover:bg-red-100"
        >
          Sair
        </button>
      </div>
    </header>
  );
}



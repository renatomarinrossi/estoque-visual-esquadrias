import { useState } from "react";

import { entrarComUsuario } from "../../services/authUsuario";

export default function Login() {
  const [login, setLogin] = useState("");
  const [senha, setSenha] = useState("");
  const [carregando, setCarregando] = useState(false);

  async function entrar() {
    if (!login.trim() || !senha) {
      alert("Informe usuário e senha.");
      return;
    }

    setCarregando(true);

    try {
      await entrarComUsuario(login, senha);
      window.location.reload();
    } catch (erro) {
      console.error(erro);
      alert(erro instanceof Error ? erro.message : "Não foi possível entrar.");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="bg-white rounded-xl shadow-md p-8 w-[400px]">
        <h1 className="text-3xl font-bold text-blue-900 mb-6 text-center">
          Visual Esquadrias
        </h1>

        <div className="mb-4">
          <label className="block mb-2">Usuário</label>
          <input value={login} onChange={(event) => setLogin(event.target.value)} className="w-full border rounded-lg p-2" autoComplete="username" />
        </div>

        <div className="mb-6">
          <label className="block mb-2">Senha</label>
          <input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} className="w-full border rounded-lg p-2" autoComplete="current-password" onKeyDown={(event) => { if (event.key === "Enter") void entrar(); }} />
        </div>

        <button onClick={() => void entrar()} disabled={carregando} className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-3 rounded-lg">
          {carregando ? "Entrando..." : "Entrar"}
        </button>
      </div>
    </div>
  );
}


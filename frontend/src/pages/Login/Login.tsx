import { useState } from "react";

import { autenticarUsuario } from "../../services/usuarioSupabase";

export default function Login() {
  const [login, setLogin] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [carregando, setCarregando] =
    useState(false);

  async function entrar() {
    try {
      setCarregando(true);

      const usuario =
        await autenticarUsuario(
          login,
          senha
        );

      if (!usuario) {
        alert(
          "Login ou senha inválidos."
        );
        return;
      }

      sessionStorage.setItem(
        "visual_usuario",
        JSON.stringify(usuario)
      );

      window.location.reload();

    } catch (erro) {
      console.error(erro);

      alert(
        "Erro ao realizar login."
      );
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

          <label className="block mb-2">
            Login
          </label>

          <input
            type="text"
            value={login}
            onChange={(e) =>
              setLogin(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-2"
          />

        </div>

        <div className="mb-6">

          <label className="block mb-2">
            Senha
          </label>

          <input
            type="password"
            value={senha}
            onChange={(e) =>
              setSenha(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-2"
          />

        </div>

        <button
          onClick={entrar}
          disabled={carregando}
          className="w-full bg-blue-700 hover:bg-blue-800 text-white py-3 rounded-lg"
        >
          {carregando
            ? "Entrando..."
            : "Entrar"}
        </button>

      </div>

    </div>
  );
}

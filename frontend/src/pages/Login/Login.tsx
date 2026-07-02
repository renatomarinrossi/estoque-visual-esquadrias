import { useState } from "react";
import { login } from "../../services/auth";

export default function Login() {
  const [email, setEmail] =
    useState("");

  const [senha, setSenha] =
    useState("");

  const [carregando, setCarregando] =
    useState(false);

  async function entrar() {
    try {
      setCarregando(true);

      await login(email, senha);

      sessionStorage.setItem(
        "visual_logado",
        "true"
      );

      window.location.reload();
    } catch (erro) {
      console.error(erro);

      alert(
        "E-mail ou senha inválidos"
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
            E-mail
          </label>

          <input
            type="email"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
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
              setSenha(e.target.value)
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

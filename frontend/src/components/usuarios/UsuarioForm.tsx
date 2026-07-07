import { useState } from "react";

import type { Usuario } from "../../types/usuario";

interface Props {
  usuarioInicial?: Usuario | null;

  onSalvar: (
    usuario: Usuario
  ) => void;

  onCancelar: () => void;
}

export default function UsuarioForm({
  usuarioInicial,
  onSalvar,
  onCancelar,
}: Props) {
  const [nome, setNome] =
    useState(
      usuarioInicial?.nome || ""
    );

  const [login, setLogin] =
    useState(
      usuarioInicial?.login || ""
    );

  const [senha, setSenha] =
    useState(
      usuarioInicial?.senha || ""
    );

  const [perfil, setPerfil] =
    useState<
      "DESENVOLVEDOR" |
      "GERENCIAL" |
      "OPERADOR"
    >(
      usuarioInicial?.perfil ||
      "OPERADOR"
    );

  const [ativo, setAtivo] =
    useState(
      usuarioInicial?.ativo ??
      true
    );

  function salvar() {
    if (
      !nome ||
      !login ||
      !senha
    ) {
      alert(
        "Preencha todos os campos."
      );
      return;
    }

    onSalvar({
      id:
        usuarioInicial?.id,

      nome,

      login,

      senha,

      perfil,

      ativo,
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">

      <h2 className="text-2xl font-bold text-blue-900 mb-6">

        {usuarioInicial
          ? "Editar Usuário"
          : "Novo Usuário"}

      </h2>

      <div className="grid grid-cols-2 gap-4">

        <div>

          <label className="block mb-2">
            Nome
          </label>

          <input
            value={nome}
            onChange={(e) =>
              setNome(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div>

          <label className="block mb-2">
            Login
          </label>

          <input
            value={login}
            onChange={(e) =>
              setLogin(
                e.target.value
              )
            }
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div>

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
            className="w-full border rounded-lg p-3"
          />

        </div>

        <div>

          <label className="block mb-2">
            Perfil
          </label>

          <select
            value={perfil}
            onChange={(e) =>
              setPerfil(
                e.target
                  .value as Usuario["perfil"]
              )
            }
            className="w-full border rounded-lg p-3"
          >

            <option value="DESENVOLVEDOR">
              Desenvolvedor
            </option>

            <option value="GERENCIAL">
              Gerencial
            </option>

            <option value="OPERADOR">
              Operador
            </option>

          </select>

        </div>

        <div className="col-span-2">

          <label className="flex items-center gap-2">

            <input
              type="checkbox"
              checked={ativo}
              onChange={(e) =>
                setAtivo(
                  e.target.checked
                )
              }
            />

            Usuário Ativo

          </label>

        </div>

      </div>

      <div className="flex gap-3 mt-8">

        <button
          onClick={salvar}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
        >
          Salvar
        </button>

        <button
          onClick={onCancelar}
          className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-lg"
        >
          Cancelar
        </button>

      </div>

    </div>
  );
}
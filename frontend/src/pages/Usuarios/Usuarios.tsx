import { useEffect, useState } from "react";

import UsuarioForm from "../../components/usuarios/UsuarioForm";
import UsuarioTable from "../../components/usuarios/UsuarioTable";

import type { Usuario } from "../../types/usuario";

import useUsuario from "../../hooks/useUsuario";

import {
  buscarUsuarios,
  inserirUsuario,
  atualizarUsuario,
  alterarStatusUsuario,
} from "../../services/usuarioSupabase";

export default function Usuarios() {
  const usuarioLogado =
    useUsuario();

  const [
    mostrarFormulario,
    setMostrarFormulario,
  ] = useState(false);

  const [
    usuarioEditando,
    setUsuarioEditando,
  ] =
    useState<Usuario | null>(
      null
    );

  const [usuarios, setUsuarios] =
    useState<Usuario[]>([]);

  async function carregarUsuarios() {
    const dados =
      await buscarUsuarios();

    setUsuarios(dados);
  }

  useEffect(() => {
    carregarUsuarios();
  }, []);

  async function salvarUsuario(
    usuario: Usuario
  ) {
    try {
      if (usuarioEditando) {
        await atualizarUsuario(
          usuarioEditando.id!,
          usuario
        );

        setUsuarioEditando(
          null
        );
      } else {
        await inserirUsuario(
          usuario
        );
      }

      await carregarUsuarios();

      setMostrarFormulario(
        false
      );
    } catch (erro) {
      console.error(erro);

      alert(
        "Erro ao salvar usuário."
      );
    }
  }

  function editarUsuario(
    usuario: Usuario
  ) {
    setUsuarioEditando(
      usuario
    );

    setMostrarFormulario(
      true
    );
  }

  async function alterarStatus(
    usuario: Usuario
  ) {
    if (
      usuario.id ===
      usuarioLogado?.id
    ) {
      alert(
        "Você não pode inativar sua própria conta."
      );
      return;
    }

    const confirmar =
      confirm(
        `${
          usuario.ativo
            ? "Inativar"
            : "Ativar"
        } o usuário ${
          usuario.nome
        }?`
      );

    if (!confirmar) {
      return;
    }

    try {
      await alterarStatusUsuario(
        usuario.id!,
        !usuario.ativo
      );

      await carregarUsuarios();

      alert(
        usuario.ativo
          ? "Usuário inativado com sucesso!"
          : "Usuário ativado com sucesso!"
      );
    } catch (erro) {
      console.error(erro);

      alert(
        "Erro ao alterar o status do usuário."
      );
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">

        <h1 className="text-4xl font-bold text-blue-900">
          Usuários
        </h1>

        <button
          onClick={() => {
            setUsuarioEditando(
              null
            );

            setMostrarFormulario(
              true
            );
          }}
          className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg"
        >
          Novo Usuário
        </button>

      </div>

      {mostrarFormulario && (
        <UsuarioForm
          usuarioInicial={
            usuarioEditando
          }
          onSalvar={
            salvarUsuario
          }
          onCancelar={() => {
            setMostrarFormulario(
              false
            );

            setUsuarioEditando(
              null
            );
          }}
        />
      )}

      <UsuarioTable
        usuarios={usuarios}
        onEditar={
          editarUsuario
        }
        onAlterarStatus={
          alterarStatus
        }
      />
    </>
  );
}

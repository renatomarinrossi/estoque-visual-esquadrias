import { useEffect, useState } from "react";

import UsuarioForm from "../../components/usuarios/UsuarioForm";
import UsuarioTable from "../../components/usuarios/UsuarioTable";
import useUsuario from "../../hooks/useUsuario";
import {
  alterarStatusUsuario,
  atualizarUsuario,
  buscarUsuarios,
  inserirUsuario,
  migrarUsuariosLegados,
} from "../../services/usuarioSupabase";
import type { Usuario } from "../../types/usuario";

export default function Usuarios() {
  const usuarioLogado = useUsuario();
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [usuarioEditando, setUsuarioEditando] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [processandoMigracao, setProcessandoMigracao] = useState(false);

  async function carregarUsuarios() {
    try { setUsuarios(await buscarUsuarios()); } catch (error) { console.error(error); alert("Não foi possível carregar os usuários."); }
  }

  useEffect(() => { void carregarUsuarios(); }, []);

  async function salvarUsuario(usuario: Usuario) {
    try {
      if (usuarioEditando?.id) await atualizarUsuario(usuarioEditando.id, usuario);
      else await inserirUsuario(usuario);
      await carregarUsuarios();
      setUsuarioEditando(null);
      setMostrarFormulario(false);
    } catch (error) { console.error(error); alert(error instanceof Error ? error.message : "Erro ao salvar usuário."); }
  }

  async function alterarStatus(usuario: Usuario) {
    if (usuario.id === usuarioLogado?.id) { alert("Você não pode inativar sua própria conta."); return; }
    if (!window.confirm(`${usuario.ativo ? "Inativar" : "Ativar"} o usuário ${usuario.nome}?`)) return;
    try { await alterarStatusUsuario(usuario.id!, !usuario.ativo); await carregarUsuarios(); } catch (error) { console.error(error); alert("Erro ao alterar o status do usuário."); }
  }

  async function migrarLegados() {
    if (!window.confirm("Migrar os usuários antigos para a nova autenticação? Eles manterão a senha atual e deixarão de armazená-la no sistema.")) return;
    setProcessandoMigracao(true);
    try {
      const resultado = await migrarUsuariosLegados();
      await carregarUsuarios();
      alert(`${resultado.migrados ?? 0} usuário(s) migrado(s) com sucesso.`);
    } catch (error) { console.error(error); alert(error instanceof Error ? error.message : "Erro ao migrar usuários."); }
    finally { setProcessandoMigracao(false); }
  }

  const existemLegados = usuarios.some((usuario) => !usuario.auth_user_id);

  return (
    <>
      <div className="flex justify-between items-center mb-8"><h1 className="text-4xl font-bold text-blue-900">Usuários</h1><div className="flex gap-3">{existemLegados && <button type="button" onClick={() => void migrarLegados()} disabled={processandoMigracao} className="bg-amber-600 hover:bg-amber-700 disabled:bg-amber-400 text-white px-5 py-3 rounded-lg">{processandoMigracao ? "Migrando..." : "Migrar usuários antigos"}</button>}<button type="button" onClick={() => { setUsuarioEditando(null); setMostrarFormulario(true); }} className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg">Novo usuário</button></div></div>
      {mostrarFormulario && <UsuarioForm usuarioInicial={usuarioEditando} onSalvar={salvarUsuario} onCancelar={() => { setMostrarFormulario(false); setUsuarioEditando(null); }} />}
      <UsuarioTable usuarios={usuarios} onEditar={(usuario) => { setUsuarioEditando(usuario); setMostrarFormulario(true); }} onAlterarStatus={alterarStatus} />
    </>
  );
}


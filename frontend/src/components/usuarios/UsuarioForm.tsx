import { useState } from "react";

import type { PerfilUsuario, Usuario } from "../../types/usuario";

interface Props {
  usuarioInicial?: Usuario | null;
  onSalvar: (usuario: Usuario) => void;
  onCancelar: () => void;
}

export default function UsuarioForm({ usuarioInicial, onSalvar, onCancelar }: Props) {
  const [nome, setNome] = useState(usuarioInicial?.nome || "");
  const [login, setLogin] = useState(usuarioInicial?.login || "");
  const [senha, setSenha] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>(usuarioInicial?.perfil || "OPERADOR");
  const [ativo, setAtivo] = useState(usuarioInicial?.ativo ?? true);

  function salvar() {
    if (!nome.trim() || !login.trim() || (!usuarioInicial && !senha)) {
      alert(usuarioInicial ? "Informe nome e usuário." : "Preencha nome, usuário e senha.");
      return;
    }

    onSalvar({
      id: usuarioInicial?.id,
      auth_user_id: usuarioInicial?.auth_user_id,
      nome: nome.trim(),
      login: login.trim(),
      senha: senha || undefined,
      perfil,
      ativo,
    });
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-6 mb-6">
      <h2 className="text-2xl font-bold text-blue-900 mb-6">{usuarioInicial ? "Editar usuário" : "Novo usuário"}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div><label className="block mb-2">Nome</label><input value={nome} onChange={(event) => setNome(event.target.value)} className="w-full border rounded-lg p-3" /></div>
        <div><label className="block mb-2">Usuário</label><input value={login} onChange={(event) => setLogin(event.target.value)} className="w-full border rounded-lg p-3" /></div>
        <div><label className="block mb-2">{usuarioInicial ? "Nova senha (opcional)" : "Senha"}</label><input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} className="w-full border rounded-lg p-3" autoComplete="new-password" /></div>
        <div><label className="block mb-2">Perfil</label><select value={perfil} onChange={(event) => setPerfil(event.target.value as PerfilUsuario)} className="w-full border rounded-lg p-3"><option value="DESENVOLVEDOR">Desenvolvedor</option><option value="GERENCIAL">Gerencial</option><option value="OPERADOR">Operador</option></select></div>
        <label className="flex items-center gap-2 md:col-span-2"><input type="checkbox" checked={ativo} onChange={(event) => setAtivo(event.target.checked)} />Usuário ativo</label>
      </div>
      <div className="flex gap-3 mt-8"><button type="button" onClick={salvar} className="bg-blue-700 hover:bg-blue-800 text-white px-5 py-3 rounded-lg">Salvar</button><button type="button" onClick={onCancelar} className="bg-gray-500 hover:bg-gray-600 text-white px-5 py-3 rounded-lg">Cancelar</button></div>
    </div>
  );
}


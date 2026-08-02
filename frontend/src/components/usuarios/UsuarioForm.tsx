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
  const [emailAutenticacao, setEmailAutenticacao] = useState("");
  const [perfil, setPerfil] = useState<PerfilUsuario>(usuarioInicial?.perfil || "OPERADOR");
  const [ativo, setAtivo] = useState(usuarioInicial?.ativo ?? true);

  function salvar() {
    if (!nome.trim() || !login.trim() || (!usuarioInicial && !senha)) {
      alert(usuarioInicial ? "Informe nome e usuário." : "Preencha nome, usuário e senha.");
      return;
    }

    if (emailAutenticacao.trim() && !/^\S+@\S+\.\S+$/.test(emailAutenticacao.trim())) {
      alert("Informe um e-mail válido.");
      return;
    }

    onSalvar({
      id: usuarioInicial?.id,
      auth_user_id: usuarioInicial?.auth_user_id,
      nome: nome.trim(),
      login: login.trim(),
      senha: senha || undefined,
      email_autenticacao: emailAutenticacao.trim() || undefined,
      perfil,
      ativo,
    });
  }

  return (
    <div className="mb-6 rounded-xl bg-white p-6 shadow-md">
      <h2 className="mb-6 text-2xl font-bold text-blue-900">{usuarioInicial ? "Editar usuário" : "Novo usuário"}</h2>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div><label className="mb-2 block">Nome</label><input value={nome} onChange={(event) => setNome(event.target.value)} className="w-full rounded-lg border p-3" /></div>
        <div><label className="mb-2 block">Usuário</label><input value={login} onChange={(event) => setLogin(event.target.value)} className="w-full rounded-lg border p-3" /></div>
        <div><label className="mb-2 block">{usuarioInicial ? "Nova senha (opcional)" : "Senha"}</label><input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} className="w-full rounded-lg border p-3" autoComplete="new-password" /></div>
        <div><label className="mb-2 block">Perfil</label><select value={perfil} onChange={(event) => setPerfil(event.target.value as PerfilUsuario)} className="w-full rounded-lg border p-3"><option value="DESENVOLVEDOR">Desenvolvedor</option><option value="GERENCIAL">Gerencial</option><option value="OPERADOR">Operador</option></select></div>
        <div className="md:col-span-2"><label className="mb-2 block">E-mail de autenticação (opcional)</label><input type="email" value={emailAutenticacao} onChange={(event) => setEmailAutenticacao(event.target.value)} placeholder={usuarioInicial ? "Informe somente para alterar o e-mail atual" : "Se vazio, será criado um e-mail interno"} className="w-full rounded-lg border p-3" /><p className="mt-1 text-sm text-gray-500">O usuário continuará entrando pelo campo “Usuário”, não por este e-mail.</p></div>
        <label className="flex items-center gap-2 md:col-span-2"><input type="checkbox" checked={ativo} onChange={(event) => setAtivo(event.target.checked)} />Usuário ativo</label>
      </div>
      <div className="mt-8 flex gap-3"><button type="button" onClick={salvar} className="rounded-lg bg-blue-700 px-5 py-3 text-white hover:bg-blue-800">Salvar</button><button type="button" onClick={onCancelar} className="rounded-lg bg-gray-500 px-5 py-3 text-white hover:bg-gray-600">Cancelar</button></div>
    </div>
  );
}


import { supabase } from "./supabase";

import type { Usuario } from "../types/usuario";

async function executarAcao(action: string, dados: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke("gerenciar-usuarios", {
    body: { action, ...dados },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);

  return data;
}

export async function buscarUsuarios(): Promise<Usuario[]> {
  const { data, error } = await supabase
    .from("usuarios")
    .select("id, auth_user_id, nome, login, perfil, ativo")
    .order("nome");

  if (error) throw error;

  return (data ?? []) as Usuario[];
}

export async function inserirUsuario(usuario: Usuario) {
  if (!usuario.senha) throw new Error("Informe a senha do novo usuário.");
  await executarAcao("create", { ...usuario });
}

export async function atualizarUsuario(id: number, usuario: Usuario) {
  await executarAcao("update", { ...usuario, id });
}

export async function alterarStatusUsuario(id: number, ativo: boolean) {
  await executarAcao("status", { id, ativo });
}

export async function migrarUsuariosLegados() {
  return executarAcao("migrate_legacy");
}


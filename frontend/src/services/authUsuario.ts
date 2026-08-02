import { supabase } from "./supabase";

import type { UsuarioLogado } from "../types/usuario";

export async function buscarUsuarioAutenticado(): Promise<UsuarioLogado | null> {
  const {
    data: { user },
    error: erroAuth,
  } = await supabase.auth.getUser();

  if (erroAuth || !user) return null;

  const { data, error } = await supabase
    .from("usuarios")
    .select("id, auth_user_id, nome, login, perfil, ativo")
    .eq("auth_user_id", user.id)
    .maybeSingle();

  if (error) throw error;
  if (!data || !data.ativo || !data.auth_user_id) return null;

  return data as UsuarioLogado;
}

export async function entrarComUsuario(login: string, senha: string) {
  const { data, error } = await supabase.functions.invoke("autenticar-usuario", {
    body: { login: login.trim(), senha },
  });

  if (error || data?.error || !data?.session?.access_token || !data?.session?.refresh_token) {
    throw new Error(data?.error || "Usuário ou senha inválidos.");
  }

  const { error: erroSessao } = await supabase.auth.setSession({
    access_token: data.session.access_token,
    refresh_token: data.session.refresh_token,
  });

  if (erroSessao) throw erroSessao;

  const usuario = await buscarUsuarioAutenticado();
  if (!usuario) {
    await supabase.auth.signOut();
    throw new Error("Usuário inativo ou sem perfil de acesso.");
  }

  return usuario;
}

export async function sairDoSistema() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}


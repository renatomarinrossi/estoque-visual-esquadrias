import { supabase } from "./supabase";

import type { UsuarioLogado } from "../types/usuario";

const DOMINIO_INTERNO = "usuarios.visual-esquadrias.local";

function emailInternoDoLogin(login: string) {
  const identificador = login
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!identificador) throw new Error("Usuário inválido.");

  return `${identificador}@${DOMINIO_INTERNO}`;
}

export async function buscarUsuarioAutenticado(): Promise<UsuarioLogado | null> {
  const { data: { user }, error: erroAuth } = await supabase.auth.getUser();
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
  const { error } = await supabase.auth.signInWithPassword({
    email: emailInternoDoLogin(login),
    password: senha,
  });

  if (error) throw new Error("Usuário ou senha inválidos.");

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


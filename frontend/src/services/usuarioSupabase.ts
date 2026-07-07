import { supabase } from "./supabase";

import type { Usuario } from "../types/usuario";

export async function buscarUsuarios() {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .order("nome");

  if (error) {
    console.error(error);
    return [];
  }

  return data;
}

export async function autenticarUsuario(
  login: string,
  senha: string
) {
  const { data, error } = await supabase
    .from("usuarios")
    .select("*")
    .eq("login", login)
    .eq("senha", senha)
    .eq("ativo", true)
    .single();

  if (error) {
    return null;
  }

  return data;
}

export async function inserirUsuario(
  usuario: Usuario
) {
  const { error } = await supabase
    .from("usuarios")
    .insert({
      nome: usuario.nome,
      login: usuario.login,
      senha: usuario.senha,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    });

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function atualizarUsuario(
  id: number,
  usuario: Usuario
) {
  const { error } = await supabase
    .from("usuarios")
    .update({
      nome: usuario.nome,
      login: usuario.login,
      senha: usuario.senha,
      perfil: usuario.perfil,
      ativo: usuario.ativo,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}

export async function alterarStatusUsuario(
  id: number,
  ativo: boolean
) {
  const { error } = await supabase
    .from("usuarios")
    .update({
      ativo,
    })
    .eq("id", id);

  if (error) {
    console.error(error);
    throw error;
  }
}

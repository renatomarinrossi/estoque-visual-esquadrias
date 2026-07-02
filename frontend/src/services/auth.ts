import { supabase } from "./supabase";

export async function login(
  email: string,
  senha: string
) {
  const { data, error } =
    await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

  if (error) {
    throw error;
  }

  return data;
}

export async function logout() {
  await supabase.auth.signOut();
}

export async function usuarioAtual() {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session;
}

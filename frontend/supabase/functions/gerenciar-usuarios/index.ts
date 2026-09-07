import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { prepararCors } from "../_shared/cors.ts";

const dominioInterno = "usuarios.visual-esquadrias.local";

function emailInternoDoLogin(login: string) {
  const identificador = login
    .trim()
    .toLocaleLowerCase("pt-BR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

  if (!identificador) throw new Error("Usuário inválido.");

  return `${identificador}@${dominioInterno}`;
}

function emailValido(email: unknown) {
  return typeof email === "string" && /^\S+@\S+\.\S+$/.test(email.trim());
}



Deno.serve(async (request) => {
  const corsHeaders = prepararCors(request.headers.get("Origin"));
  if (!corsHeaders) return new Response("Origem não permitida.", {status:403});
  function resposta(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authorization = request.headers.get("Authorization");

    if (!authorization) return resposta({ error: "Não autenticado." }, 401);

    const clienteAutenticado = createClient(url, anonKey, {
      global: { headers: { Authorization: authorization } },
    });
    const {
      data: { user: solicitante },
      error: erroSolicitante,
    } = await clienteAutenticado.auth.getUser();

    if (erroSolicitante || !solicitante) {
      return resposta({ error: "Não autenticado." }, 401);
    }

    const admin = createClient(url, serviceRoleKey);
    const { data: perfilSolicitante, error: erroPerfil } = await admin
      .from("usuarios")
      .select("perfil, ativo")
      .eq("auth_user_id", solicitante.id)
      .single();

    if (
      erroPerfil ||
      !perfilSolicitante?.ativo ||
      perfilSolicitante.perfil !== "DESENVOLVEDOR"
    ) {
      return resposta({ error: "Apenas desenvolvedores podem administrar usuários." }, 403);
    }

    const body = await request.json();
    const action = body.action as string;

    if (action === "create") {
      const { nome, login, senha, perfil, ativo, email_autenticacao } = body;

      if (!nome || !login || !senha || !perfil) {
        throw new Error("Dados obrigatórios ausentes.");
      }
      if (email_autenticacao && !emailValido(email_autenticacao)) {
        throw new Error("E-mail de autenticação inválido.");
      }

      const { data: authCriado, error: erroAuth } = await admin.auth.admin.createUser({
        email: email_autenticacao?.trim().toLowerCase() || emailInternoDoLogin(login),
        password: senha,
        email_confirm: true,
        ban_duration: ativo ? "none" : "876000h",
      });

      if (erroAuth || !authCriado.user) {
        throw erroAuth ?? new Error("Não foi possível criar a autenticação.");
      }

      const { error: erroPerfilNovo } = await admin.from("usuarios").insert({
        auth_user_id: authCriado.user.id,
        nome,
        login,
        senha: null,
        perfil,
        ativo,
      });

      if (erroPerfilNovo) {
        await admin.auth.admin.deleteUser(authCriado.user.id);
        throw erroPerfilNovo;
      }

      return resposta({ success: true });
    }

    if (action === "update") {
      const { id, nome, login, senha, perfil, ativo, email_autenticacao } = body;

      if (email_autenticacao && !emailValido(email_autenticacao)) {
        throw new Error("E-mail de autenticação inválido.");
      }

      const { data: usuario, error: erroUsuario } = await admin
        .from("usuarios")
        .select("auth_user_id")
        .eq("id", id)
        .single();

      if (erroUsuario || !usuario?.auth_user_id) {
        throw new Error("Usuário não possui autenticação vinculada.");
      }

      const atualizacaoAuth: {
        email?: string;
        password?: string;
        ban_duration?: string;
      } = { ban_duration: ativo ? "none" : "876000h" };

      if (email_autenticacao) {
        atualizacaoAuth.email = email_autenticacao.trim().toLowerCase();
      }
      if (senha) atualizacaoAuth.password = senha;

      const { error: erroAuth } = await admin.auth.admin.updateUserById(
        usuario.auth_user_id,
        atualizacaoAuth
      );
      if (erroAuth) throw erroAuth;

      const { error: erroAtualizarPerfil } = await admin
        .from("usuarios")
        .update({ nome, login, perfil, ativo, senha: null })
        .eq("id", id);
      if (erroAtualizarPerfil) throw erroAtualizarPerfil;

      return resposta({ success: true });
    }

    if (action === "status") {
      const { id, ativo } = body;
      const { data: usuario, error: erroUsuario } = await admin
        .from("usuarios")
        .select("auth_user_id")
        .eq("id", id)
        .single();

      if (erroUsuario || !usuario?.auth_user_id) {
        throw new Error("Usuário não possui autenticação vinculada.");
      }

      const { error: erroAuth } = await admin.auth.admin.updateUserById(
        usuario.auth_user_id,
        { ban_duration: ativo ? "none" : "876000h" }
      );
      if (erroAuth) throw erroAuth;

      const { error } = await admin.from("usuarios").update({ ativo }).eq("id", id);
      if (error) throw error;

      return resposta({ success: true });
    }

    if (action === "migrate_legacy") {
      const { data: usuarios, error: erroUsuarios } = await admin
        .from("usuarios")
        .select("id, login, senha")
        .is("auth_user_id", null);
      if (erroUsuarios) throw erroUsuarios;

      let migrados = 0;

      for (const usuario of usuarios ?? []) {
        if (!usuario.senha) {
          throw new Error(`O usuário ${usuario.login} não possui senha para migração.`);
        }

        const { data: authCriado, error: erroAuth } = await admin.auth.admin.createUser({
          email: emailInternoDoLogin(usuario.login),
          password: usuario.senha,
          email_confirm: true,
        });

        if (erroAuth || !authCriado.user) {
          throw new Error(`Falha ao migrar ${usuario.login}: ${erroAuth?.message}`);
        }

        const { error: erroAtualizar } = await admin
          .from("usuarios")
          .update({ auth_user_id: authCriado.user.id, senha: null })
          .eq("id", usuario.id);
        if (erroAtualizar) throw erroAtualizar;

        migrados += 1;
      }

      return resposta({ success: true, migrados });
    }

    return resposta({ error: "Ação inválida." }, 400);
  } catch (erro) {
    console.error(erro);
    return resposta({ error: erro instanceof Error ? erro.message : "Erro interno." }, 400);
  }
});


import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function resposta(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    if (request.method !== "POST") {
      return resposta({ error: "Método não permitido." }, 405);
    }

    const { login, senha } = await request.json();

    if (typeof login !== "string" || typeof senha !== "string" || !login.trim() || !senha) {
      return resposta({ error: "Usuário ou senha inválidos." }, 401);
    }

    const url = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const admin = createClient(url, serviceRoleKey);

    const { data: perfil, error: erroPerfil } = await admin
      .from("usuarios")
      .select("auth_user_id, ativo")
      .eq("login", login.trim())
      .maybeSingle();

    if (erroPerfil || !perfil?.ativo || !perfil.auth_user_id) {
      return resposta({ error: "Usuário ou senha inválidos." }, 401);
    }

    const { data: authData, error: erroAuth } = await admin.auth.admin.getUserById(
      perfil.auth_user_id
    );
    const email = authData.user?.email;

    if (erroAuth || !email) {
      return resposta({ error: "Usuário ou senha inválidos." }, 401);
    }

    const clienteAuth = createClient(url, anonKey);
    const { data: sessao, error: erroSenha } = await clienteAuth.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (erroSenha || !sessao.session) {
      return resposta({ error: "Usuário ou senha inválidos." }, 401);
    }

    return resposta({ session: sessao.session });
  } catch (erro) {
    console.error(erro);
    return resposta({ error: "Não foi possível iniciar a sessão." }, 400);
  }
});


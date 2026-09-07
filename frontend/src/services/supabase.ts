import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  "https://ukakbfidmmtkntbftsda.supabase.co";
const supabaseKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  "sb_publishable_Qx9P1m8N_AAzCcvExmxtyQ__Qw6tIxH";

if (
  window.location.hostname === "demo.visualesquadrias.com" &&
  new URL(supabaseUrl).hostname !== "jnaojtkggsedzauizxgh.supabase.co"
) {
  throw new Error("A demonstração exige a configuração do seu banco isolado.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Mantém a sessão durante o uso da aba, mas a remove ao fechá-la.
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});

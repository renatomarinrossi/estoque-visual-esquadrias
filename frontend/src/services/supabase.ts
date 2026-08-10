import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://ukakbfidmmtkntbftsda.supabase.co";
const supabaseKey = "sb_publishable_Qx9P1m8N_AAzCcvExmxtyQ__Qw6tIxH";

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Mantém a sessão durante o uso da aba, mas a remove ao fechá-la.
    storage: window.sessionStorage,
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
  },
});


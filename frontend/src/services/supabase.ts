import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  "https://ukakbfidmmtkntbftsda.supabase.co";

const supabaseKey =
  "sb_publishable_Qx9P1m8N_AAzCcvExmxtyQ__Qw6tIxH";

export const supabase = createClient(
  supabaseUrl,
  supabaseKey
);

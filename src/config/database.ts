import { createClient } from "@supabase/supabase-js";
import { ENV } from "./env";

export const supabaseDB = createClient(ENV.SUPABASE_URL, ENV.SUPABASE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

export const supabaseServiceRol = createClient(
  ENV.SUPABASE_URL,
  ENV.SERVICE_ROL,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);

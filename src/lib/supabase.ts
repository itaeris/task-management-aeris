import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in .env`);
  return value;
}

export function createSupabaseAdmin(): SupabaseClient {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const secret = required("SUPABASE_SECRET_KEY");
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { apikey: secret } },
  });
}

const globalForSupabase = globalThis as unknown as { supabaseAdmin?: SupabaseClient };

export const supabase =
  globalForSupabase.supabaseAdmin ?? createSupabaseAdmin();

if (process.env.NODE_ENV !== "production") {
  globalForSupabase.supabaseAdmin = supabase;
}

export function unwrap<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

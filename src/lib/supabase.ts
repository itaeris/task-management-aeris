import dns from "node:dns";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

if (typeof dns.setDefaultResultOrder === "function") {
  dns.setDefaultResultOrder("ipv4first");
}

function required(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set in .env`);
  return value;
}

const MAX_CONCURRENT = 4;
let activeFetches = 0;
const fetchQueue: Array<() => void> = [];

function acquireFetch() {
  if (activeFetches < MAX_CONCURRENT) {
    activeFetches += 1;
    return Promise.resolve();
  }
  return new Promise<void>((resolve) => fetchQueue.push(resolve));
}

function releaseFetch() {
  const next = fetchQueue.shift();
  if (next) next();
  else activeFetches = Math.max(0, activeFetches - 1);
}

function isRetryableFetch(error: unknown) {
  if (!(error instanceof Error)) return false;
  if (error.name === "AbortError") return false;
  return /fetch failed|network|econnreset|etimedout|enotfound/i.test(error.message);
}

async function supabaseFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  await acquireFetch();
  try {
    try {
      return await fetch(input, { ...init, cache: "no-store" });
    } catch (error) {
      if (!isRetryableFetch(error)) throw error;
      return await fetch(input, { ...init, cache: "no-store" });
    }
  } finally {
    releaseFetch();
  }
}

export function createSupabaseAdmin(): SupabaseClient {
  const url = required("NEXT_PUBLIC_SUPABASE_URL");
  const secret = required("SUPABASE_SECRET_KEY");
  return createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: supabaseFetch, headers: { apikey: secret } },
  });
}

const globalForSupabase = globalThis as unknown as {
  supabaseAdmin?: SupabaseClient;
  supabaseFetchVersion?: number;
};

const FETCH_CLIENT_VERSION = 5;

export const supabase = (() => {
  if (globalForSupabase.supabaseFetchVersion !== FETCH_CLIENT_VERSION || !globalForSupabase.supabaseAdmin) {
    globalForSupabase.supabaseAdmin = createSupabaseAdmin();
    globalForSupabase.supabaseFetchVersion = FETCH_CLIENT_VERSION;
  }
  return globalForSupabase.supabaseAdmin;
})();

export function unwrap<T>(result: { data: T; error: { message: string } | null }) {
  if (result.error) throw new Error(result.error.message);
  return result.data;
}

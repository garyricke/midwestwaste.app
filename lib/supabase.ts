import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase client using the service role key.
// NEVER import this into a client component — the service role key bypasses RLS.
//
// Lazily instantiated: `createClient` throws on an empty URL, so we defer
// creation until first use. This lets `next build` collect page data without
// env vars present (they're injected in the deploy target at runtime).
let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    throw new Error(
      "Supabase env not configured: set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY."
    );
  }
  client = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}

// Proxy so callers can keep using `supabaseAdmin.from(...)` while creation
// stays lazy.
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    const value = c[prop as keyof SupabaseClient];
    return typeof value === "function" ? value.bind(c) : value;
  },
});

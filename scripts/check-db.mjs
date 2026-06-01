// Quick connectivity check. Run: node --env-file=.env.local scripts/check-db.mjs
// Prints only counts/names — never secrets.
import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !key) {
  console.error("Missing env: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false } });

const sizes = await sb.from("dumpster_sizes").select("size").eq("active", true);
const haulers = await sb.from("haulers").select("name").eq("active", true);

if (sizes.error || haulers.error) {
  console.error("Query error:", sizes.error?.message || haulers.error?.message);
  process.exit(1);
}

console.log(`✓ Connected to Supabase`);
console.log(`✓ Dumpster sizes: ${sizes.data.length}`);
console.log(`✓ Active haulers: ${haulers.data.length}`);
console.log(`  ${haulers.data.map((h) => h.name).join(", ")}`);

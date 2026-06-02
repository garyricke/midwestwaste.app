// Set real dumpster prices + seed the hidden $1 smoke-test product.
// Run: node --env-file=.env.local scripts/set-prices.mjs
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const ROWS = [
  { size: "10yd", label: "10 Yard", description: "Small cleanouts, a single room, or a modest yard project.", price_cents: 37500, sort_order: 1, active: true },
  { size: "15yd", label: "15 Yard", description: "The sweet spot — garage cleanout or a small remodel.", price_cents: 42500, sort_order: 2, active: true },
  { size: "20yd", label: "20 Yard", description: "Roofing tear-offs and larger renovation debris.", price_cents: 45000, sort_order: 3, active: true },
  { size: "30yd", label: "30 Yard", description: "Full attic + garage, estate cleanouts, big builds.", price_cents: 52500, sort_order: 4, active: true },
  { size: "smoke-test", label: "Smoke Test ($1)", description: "Internal live-mode payment test — keep inactive in production.", price_cents: 100, sort_order: 99, active: false },
];

const { error } = await sb.from("dumpster_sizes").upsert(ROWS, { onConflict: "size" });
if (error) { console.error("Upsert failed:", error.message); process.exit(1); }

const { data } = await sb
  .from("dumpster_sizes")
  .select("size,price_cents,active")
  .order("sort_order");
console.log("Prices now:");
for (const r of data) console.log(`  ${r.size.padEnd(11)} $${(r.price_cents / 100).toFixed(2)}  ${r.active ? "active" : "(hidden)"}`);

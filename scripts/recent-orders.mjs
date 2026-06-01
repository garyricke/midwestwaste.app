// Show the N most recent orders + matched hauler. Prints no secrets.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const N = Number(process.argv[2] || 5);
const { data: orders, error } = await sb
  .from("orders")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(N);

if (error) {
  console.error("Query error:", error.message);
  process.exit(1);
}

const haulerIds = [...new Set(orders.map((o) => o.assigned_hauler_id).filter(Boolean))];
const names = {};
if (haulerIds.length) {
  const { data: hs } = await sb.from("haulers").select("id,name").in("id", haulerIds);
  for (const h of hs ?? []) names[h.id] = h.name;
}

for (const o of orders) {
  const hauler = o.assigned_hauler_id ? names[o.assigned_hauler_id] : "(none)";
  const dist = o.distance_miles != null ? `${o.distance_miles.toFixed(1)}mi` : "-";
  console.log(
    `${o.created_at.slice(11, 19)}  ${o.status.padEnd(24)}  ${o.dumpster_size.padEnd(5)} $${(o.amount_cents / 100).toFixed(2)}  ${(o.delivery_city ?? "?") + " " + o.delivery_zip}`.padEnd(70) +
      `  → ${hauler} (${dist})`
  );
}

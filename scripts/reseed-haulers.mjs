// Reseed haulers with the real IL Fox Valley companies (fake contacts).
// Clears throwaway test orders + old WI haulers first. Run:
//   node --env-file=.env.local scripts/reseed-haulers.mjs
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const HAULERS = [
  ["Dan's Hauling Company", "fake+danshauling@midwestwaste.app", "630-555-0101", "Batavia", "IL", "60510", 41.8482, -88.3098, 30],
  ["DDT Dumpster Rentals", "fake+ddt@midwestwaste.app", "630-555-0102", "St. Charles", "IL", "60174", 41.9194, -88.307, 30],
  ["Roadrunner Roll-Offs", "fake+roadrunner@midwestwaste.app", "630-555-0103", "St. Charles", "IL", "60174", 41.9194, -88.307, 30],
  ["Fox Valley Dumpster Rentals LLC", "fake+foxvalley@midwestwaste.app", "630-555-0104", "Yorkville", "IL", "60560", 41.6387, -88.4438, 25],
  ["Dumpster Rental Pros of Aurora", "fake+aurorapros@midwestwaste.app", "630-555-0105", "Aurora", "IL", "60505", 41.7582, -88.2971, 25],
  ["Junk Nurse", "fake+junknurse@midwestwaste.app", "630-555-0106", "Aurora", "IL", "60506", 41.7664, -88.3446, 25],
].map((r) => ({
  name: r[0], contact_email: r[1], contact_phone: r[2], address: null,
  city: r[3], state: r[4], zip: r[5], latitude: r[6], longitude: r[7],
  service_radius_miles: r[8], active: true,
}));

const NONE = "00000000-0000-0000-0000-000000000000";

// 1. Clear test orders (reference haulers via FK), then webhook events, then haulers.
const delOrders = await sb.from("orders").delete().neq("id", NONE);
const delEvents = await sb.from("webhook_events").delete().neq("stripe_event_id", "");
const delHaulers = await sb.from("haulers").delete().neq("id", NONE);
for (const [label, res] of [["orders", delOrders], ["webhook_events", delEvents], ["haulers", delHaulers]]) {
  if (res.error) { console.error(`Delete ${label} failed:`, res.error.message); process.exit(1); }
}
console.log("Cleared test orders, webhook events, and old haulers.");

// 2. Insert the real IL haulers.
const ins = await sb.from("haulers").insert(HAULERS).select("name,city,state,zip");
if (ins.error) { console.error("Insert failed:", ins.error.message); process.exit(1); }
console.log(`Inserted ${ins.data.length} IL Fox Valley haulers:`);
for (const h of ins.data) console.log(`  ${h.name} — ${h.city}, ${h.state} ${h.zip}`);

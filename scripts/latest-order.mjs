// Show the most recent order + its matched hauler. Prints no secrets.
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
);

const { data: orders, error } = await sb
  .from("orders")
  .select("*")
  .order("created_at", { ascending: false })
  .limit(1);

if (error) {
  console.error("Query error:", error.message);
  process.exit(1);
}
if (!orders.length) {
  console.log("No orders found yet.");
  process.exit(0);
}

const o = orders[0];
let haulerName = "(none)";
if (o.assigned_hauler_id) {
  const { data: h } = await sb
    .from("haulers")
    .select("name")
    .eq("id", o.assigned_hauler_id)
    .maybeSingle();
  haulerName = h?.name ?? "(unknown)";
}

console.log("=== Most recent order ===");
console.log("Status:        ", o.status);
console.log("Size / amount: ", o.dumpster_size, "/ $" + (o.amount_cents / 100).toFixed(2));
console.log("Customer:      ", o.customer_name, "<" + o.customer_email + ">");
console.log("Deliver to:    ", `${o.delivery_address}, ${o.delivery_city} ${o.delivery_state} ${o.delivery_zip}`);
console.log("Geocoded:      ", o.delivery_latitude, o.delivery_longitude);
console.log("Matched hauler:", haulerName, o.distance_miles != null ? `(${o.distance_miles.toFixed(1)} mi)` : "");
console.log("Stripe PI:     ", o.stripe_payment_intent ?? "(none)");
console.log("Created:       ", o.created_at);

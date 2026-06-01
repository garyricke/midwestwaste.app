import { Resend } from "resend";
import type { Hauler, Order } from "./types";

// Lazily instantiated: `new Resend("")` throws on a missing key. Deferring
// creation keeps `next build` page-data collection working without env vars.
let _resend: Resend | null = null;
function resendClient(): Resend {
  if (_resend) return _resend;
  const key = process.env.RESEND_API_KEY;
  if (!key) throw new Error("Resend env not configured: set RESEND_API_KEY.");
  _resend = new Resend(key);
  return _resend;
}

const FROM = process.env.EMAIL_FROM ?? "Midwest Waste <orders@midwestwaste.app>";
// During testing, all hauler notifications route here instead of the (fake)
// hauler address. Remove/blank this env var once real haulers are loaded.
const NOTIFY_OVERRIDE = process.env.HAULER_NOTIFY_OVERRIDE || "";
// Admin gets the "no local hauler" alerts.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || NOTIFY_OVERRIDE;

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function orderLines(order: Order): string {
  const date = order.requested_delivery_date || "not specified";
  return [
    `Size:            ${order.dumpster_size}`,
    `Amount paid:     ${dollars(order.amount_cents)}`,
    `Requested date:  ${date}`,
    ``,
    `Deliver to:`,
    `  ${order.delivery_address}`,
    `  ${order.delivery_city ?? ""}, ${order.delivery_state ?? ""} ${order.delivery_zip}`,
    ``,
    `Customer:`,
    `  ${order.customer_name}`,
    `  ${order.customer_email}`,
    `  ${order.customer_phone ?? "no phone"}`,
    order.notes ? `\nNotes: ${order.notes}` : "",
    ``,
    `Order ID: ${order.id}`,
  ].join("\n");
}

/** Notify the assigned hauler of a new paid order. */
export async function sendHaulerAssignment(
  order: Order,
  hauler: Hauler,
  distanceMiles: number
): Promise<void> {
  const to = NOTIFY_OVERRIDE || hauler.contact_email;
  const overrideNote = NOTIFY_OVERRIDE
    ? `\n[TEST MODE] This would normally go to ${hauler.contact_email}\n`
    : "";

  await resendClient().emails.send({
    from: FROM,
    to,
    subject: `New dumpster order — ${order.dumpster_size} for ${order.delivery_city ?? order.delivery_zip}`,
    text:
      `You've been matched to a new paid order.\n` +
      overrideNote +
      `\nAssigned hauler: ${hauler.name} (${distanceMiles.toFixed(1)} mi away)\n\n` +
      orderLines(order),
  });
}

/** Alert MWC admin when a paid order has no hauler in range (nationwide gap). */
export async function sendNoHaulerAlert(
  order: Order,
  nearest: { hauler: Hauler; distanceMiles: number } | null
): Promise<void> {
  if (!ADMIN_EMAIL) return;
  const nearestNote = nearest
    ? `Nearest hauler is ${nearest.hauler.name} at ${nearest.distanceMiles.toFixed(1)} mi (outside their service radius).`
    : `No haulers in the database at all.`;

  await resendClient().emails.send({
    from: FROM,
    to: ADMIN_EMAIL,
    subject: `⚠️ PAID ORDER, no hauler in range — ${order.delivery_zip}`,
    text:
      `A customer paid but no hauler covers their area. Source/recruit a hauler or refund.\n\n` +
      `${nearestNote}\n\n` +
      orderLines(order),
  });
}

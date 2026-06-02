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
// Hauler/dispatch notifications send from a distinct address.
const HAULER_FROM =
  process.env.HAULER_EMAIL_FROM ?? "Midwest Waste Dispatch <dispatch@midwestwaste.app>";
// Logo hosted on Cloudinary (CDN, gate-independent, reliable in email clients).
const LOGO_URL =
  "https://res.cloudinary.com/dsbllwpbh/image/upload/f_auto,q_auto,w_240/midwest-waste/brand/gon3rlvealzj9egcrdcn";
// During testing, hauler notifications route here instead of the (fake) hauler
// address. Blank this out once real haulers are loaded.
const NOTIFY_OVERRIDE = process.env.HAULER_NOTIFY_OVERRIDE || "";
// Admin gets the "no local hauler" alerts; also used as customer reply-to.
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || NOTIFY_OVERRIDE;

function dollars(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function esc(s: string | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ---- Branded HTML shell -----------------------------------------------------

function layout(preheader: string, heading: string, bodyHtml: string): string {
  return `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f7f8fa;font-family:Arial,Helvetica,sans-serif;color:#142849;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${esc(preheader)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f8fa;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:14px;overflow:hidden;box-shadow:0 1px 4px rgba(20,40,73,0.08);">
        <tr><td style="background:#ffffff;padding:24px 22px 20px;text-align:center;border-bottom:3px solid #FF8200;">
          <img src="${LOGO_URL}" alt="Midwest Waste — Dumpster Rental" width="120" height="120" style="display:inline-block;border:0;border-radius:10px;" />
        </td></tr>
        <tr><td style="padding:28px 28px 8px;">
          <h1 style="margin:0 0 14px;font-size:20px;line-height:1.3;color:#1B365D;">${esc(heading)}</h1>
          ${bodyHtml}
        </td></tr>
        <tr><td style="padding:18px 28px 26px;color:#8a93a3;font-size:12px;line-height:1.6;border-top:1px solid #eef0f4;">
          <strong style="color:#1B365D;">Midwest Waste</strong> · Dumpster Rental<br/>
          Family-owned · 30 years strong · Sugar Grove &amp; Aurora, IL<br/>
          <a href="tel:+16308008549" style="color:#1B365D;font-weight:700;text-decoration:none;">(630) 800-8549</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function detailTable(rows: [string, string][]): string {
  const trs = rows
    .filter(([, v]) => v && v.trim() !== "")
    .map(
      ([label, value]) =>
        `<tr>
          <td style="padding:7px 0;color:#8a93a3;font-size:13px;width:140px;vertical-align:top;">${esc(label)}</td>
          <td style="padding:7px 0;color:#142849;font-size:14px;font-weight:600;">${esc(value)}</td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="margin:6px 0 4px;">${trs}</table>`;
}

function p(text: string): string {
  return `<p style="margin:0 0 14px;font-size:15px;line-height:1.55;color:#3a4252;">${text}</p>`;
}

function deliveryBlock(order: Order): string {
  const cityLine = [order.delivery_city, order.delivery_state].filter(Boolean).join(", ");
  return `${esc(order.delivery_address)}, ${esc(cityLine)} ${esc(order.delivery_zip)}`;
}

// ---- Hauler assignment ------------------------------------------------------

export async function sendHaulerAssignment(
  order: Order,
  hauler: Hauler,
  distanceMiles: number
): Promise<void> {
  const to = NOTIFY_OVERRIDE || hauler.contact_email;
  const overrideNote = NOTIFY_OVERRIDE
    ? p(
        `<span style="color:#e07300;font-weight:700;">[TEST MODE]</span> This would normally be sent to ${esc(hauler.contact_email)}.`
      )
    : "";

  const body =
    p(`You've been matched to a new <strong>paid</strong> dumpster order — ${esc(hauler.name)}, about ${distanceMiles.toFixed(1)} miles away.`) +
    overrideNote +
    detailTable([
      ["Dumpster size", order.dumpster_size],
      ["Amount paid", dollars(order.amount_cents)],
      ["Requested date", order.requested_delivery_date || "Coordinate with customer"],
      ["Deliver to", deliveryBlock(order)],
      ["Customer", order.customer_name],
      ["Email", order.customer_email],
      ["Phone", order.customer_phone || ""],
      ["Notes", order.notes || ""],
      ["Order ID", order.id],
    ]);

  await resendClient().emails.send({
    from: HAULER_FROM,
    to,
    subject: `New dumpster order — ${order.dumpster_size} for ${order.delivery_city ?? order.delivery_zip}`,
    html: layout("You've been matched to a new paid order.", "New order assigned to you", body),
    text:
      `You've been matched to a new paid order (${hauler.name}, ${distanceMiles.toFixed(1)} mi).\n\n` +
      `Size: ${order.dumpster_size}\nAmount: ${dollars(order.amount_cents)}\n` +
      `Requested date: ${order.requested_delivery_date || "coordinate with customer"}\n` +
      `Deliver to: ${order.delivery_address}, ${order.delivery_city ?? ""} ${order.delivery_state ?? ""} ${order.delivery_zip}\n` +
      `Customer: ${order.customer_name} · ${order.customer_email} · ${order.customer_phone ?? "no phone"}\n` +
      (order.notes ? `Notes: ${order.notes}\n` : "") +
      `Order ID: ${order.id}`,
  });
}

// ---- Customer confirmation --------------------------------------------------

export async function sendCustomerConfirmation(order: Order): Promise<void> {
  const body =
    p(`Thanks, ${esc(order.customer_name)} — your order is confirmed and your payment went through. 🐻`) +
    p(`We're lining up a trusted local hauler in your area. They'll reach out to schedule your drop-off. No phone tag, no quotes to chase.`) +
    detailTable([
      ["Order #", order.id.slice(0, 8)],
      ["Dumpster size", order.dumpster_size],
      ["Amount paid", dollars(order.amount_cents)],
      ["Deliver to", deliveryBlock(order)],
      ["Requested date", order.requested_delivery_date || "We'll coordinate with you"],
    ]) +
    p(`<span style="color:#8a93a3;font-size:13px;">Questions? Just reply to this email and a real person will help.</span>`);

  await resendClient().emails.send({
    from: FROM,
    to: order.customer_email,
    replyTo: ADMIN_EMAIL || undefined,
    subject: `Your Midwest Waste dumpster order is confirmed 🎉`,
    html: layout("Your dumpster order is confirmed and paid.", "Order confirmed!", body),
    text:
      `Thanks, ${order.customer_name} — your Midwest Waste order is confirmed and paid.\n\n` +
      `We're lining up a trusted local hauler; they'll reach out to schedule delivery.\n\n` +
      `Order #: ${order.id.slice(0, 8)}\nSize: ${order.dumpster_size}\nAmount: ${dollars(order.amount_cents)}\n` +
      `Deliver to: ${order.delivery_address}, ${order.delivery_city ?? ""} ${order.delivery_state ?? ""} ${order.delivery_zip}\n` +
      `Requested date: ${order.requested_delivery_date || "we'll coordinate with you"}\n\n` +
      `Questions? Just reply to this email.`,
  });
}

// ---- Admin: no hauler in range ----------------------------------------------

export async function sendNoHaulerAlert(
  order: Order,
  nearest: { hauler: Hauler; distanceMiles: number } | null
): Promise<void> {
  if (!ADMIN_EMAIL) return;
  const nearestNote = nearest
    ? `Nearest hauler is ${nearest.hauler.name} at ${nearest.distanceMiles.toFixed(1)} mi (outside their service radius).`
    : `No haulers in the database at all.`;

  const body =
    p(`A customer <strong>paid</strong> but no hauler covers their area. Source/recruit a hauler or refund.`) +
    p(`<span style="color:#8a93a3;">${esc(nearestNote)}</span>`) +
    detailTable([
      ["Dumpster size", order.dumpster_size],
      ["Amount paid", dollars(order.amount_cents)],
      ["Deliver to", deliveryBlock(order)],
      ["Customer", order.customer_name],
      ["Email", order.customer_email],
      ["Phone", order.customer_phone || ""],
      ["Order ID", order.id],
    ]);

  await resendClient().emails.send({
    from: HAULER_FROM,
    to: ADMIN_EMAIL,
    subject: `⚠️ PAID ORDER, no hauler in range — ${order.delivery_zip}`,
    html: layout("Paid order with no hauler in range.", "Needs manual assignment", body),
    text:
      `A customer paid but no hauler covers their area. Source a hauler or refund.\n\n${nearestNote}\n\n` +
      `Size: ${order.dumpster_size}\nAmount: ${dollars(order.amount_cents)}\n` +
      `Deliver to: ${order.delivery_address}, ${order.delivery_city ?? ""} ${order.delivery_state ?? ""} ${order.delivery_zip}\n` +
      `Customer: ${order.customer_name} · ${order.customer_email} · ${order.customer_phone ?? "no phone"}\n` +
      `Order ID: ${order.id}`,
  });
}

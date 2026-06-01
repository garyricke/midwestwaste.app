import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { matcher } from "@/lib/matcher";
import { sendHaulerAssignment, sendNoHaulerAlert, sendCustomerConfirmation } from "@/lib/email";
import type { Hauler, Order } from "@/lib/types";

export const runtime = "nodejs";

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET ?? "";

export async function POST(req: NextRequest) {
  const sig = req.headers.get("stripe-signature");
  const raw = await req.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(raw, sig ?? "", webhookSecret);
  } catch (err) {
    console.error("[webhook] signature verification failed", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: record the event id; bail if we've already processed it.
  const { error: dupErr } = await supabaseAdmin
    .from("webhook_events")
    .insert({ stripe_event_id: event.id });
  if (dupErr) {
    // Unique violation => already handled. Ack so Stripe stops retrying.
    return NextResponse.json({ received: true, duplicate: true });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    await fulfillOrder(session);
  }

  return NextResponse.json({ received: true });
}

async function fulfillOrder(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.order_id || session.client_reference_id;
  if (!orderId) {
    console.error("[webhook] no order_id on session", session.id);
    return;
  }

  // Mark paid + capture the payment intent.
  const { data: orderRow, error: updateErr } = await supabaseAdmin
    .from("orders")
    .update({
      status: "paid",
      stripe_payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : null,
    })
    .eq("id", orderId)
    .select("*")
    .single();

  if (updateErr || !orderRow) {
    console.error("[webhook] could not load order", orderId, updateErr);
    return;
  }
  const order = orderRow as Order;

  // Confirmation to the customer (independent of hauler matching).
  try {
    await sendCustomerConfirmation(order);
  } catch (err) {
    console.error("[webhook] customer confirmation email failed", err);
  }

  // No delivery coordinates (unknown zip) => can't match.
  if (order.delivery_latitude == null || order.delivery_longitude == null) {
    await markNeedsManual(order, null);
    return;
  }

  // Load active haulers and find the nearest.
  const { data: haulerRows } = await supabaseAdmin
    .from("haulers")
    .select("*")
    .eq("active", true);
  const haulers = (haulerRows ?? []) as Hauler[];

  const match = matcher.findNearest(
    { latitude: order.delivery_latitude, longitude: order.delivery_longitude },
    haulers
  );

  if (!match || !match.inRange) {
    // Nationwide fallback: paid, but nobody covers this area.
    await markNeedsManual(
      order,
      match ? { hauler: match.hauler, distanceMiles: match.distanceMiles } : null
    );
    return;
  }

  // Assign + notify.
  await supabaseAdmin
    .from("orders")
    .update({
      status: "notified",
      assigned_hauler_id: match.hauler.id,
      distance_miles: match.distanceMiles,
    })
    .eq("id", order.id);

  try {
    await sendHaulerAssignment(
      { ...order, assigned_hauler_id: match.hauler.id, distance_miles: match.distanceMiles, status: "notified" },
      match.hauler,
      match.distanceMiles
    );
  } catch (err) {
    console.error("[webhook] hauler email failed", err);
    // Leave order assigned; email can be retried manually.
    await supabaseAdmin
      .from("orders")
      .update({ status: "assigned" })
      .eq("id", order.id);
  }
}

async function markNeedsManual(
  order: Order,
  nearest: { hauler: Hauler; distanceMiles: number } | null
) {
  await supabaseAdmin
    .from("orders")
    .update({
      status: "needs_manual_assignment",
      assigned_hauler_id: nearest?.hauler.id ?? null,
      distance_miles: nearest?.distanceMiles ?? null,
    })
    .eq("id", order.id);

  try {
    await sendNoHaulerAlert(order, nearest);
  } catch (err) {
    console.error("[webhook] no-hauler alert failed", err);
  }
}

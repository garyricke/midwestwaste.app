import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { supabaseAdmin } from "@/lib/supabase";
import { getDumpsterSize } from "@/lib/sizes";
import { geocodeZip } from "@/lib/geocode";

export const runtime = "nodejs";

function baseUrl(req: NextRequest): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    req.headers.get("origin") ||
    `https://${req.headers.get("host")}`
  );
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const required = [
      "size",
      "delivery_address",
      "delivery_zip",
      "customer_name",
      "customer_email",
    ];
    for (const f of required) {
      if (!body[f] || String(body[f]).trim() === "") {
        return NextResponse.json(
          { error: `Missing required field: ${f}` },
          { status: 400 }
        );
      }
    }

    const size = await getDumpsterSize(String(body.size));
    if (!size) {
      return NextResponse.json(
        { error: "That dumpster size isn't available." },
        { status: 400 }
      );
    }

    // Geocode now so we store the delivery point on the order; matching happens
    // after payment in the webhook. Unknown zips are allowed through (they'll
    // route to manual assignment).
    const geo = geocodeZip(String(body.delivery_zip));

    const { data: order, error: insertError } = await supabaseAdmin
      .from("orders")
      .insert({
        status: "pending_payment",
        customer_name: String(body.customer_name).trim(),
        customer_email: String(body.customer_email).trim(),
        customer_phone: body.customer_phone ? String(body.customer_phone).trim() : null,
        delivery_address: String(body.delivery_address).trim(),
        delivery_city: body.delivery_city ? String(body.delivery_city).trim() : geo?.city ?? null,
        delivery_state: body.delivery_state ? String(body.delivery_state).trim() : geo?.state ?? null,
        delivery_zip: String(body.delivery_zip).trim().slice(0, 5),
        delivery_latitude: geo?.latitude ?? null,
        delivery_longitude: geo?.longitude ?? null,
        dumpster_size: size.size,
        amount_cents: size.price_cents,
        requested_delivery_date: body.requested_delivery_date || null,
        notes: body.notes ? String(body.notes).trim() : null,
      })
      .select("id")
      .single();

    if (insertError || !order) {
      console.error("[checkout] order insert failed", insertError);
      return NextResponse.json(
        { error: "Could not create your order. Please try again." },
        { status: 500 }
      );
    }

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: size.price_cents,
            product_data: {
              name: `Midwest Waste — ${size.label} dumpster`,
              description: size.description,
            },
          },
        },
      ],
      customer_email: String(body.customer_email).trim(),
      client_reference_id: order.id,
      metadata: { order_id: order.id },
      success_url: `${baseUrl(req)}/success?order=${order.id}`,
      cancel_url: `${baseUrl(req)}/?canceled=1`,
    });

    await supabaseAdmin
      .from("orders")
      .update({ stripe_session_id: session.id })
      .eq("id", order.id);

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] error", err);
    return NextResponse.json(
      { error: "Unexpected error creating checkout." },
      { status: 500 }
    );
  }
}

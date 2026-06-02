import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

function dollars(cents: number) {
  return `$${(cents / 100).toFixed(2)}`;
}

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderId } = await searchParams;

  let order: Order | null = null;
  if (orderId) {
    const { data } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .maybeSingle();
    order = (data as Order) ?? null;
  }

  const matched = order?.status === "assigned" || order?.status === "notified";

  return (
    <main className="flex-1">
      <header className="bg-navy text-white">
        <div className="mx-auto max-w-3xl px-5 py-4">
          <Link href="/" className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark-white.png"
              alt="Midwest Waste"
              className="h-10 w-auto"
            />
            <span className="font-display font-extrabold text-xl tracking-tight">
              MIDWEST WASTE
            </span>
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-3xl px-5 py-12">
        <div className="rounded-2xl border-2 border-orange/30 bg-white p-7">
          <h1 className="font-display font-extrabold text-2xl text-navy">
            {order ? "You're all set — payment received! 🎉" : "Payment received 🎉"}
          </h1>

          {order ? (
            <>
              <p className="mt-3 text-foreground/80">
                {matched
                  ? "We've matched you with a local hauler and sent them your order. They'll be in touch to confirm your delivery."
                  : "We've got your order and payment. We're confirming the right hauler for your area and will reach out shortly to lock in your delivery."}
              </p>

              <dl className="mt-6 grid gap-2 text-sm sm:grid-cols-2">
                <Row label="Order #" value={order.id.slice(0, 8)} />
                <Row label="Size" value={order.dumpster_size} />
                <Row label="Amount" value={dollars(order.amount_cents)} />
                <Row
                  label="Requested date"
                  value={order.requested_delivery_date || "We'll coordinate with you"}
                />
                <Row
                  label="Deliver to"
                  value={`${order.delivery_address}, ${order.delivery_city ?? ""} ${order.delivery_zip}`}
                />
              </dl>
            </>
          ) : (
            <p className="mt-3 text-foreground/80">
              Thanks for your order! A confirmation is on its way to your email.
            </p>
          )}

          <Link
            href="/"
            className="mt-7 inline-block rounded-xl bg-orange px-5 py-3 font-display font-bold text-white hover:bg-orange-deep"
          >
            Order another dumpster
          </Link>
        </div>

        <p className="mt-6 text-sm text-foreground/60">
          Family-owned · 30 years strong · Questions? Call{" "}
          <a href="tel:+16308008549" className="font-semibold text-navy hover:text-orange-deep">
            (630) 800-8549
          </a>
        </p>
      </section>
    </main>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-background px-3 py-2">
      <dt className="text-foreground/50">{label}</dt>
      <dd className="font-semibold text-navy">{value}</dd>
    </div>
  );
}

import { getDumpsterSizes } from "@/lib/sizes";
import OrderForm from "./order-form";

// Dumpster sizes are near-static config — cache the landing page and revalidate
// periodically so it serves instantly from CDN instead of a full SSR + DB hit
// (and cold start) on every visit.
export const revalidate = 600;

export default async function Home() {
  const sizes = await getDumpsterSizes();

  return (
    <main className="flex-1">
      {/* Header */}
      <header className="bg-navy text-white">
        <div className="mx-auto max-w-3xl px-5 py-4 flex items-center justify-between">
          <span className="flex items-center gap-2.5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo-mark.svg"
              alt="Midwest Waste"
              className="h-9 w-9 rounded-md ring-1 ring-white/25"
            />
            <span className="font-display font-extrabold text-xl tracking-tight">
              MIDWEST WASTE
            </span>
          </span>
          <span className="hidden sm:block text-sm text-white/70">
            Family-owned · 30 years · Talk to a human
          </span>
        </div>
      </header>

      {/* Hero */}
      <section className="bg-navy-deep text-white">
        <div className="mx-auto max-w-3xl px-5 pb-10 pt-6">
          <h1 className="font-display font-extrabold text-3xl sm:text-4xl leading-tight">
            Order a dumpster in two minutes.
          </h1>
          <p className="mt-3 text-white/80 max-w-xl">
            Pick your size, tell us where it&apos;s going, and we&apos;ll match
            you with a trusted local hauler. No phone tag, no quotes to chase.
          </p>
        </div>
      </section>

      {/* Order form */}
      <section className="mx-auto max-w-3xl px-5 py-8">
        <OrderForm sizes={sizes} />
      </section>

      <footer className="mx-auto max-w-3xl px-5 py-8 text-sm text-foreground/60">
        Family-owned · 30 years strong · Questions? Call us — a real person
        answers.
      </footer>
    </main>
  );
}

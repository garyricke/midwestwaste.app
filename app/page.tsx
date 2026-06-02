import { getDumpsterSizes } from "@/lib/sizes";
import OrderFlow from "./order-flow";

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
              src="/logo-mark-white.png"
              alt="Midwest Waste"
              className="h-10 w-auto"
            />
            <span className="font-display font-extrabold text-xl tracking-tight">
              MIDWEST WASTE
            </span>
          </span>
          <div className="flex items-center gap-4">
            <span className="hidden md:block text-sm text-white/70">
              Family-owned · 30 years
            </span>
            <a
              href="tel:+16308008549"
              className="flex items-center gap-1.5 whitespace-nowrap text-sm font-bold text-white hover:text-yellow"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" />
              </svg>
              (630) 800-8549
            </a>
          </div>
        </div>
      </header>

      {/* Hero + size selector + order form (hero swaps with selected size) */}
      <OrderFlow sizes={sizes} />

      <footer className="mx-auto max-w-3xl px-5 py-8 text-sm text-foreground/60">
        Family-owned · 30 years strong · Questions? Call{" "}
        <a href="tel:+16308008549" className="font-semibold text-navy hover:text-orange-deep">
          (630) 800-8549
        </a>{" "}
        — a real person answers.
      </footer>
    </main>
  );
}

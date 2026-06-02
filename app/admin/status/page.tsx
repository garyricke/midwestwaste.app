import { isAdmin } from "@/lib/admin-auth";
import AdminLogin from "../admin-login";
import AdminHeader from "../admin-header";

export const dynamic = "force-dynamic";

type Entry = { date: string; heading: string; items: string[] };

// Running build log — newest first. Maintained by Orbis Design.
const LOG: Entry[] = [
  {
    date: "June 2, 2026",
    heading: "Branding, content, polish & go-live prep",
    items: [
      "Verified the midwestwaste.app email domain in Resend; switched senders to orders@ (customer confirmations) and dispatch@ (hauler notifications).",
      "Branded HTML emails — customer order confirmation + hauler assignment — with the logo served from Cloudinary.",
      "Planned Cloudflare email routing so replies to orders@ fan out to Tyler, Greg, and Gary, with dispatch@ routed too.",
      "Added click-to-call (630) 800-8549 across the header, footers, and emails.",
      "Set real pricing — 10yd $375 / 15yd $425 / 20yd $450 / 30yd $525 — plus a hidden $1 smoke-test product for the live-money launch check.",
      "Adopted flat inline-SVG icon standards; rebuilt the nav mark + favicon as the bear / MW monogram.",
      "Photoreal golden-hour dumpster hero images (OpenAI scenes + the exact Midwest Waste badge), with the hero swapping by selected size and a 'truck loads' indicator.",
      "Full-bleed hero with a frosted-glass size selector; responsive hero on Cloudinary (9:16 portrait on mobile, 3:2 on desktop).",
      "Added an SEO/AI FAQ section with FAQPage structured data and richer page metadata.",
      "Built this admin: System Docs (architecture, scaling, security, Stripe handoff) and this Status log.",
      "Ran a security scan (no critical issues; recommendations logged) and a scalability review.",
    ],
  },
  {
    date: "June 1, 2026",
    heading: "Foundation — build, deploy & admin",
    items: [
      "Scoped Phase 1 and created a separate transactional repo for midwestwaste.app.",
      "Built the full ordering engine: order form → Stripe Checkout → webhook → nearest-hauler matching → email; with a nationwide no-hauler fallback.",
      "Provisioned Supabase (haulers, orders, sizes, idempotent webhook events) and seeded haulers.",
      "Wired Stripe (test mode), Resend email, and a branded password gate; deployed to GitHub + Netlify.",
      "Verified live test orders end-to-end — both an in-coverage match and the out-of-coverage manual-assignment fallback.",
      "Connected the custom domain midwestwaste.app via Cloudflare DNS → Netlify, with SSL and www→apex redirect.",
      "Admin Orders dashboard (status filters, paid revenue, manual assign/reassign) and Haulers management (add, edit, delete, deactivate, CSV import).",
      "Corrected hauler data to the Illinois Fox Valley (Aurora, Sugar Grove, Batavia, St. Charles, Yorkville).",
      "Performance + UX polish: parallelized admin queries, CDN-cached landing page, unlock-button feedback.",
    ],
  },
];

export default async function StatusPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  return (
    <main className="flex-1">
      <AdminHeader active="status" />
      <div className="mx-auto max-w-3xl px-5 py-8">
        <h1 className="font-display text-3xl font-extrabold text-navy">
          Project status
        </h1>
        <p className="mt-2 text-foreground/70">
          A running log of what&apos;s been built for midwestwaste.app, newest
          first. Next up: switch Stripe to Midwest Waste&apos;s account, load real
          haulers, and open the site to the public (see the Docs tab for the
          go-live steps).
        </p>

        <div className="mt-8 space-y-8">
          {LOG.map((entry) => (
            <section key={entry.date} className="relative border-l-2 border-orange/40 pl-5">
              <div className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full bg-orange" />
              <div className="font-display text-sm font-bold uppercase tracking-wide text-orange-deep">
                {entry.date}
              </div>
              <h2 className="font-display text-lg font-extrabold text-navy">
                {entry.heading}
              </h2>
              <ul className="mt-2 list-disc space-y-1.5 pl-5 text-foreground/85">
                {entry.items.map((item, i) => (
                  <li key={i}>{item}</li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <p className="mt-10 text-xs text-foreground/50">
          Maintained by Orbis Design · updated June 2, 2026
        </p>
      </div>
    </main>
  );
}

import { isAdmin } from "@/lib/admin-auth";
import AdminLogin from "../admin-login";
import AdminHeader from "../admin-header";

export const dynamic = "force-dynamic";

export default async function DocsPage() {
  if (!(await isAdmin())) return <AdminLogin />;

  return (
    <main className="flex-1">
      <AdminHeader active="docs" />
      <div className="mx-auto max-w-3xl px-5 py-8 leading-relaxed text-foreground/85">
        <h1 className="font-display text-3xl font-extrabold text-navy">
          System documentation
        </h1>
        <p className="mt-2 text-foreground/70">
          How midwestwaste.app is built, how an order flows, how it scales, its
          security posture, and how to hand the Stripe account over to Midwest
          Waste.
        </p>

        {/* Stripe handoff — most important, placed first */}
        <Section title="⭐ Switching Stripe to Midwest Waste's account">
          <P>
            The site currently runs on the <B>developer&apos;s</B> Stripe account
            (used to build and test the full flow). To take real payments into
            Midwest Waste&apos;s bank, the live Stripe account must be swapped to
            the client&apos;s. Here&apos;s the simple handoff — <B>steps 1–2 are
            for the client; the developer does 3–5.</B>
          </P>
          <H>For the client (Midwest Waste)</H>
          <OL>
            <li>
              <B>Create / log into your Stripe account</B> at{" "}
              <Code>dashboard.stripe.com</Code> under the Midwest Waste business,
              and connect your business bank account (Settings → Business →
              Bank accounts &amp; payouts) so payouts land with you.
            </li>
            <li>
              <B>Invite the developer to your account:</B> Settings → Team and
              security → <B>Team</B> → <B>+ New member</B> → enter{" "}
              <Code>gary.ricke@orbisdesign.com</Code> and assign the{" "}
              <B>Developer</B> role (or Administrator). The Developer role lets
              them manage API keys and webhooks — nothing about your bank or
              payouts. Send the invite.
            </li>
          </OL>
          <H>For the developer (Orbis)</H>
          <OL start={3}>
            <li>
              Accept the invite, switch into the client&apos;s account, grab their{" "}
              <B>live</B> secret key (Developers → API keys) and create the{" "}
              <B>webhook endpoint</B> (
              <Code>https://midwestwaste.app/api/webhook</Code>,{" "}
              <Code>checkout.session.completed</Code>, snapshot payload) to get
              its signing secret.
            </li>
            <li>
              In Netlify → Environment variables, replace{" "}
              <Code>STRIPE_SECRET_KEY</Code> and{" "}
              <Code>STRIPE_WEBHOOK_SECRET</Code> with the client&apos;s values,
              then redeploy.
            </li>
            <li>
              Run one live <Code>smoke-test</Code> $1 order to confirm money flows
              into the client&apos;s account, then the client can optionally remove
              the developer&apos;s team access.
            </li>
          </OL>
          <Note>
            Payouts always go to whichever account&apos;s bank is connected —
            connecting the client&apos;s bank + using the client&apos;s keys is all
            it takes. No code changes, no customer-facing changes.
          </Note>
        </Section>

        <Section title="What this system is">
          <P>
            A standalone transactional site where a customer picks a dumpster
            size, pays online, and the order is automatically routed to the
            closest qualified local hauler, who is emailed the job. It&apos;s the
            durable ordering/matching/payment engine; the storefront UI is
            intentionally simple (a richer experience can layer on later).
          </P>
        </Section>

        <Section title="Architecture">
          <Pre>{`Customer (midwestwaste.app)
   │  picks size + address, pays
   ▼
Next.js app on Netlify ── Supabase (Postgres): haulers, orders, sizes
   │
   ├─ POST /api/checkout  → create pending order → Stripe Checkout Session
   │
Stripe-hosted payment page (PCI handled by Stripe)
   │
   └─ webhook: checkout.session.completed → POST /api/webhook
            → verify signature → idempotent (dedupe on event id)
            → mark PAID → email customer confirmation
            → match nearest hauler (haversine) → email hauler (dispatch@)
            → if none in range → needs_manual_assignment + admin alert
   │
Customer → /success      Emails via Resend (orders@ / dispatch@)`}</Pre>
        </Section>

        <Section title="Tech stack">
          <UL>
            <li><B>Next.js</B> (App Router, TypeScript, Tailwind) on <B>Netlify</B></li>
            <li><B>Supabase</B> (Postgres) — haulers, orders, dumpster sizes</li>
            <li><B>Stripe Checkout</B> — payments (PCI offloaded to Stripe)</li>
            <li><B>Resend</B> — transactional email on the verified midwestwaste.app domain</li>
            <li><B>Cloudflare</B> — DNS + pre-launch password gate + inbound email routing</li>
            <li><B>Cloudinary</B> — hosts the logo used in emails</li>
          </UL>
        </Section>

        <Section title="Order lifecycle (statuses)">
          <UL>
            <li><Code>pending_payment</Code> → order created, awaiting Stripe payment</li>
            <li><Code>paid</Code> → payment confirmed by webhook</li>
            <li><Code>notified</Code> → matched to a hauler and emailed</li>
            <li><Code>assigned</Code> → matched, but the hauler email failed (retry from Orders)</li>
            <li><Code>needs_manual_assignment</Code> → paid but no hauler in range; admin sources one</li>
            <li><Code>failed</Code> → error state</li>
          </UL>
        </Section>

        <Section title="Hauler matching &amp; nationwide growth">
          <P>
            Matching is a pure function over our own database (<Code>lib/matcher.ts</Code>):
            the delivery ZIP is geocoded offline, then we pick the nearest active
            hauler within their service radius (haversine distance). Because there
            is <B>no external API call per order</B>, matching has no rate-limit or
            cost ceiling as volume grows. The interface is swappable — Google
            Distance Matrix (real driving distance) can drop in later without
            touching anything else. Orders outside coverage become{" "}
            <Code>needs_manual_assignment</Code> and alert the admin — every such
            order is a signal of where to recruit the next hauler.
          </P>
        </Section>

        <Section title="Admin tools">
          <UL>
            <li><B>Orders</B> — all orders, status filters, paid revenue, and manual assign/reassign (emails the hauler)</li>
            <li><B>Haulers</B> — add, edit, delete, deactivate, and bulk CSV import; matching uses active haulers only</li>
            <li><B>Docs</B> — this page</li>
          </UL>
          <Note>
            Admin is protected by its own password, separate from the public-launch
            site gate, so it stays locked even after the storefront opens.
          </Note>
        </Section>

        <Section title="Environment variables (names only)">
          <UL>
            <li><Code>NEXT_PUBLIC_SUPABASE_URL</Code>, <Code>SUPABASE_SERVICE_ROLE_KEY</Code></li>
            <li><Code>STRIPE_SECRET_KEY</Code>, <Code>STRIPE_WEBHOOK_SECRET</Code></li>
            <li><Code>RESEND_API_KEY</Code>, <Code>EMAIL_FROM</Code>, <Code>HAULER_EMAIL_FROM</Code>, <Code>HAULER_NOTIFY_OVERRIDE</Code>, <Code>ADMIN_EMAIL</Code></li>
            <li><Code>NEXT_PUBLIC_SITE_URL</Code>, <Code>GATE_PASSWORD</Code>, <Code>GATE_DISABLED</Code>, <Code>ADMIN_PASSWORD</Code></li>
          </UL>
        </Section>

        <Section title="How it scales">
          <UL>
            <li><B>Stripe Checkout</B> absorbs payment load and PCI; fulfillment happens asynchronously in the webhook.</li>
            <li><B>Stateless serverless functions</B> on Netlify scale horizontally automatically — more orders just mean more concurrent function invocations.</li>
            <li><B>Idempotent webhooks</B> (deduped on Stripe event id) mean retries and spikes never double-charge or double-assign.</li>
            <li><B>Matching is in-database math</B> — no third-party call per order, so no rate ceiling during a ramp.</li>
            <li><B>Postgres</B> scales well and is indexed on <Code>status</Code>, <Code>created_at</Code>, and ZIP/active for fast lookups.</li>
            <li><B>The landing page is CDN-cached</B> (ISR); hero images are optimized and edge-served.</li>
            <li><B>Scale lever (not yet needed):</B> if volume gets very high, move matching/email into a background queue (Supabase Edge Function / job) so the webhook returns instantly.</li>
          </UL>
        </Section>

        <Section title="Security posture">
          <UL>
            <li>✅ <B>Payment amounts are set server-side from the database</B>, never from the browser — a customer cannot alter the price.</li>
            <li>✅ <B>Stripe webhook signatures are verified</B> before any order is fulfilled, and processing is idempotent.</li>
            <li>✅ <B>The Supabase service-role key is server-only</B> (never shipped to the browser); customer PII tables are not exposed to the public API (anon/authenticated ungranted).</li>
            <li>✅ <B>Admin cookie is HttpOnly + Secure</B> (in production) and admin auth is independent of the site gate.</li>
            <li>✅ <B>No secrets in the repository</B> — only an <Code>.env.example</Code> with placeholders.</li>
          </UL>
          <H>Recommendations before / at public launch</H>
          <UL>
            <li>Set a <B>strong, unique</B> <Code>ADMIN_PASSWORD</Code> and <Code>GATE_PASSWORD</Code> (the current placeholders are easy to guess).</li>
            <li>Add basic <B>rate limiting</B> to <Code>/api/admin/login</Code> (brute force) and <Code>/api/checkout</Code> (spam) — e.g., Netlify rate limiting.</li>
            <li>Dependency audit: one <B>moderate, build-time-only</B> advisory (PostCSS, via Next&apos;s tooling) — not a runtime/customer risk; clears on a future Next update.</li>
          </UL>
        </Section>

        <Section title="Go-live checklist">
          <OL>
            <li>Swap Stripe to the client&apos;s account (top of this page).</li>
            <li>Confirm Resend sender <Code>orders@</Code> / <Code>dispatch@</Code> and Cloudflare email routing for replies.</li>
            <li>Load real haulers; blank <Code>HAULER_NOTIFY_OVERRIDE</Code> so emails reach them.</li>
            <li>Set strong <Code>ADMIN_PASSWORD</Code>; run the <Code>smoke-test</Code> $1 live order; then deactivate it.</li>
            <li>Set <Code>GATE_DISABLED=true</Code> to open the storefront to the public.</li>
          </OL>
        </Section>

        <p className="mt-10 text-xs text-foreground/50">
          Prepared by Orbis Design · Repository: github.com/garyricke/midwestwaste.app
        </p>
      </div>
    </main>
  );
}

/* ---- small presentational helpers ---- */
function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mt-9">
      <h2 className="font-display text-xl font-extrabold text-navy">{title}</h2>
      <div className="mt-2 space-y-2">{children}</div>
    </section>
  );
}
function P({ children }: { children: React.ReactNode }) {
  return <p>{children}</p>;
}
function H({ children }: { children: React.ReactNode }) {
  return <h3 className="mt-4 font-display font-bold text-navy">{children}</h3>;
}
function B({ children }: { children: React.ReactNode }) {
  return <strong className="text-navy">{children}</strong>;
}
function Code({ children }: { children: React.ReactNode }) {
  return (
    <code className="rounded bg-navy/5 px-1.5 py-0.5 font-mono text-[0.85em] text-navy">
      {children}
    </code>
  );
}
function UL({ children }: { children: React.ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5">{children}</ul>;
}
function OL({ children, start }: { children: React.ReactNode; start?: number }) {
  return <ol start={start} className="list-decimal space-y-2 pl-5">{children}</ol>;
}
function Pre({ children }: { children: React.ReactNode }) {
  return (
    <pre className="overflow-x-auto rounded-xl bg-navy p-4 text-xs leading-relaxed text-white">
      {children}
    </pre>
  );
}
function Note({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-lg border-l-4 border-orange bg-orange/5 px-4 py-2 text-sm">
      {children}
    </p>
  );
}

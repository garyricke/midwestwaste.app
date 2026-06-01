# midwestwaste.app — transactional dumpster ordering (Phase 1)

The transactional sister site to the consulting site (midwestwasteconsultants.com).
A visitor picks a dumpster size, pays via Stripe, and the order is auto-routed to
the **closest qualified hauler** from a Supabase database, who is then emailed.

This is the durable **Phase 1 engine** shipped behind a plain form. The Junkyard
Jam cartoon UI (Phase 2) layers on top later — nothing here gets thrown away.

## Stack
- **Next.js (App Router) + TypeScript + Tailwind v4**
- **Supabase** (Postgres) — haulers, orders, sizes
- **Stripe Checkout** — payments (PCI offloaded)
- **Resend** — transactional email
- **Netlify** — hosting + pre-launch password gate (edge function)
- **`zipcodes`** — offline US zip → lat/long (no API key, nationwide)

## Order flow
1. Form → `POST /api/checkout` creates a `pending_payment` order + Stripe Checkout Session.
2. Stripe-hosted payment page.
3. `checkout.session.completed` webhook → `POST /api/webhook`:
   - idempotent (keyed on Stripe event id)
   - mark `paid` → match nearest hauler (haversine) → assign + email hauler
   - if no hauler in range → `needs_manual_assignment` + alert admin (the nationwide-growth signal)
4. `/success` confirmation page.

## Setup
```bash
npm install
cp .env.example .env.local   # fill in values
# In Supabase SQL editor, run:
#   supabase/schema.sql   (tables + sizes)
#   supabase/seed.sql     (fake Fox Valley haulers — testing only)
npm run dev
```

### Local Stripe webhook
```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhook
# copy the whsec_… into STRIPE_WEBHOOK_SECRET
```

## How to add a real hauler
Insert a row into `haulers` (Supabase table editor or SQL). Required: `name`,
`contact_email`, `latitude`, `longitude`, `service_radius_miles`. Geocode the
hauler's address once (any geocoder, or `zipcodes.lookup(zip)` for a zip
centroid). Set `active = true`. Then **blank out `HAULER_NOTIFY_OVERRIDE`** so
assignment emails go to real haulers instead of Gary's inbox.

## Going live
- Swap `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` from test → live.
- Set `NEXT_PUBLIC_SITE_URL=https://midwestwaste.app`.
- Point Cloudflare DNS at the Netlify site.
- Set `GATE_DISABLED=true` (or remove the gate edge function) to open the doors.

## Swapping the matcher (later)
`lib/matcher.ts` defines a `HaulerMatcher` interface. The current
`HaversineMatcher` uses straight-line distance over our own DB (no per-order API
call → scales without a rate ceiling). Replace with a `DistanceMatrixMatcher`
(Google driving distance) later without touching callers.

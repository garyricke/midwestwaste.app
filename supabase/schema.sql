-- Midwest Waste .app — Phase 1 schema
-- Run in Supabase SQL editor (or `supabase db push`).

-- ---------------------------------------------------------------------------
-- dumpster_sizes : catalog + pricing (demo prices in cents)
-- ---------------------------------------------------------------------------
create table if not exists dumpster_sizes (
  size        text primary key,              -- '10yd', '15yd', '20yd', '30yd'
  label       text not null,
  description text not null,
  price_cents integer not null,
  sort_order  integer not null default 0,
  active      boolean not null default true
);

-- ---------------------------------------------------------------------------
-- haulers : the brokering database
-- ---------------------------------------------------------------------------
create table if not exists haulers (
  id                   uuid primary key default gen_random_uuid(),
  name                 text not null,
  contact_email        text not null,
  contact_phone        text,
  address              text,
  city                 text,
  state                text,
  zip                  text,
  latitude             double precision not null,
  longitude            double precision not null,
  service_radius_miles integer not null default 40,
  active               boolean not null default true,
  created_at           timestamptz not null default now()
);

create index if not exists haulers_active_idx on haulers (active);
create index if not exists haulers_zip_idx on haulers (zip);

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
-- status flow: pending_payment -> paid -> assigned -> notified
--   unmatched paid orders -> needs_manual_assignment (nationwide fallback)
--   failures -> failed
create table if not exists orders (
  id                      uuid primary key default gen_random_uuid(),
  created_at              timestamptz not null default now(),
  status                  text not null default 'pending_payment',

  customer_name           text not null,
  customer_email          text not null,
  customer_phone          text,

  delivery_address        text not null,
  delivery_city           text,
  delivery_state          text,
  delivery_zip            text not null,
  delivery_latitude       double precision,
  delivery_longitude      double precision,

  dumpster_size           text not null references dumpster_sizes(size),
  amount_cents            integer not null,
  requested_delivery_date date,
  notes                   text,

  stripe_session_id       text unique,
  stripe_payment_intent   text,

  assigned_hauler_id      uuid references haulers(id),
  distance_miles          double precision
);

create index if not exists orders_status_idx on orders (status);
create index if not exists orders_created_idx on orders (created_at desc);
create index if not exists orders_session_idx on orders (stripe_session_id);

-- ---------------------------------------------------------------------------
-- webhook_events : Stripe webhook idempotency guard
-- ---------------------------------------------------------------------------
create table if not exists webhook_events (
  stripe_event_id text primary key,
  processed_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Seed dumpster sizes (demo pricing: $1 / $2 / $3 / $4)
-- ---------------------------------------------------------------------------
insert into dumpster_sizes (size, label, description, price_cents, sort_order, active) values
  ('10yd', '10 Yard', 'Small cleanouts, a single room, or a modest yard project.', 37500, 1, true),
  ('15yd', '15 Yard', 'The sweet spot — garage cleanout or a small remodel.', 42500, 2, true),
  ('20yd', '20 Yard', 'Roofing tear-offs and larger renovation debris.', 45000, 3, true),
  ('30yd', '30 Yard', 'Full attic + garage, estate cleanouts, big builds.', 52500, 4, true),
  -- Hidden $1 product for live-mode smoke testing. Keep inactive in production;
  -- flip active=true to run a real-money test, then set it back to false.
  ('smoke-test', 'Smoke Test ($1)', 'Internal live-mode payment test — keep inactive in production.', 100, 99, false)
on conflict (size) do update set
  label = excluded.label,
  description = excluded.description,
  price_cents = excluded.price_cents,
  sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Grants: this app accesses these tables ONLY server-side via the service_role
-- (secret) key. We deliberately do NOT grant anon/authenticated, so customer
-- PII stays private even via the public API. Needed because the project was
-- created with "automatically expose new tables" disabled.
-- ---------------------------------------------------------------------------
grant usage on schema public to service_role;
grant all privileges on all tables in schema public to service_role;
grant all privileges on all sequences in schema public to service_role;
alter default privileges in schema public grant all on tables to service_role;
alter default privileges in schema public grant all on sequences to service_role;

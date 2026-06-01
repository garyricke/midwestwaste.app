import Stripe from "stripe";

// Lazily instantiated: `new Stripe("")` throws on a missing key, so we defer
// creation until first use. This lets `next build` collect page data without
// env vars present (they're injected in the deploy target at runtime).
let client: Stripe | null = null;

function getClient(): Stripe {
  if (client) return client;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("Stripe env not configured: set STRIPE_SECRET_KEY.");
  client = new Stripe(key, {
    // Pin the API version for predictable webhook payloads.
    apiVersion: "2026-05-27.dahlia",
  });
  return client;
}

export const stripe: Stripe = new Proxy({} as Stripe, {
  get(_target, prop) {
    const c = getClient();
    const value = c[prop as keyof Stripe];
    return typeof value === "function" ? (value as (...a: unknown[]) => unknown).bind(c) : value;
  },
});

import { cookies } from "next/headers";

// Admin auth is independent of the pre-launch site gate, so /admin stays
// protected by its own password even after the storefront opens to the public.
export const ADMIN_COOKIE = "mwa_admin";
export const ADMIN_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export async function isAdmin(): Promise<boolean> {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) return false;
  const store = await cookies();
  return store.get(ADMIN_COOKIE)?.value === pw;
}

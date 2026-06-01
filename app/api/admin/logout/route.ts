import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const res = NextResponse.redirect(new URL("/admin", base), { status: 303 });
  res.cookies.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return res;
}

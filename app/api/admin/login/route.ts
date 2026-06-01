import { NextRequest, NextResponse } from "next/server";
import { ADMIN_COOKIE, ADMIN_MAX_AGE } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const form = await req.formData();
  const pw = String(form.get("password") || "");
  const base = process.env.NEXT_PUBLIC_SITE_URL || new URL(req.url).origin;
  const expected = process.env.ADMIN_PASSWORD;

  if (expected && pw === expected) {
    const res = NextResponse.redirect(new URL("/admin", base), { status: 303 });
    res.cookies.set(ADMIN_COOKIE, pw, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: ADMIN_MAX_AGE,
    });
    return res;
  }

  return NextResponse.redirect(new URL("/admin?error=1", base), { status: 303 });
}

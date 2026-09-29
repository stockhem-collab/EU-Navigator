import { NextResponse } from "next/server";
import {
  REMEMBER_DAYS,
  SESSION_COOKIE,
  SESSION_HOURS,
  USER_COOKIE,
  demoPassword,
  safeEqual,
  signSession,
} from "@/lib/auth/session";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  const password = demoPassword();
  if (!password) {
    return NextResponse.json({ error: "not-configured" }, { status: 503 });
  }

  let body: { email?: unknown; password?: unknown; remember?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const given = typeof body.password === "string" ? body.password : "";
  if (!EMAIL_PATTERN.test(email) || !safeEqual(given, password)) {
    // A short pause on every failed attempt slows down guessing.
    await new Promise((resolve) => setTimeout(resolve, 600));
    return NextResponse.json({ error: "invalid" }, { status: 401 });
  }

  const maxAge = body.remember === true ? REMEMBER_DAYS * 24 * 60 * 60 : SESSION_HOURS * 60 * 60;
  const token = await signSession({ email, exp: Date.now() + maxAge * 1000 }, password);
  const response = NextResponse.json({ ok: true });
  const secure = process.env.NODE_ENV === "production";
  response.cookies.set(SESSION_COOKIE, token, { httpOnly: true, sameSite: "lax", secure, path: "/", maxAge });
  response.cookies.set(USER_COOKIE, email, { httpOnly: false, sameSite: "lax", secure, path: "/", maxAge });
  return response;
}

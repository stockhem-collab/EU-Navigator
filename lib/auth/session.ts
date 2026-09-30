// A simple lock on the system: one shared demo password (DEMO_PASSWORD,
// set in the hosting environment), checked on the server, and a signed
// session cookie that middleware.ts requires on every page but the start
// page. It only keeps people without the password out — it doesn't tell
// users apart, and the data still lives in each browser.
//
// Web Crypto only, so the same code runs in the Edge middleware and in the
// Node route handlers.

export const SESSION_COOKIE = "eu-nav-session";
export { USER_COOKIE, safeNextPath } from "@/lib/auth/shared";

export const SESSION_HOURS = 8;
export const REMEMBER_DAYS = 30;

/** The shared password, or null when none is configured. Outside
 * production (the dev server, the e2e tests) it falls back to "demo" so the
 * app runs without setup; in production it must be set. */
export function demoPassword(): string | null {
  const configured = process.env.DEMO_PASSWORD;
  if (configured) return configured;
  return process.env.NODE_ENV === "production" ? null : "demo";
}

const encoder = new TextEncoder();

function toBase64Url(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromBase64Url(text: string): Uint8Array<ArrayBuffer> {
  const binary = atob(text.replace(/-/g, "+").replace(/_/g, "/"));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

// The signing key is derived from the password itself, so changing the
// password also logs everyone out.
async function key(password: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(`eu-navigator-session:${password}`),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export interface SessionPayload {
  email: string;
  /** Expiry, milliseconds since epoch. */
  exp: number;
}

export async function signSession(payload: SessionPayload, password: string): Promise<string> {
  const body = toBase64Url(encoder.encode(JSON.stringify(payload)));
  const signature = new Uint8Array(await crypto.subtle.sign("HMAC", await key(password), encoder.encode(body)));
  return `${body}.${toBase64Url(signature)}`;
}

export async function verifySession(token: string | undefined, password: string | null): Promise<SessionPayload | null> {
  if (!token || !password) return null;
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;
  try {
    const valid = await crypto.subtle.verify("HMAC", await key(password), fromBase64Url(signature), encoder.encode(body));
    if (!valid) return null;
    const payload = JSON.parse(new TextDecoder().decode(fromBase64Url(body))) as SessionPayload;
    return typeof payload.exp === "number" && payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

/** Compares without returning early on the first difference, so the time
 * taken doesn't reveal how much of a guess was right. */
export function safeEqual(a: string, b: string): boolean {
  const x = encoder.encode(a);
  const y = encoder.encode(b);
  let diff = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) diff |= (x[i] ?? 0) ^ (y[i] ?? 0);
  return diff === 0;
}

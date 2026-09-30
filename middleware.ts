import { NextRequest, NextResponse } from "next/server";
import { SESSION_COOKIE, demoPassword, verifySession } from "@/lib/auth/session";

// The lock: every page except the start page needs a valid session. Not
// logged in → the start page, which remembers where the user was going
// (?next=). Logged in and on the start page → straight to Översikt.
export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const session = await verifySession(request.cookies.get(SESSION_COOKIE)?.value, demoPassword());

  if (pathname === "/") {
    if (session) return NextResponse.redirect(new URL("/oversikt", request.url));
    return NextResponse.next();
  }

  if (!session) {
    const url = new URL("/", request.url);
    url.searchParams.set("next", `${pathname}${search}`);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  // Everything but Next's own files, the login/logout endpoints and static
  // files (icon, images).
  matcher: ["/((?!_next/|api/login|api/logout|.*\\.[a-zA-Z0-9]+$).*)"],
};

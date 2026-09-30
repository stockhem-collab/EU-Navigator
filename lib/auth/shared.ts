// The parts of the login the browser needs too — kept apart from
// session.ts, which holds the server-side password handling.

/** Readable by the page (not httpOnly) — only used to show who is logged
 * in; access is decided by the signed session cookie alone. */
export const USER_COOKIE = "eu-nav-user";

/** Where to go after logging in: only a path on this site, never another
 * origin ("//evil.example" or "https://…"). */
export function safeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) return "/oversikt";
  return next;
}

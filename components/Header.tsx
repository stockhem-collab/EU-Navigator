"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import NotificationBell from "@/components/NotificationBell";
import { USER_COOKIE } from "@/lib/auth/shared";

type NavKey = keyof ReturnType<typeof useLanguage>["t"]["nav"];

// One tab per purpose: Översikt (my work), Projekt (the projects
// themselves), Ansöka and Rapportera (the two workflows, across all
// projects), Kunskapsbank (EU-databas + Referensprojekt) and Datacenter.
// `also` lists further paths that belong to the same tab.
const NAV_LINKS: { href: string; labelKey: NavKey; also?: string[] }[] = [
  { href: "/oversikt", labelKey: "overview" },
  { href: "/projekt", labelKey: "projects" },
  { href: "/ansok", labelKey: "apply", also: ["/ansokan"] },
  { href: "/rapportera", labelKey: "report", also: ["/stod"] },
  { href: "/eu-databas", labelKey: "knowledgeBank", also: ["/referensprojekt", "/historik"] },
  { href: "/datacenter", labelKey: "datacenter" },
];

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const matches = (href: string) => pathname === href || pathname?.startsWith(`${href}/`);
  // Every page but the start page requires a session (middleware.ts), and
  // a logged-in user is sent on from the start page — so the start page is
  // the only one seen logged out. There the menu is replaced by "Logga in".
  const loggedIn = pathname !== "/";
  const [userEmail, setUserEmail] = useState<string | null>(null);
  useEffect(() => {
    const match = document.cookie.split("; ").find((c) => c.startsWith(`${USER_COOKIE}=`));
    setUserEmail(match ? decodeURIComponent(match.slice(USER_COOKIE.length + 1)) : null);
  }, []);
  const logout = async () => {
    try {
      await fetch("/api/logout", { method: "POST" });
    } finally {
      window.location.assign("/");
    }
  };
  const isActive = (href: string) => {
    const link = NAV_LINKS.find((l) => l.href === href);
    return matches(href) || (link?.also ?? []).some(matches);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-700 text-sm font-bold text-gold-300">
            EU
          </span>
          <span className="text-lg font-bold text-navy-900">Navigator</span>
        </Link>

        {loggedIn && (
        <nav className="hidden items-center gap-5 text-sm font-medium text-navy-700 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              aria-current={isActive(link.href) ? "page" : undefined}
              className={isActive(link.href) ? "font-semibold text-navy-900" : "hover:text-navy-900"}
            >
              {t.nav[link.labelKey]}
            </Link>
          ))}
        </nav>
        )}

        <div className="flex items-center gap-3">
          {loggedIn && <NotificationBell />}
          <Link
            href="/installningar"
            aria-label={t.nav.settings}
            title={t.nav.settings}
            aria-current={isActive("/installningar") ? "page" : undefined}
            className={`hidden ${loggedIn ? "lg:block" : ""} ${isActive("/installningar") ? "text-navy-800" : "text-navy-400 hover:text-navy-700"}`}
          >
            ⚙
          </Link>
          <div className="flex rounded-full border border-navy-200 p-0.5 text-xs font-semibold">
            <button
              onClick={() => setLang("sv")}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === "sv" ? "bg-navy-700 text-white" : "text-navy-600 hover:text-navy-900"
              }`}
              aria-pressed={lang === "sv"}
            >
              SV
            </button>
            <button
              onClick={() => setLang("en")}
              className={`rounded-full px-2.5 py-1 transition ${
                lang === "en" ? "bg-navy-700 text-white" : "text-navy-600 hover:text-navy-900"
              }`}
              aria-pressed={lang === "en"}
            >
              EN
            </button>
          </div>
          {loggedIn ? (
            <>
              <Link
                href="/ansokan"
                className="hidden rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400 sm:block"
              >
                {t.nav.demo}
              </Link>
              <button
                type="button"
                onClick={logout}
                title={userEmail ? t.login.loggedInAs(userEmail) : undefined}
                className="hidden text-sm font-semibold text-navy-600 hover:text-navy-900 lg:block"
              >
                {t.login.logout}
              </button>
            </>
          ) : null}
          {loggedIn && (
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-navy-200 text-navy-700 lg:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
          )}
        </div>
      </div>

      {loggedIn && menuOpen && (
        <nav className="border-t border-navy-100 bg-white px-6 py-4 lg:hidden">
          <ul className="flex flex-col gap-3 text-sm font-medium text-navy-700">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={`block ${isActive(link.href) ? "font-semibold text-navy-900" : ""}`}
                  onClick={() => setMenuOpen(false)}
                >
                  {t.nav[link.labelKey]}
                </Link>
              </li>
            ))}
            <li>
              <Link
                href="/installningar"
                aria-current={isActive("/installningar") ? "page" : undefined}
                className={`block ${isActive("/installningar") ? "font-semibold text-navy-900" : ""}`}
                onClick={() => setMenuOpen(false)}
              >
                ⚙ {t.nav.settings}
              </Link>
            </li>
            <li>
              <Link
                href="/ansokan"
                className="mt-1 inline-block rounded-md bg-gold-500 px-4 py-2 font-semibold text-navy-900"
                onClick={() => setMenuOpen(false)}
              >
                {t.nav.demo}
              </Link>
            </li>
            <li className="border-t border-navy-100 pt-3">
              {userEmail && <p className="text-xs text-navy-400">{t.login.loggedInAs(userEmail)}</p>}
              <button type="button" onClick={logout} className="mt-1 font-semibold text-navy-700">
                {t.login.logout}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

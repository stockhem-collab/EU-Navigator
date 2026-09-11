"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

const NAV_LINKS: { href: string; labelKey: keyof ReturnType<typeof useLanguage>["t"]["nav"] }[] = [
  { href: "/oversikt", labelKey: "overview" },
  { href: "/projektbank", labelKey: "projectBank" },
  { href: "/bevakning", labelKey: "monitoring" },
  { href: "/eu-databas", labelKey: "euDatabase" },
  { href: "/referensprojekt", labelKey: "referenceProjects" },
  { href: "/projekt", labelKey: "myProjects" },
  { href: "/datacenter", labelKey: "datacenter" },
];

export default function Header() {
  const { lang, setLang, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setMenuOpen(false)}>
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-700 text-sm font-bold text-gold-300">
            EU
          </span>
          <span className="text-lg font-bold text-navy-900">Navigator</span>
        </Link>

        <nav className="hidden items-center gap-5 text-sm font-medium text-navy-700 lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-navy-900">
              {t.nav[link.labelKey]}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/installningar"
            aria-label={t.nav.settings}
            title={t.nav.settings}
            className="hidden text-navy-400 hover:text-navy-700 lg:block"
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
          <Link
            href="/demo"
            className="hidden rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400 sm:block"
          >
            {t.nav.demo}
          </Link>
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label={t.nav.menu}
            aria-expanded={menuOpen}
            className="flex h-9 w-9 items-center justify-center rounded-md border border-navy-200 text-navy-700 lg:hidden"
          >
            {menuOpen ? "✕" : "☰"}
          </button>
        </div>
      </div>

      {menuOpen && (
        <nav className="border-t border-navy-100 bg-white px-6 py-4 lg:hidden">
          <ul className="flex flex-col gap-3 text-sm font-medium text-navy-700">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="block" onClick={() => setMenuOpen(false)}>
                  {t.nav[link.labelKey]}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/installningar" className="block" onClick={() => setMenuOpen(false)}>
                ⚙ {t.nav.settings}
              </Link>
            </li>
            <li>
              <Link
                href="/demo"
                className="mt-1 inline-block rounded-md bg-gold-500 px-4 py-2 font-semibold text-navy-900"
                onClick={() => setMenuOpen(false)}
              >
                {t.nav.demo}
              </Link>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}

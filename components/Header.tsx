"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Header() {
  const { lang, setLang, t } = useLanguage();

  return (
    <header className="sticky top-0 z-40 border-b border-navy-100 bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-md bg-navy-700 text-sm font-bold text-gold-300">
            EU
          </span>
          <span className="text-lg font-bold text-navy-900">Navigator</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-navy-700 lg:flex">
          <Link href="/projektbank" className="hover:text-navy-900">
            {t.nav.projectBank}
          </Link>
          <Link href="/eu-databas" className="hover:text-navy-900">
            {t.nav.euDatabase}
          </Link>
          <Link href="/referensprojekt" className="hover:text-navy-900">
            {t.nav.referenceProjects}
          </Link>
          <Link href="/projekt" className="hover:text-navy-900">
            {t.nav.myProjects}
          </Link>
          <Link href="/datacenter" className="hover:text-navy-900">
            {t.nav.datacenter}
          </Link>
        </nav>

        <div className="flex items-center gap-3">
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
            className="rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400"
          >
            {t.nav.demo}
          </Link>
        </div>
      </div>
    </header>
  );
}

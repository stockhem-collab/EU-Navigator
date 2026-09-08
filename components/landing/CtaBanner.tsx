"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function CtaBanner() {
  const { t } = useLanguage();

  return (
    <section className="section">
      <div className="flex flex-col items-start justify-between gap-6 rounded-3xl bg-gold-50 p-10 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold text-navy-900">{t.cta.title}</h2>
          <p className="mt-2 text-navy-600">{t.cta.subtitle}</p>
        </div>
        <Link
          href="/demo"
          className="shrink-0 rounded-md bg-navy-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700"
        >
          {t.cta.button}
        </Link>
      </div>
    </section>
  );
}

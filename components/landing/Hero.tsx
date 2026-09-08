"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Hero() {
  const { t } = useLanguage();

  const stats = [
    { label: t.hero.stat1Label, value: t.hero.stat1Value },
    { label: t.hero.stat2Label, value: t.hero.stat2Value },
    { label: t.hero.stat3Label, value: t.hero.stat3Value },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-800 to-navy-900 text-white">
      <div className="mx-auto max-w-6xl px-6 py-24 md:py-32">
        <p className="badge bg-gold-400/20 text-gold-200">{t.hero.eyebrow}</p>
        <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
          {t.hero.title}
        </h1>
        <p className="mt-6 max-w-2xl text-lg text-navy-200">{t.hero.subtitle}</p>

        <div className="mt-10 flex flex-wrap gap-4">
          <Link
            href="/demo"
            className="rounded-md bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-900 shadow-lg transition hover:bg-gold-400"
          >
            {t.hero.ctaPrimary}
          </Link>
          <a
            href="#workflow"
            className="rounded-md border border-white/30 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {t.hero.ctaSecondary}
          </a>
        </div>

        <dl className="mt-16 grid max-w-3xl grid-cols-1 gap-6 border-t border-white/10 pt-10 sm:grid-cols-3">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-sm text-navy-300">{stat.label}</dt>
              <dd className="mt-1 text-3xl font-bold text-gold-300">{stat.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}

"use client";

import { Suspense } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import LoginCard from "@/components/landing/LoginCard";

export default function Hero() {
  const { t } = useLanguage();

  const stats = [
    { label: t.hero.stat1Label, value: t.hero.stat1Value },
    { label: t.hero.stat2Label, value: t.hero.stat2Value },
    { label: t.hero.stat3Label, value: t.hero.stat3Value },
  ];

  return (
    <section className="relative overflow-hidden bg-gradient-to-b from-navy-800 to-navy-900 text-white">
      {/* One grid, three pieces: the intro, the login and the rest. On wide
          screens the login sits in its own column beside the other two; on
          narrow ones it comes straight after the intro, so the only way in is
          visible without scrolling past buttons and figures. */}
      <div className="mx-auto grid max-w-6xl items-start gap-x-12 gap-y-10 px-6 py-24 md:py-32 lg:grid-cols-[1fr_380px] lg:gap-y-0">
        <div>
          <p className="badge bg-gold-400/20 text-gold-200">{t.hero.eyebrow}</p>
          <h1 className="mt-6 max-w-3xl text-4xl font-extrabold leading-tight tracking-tight md:text-6xl">
            {t.hero.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-navy-200">{t.hero.subtitle}</p>
        </div>

        <div className="lg:col-start-2 lg:row-span-2 lg:row-start-1">
          <Suspense fallback={null}>
            <LoginCard />
          </Suspense>
        </div>

        <div className="lg:mt-10">
          <div className="flex flex-wrap gap-4">
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
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function EntryCards() {
  const { t } = useLanguage();
  const h = t.home;

  const cards = [
    { title: h.entry1Title, desc: h.entry1Desc, cta: h.entry1Cta, href: "/demo" },
    { title: h.entry2Title, desc: h.entry2Desc, cta: h.entry2Cta, href: "/eu-databas" },
    { title: h.entry3Title, desc: h.entry3Desc, cta: h.entry3Cta, href: "/projekt" },
  ];

  return (
    <section className="section">
      <h2 className="text-2xl font-bold text-navy-900 md:text-3xl">{h.entryTitle}</h2>
      <p className="mt-2 text-navy-600">{h.entrySubtitle}</p>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {cards.map((card, i) => (
          <Link
            key={card.title}
            href={card.href}
            className="group flex flex-col rounded-xl border border-navy-100 bg-white p-6 transition hover:border-navy-300 hover:shadow-md"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-navy-100 text-sm font-bold text-navy-700">
              {i + 1}
            </span>
            <h3 className="mt-4 font-bold text-navy-900">{card.title}</h3>
            <p className="mt-2 flex-1 text-sm text-navy-600">{card.desc}</p>
            <span className="mt-4 text-sm font-semibold text-navy-700 group-hover:text-navy-900">
              {card.cta} →
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

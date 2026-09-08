"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Personas() {
  const { t } = useLanguage();

  return (
    <section id="personas" className="section">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold text-navy-900 md:text-4xl">{t.personas.title}</h2>
        <p className="mt-3 text-navy-600">{t.personas.subtitle}</p>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        {t.personas.items.map((persona) => (
          <div key={persona.role} className="rounded-xl border border-navy-100 p-6">
            <h3 className="font-bold text-navy-800">{persona.role}</h3>
            <p className="mt-2 text-sm text-navy-600">{persona.need}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

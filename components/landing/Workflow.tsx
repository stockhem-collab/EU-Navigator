"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Workflow() {
  const { t } = useLanguage();

  return (
    <section id="workflow" className="section bg-navy-50 rounded-3xl">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold text-navy-900 md:text-4xl">{t.workflow.title}</h2>
        <p className="mt-3 font-mono text-sm text-gold-600">{t.workflow.subtitle}</p>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {t.workflow.steps.map((step) => (
          <div key={step.title} className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-navy-100">
            <h3 className="text-lg font-bold text-navy-800">{step.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-navy-600">{step.desc}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

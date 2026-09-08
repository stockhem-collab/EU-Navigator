"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Problem() {
  const { t } = useLanguage();

  return (
    <section className="section">
      <h2 className="max-w-2xl text-3xl font-bold text-navy-900 md:text-4xl">{t.problem.title}</h2>
      <p className="mt-4 max-w-2xl text-navy-600">{t.problem.body}</p>

      <div className="mt-12 grid gap-6 md:grid-cols-2">
        <div className="rounded-xl border border-navy-100 bg-white p-6">
          <p className="badge bg-navy-100 text-navy-600">{t.problem.before.label}</p>
          <ol className="mt-4 space-y-3">
            {t.problem.before.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-navy-600">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-500">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-gold-200 bg-gold-50 p-6">
          <p className="badge bg-gold-400/30 text-gold-700">{t.problem.after.label}</p>
          <ol className="mt-4 space-y-3">
            {t.problem.after.steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm text-navy-800">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400 text-xs font-semibold text-navy-900">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}

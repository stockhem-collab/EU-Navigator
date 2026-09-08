"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Radar() {
  const { t } = useLanguage();

  return (
    <section className="section">
      <div className="grid items-center gap-10 rounded-3xl bg-navy-800 p-10 text-white md:grid-cols-2 md:p-14">
        <div>
          <h2 className="text-3xl font-bold">{t.radar.title}</h2>
          <p className="mt-4 text-navy-200">{t.radar.body}</p>
        </div>
        <div className="rounded-xl bg-white/5 p-6 ring-1 ring-white/10">
          <p className="text-sm font-semibold text-gold-300">{t.radar.example}</p>
          <div className="mt-4 space-y-3">
            {[92, 86, 79, 71].map((score) => (
              <div key={score} className="flex items-center gap-3">
                <div className="h-2 flex-1 rounded-full bg-white/10">
                  <div
                    className="h-2 rounded-full bg-gold-400"
                    style={{ width: `${score}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-semibold text-white">{score}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

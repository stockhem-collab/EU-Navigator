"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

export default function Pricing() {
  const { t } = useLanguage();

  return (
    <section id="pricing" className="section">
      <h2 className="max-w-2xl text-3xl font-bold text-navy-900 md:text-4xl">{t.pricing.title}</h2>

      <div className="mt-12 grid gap-6 md:grid-cols-3">
        {t.pricing.tiers.map((tier) => (
          <div
            key={tier.name}
            className={`rounded-xl p-6 ${
              "highlighted" in tier && tier.highlighted
                ? "bg-navy-800 text-white ring-2 ring-gold-400"
                : "border border-navy-100 bg-white text-navy-900"
            }`}
          >
            <h3 className="text-lg font-bold">{tier.name}</h3>
            <p
              className={`mt-1 text-sm font-semibold ${
                "highlighted" in tier && tier.highlighted ? "text-gold-300" : "text-gold-600"
              }`}
            >
              {tier.price}
            </p>
            <p className={`mt-4 text-sm ${"highlighted" in tier && tier.highlighted ? "text-navy-200" : "text-navy-600"}`}>
              {tier.desc}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// A compact way for someone who already works in the system (not a first-time
// visitor) to jump straight to any section — the three funnel cards above
// this only cover part of the app, so every main tab is linked here too.
const LINKS: {
  href: string;
  icon: string;
  labelKey: "demo" | "overview" | "projects" | "apply" | "report" | "euDatabase" | "referenceProjects" | "datacenter";
}[] = [
  { href: "/ansokan", icon: "📝", labelKey: "demo" },
  { href: "/oversikt", icon: "🏠", labelKey: "overview" },
  { href: "/projekt", icon: "🗂", labelKey: "projects" },
  { href: "/ansok", icon: "✍️", labelKey: "apply" },
  { href: "/rapportera", icon: "📊", labelKey: "report" },
  { href: "/eu-databas", icon: "📚", labelKey: "euDatabase" },
  { href: "/referensprojekt", icon: "🏆", labelKey: "referenceProjects" },
  { href: "/datacenter", icon: "🛠", labelKey: "datacenter" },
];

export default function QuickLinks() {
  const { t } = useLanguage();

  return (
    <section className="section pt-0">
      <h2 className="text-sm font-semibold uppercase text-navy-400">{t.home.quickLinksTitle}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
        {LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="flex flex-col items-center gap-2 rounded-xl border border-navy-100 bg-white p-4 text-center transition hover:border-navy-300 hover:shadow-sm"
          >
            <span className="text-xl">{link.icon}</span>
            <span className="text-xs font-semibold text-navy-700">{t.nav[link.labelKey]}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}

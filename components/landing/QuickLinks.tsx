"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// A compact way for someone who already works in the system (not a first-time
// visitor) to jump straight to any section — the three funnel cards above
// this only represent 3 of the app's 7 real sections, so a returning user
// looking for e.g. Datacenter or Bevakning had no link to it anywhere on
// this page.
const LINKS: { href: string; icon: string; labelKey: "demo" | "euDatabase" | "projectBank" | "monitoring" | "referenceProjects" | "myProjects" | "datacenter" }[] = [
  { href: "/demo", icon: "📝", labelKey: "demo" },
  { href: "/projekt", icon: "📁", labelKey: "myProjects" },
  { href: "/bevakning", icon: "🔔", labelKey: "monitoring" },
  { href: "/projektbank", icon: "🗂", labelKey: "projectBank" },
  { href: "/eu-databas", icon: "📚", labelKey: "euDatabase" },
  { href: "/referensprojekt", icon: "🏆", labelKey: "referenceProjects" },
  { href: "/datacenter", icon: "🛠", labelKey: "datacenter" },
];

export default function QuickLinks() {
  const { t } = useLanguage();

  return (
    <section className="section pt-0">
      <h2 className="text-sm font-semibold uppercase text-navy-400">{t.home.quickLinksTitle}</h2>
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
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

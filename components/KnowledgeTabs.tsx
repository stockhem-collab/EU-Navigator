"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Kunskapsbanken groups the two reference sections — the EU call catalogue
// and funded reference projects — under one main tab; this strip moves
// between them.
const TABS: { href: string; labelKey: "euDatabase" | "referenceProjects" }[] = [
  { href: "/eu-databas", labelKey: "euDatabase" },
  { href: "/referensprojekt", labelKey: "referenceProjects" },
];

export default function KnowledgeTabs() {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <nav aria-label={t.nav.knowledgeBank} className="mb-6 flex flex-wrap items-center gap-2 border-b border-navy-100 pb-4">
      <span className="mr-2 text-xs font-semibold uppercase text-navy-400">{t.nav.knowledgeBank}</span>
      {TABS.map((tab) => {
        const active = pathname === tab.href || pathname?.startsWith(`${tab.href}/`);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active ? "bg-navy-800 text-white" : "border border-navy-200 text-navy-600 hover:bg-navy-50"
            }`}
          >
            {t.nav[tab.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}

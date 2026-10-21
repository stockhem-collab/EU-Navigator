"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Datacenter's views for leadership and finance: the portfolio and data
// overview, the leadership report, co-financing, the funders' forms and the calls' requirements — the same strip as
// KnowledgeTabs.
const TABS: { href: string; label: (t: ReturnType<typeof useLanguage>["t"]) => string }[] = [
  { href: "/datacenter", label: (t) => t.ext.datacenterTabs.overview },
  { href: "/datacenter/ledningsrapport", label: (t) => t.ext.datacenterTabs.leadership },
  { href: "/datacenter/medfinansiering", label: (t) => t.ext.datacenterTabs.cofinancing },
  { href: "/datacenter/mallar", label: (t) => t.ext.datacenterTabs.templates },
  { href: "/datacenter/krav", label: (t) => t.req.datacenter.tab },
];

export default function DatacenterTabs() {
  const { t } = useLanguage();
  const pathname = usePathname();

  return (
    <nav aria-label={t.ext.datacenterTabs.label} className="mb-6 flex flex-wrap items-center gap-2 border-b border-navy-100 pb-4 print:hidden">
      <span className="mr-2 text-xs font-semibold uppercase text-navy-400">{t.ext.datacenterTabs.label}</span>
      {TABS.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              active ? "bg-navy-800 text-white" : "border border-navy-200 text-navy-600 hover:bg-navy-50"
            }`}
          >
            {tab.label(t)}
          </Link>
        );
      })}
    </nav>
  );
}

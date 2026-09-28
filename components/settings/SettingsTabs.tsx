"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";

// Every Inställningar subpage only linked back to the hub, so moving
// between e.g. Organisation and Användare meant hub → page → hub → page.
// A small shared tab strip lets you jump sideways instead.
const TABS: { href: string; labelKey: "cardProfileTitle" | "cardOrgTitle" | "cardUsersTitle" | "cardWatchTitle" | "cardFundingProfileTitle" }[] = [
  { href: "/installningar/profil", labelKey: "cardProfileTitle" },
  { href: "/installningar/organisation", labelKey: "cardOrgTitle" },
  { href: "/installningar/anvandare", labelKey: "cardUsersTitle" },
  { href: "/installningar/bevakningar", labelKey: "cardWatchTitle" },
  { href: "/installningar/finansieringsprofil", labelKey: "cardFundingProfileTitle" },
];

export default function SettingsTabs() {
  const { t } = useLanguage();
  const sh = t.settingsHub;
  const pathname = usePathname();

  return (
    <nav aria-label={sh.title} className="mt-4 flex flex-wrap gap-2 border-b border-navy-100 pb-4">
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
            {sh[tab.labelKey]}
          </Link>
        );
      })}
    </nav>
  );
}

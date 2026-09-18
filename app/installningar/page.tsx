"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";

export default function SettingsHubPage() {
  const { t } = useLanguage();
  const sh = t.settingsHub;
  const { users, hydrated } = useUsersDirectory();

  if (!hydrated) return null;

  const adminCount = users.filter((u) => u.orgRole === "org-admin").length;

  const cards = [
    { href: "/installningar/profil", icon: "👤", title: sh.cardProfileTitle, desc: sh.cardProfileDesc },
    { href: "/installningar/organisation", icon: "🏢", title: sh.cardOrgTitle, desc: sh.cardOrgDesc },
    { href: "/installningar/anvandare", icon: "👥", title: sh.cardUsersTitle, desc: sh.cardUsersDesc(users.length, adminCount) },
    { href: "/installningar/bevakningar", icon: "🔔", title: sh.cardWatchTitle, desc: sh.cardWatchDesc },
    { href: "/installningar/finansieringsprofil", icon: "🇪🇺", title: sh.cardFundingProfileTitle, desc: sh.cardFundingProfileDesc },
  ];

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <h1 className="text-2xl font-bold text-navy-900">{sh.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{sh.subtitle}</p>

        <div className="mb-6 mt-8 space-y-3">
          {cards.map((c) => (
            <Link
              key={c.href}
              href={c.href}
              className="flex items-center gap-4 rounded-xl border border-navy-100 bg-white p-5 transition hover:border-navy-300 hover:shadow-sm"
            >
              <span className="text-2xl">{c.icon}</span>
              <span>
                <span className="block font-semibold text-navy-900">{c.title}</span>
                <span className="block text-sm text-navy-500">{c.desc}</span>
              </span>
            </Link>
          ))}
        </div>

        <div className="mb-16 grid gap-3 sm:grid-cols-3">
          {[sh.securityTitle, sh.integrationsTitle, sh.dataTitle].map((title) => (
            <div key={title} className="rounded-xl border border-dashed border-navy-200 bg-navy-50/40 p-4">
              <p className="font-semibold text-navy-500">{title}</p>
              <p className="mt-1 text-xs text-navy-400">{sh.comingSoon}</p>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { orgUnits, CURRENT_USER_ID } from "@/lib/data/users";

export default function ProfileSettingsPage() {
  const { t, lang } = useLanguage();
  const ps = t.profileSettings;
  const { users, hydrated, updateProfile } = useUsersDirectory();

  if (!hydrated) return null;

  const me = users.find((u) => u.id === CURRENT_USER_ID);
  if (!me) return null;

  return (
    <>
      <Header />
      <main className="section max-w-2xl">
        <Link href="/installningar" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          {ps.back}
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-navy-900">{ps.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{ps.subtitle}</p>

        <div className="mb-16 mt-8 rounded-xl border border-navy-100 bg-white p-6">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy-700 text-lg font-bold text-white">
              {me.firstName[0]}
              {me.lastName[0]}
            </span>
            <div>
              <p className="font-semibold text-navy-900">
                {me.firstName} {me.lastName}
              </p>
              <p className="text-sm text-navy-500">{lang === "sv" ? me.title_sv : me.title_en}</p>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ps.firstName}</label>
              <input
                value={me.firstName}
                onChange={(e) => updateProfile(me.id, { firstName: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ps.lastName}</label>
              <input
                value={me.lastName}
                onChange={(e) => updateProfile(me.id, { lastName: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ps.email}</label>
              {me.ssoManaged ? (
                <p className="mt-1 rounded-md bg-navy-50 px-3 py-2 text-sm text-navy-600">
                  {me.email} <span className="text-green-700">{ps.emailVerified}</span>
                </p>
              ) : (
                <input
                  value={me.email}
                  onChange={(e) => updateProfile(me.id, { email: e.target.value })}
                  className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ps.phone}</label>
              <input
                value={me.phone ?? ""}
                onChange={(e) => updateProfile(me.id, { phone: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ps.jobTitle}</label>
              <p className="mt-1 rounded-md bg-navy-50 px-3 py-2 text-sm text-navy-600">
                {lang === "sv" ? me.title_sv : me.title_en}
              </p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ps.unit}</label>
              <select
                value={me.unitId ?? ""}
                onChange={(e) => updateProfile(me.id, { unitId: e.target.value || null })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                {orgUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {me.ssoManaged && <p className="mt-4 text-xs italic text-navy-400">{ps.ssoManaged}</p>}
          <p className="mt-4 text-xs text-navy-400">{ps.savedIndicator}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

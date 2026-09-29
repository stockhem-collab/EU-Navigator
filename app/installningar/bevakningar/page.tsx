"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SettingsTabs from "@/components/settings/SettingsTabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useWatchPreferences } from "@/lib/hooks/useWatchPreferences";
import {
  EmailMode,
  NOTIFICATION_CATEGORIES,
  NotificationPreferences,
  useNotificationPreferences,
} from "@/lib/hooks/useNotificationPreferences";
import { fundingPrograms, findProgram } from "@/lib/data/fundingPrograms";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import { Sector } from "@/lib/types";

const SECTORS: Sector[] = ["energy", "climate", "digital", "social", "mobility", "education", "health", "research"];

export default function WatchSettingsPage() {
  const { t, lang } = useLanguage();
  const ws = t.watchSettings;
  const nt = t.notifications;
  const { prefs, hydrated, toggleSector, toggleProgram, toggleCall, resetAll } = useWatchPreferences();
  const notify = useNotificationPreferences();
  const { all: fundingCalls, hydrated: callsHydrated } = useFundingCalls();

  if (!hydrated || !callsHydrated || !notify.hydrated) return null;

  const watchedCalls = prefs.callIds
    .map((callId) => {
      const call = fundingCalls.find((c) => c.id === callId);
      const program = call ? findProgram(call.programId) : undefined;
      return call && program ? { call, program } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const emailModes: EmailMode[] = ["off", "instant", "daily", "weekly"];
  const leadOptions: NotificationPreferences["leadMonths"][] = [1, 2, 3];

  return (
    <>
      <Header />
      <main className="section max-w-2xl">
        <Link href="/installningar" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          {ws.back}
        </Link>
        <SettingsTabs />

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{ws.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{ws.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(ws.confirmResetAll)) resetAll();
            }}
            className="shrink-0 rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50"
          >
            {ws.resetAll}
          </button>
        </div>

        <div className="mb-16 mt-8 space-y-6">
          <section className="rounded-xl border border-navy-100 bg-white p-6" aria-labelledby="notify-heading">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h2 id="notify-heading" className="text-base font-bold text-navy-900">
                  {nt.settingsTitle}
                </h2>
                <p className="mt-1 text-sm text-navy-500">{nt.settingsIntro}</p>
              </div>
              <button
                type="button"
                onClick={notify.reset}
                className="shrink-0 text-xs font-semibold text-navy-500 hover:text-navy-800"
              >
                {nt.resetDefaults}
              </button>
            </div>

            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[480px] text-left text-sm">
                <thead className="text-xs uppercase text-navy-400">
                  <tr>
                    <th className="py-2 pr-3">{nt.columnCategory}</th>
                    <th className="px-3 py-2 text-center">{nt.columnInApp}</th>
                    <th className="py-2 pl-3">{nt.columnEmail}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-navy-50">
                  {NOTIFICATION_CATEGORIES.map((category) => {
                    const pref = notify.prefs.categories[category];
                    return (
                      <tr key={category}>
                        <td className="py-3 pr-3">
                          <p className="font-semibold text-navy-800">{nt.categoryLabels[category]}</p>
                          <p className="text-xs text-navy-500">{nt.categoryHints[category]}</p>
                        </td>
                        <td className="px-3 py-3 text-center">
                          <input
                            type="checkbox"
                            aria-label={`${nt.columnInApp}: ${nt.categoryLabels[category]}`}
                            checked={pref.inApp}
                            onChange={(e) => notify.setCategory(category, { inApp: e.target.checked })}
                          />
                        </td>
                        <td className="py-3 pl-3">
                          <select
                            aria-label={`${nt.columnEmail}: ${nt.categoryLabels[category]}`}
                            value={pref.email}
                            onChange={(e) => notify.setCategory(category, { email: e.target.value as EmailMode })}
                            className="rounded-md border border-navy-200 px-2 py-1 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                          >
                            {emailModes.map((mode) => (
                              <option key={mode} value={mode}>
                                {nt.emailModes[mode]}
                              </option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="mt-3 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-600">{nt.emailNote}</p>

            <div className="mt-5 grid gap-5 border-t border-navy-50 pt-4 sm:grid-cols-2">
              <fieldset>
                <legend className="text-sm font-semibold text-navy-800">{nt.scopeTitle}</legend>
                <div className="mt-2 space-y-1.5">
                  {(["all", "mine"] as const).map((scope) => (
                    <label key={scope} className="flex items-start gap-2 text-sm text-navy-700">
                      <input
                        type="radio"
                        name="notify-scope"
                        className="mt-1"
                        checked={notify.prefs.scope === scope}
                        onChange={() => notify.setScope(scope)}
                      />
                      {scope === "all" ? nt.scopeAll : nt.scopeMine}
                    </label>
                  ))}
                </div>
              </fieldset>
              <fieldset>
                <legend className="text-sm font-semibold text-navy-800">{nt.leadTitle}</legend>
                <div className="mt-2 space-y-1.5">
                  {leadOptions.map((n) => (
                    <label key={n} className="flex items-center gap-2 text-sm text-navy-700">
                      <input
                        type="radio"
                        name="notify-lead"
                        checked={notify.prefs.leadMonths === n}
                        onChange={() => notify.setLeadMonths(n)}
                      />
                      {nt.leadOption(n)}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>
          </section>

          <div>
            <h2 className="text-base font-bold text-navy-900">{nt.watchTitle}</h2>
            <p className="mt-1 text-sm text-navy-500">{nt.watchIntro}</p>
          </div>
          <section className="rounded-xl border border-navy-100 bg-white p-6">
            <p className="text-sm font-semibold text-navy-800">{ws.sectorsTitle}</p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {SECTORS.map((sector) => (
                <label key={sector} className="flex items-center gap-2 text-sm capitalize text-navy-700">
                  <input type="checkbox" checked={prefs.sectors.includes(sector)} onChange={() => toggleSector(sector)} />
                  {sectorLabel(sector, lang)}
                </label>
              ))}
            </div>
          </section>

          <section className="rounded-xl border border-navy-100 bg-white p-6">
            <p className="text-sm font-semibold text-navy-800">{ws.programsTitle}</p>
            <div className="mt-3 grid max-h-64 gap-2 overflow-y-auto sm:grid-cols-2">
              {fundingPrograms
                .filter((p) => p.status === "active")
                .map((p) => (
                  <label key={p.id} className="flex items-center gap-2 text-sm text-navy-700">
                    <input type="checkbox" checked={prefs.programIds.includes(p.id)} onChange={() => toggleProgram(p.id)} />
                    {p.shortName}
                  </label>
                ))}
            </div>
          </section>

          <section className="rounded-xl border border-navy-100 bg-white p-6">
            <p className="text-sm font-semibold text-navy-800">{ws.watchedCallsTitle}</p>
            <p className="mt-1 text-xs text-navy-500">{ws.watchedCallsHint}</p>
            {watchedCalls.length === 0 ? (
              <p className="mt-3 text-sm text-navy-500">{ws.noWatchedCalls}</p>
            ) : (
              <ul className="mt-3 divide-y divide-navy-50">
                {watchedCalls.map(({ call, program }) => (
                  <li key={call.id} className="flex items-center justify-between gap-3 py-2.5">
                    <div>
                      <p className="text-xs font-semibold uppercase text-navy-400">{program.shortName}</p>
                      <p className="text-sm font-semibold text-navy-800">
                        {lang === "sv" ? call.title_sv : call.title_en}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleCall(call.id)}
                      className="shrink-0 text-xs font-semibold text-navy-500 hover:text-amber-700"
                    >
                      {ws.removeWatchedCall}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </section>



          <p className="text-xs text-navy-400">{ws.savedIndicator}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

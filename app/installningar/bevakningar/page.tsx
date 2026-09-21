"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useWatchPreferences, NotifyPreferences, DigestFrequency } from "@/lib/hooks/useWatchPreferences";
import { fundingPrograms, findProgram } from "@/lib/data/fundingPrograms";
import { findCall } from "@/lib/data/fundingCalls";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import { Sector } from "@/lib/types";

const SECTORS: Sector[] = ["energy", "climate", "digital", "social", "mobility", "education", "health", "research"];

export default function WatchSettingsPage() {
  const { t, lang } = useLanguage();
  const ws = t.watchSettings;
  const { prefs, hydrated, toggleSector, toggleProgram, toggleCall, toggleNotify, setDigest, resetAll } =
    useWatchPreferences();

  if (!hydrated) return null;

  const watchedCalls = prefs.callIds
    .map((callId) => {
      const call = findCall(callId);
      const program = call ? findProgram(call.programId) : undefined;
      return call && program ? { call, program } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);

  const notifyRows: { key: keyof NotifyPreferences; label: string }[] = [
    { key: "newCallMatchesOrg", label: ws.notifyNewCallOrg },
    { key: "callMatchesProject", label: ws.notifyCallProject },
    { key: "highRelevanceMatch", label: ws.notifyHighRelevance },
    { key: "deadlineApproaching", label: ws.notifyDeadline },
    { key: "commentOnApplication", label: ws.notifyComment },
    { key: "reportingDeadline", label: ws.notifyReportingDeadline },
  ];

  const digestOptions: { key: DigestFrequency; label: string }[] = [
    { key: "instant", label: ws.digestInstant },
    { key: "daily", label: ws.digestDaily },
    { key: "weekly", label: ws.digestWeekly },
  ];

  return (
    <>
      <Header />
      <main className="section max-w-2xl">
        <Link href="/installningar" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          {ws.back}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{ws.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{ws.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="shrink-0 rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50"
          >
            {ws.resetAll}
          </button>
        </div>

        <div className="mb-16 mt-8 space-y-6">
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

          <section className="rounded-xl border border-navy-100 bg-white p-6">
            <p className="text-sm font-semibold text-navy-800">{ws.notifyTitle}</p>
            <div className="mt-3 space-y-2">
              {notifyRows.map((row) => (
                <label key={row.key} className="flex items-center gap-2 text-sm text-navy-700">
                  <input type="checkbox" checked={prefs.notify[row.key]} onChange={() => toggleNotify(row.key)} />
                  {row.label}
                </label>
              ))}
            </div>

            <div className="mt-5 border-t border-navy-50 pt-4">
              <p className="text-sm font-semibold text-navy-800">{ws.digestTitle}</p>
              <div className="mt-2 flex gap-4">
                {digestOptions.map((opt) => (
                  <label key={opt.key} className="flex items-center gap-1.5 text-sm text-navy-700">
                    <input type="radio" name="digest" checked={prefs.digest === opt.key} onChange={() => setDigest(opt.key)} />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </section>

          <p className="text-xs text-navy-400">{ws.savedIndicator}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

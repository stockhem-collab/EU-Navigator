"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useWatchPreferences } from "@/lib/hooks/useWatchPreferences";
import { fundingCalls } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { computeMatchesForCall } from "@/lib/matching/portfolio";

const MATCH_THRESHOLD = 50;

export default function BevakningPage() {
  const { t, lang } = useLanguage();
  const bv = t.bevakning;
  const { all: projectBank } = useProjectBank();
  const { prefs, hydrated: watchHydrated } = useWatchPreferences();
  const [onlyWatched, setOnlyWatched] = useState(false);

  const rows = useMemo(
    () =>
      [...fundingCalls]
        .sort((a, b) => a.deadlineMonthsFromNow - b.deadlineMonthsFromNow)
        .map((call) => {
          const program = findProgram(call.programId);
          if (!program) return null;
          const matches = computeMatchesForCall(call, program, projectBank).filter(
            (m) => m.match.score >= MATCH_THRESHOLD
          );
          const isWatched =
            prefs.programIds.includes(program.id) || program.sectors.some((s) => prefs.sectors.includes(s));
          return { call, program, matches, isWatched };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    [projectBank, prefs]
  );

  const visibleRows = onlyWatched ? rows.filter((r) => r.isWatched) : rows;

  if (!watchHydrated) return null;

  return (
    <>
      <Header />
      <main className="section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{bv.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{bv.subtitle}</p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-navy-700">
            <input type="checkbox" checked={onlyWatched} onChange={(e) => setOnlyWatched(e.target.checked)} />
            {bv.onlyWatchedToggle}
          </label>
        </div>
        <p className="mt-3 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-600">{bv.disclaimer}</p>

        {visibleRows.length === 0 && <p className="mt-8 text-sm text-navy-500">{bv.noWatchedCalls}</p>}

        <div className="mt-8 space-y-4">
          {visibleRows.map(({ call, program, matches, isWatched }) => (
            <div key={call.id} className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-sm font-bold text-white">
                    {program.logoLetter}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase text-navy-400">{program.shortName}</p>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-navy-900">{lang === "sv" ? call.title_sv : call.title_en}</h2>
                      {isWatched && <span className="badge bg-gold-100 text-gold-800">{bv.watchedBadge}</span>}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`badge ${
                      call.status === "open" ? "bg-green-100 text-green-800" : "bg-navy-100 text-navy-600"
                    }`}
                  >
                    {bv.deadlineInMonths(call.deadlineMonthsFromNow)}
                  </span>
                  <div className="mt-2">
                    <Link
                      href={`/eu-databas/${program.id}/${call.id}`}
                      className="text-xs font-semibold text-navy-600 hover:text-navy-900"
                    >
                      {bv.viewCall} →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-navy-50 pt-4">
                {matches.length === 0 ? (
                  <p className="text-sm text-navy-500">{bv.noMatchingProjects}</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-navy-700">{bv.matchingProjectsLabel(matches.length)}</p>
                    <ul className="mt-2 space-y-2">
                      {matches.map(({ entry, match }) => (
                        <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                          <Link href={`/projektbank/${entry.id}`} className="text-navy-700 hover:underline">
                            {lang === "sv" ? entry.title_sv : entry.title_en}
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-navy-800">{match.score}%</span>
                            <Link
                              href={`/demo?project=${entry.id}&call=${call.id}`}
                              className="rounded-md bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-700"
                            >
                              {bv.startApplication}
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useWatchPreferences } from "@/lib/hooks/useWatchPreferences";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import { useAwardedProjects } from "@/lib/hooks/useAwardedProjects";
import { findProgram } from "@/lib/data/fundingPrograms";
import { computeMatchesForCall } from "@/lib/matching/portfolio";
import { FundingCall, FundingProgram } from "@/lib/types";

const MATCH_THRESHOLD = 50;

type CallRow = {
  call: FundingCall;
  program: FundingProgram;
  matches: ReturnType<typeof computeMatchesForCall>;
  isWatched: boolean;
};

export default function BevakningPage() {
  const { t, lang } = useLanguage();
  const bv = t.bevakning;
  const ap = t.awardedProjects;
  const { all: projectBank } = useProjectBank();
  const { all: fundingCalls } = useFundingCalls();
  const { all: awardedProjects } = useAwardedProjects();
  const { prefs, hydrated: watchHydrated, toggleCall, toggleReportingEvent } = useWatchPreferences();
  const { withSubmissions, hydrated: reportingHydrated } = useReportingSubmissions();
  const [onlyWatched, setOnlyWatched] = useState(false);
  const [showOtherCalls, setShowOtherCalls] = useState(false);

  const watchedReporting = prefs.reportingEventKeys
    .map((key) => {
      const [projectId, eventId] = key.split(":");
      const seedProject = awardedProjects.find((a) => a.id === projectId);
      if (!seedProject) return null;
      const project = withSubmissions(seedProject);
      const event = project.reportingEvents.find((e) => e.id === eventId);
      return event ? { key, project, event } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null)
    .sort((a, b) => a.event.deadlineMonthsFromNow - b.event.deadlineMonthsFromNow);

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
          // Only the two explicit, deliberate watch actions count as "mina
          // bevakningar" here — an individually starred call, or a whole
          // programme opted into under Inställningar → Bevakningar. Sector
          // interests (prefs.sectors) are a *broad* notification preference
          // that starts pre-populated with several sectors, so folding it in
          // here made "Visa endast mina bevakningar" show almost the whole
          // list regardless of what anyone had actually starred.
          const isWatched = prefs.callIds.includes(call.id) || prefs.programIds.includes(program.id);
          return { call, program, matches, isWatched };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    [projectBank, prefs, fundingCalls]
  );

  const visibleRows = onlyWatched ? rows.filter((r) => r.isWatched) : rows;

  // Same "recommended vs. lower relevance" split as the matching results in
  // Ansökningsstudion, for the same reason: as the call catalogue grows
  // (imports, new programmes), this list would otherwise become an
  // undifferentiated wall sorted only by deadline. "Relevant" here means
  // either a real portfolio match (>= MATCH_THRESHOLD) or a call the user
  // explicitly chose to watch — an explicit watch is a stronger signal than
  // the score and always earns a spot up front, even without a match yet.
  const relevant = visibleRows.filter((r) => r.matches.length > 0 || r.isWatched);
  const otherCalls = visibleRows.filter((r) => r.matches.length === 0 && !r.isWatched);

  if (!watchHydrated || !reportingHydrated) return null;

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

        {/* Watched reporting deadlines are a different kind of "bevakning"
            than a call's own deadline (they belong to an already-awarded
            project, not a catalogue entry) — surfaced here too, not only
            under Inställningar, so this page stays the one place to see
            everything a user is watching, not just half of it. */}
        <section className="mt-6">
          <h2 className="text-lg font-bold text-navy-800">{bv.reportingWatchTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{bv.reportingWatchHint}</p>
          {watchedReporting.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{bv.noReportingWatched}</p>
          ) : (
            <ul className="mt-3 space-y-2">
              {watchedReporting.map(({ key, project, event }) => (
                <li
                  key={key}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4"
                >
                  <Link href={`/projekt/${project.id}`} className="flex-1">
                    <p className="text-xs font-semibold uppercase text-navy-400">
                      {lang === "sv" ? project.title_sv : project.title_en}
                    </p>
                    <p className="font-semibold text-navy-800">{lang === "sv" ? event.periodLabel_sv : event.periodLabel_en}</p>
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${event.status === "revision-requested" ? "bg-amber-100 text-amber-800" : "bg-navy-100 text-navy-600"}`}>
                      {event.status === "revision-requested" ? ap.reportStatusRevisionRequested : ap.nextReportDue(event.deadlineMonthsFromNow)}
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleReportingEvent(key)}
                      className="text-xs font-semibold text-gold-700 hover:text-gold-800"
                    >
                      {ap.watchingReportButton}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {visibleRows.length === 0 && <p className="mt-8 text-sm text-navy-500">{bv.noWatchedCalls}</p>}

        {relevant.length > 0 ? (
          <div className="mt-8 border-t border-navy-100 pt-6">
            <h2 className="text-sm font-semibold uppercase text-navy-400">{bv.portfolioMatchSectionTitle}</h2>
            <div className="mt-3 space-y-4">
              {relevant.map((row) => (
                <CallCard key={row.call.id} row={row} watchedCallIds={prefs.callIds} onToggleCall={toggleCall} />
              ))}
            </div>
          </div>
        ) : (
          otherCalls.length > 0 && (
            <p className="mt-8 rounded-md bg-navy-50 px-4 py-3 text-sm text-navy-600">{bv.noPortfolioMatches}</p>
          )
        )}

        {otherCalls.length > 0 && (relevant.length === 0 || showOtherCalls) && (
          <div className="mt-8 border-t border-navy-100 pt-6">
            {relevant.length > 0 && (
              <h2 className="text-sm font-semibold uppercase text-navy-400">{bv.otherCallsSectionTitle(otherCalls.length)}</h2>
            )}
            <div className="mt-3 space-y-4">
              {otherCalls.map((row) => (
                <CallCard key={row.call.id} row={row} watchedCallIds={prefs.callIds} onToggleCall={toggleCall} />
              ))}
            </div>
          </div>
        )}

        {otherCalls.length > 0 && relevant.length > 0 && (
          <button
            type="button"
            onClick={() => setShowOtherCalls((v) => !v)}
            className="mt-6 text-sm font-semibold text-navy-600 hover:text-navy-900"
          >
            {showOtherCalls ? bv.hideOtherCallsButton : bv.showOtherCallsButton(otherCalls.length)}
          </button>
        )}
      </main>
      <Footer />
    </>
  );
}

function CallCard({
  row: { call, program, matches, isWatched },
  watchedCallIds,
  onToggleCall,
}: {
  row: CallRow;
  /** Passed down from the single useWatchPreferences() instance in the
   * parent, rather than a second call to the hook here — it's a plain
   * useState hook with no shared store across call sites, so a second
   * instance would desync from the parent's own `rows`/`relevant`
   * computation the moment this card's own toggle wrote to localStorage. */
  watchedCallIds: string[];
  onToggleCall: (callId: string) => void;
}) {
  const { t, lang } = useLanguage();
  const bv = t.bevakning;

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-6">
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
          <div className="mt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => onToggleCall(call.id)}
              className={`text-xs font-semibold ${
                watchedCallIds.includes(call.id) ? "text-gold-700 hover:text-gold-800" : "text-navy-500 hover:text-navy-800"
              }`}
            >
              {watchedCallIds.includes(call.id) ? bv.watchingCallButton : bv.watchCallButton}
            </button>
            <Link href={`/eu-databas/${program.id}/${call.id}`} className="text-xs font-semibold text-navy-600 hover:text-navy-900">
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
  );
}

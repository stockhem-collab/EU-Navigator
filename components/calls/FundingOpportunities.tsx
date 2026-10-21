"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { ProjectBankEntry } from "@/lib/types";
import { useWatchPreferences } from "@/lib/hooks/useWatchPreferences";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { callDeadlineMonths, isCallOutdated } from "@/lib/data/fundingCalls";
import OutdatedCallsToggle from "@/components/calls/OutdatedCallsToggle";
import { useShowOutdatedCalls } from "@/lib/hooks/useShowOutdatedCalls";
import CallStatusBadge from "@/components/calls/CallStatusBadge";
import { findProgram } from "@/lib/data/fundingPrograms";
import { computeMatchesForCall } from "@/lib/matching/portfolio";
import { FundingCall, FundingProgram } from "@/lib/types";

const MATCH_THRESHOLD = 50;
/** Calls shown as full cards; the rest of the matching calls are rows in
 * a compact list, opened on request. */
const CARDS_SHOWN = 5;

type CallRow = {
  call: FundingCall;
  program: FundingProgram;
  matches: ReturnType<typeof computeMatchesForCall>;
  isWatched: boolean;
};

// "Hitta finansiering" under Ansöka (formerly the Bevakning tab): open and
// upcoming calls, which of the organisation's projects fit each one, and
// the calls the user has chosen to watch. Watching a call is also what
// makes its deadlines and changes show up among the notifications.
/** `projects`: which of the organisation's projects to match against —
 * all of them unless the page narrows it (Ansöka's "Visa endast mina och
 * delade projekt"). */
export default function FundingOpportunities({ projects }: { projects?: ProjectBankEntry[] } = {}) {
  const { t } = useLanguage();
  const bv = t.bevakning;
  const { all: allProjects } = useProjectBank();
  const projectBank = projects ?? allProjects;
  const { all: fundingCalls } = useFundingCalls();
  const { prefs, hydrated: watchHydrated, toggleCall } = useWatchPreferences();
  const [onlyWatched, setOnlyWatched] = useState(false);
  const [showOtherCalls, setShowOtherCalls] = useState(false);
  const [showAllRelevant, setShowAllRelevant] = useState(false);
  const { show: showOutdated, setShow: setShowOutdated } = useShowOutdatedCalls();
  const outdatedCount = fundingCalls.filter((call) => isCallOutdated(call)).length;

  const rows = useMemo(
    () =>
      [...fundingCalls]
        .filter((call) => showOutdated || !isCallOutdated(call))
        .sort((a, b) => callDeadlineMonths(a) - callDeadlineMonths(b))
        .map((call) => {
          const program = findProgram(call.programId);
          if (!program) return null;
          const matches = computeMatchesForCall(call, program, projectBank).filter(
            (m) => m.match.score >= MATCH_THRESHOLD
          );
          // Only the two explicit, deliberate watch actions count as "mina
          // bevakningar" here — an individually starred call, or a whole
          // programme opted into under Inställningar → Aviseringar. Sector
          // interests (prefs.sectors) are a broad preference that starts
          // pre-populated, so folding them in would mark almost every call.
          const isWatched = prefs.callIds.includes(call.id) || prefs.programIds.includes(program.id);
          return { call, program, matches, isWatched };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    [projectBank, prefs, fundingCalls, showOutdated]
  );

  const visibleRows = onlyWatched ? rows.filter((r) => r.isWatched) : rows;

  // Recommended up front, the rest collapsed: "relevant" means a real
  // portfolio match (>= MATCH_THRESHOLD) or a call the user explicitly
  // chose to watch — an explicit watch always earns a spot up front.
  const relevant = visibleRows.filter((r) => r.matches.length > 0 || r.isWatched);
  const otherCalls = visibleRows.filter((r) => r.matches.length === 0 && !r.isWatched);

  if (!watchHydrated) return null;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-navy-500">{bv.subtitle}</p>
        <div className="flex flex-wrap items-center gap-4">
          <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-navy-700">
            <input type="checkbox" checked={onlyWatched} onChange={(e) => setOnlyWatched(e.target.checked)} />
            {bv.onlyWatchedToggle}
          </label>
          <OutdatedCallsToggle count={outdatedCount} show={showOutdated} onChange={setShowOutdated} />
        </div>
      </div>

      {visibleRows.length === 0 && <p className="mt-6 text-sm text-navy-500">{bv.noWatchedCalls}</p>}

      {relevant.length > 0 ? (
        <div className="mt-4">
          <h3 className="text-sm font-semibold uppercase text-navy-400">{bv.portfolioMatchSectionTitle}</h3>
          <div className="mt-3 space-y-4">
            {relevant.slice(0, CARDS_SHOWN).map((row) => (
              <CallCard key={row.call.id} row={row} watchedCallIds={prefs.callIds} onToggleCall={toggleCall} />
            ))}
          </div>
          {relevant.length > CARDS_SHOWN &&
            (showAllRelevant ? (
              <ul className="mt-4 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white" data-testid="more-matching-calls">
                {relevant.slice(CARDS_SHOWN).map((row) => (
                  <CallListItem key={row.call.id} row={row} />
                ))}
              </ul>
            ) : (
              <button
                type="button"
                onClick={() => setShowAllRelevant(true)}
                className="mt-4 w-full rounded-xl border border-dashed border-navy-200 bg-white py-2.5 text-sm font-semibold text-navy-600 transition hover:bg-navy-50"
              >
                {bv.showMoreMatchingCalls(relevant.length - CARDS_SHOWN)}
              </button>
            ))}
        </div>
      ) : (
        otherCalls.length > 0 && (
          <p className="mt-4 rounded-md bg-navy-50 px-4 py-3 text-sm text-navy-600">{bv.noPortfolioMatches}</p>
        )
      )}

      {otherCalls.length > 0 && (relevant.length === 0 || showOtherCalls) && (
        <div className="mt-6">
          {relevant.length > 0 && (
            <h3 className="text-sm font-semibold uppercase text-navy-400">{bv.otherCallsSectionTitle(otherCalls.length)}</h3>
          )}
          {relevant.length === 0 ? (
            <div className="mt-3 space-y-4">
              {otherCalls.map((row) => (
                <CallCard key={row.call.id} row={row} watchedCallIds={prefs.callIds} onToggleCall={toggleCall} />
              ))}
            </div>
          ) : (
            <ul className="mt-3 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
              {otherCalls.map((row) => (
                <CallListItem key={row.call.id} row={row} />
              ))}
            </ul>
          )}
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
    </div>
  );
}

// One line per call in the compact list: the call, its deadline and the
// best-matching project with a way to start applying.
function CallListItem({ row: { call, program, matches, isWatched } }: { row: CallRow }) {
  const { t, lang } = useLanguage();
  const bv = t.bevakning;
  const best = matches[0];
  return (
    <li className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase text-navy-400">
          {program.shortName}
          {isWatched && <span className="ml-2 normal-case text-gold-700">{bv.watchedBadge}</span>}
        </p>
        <Link href={`/eu-databas/${program.id}/${call.id}`} className="text-sm font-semibold text-navy-800 hover:underline">
          {lang === "sv" ? call.title_sv : call.title_en}
        </Link>
        {best && (
          <p className="mt-0.5 text-xs text-navy-500">
            {lang === "sv" ? best.entry.title_sv : best.entry.title_en} · {best.match.score}%
            {matches.length > 1 && ` · ${bv.moreMatchingProjects(matches.length - 1)}`}
          </p>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-3">
        <span className="text-xs text-navy-500">{bv.deadlineInMonths(callDeadlineMonths(call))}</span>
        {best && (
          <Link
            href={`/ansokan?project=${best.entry.id}&call=${call.id}`}
            className="rounded-md bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-700"
          >
            {bv.startApplication}
          </Link>
        )}
      </div>
    </li>
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
              <h4 className="font-bold text-navy-900">{lang === "sv" ? call.title_sv : call.title_en}</h4>
              {isWatched && <span className="badge bg-gold-100 text-gold-800">{bv.watchedBadge}</span>}
              {call.status === "upcoming" && <CallStatusBadge call={call} />}
            </div>
          </div>
        </div>
        <div className="text-right">
          <span
            className={`badge ${
              call.status === "open" ? "bg-green-100 text-green-800" : "bg-navy-100 text-navy-600"
            }`}
          >
            {bv.deadlineInMonths(callDeadlineMonths(call))}
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
                  <Link href={`/projekt/${entry.id}`} className="text-navy-700 hover:underline">
                    {lang === "sv" ? entry.title_sv : entry.title_en}
                  </Link>
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-navy-800">{match.score}%</span>
                    <Link
                      href={`/ansokan?project=${entry.id}&call=${call.id}`}
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

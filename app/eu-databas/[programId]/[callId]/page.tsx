"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { findProgram } from "@/lib/data/fundingPrograms";
import { applicantTypeLabel, documentTypeLabel, callDeadlineMonths } from "@/lib/data/fundingCalls";
import CallStatusBadge, { CallDates, GrantRangeText } from "@/components/calls/CallStatusBadge";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { fundedProjectsForProgram, computeProgramStats } from "@/lib/data/fundedProjects";
import { topKeywords } from "@/lib/matching/patternAnalysis";
import { useWatchPreferences } from "@/lib/hooks/useWatchPreferences";
import { fmtSEK } from "@/lib/format";
import { activityTypeLabel, regionLabel, targetGroupLabel } from "@/lib/data/matchingVocabulary";

export default function CallDetailPage() {
  const params = useParams<{ programId: string; callId: string }>();
  const { t, lang } = useLanguage();
  const db = t.euDatabase;
  const bv = t.bevakning;
  const ap = t.grants;
  const { prefs, toggleCall } = useWatchPreferences();
  // A call added via Datacenter's import tool only exists in this browser's
  // localStorage, which isn't available during the server render — so
  // "not found" can't be decided until the hook has actually checked the
  // client (same reasoning as projektbank/[id]'s imported-entry handling).
  const { all: fundingCalls, hydrated } = useFundingCalls();

  const program = findProgram(params.programId);
  const call = fundingCalls.find((c) => c.id === params.callId);
  if (!program || !call || call.programId !== program.id) {
    if (!hydrated) return null;
    return notFound();
  }

  const refProjects = fundedProjectsForProgram(program.id);
  const stats = computeProgramStats(refProjects);
  const patterns = topKeywords(refProjects);

  // The root EU-databas listing links straight here, skipping the
  // programme page, whenever this programme has only one call (see
  // app/eu-databas/page.tsx) — so "back" needs to return there too,
  // not to a programme page the person never actually visited. A
  // programme with several calls still routes through its own page,
  // where "back" correctly means "back to that list of calls".
  const otherCallsInProgram = fundingCalls.some((c) => c.programId === program.id && c.id !== call.id);

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <Link
          href={otherCallsInProgram ? `/eu-databas/${program.id}` : "/eu-databas"}
          className="text-sm font-semibold text-navy-600 hover:text-navy-900"
        >
          ← {otherCallsInProgram ? db.backToProgram : db.backToPrograms}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-navy-400">{program.shortName}</p>
            <h1 className="mt-1 text-2xl font-bold text-navy-900">{lang === "sv" ? call.title_sv : call.title_en}</h1>
            {call.extractionSource === "assisted-import" && (
              <p className="mt-1 text-xs italic text-navy-400">{t.callImport.provenanceAssisted}</p>
            )}
          </div>
          <div className="flex shrink-0 flex-col items-end gap-2">
            <CallStatusBadge call={call} />
            <button
              type="button"
              onClick={() => toggleCall(call.id)}
              className={`text-xs font-semibold ${
                prefs.callIds.includes(call.id) ? "text-gold-700 hover:text-gold-800" : "text-navy-500 hover:text-navy-800"
              }`}
            >
              {prefs.callIds.includes(call.id) ? bv.watchingCallButton : bv.watchCallButton}
            </button>
          </div>
        </div>

        <dl className="mt-6 grid gap-4 rounded-xl border border-navy-100 bg-white p-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{db.deadlineLabel}</dt>
            <dd className="mt-1 font-bold text-navy-900">{db.deadlineIn(callDeadlineMonths(call))}</dd>
            {call.opens || call.closes ? (
              <dd className="text-xs text-navy-500">
                <CallDates call={call} />
              </dd>
            ) : (
              call.deadlineDate && <dd className="text-xs text-navy-500">{call.deadlineDate}</dd>
            )}
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{db.budgetLabel}</dt>
            <dd className="mt-1 font-bold text-navy-900">
              {call.budgetTotalSEK > 0 ? fmtSEK(call.budgetTotalSEK, lang) : t.imported.grantNotStated}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{db.grantRangeLabel}</dt>
            <dd className="mt-1 font-bold text-navy-900">
              <GrantRangeText call={call} />
            </dd>
            <dd className="text-xs text-navy-500">
              {db.fundingRateLabel(Math.round((call.coFinancingRate ?? program.typicalCoFinancingRate) * 100))}
            </dd>
          </div>
        </dl>

        {(call.description_sv || call.comment_sv || call.link) && (
          <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6" data-testid="call-list-details">
            <h2 className="text-sm font-semibold uppercase text-navy-400">{t.imported.callFromList}</h2>
            {call.description_sv && <p className="mt-2 text-sm text-navy-700">{call.description_sv}</p>}
            {call.comment_sv && (
              <p className="mt-2 text-sm text-navy-600">
                <span className="font-semibold">{t.imported.callComment}:</span> {call.comment_sv}
              </p>
            )}
            {call.link && (
              <a href={call.link} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block text-sm font-semibold text-navy-600 hover:text-navy-900">
                {t.imported.callSourceLink} ↗
              </a>
            )}
          </section>
        )}

        <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-navy-400">{db.eligibleApplicantsTitle}</h2>
          <p className="mt-2 text-sm text-navy-700">
            {lang === "sv" ? call.eligibleApplicants_sv : call.eligibleApplicants_en}
          </p>
          {call.applicantTypes && call.applicantTypes.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {call.applicantTypes.map((type) => (
                <span key={type} className="badge bg-navy-50 text-navy-700">
                  {applicantTypeLabel(type, lang)}
                </span>
              ))}
            </div>
          )}
          {call.requiresPartnership && (
            <p className="mt-3 text-sm text-navy-700">{db.minPartnerCountriesLabel(call.minPartnerCountries ?? 2)}</p>
          )}
          {(
            [
              [db.activityTypesLabel, (call.activityTypes ?? []).map((a) => activityTypeLabel(a, lang))],
              [db.targetGroupsLabel, (call.targetGroups ?? []).map((g) => targetGroupLabel(g, lang))],
              [db.eligibleRegionsLabel, (call.eligibleRegions ?? []).map(regionLabel)],
            ] as [string, string[]][]
          )
            .filter(([, values]) => values.length > 0)
            .map(([label, values]) => (
              <div key={label} className="mt-3">
                <p className="text-xs font-semibold uppercase text-navy-400">{label}</p>
                <div className="mt-1 flex flex-wrap gap-2">
                  {values.map((v) => (
                    <span key={v} className="badge bg-navy-50 text-navy-700">
                      {v}
                    </span>
                  ))}
                </div>
              </div>
            ))}
        </section>

        <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-navy-400">{db.prioritiesTitle}</h2>
          <ul className="mt-2 space-y-1.5">
            {(lang === "sv" ? call.priorities_sv : call.priorities_en).map((p) => (
              <li key={p} className="text-sm text-navy-700">
                · {p}
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-navy-400">{db.evaluationCriteriaTitle}</h2>
          <div className="mt-3 space-y-2">
            {call.evaluationCriteria.map((c) => (
              <div key={c.name_sv} className="flex items-center gap-3">
                <span className="w-40 shrink-0 text-sm text-navy-700">{lang === "sv" ? c.name_sv : c.name_en}</span>
                <div className="h-2 flex-1 rounded-full bg-navy-100">
                  <div
                    className="h-2 rounded-full bg-navy-700"
                    style={{ width: `${c.maxPoints}%` }}
                  />
                </div>
                <span className="w-16 shrink-0 text-right text-sm font-semibold text-navy-800">
                  {c.maxPoints} p
                </span>
              </div>
            ))}
          </div>
        </section>

        <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-navy-400">{db.documentsTitle}</h2>
          <ul className="mt-3 divide-y divide-navy-50">
            {call.documents.map((d) => (
              <li key={d.id} className="flex flex-wrap items-center justify-between gap-3 py-2 text-sm">
                <span className="flex items-center gap-2">
                  <span className="badge bg-navy-50 text-navy-500">{documentTypeLabel(d.type, lang)}</span>
                  <span className="text-navy-700">{lang === "sv" ? d.title_sv : d.title_en}</span>
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-navy-400">{db.documentUpdated(d.updatedAt)}</span>
                  {d.needsUpdate && <span className="badge bg-amber-100 text-amber-800">{db.documentNeedsUpdate}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {call.reportingRequirements && (
          <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase text-navy-400">{ap.reportingRequirementsTitle}</h2>
            <p className="mt-1 text-xs text-navy-400">{db.reportingRequirementsHint}</p>
            <dl className="mt-3">
              <dt className="text-xs text-navy-400">{ap.periodicityLabel}</dt>
              <dd className="font-semibold text-navy-800">
                {call.reportingRequirements.periodicity === "quarterly"
                  ? ap.periodicityQuarterly
                  : call.reportingRequirements.periodicity === "biannual"
                  ? ap.periodicityBiannual
                  : ap.periodicityAnnual}
              </dd>
            </dl>
            <p className="mt-3 text-sm text-navy-600">
              {ap.interimReportsRequiredLabel(call.reportingRequirements.interimReportsRequired)}
            </p>
            {call.reportingRequirements.requiresAuditAboveSEK !== null && (
              <p className="mt-3 text-sm text-navy-600">
                {ap.auditRequiredAboveLabel} {fmtSEK(call.reportingRequirements.requiresAuditAboveSEK, lang)}
              </p>
            )}
          </section>
        )}

        {refProjects.length > 0 && (
          <section className="mt-6 rounded-xl border border-navy-100 bg-navy-800 p-6 text-white">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-bold">{t.referenceProjects.statsTitle}</h2>
              <Link
                href={`/referensprojekt?program=${program.id}`}
                className="rounded-md bg-white/10 px-3 py-1.5 text-xs font-semibold hover:bg-white/20"
              >
                {db.learnFromWinnersButton}
              </Link>
            </div>
            <p className="mt-1 text-sm text-navy-300">{t.referenceProjects.statsIntro(stats.total)}</p>
            <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-3">
              <div>
                <p className="text-2xl font-bold text-gold-300">{stats.ownerSharePct}%</p>
                <p className="text-navy-300">{t.referenceProjects.statOwnerShare}</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-gold-300">
                  {stats.avgBudgetSEK !== null ? fmtSEK(stats.avgBudgetSEK, lang) : "–"}
                </p>
                <p className="text-navy-300">{t.referenceProjects.statAvgBudget}</p>
              </div>
              <div>
                <p className="text-lg font-bold text-gold-300">{(lang === "sv" ? stats.topTheme_sv : stats.topTheme_en) ?? "–"}</p>
                <p className="text-navy-300">{t.referenceProjects.statTopTheme}</p>
              </div>
            </div>
          </section>
        )}

        <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-navy-400">{db.patternTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{db.patternIntro}</p>
          {patterns.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{db.patternNone}</p>
          ) : (
            <div className="mt-3 flex flex-wrap gap-2">
              {patterns.map((k) => (
                <span key={k.word} className="badge bg-navy-50 text-navy-700">
                  {k.word} · {k.count}
                </span>
              ))}
            </div>
          )}
        </section>

        <Link
          href={`/ansokan?call=${call.id}`}
          className="mt-8 inline-block rounded-md bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400"
        >
          {db.helpMeApplyButton}
        </Link>
      </main>
      <Footer />
    </>
  );
}

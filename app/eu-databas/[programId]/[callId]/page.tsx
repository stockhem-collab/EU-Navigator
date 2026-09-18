"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { findProgram } from "@/lib/data/fundingPrograms";
import { findCall } from "@/lib/data/fundingCalls";
import { fundedProjectsForProgram, computeProgramStats } from "@/lib/data/fundedProjects";
import { topKeywords } from "@/lib/matching/patternAnalysis";
import { fmtSEK } from "@/lib/format";

export default function CallDetailPage() {
  const params = useParams<{ programId: string; callId: string }>();
  const { t, lang } = useLanguage();
  const db = t.euDatabase;

  const program = findProgram(params.programId);
  const call = findCall(params.callId);
  if (!program || !call || call.programId !== program.id) return notFound();

  const refProjects = fundedProjectsForProgram(program.id);
  const stats = computeProgramStats(refProjects);
  const patterns = topKeywords(refProjects);

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <Link href={`/eu-databas/${program.id}`} className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          ← {db.backToProgram}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase text-navy-400">{program.shortName}</p>
            <h1 className="mt-1 text-2xl font-bold text-navy-900">{lang === "sv" ? call.title_sv : call.title_en}</h1>
          </div>
          <span
            className={`badge ${call.status === "open" ? "bg-green-100 text-green-800" : "bg-navy-100 text-navy-600"}`}
          >
            {call.status === "open" ? db.statusOpen : db.statusUpcoming}
          </span>
        </div>

        <dl className="mt-6 grid gap-4 rounded-xl border border-navy-100 bg-white p-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{db.deadlineLabel}</dt>
            <dd className="mt-1 font-bold text-navy-900">{db.deadlineIn(call.deadlineMonthsFromNow)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{db.budgetLabel}</dt>
            <dd className="mt-1 font-bold text-navy-900">{fmtSEK(call.budgetTotalSEK, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{db.grantRangeLabel}</dt>
            <dd className="mt-1 font-bold text-navy-900">
              {fmtSEK(call.minGrantSEK, lang)}–{fmtSEK(call.maxGrantSEK, lang)}
            </dd>
          </div>
        </dl>

        <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-navy-400">{db.eligibleApplicantsTitle}</h2>
          <p className="mt-2 text-sm text-navy-700">
            {lang === "sv" ? call.eligibleApplicants_sv : call.eligibleApplicants_en}
          </p>
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
              <li key={d.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span className="text-navy-700">{lang === "sv" ? d.title_sv : d.title_en}</span>
                <span className="flex items-center gap-3">
                  <span className="text-xs text-navy-400">{db.documentUpdated(d.updatedAt)}</span>
                  {d.needsUpdate && <span className="badge bg-amber-100 text-amber-800">{db.documentNeedsUpdate}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>

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
          href={`/demo?call=${call.id}`}
          className="mt-8 inline-block rounded-md bg-gold-500 px-6 py-3 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400"
        >
          {db.helpMeApplyButton}
        </Link>
      </main>
      <Footer />
    </>
  );
}

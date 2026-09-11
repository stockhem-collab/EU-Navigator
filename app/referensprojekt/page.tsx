"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms, findProgram } from "@/lib/data/fundingPrograms";
import { referenceProjects, computeProgramStats } from "@/lib/data/referenceProjects";
import { fmtSEK } from "@/lib/format";

export default function ReferenceProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ReferenceProjectsInner />
    </Suspense>
  );
}

function ReferenceProjectsInner() {
  const searchParams = useSearchParams();
  const initialProgram = searchParams.get("program") ?? "all";
  const [programFilter, setProgramFilter] = useState(initialProgram);
  const { t, lang } = useLanguage();
  const rp = t.referenceProjects;

  const filtered = useMemo(
    () => (programFilter === "all" ? referenceProjects : referenceProjects.filter((p) => p.programId === programFilter)),
    [programFilter]
  );
  const stats = computeProgramStats(filtered);

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{rp.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{rp.subtitle}</p>
        <p className="mt-3 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-700">{rp.disclaimer}</p>

        <div className="mt-6">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            <option value="all">{rp.filterAll}</option>
            {fundingPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "sv" ? p.name_sv : p.name}
              </option>
            ))}
          </select>
        </div>

        <section className="mt-6 rounded-xl bg-navy-800 p-6 text-white">
          <h2 className="font-bold">{rp.statsTitle}</h2>
          <p className="mt-1 text-sm text-navy-300">{rp.statsIntro(stats.total)}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-gold-300">{stats.ownerSharePct}%</p>
              <p className="text-navy-300">{rp.statOwnerShare}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-300">
                {stats.avgBudgetSEK !== null ? fmtSEK(stats.avgBudgetSEK, lang) : "–"}
              </p>
              <p className="text-navy-300">{rp.statAvgBudget}</p>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <p className="text-lg font-bold text-gold-300">{stats.topTheme ?? "–"}</p>
              <p className="text-navy-300">{rp.statTopTheme}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-navy-300">{rp.statCurrentVsLegacy(stats.currentCount, stats.legacyCount)}</p>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {filtered.map((project) => {
            const program = findProgram(project.programId);
            return (
              <div key={project.id} className="flex flex-col rounded-xl border border-navy-100 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase text-navy-400">{program?.shortName ?? project.fundName}</p>
                  {project.period === "2014-2020" && (
                    <span className="badge bg-navy-100 text-navy-500">{rp.periodLegacyBadge}</span>
                  )}
                </div>
                <h3 className="mt-1 font-bold text-navy-900">{project.title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-navy-600">{project.description_sv}</p>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-navy-50 pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldRole}</dt>
                    <dd className="font-semibold text-navy-800">{project.role === "owner" ? rp.roleOwner : rp.rolePartner}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldPeriod}</dt>
                    <dd className="font-semibold text-navy-800">{project.periodLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldBudget}</dt>
                    <dd className="font-semibold text-navy-800">
                      {project.totalBudgetSEK !== null ? fmtSEK(project.totalBudgetSEK, lang) : rp.noBudgetDisclosed}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldEuFunding}</dt>
                    <dd className="font-semibold text-navy-800">
                      {project.euFundingSEK !== null ? fmtSEK(project.euFundingSEK, lang) : rp.noBudgetDisclosed}
                    </dd>
                  </div>
                </dl>

                {project.indicators && project.indicators.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-navy-50 pt-4">
                    {project.indicators.map((ind) => (
                      <div key={ind.label_sv} className="flex items-center justify-between text-sm">
                        <span className="text-navy-600">{lang === "sv" ? ind.label_sv : ind.label_en}</span>
                        <span className="font-semibold text-navy-800">
                          {ind.actual.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")}
                          {" / "}
                          {lang === "sv" ? "mål" : "target"} {ind.target.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")}{" "}
                          {lang === "sv" ? ind.unit_sv : ind.unit_en}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}

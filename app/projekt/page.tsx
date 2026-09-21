"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { awardedProjects } from "@/lib/data/awardedProjects";
import { fundingCalls, findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { computeBestMatchForEntry } from "@/lib/matching/portfolio";
import { fmtSEK } from "@/lib/format";
import { PROJECT_STATUS_ORDER, ProjectStatus } from "@/lib/types";

export default function MyProjectsPage() {
  return (
    <Suspense fallback={null}>
      <MyProjectsPageInner />
    </Suspense>
  );
}

function isProjectStatus(value: string | null): value is ProjectStatus {
  return PROJECT_STATUS_ORDER.includes(value as ProjectStatus);
}

function MyProjectsPageInner() {
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const ap = t.awardedProjects;
  const ov = t.oversikt;

  const { all: projectBank } = useProjectBank();

  // Arriving from Översikt's "Projekt per status" tiles (?status=...) opens
  // this page pre-filtered to that status, so the two views show exactly
  // the same slice of the portfolio rather than requiring the user to
  // re-apply the filter by hand.
  const initialStatus = searchParams.get("status");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    isProjectStatus(initialStatus) ? initialStatus : "all"
  );

  const rows = useMemo(
    () =>
      projectBank
        .map((entry) => ({ entry, match: computeBestMatchForEntry(entry, fundingCalls) }))
        .sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1)),
    [projectBank]
  );

  const statusCounts = useMemo(() => {
    const counts = new Map<ProjectStatus, number>();
    for (const p of projectBank) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
    return counts;
  }, [projectBank]);

  const filteredRows = statusFilter === "all" ? rows : rows.filter((r) => r.entry.status === statusFilter);

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{ap.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{ap.subtitle}</p>

        {/* Same breakdown as Översikt's "Projekt per status" — each tile
            doubles as the filter for the project list right below it. */}
        <section className="mt-8">
          <h2 className="text-lg font-bold text-navy-800">{ov.sectionStatusBreakdown}</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <button
              type="button"
              onClick={() => setStatusFilter("all")}
              className={`rounded-xl border p-4 text-left transition ${
                statusFilter === "all" ? "border-navy-800 bg-navy-800 text-white" : "border-navy-100 bg-white hover:border-navy-300"
              }`}
            >
              <p className={`text-2xl font-extrabold ${statusFilter === "all" ? "text-white" : "text-navy-900"}`}>
                {projectBank.length}
              </p>
              <p className={`text-xs ${statusFilter === "all" ? "text-navy-200" : "text-navy-500"}`}>{ap.statusFilterAll}</p>
            </button>
            {PROJECT_STATUS_ORDER.map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  onClick={() => setStatusFilter(active ? "all" : status)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active ? "border-navy-800 bg-navy-800 text-white" : "border-navy-100 bg-white hover:border-navy-300"
                  }`}
                >
                  <p className={`text-2xl font-extrabold ${active ? "text-white" : "text-navy-900"}`}>
                    {statusCounts.get(status) ?? 0}
                  </p>
                  <p className={`text-xs ${active ? "text-navy-200" : "text-navy-500"}`}>{t.projectBank.statusLabels[status]}</p>
                </button>
              );
            })}
          </div>

          <div className="mt-4 space-y-2">
            {filteredRows.map(({ entry, match }) => {
              const missing = lang === "sv" ? entry.missingFields_sv : entry.missingFields_en;
              return (
                <div key={entry.id} className="rounded-xl border border-navy-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={`/projektbank/${entry.id}`} className="font-semibold text-navy-800 hover:underline">
                      {lang === "sv" ? entry.title_sv : entry.title_en}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={entry.status} />
                      {match && (
                        <span className="badge bg-navy-100 text-navy-700">
                          {match.score}% · {match.program.shortName}
                        </span>
                      )}
                    </div>
                  </div>
                  {missing.length > 0 && (
                    <p className="mt-2 text-xs text-amber-700">⚠ {ov.fieldsMissingForBestMatch(missing.length)}</p>
                  )}
                </div>
              );
            })}
            {filteredRows.length === 0 && <p className="text-sm text-navy-500">{ap.noProjectsForStatus}</p>}
          </div>
        </section>

        <section className="mb-16 mt-10 border-t border-navy-100 pt-8">
          <h2 className="text-lg font-bold text-navy-800">{ap.reportingSectionTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{ap.reportingSectionSubtitle}</p>

          <div className="mt-4 space-y-5">
            {awardedProjects.map((project) => {
              const call = findCall(project.callId);
              const program = call ? findProgram(call.programId) : undefined;
              return (
                <Link
                  key={project.id}
                  href={`/projekt/${project.id}`}
                  className="block rounded-xl border border-navy-100 bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {program && (
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-xs font-bold text-white">
                          {program.logoLetter}
                        </span>
                      )}
                      <h3 className="font-bold text-navy-900">
                        {lang === "sv" ? project.title_sv : project.title_en}
                      </h3>
                    </div>
                    <span className="badge bg-navy-100 text-navy-600">
                      {ap.nextReportDue(project.nextReportDueMonthsFromNow)}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-navy-500">
                    {ap.awardedAmount}: <span className="font-semibold text-navy-800">{fmtSEK(project.awardedAmountSEK, lang)}</span>
                  </p>
                </Link>
              );
            })}
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

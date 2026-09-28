"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import LinkedReportingBadge from "@/components/LinkedReportingBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { nextActionableReport, reportingHealth } from "@/lib/data/awardedProjects";
import { useAwardedProjects } from "@/lib/hooks/useAwardedProjects";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { findCall } from "@/lib/data/fundingCalls";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { CURRENT_USER_ID, isProjectRelevantToUser, orgUnits as seedOrgUnits } from "@/lib/data/users";
import { computeBestMatchForEntry } from "@/lib/matching/portfolio";
import { fmtSEK } from "@/lib/format";
import { PROJECT_STATUS_ORDER, ProjectBankEntry, ProjectStatus } from "@/lib/types";

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
  const { all: fundingCalls } = useFundingCalls();
  const { all: awardedProjects } = useAwardedProjects();
  const { withSubmissions } = useReportingSubmissions();
  const { users } = useUsersDirectory();
  const { config: orgConfig } = useOrgConfig();

  const orgUnitsAll = orgConfig.units ?? seedOrgUnits;
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID);

  // A project counts as "mine" once it has a role assignment for the
  // current user, or has been explicitly shared with an org unit that
  // reaches the current user's own unit (sharing with the whole
  // organisation reaches everyone; sharing with a department reaches only
  // that department) — see the Projektbank entry's own "Dela projekt".
  const isRelevantToMe = (entry: ProjectBankEntry) => isProjectRelevantToUser(entry, currentUser, orgUnitsAll);

  // Arriving from Översikt's "Projekt per status" tiles (?status=...) opens
  // this page pre-filtered to that status, so the two views show exactly
  // the same slice of the portfolio rather than requiring the user to
  // re-apply the filter by hand.
  const initialStatus = searchParams.get("status");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    isProjectStatus(initialStatus) ? initialStatus : "all"
  );
  const [onlyMineAndShared, setOnlyMineAndShared] = useState(false);

  const rows = useMemo(
    () =>
      projectBank
        .map((entry) => ({ entry, match: computeBestMatchForEntry(entry, fundingCalls) }))
        .sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1)),
    [projectBank, fundingCalls]
  );

  // Scoped by the same "mina och delade" filter as the list below, so the
  // tiles' counts always add up to what's actually shown rather than
  // advertising projects the filtered list then hides.
  const scopedProjectBank = onlyMineAndShared ? projectBank.filter(isRelevantToMe) : projectBank;

  const statusCounts = useMemo(() => {
    const counts = new Map<ProjectStatus, number>();
    for (const p of scopedProjectBank) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
    return counts;
  }, [scopedProjectBank]);

  const filteredRows = rows
    .filter((r) => statusFilter === "all" || r.entry.status === statusFilter)
    .filter((r) => !onlyMineAndShared || isRelevantToMe(r.entry));

  return (
    <>
      <Header />
      <main className="section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{ap.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{ap.subtitle}</p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-navy-700">
            <input
              type="checkbox"
              checked={onlyMineAndShared}
              onChange={(e) => setOnlyMineAndShared(e.target.checked)}
            />
            {ap.onlyMineAndSharedToggle}
          </label>
        </div>

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
                {scopedProjectBank.length}
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
              const linkedAwarded = awardedProjects.find((a) => a.projectBankEntryId === entry.id);
              return (
                <div key={entry.id} className="rounded-xl border border-navy-100 bg-white p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <Link href={`/projektbank/${entry.id}`} className="font-semibold text-navy-800 hover:underline">
                      {lang === "sv" ? entry.title_sv : entry.title_en}
                    </Link>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={entry.status} />
                      {linkedAwarded && <LinkedReportingBadge project={withSubmissions(linkedAwarded)} />}
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
            {awardedProjects.map((seedProject) => {
              const project = withSubmissions(seedProject);
              const call = findCall(project.callId);
              const program = call ? findProgram(call.programId) : undefined;
              const nextReport = nextActionableReport(project);
              const health = reportingHealth(project);
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
                    <div className="flex items-center gap-2">
                      {health === "attention" && <span className="badge bg-gold-100 text-gold-800">{ap.healthAttentionLabel}</span>}
                      <span className={`badge ${health === "blocked" ? "bg-amber-100 text-amber-800" : "bg-navy-100 text-navy-600"}`}>
                        {nextReport
                          ? nextReport.status === "revision-requested"
                            ? ap.reportStatusRevisionRequested
                            : ap.nextReportDue(nextReport.deadlineMonthsFromNow)
                          : ap.reportingCompleteLabel}
                      </span>
                    </div>
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

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import LinkedReportingBadge from "@/components/LinkedReportingBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useOngoingApplications } from "@/lib/hooks/useOngoingApplications";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import { useProjectTasks } from "@/lib/hooks/useProjectTasks";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useAwardedProjects } from "@/lib/hooks/useAwardedProjects";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { findCall } from "@/lib/data/fundingCalls";
import { nextActionableReport } from "@/lib/data/awardedProjects";
import { findProgram } from "@/lib/data/fundingPrograms";
import { CURRENT_USER_ID, isProjectRelevantToUser, orgUnits as seedOrgUnits } from "@/lib/data/users";
import { computeBestMatchForEntry, computePortfolioEconomics } from "@/lib/matching/portfolio";
import { fmtSEK } from "@/lib/format";
import { PROJECT_STATUS_ORDER, ProjectStatus } from "@/lib/types";

type Role = "ledning" | "samordnare" | "verksamhet";

export default function OversiktPage() {
  const { t, lang } = useLanguage();
  const ov = t.oversikt;
  const pb = t.projectBank;
  const bv = t.bevakning;
  const ap = t.awardedProjects;
  const { all: projectBank } = useProjectBank();
  const { all: fundingCalls } = useFundingCalls();
  const { all: awardedProjects } = useAwardedProjects();
  const { applications: ongoingApplications, hydrated: ongoingHydrated } = useOngoingApplications();
  const { withSubmissions } = useReportingSubmissions();
  const { tasks, hydrated: tasksHydrated } = useProjectTasks();
  const { users } = useUsersDirectory();
  const { config: orgConfig } = useOrgConfig();
  const orgUnitsAll = orgConfig.units ?? seedOrgUnits;
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID);
  const [role, setRole] = useState<Role>("ledning");
  const [department, setDepartment] = useState<string>("all");
  const [onlyMineAndShared, setOnlyMineAndShared] = useState(false);
  const [projectSearch, setProjectSearch] = useState("");

  // Every open (not-done) task across the whole portfolio, soonest due
  // first and undated ones last — the cross-project "what's actually left
  // to do, right now" view that a single project's own task list can't
  // give on its own.
  const openTasks = useMemo(
    () =>
      projectBank
        .flatMap((entry) => (tasks[entry.id] ?? []).filter((task) => !task.done).map((task) => ({ entry, task })))
        .sort((a, b) => {
          if (!a.task.dueDate && !b.task.dueDate) return 0;
          if (!a.task.dueDate) return 1;
          if (!b.task.dueDate) return -1;
          return a.task.dueDate.localeCompare(b.task.dueDate);
        })
        .slice(0, 6),
    [projectBank, tasks]
  );

  const rows = useMemo(
    () =>
      projectBank
        .map((entry) => ({ entry, match: computeBestMatchForEntry(entry, fundingCalls) }))
        .sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1)),
    [projectBank, fundingCalls]
  );

  const economics = useMemo(() => computePortfolioEconomics(projectBank, fundingCalls), [projectBank, fundingCalls]);

  const statusCounts = useMemo(() => {
    const counts = new Map<ProjectStatus, number>();
    for (const p of projectBank) counts.set(p.status, (counts.get(p.status) ?? 0) + 1);
    return counts;
  }, [projectBank]);

  const upcomingDeadlines = useMemo(
    () => [...fundingCalls].sort((a, b) => a.deadlineMonthsFromNow - b.deadlineMonthsFromNow).slice(0, 3),
    [fundingCalls]
  );

  const upcomingReports = useMemo(
    () =>
      awardedProjects
        .map((seedProject) => {
          const project = withSubmissions(seedProject);
          const report = nextActionableReport(project);
          return report ? { project, report } : null;
        })
        .filter((r): r is NonNullable<typeof r> => r !== null)
        .sort((a, b) => a.report.deadlineMonthsFromNow - b.report.deadlineMonthsFromNow)
        .slice(0, 3),
    [awardedProjects, withSubmissions]
  );

  const departments = useMemo(
    () => Array.from(new Set(projectBank.map((p) => (lang === "sv" ? p.department_sv : p.department_en)))),
    [projectBank, lang]
  );

  const departmentRows = rows
    .filter((r) => department === "all" || (lang === "sv" ? r.entry.department_sv : r.entry.department_en) === department)
    .filter((r) => !onlyMineAndShared || isProjectRelevantToUser(r.entry, currentUser, orgUnitsAll));

  const projectSearchQuery = projectSearch.trim().toLowerCase();
  const searchedRows = rows.filter(({ entry }) =>
    projectSearchQuery
      ? `${entry.title_sv} ${entry.title_en} ${entry.department_sv} ${entry.department_en}`.toLowerCase().includes(projectSearchQuery)
      : true
  );

  const roles: { key: Role; label: string; desc: string }[] = [
    { key: "ledning", label: ov.roleLedning, desc: ov.roleLedningDesc },
    { key: "samordnare", label: ov.roleSamordnare, desc: ov.roleSamordnareDesc },
    { key: "verksamhet", label: ov.roleVerksamhet, desc: ov.roleVerksamhetDesc },
  ];

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{ov.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{ov.subtitle}</p>

        <div className="mt-6">
          <p className="text-xs font-semibold uppercase text-navy-400">{ov.roleLabel}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {roles.map((r) => (
              <button
                key={r.key}
                onClick={() => setRole(r.key)}
                className={`rounded-md px-4 py-2 text-sm font-semibold transition ${
                  role === r.key ? "bg-navy-800 text-white" : "border border-navy-200 text-navy-600 hover:bg-navy-50"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
          <p className="mt-2 text-sm text-navy-500">{roles.find((r) => r.key === role)?.desc}</p>
        </div>

        {/* Quick entry point back into whatever's mid-draft — visible
            regardless of which role view is selected below, since resuming
            a started application is relevant no matter who's looking. */}
        {ongoingHydrated && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-navy-800">{ov.ongoingApplicationsTitle}</h2>
            <p className="mt-1 text-sm text-navy-500">{ov.ongoingApplicationsHint}</p>
            {ongoingApplications.length === 0 ? (
              <p className="mt-3 text-sm text-navy-500">{ov.ongoingApplicationsNone}</p>
            ) : (
              <div className="mt-3 space-y-2">
                {ongoingApplications.map(({ record, entry, call, program, updatedAt, versionCount }) => (
                  <div
                    key={record.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-xs font-bold text-white">
                        {program.logoLetter}
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase text-navy-400">{program.shortName}</p>
                        <p className="font-semibold text-navy-800">
                          {lang === "sv" ? entry.title_sv : entry.title_en}
                        </p>
                        <p className="text-xs text-navy-500">{lang === "sv" ? call.title_sv : call.title_en}</p>
                        <p className="text-xs text-navy-400">
                          <ApplicationStatusBadge status={record.status} />{" "}
                          {updatedAt && ov.ongoingApplicationsUpdatedAt(new Date(updatedAt).toLocaleString(lang === "sv" ? "sv-SE" : "en-US"))}
                          {versionCount > 0 && (updatedAt ? " · " : "") + ov.ongoingApplicationsVersions(versionCount)}
                        </p>
                      </div>
                    </div>
                    <Link
                      href={`/demo?project=${entry.id}&call=${call.id}&application=${encodeURIComponent(record.id)}`}
                      className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
                    >
                      {ov.ongoingApplicationsResume}
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Same "regardless of role" visibility as ongoing applications
            above — ad-hoc project tasks (see useProjectTasks) track
            concrete, per-project to-dos. */}
        {tasksHydrated && (
          <section className="mt-8">
            <h2 className="text-lg font-bold text-navy-800">{ov.currentTasksTitle}</h2>
            <p className="mt-1 text-sm text-navy-500">{ov.currentTasksHint}</p>
            {openTasks.length === 0 ? (
              <p className="mt-3 text-sm text-navy-500">{ov.currentTasksNone}</p>
            ) : (
              <ul className="mt-3 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
                {openTasks.map(({ entry, task }) => (
                  <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-navy-400">
                        {lang === "sv" ? entry.title_sv : entry.title_en}
                      </p>
                      <p className="text-sm font-semibold text-navy-800">
                        {task.text}
                        {task.dueDate && <span className="ml-2 text-xs font-normal text-navy-400">{pb.taskDueLabel(task.dueDate)}</span>}
                      </p>
                    </div>
                    <Link href={`/projektbank/${entry.id}`} className="shrink-0 text-xs font-semibold text-navy-600 hover:text-navy-900">
                      {ov.currentTasksViewAll}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {role === "ledning" && (
          <div className="mt-8 space-y-6">
            <section className="rounded-xl bg-navy-800 p-6 text-white">
              <h2 className="font-bold">{pb.economicsTitle}</h2>
              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div>
                  <p className="text-2xl font-bold text-white">{fmtSEK(economics.totalBudgetSEK, lang)}</p>
                  <p className="text-sm text-navy-300">{pb.statPortfolioBudget}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gold-300">{fmtSEK(economics.totalIdentifiedFundingSEK, lang)}</p>
                  <p className="text-sm text-navy-300">{pb.statFundingPotential}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{fmtSEK(economics.totalCoFinancingNeededSEK, lang)}</p>
                  <p className="text-sm text-navy-300">{pb.statCoFinancingNeed}</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-bold text-navy-800">{ov.sectionStatusBreakdown}</h2>
              <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
                {PROJECT_STATUS_ORDER.map((status) => (
                  <Link
                    key={status}
                    href={`/projekt?status=${status}`}
                    className="rounded-xl border border-navy-100 bg-white p-4 transition hover:border-navy-300 hover:shadow-sm"
                  >
                    <p className="text-2xl font-extrabold text-navy-900">{statusCounts.get(status) ?? 0}</p>
                    <p className="text-xs text-navy-500">{pb.statusLabels[status]}</p>
                  </Link>
                ))}
              </div>
            </section>
          </div>
        )}

        {role === "samordnare" && (
          <div className="mt-8 space-y-6">
            <section>
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-navy-800">{ov.sectionUpcomingDeadlines}</h2>
                <Link href="/bevakning" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
                  {ov.viewAllInBevakning}
                </Link>
              </div>
              <div className="mt-3 space-y-2">
                {upcomingDeadlines.map((call) => {
                  const program = findProgram(call.programId);
                  return (
                    <div key={call.id} className="flex items-center justify-between rounded-xl border border-navy-100 bg-white p-4">
                      <div>
                        <p className="text-xs font-semibold uppercase text-navy-400">{program?.shortName}</p>
                        <p className="font-semibold text-navy-800">{lang === "sv" ? call.title_sv : call.title_en}</p>
                      </div>
                      <span className="badge bg-navy-100 text-navy-600">{bv.deadlineInMonths(call.deadlineMonthsFromNow)}</span>
                    </div>
                  );
                })}
              </div>
            </section>

            {upcomingReports.length > 0 && (
              <section>
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-navy-800">{ov.sectionUpcomingReports}</h2>
                  <Link href="/projekt" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
                    {ov.viewAllInMyProjects}
                  </Link>
                </div>
                <div className="mt-3 space-y-2">
                  {upcomingReports.map(({ project, report }) => {
                    const call = findCall(project.callId);
                    const program = call ? findProgram(call.programId) : undefined;
                    return (
                      <Link
                        key={project.id}
                        href={`/projekt/${project.id}`}
                        className="flex items-center justify-between rounded-xl border border-navy-100 bg-white p-4 transition hover:border-navy-300 hover:shadow-sm"
                      >
                        <div>
                          <p className="text-xs font-semibold uppercase text-navy-400">{program?.shortName}</p>
                          <p className="font-semibold text-navy-800">{lang === "sv" ? project.title_sv : project.title_en}</p>
                        </div>
                        <span className={`badge ${report.status === "revision-requested" ? "bg-amber-100 text-amber-800" : "bg-navy-100 text-navy-600"}`}>
                          {report.status === "revision-requested" ? ap.reportStatusRevisionRequested : ap.nextReportDue(report.deadlineMonthsFromNow)}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h2 className="text-lg font-bold text-navy-800">{pb.title}</h2>
                <input
                  value={projectSearch}
                  onChange={(e) => setProjectSearch(e.target.value)}
                  placeholder={ov.searchProjectsPlaceholder}
                  className="w-full max-w-xs rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>
              {searchedRows.length === 0 ? (
                <p className="mt-3 text-sm text-navy-500">{ov.noProjectsMatchSearch}</p>
              ) : (
              <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="border-b border-navy-100 text-xs uppercase text-navy-400">
                    <tr>
                      <th className="px-4 py-3">{pb.columnTitle}</th>
                      <th className="px-4 py-3">{pb.columnDepartment}</th>
                      <th className="px-4 py-3">{pb.columnBestMatch}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-50">
                    {searchedRows.map(({ entry, match }) => (
                      <tr key={entry.id} className="hover:bg-navy-50/50">
                        <td className="px-4 py-3">
                          <Link href={`/projektbank/${entry.id}`} className="font-semibold text-navy-800 hover:underline">
                            {lang === "sv" ? entry.title_sv : entry.title_en}
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-navy-600">
                          {lang === "sv" ? entry.department_sv : entry.department_en}
                        </td>
                        <td className="px-4 py-3">
                          {match ? (
                            <span className="badge bg-navy-100 text-navy-700">
                              {match.score}% · {match.program.shortName}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              )}
            </section>
          </div>
        )}

        {role === "verksamhet" && (
          <div className="mt-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="flex flex-wrap items-end gap-4">
                <div>
                  <label className="text-xs font-semibold uppercase text-navy-400">{ov.departmentFilterLabel}</label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="mt-1 block rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  >
                    <option value="all">{ov.allDepartments}</option>
                    {departments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>
                <label className="flex items-center gap-2 pb-2 text-sm font-semibold text-navy-700">
                  <input
                    type="checkbox"
                    checked={onlyMineAndShared}
                    onChange={(e) => setOnlyMineAndShared(e.target.checked)}
                  />
                  {ap.onlyMineAndSharedToggle}
                </label>
              </div>
              <Link
                href="/demo"
                className="rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400"
              >
                {ov.describeNewProject}
              </Link>
            </div>

            <section className="mt-6">
              <h2 className="text-lg font-bold text-navy-800">{ov.sectionYourProjects}</h2>
              <div className="mt-3 space-y-3">
                {departmentRows.map(({ entry, match }) => {
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
                        <p className="mt-2 text-xs text-amber-700">
                          ⚠ {ov.fieldsMissingForBestMatch(missing.length)}
                        </p>
                      )}
                    </div>
                  );
                })}
                {departmentRows.length === 0 && <p className="text-sm text-navy-500">{ov.noProjectsInDepartment}</p>}
              </div>
            </section>
          </div>
        )}
      </main>
      <Footer />
    </>
  );
}

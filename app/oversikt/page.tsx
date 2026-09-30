"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import UnreadDot from "@/components/UnreadDot";
import { useNotifications } from "@/components/NotificationsProvider";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useOngoingApplications } from "@/lib/hooks/useOngoingApplications";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import { useProjectTasks } from "@/lib/hooks/useProjectTasks";
import { useGrants } from "@/lib/hooks/useGrants";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { callDeadlineMonths, findCall } from "@/lib/data/fundingCalls";
import { reportState } from "@/lib/data/grants";
import { findProgram } from "@/lib/data/fundingPrograms";
import { CURRENT_USER_ID, isProjectRelevantToUser, orgUnits as seedOrgUnits } from "@/lib/data/users";
import { ProjectBankEntry } from "@/lib/types";
import { useOnlyMineAndShared } from "@/lib/hooks/useOnlyMineAndShared";

const LIST_LIMIT = 5;

// Översikt: "what do I need to do now" — the applications, reports and
// tasks that need someone's attention, across all projects, and the unread
// notifications. The full lists live under Ansöka, Rapportera and Projekt;
// the portfolio-wide figures leadership looks at live in Datacenter.
export default function OversiktPage() {
  const { t, lang } = useLanguage();
  const ov = t.oversikt;
  const pb = t.projectBank;
  const ap = t.grants;
  const bv = t.bevakning;
  const r = t.report;
  const { all: projectBank } = useProjectBank();
  const { all: grants } = useGrants();
  const { applications: ongoing, hydrated: ongoingHydrated } = useOngoingApplications();
  const { withSubmissions } = useReportingSubmissions();
  const { tasks, hydrated: tasksHydrated } = useProjectTasks();
  const { users } = useUsersDirectory();
  const { config: orgConfig } = useOrgConfig();
  const notifications = useNotifications();
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID);
  const orgUnitsAll = orgConfig.units ?? seedOrgUnits;
  const [onlyMineAndShared, setOnlyMineAndShared] = useOnlyMineAndShared();

  const inScope = (entry: ProjectBankEntry | undefined) =>
    !onlyMineAndShared || (entry ? isProjectRelevantToUser(entry, currentUser, orgUnitsAll) : false);

  const applications = ongoing
    .filter((a) => inScope(a.entry))
    .sort((a, b) => callDeadlineMonths(a.call) - callDeadlineMonths(b.call));

  const reports = useMemo(
    () =>
      grants
        .map(withSubmissions)
        .flatMap((grant) => grant.reportingEvents.map((event) => ({ grant, event, state: reportState(event) })))
        .filter((x) => x.state !== "done")
        .sort((a, b) =>
          a.state === b.state ? a.event.deadlineMonthsFromNow - b.event.deadlineMonthsFromNow : a.state === "attention" ? -1 : 1
        ),
    [grants, withSubmissions]
  );
  const visibleReports = reports.filter((x) => inScope(projectBank.find((p) => p.id === x.grant.projectBankEntryId)));

  // Every open task across the projects in scope, soonest due first and
  // undated ones last.
  const openTasks = projectBank
    .filter((entry) => inScope(entry))
    .flatMap((entry) => (tasks[entry.id] ?? []).filter((task) => !task.done).map((task) => ({ entry, task })))
    .sort((a, b) => {
      if (!a.task.dueDate && !b.task.dueDate) return 0;
      if (!a.task.dueDate) return 1;
      if (!b.task.dueDate) return -1;
      return a.task.dueDate.localeCompare(b.task.dueDate);
    });

  // Notifications about a project follow the toggle too; ones not about a
  // single project (a new call, a document to update) always show.
  const unread = notifications.items.filter(
    (n) => notifications.isUnread(n.id) && (!n.projectId || inScope(projectBank.find((p) => p.id === n.projectId)))
  );

  const stats = [
    { label: ov.statActiveApplications, value: applications.length, href: "/ansok#applications", warn: false },
    { label: ov.statReportsAttention, value: visibleReports.filter((x) => x.state === "attention").length, href: "/rapportera#attention", warn: true },
    { label: ov.statReportsUpcoming, value: visibleReports.filter((x) => x.state === "upcoming").length, href: "/rapportera#upcoming", warn: false },
    { label: ov.statOpenTasks, value: openTasks.length, href: "#tasks-heading", warn: false },
    { label: ov.statUnread, value: unread.length, href: "#notifications-heading", warn: false },
  ];

  return (
    <>
      <Header />
      <main className="section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{ov.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{ov.subtitle}</p>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy-700">
              <input type="checkbox" checked={onlyMineAndShared} onChange={(e) => setOnlyMineAndShared(e.target.checked)} />
              {ap.onlyMineAndSharedToggle}
            </label>
            <Link
              href="/ansokan"
              className="rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400"
            >
              + {ov.describeNewProject}
            </Link>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((st) => {
            const highlight = st.warn && st.value > 0;
            return (
              <a
                key={st.label}
                href={st.href}
                className={`rounded-xl border p-4 transition hover:shadow-sm ${
                  highlight ? "border-amber-200 bg-amber-50 hover:border-amber-300" : "border-navy-100 bg-white hover:border-navy-300"
                }`}
              >
                <p className={`text-2xl font-extrabold ${highlight ? "text-amber-800" : "text-navy-900"}`}>{st.value}</p>
                <p className="text-xs text-navy-500">{st.label}</p>
              </a>
            );
          })}
        </div>

        <div className="mt-8 grid gap-8 lg:grid-cols-2">
          <section aria-labelledby="applications-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="applications-heading" className="text-lg font-bold text-navy-800">
                {ov.myApplicationsTitle}
              </h2>
              <Link href="/ansok" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
                {ov.viewAllApplications}
              </Link>
            </div>
            {ongoingHydrated && applications.length === 0 ? (
              <p className="mt-3 text-sm text-navy-500">{ov.myApplicationsNone}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {applications.slice(0, LIST_LIMIT).map(({ record, entry, call, program, updatedAt, versionCount }) => (
                  <li key={record.id} className="rounded-xl border border-navy-100 bg-white p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase text-navy-400">
                          {program.shortName} · {lang === "sv" ? entry.title_sv : entry.title_en}
                          <UnreadDot entityKey={`application:${record.id}`} />
                        </p>
                        <p className="font-semibold text-navy-800">{lang === "sv" ? call.title_sv : call.title_en}</p>
                        <p className="mt-1 flex flex-wrap items-center gap-2 text-xs text-navy-400">
                          <ApplicationStatusBadge status={record.status} />
                          <span className={callDeadlineMonths(call) <= 1 ? "font-semibold text-amber-700" : ""}>
                            {bv.deadlineInMonths(callDeadlineMonths(call))}
                          </span>
                          {updatedAt && (
                            <span>{ov.ongoingApplicationsUpdatedAt(new Date(updatedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-US"))}</span>
                          )}
                          {versionCount > 0 && <span>{ov.ongoingApplicationsVersions(versionCount)}</span>}
                        </p>
                      </div>
                      <Link
                        href={`/ansokan?project=${entry.id}&call=${call.id}&application=${encodeURIComponent(record.id)}`}
                        className="shrink-0 rounded-md bg-navy-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy-700"
                      >
                        {ov.ongoingApplicationsResume}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="reports-heading">
            <div className="flex items-center justify-between gap-3">
              <h2 id="reports-heading" className="text-lg font-bold text-navy-800">
                {ov.myReportsTitle}
              </h2>
              <Link href="/rapportera" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
                {ov.viewAllReports}
              </Link>
            </div>
            {visibleReports.length === 0 ? (
              <p className="mt-3 text-sm text-navy-500">{ov.myReportsNone}</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {visibleReports.slice(0, LIST_LIMIT).map(({ grant, event, state }) => {
                  const entry = projectBank.find((p) => p.id === grant.projectBankEntryId);
                  const call = findCall(grant.callId);
                  const program = call ? findProgram(call.programId) : undefined;
                  const badge =
                    event.status === "revision-requested"
                      ? ap.reportStatusRevisionRequested
                      : event.deadlineMonthsFromNow < 0
                      ? r.overdueLabel(Math.abs(event.deadlineMonthsFromNow))
                      : ap.reportDueInMonths(event.deadlineMonthsFromNow);
                  const projectName = entry
                    ? lang === "sv"
                      ? entry.title_sv
                      : entry.title_en
                    : lang === "sv"
                    ? grant.title_sv
                    : grant.title_en;
                  return (
                    <li key={event.id}>
                      <Link
                        href={`/stod/${grant.id}`}
                        className="flex items-start justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4 transition hover:border-navy-300 hover:shadow-sm"
                      >
                        <div className="min-w-0">
                          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-navy-400">
                            {program?.shortName} · {projectName}
                            <UnreadDot entityKey={`report:${event.id}`} />
                          </p>
                          <p className="font-semibold text-navy-800">{lang === "sv" ? event.periodLabel_sv : event.periodLabel_en}</p>
                        </div>
                        <span className={`badge shrink-0 ${state === "attention" ? "bg-amber-100 text-amber-800" : "bg-navy-100 text-navy-600"}`}>
                          {badge}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>

          {tasksHydrated && (
            <section aria-labelledby="tasks-heading">
              <h2 id="tasks-heading" className="text-lg font-bold text-navy-800">
                {ov.currentTasksTitle}
              </h2>
              <p className="mt-1 text-sm text-navy-500">{ov.currentTasksHint}</p>
              {openTasks.length === 0 ? (
                <p className="mt-3 text-sm text-navy-500">{ov.currentTasksNone}</p>
              ) : (
                <ul className="mt-3 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
                  {openTasks.slice(0, LIST_LIMIT + 1).map(({ entry, task }) => (
                    <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <p className="text-xs font-semibold uppercase text-navy-400">{lang === "sv" ? entry.title_sv : entry.title_en}</p>
                        <p className="text-sm font-semibold text-navy-800">
                          {task.text}
                          {task.dueDate && <span className="ml-2 text-xs font-normal text-navy-400">{pb.taskDueLabel(task.dueDate)}</span>}
                        </p>
                      </div>
                      <Link href={`/projekt/${entry.id}`} className="shrink-0 text-xs font-semibold text-navy-600 hover:text-navy-900">
                        {ov.currentTasksViewAll}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          <section aria-labelledby="notifications-heading">
            <h2 id="notifications-heading" className="text-lg font-bold text-navy-800">
              {ov.latestNotificationsTitle}
            </h2>
            {notifications.ready && unread.length === 0 ? (
              <p className="mt-3 text-sm text-navy-500">{ov.latestNotificationsNone}</p>
            ) : (
              <ul className="mt-3 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
                {unread.slice(0, LIST_LIMIT).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => notifications.markRead(n.id)}
                      className="flex gap-3 px-4 py-3 transition hover:bg-navy-50"
                    >
                      <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.urgent ? "bg-amber-600" : "bg-navy-700"}`} />
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-navy-800">{lang === "sv" ? n.title_sv : n.title_en}</span>
                        <span className="block truncate text-xs text-navy-500">{lang === "sv" ? n.detail_sv : n.detail_en}</span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

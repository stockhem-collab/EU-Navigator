"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import UnreadDot from "@/components/UnreadDot";
import Icon, { IconName } from "@/components/Icon";
import PageHeader, { HeaderToggle, headerButtonClass } from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
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
import { useCallTemplates } from "@/lib/hooks/useCallTemplates";
import { useCallRequirements } from "@/lib/hooks/useCallRequirements";
import { useAttachments } from "@/lib/hooks/useAttachments";
import { readApplicationRequirements } from "@/lib/hooks/useApplication";
import { isPublicBody, openManualRequirements, requirementFileKey, resolveRequirements } from "@/lib/data/applicationRequirements";

const LIST_LIMIT = 5;

function dayPart(date: Date): "morning" | "day" | "evening" {
  const h = date.getHours();
  return h < 10 ? "morning" : h < 18 ? "day" : "evening";
}

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

  const stats: { label: string; value: number; href: string; warn: boolean; icon: IconName }[] = [
    { label: ov.statActiveApplications, value: applications.length, href: "/ansok#applications", warn: false, icon: "application" },
    { label: ov.statReportsAttention, value: visibleReports.filter((x) => x.state === "attention").length, href: "/rapportera#attention", warn: true, icon: "alert" },
    { label: ov.statReportsUpcoming, value: visibleReports.filter((x) => x.state === "upcoming").length, href: "/rapportera#upcoming", warn: false, icon: "calendar" },
    { label: ov.statOpenTasks, value: openTasks.length, href: "#tasks-heading", warn: false, icon: "task" },
    { label: ov.statUnread, value: unread.length, href: "#notifications-heading", warn: false, icon: "bell" },
  ];

  // The greeting and date follow the viewer's clock, so they are only
  // filled in after mounting (the server render says "Välkommen").
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);
  const locale = lang === "sv" ? "sv-SE" : "en-US";
  const orgName = orgConfig.organisationName ?? orgUnitsAll.find((u) => !u.parentId)?.name ?? null;
  const today = now ? now.toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }) : null;
  const todayLabel = today ? today.charAt(0).toUpperCase() + today.slice(1) : null;

  const projectTitle = (entry: ProjectBankEntry | undefined, fallback: { title_sv: string; title_en: string }) =>
    lang === "sv" ? entry?.title_sv ?? fallback.title_sv : entry?.title_en ?? fallback.title_en;

  const templates = useCallTemplates();
  const callRequirements = useCallRequirements();
  const { attachmentsFor } = useAttachments();
  const openRequirementsFor = (application: (typeof applications)[number]) => {
    const { states, own } = readApplicationRequirements(application.record.id);
    const resolved = resolveRequirements({
      call: application.call,
      program: application.program,
      template: templates.applicationTemplateFor(application.call),
      datacenter: callRequirements.all[application.call.id],
      own,
    });
    const files = Object.fromEntries(
      resolved.map((r) => [r.requirement.id, attachmentsFor(requirementFileKey(application.record.id, r.requirement.id)).length])
    );
    return openManualRequirements(resolved, states, isPublicBody(orgConfig.orgType), files, application.call.deadlineDate, now ?? undefined);
  };

  // The single most pressing thing: a report that needs action, else the
  // application closest to its deadline, else the soonest dated task.
  const nextUp = (() => {
    const report = visibleReports.find((x) => x.state === "attention");
    if (report) {
      const entry = projectBank.find((p) => p.id === report.grant.projectBankEntryId);
      return {
        kind: ov.nextUpReport,
        title: lang === "sv" ? report.event.periodLabel_sv : report.event.periodLabel_en,
        detail: projectTitle(entry, report.grant),
        badge: report.event.status === "revision-requested" ? ap.reportStatusRevisionRequested : r.overdueLabel(Math.abs(report.event.deadlineMonthsFromNow)),
        href: `/stod/${report.grant.id}`,
        urgent: true,
      };
    }
    const application = applications[0];
    if (application) {
      // The annexes, certificates and conditions still open on it — read
      // from the browser once mounted.
      const open = now ? openRequirementsFor(application) : [];
      const href = `/ansokan?project=${application.entry.id}&call=${application.call.id}&application=${encodeURIComponent(application.record.id)}`;
      return {
        kind: ov.nextUpApplication,
        title: lang === "sv" ? application.call.title_sv : application.call.title_en,
        detail: `${application.program.shortName} · ${projectTitle(application.entry, application.entry)}${open.length > 0 ? ` · ${t.req.nextUpOpen(open.length)}` : ""}`,
        badge: bv.deadlineInMonths(callDeadlineMonths(application.call)),
        href: open.length > 0 ? `${href}&flik=krav` : href,
        urgent: callDeadlineMonths(application.call) <= 1 || open.some((i) => i.leadTimeWarning),
      };
    }
    const task = openTasks.find((x) => x.task.dueDate);
    if (task) {
      return {
        kind: ov.nextUpTask,
        title: task.task.text,
        detail: projectTitle(task.entry, task.entry),
        badge: pb.taskDueLabel(task.task.dueDate!),
        href: `/projekt/${task.entry.id}`,
        urgent: false,
      };
    }
    return null;
  })();

  const shortcuts: { href: string; icon: IconName; label: string; hint: string }[] = [
    { href: "/projekt", icon: "folder", label: t.nav.projects, hint: ov.shortcutProjects },
    { href: "/historik", icon: "history", label: t.imported.historyTab, hint: ov.shortcutHistory },
    { href: "/partnersok", icon: "partners", label: t.ext.partners.tab, hint: ov.shortcutPartners },
    { href: "/eu-databas", icon: "book", label: t.nav.knowledgeBank, hint: ov.shortcutKnowledge },
  ];

  return (
    <>
      <Header />
      <main className="page">
        <PageHeader
          large
          eyebrow={
            <>
              {ov.title}
              {orgName && <span className="text-navy-100"> · {orgName}</span>}
            </>
          }
          title={ov.greeting(now ? dayPart(now) : null, currentUser?.firstName ?? null)}
          subtitle={
            <>
              {todayLabel && <span>{todayLabel}. </span>}
              {ov.subtitle}
            </>
          }
        >
          <Link href="/ansok#find-funding" className={headerButtonClass}>
            <Icon name="search" className="h-4 w-4" />
            {ov.findCall}
          </Link>
          <HeaderToggle checked={onlyMineAndShared} onChange={setOnlyMineAndShared} label={ap.onlyMineAndSharedToggle} />
        </PageHeader>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {stats.map((st) => (
            <StatCard key={st.label} value={st.value} label={st.label} icon={st.icon} href={st.href} warn={st.warn} />
          ))}
        </div>

        {(ongoingHydrated || tasksHydrated) && (
          <div
            className={`mt-6 flex flex-wrap items-center gap-4 rounded-xl border p-5 ${
              nextUp?.urgent ? "border-amber-200 bg-amber-50/60" : nextUp ? "border-navy-100 bg-white" : "border-emerald-200 bg-emerald-50/60"
            }`}
          >
            <span
              className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${
                nextUp?.urgent ? "bg-amber-100 text-amber-700" : nextUp ? "bg-navy-50 text-navy-600" : "bg-emerald-100 text-emerald-700"
              }`}
            >
              <Icon name={nextUp ? (nextUp.urgent ? "alert" : "calendar") : "check"} className="h-6 w-6" />
            </span>
            {nextUp ? (
              <>
                <div className="min-w-0 flex-1 basis-56">
                  <p className="text-xs font-semibold uppercase tracking-wider text-navy-500">
                    {ov.nextUpTitle} · {nextUp.kind}
                  </p>
                  <p className="mt-0.5 font-semibold text-navy-900">{nextUp.title}</p>
                  <p className="text-sm text-navy-500">{nextUp.detail}</p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <span className={`badge ${nextUp.urgent ? "bg-amber-100 text-amber-800" : "bg-navy-100 text-navy-600"}`}>{nextUp.badge}</span>
                  <Link
                    href={nextUp.href}
                    className="rounded-lg bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
                  >
                    {ov.nextUpOpen}
                  </Link>
                </div>
              </>
            ) : (
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-navy-900">{ov.nextUpNone}</p>
                <p className="text-sm text-navy-500">{ov.nextUpNoneHint}</p>
              </div>
            )}
          </div>
        )}

        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <section aria-labelledby="applications-heading" className="min-w-0 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 id="applications-heading" className="text-lg font-bold text-navy-800">
                  {ov.myApplicationsTitle}
                </h2>
                <CountChip n={applications.length} />
              </div>
              <Link href="/ansok" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
                {ov.viewAllApplications}
              </Link>
            </div>
            {ongoingHydrated && applications.length === 0 ? (
              <EmptyState icon="application" text={ov.myApplicationsNone}>
                <Link href="/ansok#find-funding" className="text-sm font-semibold text-navy-700 hover:text-navy-900">
                  {ov.emptyApplicationsCta} →
                </Link>
              </EmptyState>
            ) : (
              <ul className="mt-4 divide-y divide-navy-50">
                {applications.slice(0, LIST_LIMIT).map(({ record, entry, call, program, updatedAt, versionCount }) => (
                  <li key={record.id} className="py-3 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-navy-500">
                          <span className="font-semibold text-navy-600">{program.shortName}</span>
                          <span aria-hidden>·</span>
                          <span className="min-w-0 sm:truncate">{lang === "sv" ? entry.title_sv : entry.title_en}</span>
                          <UnreadDot entityKey={`application:${record.id}`} />
                        </p>
                        <p className="mt-0.5 font-semibold text-navy-800">{lang === "sv" ? call.title_sv : call.title_en}</p>
                        <p className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-navy-400">
                          <ApplicationStatusBadge status={record.status} />
                          <span
                            className={`inline-flex items-center gap-1 ${callDeadlineMonths(call) <= 1 ? "font-semibold text-amber-700" : ""}`}
                          >
                            <Icon name="calendar" className="h-3.5 w-3.5" />
                            {bv.deadlineInMonths(callDeadlineMonths(call))}
                          </span>
                          {updatedAt && <span>{ov.ongoingApplicationsUpdatedAt(new Date(updatedAt).toLocaleDateString(locale))}</span>}
                          {versionCount > 0 && <span>{ov.ongoingApplicationsVersions(versionCount)}</span>}
                        </p>
                      </div>
                      <Link
                        href={`/ansokan?project=${entry.id}&call=${call.id}&application=${encodeURIComponent(record.id)}`}
                        className="shrink-0 rounded-lg bg-navy-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy-700"
                      >
                        {ov.ongoingApplicationsResume}
                      </Link>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section aria-labelledby="reports-heading" className="min-w-0 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <h2 id="reports-heading" className="text-lg font-bold text-navy-800">
                  {ov.myReportsTitle}
                </h2>
                <CountChip n={visibleReports.length} />
              </div>
              <Link href="/rapportera" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
                {ov.viewAllReports}
              </Link>
            </div>
            {visibleReports.length === 0 ? (
              <EmptyState icon="check" text={ov.myReportsNone} />
            ) : (
              <ul className="-mx-2 mt-3 space-y-1">
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
                  return (
                    <li key={event.id}>
                      <Link
                        href={`/stod/${grant.id}`}
                        className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 rounded-lg px-2 py-2.5 transition hover:bg-navy-50 sm:flex-nowrap"
                      >
                        <span className="flex min-w-0 items-start gap-3">
                          <span
                            aria-hidden
                            className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${state === "attention" ? "bg-amber-500" : "bg-navy-200"}`}
                          />
                          <span className="min-w-0">
                            <span className="flex flex-wrap items-center gap-x-2 text-xs font-medium text-navy-500">
                              {program && <span className="font-semibold text-navy-600">{program.shortName}</span>}
                              {program && <span aria-hidden>·</span>}
                              <span className="min-w-0 sm:truncate">{projectTitle(entry, grant)}</span>
                              <UnreadDot entityKey={`report:${event.id}`} />
                            </span>
                            <span className="block font-semibold text-navy-800">{lang === "sv" ? event.periodLabel_sv : event.periodLabel_en}</span>
                          </span>
                        </span>
                        <span className={`badge ml-[1.375rem] shrink-0 sm:ml-0 ${state === "attention" ? "bg-amber-100 text-amber-800" : "bg-navy-100 text-navy-600"}`}>
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
            <section aria-labelledby="tasks-heading" className="min-w-0 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
              <div className="flex items-center gap-2">
                <h2 id="tasks-heading" className="text-lg font-bold text-navy-800">
                  {ov.currentTasksTitle}
                </h2>
                <CountChip n={openTasks.length} />
              </div>
              <p className="mt-1 text-sm text-navy-500">{ov.currentTasksHint}</p>
              {openTasks.length === 0 ? (
                <EmptyState icon="task" text={ov.currentTasksNone}>
                  <Link href="/projekt" className="text-sm font-semibold text-navy-700 hover:text-navy-900">
                    {ov.emptyTasksCta} →
                  </Link>
                </EmptyState>
              ) : (
                <ul className="mt-3 divide-y divide-navy-50">
                  {openTasks.slice(0, LIST_LIMIT + 1).map(({ entry, task }) => (
                    <li key={task.id} className="flex flex-wrap items-center justify-between gap-3 py-3 last:pb-0">
                      <div className="flex min-w-0 items-start gap-3">
                        <span aria-hidden className="mt-0.5 h-4 w-4 shrink-0 rounded border-2 border-navy-200" />
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-navy-800">
                            {task.text}
                            {task.dueDate && <span className="ml-2 text-xs font-normal text-navy-400">{pb.taskDueLabel(task.dueDate)}</span>}
                          </p>
                          <p className="text-xs text-navy-500">{lang === "sv" ? entry.title_sv : entry.title_en}</p>
                        </div>
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

          <section aria-labelledby="notifications-heading" className="min-w-0 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <h2 id="notifications-heading" className="text-lg font-bold text-navy-800">
                {ov.latestNotificationsTitle}
              </h2>
              <CountChip n={unread.length} />
            </div>
            {notifications.ready && unread.length === 0 ? (
              <EmptyState icon="bell" text={ov.latestNotificationsNone} />
            ) : (
              <ul className="-mx-2 mt-3 space-y-1">
                {unread.slice(0, LIST_LIMIT).map((n) => (
                  <li key={n.id}>
                    <Link
                      href={n.href}
                      onClick={() => notifications.markRead(n.id)}
                      className="flex gap-3 rounded-lg px-2 py-2.5 transition hover:bg-navy-50"
                    >
                      <span aria-hidden className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.urgent ? "bg-amber-500" : "bg-navy-400"}`} />
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

        <nav aria-labelledby="shortcuts-heading" className="mt-10">
          <h2 id="shortcuts-heading" className="text-sm font-semibold uppercase tracking-wider text-navy-400">
            {ov.shortcutsTitle}
          </h2>
          <ul className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {shortcuts.map((s) => (
              <li key={s.href}>
                <Link
                  href={s.href}
                  className="flex h-full items-start gap-3 rounded-xl border border-navy-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-navy-200 hover:shadow-md"
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gold-50 text-gold-700">
                    <Icon name={s.icon} />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-sm font-semibold text-navy-800">{s.label}</span>
                    <span className="block text-xs text-navy-500">{s.hint}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </main>
      <Footer />
    </>
  );
}

function CountChip({ n }: { n: number }) {
  if (n === 0) return null;
  return <span className="rounded-full bg-navy-50 px-2 py-0.5 text-xs font-semibold text-navy-500">{n}</span>;
}

function EmptyState({ icon, text, children }: { icon: IconName; text: string; children?: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-start gap-3 rounded-xl border border-dashed border-navy-100 bg-navy-50/40 p-4">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white text-navy-400 shadow-sm">
        <Icon name={icon} />
      </span>
      <div className="min-w-0">
        <p className="text-sm text-navy-600">{text}</p>
        {children && <div className="mt-1.5">{children}</div>}
      </div>
    </div>
  );
}

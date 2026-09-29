import {
  ApplicationRecord,
  FundingCall,
  FundingProgram,
  Grant,
  ProjectBankEntry,
  ProjectTask,
} from "@/lib/types";
import type { ActivityEntry } from "@/lib/hooks/useActivityLog";
import type { NotificationCategory, NotificationPreferences } from "@/lib/hooks/useNotificationPreferences";
import { callDeadlineMonths } from "@/lib/data/fundingCalls";
import { reportState } from "@/lib/data/grants";
import { isActiveApplication } from "@/lib/matching/applications";

// Everything the notification bell shows, built from the data itself —
// deliberately a pure function of its inputs, so what shows up (and when)
// is easy to test and to reason about. Two sources:
//  - derived: deadlines coming up, reports returned or overdue, tasks due,
//    calls that fit a project, watched calls that changed, awarded
//    applications still waiting for their grant to be registered;
//  - logged: things people did (ActivityEntry) — status changes, grants
//    registered, projects shared, calls imported.
// A notification's id is stable for as long as its situation holds, and
// changes when it moves on (e.g. a deadline reminder at 2 months and at 1
// month are two notifications), so "read" means "read at this stage".

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  urgent: boolean;
  title_sv: string;
  title_en: string;
  detail_sv: string;
  detail_en: string;
  href: string;
  /** Things this notification is about — "project:<id>",
   * "application:<id>", "report:<id>", "grant:<id>", "call:<id>" — so lists
   * elsewhere can mark rows that have unread notifications. */
  entityKeys: string[];
  /** For the "only my projects" scope; undefined = not about one project. */
  projectId?: string;
  /** ISO timestamp used for ordering. */
  at: string;
}

export interface NotificationInputs {
  now: Date;
  prefs: NotificationPreferences;
  projects: ProjectBankEntry[];
  calls: FundingCall[];
  findProgram: (id: string) => FundingProgram | undefined;
  applications: ApplicationRecord[];
  /** With local report submissions already overlaid. */
  grants: Grant[];
  tasks: Record<string, ProjectTask[]>;
  watchedCallIds: string[];
  watchedProgramIds: string[];
  /** Best match score per (projectId, callId), for "a call fits your
   * project" notices. Passed in rather than computed here to keep this
   * module free of the matching engine. */
  strongMatches: { projectId: string; callId: string; score: number }[];
  activity: ActivityEntry[];
}

const STRONG_MATCH_NOTICES = 5;
const TASK_DUE_SOON_DAYS = 7;

function t(sv: string, en: string) {
  return { sv, en };
}

export function computeNotifications(input: NotificationInputs): AppNotification[] {
  const { now, prefs, projects, calls, applications, grants, tasks, activity } = input;
  const nowIso = now.toISOString();
  const out: AppNotification[] = [];
  const projectTitle = (id?: string) => {
    const p = projects.find((x) => x.id === id);
    return p ? t(p.title_sv, p.title_en) : t("", "");
  };
  const callTitle = (id: string) => {
    const c = calls.find((x) => x.id === id);
    return c ? t(c.title_sv, c.title_en) : t(id, id);
  };
  const applicationHref = (r: ApplicationRecord) =>
    `/ansokan?project=${r.projectId}&call=${r.callId}&application=${encodeURIComponent(r.id)}`;
  const push = (n: Omit<AppNotification, "title_sv" | "title_en" | "detail_sv" | "detail_en"> & {
    title: { sv: string; en: string };
    detail: { sv: string; en: string };
  }) => {
    const { title, detail, ...rest } = n;
    out.push({ ...rest, title_sv: title.sv, title_en: title.en, detail_sv: detail.sv, detail_en: detail.en });
  };
  const lead = prefs.leadMonths;

  // --- Application deadlines ---------------------------------------------
  for (const r of applications) {
    if (r.status !== "draft") continue;
    const call = calls.find((c) => c.id === r.callId);
    if (!call) continue;
    const months = callDeadlineMonths(call, now);
    const p = projectTitle(r.projectId);
    const c = callTitle(r.callId);
    if (months < 0) {
      push({
        id: `app-deadline-passed:${r.id}`,
        category: "deadlines",
        urgent: true,
        title: t("Utlysningens deadline har passerat", "The call's deadline has passed"),
        detail: t(`${c.sv} – ansökan för ${p.sv} är fortfarande ett utkast`, `${c.en} — the application for ${p.en} is still a draft`),
        href: applicationHref(r),
        entityKeys: [`application:${r.id}`, `project:${r.projectId}`],
        projectId: r.projectId,
        at: nowIso,
      });
    } else if (months <= lead) {
      push({
        id: `app-deadline:${r.id}:${months}`,
        category: "deadlines",
        urgent: months <= 1,
        title: t(
          months === 0 ? "Ansökan ska lämnas in denna månad" : `Ansökan ska lämnas in om ${months} ${months === 1 ? "månad" : "månader"}`,
          months === 0 ? "Application due this month" : `Application due in ${months} ${months === 1 ? "month" : "months"}`
        ),
        detail: t(`${c.sv} · ${p.sv}`, `${c.en} · ${p.en}`),
        href: applicationHref(r),
        entityKeys: [`application:${r.id}`, `project:${r.projectId}`],
        projectId: r.projectId,
        at: nowIso,
      });
    }
  }

  // --- Watched calls: deadline and changes -------------------------------
  for (const call of calls) {
    const watched = input.watchedCallIds.includes(call.id) || input.watchedProgramIds.includes(call.programId);
    if (!watched) continue;
    const months = callDeadlineMonths(call, now);
    const c = t(call.title_sv, call.title_en);
    const callHref = `/eu-databas/${call.programId}/${call.id}`;
    const alreadyApplying = applications.some((r) => r.callId === call.id && isActiveApplication(r));
    if (!alreadyApplying && months >= 0 && months <= lead) {
      push({
        id: `call-deadline:${call.id}:${months}`,
        category: "deadlines",
        urgent: false,
        title: t(
          `Bevakad utlysning stänger om ${months} ${months === 1 ? "månad" : "månader"}`,
          `Watched call closes in ${months} ${months === 1 ? "month" : "months"}`
        ),
        detail: c,
        href: callHref,
        entityKeys: [`call:${call.id}`],
        at: nowIso,
      });
    }
    const outdated = call.documents.filter((d) => d.needsUpdate).length;
    if (outdated > 0) {
      push({
        id: `call-docs:${call.id}:${outdated}`,
        category: "calls",
        urgent: false,
        title: t("Bevakad utlysning har uppdaterade dokument", "A watched call has updated documents"),
        detail: t(`${c.sv} – ${outdated} dokument`, `${c.en} — ${outdated} document${outdated === 1 ? "" : "s"}`),
        href: callHref,
        entityKeys: [`call:${call.id}`],
        at: nowIso,
      });
    }
  }

  // --- Calls that fit a project it hasn't applied to ---------------------
  for (const m of [...input.strongMatches].sort((a, b) => b.score - a.score).slice(0, STRONG_MATCH_NOTICES)) {
    if (applications.some((r) => r.projectId === m.projectId && r.callId === m.callId)) continue;
    const p = projectTitle(m.projectId);
    const c = callTitle(m.callId);
    push({
      id: `call-match:${m.projectId}:${m.callId}`,
      category: "calls",
      urgent: false,
      title: t(`Utlysning som passar ${p.sv} (${m.score} %)`, `A call that fits ${p.en} (${m.score}%)`),
      detail: c,
      href: `/projekt/${m.projectId}`,
      entityKeys: [`project:${m.projectId}`, `call:${m.callId}`],
      projectId: m.projectId,
      at: nowIso,
    });
  }

  // --- Awarded applications waiting for their grant ----------------------
  for (const r of applications) {
    if (r.status !== "awarded" || r.awardedProjectId) continue;
    const p = projectTitle(r.projectId);
    push({
      id: `app-register-grant:${r.id}`,
      category: "applications",
      urgent: true,
      title: t("Ansökan beviljad – registrera stödet", "Application awarded — register the grant"),
      detail: t(`${callTitle(r.callId).sv} · ${p.sv}`, `${callTitle(r.callId).en} · ${p.en}`),
      href: `/projekt/${r.projectId}#applications-title`,
      entityKeys: [`application:${r.id}`, `project:${r.projectId}`],
      projectId: r.projectId,
      at: r.updatedAt || nowIso,
    });
  }

  // --- Reporting ---------------------------------------------------------
  for (const grant of grants) {
    const p = grant.projectBankEntryId ? projectTitle(grant.projectBankEntryId) : t(grant.title_sv, grant.title_en);
    for (const event of grant.reportingEvents) {
      const keys = [`report:${event.id}`, `grant:${grant.id}`, ...(grant.projectBankEntryId ? [`project:${grant.projectBankEntryId}`] : [])];
      const period = t(event.periodLabel_sv, event.periodLabel_en);
      const base = { entityKeys: keys, projectId: grant.projectBankEntryId, href: `/stod/${grant.id}`, at: nowIso };
      if (event.status === "revision-requested") {
        push({
          ...base,
          id: `report-revision:${event.id}`,
          category: "reporting",
          urgent: true,
          title: t("Rapport returnerad för komplettering", "Report returned for revision"),
          detail: t(`${period.sv} · ${p.sv}`, `${period.en} · ${p.en}`),
        });
      } else if (reportState(event) === "attention") {
        push({
          ...base,
          id: `report-overdue:${event.id}`,
          category: "reporting",
          urgent: true,
          title: t("Rapport försenad", "Report overdue"),
          detail: t(`${period.sv} · ${p.sv}`, `${period.en} · ${p.en}`),
        });
      } else if (event.status === "upcoming" && event.deadlineMonthsFromNow <= lead) {
        const m = event.deadlineMonthsFromNow;
        push({
          ...base,
          id: `report-due:${event.id}:${m}`,
          category: "deadlines",
          urgent: m <= 1,
          title: t(
            m === 0 ? "Rapport ska lämnas denna månad" : `Rapport ska lämnas om ${m} ${m === 1 ? "månad" : "månader"}`,
            m === 0 ? "Report due this month" : `Report due in ${m} ${m === 1 ? "month" : "months"}`
          ),
          detail: t(`${period.sv} · ${p.sv}`, `${period.en} · ${p.en}`),
        });
      }
    }
  }

  // --- Tasks -------------------------------------------------------------
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  for (const [projectId, list] of Object.entries(tasks)) {
    if (!projects.some((p) => p.id === projectId)) continue;
    const p = projectTitle(projectId);
    for (const task of list) {
      if (task.done || !task.dueDate) continue;
      const due = new Date(`${task.dueDate}T00:00:00`);
      const days = Math.round((due.getTime() - today.getTime()) / 86_400_000);
      if (days > TASK_DUE_SOON_DAYS) continue;
      push({
        id: `${days < 0 ? "task-overdue" : "task-due"}:${task.id}`,
        category: "deadlines",
        urgent: days <= 1,
        title: t(
          days < 0 ? "Uppgift försenad" : days === 0 ? "Uppgift ska vara klar i dag" : `Uppgift ska vara klar om ${days} dagar`,
          days < 0 ? "Task overdue" : days === 0 ? "Task due today" : `Task due in ${days} days`
        ),
        detail: t(`${task.text} · ${p.sv}`, `${task.text} · ${p.en}`),
        href: `/projekt/${projectId}`,
        entityKeys: [`project:${projectId}`],
        projectId,
        at: nowIso,
      });
    }
  }

  // --- Logged activity ---------------------------------------------------
  for (const a of activity) {
    if (a.kind === "application-status") {
      const r = applications.find((x) => x.id === a.applicationId);
      const labels: Record<string, { sv: string; en: string }> = {
        draft: t("Utkast", "Draft"),
        submitted: t("Inskickad", "Submitted"),
        "under-review": t("Under bedömning", "Under review"),
        awarded: t("Beviljad", "Awarded"),
        rejected: t("Avslag", "Rejected"),
        withdrawn: t("Återtagen", "Withdrawn"),
      };
      const label = labels[a.status] ?? t(a.status, a.status);
      const p = projectTitle(a.projectId);
      push({
        id: a.id,
        category: "applications",
        urgent: false,
        title: t(`Ansökan ändrad till ${label.sv.toLowerCase()}`, `Application changed to ${label.en.toLowerCase()}`),
        detail: t(`${callTitle(a.callId).sv} · ${p.sv}`, `${callTitle(a.callId).en} · ${p.en}`),
        href: r ? applicationHref(r) : `/projekt/${a.projectId}`,
        entityKeys: [`application:${a.applicationId}`, `project:${a.projectId}`],
        projectId: a.projectId,
        at: a.at,
      });
    } else if (a.kind === "grant-registered") {
      const p = projectTitle(a.projectId);
      push({
        id: a.id,
        category: "reporting",
        urgent: false,
        title: t("Beviljat stöd registrerat – rapporteringen har startat", "Grant registered — reporting has started"),
        detail: t(`${callTitle(a.callId).sv} · ${p.sv}`, `${callTitle(a.callId).en} · ${p.en}`),
        href: `/stod/${a.grantId}`,
        entityKeys: [`grant:${a.grantId}`, `project:${a.projectId}`],
        projectId: a.projectId,
        at: a.at,
      });
    } else if (a.kind === "project-shared") {
      const p = projectTitle(a.projectId);
      push({
        id: a.id,
        category: "projects",
        urgent: false,
        title: t(`Projekt delat med ${a.unitName}`, `Project shared with ${a.unitName}`),
        detail: p,
        href: `/projekt/${a.projectId}`,
        entityKeys: [`project:${a.projectId}`],
        projectId: a.projectId,
        at: a.at,
      });
    } else if (a.kind === "call-imported") {
      push({
        id: a.id,
        category: "system",
        urgent: false,
        title: t("Ny utlysning importerad", "New call imported"),
        detail: callTitle(a.callId),
        href: `/eu-databas/${a.programId}/${a.callId}`,
        entityKeys: [`call:${a.callId}`],
        at: a.at,
      });
    }
  }

  // --- System: catalogue documents needing an update --------------------
  const outdatedDocs = calls.reduce((n, c) => n + c.documents.filter((d) => d.needsUpdate).length, 0);
  if (outdatedDocs > 0) {
    push({
      id: `docs-outdated:${outdatedDocs}`,
      category: "system",
      urgent: false,
      title: t(`${outdatedDocs} dokument i EU-databasen behöver uppdateras`, `${outdatedDocs} documents in the EU database need updating`),
      detail: t("Se Datacenter", "See Datacenter"),
      href: "/datacenter",
      entityKeys: [],
      at: nowIso,
    });
  }

  return out.sort((a, b) => (a.urgent === b.urgent ? (a.at < b.at ? 1 : a.at > b.at ? -1 : 0) : a.urgent ? -1 : 1));
}

/** Applies the user's preferences: categories switched off in the app are
 * dropped, and with scope "mine" so is anything about a project that
 * isn't one of theirs. */
export function filterForUser(
  notifications: AppNotification[],
  prefs: NotificationPreferences,
  isMyProject: (projectId: string) => boolean
): AppNotification[] {
  return notifications.filter(
    (n) => prefs.categories[n.category].inApp && (prefs.scope === "all" || !n.projectId || isMyProject(n.projectId))
  );
}

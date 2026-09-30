"use client";

import { useCallback, useEffect, useState } from "react";
import { Grant, ReportingEvent, ReportingEventStatus } from "@/lib/types";
import { notifyDataChanged } from "@/lib/hooks/useActivityLog";
import { withCurrentDeadline } from "@/lib/matching/reportingSchedule";

// Marking a reporting event as submitted from the UI — same no-backend,
// localStorage-overlay pattern as useProjectBank's edits: the seed data
// stays the source of truth for every reporting event the user hasn't
// touched, and only what they actually submit here gets persisted, keyed
// by "<awardedProjectId>:<reportingEventId>".
const STORAGE_KEY = "eu-navigator-reporting-submissions";
// A second, separate key for events that don't exist in the seed data at
// all yet — today, only a voluntary sustainability follow-up added after
// the final report. Kept apart from the submissions above because it's a
// different kind of write: adding a whole new event, not filling in an
// existing one.
const EXTRA_EVENTS_KEY = "eu-navigator-reporting-extra-events";
// A manual status override — there's no reviewer/case-officer role or
// approval workflow in this demo (see the awarded-project reporting
// review), so this lets someone set a report to "Godkänd" or
// "Komplettering begärd" directly instead of only ever landing on
// "Inlämnad" via submitReport. Kept separate from the submissions above:
// it overrides the *displayed* status without touching the submitted
// outcomes/note themselves.
const STATUS_OVERRIDES_KEY = "eu-navigator-reporting-status-overrides";
// Every status change with its date — the funder's responses ("Godkänd",
// "Komplettering begärd") as a dated trail. The latest entry is the
// event's status; the plain overrides above are read as a fallback for
// changes made before the trail existed.
const STATUS_HISTORY_KEY = "eu-navigator-reporting-status-history";
// The report being written: its text sections, the explanations for
// deviations, which required documents are ready, and who is responsible.
// Saved as it's typed, like an application draft.
const REPORT_DRAFTS_KEY = "eu-navigator-report-drafts";

export interface ReportingSubmission {
  outcomes: Record<string, number>; // indicator_sv -> reported value
  note: string;
  submittedAt: string; // ISO
  /** How much was spent this reporting period, when the form's financial
   * field was filled in. Undefined if left blank — same as with any other
   * optional field on a submission, not defaulted to 0. */
  spentThisPeriodSEK?: number;
  /** The report's text sections as submitted (section key -> text). */
  sections?: Record<string, string>;
  /** Explanations for indicators behind plan (indicator_sv -> text). */
  deviations?: Record<string, string>;
}

export interface StatusChange {
  status: ReportingEventStatus;
  at: string; // ISO
}

export interface ReportDraft {
  sections: Record<string, string>;
  deviations: Record<string, string>;
  /** Required document (its name) -> ticked as ready by hand. A document
   * with an attachment counts as ready without a tick. */
  checklist: Record<string, boolean>;
  /** DemoUser.id of the person responsible for this report. */
  ownerId?: string;
  /** The figures as typed so far (indicator_sv -> value), and the spend. */
  outcomes: Record<string, string>;
  spentThisPeriod: string;
  updatedAt: string;
}

export const EMPTY_REPORT_DRAFT: ReportDraft = {
  sections: {},
  deviations: {},
  checklist: {},
  outcomes: {},
  spentThisPeriod: "",
  updatedAt: "",
};

// Every submission for a given event, oldest first — a report that was
// sent back for correction and resubmitted has more than one entry here,
// which is exactly the audit trail: what was reported when, including the
// values that got corrected, not just the latest one.
type SubmissionsState = Record<string, ReportingSubmission[]>;
type ExtraEventsState = Record<string, ReportingEvent[]>; // awardedProjectId -> extra events
type StatusOverridesState = Record<string, ReportingEventStatus>; // "<projectId>:<eventId>" -> status
type StatusHistoryState = Record<string, StatusChange[]>;
type ReportDraftsState = Record<string, ReportDraft>;

const VALID_STATUSES: ReportingEventStatus[] = ["upcoming", "submitted", "approved", "revision-requested"];

function readJson<T>(key: string): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return {} as T;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : ({} as T);
  } catch {
    return {} as T;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable — the change just won't persist.
  }
  notifyDataChanged();
}

function sanitizeDraft(value: unknown): ReportDraft {
  const v = (value && typeof value === "object" ? value : {}) as Partial<ReportDraft>;
  const record = (x: unknown) => (x && typeof x === "object" ? (x as Record<string, never>) : {});
  return {
    sections: record(v.sections),
    deviations: record(v.deviations),
    checklist: record(v.checklist),
    ownerId: typeof v.ownerId === "string" && v.ownerId ? v.ownerId : undefined,
    outcomes: record(v.outcomes),
    spentThisPeriod: typeof v.spentThisPeriod === "string" ? v.spentThisPeriod : "",
    updatedAt: typeof v.updatedAt === "string" ? v.updatedAt : "",
  };
}

/** A stored report draft, outside the hook — e.g. for Rapportera's list or
 * an export. */
export function readReportDraft(projectId: string, eventId: string): ReportDraft {
  const all = readJson<ReportDraftsState>(REPORT_DRAFTS_KEY);
  const draft = all[storageKey(projectId, eventId)];
  return draft ? sanitizeDraft(draft) : EMPTY_REPORT_DRAFT;
}

function storageKey(projectId: string, eventId: string) {
  return `${projectId}:${eventId}`;
}

function read(): SubmissionsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(state: SubmissionsState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — the submission just won't persist.
  }
  notifyDataChanged();
}

function readExtra(): ExtraEventsState {
  try {
    const raw = window.localStorage.getItem(EXTRA_EVENTS_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeExtra(state: ExtraEventsState) {
  try {
    window.localStorage.setItem(EXTRA_EVENTS_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — the added event just won't persist.
  }
  notifyDataChanged();
}

function readStatusOverrides(): StatusOverridesState {
  try {
    const raw = window.localStorage.getItem(STATUS_OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const result: StatusOverridesState = {};
    for (const [key, value] of Object.entries(parsed as Record<string, unknown>)) {
      if (VALID_STATUSES.includes(value as ReportingEventStatus)) result[key] = value as ReportingEventStatus;
    }
    return result;
  } catch {
    return {};
  }
}

function writeStatusOverrides(state: StatusOverridesState) {
  try {
    window.localStorage.setItem(STATUS_OVERRIDES_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — the status change just won't persist.
  }
  notifyDataChanged();
}

export function useReportingSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionsState>({});
  const [extraEvents, setExtraEvents] = useState<ExtraEventsState>({});
  const [statusOverrides, setStatusOverrides] = useState<StatusOverridesState>({});
  const [statusHistory, setStatusHistory] = useState<StatusHistoryState>({});
  const [drafts, setDrafts] = useState<ReportDraftsState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSubmissions(read());
    setExtraEvents(readExtra());
    setStatusOverrides(readStatusOverrides());
    setStatusHistory(readJson<StatusHistoryState>(STATUS_HISTORY_KEY));
    setDrafts(readJson<ReportDraftsState>(REPORT_DRAFTS_KEY));
    setHydrated(true);
  }, []);

  const reportDraft = useCallback(
    (projectId: string, eventId: string): ReportDraft => {
      const draft = drafts[storageKey(projectId, eventId)];
      return draft ? sanitizeDraft(draft) : EMPTY_REPORT_DRAFT;
    },
    [drafts]
  );

  /** Merges `patch` into a report's draft and saves it straight away. */
  const updateReportDraft = useCallback((projectId: string, eventId: string, patch: Partial<Omit<ReportDraft, "updatedAt">>) => {
    const key = storageKey(projectId, eventId);
    const stored = readJson<ReportDraftsState>(REPORT_DRAFTS_KEY);
    const next = {
      ...stored,
      [key]: { ...sanitizeDraft(stored[key]), ...patch, updatedAt: new Date().toISOString() },
    };
    writeJson(REPORT_DRAFTS_KEY, next);
    setDrafts(next);
  }, []);

  const statusChanges = useCallback(
    (projectId: string, eventId: string): StatusChange[] => statusHistory[storageKey(projectId, eventId)] ?? [],
    [statusHistory]
  );

  // Records a new submission for an event — the first one moves it out of
  // "upcoming"; a later one (after "revision-requested") is a correction,
  // appended rather than overwriting the earlier attempt.
  const submitReport = useCallback(
    (
      projectId: string,
      eventId: string,
      outcomes: Record<string, number>,
      note: string,
      spentThisPeriodSEK?: number,
      content?: { sections?: Record<string, string>; deviations?: Record<string, string> }
    ) => {
      const key = storageKey(projectId, eventId);
      const stored = read();
      const next = {
        ...stored,
        [key]: [...(stored[key] ?? []), { outcomes, note, spentThisPeriodSEK, ...content, submittedAt: new Date().toISOString() }],
      };
      write(next);
      setSubmissions(next);
      // A (re)submission waits for the funder's answer again: it replaces
      // an earlier "Komplettering begärd" as the current status.
      const history = readJson<StatusHistoryState>(STATUS_HISTORY_KEY);
      const changes = history[key];
      if (changes && changes.length > 0) {
        const nextHistory = { ...history, [key]: [...changes, { status: "submitted" as const, at: new Date().toISOString() }] };
        writeJson(STATUS_HISTORY_KEY, nextHistory);
        setStatusHistory(nextHistory);
      }
      const overrides = readStatusOverrides();
      if (overrides[key]) {
        const rest = { ...overrides };
        delete rest[key];
        writeStatusOverrides(rest);
        setStatusOverrides(rest);
      }
    },
    []
  );

  const submissionHistory = useCallback(
    (projectId: string, eventId: string): ReportingSubmission[] => submissions[storageKey(projectId, eventId)] ?? [],
    [submissions]
  );

  // A voluntary, later follow-up beyond the core interim/final cycle —
  // e.g. an EU fund's "report the sustainability of results after N years"
  // obligation. Added on demand once the final report is in, not
  // pre-seeded, since it isn't part of the fixed reporting schedule.
  const addSustainabilityEvent = useCallback((projectId: string, deadlineMonthsFromNow: number) => {
    setExtraEvents((prev) => {
      const existing = prev[projectId] ?? [];
      const newEvent: ReportingEvent = {
        id: `${projectId}-sustainability-${Date.now()}`,
        type: "sustainability",
        periodLabel_sv: "Hållbarhetsuppföljning",
        periodLabel_en: "Sustainability follow-up",
        deadlineMonthsFromNow,
        status: "upcoming",
        outcomes: [],
      };
      const next = { ...prev, [projectId]: [...existing, newEvent] };
      writeExtra(next);
      return next;
    });
  }, []);

  // Manually sets an event's status — there's no reviewer role or
  // approval workflow to do this automatically (see the awarded-project
  // reporting review), so this is a direct override that always wins over
  // whatever submitReport would otherwise derive. Starts out unset (the
  // event's seed/submission-derived status shows until someone changes it).
  const setEventStatus = useCallback((projectId: string, eventId: string, status: ReportingEventStatus) => {
    const key = storageKey(projectId, eventId);
    const history = readJson<StatusHistoryState>(STATUS_HISTORY_KEY);
    const next = { ...history, [key]: [...(history[key] ?? []), { status, at: new Date().toISOString() }] };
    writeJson(STATUS_HISTORY_KEY, next);
    setStatusHistory(next);
  }, []);

  // Overlays any locally-submitted reports onto the seed Grant,
  // and appends any locally-added extra events (e.g. a sustainability
  // follow-up) — same shape-preserving overlay as useProjectBank's
  // withOverrides. An "upcoming" or "revision-requested" event with a
  // submission becomes "submitted" (a correction is re-submitted for
  // approval, not left stuck), carrying the latest reported outcomes/note.
  // A manual status override, if set, applies last and wins over both.
  const withSubmissions = useCallback(
    (project: Grant): Grant => {
      const extra = extraEvents[project.id] ?? [];
      const seedWithOverlay = project.reportingEvents.map((event) => {
        const history = submissions[storageKey(project.id, event.id)];
        const changes = statusHistory[storageKey(project.id, event.id)];
        const statusOverride =
          changes && changes.length > 0 ? changes[changes.length - 1].status : statusOverrides[storageKey(project.id, event.id)];
        const withHistory = !history || history.length === 0
          ? event
          : {
              ...event,
              status:
                event.status === "upcoming" || event.status === "revision-requested" ? ("submitted" as const) : event.status,
              outcomes: Object.entries(history[history.length - 1].outcomes).map(([indicator_sv, value]) => ({ indicator_sv, value })),
              note_sv: history[history.length - 1].note,
              note_en: history[history.length - 1].note,
              financials:
                history[history.length - 1].spentThisPeriodSEK !== undefined
                  ? { spentThisPeriodSEK: history[history.length - 1].spentThisPeriodSEK! }
                  : undefined,
            };
        return withCurrentDeadline(statusOverride ? { ...withHistory, status: statusOverride } : withHistory);
      });
      return { ...project, reportingEvents: [...seedWithOverlay, ...extra.map((e) => withCurrentDeadline(e))] };
    },
    [submissions, extraEvents, statusOverrides, statusHistory]
  );

  return {
    hydrated,
    submitReport,
    submissionHistory,
    addSustainabilityEvent,
    setEventStatus,
    statusChanges,
    reportDraft,
    updateReportDraft,
    withSubmissions,
  };
}

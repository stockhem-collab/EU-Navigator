"use client";

import { useCallback, useEffect, useState } from "react";
import { AwardedProject, ReportingEvent, ReportingEventStatus } from "@/lib/types";

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

export interface ReportingSubmission {
  outcomes: Record<string, number>; // indicator_sv -> reported value
  note: string;
  submittedAt: string; // ISO
}

// Every submission for a given event, oldest first — a report that was
// sent back for correction and resubmitted has more than one entry here,
// which is exactly the audit trail: what was reported when, including the
// values that got corrected, not just the latest one.
type SubmissionsState = Record<string, ReportingSubmission[]>;
type ExtraEventsState = Record<string, ReportingEvent[]>; // awardedProjectId -> extra events
type StatusOverridesState = Record<string, ReportingEventStatus>; // "<projectId>:<eventId>" -> status

const VALID_STATUSES: ReportingEventStatus[] = ["upcoming", "submitted", "approved", "revision-requested"];

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
}

export function useReportingSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionsState>({});
  const [extraEvents, setExtraEvents] = useState<ExtraEventsState>({});
  const [statusOverrides, setStatusOverrides] = useState<StatusOverridesState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSubmissions(read());
    setExtraEvents(readExtra());
    setStatusOverrides(readStatusOverrides());
    setHydrated(true);
  }, []);

  // Records a new submission for an event — the first one moves it out of
  // "upcoming"; a later one (after "revision-requested") is a correction,
  // appended rather than overwriting the earlier attempt.
  const submitReport = useCallback(
    (projectId: string, eventId: string, outcomes: Record<string, number>, note: string) => {
      setSubmissions((prev) => {
        const key = storageKey(projectId, eventId);
        const history = prev[key] ?? [];
        const next = { ...prev, [key]: [...history, { outcomes, note, submittedAt: new Date().toISOString() }] };
        write(next);
        return next;
      });
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
    setStatusOverrides((prev) => {
      const next = { ...prev, [storageKey(projectId, eventId)]: status };
      writeStatusOverrides(next);
      return next;
    });
  }, []);

  // Overlays any locally-submitted reports onto the seed AwardedProject,
  // and appends any locally-added extra events (e.g. a sustainability
  // follow-up) — same shape-preserving overlay as useProjectBank's
  // withOverrides. An "upcoming" or "revision-requested" event with a
  // submission becomes "submitted" (a correction is re-submitted for
  // approval, not left stuck), carrying the latest reported outcomes/note.
  // A manual status override, if set, applies last and wins over both.
  const withSubmissions = useCallback(
    (project: AwardedProject): AwardedProject => {
      const extra = extraEvents[project.id] ?? [];
      const seedWithOverlay = project.reportingEvents.map((event) => {
        const history = submissions[storageKey(project.id, event.id)];
        const statusOverride = statusOverrides[storageKey(project.id, event.id)];
        const withHistory = !history || history.length === 0
          ? event
          : {
              ...event,
              status:
                event.status === "upcoming" || event.status === "revision-requested" ? ("submitted" as const) : event.status,
              outcomes: Object.entries(history[history.length - 1].outcomes).map(([indicator_sv, value]) => ({ indicator_sv, value })),
              note_sv: history[history.length - 1].note,
              note_en: history[history.length - 1].note,
            };
        return statusOverride ? { ...withHistory, status: statusOverride } : withHistory;
      });
      return { ...project, reportingEvents: [...seedWithOverlay, ...extra] };
    },
    [submissions, extraEvents, statusOverrides]
  );

  return { hydrated, submitReport, submissionHistory, addSustainabilityEvent, setEventStatus, withSubmissions };
}

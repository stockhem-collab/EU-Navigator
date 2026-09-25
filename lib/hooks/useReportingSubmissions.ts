"use client";

import { useCallback, useEffect, useState } from "react";
import { AwardedProject } from "@/lib/types";

// Marking a reporting event as submitted from the UI — same no-backend,
// localStorage-overlay pattern as useProjectBank's edits: the seed data
// stays the source of truth for every reporting event the user hasn't
// touched, and only what they actually submit here gets persisted, keyed
// by "<awardedProjectId>:<reportingEventId>".
const STORAGE_KEY = "eu-navigator-reporting-submissions";

export interface ReportingSubmission {
  outcomes: Record<string, number>; // indicator_sv -> reported value
  note: string;
  submittedAt: string; // ISO
}

type SubmissionsState = Record<string, ReportingSubmission>;

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

export function useReportingSubmissions() {
  const [submissions, setSubmissions] = useState<SubmissionsState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setSubmissions(read());
    setHydrated(true);
  }, []);

  const submitReport = useCallback(
    (projectId: string, eventId: string, outcomes: Record<string, number>, note: string) => {
      setSubmissions((prev) => {
        const next = { ...prev, [storageKey(projectId, eventId)]: { outcomes, note, submittedAt: new Date().toISOString() } };
        write(next);
        return next;
      });
    },
    []
  );

  // Overlays any locally-submitted reports onto the seed AwardedProject —
  // an "upcoming" event with a submission becomes "submitted", carrying the
  // reported outcomes and note. Same shape-preserving overlay as
  // useProjectBank.withOverrides.
  const withSubmissions = useCallback(
    (project: AwardedProject): AwardedProject => ({
      ...project,
      reportingEvents: project.reportingEvents.map((event) => {
        const submission = submissions[storageKey(project.id, event.id)];
        if (!submission) return event;
        return {
          ...event,
          status: event.status === "upcoming" ? "submitted" : event.status,
          outcomes: Object.entries(submission.outcomes).map(([indicator_sv, value]) => ({ indicator_sv, value })),
          note_sv: submission.note,
          note_en: submission.note,
        };
      }),
    }),
    [submissions]
  );

  return { hydrated, submitReport, withSubmissions };
}

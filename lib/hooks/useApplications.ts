"use client";

import { useCallback, useEffect, useState } from "react";
import { ApplicationRecord, ApplicationStatus, ProjectStatus } from "@/lib/types";
import type { ProjectBankEdit } from "@/lib/hooks/useProjectBank";
import { isActiveApplication, projectStatusFromApplications } from "@/lib/matching/applications";

// The index of every application (ApplicationRecord) in this browser — which
// project, which call, what status. Each record's draft text and saved
// versions live separately, under DRAFT_KEY_PREFIX + record.id (see
// useApplication), so listing applications never has to parse drafts.
const RECORDS_KEY = "eu-navigator-application-records";
export const DRAFT_KEY_PREFIX = "eu-navigator-application:";

/** The id an application gets when it's the first one for its (project,
 * call) pair. Deliberately the same "<projectId>:<callId>" shape drafts
 * were stored under before applications had their own records, so those
 * existing drafts become that pair's first application without being
 * moved. */
export function defaultApplicationId(projectId: string, callId: string): string {
  return `${projectId}:${callId}`;
}

export function newApplicationId(projectId: string, callId: string, existing: ApplicationRecord[]): string {
  const base = defaultApplicationId(projectId, callId);
  if (!existing.some((r) => r.id === base)) return base;
  return `${base}:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;
}

function writeRecords(records: ApplicationRecord[]) {
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
  } catch {
    // localStorage unavailable — records stay in-memory for this session.
  }
}

// Drafts saved before application records existed: one per (project, call),
// under "<prefix><projectId>:<callId>". Each one that was actually worked on
// becomes a "draft" record with that same id. Ones opened but never edited
// are skipped, as the old "ongoing applications" list did.
function migrateLegacyDrafts(records: ApplicationRecord[]): ApplicationRecord[] {
  const known = new Set(records.map((r) => r.id));
  const migrated: ApplicationRecord[] = [];
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(DRAFT_KEY_PREFIX)) continue;
    const id = key.slice(DRAFT_KEY_PREFIX.length);
    if (known.has(id)) continue;
    const parts = id.split(":");
    if (parts.length !== 2) continue;
    let draft: { sectionDrafts?: unknown; versions?: unknown; updatedAt?: unknown } | null = null;
    try {
      draft = JSON.parse(window.localStorage.getItem(key) ?? "null");
    } catch {
      continue;
    }
    if (!draft || typeof draft !== "object") continue;
    const hasEdits = draft.sectionDrafts && typeof draft.sectionDrafts === "object" && Object.keys(draft.sectionDrafts).length > 0;
    const hasVersions = Array.isArray(draft.versions) && draft.versions.length > 0;
    if (!hasEdits && !hasVersions) continue;
    const updatedAt = typeof draft.updatedAt === "string" && draft.updatedAt ? draft.updatedAt : new Date().toISOString();
    migrated.push({ id, projectId: parts[0], callId: parts[1], status: "draft", createdAt: updatedAt, updatedAt });
  }
  return migrated;
}

export function readApplicationRecords(): ApplicationRecord[] {
  try {
    const raw = window.localStorage.getItem(RECORDS_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    const records: ApplicationRecord[] = Array.isArray(parsed) ? parsed : [];
    const migrated = migrateLegacyDrafts(records);
    if (migrated.length === 0) return records;
    const next = [...records, ...migrated];
    writeRecords(next);
    return next;
  } catch {
    return [];
  }
}

/** The most recently touched application still in play (draft,
 * submitted, under review) for a (project, call) pair. */
export function latestActiveApplicationFor(
  records: ApplicationRecord[],
  projectId: string,
  callId: string
): ApplicationRecord | undefined {
  return records
    .filter((r) => r.projectId === projectId && r.callId === callId && isActiveApplication(r))
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
}

/** Creates the record for `id` if it doesn't exist yet, and bumps its
 * updatedAt either way — called on every draft write, so an application
 * only gets a record once someone actually works on it. */
export function touchApplicationRecord(id: string, projectId: string, callId: string): ApplicationRecord {
  const records = readApplicationRecords();
  const now = new Date().toISOString();
  const existing = records.find((r) => r.id === id);
  const record: ApplicationRecord = existing
    ? { ...existing, updatedAt: now }
    : { id, projectId, callId, status: "draft", createdAt: now, updatedAt: now };
  writeRecords(existing ? records.map((r) => (r.id === id ? record : r)) : [...records, record]);
  return record;
}

/** Applies `patch` to one stored record (stamping submittedAt the first
 * time it leaves "draft") and returns the full updated list. */
export function patchApplicationRecord(
  id: string,
  patch: Partial<Pick<ApplicationRecord, "status" | "awardedProjectId">>
): ApplicationRecord[] {
  const now = new Date().toISOString();
  const next = readApplicationRecords().map((r) => {
    if (r.id !== id) return r;
    const updated: ApplicationRecord = { ...r, ...patch, updatedAt: now };
    if (patch.status && patch.status !== "draft" && !r.submittedAt) updated.submittedAt = now;
    return updated;
  });
  writeRecords(next);
  return next;
}

/** Moves the project's own status to what its applications imply (see
 * projectStatusFromApplications) — called after anything that creates an
 * application or changes one's status. */
export function syncProjectStatus(
  projectId: string,
  currentStatus: ProjectStatus,
  updateEntry: (id: string, patch: ProjectBankEdit) => void
) {
  const records = readApplicationRecords().filter((r) => r.projectId === projectId);
  const status = projectStatusFromApplications(currentStatus, records);
  if (status !== currentStatus) updateEntry(projectId, { status });
}

export function useApplications() {
  const [records, setRecords] = useState<ApplicationRecord[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRecords(readApplicationRecords());
    setHydrated(true);
  }, []);

  // Every mutation re-reads storage first: records are also written by
  // useApplication as drafts are edited, so this hook's own state can be
  // behind what's stored.
  const mutate = useCallback((change: (current: ApplicationRecord[]) => ApplicationRecord[]) => {
    const next = change(readApplicationRecords());
    writeRecords(next);
    setRecords(next);
    return next;
  }, []);

  /** A new, empty application — e.g. a fresh round to a call after a
   * rejection. */
  const createApplication = useCallback(
    (projectId: string, callId: string): ApplicationRecord => {
      const now = new Date().toISOString();
      let created: ApplicationRecord | undefined;
      mutate((current) => {
        created = {
          id: newApplicationId(projectId, callId, current),
          projectId,
          callId,
          status: "draft",
          createdAt: now,
          updatedAt: now,
        };
        return [...current, created];
      });
      return created!;
    },
    [mutate]
  );

  const updateApplication = useCallback(
    (id: string, patch: Partial<Pick<ApplicationRecord, "status" | "awardedProjectId">>) => {
      const next = patchApplicationRecord(id, patch);
      setRecords(next);
      return next;
    },
    []
  );

  const setApplicationStatus = useCallback(
    (id: string, status: ApplicationStatus) => updateApplication(id, { status }),
    [updateApplication]
  );

  /** Removes the record and its draft text and saved versions. */
  const deleteApplication = useCallback(
    (id: string) => {
      try {
        window.localStorage.removeItem(DRAFT_KEY_PREFIX + id);
      } catch {
        // Nothing stored to remove.
      }
      return mutate((current) => current.filter((r) => r.id !== id));
    },
    [mutate]
  );

  return { records, hydrated, createApplication, updateApplication, setApplicationStatus, deleteApplication };
}

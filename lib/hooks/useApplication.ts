"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ApplicationRecord, ApplicationStatus, ApplicationVersion } from "@/lib/types";
import {
  DRAFT_KEY_PREFIX,
  defaultApplicationId,
  latestActiveApplicationFor,
  newApplicationId,
  patchApplicationRecord,
  readApplicationRecords,
  touchApplicationRecord,
} from "@/lib/hooks/useApplications";
import { ApplicationBudget, sanitizeApplicationBudget } from "@/lib/matching/applicationBudget";

interface ApplicationDraft {
  /** Project-logic row label (Swedish label, used as a stable key) -> the
   * user's edited text. A label absent here means "still using the AI
   * suggestion as-is" — the same semantics the throwaway component state
   * had before this hook existed. */
  sectionDrafts: Record<string, string>;
  updatedAt: string; // ISO
  /** Named, immutable checkpoints ("Utkast", "Slutgiltig version", ...) —
   * see ApplicationVersion. Separate from the live sectionDrafts above,
   * which keep autosaving as the user types. */
  versions: ApplicationVersion[];
  /** The eligible budget and grant this application states, when set —
   * see ApplicationBudget. Empty = the project's figures. */
  budget: ApplicationBudget;
}

const EMPTY_DRAFT: ApplicationDraft = { sectionDrafts: {}, updatedAt: "", versions: [], budget: {} };

function storageKey(applicationId: string) {
  return `${DRAFT_KEY_PREFIX}${applicationId}`;
}

function readDraft(applicationId: string): ApplicationDraft {
  try {
    const raw = window.localStorage.getItem(storageKey(applicationId));
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw);
    return {
      sectionDrafts: parsed?.sectionDrafts && typeof parsed.sectionDrafts === "object" ? parsed.sectionDrafts : {},
      updatedAt: typeof parsed?.updatedAt === "string" ? parsed.updatedAt : "",
      versions: Array.isArray(parsed?.versions) ? parsed.versions : [],
      budget: sanitizeApplicationBudget(parsed?.budget),
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

function writeDraft(applicationId: string, draft: ApplicationDraft) {
  try {
    window.localStorage.setItem(storageKey(applicationId), JSON.stringify(draft));
  } catch {
    // localStorage unavailable (private browsing, storage full, …) — the
    // draft simply stays in-memory for the rest of this session instead.
  }
}

/** One-time transplant for an ad-hoc intake that just got saved as a new
 * Projektbank entry: writes its already-resolved section text straight to
 * the new (customerProjectId, callId) pair's storage key, outside of the
 * normal useApplication instance, so the very next render — once the
 * caller adopts this customerProjectId — reads it back via readDraft as if
 * it had been there all along. Without this, the switch from unpersisted
 * to persisted would silently drop everything the user had already typed. */
export function seedApplicationDraft(
  customerProjectId: string,
  callId: string,
  sectionDrafts: Record<string, string>,
  budget: ApplicationBudget = {}
) {
  const id = defaultApplicationId(customerProjectId, callId);
  writeDraft(id, { sectionDrafts, updatedAt: new Date().toISOString(), versions: [], budget });
  touchApplicationRecord(id, customerProjectId, callId);
}

/** The amounts a stored application states — e.g. to pre-fill the awarded
 * amount when its grant is registered. Empty when none were set. */
export function readApplicationBudget(applicationId: string): ApplicationBudget {
  return readDraft(applicationId).budget;
}

/** The sections a stored application's user has written or edited
 * (label -> text) — e.g. to suggest the grant's commitments from what the
 * application promised. */
export function readApplicationSections(applicationId: string): Record<string, string> {
  return readDraft(applicationId).sectionDrafts;
}

/**
 * Persists the editable project-logic draft — and named saved versions of
 * it — for one application (ApplicationRecord). The client-only stand-in
 * for docs/DATA_MODEL.md's `Application` + `ApplicationSection` entities,
 * which is where this would live in a real backend. Only enabled when the
 * workspace was reached from a saved Projektbank entry, i.e. a real
 * `customerProjectId` — an ad-hoc, unsaved intake (`customerProjectId ===
 * null`) keeps the previous behaviour of local-only state that resets on
 * refresh, since there's nothing stable to key persistence on for a project
 * that was never saved anywhere.
 *
 * Which application: `requestedApplicationId` when it belongs to this
 * project and call, else the pair's most recently touched application
 * that's still in play, else a new one (so "Starta ansökan" after a
 * rejection starts a fresh application rather than reopening the rejected
 * one). A new application's record is only created on its first edit, so
 * opening the workspace to look doesn't leave an empty one behind.
 */
export function useApplication(customerProjectId: string | null, callId: string, requestedApplicationId?: string | null) {
  const [draft, setDraftState] = useState<ApplicationDraft>(EMPTY_DRAFT);
  // The latest draft, for building the next one outside a state updater —
  // writing to storage (and to `record`) from inside an updater would be a
  // side effect React may run twice.
  const draftRef = useRef<ApplicationDraft>(EMPTY_DRAFT);
  const setDraft = useCallback((next: ApplicationDraft) => {
    draftRef.current = next;
    setDraftState(next);
  }, []);
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [record, setRecord] = useState<ApplicationRecord | undefined>(undefined);
  const [hydrated, setHydrated] = useState(false);

  // Which application these inputs resolve to — decided once per
  // (project, call, requested id) and kept in a ref, so an edit made before
  // the mount effect has run resolves to the same application the effect
  // will then load (a new application's id is random, so resolving twice
  // could otherwise pick two different ones and lose the first edit).
  const resolvedRef = useRef<{ key: string; id: string; record?: ApplicationRecord } | null>(null);
  const resolve = useCallback((): { id: string; record?: ApplicationRecord } | null => {
    if (!customerProjectId) return null;
    const key = `${customerProjectId}|${callId}|${requestedApplicationId ?? ""}`;
    if (resolvedRef.current?.key === key) return resolvedRef.current;
    const records = readApplicationRecords();
    const requested = requestedApplicationId
      ? records.find((r) => r.id === requestedApplicationId && r.projectId === customerProjectId && r.callId === callId)
      : undefined;
    const found = requested ?? latestActiveApplicationFor(records, customerProjectId, callId);
    resolvedRef.current = { key, id: found?.id ?? newApplicationId(customerProjectId, callId, records), record: found };
    return resolvedRef.current;
  }, [customerProjectId, callId, requestedApplicationId]);

  useEffect(() => {
    setHydrated(false);
    const resolved = resolve();
    if (!resolved) {
      setDraft(EMPTY_DRAFT);
      setApplicationId(null);
      setRecord(undefined);
      setHydrated(true);
      return;
    }
    setApplicationId(resolved.id);
    setRecord(resolved.record);
    setDraft(readDraft(resolved.id));
    setHydrated(true);
  }, [resolve, setDraft]);

  // Every draft change is saved and also creates/bumps the application's
  // record.
  const commit = useCallback(
    (change: (prev: ApplicationDraft) => ApplicationDraft) => {
      const next = change(draftRef.current);
      if (next === draftRef.current) return;
      setDraft(next);
      const resolved = resolve();
      if (!customerProjectId || !resolved) return;
      writeDraft(resolved.id, next);
      const touched = touchApplicationRecord(resolved.id, customerProjectId, callId);
      resolvedRef.current = { ...resolvedRef.current!, record: touched };
      setApplicationId(resolved.id);
      setRecord(touched);
    },
    [customerProjectId, callId, resolve, setDraft]
  );

  const setSection = useCallback(
    (label: string, value: string) =>
      commit((prev) => ({
        ...prev,
        sectionDrafts: { ...prev.sectionDrafts, [label]: value },
        updatedAt: new Date().toISOString(),
      })),
    [commit]
  );

  const resetSection = useCallback(
    (label: string) =>
      commit((prev) => {
        const sectionDrafts = { ...prev.sectionDrafts };
        delete sectionDrafts[label];
        return { ...prev, sectionDrafts, updatedAt: new Date().toISOString() };
      }),
    [commit]
  );

  /** Sets (or, with undefined, clears) the application's own amounts. */
  const setBudget = useCallback(
    (patch: ApplicationBudget) =>
      commit((prev) => ({
        ...prev,
        budget: sanitizeApplicationBudget({ ...prev.budget, ...patch }),
        updatedAt: new Date().toISOString(),
      })),
    [commit]
  );

  // Saves a named, immutable snapshot of the application as it reads right
  // now. `resolvedSections` is every section's *displayed* text (AI
  // suggestion or override alike) — the caller resolves this, since the
  // hook only tracks overrides, not the AI-generated defaults. Unlike the
  // continuously autosaved sectionDrafts above, a saved version's text
  // never changes later even if the underlying AI suggestion or project
  // data does.
  const saveVersion = useCallback(
    (name: string, resolvedSections: Record<string, string>) => {
      if (!customerProjectId) return;
      const version: ApplicationVersion = {
        id: `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
        name,
        createdAt: new Date().toISOString(),
        sectionDrafts: resolvedSections,
        budget: { ...draftRef.current.budget },
      };
      commit((prev) => ({ ...prev, versions: [...prev.versions, version] }));
    },
    [customerProjectId, commit]
  );

  // "Revert to this version": makes every section of the live draft an
  // explicit override matching the chosen version's saved text.
  const restoreVersion = useCallback(
    (id: string) =>
      commit((prev) => {
        const version = prev.versions.find((v) => v.id === id);
        if (!version) return prev;
        return {
          ...prev,
          sectionDrafts: { ...version.sectionDrafts },
          // Older versions didn't save amounts — restoring one leaves them.
          budget: version.budget ? sanitizeApplicationBudget(version.budget) : prev.budget,
          updatedAt: new Date().toISOString(),
        };
      }),
    [commit]
  );

  const deleteVersion = useCallback(
    (id: string) => commit((prev) => ({ ...prev, versions: prev.versions.filter((v) => v.id !== id) })),
    [commit]
  );

  /** Changes this application's status, creating its record first if it
   * hasn't been edited yet. */
  const setStatus = useCallback(
    (status: ApplicationStatus) => {
      const resolved = resolve();
      if (!customerProjectId || !resolved) return;
      touchApplicationRecord(resolved.id, customerProjectId, callId);
      const updated = patchApplicationRecord(resolved.id, { status }).find((r) => r.id === resolved.id);
      resolvedRef.current = { ...resolvedRef.current!, record: updated };
      setApplicationId(resolved.id);
      setRecord(updated);
    },
    [customerProjectId, callId, resolve]
  );

  return {
    sectionDrafts: draft.sectionDrafts,
    versions: draft.versions,
    budget: draft.budget,
    setBudget,
    setSection,
    resetSection,
    saveVersion,
    restoreVersion,
    deleteVersion,
    hydrated,
    isPersisted: customerProjectId !== null,
    applicationId,
    /** Undefined until the application has been edited or given a status. */
    record,
    setStatus,
  };
}

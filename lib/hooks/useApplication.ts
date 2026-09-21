"use client";

import { useCallback, useEffect, useState } from "react";
import { ApplicationVersion } from "@/lib/types";

const STORAGE_KEY_PREFIX = "eu-navigator-application:";

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
}

const EMPTY_DRAFT: ApplicationDraft = { sectionDrafts: {}, updatedAt: "", versions: [] };

function storageKey(customerProjectId: string, callId: string) {
  return `${STORAGE_KEY_PREFIX}${customerProjectId}:${callId}`;
}

function readDraft(customerProjectId: string, callId: string): ApplicationDraft {
  try {
    const raw = window.localStorage.getItem(storageKey(customerProjectId, callId));
    if (!raw) return EMPTY_DRAFT;
    const parsed = JSON.parse(raw);
    return {
      sectionDrafts: parsed?.sectionDrafts && typeof parsed.sectionDrafts === "object" ? parsed.sectionDrafts : {},
      updatedAt: typeof parsed?.updatedAt === "string" ? parsed.updatedAt : "",
      versions: Array.isArray(parsed?.versions) ? parsed.versions : [],
    };
  } catch {
    return EMPTY_DRAFT;
  }
}

function writeDraft(customerProjectId: string, callId: string, draft: ApplicationDraft) {
  try {
    window.localStorage.setItem(storageKey(customerProjectId, callId), JSON.stringify(draft));
  } catch {
    // localStorage unavailable (private browsing, storage full, …) — the
    // draft simply stays in-memory for the rest of this session instead.
  }
}

/**
 * Persists the editable project-logic draft — and named saved versions of
 * it — for one (customer project, call) pair. The client-only stand-in for
 * docs/DATA_MODEL.md's `Application` + `ApplicationSection` entities, which
 * is where this would live in a real backend. Only enabled when the
 * workspace was reached from a saved Projektbank entry, i.e. a real
 * `customerProjectId` — an ad-hoc, unsaved intake (`customerProjectId ===
 * null`) keeps the previous behaviour of local-only state that resets on
 * refresh, since there's nothing stable to key persistence on for a project
 * that was never saved anywhere.
 */
export function useApplication(customerProjectId: string | null, callId: string) {
  const [draft, setDraft] = useState<ApplicationDraft>(EMPTY_DRAFT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    if (!customerProjectId) {
      setDraft(EMPTY_DRAFT);
      setHydrated(true);
      return;
    }
    setDraft(readDraft(customerProjectId, callId));
    setHydrated(true);
  }, [customerProjectId, callId]);

  const setSection = useCallback(
    (label: string, value: string) => {
      setDraft((prev) => {
        const next: ApplicationDraft = {
          ...prev,
          sectionDrafts: { ...prev.sectionDrafts, [label]: value },
          updatedAt: new Date().toISOString(),
        };
        if (customerProjectId) writeDraft(customerProjectId, callId, next);
        return next;
      });
    },
    [customerProjectId, callId]
  );

  const resetSection = useCallback(
    (label: string) => {
      setDraft((prev) => {
        const sectionDrafts = { ...prev.sectionDrafts };
        delete sectionDrafts[label];
        const next: ApplicationDraft = { ...prev, sectionDrafts, updatedAt: new Date().toISOString() };
        if (customerProjectId) writeDraft(customerProjectId, callId, next);
        return next;
      });
    },
    [customerProjectId, callId]
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
      };
      setDraft((prev) => {
        const next: ApplicationDraft = { ...prev, versions: [...prev.versions, version] };
        writeDraft(customerProjectId, callId, next);
        return next;
      });
    },
    [customerProjectId, callId]
  );

  // "Revert to this version": makes every section of the live draft an
  // explicit override matching the chosen version's saved text.
  const restoreVersion = useCallback(
    (id: string) => {
      setDraft((prev) => {
        const version = prev.versions.find((v) => v.id === id);
        if (!version) return prev;
        const next: ApplicationDraft = {
          ...prev,
          sectionDrafts: { ...version.sectionDrafts },
          updatedAt: new Date().toISOString(),
        };
        if (customerProjectId) writeDraft(customerProjectId, callId, next);
        return next;
      });
    },
    [customerProjectId, callId]
  );

  const deleteVersion = useCallback(
    (id: string) => {
      setDraft((prev) => {
        const next: ApplicationDraft = { ...prev, versions: prev.versions.filter((v) => v.id !== id) };
        if (customerProjectId) writeDraft(customerProjectId, callId, next);
        return next;
      });
    },
    [customerProjectId, callId]
  );

  return {
    sectionDrafts: draft.sectionDrafts,
    versions: draft.versions,
    setSection,
    resetSection,
    saveVersion,
    restoreVersion,
    deleteVersion,
    hydrated,
    isPersisted: customerProjectId !== null,
  };
}

"use client";

import { useCallback, useEffect, useState } from "react";

const STORAGE_KEY_PREFIX = "eu-navigator-application:";

interface ApplicationDraft {
  /** Project-logic row label (Swedish label, used as a stable key) -> the
   * user's edited text. A label absent here means "still using the AI
   * suggestion as-is" — the same semantics the throwaway component state
   * had before this hook existed. */
  sectionDrafts: Record<string, string>;
  updatedAt: string; // ISO
}

function storageKey(customerProjectId: string, callId: string) {
  return `${STORAGE_KEY_PREFIX}${customerProjectId}:${callId}`;
}

function readDraft(customerProjectId: string, callId: string): ApplicationDraft | null {
  try {
    const raw = window.localStorage.getItem(storageKey(customerProjectId, callId));
    return raw ? (JSON.parse(raw) as ApplicationDraft) : null;
  } catch {
    return null;
  }
}

function writeDraft(customerProjectId: string, callId: string, sectionDrafts: Record<string, string>) {
  try {
    window.localStorage.setItem(
      storageKey(customerProjectId, callId),
      JSON.stringify({ sectionDrafts, updatedAt: new Date().toISOString() })
    );
  } catch {
    // localStorage unavailable (private browsing, storage full, …) — the
    // draft simply stays in-memory for the rest of this session instead.
  }
}

/**
 * Persists the editable project-logic draft for one (customer project, call)
 * pair — the client-only stand-in for docs/DATA_MODEL.md's `Application` +
 * `ApplicationSection` entities, which is where this would live in a real
 * backend. Only enabled when the workspace was reached from a saved
 * Projektbank entry, i.e. a real `customerProjectId` — an ad-hoc, unsaved
 * intake (`customerProjectId === null`) keeps the previous behaviour of
 * local-only state that resets on refresh, since there's nothing stable to
 * key persistence on for a project that was never saved anywhere.
 */
export function useApplication(customerProjectId: string | null, callId: string) {
  const [sectionDrafts, setSectionDrafts] = useState<Record<string, string>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(false);
    if (!customerProjectId) {
      setSectionDrafts({});
      setHydrated(true);
      return;
    }
    setSectionDrafts(readDraft(customerProjectId, callId)?.sectionDrafts ?? {});
    setHydrated(true);
  }, [customerProjectId, callId]);

  const setSection = useCallback(
    (label: string, value: string) => {
      setSectionDrafts((prev) => {
        const next = { ...prev, [label]: value };
        if (customerProjectId) writeDraft(customerProjectId, callId, next);
        return next;
      });
    },
    [customerProjectId, callId]
  );

  const resetSection = useCallback(
    (label: string) => {
      setSectionDrafts((prev) => {
        const next = { ...prev };
        delete next[label];
        if (customerProjectId) writeDraft(customerProjectId, callId, next);
        return next;
      });
    },
    [customerProjectId, callId]
  );

  return { sectionDrafts, setSection, resetSection, hydrated, isPersisted: customerProjectId !== null };
}

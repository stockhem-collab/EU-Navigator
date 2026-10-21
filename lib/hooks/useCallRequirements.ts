"use client";

import { useCallback, useEffect, useState } from "react";
import { ApplicationRequirement, RequirementChanges } from "@/lib/types";

// The requirements for a complete application added in Datacenter › Krav
// for a call, and the form's or programme's requirements marked as not
// applying to it — on top of the app's own (lib/data/applicationRequirements.ts
// and data/utlysningskrav.csv). Kept in this browser like the forms added
// in Datacenter › Mallar; they apply to every application to the call.
const STORAGE_KEY = "eu-navigator-call-requirements";

type Stored = Record<string, RequirementChanges>;

/** The changes as stored, outside React — for Översikt and scans. */
export function readCallRequirementChanges(): Stored {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? (parsed as Stored) : {};
  } catch {
    return {};
  }
}

function write(value: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage unavailable — the change lasts for this visit only.
  }
}

export function useCallRequirements() {
  const [stored, setStored] = useState<Stored>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStored(readCallRequirementChanges());
    setHydrated(true);
  }, []);

  const update = useCallback((callId: string, change: (prev: RequirementChanges) => RequirementChanges) => {
    setStored((prev) => {
      const next = { ...prev, [callId]: change(prev[callId] ?? {}) };
      write(next);
      return next;
    });
  }, []);

  const add = useCallback(
    (callId: string, requirements: ApplicationRequirement[]) =>
      update(callId, (prev) => ({ ...prev, add: [...(prev.add ?? []).filter((r) => !requirements.some((n) => n.id === r.id)), ...requirements] })),
    [update]
  );

  /** Takes away a requirement added here. */
  const removeAdded = useCallback(
    (callId: string, id: string) => update(callId, (prev) => ({ ...prev, add: (prev.add ?? []).filter((r) => r.id !== id) })),
    [update]
  );

  /** Marks a requirement of the form or programme as not applying to the
   * call, or (exclude = false) restores it. */
  const setExcluded = useCallback(
    (callId: string, id: string, exclude: boolean) =>
      update(callId, (prev) => {
        const remove = (prev.remove ?? []).filter((r) => r !== id);
        return { ...prev, remove: exclude ? [...remove, id] : remove };
      }),
    [update]
  );

  return { changesFor: (callId: string): RequirementChanges | undefined => stored[callId], all: stored, add, removeAdded, setExcluded, hydrated };
}

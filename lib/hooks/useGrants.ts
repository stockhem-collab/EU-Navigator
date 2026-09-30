"use client";

import { useCallback, useEffect, useState } from "react";
import { Grant } from "@/lib/types";
import { seedGrants } from "@/lib/data/grants";
import { notifyDataChanged } from "@/lib/hooks/useActivityLog";

// Grants ("beviljat stöd") registered from an awarded application on the
// project page — same seed-plus-localStorage-overlay pattern as
// useProjectBank's imported entries, since there's no backend to persist a
// new Grant to. The storage key predates the rename and is kept so existing
// data still loads.
const STORAGE_KEY = "eu-navigator-added-awarded-projects";
// Edits to a grant after it's registered (today: its commitments), for
// seeded and added grants alike — an overlay, like useProjectBank's.
const OVERRIDES_KEY = "eu-navigator-grant-overrides";
export type GrantEdit = Partial<Pick<Grant, "commitments">>;

function readOverrides(): Record<string, GrantEdit> {
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function readAdded(): Grant[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAdded(list: Grant[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable — the newly-awarded project stays in-memory
    // for this session only.
  }
  notifyDataChanged();
}

export function useGrants() {
  const [added, setAdded] = useState<Grant[]>([]);
  const [overrides, setOverrides] = useState<Record<string, GrantEdit>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAdded(readAdded());
    setOverrides(readOverrides());
    setHydrated(true);
  }, []);

  // Written straight away, not from a state updater: registering a grant
  // navigates to it right after.
  const addGrant = useCallback((project: Grant) => {
    const next = [...readAdded(), project];
    writeAdded(next);
    setAdded(next);
  }, []);

  const updateGrant = useCallback((id: string, patch: GrantEdit) => {
    const stored = readOverrides();
    const next = { ...stored, [id]: { ...stored[id], ...patch } };
    try {
      window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(next));
    } catch {
      // localStorage unavailable — the edit stays in-memory for this session.
    }
    setOverrides(next);
    notifyDataChanged();
  }, []);

  const all: Grant[] = [...seedGrants, ...added].map((g) => (overrides[g.id] ? { ...g, ...overrides[g.id] } : g));

  return { all, added, addGrant, updateGrant, hydrated };
}

/** Seed-or-added lookup by id, for the rare spot that needs one outside a
 * component that already called useGrants() — mirrors
 * findAnyProjectBankEntry. */
export function findAnyGrant(id: string): Grant | undefined {
  return seedGrants.find((a) => a.id === id) ?? readAdded().find((a) => a.id === id);
}

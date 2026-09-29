"use client";

import { useCallback, useEffect, useState } from "react";
import { Grant } from "@/lib/types";
import { seedGrants } from "@/lib/data/grants";

// Awarded projects created from the Projektbank once a project actually
// wins funding (see ApplicationWorkspace's "Markera som beviljad") — same
// seed-plus-localStorage-overlay pattern as useProjectBank's imported
// entries, since there's no backend to persist a brand-new Grant
// to.
const STORAGE_KEY = "eu-navigator-added-awarded-projects";

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
}

export function useGrants() {
  const [added, setAdded] = useState<Grant[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAdded(readAdded());
    setHydrated(true);
  }, []);

  const addGrant = useCallback((project: Grant) => {
    setAdded((prev) => {
      const next = [...prev, project];
      writeAdded(next);
      return next;
    });
  }, []);

  const all: Grant[] = [...seedGrants, ...added];

  return { all, added, addGrant, hydrated };
}

/** Seed-or-added lookup by id, for the rare spot that needs one outside a
 * component that already called useGrants() — mirrors
 * findAnyProjectBankEntry. */
export function findAnyGrant(id: string): Grant | undefined {
  return seedGrants.find((a) => a.id === id) ?? readAdded().find((a) => a.id === id);
}

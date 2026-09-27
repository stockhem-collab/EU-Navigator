"use client";

import { useCallback, useEffect, useState } from "react";
import { AwardedProject } from "@/lib/types";
import { awardedProjects as seededAwardedProjects } from "@/lib/data/awardedProjects";

// Awarded projects created from the Projektbank once a project actually
// wins funding (see ApplicationWorkspace's "Markera som beviljad") — same
// seed-plus-localStorage-overlay pattern as useProjectBank's imported
// entries, since there's no backend to persist a brand-new AwardedProject
// to.
const STORAGE_KEY = "eu-navigator-added-awarded-projects";

function readAdded(): AwardedProject[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeAdded(list: AwardedProject[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // localStorage unavailable — the newly-awarded project stays in-memory
    // for this session only.
  }
}

export function useAwardedProjects() {
  const [added, setAdded] = useState<AwardedProject[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setAdded(readAdded());
    setHydrated(true);
  }, []);

  const addAwardedProject = useCallback((project: AwardedProject) => {
    setAdded((prev) => {
      const next = [...prev, project];
      writeAdded(next);
      return next;
    });
  }, []);

  const all: AwardedProject[] = [...seededAwardedProjects, ...added];

  return { all, added, addAwardedProject, hydrated };
}

/** Seed-or-added lookup by id, for the rare spot that needs one outside a
 * component that already called useAwardedProjects() — mirrors
 * findAnyProjectBankEntry. */
export function findAnyAwardedProject(id: string): AwardedProject | undefined {
  return seededAwardedProjects.find((a) => a.id === id) ?? readAdded().find((a) => a.id === id);
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { ProjectBankEntry } from "@/lib/types";
import { projectBank as seededProjectBank } from "@/lib/data/projectBank";

// The project bank as actually shown to a user: the seeded demo entries
// plus anything imported via CSV in this browser. There's no backend, so
// "imported" means persisted to localStorage — shared across this
// browser's tabs/sessions, but not with anyone else. This is the single
// place that merge happens so every page (list, detail, datacenter,
// bevakning, översikt) sees the same combined portfolio.
const STORAGE_KEY = "eu-navigator-imported-projects";

function readImported(): ProjectBankEntry[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeImported(entries: ProjectBankEntry[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // localStorage unavailable (private browsing, quota) — imports just
    // won't persist across reloads; nothing to do about it here.
  }
}

export function useProjectBank() {
  const [imported, setImported] = useState<ProjectBankEntry[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setImported(readImported());
    setHydrated(true);
  }, []);

  const addImported = useCallback((entries: ProjectBankEntry[]) => {
    setImported((prev) => {
      const next = [...prev, ...entries];
      writeImported(next);
      return next;
    });
  }, []);

  const removeImported = useCallback((id: string) => {
    setImported((prev) => {
      const next = prev.filter((e) => e.id !== id);
      writeImported(next);
      return next;
    });
  }, []);

  const clearImported = useCallback(() => {
    setImported([]);
    writeImported([]);
  }, []);

  const all: ProjectBankEntry[] = [...seededProjectBank, ...imported];

  return { all, imported, addImported, removeImported, clearImported, hydrated };
}

export function findAnyProjectBankEntry(id: string): ProjectBankEntry | undefined {
  const fromSeed = seededProjectBank.find((p) => p.id === id);
  if (fromSeed) return fromSeed;
  return readImported().find((p) => p.id === id);
}

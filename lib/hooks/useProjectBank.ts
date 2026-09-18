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

// Edits to any entry (seeded or imported) — a project idea starts out
// rough (e.g. while "Under bedömning") and gets filled in over time. Kept
// as a separate overlay, same pattern as useOrgConfig, so a seeded entry's
// edits don't require rewriting the static seed data, and an imported
// entry's edits survive a re-import of the same CSV.
const OVERRIDES_KEY = "eu-navigator-project-overrides";

export type ProjectBankEdit = Partial<Omit<ProjectBankEntry, "id">>;

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

function readOverrides(): Record<string, ProjectBankEdit> {
  try {
    const raw = window.localStorage.getItem(OVERRIDES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeOverrides(overrides: Record<string, ProjectBankEdit>) {
  try {
    window.localStorage.setItem(OVERRIDES_KEY, JSON.stringify(overrides));
  } catch {
    // localStorage unavailable — edits just won't persist.
  }
}

export function useProjectBank() {
  const [imported, setImported] = useState<ProjectBankEntry[]>([]);
  const [overrides, setOverrides] = useState<Record<string, ProjectBankEdit>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setImported(readImported());
    setOverrides(readOverrides());
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

  const updateEntry = useCallback((id: string, patch: ProjectBankEdit) => {
    setOverrides((prev) => {
      const next = { ...prev, [id]: { ...prev[id], ...patch } };
      writeOverrides(next);
      return next;
    });
  }, []);

  const withOverrides = useCallback(
    (entry: ProjectBankEntry): ProjectBankEntry => (overrides[entry.id] ? { ...entry, ...overrides[entry.id] } : entry),
    [overrides]
  );

  const all: ProjectBankEntry[] = [...seededProjectBank, ...imported].map(withOverrides);

  return { all, imported, addImported, removeImported, clearImported, updateEntry, hydrated };
}

export function findAnyProjectBankEntry(id: string): ProjectBankEntry | undefined {
  const entry = seededProjectBank.find((p) => p.id === id) ?? readImported().find((p) => p.id === id);
  if (!entry) return undefined;
  const override = readOverrides()[id];
  return override ? { ...entry, ...override } : entry;
}

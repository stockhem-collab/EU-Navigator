"use client";

import { useCallback, useEffect, useState } from "react";
import { ProjectBankEntry, normalizeProjectStatus } from "@/lib/types";
import { projectBank as seededProjectBank } from "@/lib/data/projectBank";

// The project bank as actually shown to a user: the seeded demo entries
// plus anything imported via CSV in this browser. There's no backend, so
// "imported" means persisted to localStorage — shared across this
// browser's tabs/sessions, but not with anyone else. This is the single
// place that merge happens so every page (list, detail, datacenter,
// bevakning, översikt) sees the same combined portfolio.
const STORAGE_KEY = "eu-navigator-imported-projects";

// Deleting a project (seeded or imported) is a soft delete — its id just
// gets listed here and filtered out of `all` — so a mistaken or
// since-regretted delete can be undone from Projektbank's "Borttagna
// projekt" panel, instead of the entry being gone for good.
const DELETED_KEY = "eu-navigator-deleted-project-ids";

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

function readDeletedIds(): string[] {
  try {
    const raw = window.localStorage.getItem(DELETED_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeDeletedIds(ids: string[]) {
  try {
    window.localStorage.setItem(DELETED_KEY, JSON.stringify(ids));
  } catch {
    // localStorage unavailable — deletions just won't persist.
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
  const [deletedIds, setDeletedIds] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setImported(readImported());
    setOverrides(readOverrides());
    setDeletedIds(readDeletedIds());
    setHydrated(true);
  }, []);

  // Written straight away, like updateEntry below: the caller may navigate
  // to the new project right after.
  const addImported = useCallback((entries: ProjectBankEntry[]) => {
    const next = [...readImported(), ...entries];
    writeImported(next);
    setImported(next);
  }, []);

  const deleteEntry = useCallback((id: string) => {
    setDeletedIds((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      writeDeletedIds(next);
      return next;
    });
  }, []);

  const restoreEntry = useCallback((id: string) => {
    setDeletedIds((prev) => {
      const next = prev.filter((existing) => existing !== id);
      writeDeletedIds(next);
      return next;
    });
  }, []);

  // Soft-deletes every currently-imported entry at once, the same
  // recoverable way as deleteEntry — the underlying rows stay in
  // `imported` (so a re-import of the same CSV still dedupes against
  // them) and only their ids move into the deleted list.
  const clearImported = useCallback(() => {
    setDeletedIds((prev) => {
      const next = Array.from(new Set([...prev, ...imported.map((e) => e.id)]));
      writeDeletedIds(next);
      return next;
    });
  }, [imported]);

  // A field set to undefined in `patch` clears it — stored as null, since
  // JSON drops undefined and the entry's own value would show through.
  const updateEntry = useCallback((id: string, patch: ProjectBankEdit) => {
    const cleared = Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, v === undefined ? null : v]));
    // Written straight away, not from inside a state updater: a caller may
    // navigate right after (e.g. saving from the project form), and the
    // next page reads storage before this page would render again.
    const stored = readOverrides();
    const next = { ...stored, [id]: { ...stored[id], ...cleared } as ProjectBankEdit };
    writeOverrides(next);
    setOverrides(next);
  }, []);

  // Stored statuses can predate the lifecycle-only ProjectStatus (see
  // normalizeProjectStatus); normalised on read rather than migrated in
  // storage, so nothing is rewritten behind the user's back.
  const withOverrides = useCallback(
    (entry: ProjectBankEntry): ProjectBankEntry => {
      const override = overrides[entry.id];
      let merged = entry;
      if (override) {
        merged = { ...entry, ...override };
        for (const [key, value] of Object.entries(override)) {
          if (value === null) delete (merged as unknown as Record<string, unknown>)[key];
        }
      }
      const status = normalizeProjectStatus(merged.status);
      return status === merged.status ? merged : { ...merged, status };
    },
    [overrides]
  );

  const everyEntry: ProjectBankEntry[] = [...seededProjectBank, ...imported].map(withOverrides);
  const all = everyEntry.filter((entry) => !deletedIds.includes(entry.id));
  const deletedEntries = everyEntry.filter((entry) => deletedIds.includes(entry.id));

  return { all, imported, deletedEntries, addImported, deleteEntry, restoreEntry, clearImported, updateEntry, hydrated };
}

export function findAnyProjectBankEntry(id: string): ProjectBankEntry | undefined {
  if (readDeletedIds().includes(id)) return undefined;
  const entry = seededProjectBank.find((p) => p.id === id) ?? readImported().find((p) => p.id === id);
  if (!entry) return undefined;
  const override = readOverrides()[id];
  const merged = override ? { ...entry, ...override } : entry;
  return { ...merged, status: normalizeProjectStatus(merged.status) };
}

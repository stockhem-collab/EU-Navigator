"use client";

import { useCallback, useEffect, useState } from "react";
import { Sector } from "@/lib/types";

// "Mina bevakningar" — which subject areas and EU programmes this person
// watches, and when they want to be notified. Persisted to localStorage,
// same no-backend demo pattern as the rest of /installningar: nothing here
// actually sends an email or a push notification yet.
const STORAGE_KEY = "eu-navigator-watch-preferences";

export type DigestFrequency = "instant" | "daily" | "weekly";

export interface NotifyPreferences {
  newCallMatchesOrg: boolean;
  callMatchesProject: boolean;
  highRelevanceMatch: boolean;
  deadlineApproaching: boolean;
  commentOnApplication: boolean;
  reportingDeadline: boolean;
}

export interface WatchPreferences {
  sectors: Sector[];
  programIds: string[];
  notify: NotifyPreferences;
  digest: DigestFrequency;
}

const DEFAULT: WatchPreferences = {
  sectors: ["digital", "climate", "social"],
  programIds: [],
  notify: {
    newCallMatchesOrg: true,
    callMatchesProject: true,
    highRelevanceMatch: true,
    deadlineApproaching: true,
    commentOnApplication: true,
    reportingDeadline: true,
  },
  digest: "weekly",
};

function read(): WatchPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      sectors: Array.isArray(parsed.sectors) ? parsed.sectors : DEFAULT.sectors,
      programIds: Array.isArray(parsed.programIds) ? parsed.programIds : DEFAULT.programIds,
      notify: { ...DEFAULT.notify, ...(parsed.notify && typeof parsed.notify === "object" ? parsed.notify : {}) },
      digest: parsed.digest === "instant" || parsed.digest === "daily" || parsed.digest === "weekly" ? parsed.digest : DEFAULT.digest,
    };
  } catch {
    return DEFAULT;
  }
}

function write(prefs: WatchPreferences) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage unavailable — preferences just won't persist.
  }
}

export function useWatchPreferences() {
  const [prefs, setPrefs] = useState<WatchPreferences>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(read());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: WatchPreferences) => WatchPreferences) => {
    setPrefs((prev) => {
      const next = updater(prev);
      write(next);
      return next;
    });
  }, []);

  const toggleSector = useCallback(
    (sector: Sector) =>
      update((prev) => ({
        ...prev,
        sectors: prev.sectors.includes(sector) ? prev.sectors.filter((s) => s !== sector) : [...prev.sectors, sector],
      })),
    [update]
  );

  const toggleProgram = useCallback(
    (programId: string) =>
      update((prev) => ({
        ...prev,
        programIds: prev.programIds.includes(programId)
          ? prev.programIds.filter((p) => p !== programId)
          : [...prev.programIds, programId],
      })),
    [update]
  );

  const toggleNotify = useCallback(
    (key: keyof NotifyPreferences) =>
      update((prev) => ({ ...prev, notify: { ...prev.notify, [key]: !prev.notify[key] } })),
    [update]
  );

  const setDigest = useCallback((digest: DigestFrequency) => update((prev) => ({ ...prev, digest })), [update]);

  const resetAll = useCallback(() => {
    setPrefs(DEFAULT);
    write(DEFAULT);
  }, []);

  return { prefs, hydrated, toggleSector, toggleProgram, toggleNotify, setDigest, resetAll };
}

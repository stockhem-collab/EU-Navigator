"use client";

import { useCallback, useEffect, useState } from "react";
import { Sector } from "@/lib/types";
import { notifyDataChanged } from "@/lib/hooks/useActivityLog";

// "Mina bevakningar" — which subject areas, EU programmes and individual
// calls this person watches. Watched calls and programmes feed the
// notifications (deadline and change reminders); how and when to be
// notified is useNotificationPreferences. Persisted to localStorage, same
// no-backend demo pattern as the rest of /installningar.
const STORAGE_KEY = "eu-navigator-watch-preferences";

export interface WatchPreferences {
  sectors: Sector[];
  programIds: string[];
  /** Individually flagged calls — the direct, unambiguous "watch this
   * specific utlysning" action (from Ansöka → Hitta finansiering or a
   * call's own page), as opposed to the broader sector/programme
   * preferences above, which watch entire categories at once. */
  callIds: string[];
}

const DEFAULT: WatchPreferences = {
  sectors: ["digital", "climate", "social"],
  programIds: [],
  callIds: [],
};

function read(): WatchPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      sectors: Array.isArray(parsed.sectors) ? parsed.sectors : DEFAULT.sectors,
      programIds: Array.isArray(parsed.programIds) ? parsed.programIds : DEFAULT.programIds,
      callIds: Array.isArray(parsed.callIds) ? parsed.callIds : DEFAULT.callIds,
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
  notifyDataChanged();
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

  const toggleCall = useCallback(
    (callId: string) =>
      update((prev) => ({
        ...prev,
        callIds: prev.callIds.includes(callId) ? prev.callIds.filter((c) => c !== callId) : [...prev.callIds, callId],
      })),
    [update]
  );

  const resetAll = useCallback(() => {
    setPrefs(DEFAULT);
    write(DEFAULT);
  }, []);

  return {
    prefs,
    hydrated,
    toggleSector,
    toggleProgram,
    toggleCall,
    resetAll,
  };
}

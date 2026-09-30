"use client";

import { useCallback, useEffect, useState } from "react";

// "Visa endast mina och delade projekt" is one choice, not one per page:
// ticking it on Projekt should still hold on Ansöka, Rapportera and
// Översikt. Stored per browser, like the rest of the demo's preferences.
const STORAGE_KEY = "eu-navigator-only-mine-and-shared";

export function useOnlyMineAndShared(): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(false);

  useEffect(() => {
    try {
      setValue(window.localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable — the choice lasts for this page only.
    }
  }, []);

  const update = useCallback((next: boolean) => {
    setValue(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // As above.
    }
  }, []);

  return [value, update];
}

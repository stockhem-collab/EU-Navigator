"use client";

import { useCallback, useEffect, useState } from "react";

// "Visa endast mina och delade projekt" is one choice, not one per page:
// it sits in the header on Översikt, Projekt, Ansöka and Rapportera and
// holds on all of them. Stored per browser, like the rest of the demo's
// preferences; an event keeps the header and the page in step.
const STORAGE_KEY = "eu-navigator-only-mine-and-shared";
const CHANGE_EVENT = "eu-navigator-only-mine-and-shared-change";

export function useOnlyMineAndShared(): [boolean, (value: boolean) => void] {
  const [value, setValue] = useState(false);

  useEffect(() => {
    try {
      setValue(window.localStorage.getItem(STORAGE_KEY) === "true");
    } catch {
      // localStorage unavailable — the choice lasts for this page only.
    }
    const onChange = (e: Event) => setValue((e as CustomEvent<boolean>).detail);
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  const update = useCallback((next: boolean) => {
    setValue(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, String(next));
    } catch {
      // As above.
    }
    window.dispatchEvent(new CustomEvent(CHANGE_EVENT, { detail: next }));
  }, []);

  return [value, update];
}

"use client";

import { useCallback, useEffect, useState } from "react";

// Whether the Ansökningsstudio opens on the Krav tab: the first time an
// application is opened, unless the user has turned that off. Per browser.
const SHOW_FIRST_KEY = "eu-navigator-requirements-first";
const SEEN_KEY = "eu-navigator-requirements-seen";

function readSeen(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(SEEN_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function useRequirementsIntro() {
  const [showFirst, setShowFirstState] = useState(true);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      setShowFirstState(window.localStorage.getItem(SHOW_FIRST_KEY) !== "off");
    } catch {
      // localStorage unavailable — keep the default.
    }
    setHydrated(true);
  }, []);

  const setShowFirst = useCallback((value: boolean) => {
    setShowFirstState(value);
    try {
      if (value) window.localStorage.removeItem(SHOW_FIRST_KEY);
      else window.localStorage.setItem(SHOW_FIRST_KEY, "off");
    } catch {
      // The choice lasts for this visit only.
    }
  }, []);

  /** Whether the application (or, unsaved, the call) has been opened
   * before — and marks it as opened. */
  const firstVisit = useCallback((key: string): boolean => {
    const seen = readSeen();
    if (seen.includes(key)) return false;
    try {
      window.localStorage.setItem(SEEN_KEY, JSON.stringify([...seen, key].slice(-500)));
    } catch {
      // Without storage every visit is a first one.
    }
    return true;
  }, []);

  return { showFirst, setShowFirst, firstVisit, hydrated };
}

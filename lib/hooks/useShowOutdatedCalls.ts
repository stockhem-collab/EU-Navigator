"use client";

import { useCallback, useEffect, useState } from "react";

// Whether the call lists also show calls whose deadline has passed. Off by
// default, so active and upcoming calls are what a list shows; the choice
// is remembered in this browser and shared by every call list.
const STORAGE_KEY = "eu-navigator-show-outdated-calls";
const EVENT = "eu-navigator-show-outdated-calls";

function read(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function useShowOutdatedCalls() {
  const [show, setShowState] = useState(false);

  useEffect(() => {
    setShowState(read());
    // Two lists on one page stay in step.
    const sync = () => setShowState(read());
    window.addEventListener(EVENT, sync);
    return () => window.removeEventListener(EVENT, sync);
  }, []);

  const setShow = useCallback((value: boolean) => {
    try {
      if (value) window.localStorage.setItem(STORAGE_KEY, "1");
      else window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // localStorage unavailable — the choice lasts for this page only.
    }
    setShowState(value);
    window.dispatchEvent(new Event(EVENT));
  }, []);

  return { show, setShow };
}

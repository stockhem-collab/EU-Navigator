"use client";

import { useCallback, useEffect, useState } from "react";

// Which audit-readiness items (lib/data/auditChecklist.ts) are in order
// for each grant, and when they were ticked — per browser, like the rest
// of the demo's data.
const STORAGE_KEY = "eu-navigator-audit-checklist";

/** grantId -> itemId -> when it was ticked (ISO). */
type Stored = Record<string, Record<string, string>>;

function read(): Stored {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(value: Stored) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // localStorage unavailable — the ticks last for this visit only.
  }
}

export function useAuditChecklist(grantId: string) {
  const [stored, setStored] = useState<Stored>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setStored(read());
    setHydrated(true);
  }, []);

  const done = stored[grantId] ?? {};

  const toggle = useCallback(
    (itemId: string) => {
      setStored((prev) => {
        const forGrant = { ...(prev[grantId] ?? {}) };
        if (forGrant[itemId]) delete forGrant[itemId];
        else forGrant[itemId] = new Date().toISOString();
        const next = { ...prev, [grantId]: forGrant };
        write(next);
        return next;
      });
    },
    [grantId]
  );

  return { done, toggle, hydrated };
}

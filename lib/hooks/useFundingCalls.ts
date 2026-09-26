"use client";

import { useCallback, useEffect, useState } from "react";
import { FundingCall } from "@/lib/types";
import { fundingCalls as seededFundingCalls } from "@/lib/data/fundingCalls";

// The call catalogue as actually shown to a user: the seeded utlysningar
// plus anything added through Datacenter's utlysningsimport tool. Same
// no-backend, localStorage-overlay pattern as useProjectBank — this is the
// one place the merge happens so every page (EU-databas, Bevakning,
// matching, Datacenter) sees the same combined catalogue.
const STORAGE_KEY = "eu-navigator-imported-calls";

function readImported(): FundingCall[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeImported(calls: FundingCall[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(calls));
  } catch {
    // localStorage unavailable — the imported call just won't persist.
  }
}

export function useFundingCalls() {
  const [imported, setImported] = useState<FundingCall[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setImported(readImported());
    setHydrated(true);
  }, []);

  const addImportedCall = useCallback((call: FundingCall) => {
    setImported((prev) => {
      const next = [...prev, call];
      writeImported(next);
      return next;
    });
  }, []);

  const removeImportedCall = useCallback((id: string) => {
    setImported((prev) => {
      const next = prev.filter((c) => c.id !== id);
      writeImported(next);
      return next;
    });
  }, []);

  const all: FundingCall[] = [...seededFundingCalls, ...imported];

  return { all, imported, addImportedCall, removeImportedCall, hydrated };
}

/** Same lookup as fundingCalls.ts's findCall, but also checks calls added
 * through the import tool — for use outside React render (e.g.
 * useOngoingApplications' localStorage scan) where the hook isn't
 * available. */
export function findAnyCall(id: string): FundingCall | undefined {
  return seededFundingCalls.find((c) => c.id === id) ?? readImported().find((c) => c.id === id);
}

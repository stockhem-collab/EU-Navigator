"use client";

import { useEffect, useState } from "react";
import { findAnyProjectBankEntry } from "@/lib/hooks/useProjectBank";
import { findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { FundingCall, FundingProgram, ProjectBankEntry } from "@/lib/types";

// A quick way back into whatever application a user is actively working on
// — reads the same localStorage records useApplication (lib/hooks/
// useApplication.ts) already writes, one row per (customer project, call)
// pair, rather than adding a second source of truth for "what's in
// progress". There's no index of these keys anywhere, so this scans
// localStorage for the "eu-navigator-application:" prefix directly.
const STORAGE_KEY_PREFIX = "eu-navigator-application:";

export interface OngoingApplication {
  entry: ProjectBankEntry;
  call: FundingCall;
  program: FundingProgram;
  updatedAt: string; // ISO; "" if never recorded
  versionCount: number;
}

function readAll(): OngoingApplication[] {
  const results: OngoingApplication[] = [];
  try {
    for (let i = 0; i < window.localStorage.length; i++) {
      const key = window.localStorage.key(i);
      if (!key || !key.startsWith(STORAGE_KEY_PREFIX)) continue;

      const idPart = key.slice(STORAGE_KEY_PREFIX.length); // "<customerProjectId>:<callId>"
      const sep = idPart.indexOf(":");
      if (sep === -1) continue;
      const customerProjectId = idPart.slice(0, sep);
      const callId = idPart.slice(sep + 1);

      // A stale key from a since-deleted Projektbank entry or a call that no
      // longer exists in the seed data — nothing to resume, skip quietly.
      const entry = findAnyProjectBankEntry(customerProjectId);
      const call = findCall(callId);
      if (!entry || !call) continue;
      const program = findProgram(call.programId);
      if (!program) continue;

      let raw: unknown;
      try {
        raw = JSON.parse(window.localStorage.getItem(key) ?? "null");
      } catch {
        continue;
      }
      if (!raw || typeof raw !== "object") continue;
      const draft = raw as { sectionDrafts?: unknown; versions?: unknown; updatedAt?: unknown };

      const sectionDrafts = draft.sectionDrafts && typeof draft.sectionDrafts === "object" ? draft.sectionDrafts : {};
      const versions = Array.isArray(draft.versions) ? draft.versions : [];
      const hasEdits = Object.keys(sectionDrafts).length > 0;
      // An application record with no overrides and no saved versions was
      // opened but never actually worked on — not "ongoing", skip it so the
      // list doesn't fill up with every call anyone has ever glanced at.
      if (!hasEdits && versions.length === 0) continue;

      results.push({
        entry,
        call,
        program,
        updatedAt: typeof draft.updatedAt === "string" ? draft.updatedAt : "",
        versionCount: versions.length,
      });
    }
  } catch {
    // localStorage unavailable — nothing to show, not an error state.
  }
  return results.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
}

export function useOngoingApplications() {
  const [applications, setApplications] = useState<OngoingApplication[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setApplications(readAll());
    setHydrated(true);
  }, []);

  return { applications, hydrated };
}

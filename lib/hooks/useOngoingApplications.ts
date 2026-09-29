"use client";

import { useEffect, useState } from "react";
import { findAnyProjectBankEntry } from "@/lib/hooks/useProjectBank";
import { findAnyCall } from "@/lib/hooks/useFundingCalls";
import { DRAFT_KEY_PREFIX, readApplicationRecords } from "@/lib/hooks/useApplications";
import { isActiveApplication } from "@/lib/matching/applications";
import { findProgram } from "@/lib/data/fundingPrograms";
import { ApplicationRecord, FundingCall, FundingProgram, ProjectBankEntry } from "@/lib/types";

// A quick way back into whatever application a user is actively working on
// — every application record (see useApplications) that's still in play
// (draft, submitted, under review), so a project with applications to
// several calls, or more than one to the same call, shows one row each.

export interface OngoingApplication {
  record: ApplicationRecord;
  entry: ProjectBankEntry;
  call: FundingCall;
  program: FundingProgram;
  updatedAt: string; // ISO
  versionCount: number;
}

function versionCountFor(applicationId: string): number {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(DRAFT_KEY_PREFIX + applicationId) ?? "null");
    return Array.isArray(parsed?.versions) ? parsed.versions.length : 0;
  } catch {
    return 0;
  }
}

function readAll(): OngoingApplication[] {
  const results: OngoingApplication[] = [];
  for (const record of readApplicationRecords()) {
    if (!isActiveApplication(record)) continue;
    // A stale record for a since-deleted Projektbank entry or a call that
    // no longer exists — nothing to resume, skip quietly.
    const entry = findAnyProjectBankEntry(record.projectId);
    const call = findAnyCall(record.callId);
    if (!entry || !call) continue;
    const program = findProgram(call.programId);
    if (!program) continue;
    results.push({ record, entry, call, program, updatedAt: record.updatedAt, versionCount: versionCountFor(record.id) });
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

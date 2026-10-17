"use client";

import { useCallback, useEffect, useState } from "react";
import type { DemoProfileId } from "@/lib/data/demoProfiles";

// The user's verdict on the EU history's possible matches ("Möjliga
// träffar"): confirmed ones count as the municipality's own projects,
// rejected ones are set aside. Kept per demo profile in localStorage — this
// browser only, like the rest of the no-backend demo.
export type CandidateDecision = "confirmed" | "rejected";
export type CandidateDecisions = Record<string, CandidateDecision>;

const KEY_PREFIX = "eu-navigator-history-decisions";

export function candidateDecisionsKey(profile: DemoProfileId): string {
  return `${KEY_PREFIX}-${profile}`;
}

function read(profile: DemoProfileId): CandidateDecisions {
  try {
    const raw = window.localStorage.getItem(candidateDecisionsKey(profile));
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    const out: CandidateDecisions = {};
    for (const [id, value] of Object.entries(parsed ?? {})) {
      if (value === "confirmed" || value === "rejected") out[id] = value;
    }
    return out;
  } catch {
    return {};
  }
}

export function useCandidateDecisions(profile: DemoProfileId) {
  const [decisions, setDecisions] = useState<CandidateDecisions>({});

  useEffect(() => {
    setDecisions(read(profile));
  }, [profile]);

  /** null clears the decision, so the match is unconfirmed again. */
  const decide = useCallback(
    (id: string, decision: CandidateDecision | null) => {
      setDecisions((prev) => {
        const next = { ...prev };
        if (decision) next[id] = decision;
        else delete next[id];
        try {
          window.localStorage.setItem(candidateDecisionsKey(profile), JSON.stringify(next));
        } catch {
          // localStorage unavailable — the choice lasts for this page only.
        }
        return next;
      });
    },
    [profile],
  );

  return { decisions, decide };
}

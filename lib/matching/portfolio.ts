import { FundingCall, MatchResult, ProjectBankEntry, ProjectInput } from "@/lib/types";
import { computeMatches } from "@/lib/matching/scoreMatch";

// Bridges the project bank (the municipality's own portfolio) to the
// matching engine, so the portfolio can show a "best match" per project
// instead of requiring a one-by-one trip through the demo intake form.

export function projectBankEntryToProjectInput(entry: ProjectBankEntry): ProjectInput {
  return {
    title: entry.title_sv,
    description: entry.description_sv,
    sector: entry.sector,
    budgetSEK: entry.estimatedCostSEK,
    startYear: entry.periodStart,
    endYear: entry.periodEnd,
    municipality: "Exempelstad",
    hasInternationalPartner: entry.hasInternationalPartner,
  };
}

export function computeMatchesForEntry(entry: ProjectBankEntry, calls: FundingCall[]): MatchResult[] {
  return computeMatches(projectBankEntryToProjectInput(entry), calls);
}

export function computeBestMatchForEntry(entry: ProjectBankEntry, calls: FundingCall[]): MatchResult | null {
  return computeMatchesForEntry(entry, calls)[0] ?? null;
}

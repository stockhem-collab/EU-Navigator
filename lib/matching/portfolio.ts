import { FundingCall, FundingProgram, MatchResult, ProjectBankEntry, ProjectInput } from "@/lib/types";
import { computeMatches, scoreMatch } from "@/lib/matching/scoreMatch";

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

// The inverse view: for a given call ("Bevakning"), which project-bank
// entries would plausibly fit it, ranked best first. Powers the deadline
// digest so an EU coordinator sees "this closing call, these 3 projects"
// instead of having to check every project one by one.
export function computeMatchesForCall(
  call: FundingCall,
  program: FundingProgram,
  entries: ProjectBankEntry[]
): { entry: ProjectBankEntry; match: MatchResult }[] {
  return entries
    .map((entry) => ({ entry, match: scoreMatch(projectBankEntryToProjectInput(entry), call, program) }))
    .sort((a, b) => b.match.score - a.match.score);
}

export interface PortfolioEconomics {
  totalBudgetSEK: number;
  matchedCount: number;
  totalIdentifiedFundingSEK: number;
  totalCoFinancingNeededSEK: number;
}

const PROCEED_THRESHOLD = 50;

// Aggregates the portfolio the way a CFO would actually want to see it:
// not "here are six separate scores" but "how much of our investment plan
// could plausibly be EU-funded, and how much would we still need to
// co-finance ourselves". Only counts projects whose best match clears a
// minimum plausibility bar, so a handful of very low matches don't inflate
// the funding-potential figure.
export function computePortfolioEconomics(entries: ProjectBankEntry[], calls: FundingCall[]): PortfolioEconomics {
  let totalBudgetSEK = 0;
  let matchedCount = 0;
  let totalIdentifiedFundingSEK = 0;

  for (const entry of entries) {
    totalBudgetSEK += entry.estimatedCostSEK;
    const best = computeBestMatchForEntry(entry, calls);
    if (best && best.score >= PROCEED_THRESHOLD) {
      matchedCount += 1;
      totalIdentifiedFundingSEK += (best.estimatedFundingSEK[0] + best.estimatedFundingSEK[1]) / 2;
    }
  }

  return {
    totalBudgetSEK,
    matchedCount,
    totalIdentifiedFundingSEK: Math.round(totalIdentifiedFundingSEK),
    totalCoFinancingNeededSEK: Math.round(totalBudgetSEK - totalIdentifiedFundingSEK),
  };
}

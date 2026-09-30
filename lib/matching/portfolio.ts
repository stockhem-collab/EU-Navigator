import {
  Grant,
  FundingCall,
  FundingProgram,
  MatchResult,
  ProjectBankEntry,
  ProjectInput,
  ReadinessBreakdown,
} from "@/lib/types";
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
    tags: entry.tags,
  };
}

// The inverse of projectBankEntryToProjectInput above: turns an ad-hoc
// intake — one that was never started from a saved Projektbank entry, so
// its draft can't survive a refresh (see useApplication) — into a new
// entry the user can actually save. Reuses the readiness breakdown already
// computed for this exact project in the workspace, rather than a second,
// cruder heuristic like the CSV importer's (projectIntake.ts's
// computeImportedReadiness), since a real one is already on hand here.
export function projectInputToProjectBankEntry(project: ProjectInput, readiness: ReadinessBreakdown): ProjectBankEntry {
  return {
    id: `manual-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    title_sv: project.title,
    title_en: project.title,
    department_sv: "Ej angiven",
    department_en: "Not specified",
    owner: "—",
    status: "idea",
    estimatedCostSEK: project.budgetSEK,
    periodStart: project.startYear,
    periodEnd: project.endYear,
    sector: project.sector,
    description_sv: project.description,
    description_en: project.description,
    hasInternationalPartner: project.hasInternationalPartner,
    tags: project.tags,
    aiReadinessPct: readiness.overall,
    missingFields_sv: readiness.dimensions.flatMap((d) => (d.action_sv ? [d.action_sv] : [])),
    missingFields_en: readiness.dimensions.flatMap((d) => (d.action_en ? [d.action_en] : [])),
  };
}

// Turns an awarded application into a Grant ("beviljat stöd") — carrying
// over the project's own title and the call the application was made to
// (match.call). Commitments and the reporting timeline start
// empty/minimal: there's no real commitment-capture step in the
// application flow yet to seed them from honestly, so a single upcoming
// report is the honest starting point rather than fabricating figures.
//
// The id is unique per application, not per project: a project can have
// several awarded applications, each with its own grant and reporting.
// Without an application (a seeded "approved" project that never had
// application records) it falls back to the project-based id.
export function projectToGrant(
  entry: ProjectBankEntry,
  match: MatchResult,
  applicationId?: string,
  awardedAmountSEK?: number
): Grant {
  const requirement = match.call.reportingRequirements;
  const firstDeadlineMonths = requirement
    ? requirement.periodicity === "quarterly"
      ? 3
      : requirement.periodicity === "biannual"
      ? 6
      : 12
    : 6;
  const id = applicationId
    ? `ap-${entry.id}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`
    : `ap-${entry.id}`;
  return {
    id,
    title_sv: entry.title_sv,
    title_en: entry.title_en,
    callId: match.call.id,
    projectBankEntryId: entry.id,
    applicationId,
    // What was actually awarded, as confirmed when registering the grant;
    // without it, the grant the match estimates.
    awardedAmountSEK: awardedAmountSEK ?? match.estimatedFundingSEK[1],
    commitments: [],
    reportingEvents: [
      {
        id: `${id}-report-1`,
        type: "interim",
        periodLabel_sv: "Lägesrapport 1",
        periodLabel_en: "Progress report 1",
        deadlineMonthsFromNow: firstDeadlineMonths,
        status: "upcoming",
        outcomes: [],
      },
    ],
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

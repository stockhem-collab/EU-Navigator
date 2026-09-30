import { MatchResult, ProjectInput } from "@/lib/types";
import type { CoFinancingCap } from "@/lib/hooks/useFundingProfile";

// The amounts one application states — as opposed to the project's own
// estimated cost. EU calls ask for two figures: the eligible budget (the
// costs the grant can cover, often less than the project's total cost) and
// the grant applied for. Both belong to the application, since the same
// project can apply for different amounts to different calls. Undefined =
// not set in the application, so the project's figures and the call's
// funding rate are used.
export interface ApplicationBudget {
  eligibleBudgetSEK?: number;
  requestedGrantSEK?: number;
}

export interface ResolvedApplicationBudget {
  totalBudgetSEK: number;
  eligibleBudgetSEK: number;
  requestedGrantSEK: number;
  /** True when the requested grant wasn't set in the application but
   * estimated — the same figure the match states. */
  requestedIsEstimate: boolean;
  /** The share of eligible costs the call funds (0–1). */
  fundingRate: number;
  /** The most the funding rate allows for the eligible budget. */
  maxGrantByRateSEK: number;
  /** What the project's owner has to fund: everything the grant doesn't
   * cover, ineligible costs included. */
  ownFinancingSEK: number;
}

/** Only a positive, finite number counts as a stated amount. */
export function sanitizeApplicationBudget(value: unknown): ApplicationBudget {
  if (!value || typeof value !== "object") return {};
  const v = value as Record<string, unknown>;
  const amount = (x: unknown) => (typeof x === "number" && Number.isFinite(x) && x > 0 ? x : undefined);
  const budget: ApplicationBudget = {};
  const eligible = amount(v.eligibleBudgetSEK);
  const requested = amount(v.requestedGrantSEK);
  if (eligible !== undefined) budget.eligibleBudgetSEK = eligible;
  if (requested !== undefined) budget.requestedGrantSEK = requested;
  return budget;
}

export function hasApplicationBudget(budget: ApplicationBudget): boolean {
  return budget.eligibleBudgetSEK !== undefined || budget.requestedGrantSEK !== undefined;
}

/** The project as the matching engine should score it for this
 * application: its eligible budget and the grant actually applied for. */
export function projectForApplication(project: ProjectInput, budget: ApplicationBudget): ProjectInput {
  if (!hasApplicationBudget(budget)) return project;
  return {
    ...project,
    budgetSEK: budget.eligibleBudgetSEK ?? project.budgetSEK,
    requestedGrantSEK: budget.requestedGrantSEK ?? project.requestedGrantSEK,
  };
}

export function resolveApplicationBudget(
  project: ProjectInput,
  match: Pick<MatchResult, "call" | "program">,
  budget: ApplicationBudget
): ResolvedApplicationBudget {
  const totalBudgetSEK = project.budgetSEK;
  const eligibleBudgetSEK = budget.eligibleBudgetSEK ?? totalBudgetSEK;
  const fundingRate = match.call.coFinancingRate ?? match.program.typicalCoFinancingRate;
  const maxGrantByRateSEK = Math.round(eligibleBudgetSEK * fundingRate);
  // Unset, it's the same estimate as the match's: what was asked for in the
  // project, at most the funding rate of the budget and the call's maximum.
  const estimate = Math.min(project.requestedGrantSEK ?? maxGrantByRateSEK, maxGrantByRateSEK, match.call.maxGrantSEK);
  const requestedGrantSEK = budget.requestedGrantSEK ?? estimate;
  return {
    totalBudgetSEK,
    eligibleBudgetSEK,
    requestedGrantSEK,
    requestedIsEstimate: budget.requestedGrantSEK === undefined,
    fundingRate,
    maxGrantByRateSEK,
    ownFinancingSEK: Math.max(0, totalBudgetSEK - requestedGrantSEK),
  };
}

const CO_FINANCING_CAP_SHARE: Record<CoFinancingCap, number | null> = {
  upTo10: 0.1,
  upTo30: 0.3,
  upTo50: 0.5,
  over50: null,
};

export interface ApplicationBudgetIssue {
  key: "eligibleOverTotal" | "requestedOverEligible" | "belowCallMin" | "aboveCallMax" | "aboveFundingRate" | "ownFinancingOverCap";
  text_sv: string;
  text_en: string;
}

function mnkr(n: number, lang: "sv" | "en") {
  const formatted = (n / 1_000_000).toLocaleString(lang === "sv" ? "sv-SE" : "en-US", { maximumFractionDigits: 1 });
  return lang === "sv" ? `${formatted} mnkr` : `SEK ${formatted}M`;
}

const pct = (n: number) => `${Math.round(n * 100)} %`;
const pctEn = (n: number) => `${Math.round(n * 100)}%`;

/** What in the application's amounts doesn't fit the call's own rules or
 * the organisation's funding profile. Warnings, not blockers: the call text
 * is the authority, and some calls allow exceptions. */
export function applicationBudgetIssues(
  resolved: ResolvedApplicationBudget,
  match: Pick<MatchResult, "call">,
  coFinancingCap?: CoFinancingCap
): ApplicationBudgetIssue[] {
  const { call } = match;
  const issues: ApplicationBudgetIssue[] = [];
  const { totalBudgetSEK, eligibleBudgetSEK, requestedGrantSEK, fundingRate, maxGrantByRateSEK, ownFinancingSEK } = resolved;

  if (eligibleBudgetSEK > totalBudgetSEK) {
    issues.push({
      key: "eligibleOverTotal",
      text_sv: `Den stödberättigade budgeten (${mnkr(eligibleBudgetSEK, "sv")}) är större än projektets totala budget (${mnkr(totalBudgetSEK, "sv")}).`,
      text_en: `The eligible budget (${mnkr(eligibleBudgetSEK, "en")}) is larger than the project's total budget (${mnkr(totalBudgetSEK, "en")}).`,
    });
  }
  if (requestedGrantSEK > eligibleBudgetSEK) {
    issues.push({
      key: "requestedOverEligible",
      text_sv: `Sökt belopp är större än den stödberättigade budgeten (${mnkr(eligibleBudgetSEK, "sv")}).`,
      text_en: `The requested grant is larger than the eligible budget (${mnkr(eligibleBudgetSEK, "en")}).`,
    });
  } else if (requestedGrantSEK > maxGrantByRateSEK * 1.005) {
    const share = eligibleBudgetSEK > 0 ? requestedGrantSEK / eligibleBudgetSEK : 0;
    issues.push({
      key: "aboveFundingRate",
      text_sv: `Sökt belopp är ${pct(share)} av den stödberättigade budgeten – utlysningen finansierar högst ${pct(fundingRate)} (${mnkr(maxGrantByRateSEK, "sv")}).`,
      text_en: `The requested grant is ${pctEn(share)} of the eligible budget — the call funds at most ${pctEn(fundingRate)} (${mnkr(maxGrantByRateSEK, "en")}).`,
    });
  }
  if (requestedGrantSEK < call.minGrantSEK) {
    issues.push({
      key: "belowCallMin",
      text_sv: `Sökt belopp är lägre än utlysningens minsta bidrag (${mnkr(call.minGrantSEK, "sv")}).`,
      text_en: `The requested grant is below the call's minimum grant (${mnkr(call.minGrantSEK, "en")}).`,
    });
  }
  if (requestedGrantSEK > call.maxGrantSEK) {
    issues.push({
      key: "aboveCallMax",
      text_sv: `Sökt belopp är högre än utlysningens största bidrag (${mnkr(call.maxGrantSEK, "sv")}).`,
      text_en: `The requested grant is above the call's maximum grant (${mnkr(call.maxGrantSEK, "en")}).`,
    });
  }
  const cap = coFinancingCap ? CO_FINANCING_CAP_SHARE[coFinancingCap] : null;
  if (cap !== null && totalBudgetSEK > 0 && ownFinancingSEK / totalBudgetSEK > cap + 0.005) {
    const share = ownFinancingSEK / totalBudgetSEK;
    issues.push({
      key: "ownFinancingOverCap",
      text_sv: `Egen medfinansiering blir ${pct(share)} av projektets budget – enligt finansieringsprofilen klarar organisationen upp till ${pct(cap)}.`,
      text_en: `Own co-financing comes to ${pctEn(share)} of the project's budget — the funding profile says the organisation can manage up to ${pctEn(cap)}.`,
    });
  }
  return issues;
}

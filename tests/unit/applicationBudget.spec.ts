import { test, expect } from "@playwright/test";
import {
  applicationBudgetIssues,
  projectForApplication,
  resolveApplicationBudget,
  sanitizeApplicationBudget,
} from "../../lib/matching/applicationBudget";
import { scoreMatch } from "../../lib/matching/scoreMatch";
import { FundingCall, FundingProgram, ProjectInput } from "../../lib/types";

// An application's own amounts (eligible budget, requested grant) — checked
// against the call's funding rate and grant range and the organisation's
// co-financing ceiling.

const program: FundingProgram = {
  id: "test-program",
  name: "Test Programme",
  name_sv: "Testprogrammet",
  shortName: "Test",
  logoLetter: "T",
  description_sv: "",
  description_en: "",
  sectors: ["energy"],
  keywords: [],
  geographicScope: "eu-wide",
  typicalCoFinancingRate: 0.6,
  typicalDurationYears: [2, 4],
  status: "active",
  themes: [],
  management: "direct",
};

const call: FundingCall = {
  id: "test-call",
  programId: program.id,
  title_sv: "Testutlysning",
  title_en: "Test call",
  status: "open",
  deadlineMonthsFromNow: 6,
  budgetTotalSEK: 50_000_000,
  minGrantSEK: 1_000_000,
  maxGrantSEK: 5_000_000,
  requiresPartnership: false,
  eligibleApplicants_sv: "",
  eligibleApplicants_en: "",
  priorities_sv: [],
  priorities_en: [],
  extraKeywords: [],
  tags: [],
  evaluationCriteria: [],
  documents: [],
};

const project: ProjectInput = {
  title: "Ett projekt",
  description: "En kort text.",
  sector: "energy",
  budgetSEK: 6_000_000,
  startYear: 2025,
  endYear: 2027,
  municipality: "Exempelstad",
  hasInternationalPartner: false,
};

const match = { call, program };
const keys = (issues: { key: string }[]) => issues.map((i) => i.key);

test("without amounts of its own, the application uses the match's estimate", () => {
  const resolved = resolveApplicationBudget(project, match, {});
  expect(resolved.eligibleBudgetSEK).toBe(6_000_000);
  expect(resolved.requestedGrantSEK).toBe(3_600_000);
  expect(resolved.requestedIsEstimate).toBe(true);
  expect(resolved.ownFinancingSEK).toBe(2_400_000);
  // The same figure the match itself states.
  expect(resolved.requestedGrantSEK).toBe(scoreMatch(project, call, program).estimatedFundingSEK[1]);
  expect(applicationBudgetIssues(resolved, match, "over50")).toEqual([]);
});

test("a requested grant replaces the estimate, and own co-financing follows it", () => {
  const resolved = resolveApplicationBudget(project, match, { requestedGrantSEK: 3_000_000 });
  expect(resolved.requestedGrantSEK).toBe(3_000_000);
  expect(resolved.requestedIsEstimate).toBe(false);
  expect(resolved.ownFinancingSEK).toBe(3_000_000);
});

test("the funding rate applies to the eligible budget, not the total", () => {
  const resolved = resolveApplicationBudget(project, match, { eligibleBudgetSEK: 4_000_000, requestedGrantSEK: 3_000_000 });
  expect(resolved.maxGrantByRateSEK).toBe(2_400_000);
  expect(keys(applicationBudgetIssues(resolved, match))).toEqual(["aboveFundingRate"]);
});

test("amounts outside the call's grant range are flagged", () => {
  expect(keys(applicationBudgetIssues(resolveApplicationBudget(project, match, { requestedGrantSEK: 500_000 }), match))).toEqual([
    "belowCallMin",
  ]);
  const big = { ...project, budgetSEK: 20_000_000 };
  expect(keys(applicationBudgetIssues(resolveApplicationBudget(big, match, { requestedGrantSEK: 8_000_000 }), match))).toEqual([
    "aboveCallMax",
  ]);
});

test("an eligible budget above the total, or a grant above the eligible budget, is flagged", () => {
  const resolved = resolveApplicationBudget(project, match, { eligibleBudgetSEK: 7_000_000 });
  expect(keys(applicationBudgetIssues(resolved, match))).toContain("eligibleOverTotal");
  const over = resolveApplicationBudget(project, match, { eligibleBudgetSEK: 2_000_000, requestedGrantSEK: 2_500_000 });
  expect(keys(applicationBudgetIssues(over, match))).toContain("requestedOverEligible");
  expect(keys(applicationBudgetIssues(over, match))).not.toContain("aboveFundingRate");
});

test("own co-financing above the funding profile's ceiling is flagged", () => {
  const resolved = resolveApplicationBudget(project, match, { requestedGrantSEK: 3_600_000 });
  // 2.4 of 6 mnkr = 40 % own co-financing.
  expect(keys(applicationBudgetIssues(resolved, match, "upTo30"))).toEqual(["ownFinancingOverCap"]);
  expect(applicationBudgetIssues(resolved, match, "upTo50")).toEqual([]);
  expect(applicationBudgetIssues(resolved, match, "over50")).toEqual([]);
});

test("the match is rescored with the application's amounts", () => {
  const base = scoreMatch(project, call, program);
  const rescored = scoreMatch(projectForApplication(project, { requestedGrantSEK: 500_000 }), call, program);
  expect(rescored.score).toBeLessThan(base.score);
  expect(projectForApplication(project, {})).toBe(project);
});

test("only positive amounts are kept from storage", () => {
  expect(sanitizeApplicationBudget({ eligibleBudgetSEK: 0, requestedGrantSEK: 2_000_000 })).toEqual({ requestedGrantSEK: 2_000_000 });
  expect(sanitizeApplicationBudget({ eligibleBudgetSEK: "5", requestedGrantSEK: -1 })).toEqual({});
  expect(sanitizeApplicationBudget(null)).toEqual({});
});

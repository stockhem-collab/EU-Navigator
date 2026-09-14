import { test, expect } from "@playwright/test";
import { computeReadiness } from "../../lib/matching/readiness";
import { scoreMatch } from "../../lib/matching/scoreMatch";
import { FundingCall, FundingProgram, ProjectInput } from "../../lib/types";

// Regression coverage for the readiness-breakdown fixes: removing the
// dimensions that double-counted signal already inside match.score
// ("eligibility", "budget", "partnership") and the hardcoded, always-91
// "documentation" dimension, and keying each dimension's weight on itself
// instead of a parallel array indexed by position.

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
  evaluationCriteria: [],
  documents: [],
};

const project: ProjectInput = {
  title: "Ett projekt",
  description: "En kort text.",
  sector: "energy",
  budgetSEK: 3_000_000,
  startYear: 2025,
  endYear: 2027,
  municipality: "Exempelstad",
  hasInternationalPartner: false,
};

test.describe("computeReadiness", () => {
  test("returns exactly the five orthogonal dimensions, no duplicated or fake ones", () => {
    const match = scoreMatch(project, call, program);
    const readiness = computeReadiness(project, match);
    const keys = readiness.dimensions.map((d) => d.key).sort();
    expect(keys).toEqual(["horizontalPrinciples", "impact", "indicators", "logic", "strategic"].sort());
    // These used to exist and either double-counted match.score's own
    // signal or were a hardcoded constant.
    expect(keys).not.toContain("eligibility");
    expect(keys).not.toContain("budget");
    expect(keys).not.toContain("partnership");
    expect(keys).not.toContain("documentation");
  });

  test("dimension weights sum to 1 and overall is their weighted average", () => {
    const match = scoreMatch(project, call, program);
    const readiness = computeReadiness(project, match);
    const totalWeight = readiness.dimensions.reduce((s, d) => s + d.weight, 0);
    expect(totalWeight).toBeCloseTo(1, 5);

    const expectedOverall = Math.round(readiness.dimensions.reduce((s, d) => s + d.score * d.weight, 0));
    expect(readiness.overall).toBe(expectedOverall);
  });

  test("a project description that only states a budget figure does not score as having a quantified impact", () => {
    const budgetOnlyProject: ProjectInput = {
      ...project,
      description: "Projektet kostar 45 000 000 kr och pågår i tre år.",
    };
    const match = scoreMatch(budgetOnlyProject, call, program);
    const readiness = computeReadiness(budgetOnlyProject, match);
    const impact = readiness.dimensions.find((d) => d.key === "impact");
    // Before the fix, IMPACT_PATTERN matched "kr" and scored this 85.
    expect(impact?.score).toBeLessThan(50);
  });

  test("a project stating an actual quantified effect does score well on impact", () => {
    const withImpactProject: ProjectInput = {
      ...project,
      description: "Projektet förväntas minska energianvändningen med 30% och 500 ton CO2e per år.",
    };
    const match = scoreMatch(withImpactProject, call, program);
    const readiness = computeReadiness(withImpactProject, match);
    const impact = readiness.dimensions.find((d) => d.key === "impact");
    expect(impact?.score).toBeGreaterThanOrEqual(80);
  });
});

import { test, expect } from "@playwright/test";
import { computeReadiness, textSignals } from "../../lib/matching/readiness";
import { analyzeSection } from "../../lib/matching/sectionCoach";
import { assessedApplicationText, generateReviewerNotes } from "../../lib/matching/generateWorkspace";
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

// The assessment in the application workspace reads the application's own
// text (description + the sections the user has written), not just the
// intake description — so writing the application changes the assessment.
test.describe("assessment of the application text", () => {
  const written =
    "Projektet minskar energianvändningen med 30 % (1200 MWh per år) och når 400 deltagare. " +
    "Utgångsvärde 2025: 4000 MWh. Jämställdhet och tillgänglighet integreras i alla aktiviteter.";

  test("readiness follows the text passed in, not only the project description", () => {
    const match = scoreMatch(project, call, program);
    const before = computeReadiness(project, match);
    const after = computeReadiness(project, match, assessedApplicationText(project, { Effekter: written }));
    expect(after.overall).toBeGreaterThan(before.overall);
    for (const key of ["impact", "indicators", "horizontalPrinciples"]) {
      expect(after.dimensions.find((d) => d.key === key)?.action_sv).toBeUndefined();
    }
  });

  test("the text assessed is the description plus edited sections only", () => {
    expect(assessedApplicationText(project, {})).toBe(project.description);
    const text = assessedApplicationText(project, { Problem: "Egen text", Mål: "  " });
    expect(text).toContain("Egen text");
    expect(text).toContain(project.description);
  });

  test("the coach and the reviewer notes read the same text", () => {
    const match = scoreMatch(project, call, program);
    const text = assessedApplicationText(project, { Effekter: written });
    expect(analyzeSection(project, match).impact).toBeLessThan(analyzeSection(project, match, text).impact);
    const baselineWarning = (notes: ReturnType<typeof generateReviewerNotes>) =>
      notes.some((n) => n.type === "warning" && n.text_sv.includes("utgångsvärde"));
    expect(baselineWarning(generateReviewerNotes(project, call))).toBe(true);
    expect(baselineWarning(generateReviewerNotes(project, call, text))).toBe(false);
  });

  test("textSignals recognises each kind of content", () => {
    const signals = textSignals(written);
    expect(signals).toMatchObject({ quantifiedEffect: true, indicator: true, baseline: true, horizontalPrinciples: true });
    expect(textSignals("Vi ska göra något bra.")).toMatchObject({
      quantifiedEffect: false,
      indicator: false,
      baseline: false,
      horizontalPrinciples: false,
    });
  });
});


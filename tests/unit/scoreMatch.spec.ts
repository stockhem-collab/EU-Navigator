import { test, expect } from "@playwright/test";
import { scoreMatch } from "../../lib/matching/scoreMatch";
import { EvaluationCriterion, FundingCall, FundingProgram, ProjectInput } from "../../lib/types";

// Regression coverage for the fix that makes scoreMatch actually use a
// call's own real evaluationCriteria weighting, instead of a universal
// fixed 60/40 thematic/implementation split that ignored the criteria
// entirely (the criteria are shown to the user as if they're how the
// application gets judged).

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

// Deliberately mismatched on the thematic axis (project sector isn't in the
// programme's sectors, no keyword overlap possible) but a clean fit on
// every implementation-axis factor (budget in range, no partnership
// required, duration fits) — so the two buckets score very differently
// (thematic 0, implementation 30 of nominal 40), making any change in how
// they're blended together clearly visible in the final score.
const project: ProjectInput = {
  title: "Ett projekt",
  description: "En beskrivning utan några av utlysningens nyckelbegrepp.",
  sector: "climate",
  budgetSEK: 3_000_000,
  startYear: 2025,
  endYear: 2027,
  municipality: "Exempelstad",
  hasInternationalPartner: false,
};

function makeCall(evaluationCriteria: EvaluationCriterion[], tags: string[] = []): FundingCall {
  return {
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
    tags,
    evaluationCriteria,
    documents: [],
  };
}

test.describe("scoreMatch evaluationCriteria weighting", () => {
  test("a call whose criteria don't classify falls back to the default 60/40 split", () => {
    const call = makeCall([
      { name_sv: "Foo", name_en: "Foo", maxPoints: 50 },
      { name_sv: "Bar", name_en: "Bar", maxPoints: 50 },
    ]);
    const result = scoreMatch(project, call, program);
    // thematicScore 0, implementationScore 30, default ratios both 1.0.
    expect(result.score).toBe(30);
  });

  test("a call whose criteria explicitly reproduce the default split scores the same", () => {
    const call = makeCall([
      { name_sv: "Relevans", name_en: "Relevance", maxPoints: 30 },
      { name_sv: "Effekt", name_en: "Impact", maxPoints: 30 },
      { name_sv: "Kvalitet", name_en: "Quality", maxPoints: 20 },
      { name_sv: "Genomförande", name_en: "Implementation", maxPoints: 20 },
    ]);
    const result = scoreMatch(project, call, program);
    expect(result.score).toBe(30);
  });

  test("a call that weights implementation/quality far more heavily scores this implementation-strong project higher", () => {
    const call = makeCall([
      { name_sv: "Relevans", name_en: "Relevance", maxPoints: 20 },
      { name_sv: "Kvalitet i genomförandet", name_en: "Quality of implementation", maxPoints: 80 },
    ]);
    const result = scoreMatch(project, call, program);
    // thematicPct 0.2, implementationPct 0.8 -> thematicRatio 0.2*100/60,
    // implementationRatio 0.8*100/40=2.0 -> 0*ratio + 30*2.0 = 60.
    expect(result.score).toBe(60);
    expect(result.score).toBeGreaterThan(30);
  });

  test("deltaIfFixed on a gap scales with the same weighting as the score", () => {
    // Give the project a poor budget fit too, so a "budget" rationale gap
    // with a deltaIfFixed exists to check.
    const poorBudgetProject: ProjectInput = { ...project, budgetSEK: 50_000 };
    const defaultCall = makeCall([
      { name_sv: "Relevans", name_en: "Relevance", maxPoints: 30 },
      { name_sv: "Effekt", name_en: "Impact", maxPoints: 30 },
      { name_sv: "Kvalitet", name_en: "Quality", maxPoints: 20 },
      { name_sv: "Genomförande", name_en: "Implementation", maxPoints: 20 },
    ]);
    const skewedCall = makeCall([
      { name_sv: "Relevans", name_en: "Relevance", maxPoints: 20 },
      { name_sv: "Kvalitet i genomförandet", name_en: "Quality of implementation", maxPoints: 80 },
    ]);

    const defaultResult = scoreMatch(poorBudgetProject, defaultCall, program);
    const skewedResult = scoreMatch(poorBudgetProject, skewedCall, program);

    const defaultBudgetGap = defaultResult.rationale.find((r) => r.category === "budget" && r.deltaIfFixed);
    const skewedBudgetGap = skewedResult.rationale.find((r) => r.category === "budget" && r.deltaIfFixed);

    expect(defaultBudgetGap?.deltaIfFixed).toBeDefined();
    expect(skewedBudgetGap?.deltaIfFixed).toBeDefined();
    // The implementation bucket counts for 2x as much under the skewed
    // weighting (implementationRatio 2.0 vs 1.0), so the point-upside from
    // fixing a budget gap should be roughly twice as large too.
    expect(skewedBudgetGap!.deltaIfFixed!).toBeCloseTo(defaultBudgetGap!.deltaIfFixed! * 2, 0);
  });
});

// Coverage for the tag-overlap signal added alongside the curated tag
// vocabulary (lib/data/tags.ts): a controlled-vocabulary complement to the
// free-text keyword matching above, meant to catch thematic matches that
// exact-word matching misses on synonyms — without any AI call at match
// time. Reuses `project` (sector mismatch, no keyword overlap, clean
// implementation fit) and criteria that don't classify, so thematicRatio
// and implementationRatio are both 1.0 and the tag contribution is visible
// directly in the final score.
test.describe("scoreMatch tag overlap scoring", () => {
  const unclassifiedCriteria: EvaluationCriterion[] = [
    { name_sv: "Foo", name_en: "Foo", maxPoints: 50 },
    { name_sv: "Bar", name_en: "Bar", maxPoints: 50 },
  ];

  test("an untagged project scores the same as before tags existed, with an advisory note", () => {
    const call = makeCall(unclassifiedCriteria, ["energieffektivisering", "klimatatgarder"]);
    const result = scoreMatch(project, call, program);
    expect(result.score).toBe(30);
    expect(result.rationale.find((r) => r.category === "tags" && r.type === "neutral")).toBeDefined();
  });

  test("overlapping tags add points to the thematic bucket and surface a positive rationale line", () => {
    const call = makeCall(unclassifiedCriteria, ["energieffektivisering", "klimatatgarder"]);
    const taggedProject: ProjectInput = {
      ...project,
      tags: ["energieffektivisering", "klimatatgarder", "digitalisering"],
    };
    const result = scoreMatch(taggedProject, call, program);
    // thematicScore = 0 (sector) + min(20, 2*7) (tags) + 0 (keywords) = 14.
    expect(result.score).toBe(44);
    const tagLine = result.rationale.find((r) => r.category === "tags" && r.type === "positive");
    expect(tagLine).toBeDefined();
  });

  test("tag overlap points are capped at 20 even with more than ~3 matching tags", () => {
    const call = makeCall(unclassifiedCriteria, ["a", "b", "c", "d"]);
    const taggedProject: ProjectInput = { ...project, tags: ["a", "b", "c", "d"] };
    const result = scoreMatch(taggedProject, call, program);
    expect(result.score).toBe(50); // 20 (tags, capped) + 30 (implementation)
  });
});

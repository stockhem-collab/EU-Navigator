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

// Fixed "now" so the timing check (project start vs. expected decision)
// is deterministic: a 6-month deadline + ~6 months to decision lands in
// January 2027.
const NOW = new Date(2026, 0, 15);

// Deliberately mismatched on the thematic axis (project sector isn't in the
// programme's sectors, no keyword overlap possible, activity type unknown
// so it only gets the neutral 5 of 10) but a clean fit on every
// implementation-axis factor (estimated grant 3M × 0.6 = 1.8M in range, no
// partnership required, duration fits, starts the year of the decision) —
// so the two buckets score very differently (thematic 5, implementation 30
// of nominal 40), making any change in how they're blended together
// clearly visible in the final score.
const project: ProjectInput = {
  title: "Ett projekt",
  description: "En beskrivning utan några av utlysningens nyckelbegrepp.",
  sector: "climate",
  budgetSEK: 3_000_000,
  startYear: 2027,
  endYear: 2029,
  municipality: "Exempelstad",
  hasInternationalPartner: false,
};

function makeCall(
  evaluationCriteria: EvaluationCriterion[],
  tags: string[] = [],
  overrides: Partial<FundingCall> = {}
): FundingCall {
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
    ...overrides,
  };
}

test.describe("scoreMatch evaluationCriteria weighting", () => {
  test("a call whose criteria don't classify falls back to the default 60/40 split", () => {
    const call = makeCall([
      { name_sv: "Foo", name_en: "Foo", maxPoints: 50 },
      { name_sv: "Bar", name_en: "Bar", maxPoints: 50 },
    ]);
    const result = scoreMatch(project, call, program, undefined, NOW);
    // thematicScore 5, implementationScore 30, default ratios both 1.0.
    expect(result.score).toBe(35);
  });

  test("a call whose criteria explicitly reproduce the default split scores the same", () => {
    const call = makeCall([
      { name_sv: "Relevans", name_en: "Relevance", maxPoints: 30 },
      { name_sv: "Effekt", name_en: "Impact", maxPoints: 30 },
      { name_sv: "Kvalitet", name_en: "Quality", maxPoints: 20 },
      { name_sv: "Genomförande", name_en: "Implementation", maxPoints: 20 },
    ]);
    const result = scoreMatch(project, call, program, undefined, NOW);
    expect(result.score).toBe(35);
  });

  test("a call that weights implementation/quality far more heavily scores this implementation-strong project higher", () => {
    const call = makeCall([
      { name_sv: "Relevans", name_en: "Relevance", maxPoints: 20 },
      { name_sv: "Kvalitet i genomförandet", name_en: "Quality of implementation", maxPoints: 80 },
    ]);
    const result = scoreMatch(project, call, program, undefined, NOW);
    // thematicPct 0.2, implementationPct 0.8 -> thematicRatio 0.2*100/60,
    // implementationRatio 0.8*100/40=2.0 -> 5/3 + 30*2.0 = 61.7.
    expect(result.score).toBe(62);
    expect(result.score).toBeGreaterThan(35);
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

    const defaultResult = scoreMatch(poorBudgetProject, defaultCall, program, undefined, NOW);
    const skewedResult = scoreMatch(poorBudgetProject, skewedCall, program, undefined, NOW);

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
    const result = scoreMatch(project, call, program, undefined, NOW);
    expect(result.score).toBe(35);
    expect(result.rationale.find((r) => r.category === "tags" && r.type === "neutral")).toBeDefined();
  });

  test("overlapping tags add points to the thematic bucket and surface a positive rationale line", () => {
    const call = makeCall(unclassifiedCriteria, ["energieffektivisering", "klimatatgarder"]);
    const taggedProject: ProjectInput = {
      ...project,
      tags: ["energieffektivisering", "klimatatgarder", "digitalisering"],
    };
    const result = scoreMatch(taggedProject, call, program, undefined, NOW);
    // thematicScore = 0 (sector) + 5 (activity unknown) + min(20, 2*7) (tags) + 0 (keywords) = 19.
    expect(result.score).toBe(49);
    const tagLine = result.rationale.find((r) => r.category === "tags" && r.type === "positive");
    expect(tagLine).toBeDefined();
  });

  test("tag overlap points are capped at 20 even with more than ~3 matching tags", () => {
    const call = makeCall(unclassifiedCriteria, ["a", "b", "c", "d"]);
    const taggedProject: ProjectInput = { ...project, tags: ["a", "b", "c", "d"] };
    const result = scoreMatch(taggedProject, call, program, undefined, NOW);
    expect(result.score).toBe(55); // 5 (activity unknown) + 20 (tags, capped) + 30 (implementation)
  });
});

// Coverage for the signals added so matching checks more than thematic fit:
// eligibility (applicant type, programme area), activity type, target
// group, requested grant vs. total budget, partnership reach and timing.
// All use unclassified criteria (both ratios 1.0), so each signal's effect
// shows up directly against the 35-point baseline above.
test.describe("scoreMatch eligibility, programme fit and timing", () => {
  const unclassifiedCriteria: EvaluationCriterion[] = [
    { name_sv: "Foo", name_en: "Foo", maxPoints: 50 },
    { name_sv: "Bar", name_en: "Bar", maxPoints: 50 },
  ];
  const call = (overrides: Partial<FundingCall>) => makeCall(unclassifiedCriteria, [], overrides);
  const score = (p: ProjectInput, c: FundingCall) => scoreMatch(p, c, program, undefined, NOW);

  test("an ineligible applicant type caps the score and is listed first, however good the fit", () => {
    const strongProject: ProjectInput = { ...project, sector: "energy", applicantType: "sme" };
    const result = score(strongProject, call({ applicantTypes: ["municipality", "region"] }));
    expect(result.score).toBeLessThanOrEqual(15);
    expect(result.recommendation).toBe("low");
    expect(result.rationale[0]).toMatchObject({ type: "warning", category: "eligibility" });
  });

  test("an eligible applicant type gets a positive line and keeps its score", () => {
    const result = score({ ...project, applicantType: "municipality" }, call({ applicantTypes: ["municipality"] }));
    expect(result.score).toBe(35);
    expect(result.rationale.find((r) => r.category === "eligibility" && r.type === "positive")).toBeDefined();
  });

  test("a call without structured applicant types asks the user to check the free-text eligibility", () => {
    const result = score({ ...project, applicantType: "municipality" }, call({ eligibleApplicants_sv: "Endast skolor." }));
    const line = result.rationale.find((r) => r.category === "eligibility");
    expect(line).toMatchObject({ type: "neutral" });
    expect(line?.text_sv).toContain("Endast skolor.");
  });

  test("a project outside the call's programme area is ineligible; inside it is confirmed", () => {
    const regional = call({ eligibleRegions: ["skane", "halland"] });
    const outside = score({ ...project, region: "stockholm" }, regional);
    expect(outside.score).toBeLessThanOrEqual(15);
    expect(outside.rationale[0]).toMatchObject({ type: "warning", category: "geography" });

    const inside = score({ ...project, region: "skane" }, regional);
    expect(inside.score).toBe(35);
    expect(inside.rationale.find((r) => r.category === "geography" && r.type === "positive")).toBeDefined();
  });

  test("activity type: a match earns full credit, a mismatch none plus a fixable gap", () => {
    const researchCall = call({ activityTypes: ["research", "pilot"] });
    expect(score({ ...project, activityType: "research" }, researchCall).score).toBe(40);
    const mismatch = score({ ...project, activityType: "investment" }, researchCall);
    expect(mismatch.score).toBe(30);
    expect(mismatch.rationale.find((r) => r.category === "activity" && r.type === "warning")?.deltaIfFixed).toBe(10);
  });

  test("a secondary sector gives partial sector credit", () => {
    const result = score({ ...project, secondarySectors: ["energy"] }, call({}));
    expect(result.score).toBe(47); // 12 (secondary sector) + 5 + 30
  });

  test("target group: overlap adds points, a stated non-overlapping group is a gap", () => {
    const esfCall = call({ targetGroups: ["unemployed", "newly-arrived"] });
    expect(score({ ...project, targetGroups: ["unemployed"] }, esfCall).score).toBe(40);
    const other = score({ ...project, targetGroups: ["elderly"] }, esfCall);
    expect(other.score).toBe(35);
    expect(other.rationale.find((r) => r.category === "targetGroup")?.type).toBe("warning");
    expect(score(project, esfCall).rationale.find((r) => r.category === "targetGroup")?.type).toBe("neutral");
  });

  test("the grant range is compared with the requested grant, not the total budget", () => {
    // Total budget 12M would estimate a 7.2M grant (partial fit to 1–5M),
    // but the user is only asking for 4M, which is in range.
    const bigBudget: ProjectInput = { ...project, budgetSEK: 12_000_000 };
    expect(score(bigBudget, call({})).score).toBe(23); // 5 + 8 (partial) + 5 + 5
    const withRequest = score({ ...bigBudget, requestedGrantSEK: 4_000_000 }, call({}));
    expect(withRequest.score).toBe(35);
    expect(withRequest.estimatedFundingSEK[1]).toBe(4_000_000);
  });

  test("asking for a larger share than the programme co-finances is flagged", () => {
    const result = score({ ...project, requestedGrantSEK: 2_900_000 }, call({}));
    const warning = result.rationale.find((r) => r.category === "budget" && r.type === "warning");
    expect(warning?.text_sv).toMatch(/97 %.*60 %/);
  });

  test("estimated funding never exceeds the call's maximum grant", () => {
    const result = score({ ...project, budgetSEK: 100_000_000 }, call({}));
    expect(result.estimatedFundingSEK[1]).toBe(5_000_000);
    expect(result.estimatedFundingSEK[0]).toBeLessThanOrEqual(result.estimatedFundingSEK[1]);
  });

  test("partnership is compared by number of countries", () => {
    const consortiumCall = call({ requiresPartnership: true, minPartnerCountries: 3 });
    // Base without partnership requirement: 5 + (20 + 5 + 5) = 35.
    expect(score({ ...project, partnerLevel: "consortium" }, consortiumCall).score).toBe(45);
    const onePartner = score({ ...project, partnerLevel: "international" }, consortiumCall);
    expect(onePartner.score).toBe(30);
    expect(onePartner.rationale.find((r) => r.category === "partnership")?.type).toBe("warning");
    expect(score({ ...project, partnerLevel: "none" }, consortiumCall).score).toBe(20);
    // Legacy projects without partnerLevel still use hasInternationalPartner.
    expect(score({ ...project, hasInternationalPartner: true }, call({ requiresPartnership: true })).score).toBe(45);
  });

  test("starting before the expected decision is a timing gap; much later is a note", () => {
    const early = score({ ...project, startYear: 2026, endYear: 2028 }, call({}));
    expect(early.score).toBe(30);
    expect(early.rationale.find((r) => r.category === "timing")?.type).toBe("warning");

    const late = score({ ...project, startYear: 2031, endYear: 2033 }, call({}));
    expect(late.score).toBe(35);
    expect(late.rationale.find((r) => r.category === "timing")?.type).toBe("neutral");

    expect(score(project, call({})).rationale.find((r) => r.category === "timing")?.type).toBe("positive");
  });

  test("a call's own funding rate is used instead of the programme's typical rate", () => {
    // Programme rate 0.6 -> 1.8M; call rate 0.2 -> 0.6M, below the 1M
    // minimum (partial fit).
    const result = score(project, call({ coFinancingRate: 0.2 }));
    expect(result.score).toBe(23); // 5 + 8 + 5 + 5
    expect(result.rationale.find((r) => r.category === "budget")?.text_sv).toContain("20 % av budgeten");
    expect(result.estimatedFundingSEK[1]).toBe(600_000);
  });

  test("a call whose deadline date has passed is capped as closed", () => {
    const result = score(project, call({ deadlineDate: "2025-12-01" }));
    expect(result.score).toBeLessThanOrEqual(15);
    expect(result.recommendation).toBe("low");
    expect(result.rationale[0]).toMatchObject({ type: "warning", category: "timing" });
    expect(result.rationale.find((r) => r.category === "deadline")).toBeUndefined();
  });

  test("a deadline date is used instead of the stored relative months", () => {
    // Stored months say 6, but the date is ~3 months after NOW.
    const result = score(project, call({ deadlineDate: "2026-04-15" }));
    expect(result.rationale.find((r) => r.category === "deadline")?.text_sv).toContain("om cirka 3 månader");
  });
});

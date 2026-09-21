import { test, expect } from "@playwright/test";
import { generateProjectLogic } from "../../lib/matching/generateWorkspace";
import { ApplicationTemplateSection, FundingCall, FundingProgram, ProjectInput } from "../../lib/types";

// Regression + feature coverage for generateProjectLogic's two paths: the
// generic six-field fallback (unchanged behaviour for any call without its
// own applicationTemplate) and the call-specific path (a call's own real
// application-form sections, e.g. Horizon Europe's Excellence/Impact/
// Quality-and-efficiency-of-implementation structure).

const program: FundingProgram = {
  id: "test-program",
  name: "Test Programme",
  name_sv: "Testprogrammet",
  shortName: "Test",
  logoLetter: "T",
  description_sv: "",
  description_en: "",
  sectors: ["digital"],
  keywords: [],
  geographicScope: "eu-wide",
  typicalCoFinancingRate: 0.6,
  typicalDurationYears: [2, 4],
  status: "active",
};

function makeCall(applicationTemplate?: ApplicationTemplateSection[]): FundingCall {
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
    evaluationCriteria: [],
    documents: [],
    applicationTemplate,
  };
}

const project: ProjectInput = {
  title: "Ett projekt",
  description: "En kort projektbeskrivning.",
  sector: "digital",
  budgetSEK: 3_000_000,
  startYear: 2025,
  endYear: 2027,
  municipality: "Exempelstad",
  hasInternationalPartner: false,
};

test.describe("generateProjectLogic", () => {
  test("falls back to the generic six-field structure when a call has no applicationTemplate", () => {
    const rows = generateProjectLogic(project, makeCall(undefined), program);
    expect(rows.map((r) => r.label_sv)).toEqual([
      "Problem",
      "Mål",
      "Aktiviteter",
      "Outputs",
      "Effekter (outcomes)",
      "Indikatorer",
    ]);
  });

  test("uses a call's own applicationTemplate sections when it has one", () => {
    const template: ApplicationTemplateSection[] = [
      {
        key: "excellence",
        label_sv: "Excellens",
        label_en: "Excellence",
        instructions_sv: "Beskriv projektets mål och ambition.",
        instructions_en: "Describe the project's objectives and ambition.",
      },
      {
        key: "impact",
        label_sv: "Effekt",
        label_en: "Impact",
        instructions_sv: "Beskriv förväntade effekter och resultat.",
        instructions_en: "Describe expected outcomes and results.",
      },
      {
        key: "implementation",
        label_sv: "Genomförande",
        label_en: "Implementation",
        instructions_sv: "Beskriv arbetsplan, resurser och budget.",
        instructions_en: "Describe the work plan, resources and budget.",
      },
    ];

    const rows = generateProjectLogic(project, makeCall(template), program);
    expect(rows).toHaveLength(3);
    expect(rows.map((r) => r.label_sv)).toEqual(["Excellens", "Effekt", "Genomförande"]);

    const impactRow = rows.find((r) => r.label_sv === "Effekt")!;
    const implementationRow = rows.find((r) => r.label_sv === "Genomförande")!;

    // Different sections' instructions should produce genuinely different
    // content, not the same boilerplate repeated under different headings.
    expect(impactRow.content_sv).not.toBe(implementationRow.content_sv);
    expect(impactRow.content_sv.toLowerCase()).toMatch(/effekt/);
    expect(implementationRow.content_sv).toMatch(/budget|mnkr/i);
  });
});

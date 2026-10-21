import { test, expect } from "@playwright/test";
import { applicationTemplateFor } from "../../lib/data/callTemplates";
import { findCall } from "../../lib/data/fundingCalls";
import { findProgram } from "../../lib/data/fundingPrograms";
import {
  RequirementFacts,
  evaluateRequirements,
  isPublicBody,
  openManualRequirements,
  pageLimitFor,
  resolveRequirements,
  summarizeCompleteness,
} from "../../lib/data/applicationRequirements";
import { requirementChangesFromList } from "../../lib/integrations/calls/callList";
import { extractRequirements } from "../../lib/matching/requirementExtraction";
import { completenessDimension, computeReadiness } from "../../lib/matching/readiness";
import { scoreMatch } from "../../lib/matching/scoreMatch";
import { FundingCall, ProjectInput } from "../../lib/types";

function sourcesFor(callId: string) {
  const call = findCall(callId)!;
  return { call, program: findProgram(call.programId), template: applicationTemplateFor(call) };
}
const ids = (callId: string) => resolveRequirements(sourcesFor(callId)).map((r) => r.requirement.id);

const noFacts: RequirementFacts = {
  sections: [],
  costCategoriesFilled: 0,
  costCategoriesTotal: 0,
  budgetStated: false,
  submitted: false,
  publicBody: true,
  attachments: {},
};

test.describe("which requirements a call has", () => {
  test("a Horizon Europe lump-sum topic: the form's, the portal's and the topic's own", () => {
    const list = ids("horizon-miss-2026-04-cit-02");
    for (const id of ["he-part-b", "he-page-limit", "he-dec-plan", "he-gep", "portal-part-a", "portal-pic", "portal-submit"]) expect(list).toContain(id);
    expect(list).toContain("he-mission-cities");
    expect(list).toContain("he-ls-budget-table");
    // A form on file: no generic placeholders.
    expect(list.some((id) => id.startsWith("generic-"))).toBe(false);
    const { call, template } = sourcesFor("horizon-miss-2026-04-cit-02");
    expect(pageLimitFor(template, call)).toBe(45);
    // A budget-based topic keeps the form's 40 pages.
    const budgetBased = sourcesFor("horizon-miss-2026-04-cit-01");
    expect(pageLimitFor(budgetBased.template, budgetBased.call)).toBe(40);
  });

  test("an ESF+ call lists ESF-rådet's attachments, and the form comes first", () => {
    const list = ids("a1-kompetensutveckling-av-yrkesverksamma-stockholm");
    expect(list[0]).toBe("esf-form");
    for (const id of ["esf-authorised-signatory", "esf-procurement-policy", "esf-de-minimis-form", "esf-confirmation", "esf-submit"]) expect(list).toContain(id);
    expect(list.some((id) => id.startsWith("portal-"))).toBe(false);
  });

  test("a portal call without a form: the portal's steps, the generic form and the call's annexes", () => {
    const list = ids("cerv-2026-daphne-children");
    expect(list).toContain("portal-part-a");
    expect(list).toContain("generic-form");
    expect(list).toContain("cerv-budget-table");
    expect(list).toContain("cerv-child-protection");
    // The portal's own submission and mandate replace the generic ones, and
    // the call's annexes are on file.
    expect(list).not.toContain("generic-submit");
    expect(list).not.toContain("generic-signatory");
    expect(list).not.toContain("generic-call-annexes");
  });

  test("a call with nothing on file asks the user to read the call's annexes", () => {
    const list = ids("life-2027-klimatanpassning-standardprojekt-prel");
    expect(list).toContain("generic-call-annexes");
    expect(list).toContain("derived-cofinancing");
  });

  test("Datacenter's changes and the user's own are added, removals respected, ids kept unique", () => {
    const s = sourcesFor("a1-kompetensutveckling-av-yrkesverksamma-stockholm");
    const extra = { id: "dc-x", kind: "annex" as const, title_sv: "X", title_en: "X", why_sv: "", why_en: "", mandatory: true, source: { document: "d", checkedAt: "" } };
    const list = resolveRequirements({ ...s, datacenter: { add: [extra, extra], remove: ["esf-procurement-policy"] }, own: [{ ...extra, id: "own-1" }] });
    const got = list.map((r) => r.requirement.id);
    expect(got.filter((id) => id === "dc-x")).toHaveLength(1);
    expect(got).toContain("own-1");
    expect(got).not.toContain("esf-procurement-policy");
    expect(list.find((r) => r.requirement.id === "dc-x")!.origin).toBe("datacenter");
  });
});

test.describe("status and completeness", () => {
  const resolved = resolveRequirements(sourcesFor("horizon-miss-2026-04-cit-02"));

  test("follows the application where it can, and counts only what is due with it", () => {
    const facts: RequirementFacts = {
      ...noFacts,
      sections: [
        { key: "he-1.1", required: true, written: true, overLimit: false },
        { key: "he-2.2", required: true, written: true, overLimit: false },
        { key: "he-3.1", required: true, written: false, overLimit: false },
      ],
      estimatedPages: 47,
      pageLimit: 45,
      costCategoriesFilled: 2,
      costCategoriesTotal: 5,
    };
    const items = evaluateRequirements(resolved, {}, facts);
    const by = (id: string) => items.find((i) => i.requirement.id === id)!;
    expect(by("he-part-b").status).toBe("in-progress");
    expect(by("he-part-b").progress).toBeCloseTo(2 / 3);
    expect(by("he-page-limit").status).toBe("in-progress");
    expect(by("he-page-limit").detail_sv).toContain("47 av 45");
    expect(by("he-dec-plan").status).toBe("done");
    expect(by("he-budget").status).toBe("done");
    expect(by("portal-pic").status).toBe("todo");
    // Before the grant agreement: listed, not counted.
    expect(by("portal-lear").counted).toBe(false);
    const summary = summarizeCompleteness(items);
    expect(summary.score).toBeGreaterThan(0);
    expect(summary.score).toBeLessThan(100);
    expect(summary.open.map((i) => i.requirement.id)).toContain("portal-pic");
  });

  test("the user's status wins; not applicable drops out; a file marks an annex done", () => {
    const cerv = resolveRequirements(sourcesFor("cerv-2026-daphne-children"));
    const items = evaluateRequirements(
      cerv,
      { "cerv-child-protection": { status: "not-applicable", note: "Inga barn", updatedAt: "" } },
      { ...noFacts, attachments: { "cerv-cvs": 1 } }
    );
    const by = (id: string) => items.find((i) => i.requirement.id === id)!;
    expect(by("cerv-child-protection").counted).toBe(false);
    expect(by("cerv-child-protection").note).toBe("Inga barn");
    expect(by("cerv-cvs").status).toBe("done");
    // Public bodies are exempt from the activity report.
    expect(by("cerv-activity-report").status).toBe("not-applicable");
    const privateBody = evaluateRequirements(cerv, {}, { ...noFacts, publicBody: false });
    expect(privateBody.find((i) => i.requirement.id === "cerv-activity-report")!.status).toBe("todo");
  });

  test("everything done is 100, and lead times warn close to the deadline", () => {
    const states = Object.fromEntries(resolved.map((r) => [r.requirement.id, { status: "done" as const, updatedAt: "" }]));
    expect(summarizeCompleteness(evaluateRequirements(resolved, states, noFacts)).score).toBe(100);
    const soon = evaluateRequirements(resolved, {}, { ...noFacts, deadlineDate: "2026-10-28", today: new Date("2026-10-21T12:00:00") });
    expect(soon.find((i) => i.requirement.id === "portal-pic")!.leadTimeWarning).toBe(true);
    expect(soon.find((i) => i.requirement.id === "he-gep")!.leadTimeWarning).toBe(true);
    const later = evaluateRequirements(resolved, {}, { ...noFacts, deadlineDate: "2027-06-30", today: new Date("2026-10-21T12:00:00") });
    expect(later.find((i) => i.requirement.id === "portal-pic")!.leadTimeWarning).toBe(false);
  });

  test("outside the workspace only the requirements the user ticks off are counted", () => {
    const open = openManualRequirements(resolved, {}, true, {});
    expect(open.every((i) => !i.requirement.check)).toBe(true);
    expect(open.map((i) => i.requirement.id)).toContain("he-gep");
  });

  test("an organisation without a stated type counts as a public body", () => {
    expect(isPublicBody(null)).toBe(true);
    expect(isPublicBody("Kommun")).toBe(true);
    expect(isPublicBody("Aktiebolag")).toBe(false);
  });
});

test.describe("the assessment counts completeness", () => {
  const project: ProjectInput = {
    title: "Test",
    description: "Kommunen minskar energianvändningen med 20 procent i 300 byggnader jämfört med dagens nivå, med fokus på jämställdhet och tillgänglighet.",
    sector: "energy",
    budgetSEK: 20_000_000,
    startYear: 2027,
    endYear: 2029,
    municipality: "Uppsala kommun",
    hasInternationalPartner: true,
  };
  const call = findCall("horizon-miss-2026-04-cit-02") as FundingCall;
  const match = scoreMatch(project, call, findProgram(call.programId)!);

  test("adds a 30 % dimension and keeps the weights summing to one", () => {
    const without = computeReadiness(project, match);
    const done = computeReadiness(project, match, project.description, { score: 100, open: [] });
    const missing = computeReadiness(project, match, project.description, { score: 20, open: [{ title_sv: "PIC", title_en: "PIC" }] });
    expect(without.dimensions.some((d) => d.key === "completeness")).toBe(false);
    const sum = done.dimensions.reduce((s, d) => s + d.weight, 0);
    expect(sum).toBeCloseTo(1, 5);
    expect(done.dimensions.find((d) => d.key === "completeness")!.weight).toBe(0.3);
    expect(missing.overall).toBeLessThan(done.overall);
    expect(done.overall - missing.overall).toBe(Math.round(done.overall - missing.overall));
  });

  test("the action names what is left", () => {
    const d = completenessDimension({
      score: 40,
      open: ["A", "B", "C", "D"].map((x) => ({ title_sv: x, title_en: x })),
    });
    expect(d.action_sv).toBe("4 obligatoriska krav återstår: A, B och C med flera.");
    expect(completenessDimension({ score: 100, open: [] }).action_sv).toBeUndefined();
  });
});

test.describe("reading requirements", () => {
  test("data/utlysningskrav.csv rows are checked", () => {
    const row = { Utlysning: "x", Åtgärd: "lägg till", "Krav-id": "k", Typ: "bilaga", Titel: "T", Kontrollerad: "2026-10-21" };
    expect(requirementChangesFromList([row], ["x"]).x.add![0].kind).toBe("annex");
    expect(() => requirementChangesFromList([row], ["y"])).toThrow(/okänd utlysning/);
    expect(() => requirementChangesFromList([{ ...row, Typ: "okänt" }], ["x"])).toThrow(/okänd typ/);
    expect(requirementChangesFromList([{ Utlysning: "x", Åtgärd: "sidgräns", Sidgräns: "28" }], ["x"]).x.pageLimit).toBe(28);
    expect(requirementChangesFromList([{ Utlysning: "x", Åtgärd: "ta bort", "Krav-id": "he-gep" }], ["x"]).x.remove).toEqual(["he-gep"]);
  });

  test("suggests the annexes an ESF+ call lists", () => {
    const text = [
      "Bilagor som ska bifogas ansökan om stöd i Projektrummet+",
      "Följande bilagor ska bifogas ansökan om stöd i Projektrummet+:",
      "Verifiering av behörig företrädare",
      "Denna bilaga är obligatorisk för samtliga sökande. Underlag ska visa att den som skrivit under",
      "ansökan om stöd är behörig att göra det.",
      "Inköpspolicy",
      "Denna bilaga är obligatorisk för offentliga aktörer.",
    ].join("\n");
    const got = extractRequirements(text);
    expect(got.map((s) => s.title)).toEqual(["Verifiering av behörig företrädare", "Inköpspolicy"]);
    expect(got[0].kind).toBe("certificate");
    expect(got[0].condition).toBeUndefined();
    expect(got[1].condition).toBe("offentliga aktörer");
    expect(got.every((s) => s.mandatory)).toBe(true);
  });

  test("joins lines wrapped by a PDF and reads exemptions", () => {
    const text = [
      "   −   detailed budget table (template available in the Portal Submission",
      "       System – to be re-uploaded filled out in the format .xlsx) (mandatory)",
      "   −   activity report of last year of the coordinator (mandatory - public bodies",
      "       are exempted)",
    ].join("\n");
    const got = extractRequirements(text);
    expect(got).toHaveLength(2);
    expect(got[0]).toMatchObject({ title: "Detailed budget table", kind: "budget", mandatory: true });
    expect(got[1].condition).toBe("mandatory - public bodies are exempted");
  });
});

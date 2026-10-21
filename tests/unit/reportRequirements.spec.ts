import { test, expect } from "@playwright/test";
import { findCall } from "../../lib/data/fundingCalls";
import { findProgram } from "../../lib/data/fundingPrograms";
import { reportTemplateFor } from "../../lib/data/callTemplates";
import { seedGrants } from "../../lib/data/grants";
import { reportSectionsFor } from "../../lib/data/reportSections";
import { evaluateRequirements, summarizeCompleteness } from "../../lib/data/applicationRequirements";
import { reportFacts, resolveReportRequirements } from "../../lib/data/reportRequirements";
import { requirementChangesFromList } from "../../lib/integrations/calls/callList";
import { Grant, ReportingEventType } from "../../lib/types";

// What a report needs to be complete: the funder's report form, the call's
// own report requirements and what the grant itself commits to.

const grantFor = (callId: string, over: Partial<Grant> = {}): Grant => ({
  id: "g",
  title_sv: "",
  title_en: "",
  callId,
  awardedAmountSEK: 1_000_000,
  commitments: [],
  reportingEvents: [],
  ...over,
});

function ids(grant: Grant, reportType?: ReportingEventType) {
  const call = findCall(grant.callId);
  return resolveReportRequirements({
    grant,
    call,
    program: call ? findProgram(call.programId) : undefined,
    template: reportTemplateFor(call),
    reportType,
  }).map((r) => r.requirement.id);
}

const emptyDraft = { sections: {}, deviations: {}, outcomes: {}, spentThisPeriod: "", costs: {} };

test.describe("which requirements a call's reports have", () => {
  test("ESF+: quarterly report for interim reports, the final report with the last claim", () => {
    const grant = grantFor("a1-kompetensutveckling-av-yrkesverksamma-stockholm");
    const interim = ids(grant, "interim");
    expect(interim).toContain("esf-r-quarterly");
    expect(interim).not.toContain("esf-r-final-report");
    expect(interim).toContain("esf-r-payment-claim");
    const final = ids(grant, "final");
    expect(final).toContain("esf-r-final-report");
    expect(final).not.toContain("esf-r-quarterly");
    expect(ids(grant)).toEqual(expect.arrayContaining(["esf-r-quarterly", "esf-r-final-report"]));
    expect(ids(grant, "sustainability")).toEqual([]);
  });

  test("a Horizon Europe lump-sum topic drops the cost statements and the CFS", () => {
    const actual = ids(grantFor("horizon-miss-2027-04-cit-05"), "final");
    expect(actual).toEqual(expect.arrayContaining(["portal-r-technical", "portal-r-financial"]));
    const lumpSum = ids(grantFor("horizon-miss-2027-04-cit-01"), "final");
    expect(lumpSum).toContain("he-r-part-b");
    expect(lumpSum).toContain("he-r-ls-work-packages");
    expect(lumpSum).not.toContain("he-r-cfs");
    expect(lumpSum).not.toContain("he-r-financial-statements");
    // The form's actual-cost CFS applies on a topic without a lump sum.
    expect(ids(grantFor("horizon-miss-2026-04-cit-01"), "final")).toContain("he-r-cfs");
    expect(ids(grantFor("horizon-miss-2026-04-cit-01"), "interim")).not.toContain("he-r-cfs");
  });

  test("CERV: progress reports, and the final report on the lump sum", () => {
    const grant = grantFor("cerv-2026-daphne-children");
    expect(ids(grant, "interim")).toContain("cerv-r-progress");
    expect(ids(grant, "final")).toEqual(expect.arrayContaining(["cerv-r-lump-sum", "cerv-r-records", "portal-r-submit"]));
    // With the call's own documents known, the reminder to read the decision goes.
    expect(ids(grant)).not.toContain("generic-r-decision");
  });

  test("a seed call: its required documents, the commitments and no duplicate auditor's certificate", () => {
    const grant = seedGrants.find((g) => g.id === "ap-1")!;
    const final = ids(grant, "final");
    expect(final).toContain("derived-r-indicators");
    expect(final).toContain("derived-r-final-doc-1");
    expect(final).not.toContain("derived-r-interim-doc-0");
    // "Revisionsintyg" is already one of the call's documents.
    expect(final).not.toContain("derived-r-audit-certificate");
    expect(final).toContain("portal-r-technical");
  });

  test("rows in utlysningskrav.csv go to the application or the reports by Gäller", () => {
    const row = { Utlysning: "x", Åtgärd: "lägg till", "Krav-id": "k", Typ: "bilaga", Titel: "T", Kontrollerad: "2026-10-21" };
    const rows = [row, { ...row, "Krav-id": "r", Gäller: "slutrapport" }, { ...row, "Krav-id": "all", Gäller: "rapport" }];
    expect(requirementChangesFromList(rows, ["x"]).x.add!.map((r) => r.id)).toEqual(["k"]);
    const report = requirementChangesFromList(rows, ["x"], "report").x.add!;
    expect(report.map((r) => [r.id, r.reports])).toEqual([
      ["r", ["final"]],
      ["all", undefined],
    ]);
    expect(() => requirementChangesFromList([{ ...row, Gäller: "budget" }], ["x"])).toThrow(/Gäller/);
  });
});

test.describe("how far a report has come", () => {
  const grant = seedGrants.find((g) => g.id === "ap-1")!;
  const event = grant.reportingEvents.find((e) => e.type === "final")!;
  const call = findCall(grant.callId);
  const resolved = resolveReportRequirements({ grant, call, program: findProgram(call!.programId), reportType: "final" });
  const sections = reportSectionsFor("final");
  const evaluate = (draft: typeof emptyDraft, documentsReady: boolean[], states = {}) =>
    evaluateRequirements(resolved, states, {
      sections: [],
      costCategoriesFilled: 0,
      costCategoriesTotal: 0,
      budgetStated: false,
      submitted: false,
      publicBody: true,
      attachments: {},
      report: reportFacts({ grant, event, draft, sections, documentsReady }),
    });
  const status = (items: ReturnType<typeof evaluate>, id: string) => items.find((i) => i.requirement.id === id)?.status;

  test("follows the draft: figures, deviations, sections, spend and documents", () => {
    const before = evaluate(emptyDraft, [false, false, false]);
    expect(status(before, "derived-r-indicators")).toBe("todo");
    expect(status(before, "generic-r-spend") ?? status(before, "portal-r-financial")).toBe("todo");
    expect(status(before, "derived-r-final-doc-0")).toBe("todo");

    const outcomes = Object.fromEntries(grant.commitments.map((c) => [c.indicator_sv, String(c.promisedValue)]));
    const allText = Object.fromEntries(sections.map((s) => [s.key, "Text."]));
    const after = evaluate({ ...emptyDraft, outcomes, sections: allText, spentThisPeriod: "100000" }, [true, true, true]);
    expect(status(after, "derived-r-indicators")).toBe("done");
    expect(status(after, "portal-r-technical")).toBe("done");
    expect(status(after, "portal-r-financial")).toBe("done");
    expect(status(after, "derived-r-final-doc-0")).toBe("done");
    expect(summarizeCompleteness(after).score).toBeGreaterThan(summarizeCompleteness(before).score);

    // An outcome far behind plan without an explanation keeps it open.
    const behind = { ...outcomes, [grant.commitments[0].indicator_sv]: "0" };
    expect(status(evaluate({ ...emptyDraft, outcomes: behind }, []), "derived-r-indicators")).toBe("in-progress");
  });

  test("the user's status wins", () => {
    const items = evaluate(emptyDraft, [], { "portal-r-technical": { status: "done", updatedAt: "" } });
    expect(status(items, "portal-r-technical")).toBe("done");
  });
});

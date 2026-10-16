import { test, expect } from "@playwright/test";
import JSZip from "jszip";
import { applicationTemplateFor, callTemplates, findCallTemplate } from "../../lib/data/callTemplates";
import { fundingCalls } from "../../lib/data/fundingCalls";
import { findProgram } from "../../lib/data/fundingPrograms";
import { generateProjectLogic, sectionDraftFor } from "../../lib/matching/generateWorkspace";
import { fillDocumentXml, fillFunderDocx } from "../../lib/export/fillDocx";
import { buildTemplateDocx, buildWebFormDocx, estimatePages, fillInstructions, TemplateExportInput } from "../../lib/export/exportTemplate";
import { ProjectInput } from "../../lib/types";

const project: ProjectInput = {
  title: "Klimatsmarta resenoder",
  description: "Uppsala kommun bygger om tre resenoder för att minska utsläppen med 20 procent till 2030.",
  sector: "mobility",
  budgetSEK: 30_000_000,
  startYear: 2027,
  endYear: 2030,
  municipality: "Uppsala kommun",
  hasInternationalPartner: true,
};

const budget = {
  totalBudgetSEK: 30_000_000,
  eligibleBudgetSEK: 30_000_000,
  requestedGrantSEK: 30_000_000,
  requestedIsEstimate: true,
  fundingRate: 1,
  maxGrantByRateSEK: 30_000_000,
  ownFinancingSEK: 0,
};

async function documentText(blob: Blob | Uint8Array, part = "word/document.xml"): Promise<string> {
  const data = blob instanceof Uint8Array ? blob : new Uint8Array(await blob.arrayBuffer());
  const zip = await JSZip.loadAsync(data);
  return zip.file(part)!.async("string");
}

test.describe("funder application forms", () => {
  test("every template has unique section keys and table keys", () => {
    const keys = callTemplates.flatMap((t) => t.sections.map((s) => s.key));
    expect(new Set(keys).size).toBe(keys.length);
    const tableKeys = callTemplates.flatMap((t) => t.sections.flatMap((s) => (s.tables ?? []).map((tb) => tb.key)));
    expect(new Set(tableKeys).size).toBe(tableKeys.length);
  });

  test("calls from the call list point to their form and take its criteria", () => {
    const withForm = fundingCalls.filter((c) => c.applicationTemplateId);
    expect(withForm.length).toBeGreaterThanOrEqual(14);
    for (const call of withForm) {
      const template = findCallTemplate(call.applicationTemplateId)!;
      expect(template).toBeDefined();
      expect(applicationTemplateFor(call)?.id).toBe(template.id);
      if (template.evaluationCriteria) expect(call.evaluationCriteria).toEqual(template.evaluationCriteria);
    }
    const esf = fundingCalls.filter((c) => c.programId === "esf" && c.extractionSource === "call-list");
    expect(esf.every((c) => c.applicationTemplateId === "esf-ansokan-om-stod")).toBe(true);
  });

  test("the workspace sections follow the Horizon Europe Part B form", () => {
    const call = fundingCalls.find((c) => c.applicationTemplateId === "he-ria-ia-part-b")!;
    const logic = generateProjectLogic(project, call, findProgram(call.programId)!);
    expect(logic.map((r) => r.section?.number)).toEqual(["1.1", "1.2", "2.1", "2.2", "2.3", "3.1", "3.2"]);
    expect(logic.map((r) => r.key)).toEqual(["he-1.1", "he-1.2", "he-2.1", "he-2.2", "he-2.3", "he-3.1", "he-3.2"]);
    expect(logic.find((r) => r.key === "he-3.1")!.section!.tables!.map((t) => t.key)).toEqual([
      "he-3.1a",
      "he-3.1b",
      "he-3.1c",
      "he-3.1d",
      "he-3.1e",
      "he-3.1f",
      "he-3.1g",
      "he-3.1h",
    ]);
  });

  test("drafts saved under the old label are still read", () => {
    const row = { key: "problem", label_sv: "Problem" };
    expect(sectionDraftFor({ Problem: "gammal" }, row)).toBe("gammal");
    expect(sectionDraftFor({ Problem: "gammal", problem: "ny" }, row)).toBe("ny");
    expect(sectionDraftFor({}, row)).toBeUndefined();
  });

  test("pages are estimated from words and table rows", () => {
    const text = Array.from({ length: 650 }, () => "ord").join(" ");
    expect(estimatePages(text, 0)).toBeCloseTo(1 + 2 / 25);
    expect(estimatePages("", 23)).toBeCloseTo(1);
  });
});

function exportInput(templateId: string): TemplateExportInput {
  const template = findCallTemplate(templateId)!;
  const call = fundingCalls.find((c) => c.applicationTemplateId === templateId)!;
  return {
    template,
    call,
    projectTitle: project.title,
    organisationName: project.municipality,
    sections: template.sections.map((section) => ({ section, text: section.key === "he-2.3" ? "" : `Text för ${section.key}` })),
    tables: { "he-3.1a": [["1", "Project management", "1", "UPPSALA", "24", "1", "48"], ["", "", "", "", "", "", ""]] },
    budget,
    lang: "sv",
  };
}

test.describe("export following the form", () => {
  test("a Word template export uses the form's English headings and tables", async () => {
    const blob = await buildTemplateDocx(exportInput("he-ria-ia-part-b"));
    const xml = await documentText(blob);
    expect(xml).toContain("1. Excellence");
    expect(xml).toContain("1.1 Objectives and ambition");
    expect(xml).toContain("Text för he-1.1");
    expect(xml).toContain("Table 3.1a: List of work packages");
    expect(xml).toContain("Project management");
    expect(xml).toContain("Uppsala kommun");
    // The optional 2.3 summary is left out when it's empty.
    expect(xml).not.toContain("Summary (optional)");
    expect(await documentText(blob, "word/styles.xml")).toContain("Times New Roman");
  });

  test("a web form export lists each field with its character count", async () => {
    const xml = await documentText(await buildWebFormDocx(exportInput("esf-ansokan-om-stod")));
    expect(xml).toContain("1. Problemanalys");
    expect(xml).toContain("Text för esf-problem");
    expect(xml).toContain(`${"Text för esf-problem".length} tecken`);
    expect(xml).toContain("Bedöms under Urvalskriterium 1");
    expect(xml).toContain("Projektrummet+");
  });
});

// A stand-in for the funder's .docx: a table of contents line, the
// instruction pages, then the structure to submit with an empty table.
async function funderTemplate(): Promise<Uint8Array> {
  const { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun } = await import("docx");
  const cell = (text: string, bold = false) => new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] });
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "1.1 Objectives and ambition", style: "TOC2" }),
          new Paragraph({ children: [new TextRun("Call: [insert call identifier] — [insert call name]")] }),
          new Paragraph({ text: "1.1 Objectives and ambition [e.g. 4 pages]" }),
          new Paragraph({ text: "Briefly describe the objectives (instructions)." }),
          new Paragraph({ text: "1.1 Objectives and ambition" }),
          new Paragraph({ text: "1.2. Methodology" }),
          new Paragraph({ text: "Table 3.1a: List of work packages" }),
          new Table({
            rows: [
              new TableRow({ children: ["WP No", "Title", "Lead No", "Lead", "PM", "Start", "End"].map((h) => cell(h, true)) }),
              new TableRow({ children: ["", "", "", "", "", "", ""].map((h) => cell(h)) }),
            ],
          }),
        ],
      },
    ],
  });
  return new Uint8Array(await Packer.toBuffer(doc));
}

test.describe("filling the funder's own Word template", () => {
  test("text goes under the last matching heading, rows into the table", async () => {
    const input = exportInput("he-ria-ia-part-b");
    const { sections, tables } = fillInstructions(input);
    const result = await fillFunderDocx(await funderTemplate(), sections, tables, {
      "[insert call identifier]": "HORIZON-MISS-2027-04-CIT-03",
      "[insert call name]": "Resenoder",
    });
    const xml = await documentText(result.bytes);

    expect(result.filled).toContain("1.1 Objectives and ambition");
    expect(result.filled).toContain("1.2 Methodology");
    expect(result.filled).toContain("Table 3.1a");
    expect(result.missing).toContain("2.1 Project's pathways towards impact");
    expect(result.missing).not.toContain("2.3 Summary (optional)");

    // Under the last "1.1" heading: after the instructions, not the TOC line.
    const last = xml.lastIndexOf("1.1 Objectives and ambition");
    expect(xml.indexOf("Text för he-1.1")).toBeGreaterThan(last);
    expect(xml.indexOf("Text för he-1.1")).toBeLessThan(xml.indexOf("1.2. Methodology"));
    expect(xml.indexOf("Text för he-1.2")).toBeGreaterThan(xml.indexOf("1.2. Methodology"));

    // The empty row is replaced and only the filled row is added.
    expect(xml).toContain("Project management");
    expect(xml.match(/<w:tr>|<w:tr /g)!.length).toBe(2);
    expect(xml).toContain("HORIZON-MISS-2027-04-CIT-03 — Resenoder");
  });

  test("a document without the heading reports it as missing", () => {
    const xml = '<w:document><w:body><w:p><w:r><w:t>Something else</w:t></w:r></w:p></w:body></w:document>';
    const result = fillDocumentXml(xml, [{ number: "1.1", heading: "Objectives and ambition", text: "x" }], []);
    expect(result.filled).toEqual([]);
    expect(result.missing).toEqual(["1.1 Objectives and ambition"]);
    expect(result.xml).toBe(xml);
  });
});

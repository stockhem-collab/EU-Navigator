import { test, expect } from "@playwright/test";
import fs from "node:fs";
import JSZip from "jszip";
import ExcelJS from "exceljs";
import { callTemplates, findCallTemplate, reportTemplateFor, applicationTemplateFor, TemplateRegistry } from "../../lib/data/callTemplates";
import { reportTemplates } from "../../lib/data/reportTemplates";
import { reportSectionsFor } from "../../lib/data/reportSections";
import { costAmounts, costTotal, HE_COST_CATEGORIES, ESF_COST_CATEGORIES } from "../../lib/data/costCategories";
import { fundingCalls } from "../../lib/data/fundingCalls";
import { callsFromList } from "../../lib/integrations/calls/callList";
import { OutlineSection, outlineFromDocx, outlineFromXml, templateFromProposal } from "../../lib/export/templateOutline";
import { buildBudgetXlsx } from "../../lib/export/exportBudget";
import { buildReportDocx, ReportContent } from "../../lib/export/exportReport";
import { FundingCall, Grant } from "../../lib/types";

const heCall = fundingCalls.find((c) => c.reportTemplateId === "he-periodic-report")!;
const esfCall = fundingCalls.find((c) => c.reportTemplateId === "esf-rapport")!;
const heReport = findCallTemplate("he-periodic-report")!;
const esfReport = findCallTemplate("esf-rapport")!;

async function documentText(blob: Blob): Promise<string> {
  const zip = await JSZip.loadAsync(new Uint8Array(await blob.arrayBuffer()));
  const xml = await zip.file("word/document.xml")!.async("string");
  return [...xml.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ");
}

test.describe("report forms", () => {
  test("report forms have unique keys and follow up real application sections", () => {
    for (const form of reportTemplates) {
      expect(form.kind).toBe("report");
      const keys = form.sections.map((s) => s.key);
      expect(new Set(keys).size).toBe(keys.length);
    }
    const applicationKeys = new Set(callTemplates.filter((f) => f.kind !== "report").flatMap((f) => f.sections.map((s) => s.key)));
    const applicationTables = new Set(callTemplates.flatMap((f) => f.sections.flatMap((s) => s.tables ?? []).map((t) => t.key)));
    for (const form of reportTemplates) {
      for (const s of form.sections) {
        for (const key of s.fromApplication ?? []) expect(applicationKeys, `${s.key} -> ${key}`).toContain(key);
        for (const t of s.tables ?? []) if (t.fromApplicationTable) expect(applicationTables).toContain(t.fromApplicationTable.key);
      }
    }
  });

  test("the call list gives Horizon Europe and ESF+ calls their report form", () => {
    expect(heCall).toBeTruthy();
    expect(esfCall).toBeTruthy();
    expect(reportTemplateFor(heCall)?.id).toBe("he-periodic-report");
    expect(reportTemplateFor(esfCall)?.id).toBe("esf-rapport");
    // A report form is never taken as an application form.
    expect(applicationTemplateFor({ ...heCall, applicationTemplateId: "he-periodic-report" } as FundingCall)).toBeUndefined();
  });

  test("the call list rejects an unknown report form", () => {
    const options = {
      rates: { 2026: 11 },
      suggestTags: () => [],
      tagIdFor: () => undefined,
      themesFromTema: () => undefined,
    };
    const row = { Namn: "Test", Program: "Horisont Europa", Stänger: "2027-01-01", Status: "Öppen" };
    expect(callsFromList([{ ...row, Rapportmall: "he-periodic-report" }], options)[0].reportTemplateId).toBe("he-periodic-report");
    expect(() => callsFromList([{ ...row, Rapportmall: "he-ria-ia-part-b" }], options)).toThrow(/rapportmall/);
    expect(() => callsFromList([{ ...row, Ansökningsmall: "esf-rapport" }], options)).toThrow(/ansökningsmall/);
  });

  test("a call's chosen form wins over the call list's", () => {
    const custom = { ...heReport, id: "custom-r", custom: true };
    const registry: TemplateRegistry = { custom: [custom], assignments: { [heCall.id]: { report: "custom-r" } } };
    expect(reportTemplateFor(heCall, registry)?.id).toBe("custom-r");
    expect(reportTemplateFor(heCall, { custom: [], assignments: {} })?.id).toBe("he-periodic-report");
  });

  test("report sections follow the form and the report type", () => {
    const interim = reportSectionsFor("interim", esfReport).map((s) => s.key);
    const final = reportSectionsFor("final", esfReport).map((s) => s.key);
    expect(interim).toContain("esf-r-next");
    expect(interim).not.toContain("esf-r-lessons");
    expect(final).toContain("esf-r-lessons");
    expect(final).not.toContain("esf-r-next");
    // Without a form, and for sustainability follow-ups, the standard sections.
    expect(reportSectionsFor("interim").map((s) => s.key)).toContain("summary");
    expect(reportSectionsFor("sustainability", heReport).map((s) => s.key)).not.toContain("he-r-1.1");
    const he = reportSectionsFor("interim", heReport);
    expect(he.find((s) => s.key === "he-r-1.1")?.number).toBe("1.1");
  });
});

test.describe("cost categories", () => {
  test("Horizon Europe's indirect costs are 25 % of A, C and D, not B", () => {
    const amounts = costAmounts(HE_COST_CATEGORIES, { "he-a": "1000", "he-b": "500", "he-c1": "200", "he-d": "100" });
    expect(amounts["he-e"]).toBe(325);
    expect(costTotal(amounts)).toBe(1000 + 500 + 200 + 100 + 325);
  });

  test("ESF+'s flat rate is entered, since the decision sets it", () => {
    const amounts = costAmounts(ESF_COST_CATEGORIES, { "esf-personal": "1000", "esf-indirekta": "150", "esf-resor": "x" });
    expect(amounts["esf-indirekta"]).toBe(150);
    expect(amounts["esf-resor"]).toBe(0);
  });
});

test.describe("report export", () => {
  const grant: Grant = {
    id: "g1",
    title_sv: "Klimatsmarta resenoder",
    title_en: "Climate-smart hubs",
    callId: heCall.id,
    awardedAmountSEK: 10_000_000,
    commitments: [],
    reportingEvents: [{ id: "r1", type: "interim", periodLabel_sv: "RP1", periodLabel_en: "RP1", deadlineMonthsFromNow: 2, status: "upcoming", outcomes: [] }],
  };
  const content: ReportContent = {
    sections: { "he-r-1.1": "We met the objectives." },
    deviations: {},
    documents: [],
    otherAttachments: [],
    tables: { "he-r-1.2-wp": [["WP1", "Management", "Kick-off held."], ["WP2", "Pilots", ""]] },
    costs: { "he-a": 1000, "he-c1": 200 },
  };

  test("follows the report form: numbered headings, work packages as subheadings, costs per category", async () => {
    const text = await documentText(await buildReportDocx(grant, grant.reportingEvents[0], heCall, undefined, content, "sv", heReport));
    expect(text).toContain("1.1 ");
    expect(text).toContain("We met the objectives.");
    expect(text).toContain("1.2.1 WP1: Management");
    expect(text).toContain("Kick-off held.");
    expect(text).toContain("1.2.2 WP2: Pilots");
    expect(text).toContain("A. Personnel costs");
    // E = 25 % of 1 200.
    expect(text).toContain("300 kr");
  });

  test("without a form, the standard sections", async () => {
    const text = await documentText(
      await buildReportDocx(grant, grant.reportingEvents[0], heCall, undefined, { ...content, sections: { summary: "Allt gick bra." } }, "sv")
    );
    expect(text).toContain("Sammanfattning");
    expect(text).not.toContain("1.2.1");
  });
});

test.describe("template outline", () => {
  test("reads Part B's structure from the funder's Word file", async () => {
    const outline = await outlineFromDocx(fs.readFileSync("public/mallar/horizon-europe-part-b-ria-ia-v5.1.docx"));
    expect(outline.language).toBe("en");
    expect(outline.pageLimit).toBe(40);
    const byNumber: Record<string, OutlineSection> = Object.fromEntries(outline.sections.filter((s) => s.number).map((s) => [s.number!, s]));
    expect(Object.keys(byNumber)).toEqual(expect.arrayContaining(["1.1", "1.2", "2.1", "2.2", "2.3", "3.1", "3.2"]));
    expect(byNumber["1.1"].label).toBe("Objectives and ambition");
    expect(byNumber["1.1"].indicativePages).toBe(4);
    expect(byNumber["1.1"].group?.number).toBe("1");
    expect(byNumber["2.3"].optional).toBe(true);
    expect(byNumber["3.1"].tables.map((t) => t.title.slice(0, 10))).toEqual(expect.arrayContaining(["Table 3.1a", "Table 3.1h"]));
    expect(byNumber["3.1"].tables.find((t) => t.title.startsWith("Table 3.1a"))?.columns.length).toBeGreaterThan(3);
  });

  test("reads numbered headings, instructions and tables of a plain document", () => {
    const p = (text: string, style?: string) =>
      `<w:p>${style ? `<w:pPr><w:pStyle w:val="${style}"/></w:pPr>` : ""}<w:r><w:t>${text}</w:t></w:r></w:p>`;
    const tbl = (cells: string[]) =>
      `<w:tbl><w:tr>${cells.map((c) => `<w:tc><w:p><w:r><w:t>${c}</w:t></w:r></w:p></w:tc>`).join("")}</w:tr></w:tbl>`;
    const xml = `<w:document><w:body>${[
      p("Ansökan om stöd", "Title"),
      p("Innehåll", "TOC1"),
      p("1 Bakgrund"),
      p("Beskriv problemet och målgruppen."),
      p("2 Genomförande"),
      p("2.1 Aktiviteter (frivillig)"),
      p("Skriv text här"),
      p("Tabell 1: Aktiviteter"),
      tbl(["Aktivitet", "Ansvarig", "Tid"]),
      p("Ansökan får vara högst 10 sidor."),
    ].join("")}</w:body></w:document>`;
    const outline = outlineFromXml(xml);
    expect(outline.title).toBe("Ansökan om stöd");
    expect(outline.language).toBe("sv");
    expect(outline.pageLimit).toBe(10);
    expect(outline.sections.map((s) => s.number)).toEqual(["1", "2.1"]);
    expect(outline.sections[0].instructions).toBe("Beskriv problemet och målgruppen.");
    const activities = outline.sections[1];
    expect(activities.optional).toBe(true);
    expect(activities.label).toBe("Aktiviteter");
    expect(activities.group).toEqual({ number: "2", label: "Genomförande" });
    expect(activities.tables).toEqual([{ title: "Tabell 1: Aktiviteter", columns: ["Aktivitet", "Ansvarig", "Tid"] }]);

    const form = templateFromProposal(
      {
        title: "Testmall",
        kind: "report",
        language: "sv",
        version: "1",
        pageLimit: "10",
        sourceUrl: "",
        sections: outline.sections.map((s, i) => ({ ...s, include: i === 1, includeTables: s.tables.map(() => true) })),
      },
      "custom-test"
    );
    expect(form).toMatchObject({ id: "custom-test", kind: "report", pageLimit: 10, custom: true });
    expect(form.sections).toHaveLength(1);
    expect(form.sections[0]).toMatchObject({ number: "2.1", required: false, group: { number: "2", label_sv: "Genomförande" } });
    expect(form.sections[0].tables?.[0].columns_sv).toEqual(["Aktivitet", "Ansvarig", "Tid"]);
  });
});

test.describe("budget workbook", () => {
  const heForm = findCallTemplate("he-ria-ia-part-b")!;
  const esfForm = findCallTemplate("esf-ansokan-om-stod")!;

  test("Horizon Europe: categories with the flat rate as a formula, per participant and per work package", async () => {
    const bytes = await buildBudgetXlsx({
      template: heForm,
      projectTitle: "Klimatsmarta resenoder",
      organisationName: "Uppsala kommun",
      callTitle: "Test",
      costs: { "he-a": "1000000", "he-c1": "200000" },
      eurRate: 11.5,
      eligibleBudgetSEK: 1_500_000,
      tables: {
        "he-3.1a": [["1", "Management", "1", "UU", "10", "1", "36"], ["2", "Pilots", "2", "TU", "30", "3", "30"]],
      },
      startYear: 2027,
      endYear: 2030,
      lang: "sv",
    });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
    expect(wb.worksheets.map((w) => w.name)).toEqual(["Budget", "Per deltagare", "Per arbetspaket"]);
    const budget = wb.getWorksheet("Budget")!;
    const cells: { label: string; value: ExcelJS.CellValue; row: number }[] = [];
    budget.eachRow((row) => cells.push({ label: String(row.getCell(1).value ?? ""), value: row.getCell(2).value, row: row.number }));
    const e = cells.find((c) => c.label.startsWith("E."))!.value as ExcelJS.CellFormulaValue;
    expect(e.formula).toMatch(/^ROUND\(0\.25\*\(B\d+\+B\d+\+B\d+\+B\d+\+B\d+\),0\)$/);
    expect(e.result).toBe(300_000);
    const total = cells.find((c) => c.label === "Summa")!.value as ExcelJS.CellFormulaValue;
    expect(total.formula).toMatch(/^SUM\(/);
    expect(total.result).toBe(1_500_000);
    // The euro column follows the rate cell.
    const eurCell = budget.getRow(cells.find((c) => c.label.startsWith("A."))!.row).getCell(3).value as ExcelJS.CellFormulaValue;
    expect(eurCell.formula).toMatch(/\/\$B\$4/);

    const participants = wb.getWorksheet("Per deltagare")!;
    const names: string[] = [];
    participants.eachRow((row) => names.push(String(row.getCell(1).value ?? "")));
    expect(names).toEqual(expect.arrayContaining(["1 (Koordinator) Uppsala kommun", "2 UU", "3 TU"]));

    const wp = wb.getWorksheet("Per arbetspaket")!;
    const shares: number[] = [];
    wp.eachRow((row) => {
      const v = row.getCell(4).value as ExcelJS.CellFormulaValue;
      if (v && typeof v === "object" && "formula" in v && v.formula.startsWith("IF")) shares.push(v.result as number);
    });
    expect(shares).toEqual([250_000, 750_000]);
  });

  test("ESF+: a sheet per year", async () => {
    const bytes = await buildBudgetXlsx({
      template: esfForm,
      projectTitle: "Jobbspåret",
      organisationName: "Uppsala kommun",
      callTitle: "Test",
      costs: { "esf-personal": "900000" },
      tables: {},
      startYear: 2027,
      endYear: 2029,
      lang: "sv",
    });
    const wb = new ExcelJS.Workbook();
    await wb.xlsx.load(Buffer.from(bytes) as unknown as ArrayBuffer);
    const years = wb.getWorksheet("Per år")!;
    expect(years.getRow(2).values).toEqual(expect.arrayContaining(["2027", "2028", "2029"]));
    const first = years.getRow(3).getCell(2).value as ExcelJS.CellFormulaValue;
    expect(first.formula).toMatch(/^ROUND\(Budget!\$B\$\d+\/3,0\)$/);
    expect(first.result).toBe(300_000);
  });
});

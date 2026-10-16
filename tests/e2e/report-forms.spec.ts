import { test, expect } from "@playwright/test";
import fs from "node:fs";
import JSZip from "jszip";
import ExcelJS from "exceljs";

// A grant's reports follow the call's report form (sections, tables, costs
// per cost category) and export the same way; forms are added and chosen
// per call in Datacenter › Mallar; an application's budget per the form's
// cost categories exports as an Excel workbook.

const docText = async (path: string) => {
  const zip = await JSZip.loadAsync(fs.readFileSync(path));
  return (await zip.file("word/document.xml")!.async("string")).replace(/<w:tab\/>/g, " ").replace(/<[^>]+>/g, " ").replace(/\u00a0/g, " ");
};

test("a report follows the call's report form, with costs per cost category", async ({ page }) => {
  // ap-2's call is ESF+; choose the ESF+ report form for it.
  await page.addInitScript(() => {
    window.localStorage.setItem("eu-navigator-template-assignments", JSON.stringify({ "esf-2027-care-skills": { report: "esf-rapport" } }));
  });
  await page.goto("/stod/ap-2");
  const next = page.locator("#next-report");
  await expect(next.getByTestId("report-form")).toContainText("ESF+");
  await next.getByLabel(/Genomförda aktiviteter/).fill("Tre utbildningsomgångar genomförda.");

  const costs = next.getByTestId("report-costs");
  await costs.getByLabel(/^Personal/).fill("400000");
  await costs.getByLabel(/Resor och logi/).fill("25000");
  await expect(costs.getByTestId("report-costs-total")).toHaveText("425 000 kr");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    next.getByRole("button", { name: "Exportera enligt rapportmallen (.docx)" }).click(),
  ]);
  const text = await docText((await download.path())!);
  expect(text).toContain("Genomförda aktiviteter");
  expect(text).toContain("Tre utbildningsomgångar genomförda.");
  expect(text).toContain("Resor och logi");
  expect(text).toContain("425 000 kr");
  expect(text).toMatch(/Upparbetat denna period\s+0,4 mnkr/);
});

test("Datacenter › Mallar reads a Word template into a form and assigns it to a call", async ({ page }) => {
  const { Document, Packer, Paragraph, HeadingLevel, Table, TableRow, TableCell } = await import("docx");
  const cell = (text: string) => new TableCell({ children: [new Paragraph({ text })] });
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({ text: "1 Projektets syfte", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: "Beskriv vad projektet ska åstadkomma." }),
          new Paragraph({ text: "2 Budget", heading: HeadingLevel.HEADING_1 }),
          new Paragraph({ text: "Tabell 1: Kostnader" }),
          new Table({ rows: [new TableRow({ children: [cell("Post"), cell("Belopp")] })] }),
          new Paragraph({ text: "Ansökan får vara högst 8 sidor." }),
        ],
      },
    ],
  });
  const buffer = Buffer.from(await Packer.toBuffer(doc));

  await page.goto("/datacenter/mallar");
  await page.getByTestId("template-upload").setInputFiles({
    name: "Regional ansökan.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  });
  const proposal = page.getByTestId("template-proposal");
  await expect(proposal.getByTestId("template-section")).toHaveCount(2);
  await expect(proposal.getByTestId("template-page-limit")).toHaveValue("8");
  await expect(proposal.getByTestId("template-section-label").first()).toHaveValue("Projektets syfte");
  await expect(proposal).toContainText("Tabell 1: Kostnader");
  await page.getByTestId("template-title").fill("Regional ansökan");
  await page.getByTestId("template-save").click();
  await expect(page.getByTestId("template-status")).toContainText("Regional ansökan är sparad");
  await expect(page.getByTestId("template-list")).toContainText("Regional ansökan");

  // Assign it to a call: the call's application follows it.
  const row = page.getByTestId("assign-horizon-miss-2027-04-cit-03");
  await row.getByRole("combobox").first().selectOption({ label: "Regional ansökan" });
  await page.goto("/ansokan?project=pb-4&call=horizon-miss-2027-04-cit-03");
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.getByTestId("template-panel")).toContainText("Regional ansökan");
  await expect(page.getByText("1 Projektets syfte")).toBeVisible();
});

test("the budget per cost category exports as an Excel workbook with formulas", async ({ page }) => {
  await page.goto("/ansokan?project=pb-4&call=horizon-miss-2027-04-cit-03");
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  const costs = page.getByTestId("budget-costs");
  await costs.getByLabel(/Personalkostnader/).fill("1000000");
  await costs.getByLabel(/Resor och traktamenten/).fill("200000");
  // E is 25 % of A + C: 300 000.
  await expect(costs.getByTestId("budget-costs-total")).toHaveText("1 500 000 kr");

  const [download] = await Promise.all([page.waitForEvent("download"), page.getByTestId("export-budget").click()]);
  expect(download.suggestedFilename()).toMatch(/\.xlsx$/);
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile((await download.path())!);
  expect(wb.worksheets.map((w) => w.name)).toEqual(["Budget", "Per deltagare"]);
  let flatRate: ExcelJS.CellFormulaValue | undefined;
  wb.getWorksheet("Budget")!.eachRow((r) => {
    if (String(r.getCell(1).value).startsWith("E.")) flatRate = r.getCell(2).value as ExcelJS.CellFormulaValue;
  });
  expect(flatRate?.formula).toMatch(/^ROUND\(0\.25\*/);
  expect(flatRate?.result).toBe(300000);
});

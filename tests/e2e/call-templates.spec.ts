import { test, expect } from "@playwright/test";
import fs from "node:fs";
import JSZip from "jszip";

// A call that uses a funder's shared application form shows the form's
// sections with their instructions, limits and tables, and exports the
// application the way the funder takes it in.

test("a Horizon Europe call follows Part B: instructions, tables and a Word export", async ({ page }) => {
  await page.goto("/ansokan?project=pb-4&call=horizon-miss-2027-04-cit-03");
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();

  const panel = page.getByTestId("template-panel");
  await expect(panel).toContainText("Horisont Europa RIA/IA – Part B");
  await expect(page.getByTestId("template-page-estimate")).toContainText("av högst 40 sidor");

  await expect(page.getByText("1.1 Mål och ambition")).toBeVisible();
  await expect(page.getByText("Bedöms under Excellens").first()).toBeVisible();
  await page.getByTestId("section-instructions-0").locator("summary").click();
  await expect(page.getByTestId("section-instructions-0")).toContainText("state of the art");

  const first = page.locator("#section-0");
  await first.fill("Mål: minska utsläppen vid tre resenoder med 20 procent till 2030.");
  await expect(page.getByTestId("section-count-0")).toContainText("65 tecken");

  const workPackages = page.getByTestId("template-table-he-3.1a");
  await workPackages.getByRole("button", { name: "+ Lägg till rad" }).click();
  await workPackages.getByLabel("Arbetspaket", { exact: true }).fill("Projektledning");
  await page.waitForTimeout(200);

  // Survives re-entering the workspace.
  await page.reload();
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.getByTestId("template-table-he-3.1a").getByLabel("Arbetspaket", { exact: true })).toHaveValue("Projektledning");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportera enligt mallen (.docx)" }).click(),
  ]);
  const zip = await JSZip.loadAsync(fs.readFileSync((await download.path())!));
  const xml = await zip.file("word/document.xml")!.async("string");
  expect(xml).toContain("1.1 Objectives and ambition");
  expect(xml).toContain("minska utsläppen vid tre resenoder");
  expect(xml).toContain("Projektledning");
});

test("an ESF+ call exports field by field for Projektrummet+", async ({ page }) => {
  await page.goto("/ansokan?project=pb-4&call=a1-kompetensutveckling-for-yrkesverksamma-ostra-mellansverig");
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.getByTestId("template-panel")).toContainText("Projektrummet+");
  await expect(page.getByText("1 Problemanalys")).toBeVisible();
  await expect(page.getByTestId("template-page-estimate")).toHaveCount(0);

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportera fält för fält (.docx)" }).click(),
  ]);
  const zip = await JSZip.loadAsync(fs.readFileSync((await download.path())!));
  const xml = await zip.file("word/document.xml")!.async("string");
  expect(xml).toContain("1. Problemanalys");
  expect(xml).toContain("Bedöms under Urvalskriterium 1");
});

test("an uploaded funder template is filled in at export", async ({ page }) => {
  const { Document, Packer, Paragraph } = await import("docx");
  const funderDoc = new Document({
    sections: [{ children: [new Paragraph({ text: "1.1 Objectives and ambition" }), new Paragraph({ text: "1.2 Methodology" })] }],
  });
  const buffer = await Packer.toBuffer(funderDoc);

  await page.goto("/ansokan?project=pb-4&call=horizon-miss-2027-04-cit-02");
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await page.locator("#section-0").fill("Funder template text");
  await page.getByTestId("funder-file-input").setInputFiles({
    name: "Part-B.docx",
    mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    buffer,
  });
  await expect(page.getByTestId("funder-file-name")).toContainText("Part-B.docx");

  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Exportera i funderns Word-mall (.docx)" }).click(),
  ]);
  const zip = await JSZip.loadAsync(fs.readFileSync((await download.path())!));
  const xml = await zip.file("word/document.xml")!.async("string");
  expect(xml.indexOf("Funder template text")).toBeGreaterThan(xml.indexOf("1.1 Objectives and ambition"));
  expect(xml.indexOf("Funder template text")).toBeLessThan(xml.indexOf("1.2 Methodology"));
  // Sections the stand-in template doesn't have are listed.
  await expect(page.getByTestId("export-notice")).toContainText("Hittades inte i mallen");
});

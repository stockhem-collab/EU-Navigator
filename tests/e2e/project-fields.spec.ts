import { test, expect } from "@playwright/test";

// A project is described with the same fields everywhere: the new-project
// form (which can now also just save it), the project's own page, and the
// CSV template.

test("a new project can be saved from the form, and its fields are kept and editable", async ({ page }) => {
  await page.goto("/ansokan");
  await expect(page.getByRole("heading", { name: "Nytt projekt – beskriv projektet" })).toBeVisible();
  await page.getByRole("button", { name: "Fyll i exempel" }).click();
  const title = `Sparat projekt ${Date.now()}`;
  await page.getByLabel("Projektnamn").fill(title);
  await page.getByRole("button", { name: "Spara projektet" }).click();

  await expect(page).toHaveURL(/\/projekt\/manual-/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  // The form's matching fields came along.
  await expect(page.getByText("Investering (bygg, teknik, infrastruktur)")).toBeVisible();
  await expect(page.getByText("Västra Götaland")).toBeVisible();

  // …and can be changed, or cleared, on the project page.
  await page.getByRole("button", { name: "Redigera" }).click();
  await page.getByLabel("Typ av insats").selectOption("");
  await page.getByLabel("Län där projektet genomförs").selectOption("skane");
  await page.getByText("Äldre", { exact: true }).click();
  await page.getByRole("button", { name: "Spara" }).first().click();
  await page.reload();
  await expect(page.getByText("Skåne")).toBeVisible();
  await expect(page.getByText("Investering (bygg, teknik, infrastruktur)")).toHaveCount(0);
  await expect(page.getByText("Äldre", { exact: true })).toBeVisible();
});

test("saving from the form requires the same fields as finding funding", async ({ page }) => {
  await page.goto("/ansokan");
  await page.getByRole("button", { name: "Spara projektet" }).click();
  await expect(page).toHaveURL(/\/ansokan$/);
});

test("a project opened in the form is updated, not duplicated", async ({ page }) => {
  await page.goto("/ansokan?project=pb-4");
  await expect(page.locator('[data-project-loaded="true"]')).toBeVisible();
  await expect(page.getByRole("heading", { name: "Projektet – granska och hitta finansiering" })).toBeVisible();
  const title = `Uppdaterat ${Date.now()}`;
  await page.getByLabel("Projektnamn").fill(title);
  await page.getByLabel("Typ av insats").selectOption("pilot");
  await page.getByRole("button", { name: "Spara projektet" }).click();
  await expect(page).toHaveURL(/\/projekt\/pb-4$/);
  await expect(page.getByRole("heading", { name: title })).toBeVisible();
  await expect(page.getByText("Pilot eller demonstration")).toBeVisible();
});

test("the CSV template's fields are imported onto the project", async ({ page }) => {
  await page.goto("/projekt");
  await page.getByText("Kolumner och tillåtna värden").click();
  await expect(page.getByText("Kompetensutveckling", { exact: false }).first()).toBeVisible();

  const csv =
    "Titel;Budget;Sektor;Typ av insats;Målgrupp;Län;Partnerskap;Taggar\n" +
    'CSV-fältprojekt;8000000;Social omsorg;Kompetensutveckling;"Anställda och personal, Äldre";Halland;Konsortium;Social inkludering\n';
  await page.locator('input[type="file"]').setInputFiles({ name: "p.csv", mimeType: "text/csv", buffer: Buffer.from(csv, "utf-8") });
  await expect(page.getByText("1 projekt importerade")).toBeVisible();
  await page.locator("tbody tr", { hasText: "CSV-fältprojekt" }).first().locator("a").first().click();
  await expect(page.getByText("Kompetensutveckling och insatser för människor")).toBeVisible();
  await expect(page.getByText("Anställda och personal, Äldre")).toBeVisible();
  await expect(page.getByText("Halland")).toBeVisible();
  await expect(page.getByText("Konsortium med partner från minst tre länder")).toBeVisible();
});

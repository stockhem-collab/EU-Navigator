import { test, expect, Page } from "@playwright/test";

// The assessment in the application workspace follows what the application
// says — and the workspace works from the project and calls as they are
// saved in this browser, not the seed data.

const WRITTEN =
  "Projektet minskar energianvändningen med 30 % (1200 MWh per år) och når 400 deltagare. " +
  "Utgångsvärde 2025: 4000 MWh. Jämställdhet och tillgänglighet integreras i alla aktiviteter.";

const overall = async (page: Page) => Number((await page.getByTestId("readiness-overall").innerText()).split("/")[0]);

async function openFromProject(page: Page, projectId: string) {
  await page.goto(`/projekt/${projectId}`);
  const href = await page.locator("#matches").getByRole("link", { name: /^(Starta ansökan|Fortsätt ansökan)$/ }).first().getAttribute("href");
  await page.goto(href!);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  return href!;
}

test("writing the application updates the assessment as you type", async ({ page }) => {
  await openFromProject(page, "pb-2");
  const before = await overall(page);
  await expect(page.getByTestId("section-assessment-0")).toContainText("räknas in i bedömningen när du har skrivit");

  await page.getByLabel("Effekter (outcomes)", { exact: true }).fill(WRITTEN);
  await expect.poll(() => overall(page)).toBeGreaterThan(before);
  await expect(page.getByText(/↑ \+\d+ sedan du öppnade ansökan/)).toBeVisible();
  const section = page.locator("div", { has: page.getByLabel("Effekter (outcomes)", { exact: true }) }).last();
  await expect(section.getByText("✓ Kvantifierad effekt")).toBeVisible();
  await expect(section.getByText("✓ Utgångsvärde")).toBeVisible();

  // Survives a reload: the assessment is computed from the saved draft.
  const after = await overall(page);
  await page.reload();
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect.poll(() => overall(page)).toBe(after);
});

test("each remaining action points to the section to write it in", async ({ page }) => {
  await openFromProject(page, "pb-2");
  await page.getByRole("tab", { name: "Bedömning" }).click();
  await page.getByRole("button", { name: "Gå till Indikatorer" }).click();
  await expect(page.getByLabel("Indikatorer", { exact: true })).toBeFocused();
});

test("an edited project is assessed as saved, on the project page and in the workspace", async ({ page }) => {
  const href = await openFromProject(page, "pb-2");
  const workspaceBefore = await overall(page);

  await page.goto("/projekt/pb-2");
  const readinessBefore = await page.getByTestId("project-readiness").innerText();
  await page.getByRole("button", { name: "✎ Redigera" }).click();
  await page.locator("textarea").first().fill(`${WRITTEN} Ett AI-baserat kontaktcenter för medborgarfrågor.`);
  await page.getByRole("button", { name: "Spara" }).click();
  await expect(page.getByTestId("project-readiness")).not.toHaveText(readinessBefore);

  await page.goto(href);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect.poll(() => overall(page)).toBeGreaterThan(workspaceBefore);
});

test("going back from an application opened on a project page returns to that page", async ({ page }) => {
  await openFromProject(page, "pb-2");
  await page.getByRole("button", { name: "← Tillbaka" }).click();
  await expect(page).toHaveURL(/\/projekt\/pb-2/);
});

test("Ny ansökan offers an existing project instead of describing it again", async ({ page }) => {
  await page.goto("/ansokan");
  await page.getByLabel("Finns projektet redan?").selectOption("pb-4");
  await page.getByRole("button", { name: "Till projektets matchningar" }).click();
  // A client-side navigation: under a full parallel run the dev server may
  // still be compiling the project page, which takes longer than the default.
  await expect(page).toHaveURL(/\/projekt\/pb-4#matches/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Matchningar mot öppna och kommande utlysningar" })).toBeVisible();
});

test("a grant is listed under its project's name, with the EU project's own name under it", async ({ page }) => {
  await page.goto("/rapportera");
  const grants = page.locator("section", { has: page.getByRole("heading", { name: "Beviljade stöd" }) });
  await expect(grants.getByRole("link", { name: "Energieffektivisering kommunala skolor" })).toBeVisible();
  await expect(grants.getByText("EU-projektets namn: LIFE – Green Schools")).toBeVisible();
});

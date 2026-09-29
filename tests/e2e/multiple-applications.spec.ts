import { test, expect, Page } from "@playwright/test";

// A project can have several applications — to different calls, and more
// than one to the same call — each with its own status and draft. The
// project page lists them, and the project's own status follows them.

async function startFromMatch(page: Page, projectId: string, nth: number) {
  await page.goto(`/projekt/${projectId}`);
  // The match list's own buttons — the applications section above it links
  // into the workspace too.
  const link = page.locator("main").getByRole("link", { name: /^(Starta ansökan|Fortsätt ansökan)$/ }).nth(nth);
  await page.goto((await link.getAttribute("href"))!);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
}

async function editDraft(page: Page, text: string) {
  await page.locator("textarea").first().fill(text);
  await page.waitForTimeout(200);
}

test("applications to two calls are listed separately, each with its own status", async ({ page }) => {
  await startFromMatch(page, "pb-4", 0);
  await editDraft(page, "Första ansökan");
  await startFromMatch(page, "pb-4", 1);
  await editDraft(page, "Andra ansökan");

  await page.goto("/projekt/pb-4");
  const section = page.locator("section", { has: page.getByRole("heading", { name: "Ansökningar" }) });
  const rows = section.locator("li");
  await expect(rows).toHaveCount(2);
  await expect(rows.first().locator(".badge", { hasText: "Utkast" })).toBeVisible();
  // Applying moves the project itself into "searching for funding".
  await expect(page.locator("main .badge", { hasText: "Söker finansiering" }).first()).toBeVisible();

  // Submitting one application doesn't touch the other's status…
  await rows.first().locator("select").selectOption("submitted");
  await expect(rows.first().locator(".badge", { hasText: "Inskickad" })).toBeVisible();
  await expect(rows.nth(1).locator("select")).toHaveValue("draft");
  // The project's own status is a lifecycle: still searching for funding
  // while an application is with the funder.
  await expect(page.locator("main .badge", { hasText: "Söker finansiering" }).first()).toBeVisible();

  // …and the drafts stay separate.
  await rows.nth(1).getByRole("link", { name: "Fortsätt" }).click();
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.locator("textarea").first()).toHaveValue("Andra ansökan");
});

test("a new round to the same call gets its own empty draft; the old one is kept", async ({ page }) => {
  await startFromMatch(page, "pb-5", 0);
  await editDraft(page, "Omgång 1");

  await page.getByLabel("Ansökans status").selectOption("rejected");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("button", { name: "+ Ny ansökan till samma utlysning" }).click();
  await expect(page).toHaveURL(/application=/);
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.locator("textarea").first()).not.toHaveValue("Omgång 1");
  await expect(page.getByLabel("Ansökans status")).toHaveValue("draft");
  await expect(page.getByText("Projektet har 1 annan ansökan till samma utlysning.")).toBeVisible();
  await editDraft(page, "Omgång 2");

  await page.goto("/projekt/pb-5");
  const section = page.locator("section", { has: page.getByRole("heading", { name: "Ansökningar" }) });
  await expect(section.getByText(/· Ansökan 1/)).toBeVisible();
  await expect(section.getByText(/· Ansökan 2/)).toBeVisible();

  // The rejected round reopens with its own text.
  await section.locator("li", { has: page.locator(".badge", { hasText: "Avslag" }) }).getByRole("link", { name: "Öppna" }).click();
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.locator("textarea").first()).toHaveValue("Omgång 1");
});

test("after a rejection, 'Starta ansökan' starts a fresh application instead of reopening it", async ({ page }) => {
  await startFromMatch(page, "pb-6", 0);
  await editDraft(page, "Avslagen text");
  await page.getByLabel("Ansökans status").selectOption("rejected");

  await startFromMatch(page, "pb-6", 0);
  await expect(page.locator("textarea").first()).not.toHaveValue("Avslagen text");
  await expect(page.getByLabel("Ansökans status")).toHaveValue("draft");
});

test("an awarded application becomes a grant under its own call", async ({ page }) => {
  await startFromMatch(page, "pb-3", 1);
  const callTitle = (await page.locator("h1 + p").innerText()).split(" — ")[1];
  await editDraft(page, "Beviljad ansökan");
  await page.getByLabel("Ansökans status").selectOption("awarded");

  await page.goto("/projekt/pb-3");
  // Confirmed in the page, not through a blocking window.confirm dialog.
  page.on("dialog", (d) => {
    throw new Error(`Unexpected native dialog: ${d.message()}`);
  });
  const register = page.getByRole("button", { name: "Registrera beviljat stöd" });
  await register.click();
  await page.getByRole("button", { name: "Avbryt" }).click();
  await expect(page).toHaveURL(/\/projekt\/pb-3/);
  await register.click();
  await page.getByRole("button", { name: "Ja, registrera" }).click();
  await expect(page).toHaveURL(/\/stod\//);
  await expect(page.getByText(callTitle).first()).toBeVisible();
  // The grant links back to the application it was awarded on.
  await expect(page.getByRole("link", { name: "Öppna ansökan" })).toBeVisible();

  await page.goto("/projekt/pb-3");
  await expect(page.getByRole("link", { name: "Visa beviljat stöd" }).first()).toBeVisible();

  // Its reporting shows up under Rapportera, next to the seeded grant.
  await page.goto("/rapportera");
  await expect(page.getByRole("heading", { name: "Beviljade stöd" })).toBeVisible();
  await expect(page.locator("main").getByText(callTitle).first()).toBeVisible();
});

test("two awarded applications on one project get two separate grants", async ({ page }) => {
  for (const nth of [0, 1]) {
    await startFromMatch(page, "pb-6", nth);
    await editDraft(page, `Beviljad ${nth}`);
    await page.getByLabel("Ansökans status").selectOption("awarded");
    await page.goto("/projekt/pb-6");
    await page.getByRole("button", { name: "Registrera beviljat stöd" }).first().click();
    await page.getByRole("button", { name: "Ja, registrera" }).click();
    await expect(page).toHaveURL(/\/stod\//);
  }
  await page.goto("/projekt/pb-6");
  const grants = page.locator("section", { has: page.getByRole("heading", { name: "Beviljat stöd och rapportering" }) });
  await expect(grants.getByRole("link", { name: "Visa beviljat stöd" })).toHaveCount(2);
});

test("drafts saved before application records existed show up as applications", async ({ page }) => {
  await page.goto("/oversikt");
  await page.evaluate(() => {
    window.localStorage.setItem(
      "eu-navigator-application:pb-2:life-2027-climate-schools",
      JSON.stringify({ sectionDrafts: { Problem: "Gammalt utkast" }, updatedAt: new Date().toISOString(), versions: [] })
    );
  });
  await page.goto("/projekt/pb-2");
  const section = page.locator("section", { has: page.getByRole("heading", { name: "Ansökningar" }) });
  await expect(section.locator("li")).toHaveCount(1);
  await section.getByRole("link", { name: "Fortsätt" }).click();
  await expect(page.locator('[data-draft-loaded="true"]')).toBeVisible();
  await expect(page.locator("textarea").first()).toHaveValue("Gammalt utkast");
});

import { test, expect } from "@playwright/test";

// The imported projects (Kohesio, Keep.eu, CORDIS, ESF-projektbanken) are
// shown on Referensprojekt next to the example projects, each with its
// source, and filtered on the server by source, programme, country and year.

test("imported projects show their source and amounts in kronor with the euro amount as tooltip", async ({ page }) => {
  await page.goto("/referensprojekt");
  await expect(page.getByText("Källa: Exempel", { exact: true }).first()).toBeVisible();

  const imported = page.getByTestId("imported-projects");
  await expect(imported.getByRole("heading", { name: "Projekt ur EU:s projektdatabaser" })).toBeVisible();
  await expect(imported.getByText(/Visar 20 av [\d\s ]+ projekt/)).toBeVisible();

  await page.getByLabel("Källa", { exact: true }).selectOption("cordis");
  const cards = imported.getByTestId("imported-project-card");
  await expect(cards.first()).toBeVisible();
  await expect(cards.first().getByText("Källa: CORDIS")).toBeVisible();
  // Only imported projects with that source: the examples are hidden.
  await expect(page.getByText("Källa: Exempel", { exact: true })).toHaveCount(0);
  await expect(imported.getByText("Källa: Kohesio")).toHaveCount(0);

  // CORDIS publishes euro; the card shows kronor and keeps the euro amount.
  const amount = cards.first().locator("span[title^='Originalbelopp']").first();
  await expect(amount).toHaveText(/mnkr/);
  await expect(amount).toHaveAttribute("title", /EUR\. Omräknat med årsmedelkursen \d{4}/);
});

test("filters on programme, country and year narrow the imported list", async ({ page }) => {
  await page.goto("/referensprojekt");
  const imported = page.getByTestId("imported-projects");
  await expect(imported.getByText(/Visar 20 av/)).toBeVisible();

  await page.getByLabel("Källa", { exact: true }).selectOption("kohesio");
  await page.getByLabel("Program", { exact: true }).selectOption("esf");
  await page.getByLabel("Startår", { exact: true }).selectOption("2023");
  await page.getByLabel("Land", { exact: true }).selectOption("SE");

  const cards = imported.getByTestId("imported-project-card");
  await expect(cards.first()).toBeVisible();
  const count = await cards.count();
  for (let i = 0; i < count; i++) {
    const card = cards.nth(i);
    await expect(card.getByText("ESF+", { exact: true })).toBeVisible();
    await expect(card.getByText("Sverige", { exact: true })).toBeVisible();
    await expect(card.getByText(/^2023-\d{2}/)).toBeVisible();
  }

  await page.getByLabel("Land", { exact: true }).selectOption("FI");
  await expect(imported.getByText("Inga projekt matchar filtret.")).toBeVisible();
});

test("the API pages and filters on the server", async ({ request }) => {
  const res = await request.get("/api/referensprojekt?source=keep-eu&q=flood&pageSize=5");
  expect(res.ok()).toBe(true);
  const data = await res.json();
  expect(data.total).toBeGreaterThan(5);
  expect(data.projects).toHaveLength(5);
  for (const p of data.projects) expect(p.source).toBe("keep-eu");
  expect(data.options.sources.map((s: { id: string }) => s.id).sort()).toEqual(["cordis", "esf", "keep-eu", "kohesio"]);
});

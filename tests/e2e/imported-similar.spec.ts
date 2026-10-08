import { test, expect } from "@playwright/test";

// Similar projects from the imported data: a Swedish idea finds English
// projects through the theme translation table and the word list, each
// with the reasons it is similar, and the organisations behind them are
// suggested as partners. Amount benchmarks show on the match cards.

test("a project's page shows similar imported projects with reasons, and possible partners", async ({ page }) => {
  // "Nordiskt klimatsamarbete – dagvattenhantering", a climate project
  // described only in Swedish.
  await page.goto("/projekt/pb-5");
  const similar = page.getByTestId("imported-similar");
  await expect(similar.getByRole("heading", { name: "Liknande projekt i EU:s projektdatabaser" })).toBeVisible();
  const cards = similar.getByTestId("imported-project-card");
  await expect(cards.first()).toBeVisible();

  const reasons = similar.getByTestId("similarity-reasons").first();
  await expect(reasons.getByText(/^◆ Temat klimat: /)).toBeVisible();
  // The Swedish "dagvatten"/"klimatanpassad" found English wording.
  await expect(similar.getByText(/projektet nämner "(flood|climate|resilien)/).first()).toBeVisible();

  const partners = page.getByTestId("partner-suggestions");
  await expect(partners.getByRole("heading", { name: "Möjliga partners" })).toBeVisible();
  await expect(partners.locator("tbody tr").first()).toBeVisible();
  await expect(partners.locator("tbody tr").first()).toContainText(/(Koordinator|Partner|Associerad) i \d/);
});

test("the match list shows what similar projects were granted", async ({ page }) => {
  await page.goto("/projekt/pb-5");
  const benchmark = page.locator("#matches").getByTestId("amount-benchmark").first();
  await expect(benchmark).toBeVisible();
  await expect(benchmark).toContainText(/Beviljat i liknande projekt: .*mnkr, median .*mnkr|Inget underlag/);
});

test("the similarity API takes an idea from the browser and returns English projects for a Swedish idea", async ({ request }) => {
  const res = await request.post("/api/liknande-projekt", {
    data: {
      title: "Klimatanpassning mot skyfall",
      description: "Kommunen vill göra dagvattensystem och grönområden tåligare mot skyfall och värmeböljor.",
      sector: "climate",
      tags: [],
      ownOrganisation: { name: "Uppsala kommun" },
    },
  });
  expect(res.ok()).toBe(true);
  const data = await res.json();
  expect(data.similar.length).toBeGreaterThan(3);
  const english = data.similar.find((s: { project: { source: string } }) => s.project.source === "cordis" || s.project.source === "keep-eu");
  expect(english).toBeTruthy();
  expect(english.reasons.some((r: { text_sv: string }) => /flood|resilien|heat|climate adaptation|stormwater/.test(r.text_sv))).toBe(true);
  expect(data.partners.every((p: { name: string }) => !/uppsala kommun/i.test(p.name))).toBe(true);

  const bad = await request.post("/api/liknande-projekt", { data: { title: "x", sector: "nope" } });
  expect(bad.status()).toBe(400);
});

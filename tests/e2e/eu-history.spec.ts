import { test, expect } from "@playwright/test";

// "Er EU-historik" shows Uppsala's own EU-funded projects from
// uppsala-history.json (the default demo profile), with the unconfirmed candidates apart and the
// comparison with other municipalities. 92 sure matches: 17 from the
// structural funds, Interreg, Horizon and AMIF, 75 Erasmus+ projects.

test("the EU history view lists the municipality's projects, candidates and peers", async ({ page }) => {
  await page.goto("/referensprojekt");
  await page.getByRole("link", { name: "Er EU-historik" }).click();
  await expect(page).toHaveURL(/\/historik$/);
  await expect(page.getByRole("heading", { name: "Er EU-historik", level: 1 })).toBeVisible();
  await expect(page.getByText(/Uppsala kommuns EU-finansierade projekt sedan 2014/)).toBeVisible();

  await expect(page.getByTestId("history-project-count")).toHaveText("92");
  const projects = page.getByTestId("history-projects");
  await expect(projects.locator("tbody tr")).toHaveCount(92);
  await expect(projects.getByText("Effektivare mottagande")).toBeVisible();
  // Amounts in kronor, the published euro amount in the tooltip.
  await expect(projects.locator("span[title^='Originalbelopp']").first()).toHaveText(/mnkr/);

  const candidates = page.getByTestId("history-candidates");
  await expect(page.getByRole("heading", { name: "Möjliga träffar, inte bekräftade" })).toBeVisible();
  await expect(candidates.getByText(/Siri- förstudie/)).toBeVisible();
  // "Uppsala Municipality" in keep.eu says it is the municipality: counted.
  await expect(projects.getByText(/Delivering Community Benefits of Civic Energy/)).toBeVisible();

  const peers = page.getByTestId("history-peers");
  await expect(peers.getByText("Stockholms stad")).toBeVisible();
  await expect(peers.getByText("Uppsala kommun")).toBeVisible();

  // The SKR kommungrupp as comparison group instead.
  await page.getByTestId("peer-groups").getByRole("link", { name: "Kommungrupp: Större stad" }).click();
  await expect(page).toHaveURL(/grupp=kommungrupp/);
  await expect(peers.getByText("Växjö kommun")).toBeVisible();
  await expect(peers.getByText("Stockholms stad")).toHaveCount(0);
  await expect(peers.locator("tbody tr")).toHaveCount(23);
});

// Possible matches can be confirmed (then counted as the municipality's own)
// or rejected (set aside, can be undone); the choice survives a reload.
test("possible matches can be confirmed and rejected", async ({ page }) => {
  await page.goto("/historik");
  const candidates = page.getByTestId("history-candidates");
  await expect(page.getByTestId("history-project-count")).toHaveText("92");
  const before = await candidates.locator("tbody tr").count();

  await candidates.getByRole("button", { name: /^Bekräfta: Siri/ }).click();
  await expect(page.getByTestId("history-project-count")).toHaveText("93");
  const projects = page.getByTestId("history-projects");
  await expect(projects.getByText(/Siri- förstudie/)).toBeVisible();
  await expect(projects.getByText("Bekräftad manuellt")).toBeVisible();
  await expect(candidates.locator("tbody tr")).toHaveCount(before - 1);

  await candidates.getByRole("button", { name: /^Avfärda: / }).first().click();
  await expect(candidates.locator("tbody tr")).toHaveCount(before - 2);
  const rejected = page.getByTestId("history-rejected");
  await expect(rejected.getByText("Avfärdade träffar (1)")).toBeVisible();
  await expect(page.getByTestId("history-project-count")).toHaveText("93");

  await page.reload();
  await expect(page.getByTestId("history-project-count")).toHaveText("93");
  await expect(page.getByTestId("history-rejected")).toBeVisible();

  await rejected.getByText("Avfärdade träffar (1)").click();
  await rejected.getByRole("button", { name: /^Ångra/ }).click();
  await expect(page.getByTestId("history-rejected")).toHaveCount(0);
  await projects.getByRole("button", { name: "Ångra" }).click();
  await expect(page.getByTestId("history-project-count")).toHaveText("92");
  await expect(candidates.locator("tbody tr")).toHaveCount(before);
});

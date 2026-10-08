import { test, expect } from "@playwright/test";

// "Er EU-historik" shows Uppsala's own EU-funded projects from
// uppsala-history.json, with the unconfirmed candidates apart and the
// comparison with the largest municipalities.

test("the EU history view lists the municipality's projects, candidates and peers", async ({ page }) => {
  await page.goto("/referensprojekt");
  await page.getByRole("link", { name: "Er EU-historik" }).click();
  await expect(page).toHaveURL(/\/historik$/);
  await expect(page.getByRole("heading", { name: "Er EU-historik", level: 1 })).toBeVisible();
  await expect(page.getByText(/Uppsala kommuns EU-finansierade projekt sedan 2014/)).toBeVisible();

  await expect(page.getByTestId("history-project-count")).toHaveText("14");
  const projects = page.getByTestId("history-projects");
  await expect(projects.locator("tbody tr")).toHaveCount(14);
  await expect(projects.getByText("Effektivare mottagande")).toBeVisible();
  // Amounts in kronor, the published euro amount in the tooltip.
  await expect(projects.locator("span[title^='Originalbelopp']").first()).toHaveText(/mnkr/);

  const candidates = page.getByTestId("history-candidates");
  await expect(page.getByRole("heading", { name: "Möjliga träffar, inte bekräftade" })).toBeVisible();
  await expect(candidates.getByText(/COBEN/)).toBeVisible();

  const peers = page.getByTestId("history-peers");
  await expect(peers.getByText("Stockholms stad")).toBeVisible();
  await expect(peers.getByText("Uppsala kommun")).toBeVisible();
});

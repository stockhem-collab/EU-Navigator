import { test, expect } from "@playwright/test";

// A user's own new tag (lib/hooks/useTags.ts) — the fixed vocabulary
// (lib/data/tags.ts) is deliberately closed to avoid recreating the
// keyword-matching synonym problem at the tag level, but a genuinely
// missing theme still needs a governed way in. A tag added from any one
// picker (intake, Projektbank, the Datacenter import tool) is immediately
// selectable from every other picker, via the same localStorage-overlay
// pattern already used for imported calls and projects.

test("a custom tag added on intake is immediately usable on Projektbank and in the import tool", async ({ page }) => {
  const customLabel = `Testtagg ${Date.now()}`;

  await page.goto("/ansokan");
  await page.getByRole("button", { name: /Fyll i exempel/i }).click();
  await page.getByPlaceholder("Ny tagg som saknas…").fill(customLabel);
  await page.getByRole("button", { name: "Lägg till ny tagg" }).click();

  const newChip = page.getByRole("button", { name: customLabel, exact: true });
  await expect(newChip).toBeVisible();
  await expect(newChip).toHaveAttribute("aria-pressed", "true");

  // Visible and selectable from a completely different picker, in the same
  // browser (shared localStorage) — not just re-created locally.
  await page.goto("/projekt/pb-1");
  await page.getByRole("button", { name: "✎ Redigera" }).click();
  const chipOnPb = page.getByRole("button", { name: customLabel, exact: true });
  await expect(chipOnPb).toBeVisible();
  await chipOnPb.click();
  await page.getByRole("button", { name: "Spara ändringar" }).click();

  // Shows the friendly label in the read-only view, not the raw slug id.
  await expect(page.getByText(customLabel)).toBeVisible();

  await page.goto("/datacenter/import-utlysning");
  await expect(page.getByRole("button", { name: customLabel, exact: true })).toBeVisible();
});

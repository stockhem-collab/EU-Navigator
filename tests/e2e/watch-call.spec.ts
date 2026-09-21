import { test, expect } from "@playwright/test";

// The missing "clear function to flag a call" — a visible per-call toggle
// on Bevakning and on the call's own EU-databas page, both writing to the
// same useWatchPreferences.callIds, manageable from Inställningar too.

const CALL_TITLE = "LIFE – Klimatåtgärder i offentliga byggnader 2027";

test("flagging a call on Bevakning makes it show up under 'only watched'", async ({ page }) => {
  // Start with no broad sector/programme watches so only the per-call flag
  // (not the LIFE programme's "climate" sector being a default watch) drives
  // the "only watched" filter in this test.
  await page.addInitScript(() => {
    window.localStorage.setItem(
      "eu-navigator-watch-preferences",
      JSON.stringify({
        sectors: [],
        programIds: [],
        callIds: [],
        notify: {
          newCallMatchesOrg: true,
          callMatchesProject: true,
          highRelevanceMatch: true,
          deadlineApproaching: true,
          commentOnApplication: true,
          reportingDeadline: true,
        },
        digest: "weekly",
      })
    );
  });
  await page.goto("/bevakning");

  const card = page.locator("div.rounded-xl", { hasText: CALL_TITLE }).first();
  await expect(card).toBeVisible();

  await card.getByRole("button", { name: /^☆ Bevaka$/ }).click();
  await expect(card.getByRole("button", { name: /^★ Bevakas$/ })).toBeVisible();

  await page.getByRole("checkbox").check();
  await expect(page.getByText(CALL_TITLE)).toBeVisible();

  // Unflagging removes it from the "only watched" view again.
  await page.getByRole("button", { name: /^★ Bevakas$/ }).first().click();
  await expect(page.getByText(CALL_TITLE)).toHaveCount(0);
});

test("flagging from the EU-databas call page is reflected in Bevakning and Inställningar", async ({ page }) => {
  await page.goto("/eu-databas/life/life-2027-climate-schools");
  const watchButton = page.getByRole("button", { name: /^☆ Bevaka$/ });
  await expect(watchButton).toBeVisible();
  await watchButton.click();
  await expect(page.getByRole("button", { name: /^★ Bevakas$/ })).toBeVisible();

  await page.goto("/bevakning");
  await page.getByRole("checkbox").check();
  await expect(page.getByText(CALL_TITLE)).toBeVisible();

  await page.goto("/installningar/bevakningar");
  const row = page.locator("li", { hasText: CALL_TITLE });
  await expect(row).toBeVisible();
  await row.getByRole("button", { name: /Sluta bevaka/i }).click();
  await expect(row).toHaveCount(0);
});

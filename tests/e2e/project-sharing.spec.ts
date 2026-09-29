import { test, expect } from "@playwright/test";

// Coverage for sharing a project with an org unit so it also
// surfaces for people outside its own role assignments
// — scoped to the two organisation levels that matter ("hela kommunen" or
// a specific förvaltning). Default behaviour (no filter applied) must stay
// exactly as before: everyone still sees the whole portfolio unless they
// explicitly ask to narrow it down.

test("Dela projekt offers the two top organisation levels", async ({ page }) => {
  await page.goto("/projekt/pb-4");
  await expect(page.getByRole("heading", { name: "Dela projekt" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Exempelstad", exact: true })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Stadsledningskontoret" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Serviceförvaltningen" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Socialförvaltningen" })).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "Miljöförvaltningen" })).toBeVisible();
});

test("the 'mina och delade' filter defaults to off, showing the whole portfolio", async ({ page }) => {
  await page.goto("/projekt");
  await expect(page.getByRole("checkbox", { name: "Visa endast mina och delade projekt" })).not.toBeChecked();
  await expect(page.getByText("Cykelinfrastruktur city")).toBeVisible();
});

test("sharing with an unrelated department does not surface a project, but the current user's own department does", async ({
  page,
}) => {
  // pb-4 has no assigned roles and isn't shared with anything yet — it
  // should disappear once the filter is on.
  await page.goto("/projekt");
  await page.getByRole("checkbox", { name: "Visa endast mina och delade projekt" }).check();
  await expect(page.getByText("Cykelinfrastruktur city")).toHaveCount(0);
  // A project the current user is actually assigned to must stay visible.
  await expect(page.getByText("Energieffektivisering kommunala skolor")).toBeVisible();

  // Sharing with a department the current user (Stadsledningskontoret)
  // doesn't belong to still doesn't surface it.
  await page.goto("/projekt/pb-4");
  await page.getByRole("checkbox", { name: "Miljöförvaltningen" }).check();
  await page.goto("/projekt");
  await page.getByRole("checkbox", { name: "Visa endast mina och delade projekt" }).check();
  await expect(page.getByText("Cykelinfrastruktur city")).toHaveCount(0);

  // Sharing with the current user's own department does.
  await page.goto("/projekt/pb-4");
  await page.getByRole("checkbox", { name: "Miljöförvaltningen" }).uncheck();
  await page.getByRole("checkbox", { name: "Stadsledningskontoret" }).check();
  await page.goto("/projekt");
  await page.getByRole("checkbox", { name: "Visa endast mina och delade projekt" }).check();
  await expect(page.getByText("Cykelinfrastruktur city")).toBeVisible();
});

test("sharing with the top-level (root) unit reaches every department", async ({ page }) => {
  await page.goto("/projekt/pb-5");
  await page.getByRole("checkbox", { name: "Exempelstad", exact: true }).check();

  // Persists across a reload, not just in-memory state.
  await page.reload({ waitUntil: "networkidle" });
  await expect(page.getByRole("checkbox", { name: "Exempelstad", exact: true })).toBeChecked();

  await page.goto("/projekt");
  await page.getByRole("checkbox", { name: "Visa endast mina och delade projekt" }).check();
  await expect(page.getByText("Nordiskt klimatsamarbete")).toBeVisible();
});

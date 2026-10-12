import { test, expect } from "@playwright/test";
import { cashflow, financingItems, itemCashflow, payoutCurrency, FinancingItem, DEFAULT_ASSUMPTIONS } from "../../lib/matching/cofinancing";
import { findProgram } from "../../lib/data/fundingPrograms";
import { fundingCalls } from "../../lib/data/fundingCalls";
import { seedGrants } from "../../lib/data/grants";
import { projectBank } from "../../lib/data/projectBank";
import { seedApplications } from "../../lib/data/applications";

// Co-financing and liquidity: costs, own financing and the grant spread
// over the project's years, the grant received after an advance and then
// in arrears.

function item(overrides: Partial<FinancingItem> = {}): FinancingItem {
  return {
    id: "x",
    stage: "awarded",
    title_sv: "Test",
    title_en: "Test",
    projectId: null,
    callId: "c",
    programId: "esf",
    management: "shared",
    totalCostSEK: 1000,
    grantSEK: 600,
    ownSEK: 400,
    startYear: 2027,
    endYear: 2029,
    currency: "SEK",
    href: "/",
    ...overrides,
  };
}

test.describe("co-financing cash flow", () => {
  test("shared management: no advance, the grant arrives a year after it is earned", () => {
    const rows = itemCashflow(item());
    expect(rows.map((r) => r.year)).toEqual([2027, 2028, 2029, 2030]);
    expect(rows.map((r) => Math.round(r.grantReceivedSEK))).toEqual([0, 200, 200, 200]);
    expect(rows.map((r) => Math.round(r.exposureSEK))).toEqual([200, 200, 200, 0]);
    expect(rows.map((r) => Math.round(r.ownSEK))).toEqual([133, 133, 133, 0]);
  });

  test("direct management: the advance comes the first year, the rest in arrears", () => {
    const rows = itemCashflow(item({ management: "direct" }));
    expect(rows.map((r) => Math.round(r.grantReceivedSEK))).toEqual([180, 140, 140, 140]);
    expect(rows.map((r) => Math.round(r.exposureSEK))).toEqual([20, 80, 140, 0]);
    const total = rows.reduce((s, r) => s + r.grantReceivedSEK, 0);
    expect(Math.round(total)).toBe(600);
  });

  test("items add up per year, with the peak exposure and the currency effect", () => {
    const result = cashflow([item(), item({ id: "y", management: "direct", currency: "EUR", startYear: 2028, endYear: 2028, grantSEK: 1000, totalCostSEK: 2000, ownSEK: 1000 })]);
    expect(result.years.map((r) => r.year)).toEqual([2027, 2028, 2029, 2030]);
    // 2028: 200 + 1000 earned; 200 + 300 advance received.
    expect(result.years[1].grantReceivedSEK).toBe(500);
    expect(result.peak).toEqual({ year: 2028, sek: 900 });
    expect(result.ownTotalSEK).toBe(1400);
    expect(result.eurGrantSEK).toBe(1000);
    expect(result.fxEffectSEK).toBe(Math.round(1000 * DEFAULT_ASSUMPTIONS.fxShock));
  });

  test("no items gives an empty result", () => {
    const result = cashflow([]);
    expect(result.years).toEqual([]);
    expect(result.peak).toBeNull();
  });

  test("currency: euro for direct-managed programmes and Interreg, kronor for the Swedish structural funds", () => {
    expect(payoutCurrency(findProgram("horizon"), undefined)).toBe("EUR");
    expect(payoutCurrency(findProgram("interreg-baltic-sea"), undefined)).toBe("EUR");
    expect(payoutCurrency(findProgram("esf"), undefined)).toBe("SEK");
  });

  test("the seed data gives the two grants and the application with the funder", () => {
    const items = financingItems({
      projects: projectBank,
      grants: seedGrants,
      records: seedApplications,
      calls: fundingCalls,
      findProgram,
      readBudget: () => ({}),
      now: new Date("2026-10-12"),
    });
    expect(items.map((i) => [i.id, i.stage])).toEqual([
      ["ap-1", "awarded"],
      ["ap-2", "awarded"],
      ["pb-5:interreg-2027-nordic-climate", "pending"],
    ]);
    for (const i of items) {
      expect(i.ownSEK).toBeGreaterThanOrEqual(0);
      expect(i.grantSEK + i.ownSEK).toBe(i.totalCostSEK);
    }
  });
});

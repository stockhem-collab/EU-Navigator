import {
  ApplicationRecord,
  FundingCall,
  FundingProgram,
  Grant,
  ProjectBankEntry,
} from "@/lib/types";
import { ApplicationBudget, resolveApplicationBudget } from "@/lib/matching/applicationBudget";
import { projectBankEntryToProjectInput } from "@/lib/matching/portfolio";

// Co-financing and liquidity across the organisation's grants and the
// applications still with the funder: what the organisation pays itself
// each year, and how much it has paid out in costs the grant will only
// reimburse later. EU grants are mostly paid in arrears, after each
// report, so a municipality carries the grant's share of the costs for a
// while; direct-managed programmes (Horisont, LIFE, Erasmus+ …) usually
// pay part of the grant in advance. The model is deliberately simple and
// shows its assumptions: costs, own financing and the grant spread evenly
// over the project's years; the advance paid the first year; the rest
// paid `paymentLagYears` after the year it was earned.

export type FinancingStage = "awarded" | "pending" | "draft";

export interface FinancingItem {
  id: string;
  stage: FinancingStage;
  title_sv: string;
  title_en: string;
  projectId: string | null;
  callId: string;
  programId: string | null;
  management: FundingProgram["management"] | null;
  totalCostSEK: number;
  grantSEK: number;
  ownSEK: number;
  startYear: number;
  endYear: number;
  /** The currency the funder pays in: euro for direct-managed programmes
   * and Interreg, kronor for the Swedish structural funds. */
  currency: "SEK" | "EUR";
  /** Where the item is followed up in the app. */
  href: string;
}

export interface CashflowAssumptions {
  /** Share of the grant paid in advance, direct-managed programmes (0–1). */
  advanceDirect: number;
  /** Share of the grant paid in advance, shared management (0–1). */
  advanceShared: number;
  /** Years between earning a part of the grant and receiving it. */
  paymentLagYears: number;
  /** The exchange-rate change the currency risk is shown for (0–1). */
  fxShock: number;
}

export const DEFAULT_ASSUMPTIONS: CashflowAssumptions = {
  advanceDirect: 0.3,
  advanceShared: 0,
  paymentLagYears: 1,
  fxShock: 0.05,
};

export interface CashflowYear {
  year: number;
  costSEK: number;
  ownSEK: number;
  /** The grant's share of the year's costs. */
  grantEarnedSEK: number;
  /** Grant money received during the year (advance and payments). */
  grantReceivedSEK: number;
  /** At the end of the year: grant earned but not yet received — what the
   * organisation is out of pocket for. Negative = more received in
   * advance than earned. */
  exposureSEK: number;
}

export interface CashflowResult {
  years: CashflowYear[];
  /** The largest exposure at any year end, and when. Null without items. */
  peak: { year: number; sek: number } | null;
  ownTotalSEK: number;
  grantTotalSEK: number;
  /** The grants paid in euro, and how much `fxShock` changes them in kronor. */
  eurGrantSEK: number;
  fxEffectSEK: number;
}

/** The advance share an item gets under the assumptions. */
export function advanceShare(item: Pick<FinancingItem, "management">, a: CashflowAssumptions): number {
  return item.management === "direct" ? a.advanceDirect : a.advanceShared;
}

/** One item, year by year, from its start until its last payment. */
export function itemCashflow(item: FinancingItem, a: CashflowAssumptions = DEFAULT_ASSUMPTIONS): CashflowYear[] {
  const start = item.startYear;
  const end = Math.max(item.endYear, item.startYear);
  const n = end - start + 1;
  const lag = Math.max(0, Math.round(a.paymentLagYears));
  const advance = item.grantSEK * clamp01(advanceShare(item, a));
  const earnedPerYear = item.grantSEK / n;
  const rows: CashflowYear[] = [];
  let earned = 0;
  let received = 0;
  for (let year = start; year <= end + lag; year++) {
    const active = year <= end;
    const earnedThisYear = active ? earnedPerYear : 0;
    // What was earned `lag` years ago, less its part of the advance.
    const paidFromYear = year - lag;
    const arrears = paidFromYear >= start && paidFromYear <= end ? earnedPerYear * (1 - advance / (item.grantSEK || 1)) : 0;
    const receivedThisYear = (year === start ? advance : 0) + (item.grantSEK > 0 ? arrears : 0);
    earned += earnedThisYear;
    received += receivedThisYear;
    rows.push({
      year,
      costSEK: active ? item.totalCostSEK / n : 0,
      ownSEK: active ? item.ownSEK / n : 0,
      grantEarnedSEK: earnedThisYear,
      grantReceivedSEK: receivedThisYear,
      exposureSEK: earned - received,
    });
  }
  return rows;
}

/** All items together, year by year, rounded to whole kronor. */
export function cashflow(items: FinancingItem[], a: CashflowAssumptions = DEFAULT_ASSUMPTIONS): CashflowResult {
  const byYear = new Map<number, CashflowYear>();
  for (const item of items) {
    for (const row of itemCashflow(item, a)) {
      const acc = byYear.get(row.year) ?? { year: row.year, costSEK: 0, ownSEK: 0, grantEarnedSEK: 0, grantReceivedSEK: 0, exposureSEK: 0 };
      acc.costSEK += row.costSEK;
      acc.ownSEK += row.ownSEK;
      acc.grantEarnedSEK += row.grantEarnedSEK;
      acc.grantReceivedSEK += row.grantReceivedSEK;
      byYear.set(row.year, acc);
    }
  }
  const allYears = [...byYear.keys()];
  const years: CashflowYear[] = [];
  if (allYears.length > 0) {
    // Every year in the span, also one with nothing in it, and the
    // exposure carried over from year to year.
    let exposure = 0;
    for (let year = Math.min(...allYears); year <= Math.max(...allYears); year++) {
      const row = byYear.get(year) ?? { year, costSEK: 0, ownSEK: 0, grantEarnedSEK: 0, grantReceivedSEK: 0, exposureSEK: 0 };
      exposure += row.grantEarnedSEK - row.grantReceivedSEK;
      years.push({
        year,
        costSEK: Math.round(row.costSEK),
        ownSEK: Math.round(row.ownSEK),
        grantEarnedSEK: Math.round(row.grantEarnedSEK),
        grantReceivedSEK: Math.round(row.grantReceivedSEK),
        exposureSEK: Math.round(exposure),
      });
    }
  }
  const peakRow = years.reduce<CashflowYear | null>((best, r) => (!best || r.exposureSEK > best.exposureSEK ? r : best), null);
  const eurGrantSEK = items.filter((i) => i.currency === "EUR").reduce((s, i) => s + i.grantSEK, 0);
  return {
    years,
    peak: peakRow ? { year: peakRow.year, sek: peakRow.exposureSEK } : null,
    ownTotalSEK: Math.round(items.reduce((s, i) => s + i.ownSEK, 0)),
    grantTotalSEK: Math.round(items.reduce((s, i) => s + i.grantSEK, 0)),
    eurGrantSEK: Math.round(eurGrantSEK),
    fxEffectSEK: Math.round(eurGrantSEK * a.fxShock),
  };
}

function clamp01(x: number): number {
  return Number.isFinite(x) ? Math.min(1, Math.max(0, x)) : 0;
}

/** Euro for direct-managed programmes and Interreg, or when the call
 * published its amounts in euro; kronor otherwise. */
export function payoutCurrency(program: FundingProgram | undefined, call: FundingCall | undefined): "SEK" | "EUR" {
  if (call?.originalGrantRange?.currency === "EUR") return "EUR";
  if (!program) return "SEK";
  return program.management === "direct" || program.id.startsWith("interreg") ? "EUR" : "SEK";
}

export interface FinancingSources {
  projects: ProjectBankEntry[];
  grants: Grant[];
  records: ApplicationRecord[];
  calls: FundingCall[];
  findProgram: (id: string) => FundingProgram | undefined;
  /** The amounts an application states (useApplication's readApplicationBudget). */
  readBudget: (applicationId: string) => ApplicationBudget;
  includeDrafts?: boolean;
  now?: Date;
}

/** The grants and the applications still with the funder (and, when asked,
 * drafts) as financing items. One application per project — the most
 * recently changed — so a project applied for twice isn't counted twice;
 * a project with a grant already has its financing settled. */
export function financingItems(src: FinancingSources): FinancingItem[] {
  const thisYear = (src.now ?? new Date()).getFullYear();
  const items: FinancingItem[] = [];
  const projectsWithGrant = new Set<string>();

  for (const grant of src.grants) {
    const entry = grant.projectBankEntryId ? src.projects.find((p) => p.id === grant.projectBankEntryId) : undefined;
    if (entry) projectsWithGrant.add(entry.id);
    const call = src.calls.find((c) => c.id === grant.callId);
    const program = call ? src.findProgram(call.programId) : undefined;
    // Without the application's budget, the grant at the call's funding
    // rate gives the least the project can cost.
    const rate = call?.coFinancingRate ?? program?.typicalCoFinancingRate ?? 1;
    const total =
      grant.plannedBudget?.totalBudgetSEK ??
      Math.max(entry?.estimatedCostSEK ?? 0, Math.round(grant.awardedAmountSEK / (rate > 0 ? rate : 1)));
    items.push({
      id: grant.id,
      stage: "awarded",
      title_sv: grant.title_sv,
      title_en: grant.title_en,
      projectId: entry?.id ?? null,
      callId: grant.callId,
      programId: program?.id ?? null,
      management: program?.management ?? null,
      totalCostSEK: total,
      grantSEK: grant.awardedAmountSEK,
      ownSEK: grant.plannedBudget?.ownFinancingSEK ?? Math.max(0, total - grant.awardedAmountSEK),
      startYear: entry?.periodStart ?? thisYear,
      endYear: entry?.periodEnd ?? thisYear + 2,
      currency: payoutCurrency(program, call),
      href: `/stod/${grant.id}`,
    });
  }

  const wanted = src.includeDrafts ? ["submitted", "under-review", "draft"] : ["submitted", "under-review"];
  const latestPerProject = new Map<string, ApplicationRecord>();
  for (const r of src.records) {
    if (!wanted.includes(r.status) || r.awardedProjectId || projectsWithGrant.has(r.projectId)) continue;
    const prev = latestPerProject.get(r.projectId);
    // Sent beats draft; then the most recently changed.
    const rank = (x: ApplicationRecord) => (x.status === "draft" ? 0 : 1);
    if (!prev || rank(r) > rank(prev) || (rank(r) === rank(prev) && r.updatedAt > prev.updatedAt)) latestPerProject.set(r.projectId, r);
  }
  for (const r of latestPerProject.values()) {
    const entry = src.projects.find((p) => p.id === r.projectId);
    const call = src.calls.find((c) => c.id === r.callId);
    const program = call ? src.findProgram(call.programId) : undefined;
    if (!entry || !call || !program) continue;
    const budget = resolveApplicationBudget(projectBankEntryToProjectInput(entry), { call, program }, src.readBudget(r.id));
    items.push({
      id: r.id,
      stage: r.status === "draft" ? "draft" : "pending",
      title_sv: entry.title_sv,
      title_en: entry.title_en,
      projectId: entry.id,
      callId: call.id,
      programId: program.id,
      management: program.management,
      totalCostSEK: budget.totalBudgetSEK,
      grantSEK: budget.requestedGrantSEK,
      ownSEK: Math.max(0, budget.totalBudgetSEK - budget.requestedGrantSEK),
      startYear: entry.periodStart,
      endYear: entry.periodEnd,
      currency: payoutCurrency(program, call),
      href: `/ansokan?project=${entry.id}&call=${call.id}&application=${encodeURIComponent(r.id)}`,
    });
  }
  return items;
}

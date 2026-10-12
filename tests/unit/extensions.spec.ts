import { test, expect } from "@playwright/test";
import { leadershipView, organisationTypeOf, searchPartners } from "../../lib/imported/server";
import { auditItemsFor } from "../../lib/data/auditChecklist";
import { findProgram } from "../../lib/data/fundingPrograms";
import { fundingCalls, isCallOutdated } from "../../lib/data/fundingCalls";
import { seedGrants } from "../../lib/data/grants";
import type { FundingCall } from "../../lib/types";

// Partner search, the leadership report's municipality comparison, audit
// readiness and outdated calls.

test.describe("partner search", () => {
  test("a Swedish subject finds municipalities through the theme word list, most projects first", () => {
    const result = searchPartners({ q: "klimatanpassning", type: "municipality" });
    expect(result.total).toBeGreaterThan(10);
    const counts = result.organisations.map((o) => o.projectCount);
    expect(counts).toEqual([...counts].sort((a, b) => b - a));
    for (const org of result.organisations) expect(org.type).toBe("municipality");
    // English-language projects too, not only Swedish ones.
    expect(result.organisations.some((o) => o.country !== "SE")).toBe(true);
  });

  test("filters by programme and country, and leaves out the own organisation", () => {
    const result = searchPartners({ program: "interreg-baltic-sea", type: "municipality", own: "Stockholm City" });
    expect(result.total).toBeGreaterThan(0);
    expect(result.organisations.some((o) => o.name === "Stockholm City")).toBe(false);
    for (const org of result.organisations) expect(org.programmes.some((p) => p.key === "interreg-baltic-sea")).toBe(true);
    const finnish = searchPartners({ program: "interreg-baltic-sea", country: "FI" });
    for (const org of finnish.organisations) expect(org.country).toBe("FI");
  });

  test("only coordinators", () => {
    const result = searchPartners({ q: "klimatanpassning", role: "coordinator" });
    for (const org of result.organisations) expect(org.coordinatorCount).toBeGreaterThan(0);
  });

  test("an untyped organisation is a municipality when its name says so", () => {
    expect(organisationTypeOf({ name: "Turun kaupunki", type: null })).toEqual({ type: "municipality", fromName: true });
    expect(organisationTypeOf({ name: "Stadsbyggnadsbyrån AB", type: null })).toEqual({ type: null, fromName: false });
    expect(organisationTypeOf({ name: "Uppsala universitet", type: "university" })).toEqual({ type: "university", fromName: false });
  });
});

test.describe("leadership report", () => {
  test("every compared municipality has a population and a per-inhabitant figure", () => {
    const view = leadershipView();
    expect(view).not.toBeNull();
    expect(view!.peers.length).toBe(11);
    for (const p of view!.peers) {
      expect(p.population).toBeGreaterThan(100_000);
      expect(p.perCapitaSek).toBeCloseTo(p.euContributionSek / p.population!, 5);
      expect(p.byPeriod["2014-2020"].projects + p.byPeriod["2021-2027"].projects).toBe(p.projects);
    }
    expect(view!.peers.filter((p) => p.reference).map((p) => p.name)).toEqual(["Uppsala kommun"]);
  });
});

test.describe("audit readiness", () => {
  const ctxFor = (grantId: string) => {
    const grant = seedGrants.find((g) => g.id === grantId)!;
    const call = fundingCalls.find((c) => c.id === grant.callId);
    return { grant, call, program: call ? findProgram(call.programId) : undefined };
  };

  test("ESF+ asks for participants and structural-fund archiving, not first-level control", () => {
    const ids = auditItemsFor(ctxFor("ap-2")).map((i) => i.id);
    expect(ids).toContain("participants");
    expect(ids).toContain("archiving");
    expect(ids).not.toContain("archiving-direct");
    expect(ids).not.toContain("first-level-control");
  });

  test("Interreg asks for first-level control and a partnership agreement", () => {
    const grant = { ...seedGrants[0], awardedAmountSEK: 1 };
    const ids = auditItemsFor({ grant, call: undefined, program: findProgram("interreg-baltic-sea") }).map((i) => i.id);
    expect(ids).toContain("first-level-control");
    expect(ids).toContain("partnership-agreement");
    expect(ids).not.toContain("participants");
  });
});

test.describe("outdated calls", () => {
  const call = (deadlineDate?: string): FundingCall => ({ ...fundingCalls[0], deadlineDate, deadlineMonthsFromNow: 3 });
  const now = new Date("2026-10-12T12:00:00");

  test("a call is outdated once its deadline day has passed", () => {
    expect(isCallOutdated(call("2026-10-08"), now)).toBe(true);
    expect(isCallOutdated(call("2026-10-12"), now)).toBe(false);
    expect(isCallOutdated(call("2027-03-15"), now)).toBe(false);
  });

  test("a call with only a relative deadline is never outdated", () => {
    expect(isCallOutdated(call(undefined), now)).toBe(false);
  });
});

import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { conceptsInText, projectThemes, termOccurs, searchableText } from "../../lib/imported/themes";
import { amountStats, findSimilar, listReferenceProjects } from "../../lib/imported/server";
import { callsFromList, lastDayOf, parseCallDate, programIdFor } from "../../lib/integrations/calls/callList";
import { parseCsv } from "../../lib/integrations/core/csv";
import { parseEurSekRates } from "../../lib/integrations/core/currency";
import { suggestTags } from "../../lib/matching/tagSuggestions";
import { themesFromCsvTema } from "../../lib/data/fundThemes";
import { scoreMatch } from "../../lib/matching/scoreMatch";
import { findProgram } from "../../lib/data/fundingPrograms";
import { fundingCalls } from "../../lib/data/fundingCalls";
import type { FundingCall, ProjectInput } from "../../lib/types";

const ROOT = path.resolve(__dirname, "../..");

test.describe("theme translation table", () => {
  test("maps each source's own codes onto the app's themes, per programme period", () => {
    const kohesio2014 = projectThemes({ source: "kohesio", period: "2014-2020", category: { code: "117", label: "lifelong learning" } });
    expect(kohesio2014.map((t) => t.sector)).toEqual(["education"]);
    // The same number means something else in 2021–2027 (117 is transport there).
    const kohesio2021 = projectThemes({ source: "kohesio", period: "2021-2027", category: { code: "117", label: null } });
    expect(kohesio2021.map((t) => t.sector)).toEqual(["mobility"]);
    const cordis = projectThemes({ source: "cordis", period: "2021-2027", tags: ["IA", "HORIZON-MISS-2023-CLIMA-01-03"] });
    expect(cordis.map((t) => t.sector)).toEqual(["climate"]);
    expect(cordis[0].code_sv).toBe("CORDIS-ämne HORIZON-MISS-2023-CLIMA-01-03");
    const keep = projectThemes({ source: "keep-eu", period: "2021-2027", tags: ["Energy efficiency"] });
    expect(keep.map((t) => t.sector)).toEqual(["energy"]);
  });

  test("finds the concepts of a Swedish idea and their English terms", () => {
    const ids = conceptsInText("Klimatanpassning mot skyfall och värmeböljor för äldre").map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(["climate-adaptation", "flooding", "heat", "elderly"]));
    expect(termOccurs("flood*", searchableText("Baltic Flood Resilience"))).toBe(true);
    expect(termOccurs("ai", searchableText("Remaining tasks"))).toBe(false);
  });
});

test.describe("imported reference data on the server", () => {
  test("a Swedish idea finds English-language projects, with reasons", () => {
    const result = findSimilar({
      title: "Skyfallsanpassning av stadens grönområden",
      description: "Vi vill anpassa dagvattensystemet och parkerna till kraftigare skyfall.",
      sector: "climate",
      ownOrganisation: { name: "Uppsala kommun" },
    });
    expect(result.similar.length).toBeGreaterThan(0);
    const english = result.similar.filter((s) => s.project.source === "cordis" || s.project.source === "keep-eu");
    expect(english.length).toBeGreaterThan(0);
    for (const s of result.similar) {
      expect(s.reasons.some((r) => r.kind === "keyword")).toBe(true);
    }
    expect(result.partners.every((p) => !/uppsala kommun/i.test(p.name))).toBe(true);
  });

  test("amount benchmarks use programme and theme, and say when there is no basis", () => {
    const horizon = amountStats("horizon", "climate");
    expect(horizon.basis).toBe("program-theme");
    expect(horizon.low).toBeLessThanOrEqual(horizon.median);
    expect(horizon.median).toBeLessThanOrEqual(horizon.high);
    expect(horizon.medianEur).toBeLessThan(horizon.median);
    expect(amountStats("life", "climate").basis).toBe("none");
  });

  test("lists are filtered by source, country and year", () => {
    const list = listReferenceProjects({ source: "kohesio", year: 2023, country: "SE", pageSize: 100 });
    expect(list.total).toBeGreaterThan(0);
    for (const p of list.projects) {
      expect(p.source).toBe("kohesio");
      expect(p.startYear).toBe(2023);
    }
  });
});

test.describe("call list (data/utlysningar.csv)", () => {
  const rates = parseEurSekRates(fs.readFileSync(path.join(ROOT, "data", "vaxelkurs.csv"), "utf8"));
  const records = parseCsv(fs.readFileSync(path.join(ROOT, "data", "utlysningar.csv"), "utf8"), ",");
  const calls = callsFromList(records, { rates, suggestTags, themesFromTema: themesFromCsvTema, now: new Date("2026-10-08T12:00:00") });

  test("lib/data/callList.json is up to date with the CSV (run npm run import:calls)", () => {
    const committed: FundingCall[] = JSON.parse(fs.readFileSync(path.join(ROOT, "lib", "data", "callList.json"), "utf8"));
    const strip = (c: FundingCall) => ({ ...c, deadlineMonthsFromNow: 0 });
    expect(committed.map(strip)).toEqual(calls.map(strip));
    // And the app's call data includes them.
    for (const c of calls) expect(fundingCalls.some((f) => f.id === c.id)).toBe(true);
  });

  test("reads statuses, preliminary dates and euro amounts", () => {
    expect(calls).toHaveLength(records.length);
    const life = calls.find((c) => c.id.startsWith("life-2027-klimatanpassning"))!;
    expect(life.status).toBe("upcoming");
    expect(life.sourceStatus).toBe("expected");
    expect(life.opens).toEqual({ date: "2027-04", preliminary: true });
    expect(life.closes).toEqual({ date: "2027-09", preliminary: true });
    expect(life.deadlineDate).toBe("2027-09-30");
    expect(life.grantRangeStated).toBe(false);
    expect(life.coFinancingRate).toBe(0.6);

    const clima = calls.find((c) => c.id === "horizon-miss-2027-01-clima-01")!;
    expect(clima.programId).toBe("horizon");
    expect(clima.sourceStatus).toBe("upcoming");
    expect(clima.originalGrantRange).toMatchObject({ min: 10_000_000, max: 15_000_000, currency: "EUR", rateYear: 2027 });
    // 2027 has no rate yet: the nearest year (2026) is used.
    expect(clima.maxGrantSEK).toBe(Math.round(15_000_000 * rates[2026]));
    expect(clima.requiresPartnership).toBe(true);
    expect(clima.minPartnerCountries).toBe(3);

    const esf = calls.filter((c) => c.programId === "esf");
    expect(esf.map((c) => c.sourceStatus)).toEqual(["planned", "planned"]);
    expect(calls.filter((c) => c.sourceStatus === "open").every((c) => c.status === "open")).toBe(true);
  });

  test("date and programme helpers", () => {
    expect(parseCallDate("2027-04 (prel.)")).toEqual({ date: "2027-04", preliminary: true });
    expect(parseCallDate("2026-11-17")).toEqual({ date: "2026-11-17", preliminary: false });
    expect(parseCallDate("")).toBeNull();
    expect(lastDayOf({ date: "2028-02", preliminary: true })).toBe("2028-02-29");
    expect(programIdFor("DUT-partnerskapet (Horisont Europa) med Energimyndigheten")).toBe("driving-urban-transitions");
    expect(programIdFor("Socialfonden+ (ESF+)")).toBe("esf");
  });

  test("an upcoming call without a stated grant range is matched, not ruled out on budget", () => {
    const life = calls.find((c) => c.id.startsWith("life-2027-klimatanpassning"))!;
    const project: ProjectInput = {
      title: "Klimatanpassning",
      description: "Naturbaserade lösningar mot skyfall",
      sector: "climate",
      budgetSEK: 20_000_000,
      startYear: 2028,
      endYear: 2030,
      municipality: "Uppsala",
      hasInternationalPartner: false,
    };
    const match = scoreMatch(project, life, findProgram("life")!, undefined, new Date("2026-10-08T12:00:00"));
    expect(match.rationale.some((r) => r.category === "budget" && r.type === "neutral")).toBe(true);
    expect(match.estimatedFundingSEK[1]).toBeGreaterThan(0);
    expect(match.rationale.some((r) => r.category === "sector" && r.type === "positive")).toBe(true);
  });
});

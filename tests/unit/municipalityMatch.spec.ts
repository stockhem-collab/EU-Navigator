import { test, expect } from "@playwright/test";
import {
  GeneratedDataset,
  ImportedFundedProject,
  ImportedOrganisation,
  SourceSystem,
} from "../../lib/integrations/core/types";
import {
  findMunicipalityProjects,
  nameCandidateReason,
  organisationNumberOf,
} from "../../lib/integrations/municipality/match";
import { checkAmount, linkRow, parseChecklist, reconcile } from "../../lib/integrations/municipality/reconcile";
import { peerMunicipalities, uppsalaMatch } from "../../lib/data/municipalities";
import { uppsalaPreset } from "../../lib/data/orgPresets";

// Finding a municipality's projects in the generated source data
// (scripts/import/uppsala-history.ts, peers.ts): sure hits only on
// identifiers, names only as candidates, and the reconciliation with
// data/kontrollista.csv.

const rates = { 2018: 10, 2020: 10, 2023: 11 };

function project(id: string, source: SourceSystem, extra: Partial<ImportedFundedProject> = {}): ImportedFundedProject {
  return {
    id: `${source}:${id}`,
    sourceSystem: source,
    externalProjectId: id,
    programId: null,
    programmeName: "Program",
    period: "2014-2020",
    title: `Projekt ${id}`,
    startDate: "2018-01-01",
    endDate: "2020-12-31",
    totalBudget: null,
    euContribution: { amount: 1000, currency: "EUR" },
    coFinancingRate: null,
    status: null,
    country: "SE",
    sourceUrl: null,
    ...extra,
  };
}

function org(id: string, source: SourceSystem, name: string, extra: Partial<ImportedOrganisation> = {}): ImportedOrganisation {
  return {
    id: `${source}:${id}`,
    sourceSystem: source,
    externalId: id,
    name,
    organisationType: null,
    country: "SE",
    region: null,
    city: null,
    vatNumber: null,
    picNumber: null,
    organisationNumber: null,
    website: null,
    ...extra,
  };
}

function dataset(source: SourceSystem, rows: [ImportedFundedProject, ImportedOrganisation, number?][]): GeneratedDataset {
  return {
    source,
    generatedAt: "",
    projects: rows.map(([p]) => p),
    organisations: rows.map(([, o]) => o),
    partners: rows.map(([p, o, amount]) => ({
      fundedProjectId: p.id,
      organisationId: o.id,
      role: "coordinator",
      sourceRole: "beneficiary",
      sourceName: o.name,
      euContribution: { amount: amount ?? 1000, currency: "EUR" },
      totalCost: null,
      country: "SE",
    })),
  };
}

test.describe("municipality config", () => {
  test("Uppsala's registry numbers come from the org preset", () => {
    expect(uppsalaMatch.orgNumber).toBe(uppsalaPreset.orgNumber);
    expect(uppsalaMatch.vatNumber).toBe(uppsalaPreset.vatNumber);
    expect(uppsalaMatch.pic).toBe(uppsalaPreset.pic);
    expect(uppsalaMatch.unitPics).toBe(uppsalaPreset.units);
    expect(uppsalaMatch.kommunkod).toBe("0380");
    expect(uppsalaMatch.nuts).toBe("SE121");
  });

  test("ten peers with municipal organisationsnummer", () => {
    expect(peerMunicipalities).toHaveLength(10);
    for (const m of peerMunicipalities) expect(m.orgNumber).toMatch(/^212000-\d{4}$/);
  });
});

test.describe("matching", () => {
  test("sure hits on PIC, unit PIC, VAT and organisationsnummer", () => {
    const ds = dataset("cordis", [
      [project("1", "cordis"), org("a", "cordis", "UPPSALA KOMMUN", { picNumber: "951881080" })],
      [project("2", "cordis"), org("b", "cordis", "Kulturskolan", { picNumber: "900828137" })],
      [project("3", "cordis"), org("c", "cordis", "Something", { vatNumber: "SE212000300501" })],
      [project("4", "cordis"), org("d", "cordis", "X", { organisationNumber: "2120003005" })],
    ]);
    const r = findMunicipalityProjects([ds], uppsalaMatch, rates);
    expect(r.projects.map((p) => p.matchedOn)).toEqual(["pic", "pic", "momsnummer", "organisationsnummer"]);
    expect(r.candidates).toHaveLength(0);
  });

  test("names are candidates, never sure hits; excluded organisations are neither", () => {
    const ds = dataset("kohesio", [
      [project("1", "kohesio"), org("a", "kohesio", "Äldreförvaltningen, Uppsala kommun")],
      [project("2", "kohesio"), org("b", "kohesio", "Uppsala Municipality")],
      [project("3", "kohesio"), org("c", "kohesio", "Uppsala Universitet", { organisationNumber: "2021002932" })],
      [project("4", "kohesio"), org("d", "kohesio", "Region Uppsala, Regionkontoret")],
      [project("5", "kohesio"), org("e", "kohesio", "Länsstyrelsen i Uppsala län")],
      [project("6", "kohesio", { title: "Siri- förstudie Uppsala kommun" }), org("f", "kohesio", "Arbetsmarknadsavdelningen")],
    ]);
    const r = findMunicipalityProjects([ds], uppsalaMatch, rates);
    expect(r.projects).toHaveLength(0);
    expect(r.candidates.map((c) => [c.projectId, c.reason])).toEqual([
      ["kohesio:1", "namnvariant"],
      ["kohesio:2", "namnvariant"],
      ["kohesio:6", "projekttitel"],
    ]);
    expect(r.excludedOrganisations.map((e) => e.rule).sort()).toEqual([
      "Länsstyrelsen i Uppsala län",
      "Region Uppsala",
    ]);
  });

  test("Uppsala Stadshus AB is a candidate, not counted", () => {
    const ds = dataset("kohesio", [
      [project("1", "kohesio"), org("a", "kohesio", "Uppsala Stadshus AB", { organisationNumber: "5565000642" })],
      [project("2", "kohesio"), org("b", "kohesio", "Uppsalahem AB")],
    ]);
    const r = findMunicipalityProjects([ds], uppsalaMatch, rates);
    expect(r.projects).toHaveLength(0);
    expect(r.candidates.map((c) => c.reason)).toEqual(["kommunalt bolag", "kommunalt bolag"]);
  });

  test("projects that ended before 2014 are left out of the history", () => {
    const ds = dataset("keep-eu", [
      [project("1", "keep-eu", { startDate: "2010-01-01", endDate: "2013-06-30", period: null }), org("a", "keep-eu", "Uppsala kommun", { organisationNumber: "2120003005" })],
    ]);
    const r = findMunicipalityProjects([ds], uppsalaMatch, rates);
    expect(r.projects).toHaveLength(0);
    expect(r.before2014).toHaveLength(1);
  });

  test("keep.eu national id and name rules", () => {
    expect(organisationNumberOf(org("id-SE-SE 212000-1157", "keep-eu", "City of Helsingborg"))).toBe("2120001157");
    const goteborg = peerMunicipalities.find((m) => m.name === "Göteborgs stad")!;
    expect(nameCandidateReason("City of Gothenburg", goteborg)?.reason).toBe("ortnamn och kommunord");
    expect(nameCandidateReason("Göteborgsregionens kommunalförbund", goteborg)).toBeNull();
    expect(nameCandidateReason("STIFTELSEN GÖTEBORGS KYRKLIGA STADSMISSION", goteborg)).toBeNull();
  });
});

test.describe("reconciliation", () => {
  const header = {
    Projektnamn: "",
    Program: "",
    Period: "",
    Roll: "",
    Belopp: "",
    Källa: "",
    Valuta: "",
    "Vad beloppet avser": "",
    "Förväntas i källa": "",
    Anteckning: "",
  };
  const rows = parseChecklist([
    { ...header, Projektnamn: "Innovationskompetens", Period: "2018-10-01 – 2020-09-30", Belopp: "1000", Valuta: "EUR", "Vad beloppet avser": "EU-bidrag", "Förväntas i källa": "Kohesio", Anteckning: "ESF dnr 2018/00076." },
    { ...header, Projektnamn: "Gottsunda", Källa: "https://www.esf.se/resultat/projektbanken/projekt/?dnr=23-017-S01", Belopp: "15000000", Valuta: "SEK", "Vad beloppet avser": "Kommunens andel, uppskattad", "Förväntas i källa": "Kohesio" },
    { ...header, Projektnamn: "Scale Up", "Förväntas i källa": "Ingen (kaskadfinansiering)" },
    { ...header, Projektnamn: "BASAAR", Period: "2007 – 2013", "Förväntas i källa": "Keep.eu" },
  ]);

  test("identifiers come from Källa and Anteckning", () => {
    expect(rows[0].diarienummer).toBe("2018/00076");
    expect(rows[1].diarienummer).toBe("23-017-S01");
    expect(linkRow(rows[1], project("Q1", "kohesio", { externalIds: { diarienummer: "23-017-S01" }, title: "Annat namn" }))).toBe(
      "diarienummer 23-017-S01",
    );
    expect(linkRow(rows[1], project("Q2", "kohesio", { externalIds: { diarienummer: "25-031-S02" }, title: "Gottsunda" }))).toBeNull();
  });

  test("estimated amounts are not compared", () => {
    expect(checkAmount(rows[1], { amount: 1, currency: "SEK" }, null, rates).status).toBe("jämförs inte");
    expect(checkAmount(rows[0], { amount: 1000, currency: "EUR" }, null, rates).status).toBe("lika");
    expect(checkAmount(rows[0], { amount: 900, currency: "EUR" }, null, rates).status).toBe("avviker");
  });

  test("'Ingen' and pre-2014 rows are reported apart; a dnr-only link is a candidate", () => {
    const ds = dataset("kohesio", [
      [
        project("Q1", "kohesio", { externalIds: { localId: "2018/00076" }, title: "Innovationskompetens" }),
        org("a", "kohesio", "Arbetsmarknadsförvaltningen"),
      ],
    ]);
    const result = findMunicipalityProjects([ds], uppsalaMatch, rates);
    const rec = reconcile(result, rows, [ds], rates, uppsalaMatch.excluded.map((e) => e.pattern));
    expect(rec.notExpected.map((r) => r.name)).toEqual(["Scale Up"]);
    expect(rec.before2014.map((r) => r.name)).toEqual(["BASAAR"]);
    expect(rec.candidates.map((c) => [c.candidate.reason, c.row?.name])).toEqual([
      ["diarienummer i kontrollistan", "Innovationskompetens"],
    ]);
    expect(rec.checklistOnly.map((c) => c.row.name)).toEqual(["Gottsunda"]);
  });
});

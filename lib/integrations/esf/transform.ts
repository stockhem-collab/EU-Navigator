// ESF-rådet's projektbank export → normalised data. The diarienummer is the
// project id. ESF+ projects also appear in Kohesio; a row is merged into the
// Kohesio project (and not written here) when Kohesio's
// Operation_Local_Identifier carries the diarienummer, or otherwise when
// organisationsnummer, project name and start date all match. Projektbanken
// is the source only for projects Kohesio lacks.

import { OrganisationRegistry, SkipCounter, TransformResult } from "../core/build";
import { money } from "../core/currency";
import {
  ImportedFundedProject,
  ImportedOrganisation,
  ImportedProjectPartner,
  ProgrammePeriod,
} from "../core/types";
import {
  clean,
  normaliseCountry,
  normaliseOrganisationNumber,
  parseAmount,
  parseDate,
  parseRate,
  stripHtml,
} from "../core/values";

export type EsfRow = Record<string, string>;

const COL = {
  diarienummer: "Diarienummer / Operation ID",
  beneficiary: "Stödmottagare / Beneficiary",
  orgnr: "Projektägare organisationsnummer / Beneficiary ID",
  city: "Projektägare ort / Beneficiary city",
  country: "Stödmottagarens land / Beneficiary country",
  name: "Namn på insatsen / Operation Name",
  priority: "Programområde / Priority",
  objective: "Specifikt mål / Specific objective concerned",
  intervention: "Interventionsområde / Intervention field",
  total: "Total projektbudget / Total budget SEK",
  rate: "Unionens medfinansieringsgrad / Union co-financing rate",
  eu: "EU-stöd i SEK / EU contribution SEK",
  summary: "Sammanfattning / Summary",
  summaryEn: "Sammanfattning engelsk / Summary in english",
  start: "Startdatum / Start date",
  end: "Slutdatum / End date",
  fund: "EU-fond / EU fund",
  cci: "Program CCI / Program CCI",
} as const;

/** The Kohesio data the merge looks at. */
export interface KohesioIndex {
  projects: ImportedFundedProject[];
  partners: ImportedProjectPartner[];
  organisations: ImportedOrganisation[];
}

export interface EsfMatch {
  diarienummer: string;
  kohesioProjectId: string;
  matchedOn: "diarienummer" | "organisationsnummer+namn+startdatum";
}

function normaliseName(name: string | null): string {
  return (name ?? "").toLowerCase().replace(/[^a-z0-9åäöéü]+/g, " ").trim();
}

function periodFromCci(cci: string | null): ProgrammePeriod | null {
  if (cci?.startsWith("2021")) return "2021-2027";
  if (cci?.startsWith("2014")) return "2014-2020";
  return null;
}

export function transformEsf(
  rows: EsfRow[],
  kohesio: KohesioIndex,
): TransformResult & { matches: EsfMatch[] } {
  const skipped = new SkipCounter();
  const organisations = new OrganisationRegistry();
  const projects: ImportedFundedProject[] = [];
  const partners: ImportedProjectPartner[] = [];
  const matches: EsfMatch[] = [];

  const byDiarienummer = new Map<string, string>();
  for (const p of kohesio.projects) {
    const d = p.externalIds?.diarienummer;
    if (d) byDiarienummer.set(d.toUpperCase(), p.id);
  }
  const orgNumberById = new Map(kohesio.organisations.map((o) => [o.id, o.organisationNumber]));
  const projectById = new Map(kohesio.projects.map((p) => [p.id, p]));
  const byOrgNameStart = new Map<string, string>();
  for (const pp of kohesio.partners) {
    const orgnr = orgNumberById.get(pp.organisationId);
    const p = projectById.get(pp.fundedProjectId);
    if (!orgnr || !p?.startDate) continue;
    for (const title of [p.title, p.titleEn]) {
      if (title) byOrgNameStart.set(`${orgnr}|${normaliseName(title)}|${p.startDate}`, p.id);
    }
  }

  const seen = new Set<string>();
  for (const row of rows) {
    const diarienummer = clean(row[COL.diarienummer])?.toUpperCase() ?? null;
    if (!diarienummer) {
      skipped.add("saknar diarienummer");
      continue;
    }
    if (seen.has(diarienummer)) {
      skipped.add("dubblett");
      continue;
    }
    seen.add(diarienummer);
    const title = clean(row[COL.name]);
    const orgnr = normaliseOrganisationNumber(row[COL.orgnr]);
    const startDate = parseDate(row[COL.start]);

    const byDnr = byDiarienummer.get(diarienummer);
    const byFields =
      !byDnr && orgnr && title && startDate
        ? byOrgNameStart.get(`${orgnr}|${normaliseName(title)}|${startDate}`)
        : undefined;
    if (byDnr || byFields) {
      matches.push({
        diarienummer,
        kohesioProjectId: (byDnr ?? byFields)!,
        matchedOn: byDnr ? "diarienummer" : "organisationsnummer+namn+startdatum",
      });
      skipped.add("finns i Kohesio (slås ihop där)");
      continue;
    }
    if (!title) {
      skipped.add("saknar namn");
      continue;
    }

    const projectId = `esf:${diarienummer}`;
    const country = normaliseCountry(row[COL.country]);
    const total = money(parseAmount(row[COL.total]), "SEK");
    const eu = money(parseAmount(row[COL.eu]), "SEK");
    const cci = clean(row[COL.cci]);
    projects.push({
      id: projectId,
      sourceSystem: "esf",
      externalProjectId: diarienummer,
      externalIds: { diarienummer },
      programId: "esf",
      programmeName: clean(row[COL.fund]) ?? "ESF+",
      programmeCode: cci,
      period: periodFromCci(cci),
      title,
      description: stripHtml(row[COL.summary]),
      descriptionEn: stripHtml(row[COL.summaryEn]),
      startDate,
      endDate: parseDate(row[COL.end]),
      totalBudget: total,
      euContribution: eu,
      coFinancingRate: parseRate(row[COL.rate]),
      status: null,
      country,
      sourceUrl: null,
      tags: [
        clean(row[COL.priority]) && `Programområde ${clean(row[COL.priority])}`,
        clean(row[COL.objective]) && `Specifikt mål ${clean(row[COL.objective])}`,
        clean(row[COL.intervention]) && `Interventionsområde ${clean(row[COL.intervention])}`,
      ].filter((t): t is string => !!t),
    });

    const name = clean(row[COL.beneficiary]);
    if (!name) {
      skipped.add("stödmottagare saknas (projektet skrivet utan partner)");
      continue;
    }
    const externalId = orgnr ? `orgnr-${orgnr}` : `name-${normaliseName(name).replace(/ /g, "-")}`;
    const org = organisations.add({
      id: `esf:${externalId}`,
      sourceSystem: "esf",
      externalId,
      name,
      sourceNames: [name],
      organisationType: null,
      sourceOrganisationType: null,
      country,
      region: null,
      city: clean(row[COL.city]),
      vatNumber: null,
      picNumber: null,
      organisationNumber: orgnr,
      website: null,
    });
    partners.push({
      fundedProjectId: projectId,
      organisationId: org.id,
      role: "coordinator",
      sourceRole: "Stödmottagare",
      sourceName: name,
      euContribution: eu,
      totalCost: total,
      country,
    });
  }

  return { projects, organisations: organisations.values(), partners, skipped: skipped.counts, matches };
}

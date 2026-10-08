// keep.eu (Interreg) search export → normalised data. The workbook has one
// sheet of projects and one of partners; they join on programme + project
// id (2021-2027) or programme + acronym (earlier periods, where the id
// column is empty). Selection: projects in 2014-2020 or 2021-2027 with at
// least one Swedish partner (earlier periods are out of scope, like BUUF).

import { OrganisationRegistry, SkipCounter, stableHash, TransformResult } from "../core/build";
import { money } from "../core/currency";
import {
  ImportedFundedProject,
  ImportedOrganisation,
  ImportedProjectPartner,
  OrganisationType,
  PartnerRole,
  ProgrammePeriod,
} from "../core/types";
import {
  clean,
  normaliseCountry,
  normaliseOrganisationNumber,
  normalisePic,
  parseAmount,
  parseDate,
  parseRate,
} from "../core/values";

export type KeepRow = Record<string, unknown>;

const PERIODS: ProgrammePeriod[] = ["2014-2020", "2021-2027"];

const ORGANISATION_TYPES: Record<string, OrganisationType> = {
  "Higher education and research organisations": "university",
  "Local public authority": "municipality",
  "Regional public authority": "region",
  "National public authority": "national-authority",
  SME: "sme",
  "Enterprise, except SME": "large-enterprise",
  "Interest groups including NGOs": "ngo",
};

const PROGRAMMES: [RegExp, string][] = [
  [/Baltic Sea Region/i, "interreg-baltic-sea"],
  [/Central Baltic/i, "interreg-central-baltic"],
  [/North Sea/i, "interreg-north-sea"],
  [/Interreg (V|VI)?\s*-?\s*C?\s*Europe$|INTERREG EUROPE/i, "interreg-europe"],
  [/URBACT/i, "urbact"],
];

export function keepProgramId(programme: string): string | null {
  return PROGRAMMES.find(([re]) => re.test(programme))?.[1] ?? null;
}

/** Lead partner "Yes" is the coordinator; the export has no separate
 * associated-partner flag. */
export function keepRole(leadPartner: unknown): PartnerRole {
  return clean(leadPartner)?.toLowerCase() === "yes" ? "coordinator" : "partner";
}

/** Join keys shared by both sheets: programme + project id (2021-2027)
 * and programme + acronym. Either can be missing on one sheet, so a
 * partner row is indexed under both and a project looks up its id key
 * first. */
export function keepProjectKeys(row: KeepRow): { byId: string | null; byAcronym: string | null } {
  const programme = clean(row["Programme"]);
  const id = clean(row["Project ID (2021-2027 only)"]);
  const acronym = clean(row["Project acronym"]);
  return {
    byId: programme && id ? `${programme}|id|${id}` : null,
    byAcronym: programme && acronym ? `${programme}|acronym|${acronym}` : null,
  };
}

const PARTNER_ID_IF_NOT_PIC = "Partner’s ID if not PIC";

/** PIC when there is one, otherwise a Swedish organisationsnummer from the
 * "ID if not PIC" column, otherwise that id as given, otherwise the name. */
function partnerOrganisation(row: KeepRow): ImportedOrganisation | null {
  const name =
    clean(row["Organisation in English"]) ??
    clean(row["Organisation in language 2"]) ??
    clean(row["Organisation in language 3"]) ??
    clean(row["Organisation in language 4"]);
  if (!name) return null;
  const country = normaliseCountry(row["Country code"]);
  const pic = normalisePic(row["Participant Identification Code"]);
  const otherId = clean(row[PARTNER_ID_IF_NOT_PIC]);
  const organisationNumber = country === "SE" ? normaliseOrganisationNumber(otherId) : null;
  const externalId = pic
    ? `pic-${pic}`
    : organisationNumber
      ? `orgnr-${organisationNumber}`
      : otherId
        ? `id-${country ?? "xx"}-${otherId}`
        : `name-${stableHash(`${name.toLowerCase()}|${country}`)}`;
  const sourceType = clean(row["Type of Organisation"]);
  return {
    id: `keep-eu:${externalId}`,
    sourceSystem: "keep-eu",
    externalId,
    name,
    sourceNames: [name],
    organisationType: sourceType ? (ORGANISATION_TYPES[sourceType] ?? null) : null,
    sourceOrganisationType: sourceType,
    country,
    region: clean(row["NUTS3 code (or equivalent)"]) ?? clean(row["NUTS2 code (or equivalent)"]),
    city: clean(row["Town"]),
    vatNumber: null,
    picNumber: pic,
    organisationNumber,
    website: clean(row["Website"]),
  };
}

export function transformKeepEu(projectRows: KeepRow[], partnerRows: KeepRow[]): TransformResult {
  const skipped = new SkipCounter();
  const organisations = new OrganisationRegistry();
  const projects: ImportedFundedProject[] = [];
  const partners: ImportedProjectPartner[] = [];

  const partnersByKey = new Map<string, number[]>();
  partnerRows.forEach((row, index) => {
    const { byId, byAcronym } = keepProjectKeys(row);
    if (!byId && !byAcronym) {
      skipped.add("partnerrad utan projektnyckel");
      return;
    }
    for (const key of [byId, byAcronym]) {
      if (!key) continue;
      const list = partnersByKey.get(key) ?? [];
      list.push(index);
      partnersByKey.set(key, list);
    }
  });

  const used = new Set<string>();
  const usedPartnerRows = new Set<number>();
  for (const row of projectRows) {
    const { byId, byAcronym } = keepProjectKeys(row);
    const key = byId ?? byAcronym;
    if (!key) {
      skipped.add("projekt utan id eller akronym");
      continue;
    }
    const periodText = clean(row["Period"]);
    if (!PERIODS.includes(periodText as ProgrammePeriod)) {
      skipped.add(periodText === "Other" ? "period Other" : "period före 2014");
      continue;
    }
    if (used.has(key)) {
      skipped.add("dubblett");
      continue;
    }
    const partnerIndexes =
      (byId && partnersByKey.get(byId)) || (byAcronym && partnersByKey.get(byAcronym)) || [];
    const rows = partnerIndexes.map((i) => partnerRows[i]);
    if (!rows.some((p) => normaliseCountry(p["Country code"]) === "SE")) {
      skipped.add(rows.length === 0 ? "inga partnerrader (kan inte avgöra svensk partner)" : "ingen svensk partner");
      continue;
    }
    const title =
      clean(row["Project name in English"]) ??
      clean(row["Project name in language 2"]) ??
      clean(row["Project name in language 3"]) ??
      clean(row["Project name in language 4"]) ??
      clean(row["Project acronym"]);
    if (!title) {
      skipped.add("saknar namn");
      continue;
    }
    used.add(key);
    for (const i of partnerIndexes) usedPartnerRows.add(i);

    const programme = clean(row["Programme"]) ?? "";
    const projectId = `keep-eu:${stableHash(key)}`;
    const lead = rows.find((p) => keepRole(p["Lead partner"]) === "coordinator");
    projects.push({
      id: projectId,
      sourceSystem: "keep-eu",
      externalProjectId: clean(row["Project ID (2021-2027 only)"]) ?? clean(row["Project acronym"]) ?? key,
      programId: keepProgramId(programme),
      programmeName: programme,
      period: periodText as ProgrammePeriod,
      title,
      acronym: clean(row["Project acronym"]),
      description: clean(row["Description in English"]) ?? clean(row["Description in language 2"]),
      expectedResults: clean(row["Expected Achievements in English"]),
      actualResults: clean(row["Actual Achievements in English"]),
      startDate: parseDate(row["Project start"]),
      endDate: parseDate(row["Project end"]),
      totalBudget: money(parseAmount(row["Project's total budget / expenditure"]), "EUR"),
      euContribution: money(parseAmount(row["Project's EU funding"]), "EUR"),
      coFinancingRate: parseRate(row["Union co-financing rate"]),
      status: null,
      country: lead ? normaliseCountry(lead["Country code"]) : null,
      sourceUrl: clean(row["Website"]),
      tags: [clean(row["Theme 1"]), clean(row["Theme 2"]), clean(row["Theme 3"])].filter(
        (t): t is string => !!t,
      ),
    });

    for (const p of rows) {
      const org = partnerOrganisation(p);
      if (!org) {
        skipped.add("partnerrad utan organisationsnamn");
        continue;
      }
      const registered = organisations.add(org);
      const eu =
        parseAmount(p["Partner's programme co-financing (EUR) (2021-2027 only)"]) ??
        parseAmount(p["ERDF contribution (2014-2020 only)"]);
      partners.push({
        fundedProjectId: projectId,
        organisationId: registered.id,
        role: keepRole(p["Lead partner"]),
        sourceRole: `Lead partner: ${clean(p["Lead partner"]) ?? "?"}`,
        sourceName: org.name,
        euContribution: money(eu, "EUR"),
        totalCost: money(parseAmount(p["Partner's total eligible budget / expenditure"]), "EUR"),
        country: org.country,
      });
    }
  }

  skipped.add("partnerrader för projekt utanför urvalet", partnerRows.length - usedPartnerRows.size);

  return { projects, organisations: organisations.values(), partners, skipped: skipped.counts };
}

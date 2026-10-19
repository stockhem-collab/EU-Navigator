// Tillväxtverket's projektbank (projektbank.tillvaxtverket.se, tab
// "EU-program 2021-2027", "Ladda ner excel") → normalised data. One row per
// project with its beneficiary and organisationsnummer: the regional fund
// (ERUF), the Just Transition Fund (FRO), and the home affairs funds AMIF,
// BMVI and ISF.
//
// Left out, since other sources already have them:
// - Interreg (goal "EU ETC": Aurora, Öresund-Kattegat-Skagerrak,
//   Sverige-Norge), which keep.eu has with every partner;
// - projects Kohesio has: Kohesio's Operation_Local_Identifier is
//   "<CCI>_<Ärende-ID>" for ERUF and FRO.
//
// The amount is "Nettobeviljat belopp SEK", the grant after any reductions.
// The 2014–2020 tab has no organisationsnummer and is not read; Kohesio has
// that period.

import { OrganisationRegistry, SkipCounter, TransformResult } from "../core/build";
import { money } from "../core/currency";
import { ImportedFundedProject, ImportedProjectPartner, ProgrammePeriod } from "../core/types";
import { clean, normaliseOrganisationNumber, parseAmount, parseDate, parseRate } from "../core/values";

export type TillvaxtverketRow = Record<string, unknown>;

/** Headers are "Svenska/ English"; matched on the Swedish part. */
export const TVV_COL = {
  id: "Ärende-ID",
  beneficiary: "Stödmottagare",
  web: "Hemsida",
  name: "Projektnamn",
  summary: "Projektbeskrivning",
  start: "Startdatum",
  end: "Slutdatum",
  postalCode: "Stödmottagare Postnr",
  countryCode: "Stödmottagare land kod",
  intervention: "Interventionsområde",
  fund: "EU-fond",
  objective: "Specifikt mål",
  goal: "Mål",
  programme: "Program",
  priority: "Prioritering",
  euSek: "Nettobeviljat belopp SEK",
  totalSek: "Total kostnad SEK",
  rate: "Andel (%) EU-finansiering för projektet",
  orgnr: "Organisationsnummer",
  cci: "CCI nummer",
} as const;

/** "Ärende-ID/ Project ID" → "Ärende-ID". */
export function swedishHeader(header: string): string {
  return header.split("/")[0].trim();
}

/** Programme ids in lib/data/fundingPrograms.ts, by EU-fond. */
const FUND_PROGRAM_IDS: Record<string, string> = { ERUF: "erdf", AMIF: "amif" };

const FUND_NAMES: Record<string, string> = {
  ERUF: "Europeiska regionala utvecklingsfonden",
  FRO: "Fonden för en rättvis omställning",
  AMIF: "Asyl-, migrations- och integrationsfonden",
  BMVI: "Instrumentet för gränsförvaltning och viseringspolitik",
  ISF: "Fonden för inre säkerhet",
};

function value(row: TillvaxtverketRow, col: string): string | null {
  const text = clean(row[col]);
  return text && !/^(uppgift saknas|n\/a)$/i.test(text) ? text : null;
}

function periodFromCci(cci: string | null): ProgrammePeriod | null {
  if (cci?.startsWith("2021")) return "2021-2027";
  if (cci?.startsWith("2014")) return "2014-2020";
  return null;
}

/** Ärende-IDs Kohesio has, from its Operation_Local_Identifier values. */
export function kohesioCaseIds(localIds: (string | undefined)[]): Set<string> {
  const ids = new Set<string>();
  for (const id of localIds) {
    const m = id?.match(/^\d{4}SE\w+_(\d+)$/);
    if (m) ids.add(m[1]);
  }
  return ids;
}

export function transformTillvaxtverket(rows: TillvaxtverketRow[], inKohesio: Set<string>): TransformResult {
  const skipped = new SkipCounter();
  const organisations = new OrganisationRegistry();
  const projects: ImportedFundedProject[] = [];
  const partners: ImportedProjectPartner[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const caseId = value(row, TVV_COL.id);
    if (!caseId || !/^\d+$/.test(caseId)) {
      skipped.add("saknar ärende-id (summarad)");
      continue;
    }
    if (seen.has(caseId)) {
      skipped.add("dubblett");
      continue;
    }
    seen.add(caseId);
    if (value(row, TVV_COL.goal) === "EU ETC") {
      skipped.add("Interreg (finns i keep.eu)");
      continue;
    }
    if (inKohesio.has(caseId)) {
      skipped.add("finns i Kohesio");
      continue;
    }
    const title = value(row, TVV_COL.name);
    if (!title) {
      skipped.add("saknar namn");
      continue;
    }

    const fund = value(row, TVV_COL.fund) ?? "";
    const cci = value(row, TVV_COL.cci);
    const eu = money(parseAmount(row[TVV_COL.euSek]), "SEK");
    const total = money(parseAmount(row[TVV_COL.totalSek]), "SEK");
    const country = value(row, TVV_COL.countryCode) ?? "SE";
    const id = `tillvaxtverket:${caseId}`;
    const programme = value(row, TVV_COL.programme);
    projects.push({
      id,
      sourceSystem: "tillvaxtverket",
      externalProjectId: caseId,
      externalIds: { arendeId: caseId },
      programId: FUND_PROGRAM_IDS[fund] ?? null,
      programmeName: FUND_NAMES[fund] ?? (fund || programme || ""),
      programmeCode: cci,
      period: periodFromCci(cci),
      title,
      description: value(row, TVV_COL.summary),
      startDate: parseDate(row[TVV_COL.start]),
      endDate: parseDate(row[TVV_COL.end]),
      totalBudget: total,
      euContribution: eu,
      coFinancingRate: parseRate(row[TVV_COL.rate]),
      status: null,
      country,
      sourceUrl: null,
      tags: [
        programme && `Program ${programme}`,
        value(row, TVV_COL.objective),
        value(row, TVV_COL.intervention) && `Interventionsområde ${value(row, TVV_COL.intervention)}`,
      ].filter((t): t is string => !!t),
    });

    const name = value(row, TVV_COL.beneficiary);
    if (!name) {
      skipped.add("stödmottagare saknas (projektet skrivet utan partner)");
      continue;
    }
    const orgnr = normaliseOrganisationNumber(row[TVV_COL.orgnr]);
    const externalId = orgnr ? `orgnr-${orgnr}` : `name-${name.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-")}`;
    const org = organisations.add({
      id: `tillvaxtverket:${externalId}`,
      sourceSystem: "tillvaxtverket",
      externalId,
      name,
      sourceNames: [name],
      organisationType: null,
      sourceOrganisationType: null,
      country,
      region: null,
      city: null,
      vatNumber: null,
      picNumber: null,
      organisationNumber: orgnr,
      website: value(row, TVV_COL.web),
    });
    partners.push({
      fundedProjectId: id,
      organisationId: org.id,
      role: "coordinator",
      sourceRole: "Stödmottagare",
      sourceName: name,
      euContribution: eu,
      totalCost: total,
      country,
    });
  }

  return { projects, organisations: organisations.values(), partners, skipped: skipped.counts };
}

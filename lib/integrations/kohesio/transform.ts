// Kohesio (cohesion policy projects) CSV export → normalised data.
// One row per project and one beneficiary per row, so the beneficiary is
// the project's coordinator. The same organisation can appear under several
// beneficiary names; the source's name and Beneficiary_Unique_Identifier are
// kept as-is so they can be merged later.

import { OrganisationRegistry, SkipCounter, TransformResult } from "../core/build";
import { money } from "../core/currency";
import {
  ImportedFundedProject,
  ImportedProjectPartner,
  ProgrammePeriod,
} from "../core/types";
import {
  clean,
  normaliseOrganisationNumber,
  parseAmount,
  parseDate,
  parseRate,
} from "../core/values";

export type KohesioRow = Record<string, string>;

const FUND_PROGRAM_IDS: Record<string, string> = {
  ERDF: "erdf",
  ESF: "esf",
  "ESF+": "esf",
};

/** ESF+ operations are numbered "<CCI>_<diarienummer>", e.g.
 * "2021SE05SFPR001_22-002-S01". */
export function diarienummerFromLocalId(localId: string | null): string | null {
  const m = localId?.match(/_(\d{2}-\d{3}-S\d+)$/i);
  return m ? m[1].toUpperCase() : null;
}

/** "https://linkedopendata.eu/entity/Q2661109" → "Q2661109". */
export function entityId(uri: string | null): string | null {
  const m = uri?.match(/(Q\d+)\s*$/);
  return m ? m[1] : null;
}

function period(value: string | null): ProgrammePeriod | null {
  return value === "2014-2020" || value === "2021-2027" ? value : null;
}

export function transformKohesio(rows: KohesioRow[]): TransformResult {
  const skipped = new SkipCounter();
  const organisations = new OrganisationRegistry();
  const projects: ImportedFundedProject[] = [];
  const partners: ImportedProjectPartner[] = [];
  const seen = new Set<string>();

  for (const row of rows) {
    const operationId = entityId(clean(row.Operation_Unique_Identifier));
    if (!operationId) {
      skipped.add("saknar Operation_Unique_Identifier");
      continue;
    }
    if (clean(row.Country) !== "Sweden" && clean(row.CountryCode) !== "SE") {
      skipped.add("inte Sverige");
      continue;
    }
    if (seen.has(operationId)) {
      skipped.add("dubblett");
      continue;
    }
    const title = clean(row.Operation_Name_Programme_Language) ?? clean(row.Operation_Name_English);
    if (!title) {
      skipped.add("saknar namn");
      continue;
    }
    seen.add(operationId);

    const currency = clean(row.Total_Eligible_Expenditure_Currency) === "SEK" ? "SEK" : "EUR";
    const localId = clean(row.Operation_Local_Identifier);
    const diarienummer = diarienummerFromLocalId(localId);
    const fundCode = clean(row.Fund_Code);
    const projectId = `kohesio:${operationId}`;
    const euContribution = money(parseAmount(row.Project_EU_Budget), currency);

    const externalIds: Record<string, string> = {};
    if (localId) externalIds.localId = localId;
    if (diarienummer) externalIds.diarienummer = diarienummer;

    projects.push({
      id: projectId,
      sourceSystem: "kohesio",
      externalProjectId: operationId,
      externalIds,
      programId: fundCode ? (FUND_PROGRAM_IDS[fundCode] ?? null) : null,
      programmeName: clean(row.Programme_Name) ?? clean(row.Fund_Name) ?? "",
      programmeCode: clean(row.Programme_Code),
      period: period(clean(row.Programming_Period)),
      title,
      titleEn: clean(row.Operation_Name_English),
      description: clean(row.Operation_Summary_Programme_Language),
      descriptionEn: clean(row.Operation_Summary_English),
      startDate: parseDate(row.Operation_Start_Date),
      endDate: parseDate(row.Operation_End_Date),
      totalBudget: money(parseAmount(row.Total_Eligible_Expenditure_amount), currency),
      euContribution,
      coFinancingRate: parseRate(row.Cofinancing_Rate),
      status: null,
      country: "SE",
      sourceUrl: `https://kohesio.ec.europa.eu/en/projects/${operationId}`,
      tags: [fundCode, clean(row.Policy_Objective_Label), clean(row.Category_Label)].filter(
        (t): t is string => !!t,
      ),
      interventionCategory: interventionCategory(row.Category_Of_Intervention, row.Category_Label),
    });

    const beneficiaryName = clean(row.Beneficiary_Name);
    const organisationNumber = normaliseOrganisationNumber(row.Beneficiary_Local_Identifier);
    const beneficiaryId =
      entityId(clean(row.Beneficiary_Unique_Identifier)) ??
      (organisationNumber ? `orgnr-${organisationNumber}` : null);
    if (!beneficiaryName || !beneficiaryId) {
      skipped.add("stödmottagare saknas (projektet skrivet utan partner)");
      continue;
    }
    const org = organisations.add({
      id: `kohesio:${beneficiaryId}`,
      sourceSystem: "kohesio",
      externalId: beneficiaryId,
      name: beneficiaryName,
      sourceNames: [beneficiaryName],
      organisationType: null,
      sourceOrganisationType: null,
      country: "SE",
      region: null,
      city: null,
      vatNumber: null,
      picNumber: null,
      organisationNumber,
      website: null,
    });
    partners.push({
      fundedProjectId: projectId,
      organisationId: org.id,
      role: "coordinator",
      sourceRole: "beneficiary",
      sourceName: beneficiaryName,
      euContribution,
      totalCost: money(parseAmount(row.Total_Eligible_Expenditure_amount), currency),
      country: "SE",
    });
  }

  return { projects, organisations: organisations.values(), partners, skipped: skipped.counts };
}

/** "117.0" → "117"; Kohesio writes the category code as a float. */
function interventionCategory(code: string | undefined, label: string | undefined) {
  const c = clean(code)?.replace(/\.0+$/, "");
  return c ? { code: c, label: clean(label) } : null;
}

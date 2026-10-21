// Vinnova's open data (data.vinnova.se/api/projekt and /api/program) →
// normalised data. Vinnova is Sweden's innovation agency, so these are
// national grants, not EU funding: the grant ("BeviljatBidrag", SEK) goes in
// euContribution only because that is the dataset's grant field, and every
// view that sums EU funding leaves the source out. The API names only the
// coordinating organisation, with no organisationsnummer and no other
// partners, so each project has one partner row and organisations are keyed
// by name. Projects that ended before 2014 are left out, as in the EU
// sources' history.

import { OrganisationRegistry, SkipCounter, stableHash, TransformResult } from "../core/build";
import {
  FundedProjectStatus,
  ImportedFundedProject,
  ImportedProjectPartner,
  ProgrammePeriod,
} from "../core/types";
import { clean, parseDate } from "../core/values";

/** One project as the API returns it. */
export interface VinnovaProject {
  Diarienummer: string;
  Ärenderubrik?: string | null;
  ÄrenderubrikEngelska?: string | null;
  DiarienummerProgram?: string | null;
  MalSvenska?: string | null;
  ResultatSvenska?: string | null;
  MalEngelska?: string | null;
  ResultatEngelska?: string | null;
  /** "planerat" (texts from the start) or "genomfört" (from the final report). */
  Projektreferat?: string | null;
  BeviljatBidrag?: number | null;
  ProjektStart?: string | null;
  ProjektSlut?: string | null;
  KoordinatorOrg?: string | null;
  /** The coordinator's department or unit. */
  KoordinatorArb?: string | null;
  /** "Beslutat" until the final report is in, then "Avslutat". */
  Status?: string | null;
}

export interface VinnovaProgram {
  Diarienummer: string;
  Titel?: string | null;
}

export const VINNOVA_FROM = "2014-01-01";

/** The API marks a missing English text with "x" or a blank. */
function text(value: string | null | undefined): string | null {
  const t = clean(value)?.replace(/\s+/g, " ");
  return t && t.toLowerCase() !== "x" ? t : null;
}

function periodOf(start: string | null): ProgrammePeriod | null {
  if (!start || start < VINNOVA_FROM) return null;
  return start < "2021-01-01" ? "2014-2020" : "2021-2027";
}

function statusOf(status: string | null | undefined): FundedProjectStatus | null {
  if (status === "Avslutat") return "closed";
  if (status === "Beslutat") return "ongoing";
  return null;
}

/** Same organisation whatever the case or spacing ("STOCKHOLMS KOMMUN"). */
export function organisationKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, " ").trim();
}

/** Vinnova's project pages have no stable address by diarienummer; the
 * site search finds the project from it. */
export function vinnovaUrl(diarienummer: string): string {
  return `https://www.vinnova.se/sok/?q=${encodeURIComponent(diarienummer)}`;
}

export function transformVinnova(rows: VinnovaProject[], programs: VinnovaProgram[]): TransformResult {
  const skipped = new SkipCounter();
  const organisations = new OrganisationRegistry();
  const projects: ImportedFundedProject[] = [];
  const partners: ImportedProjectPartner[] = [];
  const programName = new Map(programs.map((p) => [p.Diarienummer, text(p.Titel)]));
  const seen = new Set<string>();

  for (const row of rows) {
    const dnr = clean(row.Diarienummer);
    if (!dnr) {
      skipped.add("saknar diarienummer");
      continue;
    }
    if (seen.has(dnr)) {
      skipped.add("dubblett");
      continue;
    }
    seen.add(dnr);
    const title = text(row.Ärenderubrik);
    if (!title) {
      skipped.add("saknar rubrik");
      continue;
    }
    const startDate = parseDate(row.ProjektStart);
    const endDate = parseDate(row.ProjektSlut);
    if ((endDate ?? startDate) && (endDate ?? startDate)! < VINNOVA_FROM) {
      skipped.add("slutade före 2014");
      continue;
    }

    const id = `vinnova:${dnr}`;
    const grant = typeof row.BeviljatBidrag === "number" && row.BeviljatBidrag > 0
      ? { amount: row.BeviljatBidrag, currency: "SEK" as const }
      : null;
    const final = row.Projektreferat === "genomfört";
    const programmeCode = clean(row.DiarienummerProgram);
    projects.push({
      id,
      sourceSystem: "vinnova",
      externalProjectId: dnr,
      externalIds: { diarienummer: dnr },
      programId: null,
      programmeName: programmeCode && programName.get(programmeCode) ? `Vinnova – ${programName.get(programmeCode)}` : "Vinnova",
      programmeCode,
      period: periodOf(startDate),
      title,
      titleEn: text(row.ÄrenderubrikEngelska),
      description: text(row.MalSvenska),
      descriptionEn: text(row.MalEngelska),
      actualResults: final ? text(row.ResultatSvenska) : null,
      expectedResults: final ? null : text(row.ResultatSvenska),
      startDate,
      endDate,
      totalBudget: null,
      euContribution: grant,
      coFinancingRate: null,
      status: statusOf(row.Status),
      country: "SE",
      sourceUrl: vinnovaUrl(dnr),
    });

    const name = text(row.KoordinatorOrg);
    if (!name) {
      skipped.add("saknar koordinator (projektet skrivet utan organisation)");
      continue;
    }
    const org = organisations.add({
      id: `vinnova:${stableHash(organisationKey(name))}`,
      sourceSystem: "vinnova",
      externalId: organisationKey(name),
      name,
      organisationType: null,
      sourceOrganisationType: null,
      country: "SE",
      region: null,
      city: null,
      vatNumber: null,
      picNumber: null,
      organisationNumber: null,
      website: null,
    });
    const unit = text(row.KoordinatorArb);
    partners.push({
      fundedProjectId: id,
      organisationId: org.id,
      role: "coordinator",
      sourceRole: "Koordinator",
      sourceName: unit && organisationKey(unit) !== organisationKey(name) ? `${name} (${unit})` : name,
      euContribution: grant,
      totalCost: null,
      country: "SE",
    });
  }

  return { projects, organisations: organisations.values(), partners, skipped: skipped.counts };
}

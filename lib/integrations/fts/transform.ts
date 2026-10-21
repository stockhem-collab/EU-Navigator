// EU Financial Transparency System (FTS) yearly datasets → normalised data.
// FTS lists what the Commission itself commits (direct and indirect
// management): LIFE, CEF, Digital Europe, Creative Europe, CERV, Europe
// Direct, WiFi4EU … with the beneficiary's momsnummer. Rows are read only
// for beneficiaries in Sweden and only for action grants (no procurement,
// prizes or expert fees). Horizon 2020, Horizon Europe and Euratom are left
// out because CORDIS already has them, and Erasmus+ because the Erasmus+
// project lists (lib/integrations/erasmus) have every action of it.
//
// One project per legal commitment (LC); a commitment can run over several
// budget lines and years, and the beneficiary's amount is the sum of its
// rows. FTS gives each beneficiary's share, sometimes estimated or put on
// the coordinator only; the project's EU contribution here is the sum of
// the Swedish beneficiaries' shares, not the whole grant.

import { OrganisationRegistry, SkipCounter, TransformResult } from "../core/build";
import { money } from "../core/currency";
import { ImportedFundedProject, ImportedProjectPartner, Money, ProgrammePeriod } from "../core/types";
import { clean, normaliseOrganisationNumber, parseAmount, parseDate } from "../core/values";

export type FtsRow = Record<string, unknown>;

export const FTS_COL = {
  year: "Year",
  lc: "Reference of the Legal Commitment (LC)",
  name: "Name of beneficiary",
  vat: "VAT number of beneficiary",
  coordinator: "Coordinator",
  city: "City",
  country: "Beneficiary country",
  amount: "Beneficiary’s contracted amount (EUR)",
  projectId: "Project ID",
  acronym: "Project Acronym",
  subject: "Subject of grant or contract",
  department: "Responsible department",
  programme: "Programme name",
  start: "Project start date",
  end: "Project end date",
  contractType: "Type of contract*",
} as const;

/** FTS writes "N/A - Not applicable" (and similar) for missing values. */
function value(v: unknown): string | null {
  const text = clean(v);
  return text && !/^N\/?A\b/i.test(text) ? text : null;
}

const LEFT_OUT = /Horizon 2020|Horizon Europe|Euratom/i;
const ERASMUS = /Erasmus\+|Lifelong learning/i;

/** The app's programme id and a readable programme name. FTS names budget
 * headings ("2.0.4 - Fisheries governance …"), not programmes, so the
 * subject and the managing department decide where the heading is shared. */
export function ftsProgramme(heading: string, subject: string): { programId: string | null; programmeName: string } {
  const h = heading.replace(/^[\w.]+ - /, "").trim();
  if (/^WIFI4EU/i.test(subject)) return { programId: null, programmeName: "WiFi4EU" };
  if (/EUROP[EÉ] DIRECT|\bEDIC\b/i.test(subject)) return { programId: null, programmeName: "Europe Direct" };
  if (/\bLIFE\b|^LIFE|\bLIFE\d{2}|Environment and Climate Action/i.test(`${heading} ${subject}`)) {
    return { programId: "life", programmeName: "LIFE" };
  }
  if (/Connecting Europe Facility/i.test(heading) || /^Transport$|^Information and Communications Technology/i.test(h)) {
    return { programId: "cef", programmeName: "Connecting Europe Facility (CEF)" };
  }
  if (/Digital Europe/i.test(heading)) return { programId: "digital-europe", programmeName: "Digital Europe" };
  if (/Erasmus\+|Lifelong learning/i.test(heading)) return { programId: "erasmus", programmeName: "Erasmus+" };
  if (/Creative Europe/i.test(heading)) return { programId: "kreativa-europa", programmeName: "Creative Europe" };
  if (/Rights and Values|Citizens, Equality, Rights/i.test(heading)) return { programId: "cerv", programmeName: "CERV" };
  if (/TWINNED TOWNS|REMEMBRANCE|CIVIL SOCIETY PROJECTS/i.test(subject)) {
    return { programId: null, programmeName: "Europa för medborgarna" };
  }
  if (/Asylum, Migration|AMIF/i.test(`${heading} ${subject}`)) return { programId: "amif", programmeName: "AMIF" };
  if (/Maritime|Fisheries/i.test(heading)) return { programId: "havs-fiskeri", programmeName: h };
  return { programId: null, programmeName: h };
}

function periodOf(year: number | null): ProgrammePeriod | null {
  if (year === null) return null;
  return year >= 2021 ? "2021-2027" : year >= 2014 ? "2014-2020" : null;
}

function addMoney(a: Money | null, eur: number): Money | null {
  return money((a?.amount ?? 0) + eur, "EUR");
}

export function transformFts(rows: FtsRow[]): TransformResult {
  const skipped = new SkipCounter();
  const organisations = new OrganisationRegistry();
  const projects = new Map<string, ImportedFundedProject>();
  const partners = new Map<string, ImportedProjectPartner>();

  for (const row of rows) {
    if (value(row[FTS_COL.country]) !== "Sweden") {
      skipped.add("stödmottagare utanför Sverige");
      continue;
    }
    if (value(row[FTS_COL.contractType]) !== "Action Grant") {
      skipped.add("inte ett projektbidrag (upphandling, pris, ersättning)");
      continue;
    }
    const heading = value(row[FTS_COL.programme]) ?? "";
    if (LEFT_OUT.test(heading)) {
      skipped.add("Horisont/Euratom (finns i CORDIS)");
      continue;
    }
    if (ERASMUS.test(heading)) {
      skipped.add("Erasmus+ (finns i Erasmus+-projektlistorna)");
      continue;
    }
    const lc = value(row[FTS_COL.lc]);
    const name = value(row[FTS_COL.name]);
    if (!lc || !name) {
      skipped.add("saknar åtagande eller stödmottagare");
      continue;
    }
    const subject = value(row[FTS_COL.subject]) ?? lc;
    const year = Number(row[FTS_COL.year]) || null;
    const id = `fts:${lc}`;
    let project = projects.get(id);
    if (!project) {
      const { programId, programmeName } = ftsProgramme(heading, subject);
      const projectId = value(row[FTS_COL.projectId]);
      project = {
        id,
        sourceSystem: "fts",
        externalProjectId: lc,
        externalIds: projectId ? { lc, projectId } : { lc },
        programId,
        programmeName,
        programmeCode: heading,
        period: periodOf(year),
        title: subject,
        acronym: value(row[FTS_COL.acronym]),
        startDate: parseDate(row[FTS_COL.start]),
        endDate: parseDate(row[FTS_COL.end]),
        totalBudget: null,
        euContribution: null,
        coFinancingRate: null,
        status: null,
        country: "SE",
        sourceUrl: null,
        tags: [value(row[FTS_COL.department])].filter((t): t is string => !!t),
      };
      projects.set(id, project);
    }

    // FTS names are "SVENSKT NAMN*ENGLISH NAME"; keep the first.
    const displayName = name.split("*")[0].trim() || name;
    const vat = value(row[FTS_COL.vat])?.replace(/\s/g, "").toUpperCase() ?? null;
    const orgnr = vat?.startsWith("SE") ? normaliseOrganisationNumber(vat.slice(2, 12)) : null;
    const externalId = vat ? `vat-${vat}` : `name-${displayName.toLowerCase().replace(/[^a-z0-9åäö]+/g, "-")}`;
    const org = organisations.add({
      id: `fts:${externalId}`,
      sourceSystem: "fts",
      externalId,
      name: displayName,
      sourceNames: [name],
      organisationType: null,
      country: "SE",
      region: null,
      city: value(row[FTS_COL.city]),
      vatNumber: vat,
      picNumber: null,
      organisationNumber: orgnr,
      website: null,
    });
    const eur = parseAmount(row[FTS_COL.amount]) ?? 0;
    const key = `${id}|${org.id}`;
    const coordinator = value(row[FTS_COL.coordinator]) === "Yes";
    const partner = partners.get(key);
    if (partner) {
      partner.euContribution = addMoney(partner.euContribution, eur);
      if (coordinator) partner.role = "coordinator";
    } else {
      partners.set(key, {
        fundedProjectId: id,
        organisationId: org.id,
        role: coordinator ? "coordinator" : "partner",
        sourceRole: coordinator ? "Coordinator" : "Beneficiary",
        sourceName: name,
        euContribution: money(eur, "EUR"),
        totalCost: null,
        country: "SE",
      });
    }
    project.euContribution = addMoney(project.euContribution, eur);
  }

  return {
    projects: [...projects.values()],
    organisations: organisations.values(),
    partners: [...partners.values()],
    skipped: skipped.counts,
  };
}

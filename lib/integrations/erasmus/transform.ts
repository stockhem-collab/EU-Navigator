// Erasmus+ "Projects Overview" exports (erasmus-plus.ec.europa.eu/projects,
// one CSV per key action and call year) → normalised data. Each row is a
// project with its coordinator and up to 100 partners (name, type,
// address, country); there is no PIC or organisationsnummer. Only the
// Swedish participants are kept, and a municipality's organisationsnummer
// is set where MunicipalRegister recognises it (see municipal.ts).
//
// The grant is the whole project's, as awarded. It is put on the
// coordinator: in mobility projects (KA1, most of the data) the applicant
// is the only beneficiary; in partnerships it is an upper bound, since the
// export does not say how the grant is shared. Partners get no amount.
// Accreditations carry no grant and are left out.

import { OrganisationRegistry, SkipCounter, TransformResult } from "../core/build";
import { money } from "../core/currency";
import { FundedProjectStatus, ImportedFundedProject, ImportedProjectPartner, ProgrammePeriod } from "../core/types";
import { clean, parseAmount } from "../core/values";
import { MunicipalRegister } from "./municipal";

export type ErasmusRow = Record<string, string>;

export const ERASMUS_COL = {
  keyAction: "Key Action",
  actionType: "Action Type",
  year: "Call year",
  id: "Project Identifier",
  title: "Project Title",
  /** "Project or Accreditation Status" in the KA1 2014 file. */
  status: ["Project Status", "Project or Accreditation Status"],
  card: "Results Platform Project Card",
  coordinator: { name: "Coordinating organisation name", type: "Coordinating organisation type", address: "Coordinator's address", country: "Coordinator's country" },
  partner: (n: number) => ({
    name: `Partner ${n} name`,
    type: `Partner ${n} organisation type`,
    address: `Partner ${n} address`,
    country: `Partner ${n} country`,
  }),
} as const;

/** The grant column's header is a long sentence starting like this. */
export const ERASMUS_GRANT_PREFIX = "EU Grant award in euros";

/** Every organisation in a row: the coordinator, then partners 1, 2 … */
export function participants(row: ErasmusRow): { role: "coordinator" | "partner"; name: string; type: string; address: string; country: string }[] {
  const out = [];
  const cols: { name: string; type: string; address: string; country: string }[] = [ERASMUS_COL.coordinator];
  for (let n = 1; `Partner ${n} name` in row; n++) cols.push(ERASMUS_COL.partner(n));
  for (const [i, c] of cols.entries()) {
    const name = clean(row[c.name]);
    if (!name) continue;
    out.push({
      role: i === 0 ? ("coordinator" as const) : ("partner" as const),
      name,
      type: clean(row[c.type]) ?? "",
      address: clean(row[c.address]) ?? "",
      country: clean(row[c.country]) ?? "",
    });
  }
  return out;
}

function periodOf(year: number | null): ProgrammePeriod | null {
  if (year === null) return null;
  return year >= 2021 ? "2021-2027" : year >= 2014 ? "2014-2020" : null;
}

function statusOf(text: string | null): FundedProjectStatus | null {
  if (!text) return null;
  if (/finali[sz]ed|closed/i.test(text)) return "closed";
  if (/ongoing/i.test(text)) return "ongoing";
  return null;
}

function slug(text: string): string {
  return text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "");
}

/** The town at the end of an address ("…, 753 12, Uppsala"). */
function townOf(address: string): string | null {
  const parts = address.split(",").map((p) => p.trim()).filter(Boolean);
  const last = parts[parts.length - 1];
  return last && !/^\d/.test(last) ? last : null;
}

export function transformErasmus(rows: ErasmusRow[], register: MunicipalRegister): TransformResult {
  const skipped = new SkipCounter();
  const organisations = new OrganisationRegistry();
  const projects = new Map<string, ImportedFundedProject>();
  const partners: ImportedProjectPartner[] = [];

  for (const row of rows) {
    const swedish = participants(row).filter((o) => o.country === "SE");
    if (swedish.length === 0) {
      skipped.add("ingen svensk deltagare");
      continue;
    }
    const actionType = clean(row[ERASMUS_COL.actionType]) ?? "";
    if (/accreditation/i.test(actionType)) {
      skipped.add("ackreditering (inget bidrag)");
      continue;
    }
    const externalId = clean(row[ERASMUS_COL.id]);
    if (!externalId) {
      skipped.add("saknar projektnummer");
      continue;
    }
    const id = `erasmus:${externalId}`;
    if (projects.has(id)) {
      skipped.add("samma projekt i flera filer");
      continue;
    }
    const year = Number(row[ERASMUS_COL.year]) || null;
    const grantKey = Object.keys(row).find((k) => k.startsWith(ERASMUS_GRANT_PREFIX));
    const grant = grantKey ? parseAmount(row[grantKey]) : null;
    const status = ERASMUS_COL.status.map((c) => clean(row[c])).find(Boolean) ?? null;
    const keyAction = clean(row[ERASMUS_COL.keyAction]);
    projects.set(id, {
      id,
      sourceSystem: "erasmus",
      externalProjectId: externalId,
      programId: "erasmus",
      programmeName: "Erasmus+",
      programmeCode: [keyAction, actionType].filter(Boolean).join(" – "),
      period: periodOf(year),
      title: clean(row[ERASMUS_COL.title]) ?? externalId,
      // The export gives only the call year.
      startDate: year ? `${year}-01-01` : null,
      endDate: null,
      totalBudget: null,
      euContribution: grant !== null ? money(grant, "EUR") : null,
      coFinancingRate: null,
      status: statusOf(status),
      country: clean(row[ERASMUS_COL.coordinator.country]),
      sourceUrl: clean(row[ERASMUS_COL.card]),
      tags: [actionType].filter(Boolean),
    });

    for (const o of swedish) {
      const town = townOf(o.address);
      const municipal = register.match(o);
      const org = organisations.add({
        id: `erasmus:${slug(o.name)}${town ? `|${slug(town)}` : ""}`,
        sourceSystem: "erasmus",
        externalId: `${o.name}${town ? `, ${town}` : ""}`,
        name: o.name,
        sourceNames: [o.name],
        organisationType: null,
        sourceOrganisationType: o.type || null,
        country: "SE",
        region: null,
        city: town,
        vatNumber: null,
        picNumber: null,
        organisationNumber: municipal?.orgNumber ?? null,
        organisationNumberSource: municipal?.how ?? null,
        website: null,
      });
      const coordinator = o.role === "coordinator";
      partners.push({
        fundedProjectId: id,
        organisationId: org.id,
        role: o.role,
        sourceRole: coordinator ? "Coordinator" : "Partner",
        sourceName: o.name,
        euContribution: coordinator && grant !== null ? money(grant, "EUR") : null,
        totalCost: null,
        country: "SE",
      });
    }
  }

  return {
    projects: [...projects.values()],
    organisations: organisations.values(),
    partners,
    skipped: skipped.counts,
  };
}

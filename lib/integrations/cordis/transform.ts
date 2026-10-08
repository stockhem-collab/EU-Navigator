// CORDIS (H2020 and Horizon Europe) project.csv + organization.csv →
// normalised data. Selection: projects with at least one Swedish
// participant, plus every project in the EU Mission on climate-neutral and
// smart cities (topics HORIZON-MISS-…-CIT-…, including the joint
// CLIMA-CITIES and CIT-CANCER topics). The PIC is in
// organisationID.

import { OrganisationRegistry, SkipCounter, TransformResult } from "../core/build";
import { money } from "../core/currency";
import {
  FundedProjectStatus,
  ImportedFundedProject,
  ImportedProjectPartner,
  OrganisationType,
  PartnerRole,
} from "../core/types";
import {
  clean,
  normaliseCountry,
  normaliseOrganisationNumber,
  normalisePic,
  parseAmount,
  parseDate,
} from "../core/values";

export type CordisRow = Record<string, string>;
export type Framework = "H2020" | "HORIZON";

const ROLES: Record<string, PartnerRole> = {
  coordinator: "coordinator",
  participant: "partner",
  partner: "partner",
  thirdParty: "partner",
  internationalPartner: "partner",
  associatedPartner: "associated-partner",
};

export function cordisRole(role: string | null): PartnerRole | null {
  return role ? (ROLES[role] ?? null) : null;
}

const STATUSES: Record<string, FundedProjectStatus> = {
  SIGNED: "signed",
  CLOSED: "closed",
  TERMINATED: "terminated",
};

/** HES = higher education, REC = research organisation, PRC = private
 * company (split on the SME flag). PUB and OTH don't say which kind of
 * public body or other organisation, so they stay unset. */
export function cordisOrganisationType(activityType: string | null, sme: string | null): OrganisationType | null {
  switch (activityType) {
    case "HES":
      return "university";
    case "REC":
      return "research-institute";
    case "PRC":
      return sme === "true" ? "sme" : sme === "false" ? "large-enterprise" : null;
    default:
      return null;
  }
}

/** Text fields where the export's quoting broke (see core/csv.ts) keep
 * doubled quotes; collapse them. */
export function cordisText(value: string | undefined): string | null {
  const text = clean(value);
  return text ? clean(text.replace(/""/g, '"').replace(/^"|"$/g, "")) : null;
}

export function isCitiesMission(topics: string | null): boolean {
  return /HORIZON-MISS-[\w-]*?-CIT(IES)?(-|$)/i.test(topics ?? "");
}

export function transformCordis(
  framework: Framework,
  projectRows: CordisRow[],
  organisationRows: CordisRow[],
  organisations = new OrganisationRegistry(),
): TransformResult {
  const skipped = new SkipCounter();
  const projects: ImportedFundedProject[] = [];
  const partners: ImportedProjectPartner[] = [];

  const orgsByProject = new Map<string, CordisRow[]>();
  for (const row of organisationRows) {
    const list = orgsByProject.get(row.projectID) ?? [];
    list.push(row);
    orgsByProject.set(row.projectID, list);
  }

  const selected = new Set<string>();
  for (const row of projectRows) {
    const id = clean(row.id);
    if (!id) {
      skipped.add("projekt utan id");
      continue;
    }
    const orgRows = orgsByProject.get(id) ?? [];
    const swedish = orgRows.some((o) => normaliseCountry(o.country) === "SE");
    const mission = isCitiesMission(row.topics);
    if (!swedish && !mission) {
      skipped.add("ingen svensk deltagare och inte klimatneutrala städer");
      continue;
    }
    if (selected.has(id)) {
      skipped.add("dubblett");
      continue;
    }
    selected.add(id);

    const projectId = `cordis:${id}`;
    const total = parseAmount(row.totalCost);
    const eu = parseAmount(row.ecMaxContribution);
    const coordinator = orgRows.find((o) => o.role === "coordinator");
    const tags = [clean(row.fundingScheme), clean(row.topics)].filter((t): t is string => !!t);
    if (mission) tags.push("eu-mission:climate-neutral-smart-cities");

    projects.push({
      id: projectId,
      sourceSystem: "cordis",
      externalProjectId: id,
      programId: framework === "H2020" ? "horizon2020" : "horizon",
      programmeName: framework === "H2020" ? "Horizon 2020" : "Horizon Europe",
      programmeCode: clean(row.legalBasis),
      period: framework === "H2020" ? "2014-2020" : "2021-2027",
      title: cordisText(row.title) ?? clean(row.acronym) ?? id,
      acronym: clean(row.acronym),
      description: cordisText(row.objective),
      startDate: parseDate(row.startDate),
      endDate: parseDate(row.endDate),
      totalBudget: money(total, "EUR"),
      euContribution: money(eu, "EUR"),
      coFinancingRate: total && eu !== null ? Math.min(1, Math.round((eu / total) * 10000) / 10000) : null,
      status: STATUSES[row.status] ?? null,
      country: coordinator ? normaliseCountry(coordinator.country) : null,
      sourceUrl: `https://cordis.europa.eu/project/id/${id}`,
      tags,
    });

    for (const o of orgRows) {
      const pic = normalisePic(o.organisationID);
      const name = clean(o.name);
      if (!pic || !name) {
        skipped.add("deltagarrad utan PIC eller namn");
        continue;
      }
      const role = cordisRole(clean(o.role));
      if (!role) {
        skipped.add(`okänd roll ${o.role}`);
        continue;
      }
      const country = normaliseCountry(o.country);
      const vat = clean(o.vatNumber);
      const org = organisations.add({
        id: `cordis:${pic}`,
        sourceSystem: "cordis",
        externalId: pic,
        name,
        sourceNames: [name],
        organisationType: cordisOrganisationType(clean(o.activityType), clean(o.SME)),
        sourceOrganisationType: [clean(o.activityType), o.SME === "true" ? "SME" : null]
          .filter(Boolean)
          .join(" ") || null,
        country,
        region: clean(o.nutsCode),
        city: clean(o.city),
        vatNumber: vat,
        picNumber: pic,
        organisationNumber: country === "SE" ? normaliseOrganisationNumber(vat) : null,
        website: clean(o.organizationURL),
      });
      partners.push({
        fundedProjectId: projectId,
        organisationId: org.id,
        role,
        sourceRole: o.role,
        sourceName: name,
        euContribution: money(parseAmount(o.ecContribution), "EUR"),
        totalCost: money(parseAmount(o.totalCost), "EUR"),
        country,
      });
    }
  }

  let outside = 0;
  for (const [id, rows] of orgsByProject) if (!selected.has(id)) outside += rows.length;
  skipped.add("deltagarrader för projekt utanför urvalet", outside);

  return { projects, organisations: organisations.values(), partners, skipped: skipped.counts };
}

// Finds one municipality's projects in the generated source data
// (lib/data/generated/<källa>.json). A project is a sure hit only when one
// of its partners carries the municipality's PIC, momsnummer or
// organisationsnummer. Names never make a sure hit: an organisation written
// like the municipality, or a project title naming it, makes the project a
// candidate for manual review. Organisations on the exclusion list (the
// university, the region …) are never candidates, and projects that ended
// before 2014 are left out.

import { convert, EurSekRates } from "../core/currency";
import {
  GeneratedDataset,
  ImportedFundedProject,
  ImportedOrganisation,
  ImportedProjectPartner,
  Money,
  SourceSystem,
} from "../core/types";
import { normaliseOrganisationNumber } from "../core/values";
import type { MunicipalityMatchConfig } from "../../data/municipalities";

/** Projects that ended before this date are not part of the history. */
export const HISTORY_FROM = "2014-01-01";

export type SureMatchKey = "pic" | "momsnummer" | "organisationsnummer";
const KEY_ORDER: SureMatchKey[] = ["pic", "momsnummer", "organisationsnummer"];

export type CandidateReason =
  | "namnvariant"
  | "ortnamn och kommunord"
  | "projekttitel"
  | "kommunalt bolag"
  | "diarienummer i kontrollistan";

export interface MatchedPartner {
  organisationId: string;
  sourceName: string;
  role: string;
  sourceRole: string;
  euContribution: Money | null;
}

export interface HistoryProject {
  id: string;
  sourceSystem: SourceSystem;
  externalProjectId: string;
  externalIds?: Record<string, string>;
  acronym: string | null;
  title: string;
  programId: string | null;
  programmeName: string;
  period: string | null;
  startDate: string | null;
  endDate: string | null;
  /** How the municipality was identified, e.g. "pic 951881080". */
  matchedOn: SureMatchKey;
  matchedValue: string;
  partners: MatchedPartner[];
  /** The municipality's own share: the sum of its partner rows (Kohesio and
   * ESF have one beneficiary, so this is the project's EU contribution). */
  euContribution: Money | null;
  /** Same, in EUR at the start year's average rate. */
  euContributionEur: number | null;
  projectEuContribution: Money | null;
  projectTotalBudget: Money | null;
  sourceUrl: string | null;
}

export interface Candidate {
  projectId: string;
  sourceSystem: SourceSystem;
  title: string;
  acronym: string | null;
  programmeName: string;
  period: string | null;
  startDate: string | null;
  endDate: string | null;
  organisationName: string | null;
  organisationNumber: string | null;
  reason: CandidateReason;
  detail: string;
  euContribution: Money | null;
  euContributionEur: number | null;
  sourceUrl: string | null;
}

export interface ExcludedOrganisation {
  sourceSystem: SourceSystem;
  name: string;
  rule: string;
  projects: number;
}

export interface MunicipalityResult {
  projects: HistoryProject[];
  candidates: Candidate[];
  excludedOrganisations: ExcludedOrganisation[];
  /** Sure hits left out because they ended before HISTORY_FROM. */
  before2014: HistoryProject[];
}

export interface Identifiers {
  orgNumber: string;
  vat: string | null;
  pics: Map<string, string>;
}

export function identifiersOf(config: MunicipalityMatchConfig): Identifiers {
  const orgNumber = normaliseOrganisationNumber(config.orgNumber);
  if (!orgNumber) throw new Error(`Bad organisationsnummer for ${config.name}`);
  const pics = new Map<string, string>();
  if (config.pic) pics.set(config.pic, config.name);
  for (const unit of config.unitPics) pics.set(unit.pic, unit.name);
  return { orgNumber, vat: config.vatNumber?.toUpperCase().replace(/\s/g, "") ?? null, pics };
}

/** The organisationsnummer an organisation record carries, in its own
 * field, its VAT number, or a keep.eu "Partner's ID if not PIC" id such as
 * "id-SE-SE 212000-1157". */
export function organisationNumberOf(org: ImportedOrganisation): string | null {
  const own = org.organisationNumber ?? normaliseOrganisationNumber(org.vatNumber);
  if (own) return own;
  const m = org.externalId.match(/^id-SE-(?:SE)?\s*([\d\s-]+)$/i);
  return m ? normaliseOrganisationNumber(m[1]) : null;
}

export function sureMatch(
  org: ImportedOrganisation,
  ids: Identifiers,
): { key: SureMatchKey; value: string } | null {
  if (org.picNumber && ids.pics.has(org.picNumber)) return { key: "pic", value: org.picNumber };
  const vat = org.vatNumber?.toUpperCase().replace(/\s/g, "") ?? null;
  if (vat && ids.vat && vat === ids.vat) return { key: "momsnummer", value: vat };
  const orgNumber = organisationNumberOf(org);
  if (orgNumber && orgNumber === ids.orgNumber) {
    return { key: "organisationsnummer", value: orgNumber };
  }
  return null;
}

/** Lower case, accents kept, punctuation to single spaces. */
export function normaliseName(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}&]+/gu, " ")
    .trim();
}

function containsWord(haystack: string, word: string): boolean {
  return ` ${haystack} `.includes(` ${normaliseName(word)} `);
}

const MUNICIPAL_WORD =
  /(^| )(kommun|kommunen|stad|staden|stads|municipality|municipal|city|council)( |$)|förvaltning|forvaltning|stadsdel/;

/** Why an organisation name looks like the municipality, or null. Names on
 * the exclusion list return null. */
export function nameCandidateReason(
  name: string,
  config: MunicipalityMatchConfig,
): { reason: CandidateReason; detail: string } | null {
  if (config.excluded.some((e) => e.pattern.test(name))) return null;
  const norm = normaliseName(name);
  const company = config.companies;
  if (company) {
    const hit = [company.name, ...company.subsidiaries].find((n) => norm.includes(normaliseName(n)));
    if (hit) return { reason: "kommunalt bolag", detail: `liknar ${hit}` };
  }
  if (config.nameVariants.some((v) => normaliseName(v) === norm)) {
    return { reason: "namnvariant", detail: name };
  }
  const place = config.placeNames.find((p) => containsWord(norm, p));
  if (place && MUNICIPAL_WORD.test(norm)) {
    if (/(^| )(ab|aktiebolag)( |$)/.test(norm)) return { reason: "kommunalt bolag", detail: name };
    return { reason: "ortnamn och kommunord", detail: name };
  }
  return null;
}

/** "Uppsala kommun", "Stockholms stad" … in a project title. */
function titleNamesMunicipality(title: string, config: MunicipalityMatchConfig): boolean {
  const norm = normaliseName(title);
  return config.placeNames.some((p) =>
    ["kommun", "stad", "municipality"].some((w) => norm.includes(`${normaliseName(p)} ${w}`)),
  );
}

export function endedBefore2014(p: ImportedFundedProject): boolean {
  const end = p.endDate ?? (p.period ? null : p.startDate);
  return !!end && end < HISTORY_FROM;
}

export function addMoney(a: Money | null, b: Money | null): Money | null {
  if (!a) return b;
  if (!b) return a;
  if (a.currency !== b.currency) throw new Error("Cannot add EUR and SEK");
  return { amount: a.amount + b.amount, currency: a.currency };
}

export function toEur(m: Money | null, startDate: string | null, rates: EurSekRates): number | null {
  if (!m) return null;
  const year = startDate ? Number(startDate.slice(0, 4)) : new Date().getUTCFullYear();
  return convert(m, "EUR", year, rates).amount;
}

function round2(n: number | null): number | null {
  return n === null ? null : Math.round(n * 100) / 100;
}

export function findMunicipalityProjects(
  datasets: GeneratedDataset[],
  config: MunicipalityMatchConfig,
  rates: EurSekRates,
): MunicipalityResult {
  const ids = identifiersOf(config);
  const companyOrgNumber = config.companies
    ? normaliseOrganisationNumber(config.companies.orgNumber)
    : null;
  const sure = new Map<string, HistoryProject>();
  const candidates = new Map<string, Candidate>();
  const excluded = new Map<string, ExcludedOrganisation>();

  for (const ds of datasets) {
    const projects = new Map(ds.projects.map((p) => [p.id, p]));
    const orgs = new Map(ds.organisations.map((o) => [o.id, o]));
    const partnersByProject = new Map<string, ImportedProjectPartner[]>();
    for (const pp of ds.partners) {
      const list = partnersByProject.get(pp.fundedProjectId) ?? [];
      list.push(pp);
      partnersByProject.set(pp.fundedProjectId, list);
    }

    const candidate = (
      p: ImportedFundedProject,
      org: ImportedOrganisation | null,
      pp: ImportedProjectPartner | null,
      reason: CandidateReason,
      detail: string,
    ) => {
      if (candidates.has(p.id)) return;
      const eu = pp?.euContribution ?? (org ? null : p.euContribution);
      candidates.set(p.id, {
        projectId: p.id,
        sourceSystem: p.sourceSystem,
        title: p.title,
        acronym: p.acronym ?? null,
        programmeName: p.programmeName,
        period: p.period,
        startDate: p.startDate,
        endDate: p.endDate,
        organisationName: pp?.sourceName ?? org?.name ?? null,
        organisationNumber: org ? organisationNumberOf(org) : null,
        reason,
        detail,
        euContribution: eu,
        euContributionEur: round2(toEur(eu, p.startDate, rates)),
        sourceUrl: p.sourceUrl,
      });
    };

    for (const [projectId, list] of partnersByProject) {
      const p = projects.get(projectId);
      if (!p) continue;
      const hits: { pp: ImportedProjectPartner; key: SureMatchKey; value: string }[] = [];
      for (const pp of list) {
        const org = orgs.get(pp.organisationId);
        if (!org) continue;
        const m = sureMatch(org, ids);
        if (m) hits.push({ pp, ...m });
      }
      if (hits.length > 0) {
        const eu = hits.reduce<Money | null>((sum, h) => addMoney(sum, h.pp.euContribution), null);
        // PIC first, then momsnummer, then organisationsnummer.
        const best = [...hits].sort((a, b) => KEY_ORDER.indexOf(a.key) - KEY_ORDER.indexOf(b.key))[0];
        sure.set(p.id, {
          id: p.id,
          sourceSystem: p.sourceSystem,
          externalProjectId: p.externalProjectId,
          ...(p.externalIds && Object.keys(p.externalIds).length ? { externalIds: p.externalIds } : {}),
          acronym: p.acronym ?? null,
          title: p.title,
          programId: p.programId,
          programmeName: p.programmeName,
          period: p.period,
          startDate: p.startDate,
          endDate: p.endDate,
          matchedOn: best.key,
          matchedValue: best.value,
          partners: hits.map((h) => ({
            organisationId: h.pp.organisationId,
            sourceName: h.pp.sourceName,
            role: h.pp.role,
            sourceRole: h.pp.sourceRole,
            euContribution: h.pp.euContribution,
          })),
          euContribution: eu,
          euContributionEur: round2(toEur(eu, p.startDate, rates)),
          projectEuContribution: p.euContribution,
          projectTotalBudget: p.totalBudget,
          sourceUrl: p.sourceUrl,
        });
        continue;
      }
      if (endedBefore2014(p)) continue;
      for (const pp of list) {
        const org = orgs.get(pp.organisationId);
        if (!org) continue;
        const orgNumber = organisationNumberOf(org);
        if (companyOrgNumber && orgNumber === companyOrgNumber) {
          candidate(p, org, pp, "kommunalt bolag", `${config.companies!.name} (organisationsnummer)`);
          break;
        }
        // An organisation with another organisationsnummer is someone else,
        // whatever its name (e.g. a foundation named after the city).
        if (orgNumber && orgNumber !== ids.orgNumber && !orgNumber.startsWith("556")) continue;
        for (const name of new Set([pp.sourceName, org.name, ...(org.sourceNames ?? [])])) {
          const rule = config.excluded.find((e) => e.pattern.test(name));
          if (rule && config.placeNames.some((pl) => containsWord(normaliseName(name), pl))) {
            const key = `${ds.source}|${org.id}`;
            const ex = excluded.get(key) ?? { sourceSystem: ds.source, name, rule: rule.name, projects: 0 };
            ex.projects++;
            excluded.set(key, ex);
            break;
          }
          const why = nameCandidateReason(name, config);
          if (why) {
            candidate(p, org, pp, why.reason, why.detail);
            break;
          }
        }
      }
      if (!candidates.has(p.id) && titleNamesMunicipality(p.title, config)) {
        const lead = list.find((pp) => pp.role === "coordinator") ?? list[0];
        const leadOrg = lead ? orgs.get(lead.organisationId) ?? null : null;
        const leadExcluded = leadOrg && config.excluded.some((e) => e.pattern.test(leadOrg.name));
        if (!leadExcluded) candidate(p, leadOrg, lead ?? null, "projekttitel", p.title);
      }
    }
  }

  const all = [...sure.values()];
  return {
    projects: all.filter((p) => !(p.endDate && p.endDate < HISTORY_FROM)).sort(byStart),
    before2014: all.filter((p) => p.endDate && p.endDate < HISTORY_FROM).sort(byStart),
    candidates: [...candidates.values()].filter((c) => !sure.has(c.projectId)).sort(byStart),
    excludedOrganisations: [...excluded.values()].sort((a, b) => b.projects - a.projects),
  };
}

function byStart(a: { startDate: string | null }, b: { startDate: string | null }): number {
  return (a.startDate ?? "").localeCompare(b.startDate ?? "");
}

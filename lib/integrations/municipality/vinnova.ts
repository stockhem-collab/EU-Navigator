// A municipality's Vinnova projects (lib/data/generated/vinnova.json).
// Vinnova's open data names only the coordinating organisation, with no
// organisationsnummer, so the EU history's sure-match rule (PIC, momsnummer,
// organisationsnummer) can't be applied. A project counts here when the
// coordinator's name is exactly the municipality's ("Lidingö kommun",
// "Uppsala Kommun", "Stockholms stad" …); municipal companies and other
// organisations that merely contain the place name do not. The result is
// shown apart from the EU history and never added to its EU totals.

import type { GeneratedDataset, Money } from "../core/types";
import type { MunicipalityMatchConfig } from "../../data/municipalities";
import { normaliseName } from "./match";

export interface VinnovaProject {
  id: string;
  diarienummer: string;
  title: string;
  programmeName: string;
  startDate: string | null;
  endDate: string | null;
  /** The coordinator as Vinnova lists it, with the unit when given. */
  coordinator: string;
  grant: Money | null;
  sourceUrl: string | null;
}

/** The names a municipality goes by as a Vinnova coordinator. */
export function vinnovaNames(config: MunicipalityMatchConfig): Set<string> {
  const names = [config.name, ...config.nameVariants];
  for (const place of config.placeNames) {
    for (const suffix of ["kommun", "stad"]) {
      names.push(`${place} ${suffix}`, `${place}s ${suffix}`);
    }
  }
  return new Set(names.map(normaliseName));
}

export function findVinnovaProjects(
  dataset: GeneratedDataset | undefined,
  config: MunicipalityMatchConfig,
): VinnovaProject[] {
  if (!dataset) return [];
  const names = vinnovaNames(config);
  const orgs = new Set(dataset.organisations.filter((o) => names.has(normaliseName(o.name))).map((o) => o.id));
  const projects = new Map(dataset.projects.map((p) => [p.id, p]));
  const out: VinnovaProject[] = [];
  for (const pp of dataset.partners) {
    if (!orgs.has(pp.organisationId)) continue;
    const p = projects.get(pp.fundedProjectId);
    if (!p) continue;
    out.push({
      id: p.id,
      diarienummer: p.externalProjectId,
      title: p.title,
      programmeName: p.programmeName,
      startDate: p.startDate,
      endDate: p.endDate,
      coordinator: pp.sourceName,
      grant: p.euContribution,
      sourceUrl: p.sourceUrl,
    });
  }
  return out.sort((a, b) => (a.startDate ?? "").localeCompare(b.startDate ?? ""));
}

/** Number of projects and granted kronor. */
export function vinnovaTotals(projects: VinnovaProject[]): { projects: number; grantSek: number } {
  return {
    projects: projects.length,
    grantSek: Math.round(projects.reduce((s, p) => s + (p.grant?.currency === "SEK" ? p.grant.amount : 0), 0)),
  };
}

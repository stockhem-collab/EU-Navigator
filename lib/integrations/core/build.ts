// Small helpers every transform uses to assemble a dataset.

import { createHash } from "node:crypto";
import {
  ImportedFundedProject,
  ImportedOrganisation,
  ImportedProjectPartner,
} from "./types";

/** Short stable id for sources without a usable identifier of their own. */
export function stableHash(text: string): string {
  return createHash("sha1").update(text).digest("hex").slice(0, 12);
}

/** Counts skipped rows per reason. */
export class SkipCounter {
  readonly counts: Record<string, number> = {};
  add(reason: string, n = 1): void {
    this.counts[reason] = (this.counts[reason] ?? 0) + n;
  }
}

/** Organisations keyed by id. A second sighting of the same id fills in
 * fields the first one lacked and remembers every name the source used. */
export class OrganisationRegistry {
  private readonly byId = new Map<string, ImportedOrganisation>();

  add(org: ImportedOrganisation): ImportedOrganisation {
    const existing = this.byId.get(org.id);
    if (!existing) {
      const created = { ...org, sourceNames: [...new Set(org.sourceNames ?? [org.name])] };
      this.byId.set(org.id, created);
      return created;
    }
    for (const key of Object.keys(org) as (keyof ImportedOrganisation)[]) {
      if (existing[key] === null || existing[key] === undefined) {
        (existing as unknown as Record<string, unknown>)[key] = org[key];
      }
    }
    const names = new Set(existing.sourceNames ?? [existing.name]);
    for (const n of org.sourceNames ?? [org.name]) names.add(n);
    existing.sourceNames = [...names];
    return existing;
  }

  values(): ImportedOrganisation[] {
    return [...this.byId.values()];
  }
}

export interface TransformResult {
  projects: ImportedFundedProject[];
  organisations: ImportedOrganisation[];
  partners: ImportedProjectPartner[];
  skipped: Record<string, number>;
}

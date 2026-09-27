"use client";

import { useCallback, useEffect, useState } from "react";
import { OrgUnit } from "@/lib/types";
import { orgUnits as seedOrgUnits } from "@/lib/data/users";

// Lets a user actually configure "their" organisation instead of only
// reading a disclaimer that says it's configurable. Overrides the seeded
// example (organisation name, org registry info, unit structure),
// persisted to localStorage — this browser only, consistent with the rest
// of the no-backend demo.
const STORAGE_KEY = "eu-navigator-org-config";

/** Simple string fields on the organisation's registry info. null = use the
 * seeded example's value. */
export type OrgTextField = "orgNumber" | "orgType" | "country" | "website" | "pic" | "contactName" | "contactEmail";

export interface OrgConfig {
  organisationName: string | null; // null = use the seeded example's name
  orgNumber: string | null;
  orgType: string | null;
  country: string | null;
  website: string | null;
  pic: string | null;
  contactName: string | null;
  contactEmail: string | null;
  units: OrgUnit[] | null; // null = use the seeded example structure
}

const EMPTY: OrgConfig = {
  organisationName: null,
  orgNumber: null,
  orgType: null,
  country: null,
  website: null,
  pic: null,
  contactName: null,
  contactEmail: null,
  units: null,
};

const orgTextFields: OrgTextField[] = ["orgNumber", "orgType", "country", "website", "pic", "contactName", "contactEmail"];

function nullableString(v: unknown): string | null {
  return typeof v === "string" ? v : null;
}

function read(): OrgConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    const next: OrgConfig = {
      ...EMPTY,
      organisationName: nullableString(parsed.organisationName),
      units: Array.isArray(parsed.units) ? parsed.units : null,
    };
    for (const field of orgTextFields) next[field] = nullableString(parsed[field]);
    return next;
  } catch {
    return EMPTY;
  }
}

function write(config: OrgConfig) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch {
    // localStorage unavailable — overrides just won't persist.
  }
}

let unitIdCounter = 0;
function newUnitId(): string {
  unitIdCounter += 1;
  return `unit-${Date.now()}-${unitIdCounter}`;
}

export function useOrgConfig() {
  const [config, setConfig] = useState<OrgConfig>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfig(read());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: OrgConfig) => OrgConfig) => {
    setConfig((prev) => {
      const next = updater(prev);
      write(next);
      return next;
    });
  }, []);

  const setOrganisationName = useCallback(
    (name: string) => update((prev) => ({ ...prev, organisationName: name.trim() || null })),
    [update]
  );

  const setOrgField = useCallback(
    (field: OrgTextField, value: string) => update((prev) => ({ ...prev, [field]: value.trim() || null })),
    [update]
  );

  const addUnit = useCallback(
    (name: string, parentId: string | null) =>
      update((prev) => {
        const units = prev.units ?? seedOrgUnits;
        return { ...prev, units: [...units, { id: newUnitId(), name: name.trim() || "Ny enhet", parentId }] };
      }),
    [update]
  );

  const renameUnit = useCallback(
    (id: string, name: string) =>
      update((prev) => {
        const units = prev.units ?? seedOrgUnits;
        return { ...prev, units: units.map((u) => (u.id === id ? { ...u, name } : u)) };
      }),
    [update]
  );

  const removeUnit = useCallback(
    (id: string) =>
      update((prev) => {
        const units = prev.units ?? seedOrgUnits;
        // Cascade: dropping a unit drops its descendants too, so the tree never
        // strands a child under a parent that no longer exists.
        const toRemove = new Set([id]);
        let grew = true;
        while (grew) {
          grew = false;
          for (const u of units) {
            if (u.parentId && toRemove.has(u.parentId) && !toRemove.has(u.id)) {
              toRemove.add(u.id);
              grew = true;
            }
          }
        }
        return { ...prev, units: units.filter((u) => !toRemove.has(u.id)) };
      }),
    [update]
  );

  const resetAll = useCallback(() => {
    setConfig(EMPTY);
    write(EMPTY);
  }, []);

  return {
    config,
    hydrated,
    setOrganisationName,
    setOrgField,
    addUnit,
    renameUnit,
    removeUnit,
    resetAll,
  };
}

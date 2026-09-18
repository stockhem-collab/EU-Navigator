"use client";

import { useCallback, useEffect, useState } from "react";
import { Lang, OrgUnit } from "@/lib/types";
import { orgUnits as seedOrgUnits } from "@/lib/data/users";

// Lets a user actually configure "their" organisation's process instead of
// only reading a disclaimer that says it's configurable. Overrides the
// seeded example (organisation name, org registry info, unit structure,
// per-phase per-role task lists, and the role names themselves — different
// organisations call these internal support functions different things),
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
  phaseTasks: Record<string, Record<string, string[]>>; // phaseKey -> role_sv -> tasks
  roleNames: Record<string, string>; // role_sv (stable key) -> custom display name
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
  phaseTasks: {},
  roleNames: {},
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
      phaseTasks: parsed.phaseTasks && typeof parsed.phaseTasks === "object" ? parsed.phaseTasks : {},
      roleNames: parsed.roleNames && typeof parsed.roleNames === "object" ? parsed.roleNames : {},
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

  const setTasksFor = useCallback(
    (phaseKey: string, roleSv: string, tasks: string[]) =>
      update((prev) => ({
        ...prev,
        phaseTasks: { ...prev.phaseTasks, [phaseKey]: { ...prev.phaseTasks[phaseKey], [roleSv]: tasks } },
      })),
    [update]
  );

  const setRoleName = useCallback(
    (roleSv: string, name: string) =>
      update((prev) => {
        const roleNames = { ...prev.roleNames };
        const trimmed = name.trim();
        if (trimmed) roleNames[roleSv] = trimmed;
        else delete roleNames[roleSv];
        return { ...prev, roleNames };
      }),
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
    setTasksFor,
    setRoleName,
    addUnit,
    renameUnit,
    removeUnit,
    resetAll,
  };
}

/** Resolves a role's display label: the organisation's own renamed label if
 * set, otherwise the seeded example's name in the current language. */
export function roleLabel(config: OrgConfig, role_sv: string, role_en: string, lang: Lang): string {
  return config.roleNames[role_sv] ?? (lang === "sv" ? role_sv : role_en);
}

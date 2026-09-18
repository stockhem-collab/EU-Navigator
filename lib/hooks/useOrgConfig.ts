"use client";

import { useCallback, useEffect, useState } from "react";
import { Lang } from "@/lib/types";

// Lets a user actually configure "their" organisation's process instead of
// only reading a disclaimer that says it's configurable. Overrides the
// seeded example (organisation name, per-phase per-role task lists, and the
// role names themselves — different organisations call these internal
// support functions different things), persisted to localStorage — this
// browser only, consistent with the rest of the no-backend demo.
const STORAGE_KEY = "eu-navigator-org-config";

export interface OrgConfig {
  organisationName: string | null; // null = use the seeded example's name
  phaseTasks: Record<string, Record<string, string[]>>; // phaseKey -> role_sv -> tasks
  roleNames: Record<string, string>; // role_sv (stable key) -> custom display name
}

const EMPTY: OrgConfig = { organisationName: null, phaseTasks: {}, roleNames: {} };

function read(): OrgConfig {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      organisationName: typeof parsed.organisationName === "string" ? parsed.organisationName : null,
      phaseTasks: parsed.phaseTasks && typeof parsed.phaseTasks === "object" ? parsed.phaseTasks : {},
      roleNames: parsed.roleNames && typeof parsed.roleNames === "object" ? parsed.roleNames : {},
    };
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

export function useOrgConfig() {
  const [config, setConfig] = useState<OrgConfig>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setConfig(read());
    setHydrated(true);
  }, []);

  const setOrganisationName = useCallback((name: string) => {
    setConfig((prev) => {
      const next = { ...prev, organisationName: name.trim() || null };
      write(next);
      return next;
    });
  }, []);

  const setTasksFor = useCallback((phaseKey: string, roleSv: string, tasks: string[]) => {
    setConfig((prev) => {
      const next: OrgConfig = {
        ...prev,
        phaseTasks: { ...prev.phaseTasks, [phaseKey]: { ...prev.phaseTasks[phaseKey], [roleSv]: tasks } },
      };
      write(next);
      return next;
    });
  }, []);

  const setRoleName = useCallback((roleSv: string, name: string) => {
    setConfig((prev) => {
      const roleNames = { ...prev.roleNames };
      const trimmed = name.trim();
      if (trimmed) roleNames[roleSv] = trimmed;
      else delete roleNames[roleSv];
      const next: OrgConfig = { ...prev, roleNames };
      write(next);
      return next;
    });
  }, []);

  const resetAll = useCallback(() => {
    setConfig(EMPTY);
    write(EMPTY);
  }, []);

  return { config, hydrated, setOrganisationName, setTasksFor, setRoleName, resetAll };
}

/** Resolves a role's display label: the organisation's own renamed label if
 * set, otherwise the seeded example's name in the current language. */
export function roleLabel(config: OrgConfig, role_sv: string, role_en: string, lang: Lang): string {
  return config.roleNames[role_sv] ?? (lang === "sv" ? role_sv : role_en);
}

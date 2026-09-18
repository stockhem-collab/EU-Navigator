"use client";

import { useCallback, useEffect, useState } from "react";

// The organisation's own funding profile — feeds into the matching engine
// alongside a project's own description and a call's own criteria (see
// README's matching engine description). Persisted to localStorage, same
// no-backend demo pattern as the rest of /installningar.
const STORAGE_KEY = "eu-navigator-funding-profile";

export type ProjectSize = "lt1m" | "1-10m" | "10-50m" | "gt50m";
export type GeoInterest = "sweden" | "nordic" | "baltic" | "eu";
export type CoFinancingCap = "upTo10" | "upTo30" | "upTo50" | "over50";

export interface FundingProfile {
  focusAreas: string[];
  projectSize: ProjectSize;
  geoInterest: GeoInterest[];
  canPartner: boolean;
  canLead: boolean;
  coFinancingCap: CoFinancingCap;
}

const DEFAULT: FundingProfile = {
  focusAreas: ["Klimat", "Digitalisering"],
  projectSize: "1-10m",
  geoInterest: ["sweden", "nordic", "baltic", "eu"],
  canPartner: true,
  canLead: true,
  coFinancingCap: "upTo30",
};

const PROJECT_SIZES: ProjectSize[] = ["lt1m", "1-10m", "10-50m", "gt50m"];
const GEO_INTERESTS: GeoInterest[] = ["sweden", "nordic", "baltic", "eu"];
const CO_FINANCING_CAPS: CoFinancingCap[] = ["upTo10", "upTo30", "upTo50", "over50"];

function read(): FundingProfile {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT;
    const parsed = JSON.parse(raw);
    return {
      focusAreas: Array.isArray(parsed.focusAreas) ? parsed.focusAreas : DEFAULT.focusAreas,
      projectSize: PROJECT_SIZES.includes(parsed.projectSize) ? parsed.projectSize : DEFAULT.projectSize,
      geoInterest: Array.isArray(parsed.geoInterest) ? parsed.geoInterest.filter((g: string) => GEO_INTERESTS.includes(g as GeoInterest)) : DEFAULT.geoInterest,
      canPartner: typeof parsed.canPartner === "boolean" ? parsed.canPartner : DEFAULT.canPartner,
      canLead: typeof parsed.canLead === "boolean" ? parsed.canLead : DEFAULT.canLead,
      coFinancingCap: CO_FINANCING_CAPS.includes(parsed.coFinancingCap) ? parsed.coFinancingCap : DEFAULT.coFinancingCap,
    };
  } catch {
    return DEFAULT;
  }
}

function write(profile: FundingProfile) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(profile));
  } catch {
    // localStorage unavailable — the profile just won't persist.
  }
}

export function useFundingProfile() {
  const [profile, setProfile] = useState<FundingProfile>(DEFAULT);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setProfile(read());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: FundingProfile) => FundingProfile) => {
    setProfile((prev) => {
      const next = updater(prev);
      write(next);
      return next;
    });
  }, []);

  const addFocusArea = useCallback(
    (tag: string) =>
      update((prev) => {
        const trimmed = tag.trim();
        if (!trimmed || prev.focusAreas.includes(trimmed)) return prev;
        return { ...prev, focusAreas: [...prev.focusAreas, trimmed] };
      }),
    [update]
  );

  const removeFocusArea = useCallback(
    (tag: string) => update((prev) => ({ ...prev, focusAreas: prev.focusAreas.filter((t) => t !== tag) })),
    [update]
  );

  const setProjectSize = useCallback((projectSize: ProjectSize) => update((prev) => ({ ...prev, projectSize })), [update]);

  const toggleGeo = useCallback(
    (geo: GeoInterest) =>
      update((prev) => ({
        ...prev,
        geoInterest: prev.geoInterest.includes(geo) ? prev.geoInterest.filter((g) => g !== geo) : [...prev.geoInterest, geo],
      })),
    [update]
  );

  const setCanPartner = useCallback((canPartner: boolean) => update((prev) => ({ ...prev, canPartner })), [update]);
  const setCanLead = useCallback((canLead: boolean) => update((prev) => ({ ...prev, canLead })), [update]);
  const setCoFinancingCap = useCallback(
    (coFinancingCap: CoFinancingCap) => update((prev) => ({ ...prev, coFinancingCap })),
    [update]
  );

  const resetAll = useCallback(() => {
    setProfile(DEFAULT);
    write(DEFAULT);
  }, []);

  return {
    profile,
    hydrated,
    addFocusArea,
    removeFocusArea,
    setProjectSize,
    toggleGeo,
    setCanPartner,
    setCanLead,
    setCoFinancingCap,
    resetAll,
  };
}

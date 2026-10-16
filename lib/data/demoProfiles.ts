// The municipalities the demo can be shown as. Each profile has its own
// browser data (lib/demoProfile.ts swaps it on switch) and its own EU history
// and comparison group on the server (lib/data/municipalities.ts,
// npm run history:<id>). The active profile is remembered in localStorage and
// mirrored to a cookie so server-rendered pages (/historik, the leadership
// report) show the same municipality.
import { lidingoPreset, OrgPreset, uppsalaPreset } from "./orgPresets";

export type DemoProfileId = "uppsala" | "lidingo";

export interface DemoProfile {
  id: DemoProfileId;
  preset: OrgPreset;
}

export const DEMO_PROFILES: DemoProfile[] = [
  { id: "uppsala", preset: uppsalaPreset },
  { id: "lidingo", preset: lidingoPreset },
];

/** Browsers that used the demo before profiles existed hold Uppsala's data. */
export const DEFAULT_PROFILE: DemoProfileId = "uppsala";

export const PROFILE_COOKIE = "eu-navigator-profile";

export function isDemoProfileId(value: unknown): value is DemoProfileId {
  return DEMO_PROFILES.some((p) => p.id === value);
}

export function demoProfile(id: DemoProfileId): DemoProfile {
  return DEMO_PROFILES.find((p) => p.id === id)!;
}

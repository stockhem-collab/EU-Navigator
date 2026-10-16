// Switching the demo between municipalities (lib/data/demoProfiles.ts). All
// of the app's browser data lives in localStorage keys starting with
// "eu-navigator-"; on a switch the active profile's keys are saved under one
// key of their own, cleared, and the other profile's saved keys put back. A
// profile used for the first time starts from the seeded example with its
// municipality's registry details filled in. The page then reloads so every
// hook reads the new data.
import {
  DEFAULT_PROFILE,
  demoProfile,
  DemoProfileId,
  isDemoProfileId,
  PROFILE_COOKIE,
} from "./data/demoProfiles";
import { EMPTY_ORG_CONFIG, ORG_CONFIG_KEY, withPreset } from "./hooks/useOrgConfig";

const PREFIX = "eu-navigator-";
const ACTIVE_KEY = "eu-navigator-active-profile";
const SAVED_PREFIX = "eu-navigator-profile-data:";
/** Kept across profiles: the interface language is the viewer's, not the
 * municipality's. */
const SHARED_KEYS = new Set(["eu-navigator-lang"]);

function isProfileData(key: string): boolean {
  return key.startsWith(PREFIX) && key !== ACTIVE_KEY && !key.startsWith(SAVED_PREFIX) && !SHARED_KEYS.has(key);
}

function setCookie(id: DemoProfileId) {
  document.cookie = `${PROFILE_COOKIE}=${id}; path=/; max-age=31536000; samesite=lax`;
}

export function activeProfileId(): DemoProfileId {
  try {
    const stored = window.localStorage.getItem(ACTIVE_KEY);
    return isDemoProfileId(stored) ? stored : DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

/** Keeps the cookie the server reads in step with this browser's profile,
 * e.g. after the cookie expired or was cleared. Returns true when it had to
 * be corrected, so a server-rendered page can be reloaded. */
export function syncProfileCookie(): boolean {
  const id = activeProfileId();
  const current = document.cookie.match(new RegExp(`(?:^|; )${PROFILE_COOKIE}=([^;]*)`))?.[1];
  if (current === id) return false;
  setCookie(id);
  return current !== undefined || id !== DEFAULT_PROFILE;
}

export function switchProfile(to: DemoProfileId) {
  const from = activeProfileId();
  if (from === to) return;
  const storage = window.localStorage;

  const keys: string[] = [];
  for (let i = 0; i < storage.length; i++) {
    const key = storage.key(i);
    if (key && isProfileData(key)) keys.push(key);
  }
  const current: Record<string, string> = {};
  for (const key of keys) current[key] = storage.getItem(key)!;
  storage.setItem(SAVED_PREFIX + from, JSON.stringify(current));
  for (const key of keys) storage.removeItem(key);

  const saved = storage.getItem(SAVED_PREFIX + to);
  if (saved) {
    for (const [key, value] of Object.entries(JSON.parse(saved) as Record<string, string>)) storage.setItem(key, value);
    storage.removeItem(SAVED_PREFIX + to);
  } else {
    storage.setItem(ORG_CONFIG_KEY, JSON.stringify(withPreset(EMPTY_ORG_CONFIG, demoProfile(to).preset)));
  }

  storage.setItem(ACTIVE_KEY, to);
  setCookie(to);
  window.location.reload();
}

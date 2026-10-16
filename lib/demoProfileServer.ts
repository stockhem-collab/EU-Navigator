import { cookies } from "next/headers";
import { DEFAULT_PROFILE, DemoProfileId, isDemoProfileId, PROFILE_COOKIE } from "./data/demoProfiles";

/** The demo profile this request is for, from the cookie lib/demoProfile.ts
 * sets on switch. Reading it makes the page render per request. */
export function requestProfileId(): DemoProfileId {
  const value = cookies().get(PROFILE_COOKIE)?.value;
  return isDemoProfileId(value) ? value : DEFAULT_PROFILE;
}

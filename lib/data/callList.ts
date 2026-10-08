import type { FundingCall } from "@/lib/types";
import callList from "./callList.json";

// The real calls from data/utlysningar.csv — open, planned, upcoming and
// expected — as written by `npm run import:calls`
// (lib/integrations/calls/callList.ts). Shown and matched next to the seed
// calls in fundingCalls.ts; upcoming ones are labelled as such.
export const callListCalls = callList as FundingCall[];

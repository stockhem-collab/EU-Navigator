import { ActivityType, Lang, PartnerLevel, SwedishRegion, TargetGroup } from "@/lib/types";

// Labels for the structured matching vocabulary in lib/types.ts (activity
// type, target group, partnership level, county). Kept alongside the other
// closed vocabularies (applicant types in fundingCalls.ts, tags in tags.ts).

const ACTIVITY_TYPE_LABELS: Record<ActivityType, { sv: string; en: string }> = {
  investment: { sv: "Investering (bygg, teknik, infrastruktur)", en: "Investment (construction, technology, infrastructure)" },
  competence: { sv: "Kompetensutveckling och insatser för människor", en: "Skills development and people-focused measures" },
  research: { sv: "Forskning och innovation", en: "Research and innovation" },
  pilot: { sv: "Pilot eller demonstration", en: "Pilot or demonstration" },
  cooperation: { sv: "Samverkan och erfarenhetsutbyte", en: "Cooperation and exchange of experience" },
};

const TARGET_GROUP_LABELS: Record<TargetGroup, { sv: string; en: string }> = {
  pupils: { sv: "Elever och studerande", en: "Pupils and students" },
  young: { sv: "Unga (15–29 år)", en: "Young people (15–29)" },
  unemployed: { sv: "Arbetssökande", en: "Jobseekers" },
  "newly-arrived": { sv: "Nyanlända", en: "Newly arrived migrants" },
  employees: { sv: "Anställda och personal", en: "Employees and staff" },
  elderly: { sv: "Äldre", en: "Older people" },
  disabilities: { sv: "Personer med funktionsnedsättning", en: "People with disabilities" },
};

const PARTNER_LEVEL_LABELS: Record<PartnerLevel, { sv: string; en: string }> = {
  none: { sv: "Inga partner – vi genomför själva", en: "No partners — we carry it out alone" },
  national: { sv: "Partner i Sverige", en: "Partners in Sweden" },
  international: { sv: "Partner i minst ett annat land", en: "Partners in at least one other country" },
  consortium: { sv: "Konsortium med partner från minst tre länder", en: "Consortium with partners from at least three countries" },
};

const REGION_LABELS: Record<SwedishRegion, string> = {
  blekinge: "Blekinge",
  dalarna: "Dalarna",
  gotland: "Gotland",
  gavleborg: "Gävleborg",
  halland: "Halland",
  jamtland: "Jämtland Härjedalen",
  jonkoping: "Jönköping",
  kalmar: "Kalmar",
  kronoberg: "Kronoberg",
  norrbotten: "Norrbotten",
  skane: "Skåne",
  stockholm: "Stockholm",
  sodermanland: "Södermanland",
  uppsala: "Uppsala",
  varmland: "Värmland",
  vasterbotten: "Västerbotten",
  vasternorrland: "Västernorrland",
  vastmanland: "Västmanland",
  "vastra-gotaland": "Västra Götaland",
  orebro: "Örebro",
  ostergotland: "Östergötland",
};

export const ALL_ACTIVITY_TYPES = Object.keys(ACTIVITY_TYPE_LABELS) as ActivityType[];
export const ALL_TARGET_GROUPS = Object.keys(TARGET_GROUP_LABELS) as TargetGroup[];
export const ALL_PARTNER_LEVELS = Object.keys(PARTNER_LEVEL_LABELS) as PartnerLevel[];
export const ALL_REGIONS = Object.keys(REGION_LABELS) as SwedishRegion[];

export function activityTypeLabel(type: ActivityType, lang: Lang): string {
  return ACTIVITY_TYPE_LABELS[type][lang];
}

/** The label without its parenthesised examples — for use inside running
 * text, e.g. match rationale ("… (investering)"). */
export function activityTypeShortLabel(type: ActivityType, lang: Lang): string {
  return ACTIVITY_TYPE_LABELS[type][lang].replace(/\s*\(.*\)$/, "");
}

export function targetGroupLabel(group: TargetGroup, lang: Lang): string {
  return TARGET_GROUP_LABELS[group][lang];
}

export function partnerLevelLabel(level: PartnerLevel, lang: Lang): string {
  return PARTNER_LEVEL_LABELS[level][lang];
}

/** County names are the same in both languages ("Region Skåne" / "Skåne"). */
export function regionLabel(region: SwedishRegion): string {
  return REGION_LABELS[region];
}

/** Number of countries a partnership level spans, counting the applicant's
 * own — what FundingCall.minPartnerCountries is compared against. */
export function partnerCountryCount(level: PartnerLevel): number {
  if (level === "consortium") return 3;
  if (level === "international") return 2;
  return 1;
}

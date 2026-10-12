import { Lang, Tag } from "@/lib/types";

// A fixed, curated tag vocabulary shared between funding calls and
// projects — the structured alternative to matching free-text keywords
// (see scoreMatch.ts's note on why). Each tag is authored once, by hand,
// the same way program.keywords/call.extraKeywords are today; the
// difference is that this list is closed and reused everywhere, so
// "circular economy" and "cirkulär ekonomi" are the same tag rather than
// two unrelated keyword strings that happen to mean the same thing.
export const ALL_TAGS: Tag[] = [
  { id: "migration-integration", label_sv: "Migration och integration", label_en: "Migration and integration", sector: "social" },
  { id: "utbildning-kompetens", label_sv: "Utbildning och kompetensutveckling", label_en: "Education and skills development", sector: "education" },
  { id: "ungdom", label_sv: "Ungdomsutbyte och personalrörlighet", label_en: "Youth exchange and staff mobility", sector: "education", approach: true },
  { id: "gron-stadsutveckling", label_sv: "Grön stadsutveckling", label_en: "Green urban development", sector: "climate" },
  { id: "hallbar-turism", label_sv: "Hållbar turism", label_en: "Sustainable tourism", sector: "climate" },
  { id: "digitalisering", label_sv: "Digitalisering av offentlig sektor", label_en: "Digitalisation of the public sector", sector: "digital" },
  { id: "cirkular-ekonomi", label_sv: "Cirkulär ekonomi", label_en: "Circular economy", sector: "climate" },
  { id: "infrastruktur", label_sv: "Infrastrukturinvesteringar", label_en: "Infrastructure investment", sector: "mobility" },
  { id: "socialtjanst-inkludering", label_sv: "Social inkludering", label_en: "Social inclusion", sector: "social" },
  { id: "arbetsmarknad", label_sv: "Arbetsmarknad och sysselsättning", label_en: "Labour market and employment", sector: "social" },
  { id: "halso-sjukvard", label_sv: "Hälso- och sjukvård", label_en: "Healthcare", sector: "health" },
  { id: "marin-miljo", label_sv: "Marin miljö och fiske", label_en: "Marine environment and fisheries", sector: "climate" },
  { id: "forskning-innovation", label_sv: "Forskning och innovation", label_en: "Research and innovation", sector: "research" },
  { id: "konsortiesamarbete", label_sv: "Internationellt konsortiesamarbete", label_en: "International consortium cooperation", approach: true },
  { id: "pilotprojekt-trl", label_sv: "Pilottestning och TRL", label_en: "Piloting and TRL", approach: true },
  { id: "gransoverskridande", label_sv: "Gränsöverskridande samarbete", label_en: "Cross-border cooperation", approach: true },
  { id: "ostersjosamarbete", label_sv: "Östersjösamarbete", label_en: "Baltic Sea cooperation", approach: true },
  { id: "nordsjosamarbete", label_sv: "Nordsjösamarbete", label_en: "North Sea cooperation", approach: true },
  { id: "interregionalt-erfarenhetsutbyte", label_sv: "Interregionalt erfarenhetsutbyte", label_en: "Interregional exchange of experience", approach: true },
  { id: "ai-artificiell-intelligens", label_sv: "Artificiell intelligens", label_en: "Artificial intelligence", sector: "digital" },
  { id: "cybersakerhet", label_sv: "Cybersäkerhet", label_en: "Cybersecurity", sector: "digital" },
  { id: "automation", label_sv: "Automation", label_en: "Automation", sector: "digital" },
  { id: "laddinfrastruktur", label_sv: "Laddinfrastruktur", label_en: "Charging infrastructure", sector: "energy" },
  { id: "energinat", label_sv: "Energinät", label_en: "Energy grids", sector: "energy" },
  { id: "energieffektivisering", label_sv: "Energieffektivisering", label_en: "Energy efficiency", sector: "energy" },
  { id: "fornybar-energi", label_sv: "Förnybar energi", label_en: "Renewable energy", sector: "energy" },
  { id: "klimatatgarder", label_sv: "Klimatåtgärder", label_en: "Climate action", sector: "climate" },
  { id: "hallbarhet", label_sv: "Hållbarhet", label_en: "Sustainability", sector: "climate", broad: true },
  { id: "kultur-kreativitet", label_sv: "Kultur och kreativitet", label_en: "Culture and creativity", sector: "social" },
  { id: "natverk-samverkan", label_sv: "Nätverk och samverkan", label_en: "Networks and collaboration", approach: true },
  { id: "landsbygdsutveckling", label_sv: "Landsbygdsutveckling", label_en: "Rural development", sector: "climate" },
  { id: "stadsomstallning-klimatneutral", label_sv: "Klimatneutral stadsomställning", label_en: "Climate-neutral urban transition", sector: "climate" },
  { id: "medborgarservice", label_sv: "Medborgarservice", label_en: "Citizen services", sector: "digital" },
  { id: "skolor-byggnader", label_sv: "Skolor och offentliga byggnader", label_en: "Schools and public buildings", sector: "education" },
  { id: "renovering", label_sv: "Renovering och ombyggnad", label_en: "Renovation and retrofitting", sector: "energy" },
  { id: "jamstalldhet", label_sv: "Jämställdhet", label_en: "Gender equality", sector: "social" },
  { id: "etik-datasakerhet", label_sv: "Etik och datasäkerhet", label_en: "Ethics and data security", sector: "digital" },
  { id: "interoperabilitet", label_sv: "Interoperabilitet", label_en: "Interoperability", sector: "digital" },
  { id: "regional-konkurrenskraft", label_sv: "Regional konkurrenskraft", label_en: "Regional competitiveness", sector: "research" },
  { id: "klimatanpassning", label_sv: "Klimatanpassning", label_en: "Climate adaptation", sector: "climate" },
  { id: "hallbara-transporter", label_sv: "Hållbara transporter och mobilitet", label_en: "Sustainable transport and mobility", sector: "mobility" },
  { id: "mat-livsmedel", label_sv: "Mat och livsmedel", label_en: "Food and food systems", sector: "climate" },
  { id: "natur-biologisk-mangfald", label_sv: "Natur och biologisk mångfald", label_en: "Nature and biodiversity", sector: "climate" },
  { id: "vatten-avlopp", label_sv: "Vatten och avlopp", label_en: "Water and wastewater", sector: "climate" },
  { id: "unga", label_sv: "Unga", label_en: "Young people", sector: "social" },
  { id: "kapacitetsokning", label_sv: "Kapacitetsökning", label_en: "Capacity increase", approach: true },
];

/** Points a matching tag adds to a call match (lib/matching/scoreMatch.ts):
 * a subject tag says what the project is about; an approach or very broad
 * tag only says how it works, so it counts for less. Unknown (custom) tags
 * count as subject tags. */
export function tagWeight(id: string): number {
  const tag = TAGS_BY_ID[id];
  return tag && (tag.approach || tag.broad) ? 3 : 7;
}

/** The picker's groups, in display order: subject tags under their sector,
 * then the ways-of-working tags, then custom tags. */
export const TAG_GROUP_ORDER = ["climate", "energy", "mobility", "social", "education", "health", "digital", "research", "approach", "custom"] as const;
export type TagGroup = (typeof TAG_GROUP_ORDER)[number];

export function tagGroup(tag: Tag): TagGroup {
  if (tag.approach) return "approach";
  return tag.sector ?? "custom";
}

const TAGS_BY_ID: Record<string, Tag> = Object.fromEntries(ALL_TAGS.map((t) => [t.id, t]));

export function findTag(id: string): Tag | undefined {
  return TAGS_BY_ID[id];
}

export function tagLabel(id: string, lang: Lang): string {
  const tag = TAGS_BY_ID[id];
  if (!tag) return id;
  return lang === "sv" ? tag.label_sv : tag.label_en;
}

/** A tag id for a label or id as written in a CSV (either language, any
 * case) — undefined when it isn't in the fixed vocabulary. */
export function tagIdFor(label: string): string | undefined {
  const key = label.trim().toLowerCase();
  return ALL_TAGS.find((t) => t.id === key || t.label_sv.toLowerCase() === key || t.label_en.toLowerCase() === key)?.id;
}

import { ALL_TAGS } from "@/lib/data/tags";

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zåäö0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// A deterministic keyword -> tag dictionary — the same "no AI call at
// request time" principle as scoreMatch.ts's own keyword matching, just
// mapping onto the curated tag vocabulary (lib/data/tags.ts) instead of
// scoring points directly. Used to suggest tags for a project from its
// free-text description; suggestions are only ever offered, never applied
// automatically — the user picks what actually fits in the application
// studio, same as with the sector field.
const TAG_KEYWORDS: Record<string, string[]> = {
  "migration-integration": ["migration", "asyl", "asylum", "integration", "nyanlända", "flykting", "refugee"],
  "utbildning-kompetens": ["utbildning", "kompetens", "kompetensutveckling", "kompetenslyft", "education", "training", "skills", "upskilling"],
  ungdom: ["ungdom", "personalutbyte", "elevutbyte", "youth", "staff exchange"],
  "gron-stadsutveckling": ["stadsutveckling", "gröna städer", "hållbar stad", "urban development", "green city"],
  "hallbar-turism": ["turism", "besöksnäring", "tourism"],
  digitalisering: ["digitalisering", "digitalisation", "digital transformation"],
  "cirkular-ekonomi": ["cirkulär ekonomi", "återvinning", "circular economy", "recycling"],
  infrastruktur: ["infrastruktur", "infrastructure"],
  "socialtjanst-inkludering": ["social inkludering", "inkludering", "socialtjänst", "inclusion", "social services"],
  arbetsmarknad: ["arbetsmarknad", "sysselsättning", "employment", "labour market"],
  "halso-sjukvard": ["vård", "omsorg", "hälsa", "sjukvård", "healthcare", "health", "care"],
  "marin-miljo": ["hav", "fiske", "marin", "vattenbruk", "marine", "fisheries"],
  "forskning-innovation": ["forskning", "innovation", "research"],
  konsortiesamarbete: ["konsortium", "konsortieavtal", "consortium"],
  "pilotprojekt-trl": ["pilot", "pilottestning", "trl", "piloting"],
  gransoverskridande: ["gränsöverskridande", "cross-border"],
  ostersjosamarbete: ["östersjön", "baltic"],
  nordsjosamarbete: ["nordsjön", "north sea"],
  "interregionalt-erfarenhetsutbyte": ["interregionalt", "erfarenhetsutbyte", "interregional"],
  "ai-artificiell-intelligens": ["ai", "artificiell intelligens", "artificial intelligence", "chatbot"],
  cybersakerhet: ["cybersäkerhet", "cybersecurity"],
  automation: ["automation", "automatisering", "automate"],
  laddinfrastruktur: ["laddstolpar", "laddinfrastruktur", "charging"],
  energinat: ["energinät", "elnät", "energy grid"],
  energieffektivisering: ["energieffektivisering", "energibesparing", "energy efficiency"],
  "fornybar-energi": ["förnybar energi", "solceller", "renewable energy", "solar"],
  klimatatgarder: ["klimat", "klimatåtgärder", "climate", "climate action"],
  hallbarhet: ["hållbarhet", "sustainability"],
  "kultur-kreativitet": ["kultur", "konst", "kreativitet", "culture", "art", "creative"],
  "natverk-samverkan": ["nätverk", "samverkan", "networking", "network"],
  landsbygdsutveckling: ["landsbygd", "rural"],
  "stadsomstallning-klimatneutral": ["stadsomställning", "klimatneutral", "urban transition", "climate-neutral"],
  medborgarservice: ["medborgarservice", "kontaktcenter", "citizen service"],
  "skolor-byggnader": ["skolor", "byggnader", "schools", "buildings"],
  renovering: ["renovering", "ombyggnad", "renovation", "retrofit"],
  jamstalldhet: ["jämställdhet", "jämställd", "gender equality"],
  "etik-datasakerhet": ["etik", "datasäkerhet", "ethics", "data security"],
  interoperabilitet: ["interoperabilitet", "interoperability"],
  "regional-konkurrenskraft": ["regional konkurrenskraft", "regional competitiveness"],
  kapacitetsokning: ["kapacitetsökning", "capacity increase"],
};

/** Suggests tag ids from free text (a project's title + description) by
 * exact keyword lookup against TAG_KEYWORDS — no live AI call. Order
 * follows ALL_TAGS, so the result is stable. Always advisory: callers
 * decide which of these, if any, actually get added to the project. */
export function suggestTags(text: string): string[] {
  const words = new Set(normalizeWords(text));
  const hits: string[] = [];
  for (const tag of ALL_TAGS) {
    const keywords = TAG_KEYWORDS[tag.id];
    if (!keywords) continue;
    const matched = keywords.some((kw) => kw.split(/\s+/).every((part) => words.has(part)));
    if (matched) hits.push(tag.id);
  }
  return hits;
}

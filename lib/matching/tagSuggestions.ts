import { ALL_TAGS } from "@/lib/data/tags";

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zåäöéü0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

// A deterministic keyword -> tag dictionary — the same "no AI call at
// request time" principle as scoreMatch.ts's own keyword matching, just
// mapping onto the curated tag vocabulary (lib/data/tags.ts) instead of
// scoring points directly. Used to suggest tags for a project from its
// free-text description, and to tag the calls in data/utlysningar.csv
// that have no hand-set Taggar.
//
// Each keyword is a word or a phrase (consecutive words). A `*` matches
// any letters, so "klimatanpass*" also catches "klimatanpassning" and
// "klimatanpassad", and "*avfall*" catches "matavfallet" — Swedish
// compounds and inflections that an exact-word lookup misses. Ambiguous
// short words ("integration", "art", "care") are left out or only used in
// phrases, because one wrong tag on a call skews every match against it.
const TAG_KEYWORDS: Record<string, string[]> = {
  "migration-integration": ["migration*", "asyl*", "nyanländ*", "flykting*", "invandr*", "refugee*", "asylum", "migrant*"],
  "utbildning-kompetens": ["utbildning*", "kompetens*", "yrkesutbild*", "vuxenutbild*", "education", "training", "skills", "upskilling", "reskilling"],
  ungdom: ["ungdomsutbyte*", "personalutbyte*", "elevutbyte*", "youth exchange*", "staff exchange*"],
  "gron-stadsutveckling": ["stadsutveckling*", "stadsmiljö*", "grön stad", "gröna städer", "hållbar stad", "hållbara städer", "urban development", "green city", "green cities"],
  "hallbar-turism": ["turism*", "besöksnäring*", "tourism"],
  digitalisering: ["digitalis*", "digital", "digitala", "e tjänst*", "digitalisation", "digitalization", "digital transformation"],
  "cirkular-ekonomi": ["cirkulär*", "återbruk*", "återvinn*", "återanvänd*", "*avfall*", "circular*", "recycl*", "reuse", "waste"],
  infrastruktur: ["infrastruktur*", "infrastructure"],
  "socialtjanst-inkludering": ["inkludering*", "utanförskap*", "socialtjänst*", "fattigdom*", "social inclusion", "social services", "poverty"],
  arbetsmarknad: ["arbetsmarknad*", "sysselsättning*", "jobb*", "arbetssök*", "arbetslös*", "anställningsbar*", "employment", "unemploy*", "labour market", "labor market", "jobs"],
  "halso-sjukvard": ["vård", "sjukvård*", "hälso*", "hälsa", "hälsan", "omsorg*", "äldreomsorg*", "folkhälsa*", "healthcare", "health", "health care"],
  "marin-miljo": ["hav", "havet", "havs*", "fiske*", "marin*", "vattenbruk*", "marine", "fisheries", "aquaculture"],
  "forskning-innovation": ["forskning*", "innovation*", "innovativ*", "research", "innovation"],
  konsortiesamarbete: ["konsorti*", "consortium", "consortia"],
  "pilotprojekt-trl": ["pilot*", "trl", "testbädd*", "demonstrat*", "piloting"],
  gransoverskridande: ["gränsöverskridande", "transnationell*", "cross border", "transnational"],
  ostersjosamarbete: ["östersjö*", "baltic"],
  nordsjosamarbete: ["nordsjö*", "north sea"],
  "interregionalt-erfarenhetsutbyte": ["interregional*", "erfarenhetsutbyte*", "interreg"],
  "ai-artificiell-intelligens": ["ai", "artificiell intelligens", "maskininlärning*", "artificial intelligence", "machine learning", "chatbot*"],
  cybersakerhet: ["cybersäkerhet*", "informationssäkerhet*", "cybersecurity", "cyber security"],
  automation: ["automati*", "robot*", "automation"],
  laddinfrastruktur: ["laddstolp*", "laddinfrastruktur*", "laddplats*", "charging"],
  energinat: ["energinät*", "elnät*", "mikronät*", "smarta nät", "energy grid*", "smart grid*", "microgrid*"],
  energieffektivisering: ["energieffektiv*", "energibesparing*", "lågtemperatur*", "energy efficien*"],
  "fornybar-energi": ["förnybar*", "solcell*", "solenergi*", "vindkraft*", "biogas*", "vätgas*", "renewable*", "solar", "hydrogen"],
  klimatatgarder: ["klimat", "klimatåtgärd*", "utsläpp*", "fossilfri*", "växthusgas*", "koldioxid*", "klimatbudget*", "begränsning av klimatförändring*", "climate action", "climate mitigation", "emission*", "decarbonis*", "decarboniz*"],
  hallbarhet: ["hållbarhet*", "sustainability"],
  "kultur-kreativitet": ["kultur*", "konst", "konstnär*", "kreativ*", "culture", "cultural", "creative", "arts"],
  "natverk-samverkan": ["nätverk*", "samverkan", "networking"],
  landsbygdsutveckling: ["landsbygd*", "rural"],
  "stadsomstallning-klimatneutral": ["stadsomställning*", "klimatneutral*", "urban transition*", "climate neutral", "net zero"],
  medborgarservice: ["medborgarservice", "kontaktcenter", "e tjänst*", "citizen service*"],
  "skolor-byggnader": ["skolor", "skolbyggnad*", "förskol*", "offentliga byggnader", "kommunala fastigheter", "schools", "public buildings", "school buildings"],
  renovering: ["renover*", "ombyggnad*", "upprustning*", "renovation*", "retrofit*"],
  jamstalldhet: ["jämställd*", "gender equality", "gender"],
  "etik-datasakerhet": ["etik", "etisk*", "datasäkerhet*", "dataskydd*", "gdpr", "ethics", "data protection", "data security"],
  interoperabilitet: ["interoperab*"],
  "regional-konkurrenskraft": ["konkurrenskraft*", "regional tillväxt", "smart specialisering", "competitiveness"],
  klimatanpassning: ["klimatanpass*", "skyfall*", "översvämning*", "värmebölj*", "klimatresilien*", "resilien*", "klimattålig*", "climate adaptation", "adaptation", "resilience", "flood*", "heatwave*"],
  "hallbara-transporter": ["transport*", "kollektivtrafik*", "mobilitet*", "cykel*", "resande", "resenod*", "logistik*", "arbetsmaskin*", "fordon*", "mobility", "public transport", "logistics", "cycling"],
  "mat-livsmedel": ["mat", "maten", "livsmedel*", "måltid*", "storkök*", "offentliga kök", "food*"],
  "natur-biologisk-mangfald": ["biologisk mångfald", "ekosystem*", "grönområd*", "våtmark*", "natur", "naturen", "naturbaserad*", "grönska", "biodiversity", "nature", "nature based", "ecosystem*"],
  "vatten-avlopp": ["vatten", "vattnet", "avlopp*", "dagvatten*", "vattenförsörjning*", "vattenrening*", "water", "wastewater", "stormwater", "sewage"],
  unga: ["unga", "ungdom", "ungdomar*", "young people", "youth", "neet"],
  kapacitetsokning: ["kapacitetsök*", "kapacitetsuppbyggnad*", "capacity building", "capacity increase"],
};

/** A keyword as a list of per-word patterns, `*` meaning any letters. */
function compile(keyword: string): RegExp[] {
  return normalizeWords(keyword.replace(/\*/g, "qxq")).map(
    (part) => new RegExp(`^${part.replace(/qxq/g, "[a-zåäöéü0-9]*")}$`),
  );
}

const COMPILED: [string, RegExp[][]][] = Object.entries(TAG_KEYWORDS).map(([id, keywords]) => [id, keywords.map(compile)]);

function containsPhrase(words: string[], phrase: RegExp[]): boolean {
  for (let i = 0; i + phrase.length <= words.length; i++) {
    if (phrase.every((re, j) => re.test(words[i + j]))) return true;
  }
  return false;
}

/** Suggests tag ids from free text (a project's title + description) by
 * keyword lookup against TAG_KEYWORDS — no live AI call. Order follows
 * ALL_TAGS, so the result is stable. Always advisory for projects:
 * callers decide which of these, if any, actually get added. */
export function suggestTags(text: string): string[] {
  const words = normalizeWords(text);
  const byId = new Map(COMPILED);
  return ALL_TAGS.filter((tag) => (byId.get(tag.id) ?? []).some((phrase) => containsPhrase(words, phrase))).map((tag) => tag.id);
}

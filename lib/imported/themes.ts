// The translation table between the app's themes (the eight sectors a
// project idea and a call are described with) and the codes each source
// classifies its projects by: Kohesio's categories of intervention (per
// programme period, since the numbers mean different things in 2014–2020
// and 2021–2027), CORDIS topic codes and keep.eu's themes. Together with
// the Swedish–English word list below, this is what lets a Swedish idea
// find English-language projects — deterministic and explainable, no AI.

import type { Sector } from "@/lib/types";
import type { ProgrammePeriod } from "@/lib/integrations/core/types";

export interface SectorCodes {
  /** Kohesio/ESF+ categories of intervention, 2014–2020 numbering. */
  kohesio2014: string[];
  /** Kohesio/ESF+ categories of intervention, 2021–2027 numbering. */
  kohesio2021: string[];
  /** CORDIS topic codes, as prefixes or patterns. */
  cordisTopics: RegExp[];
  /** keep.eu's theme names, verbatim. */
  keepEuThemes: string[];
}

const range = (from: number, to: number) => Array.from({ length: to - from + 1 }, (_, i) => String(from + i));

export const SECTOR_CODES: Record<Sector, SectorCodes> = {
  energy: {
    kohesio2014: ["13", "14", "68", "71"],
    kohesio2021: ["38", "39", "40", "41", "42", "43", "44", "45", "46", "47", "48", "49", "50", "51", "52", "53", "54", "55", "56"],
    cordisTopics: [/^HORIZON-CL5-\d{4}-D[234]-/, /^LC-SC3-/, /^LCE-/, /^EE-/, /^SCC-/, /^FCH-/, /^HORIZON-JTI-CLEANH2/, /^LC-EEB-/],
    keepEuThemes: ["Renewable energy", "Energy efficiency", "Traditional energy", "Construction and renovation"],
  },
  climate: {
    kohesio2014: ["23", "65", "69", "71", "83", "84", "85", "86", "87", "88", "89"],
    kohesio2021: ["30", "46", "58", "59", "60", "61", "62", "63", "64", "65", "66", "67", "68", "69", "70", "71", "72", "73", "74", "75", "76", "77", "78", "79", "80"],
    cordisTopics: [
      /^HORIZON-CL5-\d{4}-D1-/,
      /^HORIZON-MISS-\d{4}-(?:\d+-)?(?:CLIMA|CIT|OCEAN|SOIL)/,
      /^HORIZON-CL6-\d{4}-(?:CLIMATE|ZEROPOLLUTION|CIRCBIO|BIODIV|COMMUNITIES)/i,
      /^LC-CLA-/,
      /^SC5-/,
      /^CE-SC5-/,
      /^CIRC-/,
      /^WASTE-/,
      /^WATER-/,
      /^DRS-/,
      /^LC-GD-/,
    ],
    keepEuThemes: [
      "Climate change and biodiversity",
      "Waste and pollution",
      "Water management",
      "Sustainable management of natural resources",
      "Green technologies",
      "Managing natural and man-made threats, risk management",
      "Waterways, lakes and rivers",
      "Soil and air quality",
      "Coastal management and maritime issues",
    ],
  },
  digital: {
    kohesio2014: ["4", "46", "47", "48", "78", "79", "80", "81", "82"],
    kohesio2021: ["13", "14", "15", "16", "17", "18", "19", "32", "33", "34", "35"],
    cordisTopics: [/^HORIZON-CL4-\d{4}-(?:DIGITAL|DATA|HUMAN)/, /^HORIZON-CL3-\d{4}-CS-/, /^ICT-/, /^DT-/, /^EINFRA-/, /^SU-DS/],
    keepEuThemes: ["ICT and digital society"],
  },
  social: {
    kohesio2014: ["55", "73", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115"],
    kohesio2021: ["124", "125", "126", "127", "134", "135", "136", "137", "138", "139", "140", "141", "142", "143", "144", "152", "153", "154", "155", "156", "157", "163", "164", "165", "166", "167", "168", "169", "170"],
    cordisTopics: [/^HORIZON-CL2-\d{4}-(?:DEMOCRACY|TRANSFORMATIONS)/, /^MIGRATION-/, /^TRANSFORMATIONS-/, /^REV-INEQUAL-/, /^CO-CREATION-/, /^GOVERNANCE-/, /^SU-GOVERNANCE/],
    keepEuThemes: [
      "Social inclusion and equal opportunities",
      "Labour market and employment",
      "Demographic change and immigration",
      "Community integration and common identity",
      "Health and social services",
    ],
  },
  mobility: {
    kohesio2014: ["24", "25", "26", "27", "28", "29", "30", "31", "32", "33", "34", "35", "36", "37", "38", "39", "40", "41", "42", "43", "44", "90"],
    kohesio2021: ["81", "82", "83", "84", "85", "86", "87", "88", "89", "90", "91", "92", "93", "94", "95", "96", "97", "98", "99", "100", "101", "102", "103", "104", "105", "106", "107", "108", "109", "110", "111", "112", "113", "114", "115", "116", "117", "118"],
    cordisTopics: [/^HORIZON-CL5-\d{4}-D[56]-/, /^MG-/, /^LC-MG-/, /^GV-/, /^S2R-/, /^SESAR/, /^HORIZON-SESAR/, /^HORIZON-ER-JU/, /^ART-/],
    keepEuThemes: ["Transport and mobility", "Multimodal transport", "Logistics and freight transport", "Improving transport connections", "Infrastructure"],
  },
  education: {
    kohesio2014: ["49", "50", "51", "52", "80", "116", "117", "118"],
    kohesio2021: ["18", "23", "120", "121", "122", "123", "145", "146", "147", "148", "149", "150", "151"],
    cordisTopics: [/^SwafS-/i, /^YOUNG-/, /^HORIZON-CL2-\d{4}-HERITAGE/],
    keepEuThemes: ["Education and training", "Cultural heritage and arts"],
  },
  health: {
    kohesio2014: ["53", "81", "112"],
    kohesio2021: ["128", "129", "130", "131", "132", "133", "158", "159", "160", "161"],
    cordisTopics: [/^HORIZON-HLTH-/, /^HORIZON-MISS-\d{4}-(?:\d+-)?CANCER/, /^SC1-/, /^PHC-/, /^IMI2?-/, /^HORIZON-JU-IHI/, /^DTH-/],
    keepEuThemes: ["Health and social services"],
  },
  research: {
    kohesio2014: ["56", "57", "58", "59", "60", "61", "62", "63", "64", "65"],
    kohesio2021: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10", "11", "12", "26", "27", "28", "29", "30"],
    cordisTopics: [/^ERC-/, /^HORIZON-ERC/, /^MSCA-/, /^HORIZON-MSCA-/, /^INFRA/, /^HORIZON-INFRA-/, /^HORIZON-WIDERA-/, /^WIDESPREAD-/, /^FET/],
    keepEuThemes: ["Knowledge and technology transfer", "Scientific cooperation", "Innovation capacity and awareness-raising"],
  },
};

export const ALL_SECTORS = Object.keys(SECTOR_CODES) as Sector[];

/** The fields of an imported project the theme translation reads. */
export interface ThemedProject {
  source: "kohesio" | "keep-eu" | "cordis" | "esf";
  period: ProgrammePeriod | null;
  tags?: string[];
  category?: { code: string; label: string | null } | null;
}

/** Why a project belongs to an app theme: the source code or theme that
 * the translation table maps onto it. */
export interface ThemeMatch {
  sector: Sector;
  /** The source's own classification, e.g. "Kohesio-kategori 117". */
  code_sv: string;
  code_en: string;
  /** The source's own label for the code, verbatim (usually English). */
  label: string | null;
}

/** CORDIS writes the topic code as the second tag (after the funding
 * scheme); a project can carry several, comma- or semicolon-separated. */
export function cordisTopics(project: ThemedProject): string[] {
  return (project.tags ?? []).slice(1).flatMap((t) => t.split(/[;,]/).map((s) => s.trim()).filter(Boolean));
}

/** The app themes an imported project falls under, with the source code
 * behind each. */
export function projectThemes(project: ThemedProject): ThemeMatch[] {
  const out: ThemeMatch[] = [];
  for (const sector of ALL_SECTORS) {
    const codes = SECTOR_CODES[sector];
    if (project.source === "kohesio" || project.source === "esf") {
      const c = project.category;
      if (!c) continue;
      const list = project.period === "2014-2020" ? codes.kohesio2014 : codes.kohesio2021;
      if (list.includes(c.code)) {
        out.push({
          sector,
          code_sv: `Interventionskategori ${c.code} (${project.period ?? "2021-2027"})`,
          code_en: `Category of intervention ${c.code} (${project.period ?? "2021-2027"})`,
          label: c.label,
        });
      }
    } else if (project.source === "cordis") {
      const topic = cordisTopics(project).find((t) => codes.cordisTopics.some((re) => re.test(t)));
      if (topic) out.push({ sector, code_sv: `CORDIS-ämne ${topic}`, code_en: `CORDIS topic ${topic}`, label: null });
    } else {
      const theme = (project.tags ?? []).find((t) => codes.keepEuThemes.includes(t));
      if (theme) out.push({ sector, code_sv: `Keep.eu-tema "${theme}"`, code_en: `Keep.eu theme "${theme}"`, label: theme });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Swedish–English word list. Each concept lists the Swedish word stems an
// idea may use and the terms (Swedish and English) to look for in a
// project's title and summary. A trailing "*" matches any word starting
// with the stem (Swedish compounds: "klimatanpassningsåtgärder"); without
// it, the whole word must match.
// ---------------------------------------------------------------------------
export interface Concept {
  id: string;
  /** Shown in the explanation, e.g. "skyfall". */
  label_sv: string;
  sv: string[];
  terms: string[];
}

export const CONCEPTS: Concept[] = [
  { id: "climate-adaptation", label_sv: "klimatanpassning", sv: ["klimatanpass*", "klimatsäkr*", "klimattålig*", "resilien*"], terms: ["klimatanpass*", "climate adaptation", "adaptation to climate", "climate resilien*", "resilien*"] },
  { id: "flooding", label_sv: "skyfall och översvämning", sv: ["skyfall*", "översvämning*", "dagvatten*", "kraftig* regn*"], terms: ["skyfall*", "översvämning*", "dagvatten*", "flood*", "stormwater*", "cloudburst*", "heavy rain*", "pluvial*"] },
  { id: "heat", label_sv: "värmebölja", sv: ["värmebölj*", "hetta", "värmestress*"], terms: ["värmebölj*", "heatwave*", "heat wave*", "urban heat*", "heat stress"] },
  { id: "energy-efficiency", label_sv: "energieffektivisering", sv: ["energieffektiv*", "energibesparing*", "energismart*"], terms: ["energieffektiv*", "energy efficien*", "energy-efficien*", "energy saving*"] },
  { id: "renovation", label_sv: "renovering", sv: ["renover*", "ombyggnad*", "upprustning*"], terms: ["renover*", "renovation*", "retrofit*", "refurbish*"] },
  { id: "solar", label_sv: "solenergi", sv: ["solcell*", "solenergi*", "solpanel*", "solel*"], terms: ["solcell*", "solenergi*", "solar*", "photovoltaic*"] },
  { id: "wind", label_sv: "vindkraft", sv: ["vindkraft*", "vindbruk*"], terms: ["vindkraft*", "wind power", "wind energy", "wind farm*"] },
  { id: "district-heating", label_sv: "fjärrvärme", sv: ["fjärrvärme*", "fjärrkyla*", "lågtemperatur*"], terms: ["fjärrvärme*", "district heating", "district cooling", "low-temperature heat*", "low temperature heat*"] },
  { id: "hydrogen", label_sv: "vätgas", sv: ["vätgas*"], terms: ["vätgas*", "hydrogen*"] },
  { id: "charging", label_sv: "laddinfrastruktur", sv: ["laddinfrastruktur*", "laddstolp*", "laddplats*", "elbil*", "elfordon*", "elektrifier*"], terms: ["laddinfrastruktur*", "laddstolp*", "elbil*", "charging", "electric vehicle*", "e-mobility", "electrification", "electromobility"] },
  { id: "public-transport", label_sv: "kollektivtrafik", sv: ["kollektivtrafik*", "busstrafik*", "resenod*", "bytespunkt*"], terms: ["kollektivtrafik*", "public transport*", "bus", "buses", "mobility hub*", "transit"] },
  { id: "tram", label_sv: "spårväg", sv: ["spårväg*", "spårvagn*"], terms: ["spårväg*", "tram*", "light rail"] },
  { id: "cycling", label_sv: "cykel och gång", sv: ["cykel*", "cykl*", "gångtrafik*", "fotgängar*"], terms: ["cykel*", "cykl*", "cycling", "bicycle*", "bike*", "walking", "active mobility", "active travel"] },
  { id: "sustainable-mobility", label_sv: "hållbar mobilitet", sv: ["mobilitet*", "delad mobilitet*", "bilpool*", "fossilfri* transport*"], terms: ["mobilitet*", "sustainable mobility", "shared mobility", "mobility as a service", "maas", "car sharing", "car-sharing"] },
  { id: "logistics", label_sv: "logistik", sv: ["logistik*", "godstransport*", "varutransport*"], terms: ["logistik*", "logistic*", "freight", "goods transport", "urban delivery"] },
  { id: "machinery", label_sv: "fossilfria arbetsmaskiner", sv: ["arbetsmaskin*", "entreprenadmaskin*"], terms: ["arbetsmaskin*", "non-road mobile machinery", "construction machinery", "construction equipment", "zero-emission construction site*"] },
  { id: "circular", label_sv: "cirkulär ekonomi", sv: ["cirkulär*", "återbruk*", "återanvänd*"], terms: ["cirkulär*", "återbruk*", "circular*", "reuse", "re-use"] },
  { id: "recycling", label_sv: "återvinning och avfall", sv: ["återvinn*", "avfall*", "sopsorter*"], terms: ["återvinn*", "avfall*", "recycl*", "waste"] },
  { id: "food-waste", label_sv: "matsvinn", sv: ["matsvinn*", "livsmedelsavfall*"], terms: ["matsvinn*", "food waste", "food loss*"] },
  { id: "food", label_sv: "mat och måltider", sv: ["måltid*", "skolmat*", "livsmedel*", "storkök*", "offentlig* kök*"], terms: ["måltid*", "skolmat*", "livsmedel*", "food", "meals", "school meal*", "catering", "canteen*"] },
  { id: "construction", label_sv: "byggande", sv: ["byggande*", "byggsektor*", "byggmaterial*", "byggprojekt*", "nybyggnad*"], terms: ["byggande*", "byggsektor*", "construction", "building sector", "built environment", "building material*"] },
  { id: "timber", label_sv: "träbyggande", sv: ["träbygg*", "trähus*"], terms: ["träbygg*", "timber", "wood construction", "wooden building*"] },
  { id: "biodiversity", label_sv: "biologisk mångfald", sv: ["biologisk mångfald", "mångfald*", "ekosystem*", "pollinat*"], terms: ["biologisk mångfald", "ekosystem*", "biodiversity", "ecosystem*", "pollinat*", "habitat*"] },
  { id: "nature-based", label_sv: "naturbaserade lösningar", sv: ["naturbaserad*", "grönstruktur*", "grönområd*", "gröna tak", "stadsträd*", "parker"], terms: ["naturbaserad*", "grönstruktur*", "nature-based", "nature based", "green infrastructure", "green space*", "urban green*", "green roof*", "urban nature"] },
  { id: "water", label_sv: "vatten och avlopp", sv: ["avlopp*", "vattenrening*", "dricksvatten*", "vattenförsörjning*", "reningsverk*"], terms: ["avlopp*", "vattenrening*", "wastewater", "waste water", "sewage", "drinking water", "water supply", "water treatment"] },
  { id: "air", label_sv: "luftkvalitet och buller", sv: ["luftkvalitet*", "luftföroren*", "buller*"], terms: ["luftkvalitet*", "air quality", "air pollution", "noise"] },
  { id: "emissions", label_sv: "utsläpp och klimatneutralitet", sv: ["klimatneutral*", "koldioxid*", "utsläpp*", "fossilfri*", "klimatpåverkan*", "nettonoll*"], terms: ["klimatneutral*", "utsläpp*", "fossilfri*", "climate neutral*", "climate-neutral*", "carbon neutral*", "net zero", "net-zero", "emission*", "low carbon", "low-carbon", "decarboni*", "fossil-free", "fossil free"] },
  { id: "digitalisation", label_sv: "digitalisering", sv: ["digitaliser*", "digital*"], terms: ["digitaliser*", "digitali*", "digital transformation", "digital"] },
  { id: "e-services", label_sv: "e-tjänster", sv: ["e-tjänst*", "självservice*", "medborgartjänst*"], terms: ["e-tjänst*", "e-service*", "e-government", "digital public service*", "online service*"] },
  { id: "ai", label_sv: "AI", sv: ["ai", "artificiell* intelligens*", "maskininlärning*"], terms: ["ai", "artificial intelligence", "machine learning"] },
  { id: "data", label_sv: "data och öppna data", sv: ["öppna data", "datadriv*", "dataplattform*", "digital* tvilling*"], terms: ["öppna data", "open data", "data-driven", "data driven", "data platform*", "digital twin*"] },
  { id: "cyber", label_sv: "cybersäkerhet", sv: ["cybersäkerhet*", "informationssäkerhet*"], terms: ["cybersäkerhet*", "cybersecurity", "cyber security", "information security"] },
  { id: "broadband", label_sv: "bredband", sv: ["bredband*", "fiber*"], terms: ["bredband*", "broadband", "fibre", "fiber"] },
  { id: "welfare-tech", label_sv: "välfärdsteknik", sv: ["välfärdsteknik*", "e-hälsa*", "distansvård*", "trygghetslarm*"], terms: ["välfärdsteknik*", "e-hälsa*", "welfare technolog*", "assistive technolog*", "ambient assisted living", "telecare", "telehealth", "ehealth", "e-health"] },
  { id: "elderly", label_sv: "äldre", sv: ["äldre*", "äldreomsorg*", "hemtjänst*", "seniorer*"], terms: ["äldre*", "äldreomsorg*", "hemtjänst*", "elderly", "older people", "older adults", "ageing", "aging", "senior*", "home care", "long-term care"] },
  { id: "health", label_sv: "hälsa och vård", sv: ["hälsa*", "folkhälsa*", "vård*", "sjukvård*"], terms: ["folkhälsa*", "public health", "health", "healthcare", "health care", "wellbeing", "well-being"] },
  { id: "mental-health", label_sv: "psykisk hälsa", sv: ["psykisk* hälsa*", "psykisk* ohälsa*", "psykiatri*"], terms: ["psykisk*", "mental health", "mental ill-health", "psychiatr*"] },
  { id: "employment", label_sv: "arbete och sysselsättning", sv: ["arbetsmarknad*", "arbetslös*", "sysselsättning*", "jobb*", "anställningsbar*", "försörjningsstöd*"], terms: ["arbetsmarknad*", "arbetslös*", "sysselsättning*", "employment", "unemploy*", "labour market", "labor market", "job*", "employability"] },
  { id: "youth", label_sv: "unga", sv: ["unga", "ungdom*", "ungdomar*", "neet"], terms: ["unga", "ungdom*", "young people", "youth", "neet*", "young adults"] },
  { id: "migrants", label_sv: "nyanlända och integration", sv: ["nyanländ*", "integration*", "invandrar*", "flykting*", "utrikes födda"], terms: ["nyanländ*", "integration*", "utrikes födda", "migrant*", "refugee*", "newly arrived", "newcomer*", "third-country national*", "asylum"] },
  { id: "skills", label_sv: "kompetensutveckling", sv: ["kompetensutveckl*", "kompetensförsörjning*", "kompetenslyft*", "vidareutbild*", "omställning*"], terms: ["kompetensutveckl*", "kompetensförsörjning*", "kompetenslyft*", "skills", "upskill*", "reskill*", "competence development", "lifelong learning", "vocational"] },
  { id: "education", label_sv: "utbildning och skola", sv: ["utbildning*", "skola", "skolor*", "skolan*", "grundskol*", "gymnasi*", "elev*", "lärare*"], terms: ["skola", "skolor*", "skolan*", "grundskol*", "gymnasi*", "elev*", "school*", "pupil*", "teacher*", "education*"] },
  { id: "preschool", label_sv: "förskola", sv: ["förskol*"], terms: ["förskol*", "preschool*", "pre-school*", "early childhood", "kindergarten*"] },
  { id: "adult-education", label_sv: "vuxenutbildning", sv: ["vuxenutbild*", "komvux*", "sfi"], terms: ["vuxenutbild*", "komvux*", "adult education", "adult learning", "adult learners"] },
  { id: "language", label_sv: "språk", sv: ["språkstöd*", "språkutveckling*", "svenska som andraspråk"], terms: ["språkstöd*", "språkutveckling*", "language learning", "language skills", "language training"] },
  { id: "inclusion", label_sv: "social inkludering", sv: ["inkludering*", "utanförskap*", "segregation*", "fattigdom*", "socialt hållbar*"], terms: ["inkludering*", "utanförskap*", "social inclusion", "social exclusion", "segregation", "poverty", "marginalised", "marginalized", "deprived"] },
  { id: "gender", label_sv: "jämställdhet", sv: ["jämställd*"], terms: ["jämställd*", "gender equality", "gender"] },
  { id: "disability", label_sv: "funktionsnedsättning", sv: ["funktionsnedsätt*", "funktionshind*", "tillgänglighet*"], terms: ["funktionsnedsätt*", "disabilit*", "accessibility"] },
  { id: "civil-society", label_sv: "civilsamhälle", sv: ["civilsamhälle*", "föreningsliv*", "idéburen*", "ideell*"], terms: ["civilsamhälle*", "idéburen*", "civil society", "ngo*", "non-profit*", "volunteer*"] },
  { id: "culture", label_sv: "kultur", sv: ["kultur*", "konst*", "bibliotek*"], terms: ["kultur*", "culture", "cultural", "arts", "librar*"] },
  { id: "heritage", label_sv: "kulturarv", sv: ["kulturarv*", "kulturmiljö*"], terms: ["kulturarv*", "cultural heritage", "heritage"] },
  { id: "tourism", label_sv: "turism", sv: ["turism*", "besöksnäring*"], terms: ["turism*", "besöksnäring*", "tourism", "visitor*"] },
  { id: "rural", label_sv: "landsbygd", sv: ["landsbygd*"], terms: ["landsbygd*", "rural"] },
  { id: "urban", label_sv: "stadsutveckling", sv: ["stadsutveckl*", "stadsplaner*", "stadsdel*", "samhällsplaner*", "fysisk planering"], terms: ["stadsutveckl*", "stadsplaner*", "urban development", "urban planning", "urban regeneration", "neighbourhood*", "neighborhood*", "spatial planning"] },
  { id: "smart-city", label_sv: "smart stad", sv: ["smart stad", "smarta städer", "smart* stad*"], terms: ["smart stad", "smart city", "smart cities"] },
  { id: "participation", label_sv: "medborgardialog", sv: ["medborgardialog*", "delaktighet*", "medskapande*", "samskap*"], terms: ["medborgardialog*", "delaktighet*", "citizen participation", "citizen engagement", "co-creation", "co-design", "participatory"] },
  { id: "procurement", label_sv: "upphandling", sv: ["upphandl*", "innovationsupphandl*"], terms: ["upphandl*", "procurement", "public purchas*"] },
  { id: "business", label_sv: "företag och entreprenörskap", sv: ["företag*", "småföretag*", "entreprenör*", "näringsliv*", "startup*"], terms: ["småföretag*", "entreprenör*", "näringsliv*", "sme", "smes", "entrepreneur*", "start-up*", "startup*"] },
  { id: "innovation", label_sv: "innovation och testbäddar", sv: ["innovation*", "testbädd*", "living lab*"], terms: ["innovation*", "testbädd*", "testbed*", "test bed*", "living lab*", "pilot*"] },
  { id: "housing", label_sv: "bostäder", sv: ["bostad*", "bostäder*", "flerbostadshus*", "hyresrätt*", "boende*"], terms: ["flerbostadshus*", "bostäder*", "housing", "residential", "apartment*", "multi-family", "dwelling*"] },
  { id: "homelessness", label_sv: "hemlöshet", sv: ["hemlös*"], terms: ["hemlös*", "homeless*"] },
  { id: "safety", label_sv: "trygghet och brottsförebyggande", sv: ["trygghet*", "brottsförebygg*", "våldsförebygg*"], terms: ["trygghet*", "brottsförebygg*", "crime prevention", "public safety", "safer"] },
  { id: "preparedness", label_sv: "krisberedskap", sv: ["krisberedskap*", "beredskap*", "civilt försvar"], terms: ["krisberedskap*", "beredskap*", "preparedness", "emergency", "crisis management", "civil protection", "disaster risk"] },
];

function stemMatches(stem: string, word: string): boolean {
  return stem.endsWith("*") ? word.startsWith(stem.slice(0, -1)) : word === stem;
}

/** Lowercased text as a padded, single-spaced word string, for the
 * word-start searches below. */
export function searchableText(text: string): string {
  return ` ${text.toLowerCase().replace(/[^a-z0-9åäöéü\s-]/g, " ").replace(/\s+/g, " ")} `;
}

/** Whether a term ("heat wave*", "ai") occurs in a searchableText. */
export function termOccurs(term: string, text: string): boolean {
  const prefix = term.endsWith("*");
  const needle = ` ${prefix ? term.slice(0, -1) : term}${prefix ? "" : " "}`;
  return text.includes(needle);
}

/** The concepts a Swedish (or English) idea text mentions. Multi-word
 * stems ("biologisk mångfald") are looked up as phrases. */
export function conceptsInText(text: string): Concept[] {
  const padded = searchableText(text);
  const words = padded.trim().split(" ");
  return CONCEPTS.filter((c) =>
    c.sv.some((stem) => (stem.includes(" ") ? termOccurs(stem, padded) : words.some((w) => stemMatches(stem, w))))
  );
}

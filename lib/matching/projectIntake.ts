import Papa from "papaparse";
import { ProjectBankEntry, Sector } from "@/lib/types";

// Turns a municipality's own investment-plan-style CSV export into project
// bank entries. A spreadsheet won't have half of ProjectBankEntry's fields
// (AI readiness, missing-field callouts, bilingual labels) — those are
// derived here with the same kind of heuristics the readiness scorer uses,
// so a freshly imported row gets an honest, if rougher, assessment rather
// than a fabricated one.

const SECTOR_KEYWORDS: [RegExp, Sector][] = [
  [/energi|solcell|värme|ventilation/i, "energy"],
  [/klimat|miljö|hållbar|cirkulär|avfall/i, "climate"],
  [/digital|ai\b|it-|system|data/i, "digital"],
  [/social|omsorg|äldre|barn|integration/i, "social"],
  [/mobilitet|trafik|transport|cykel|infrastruktur/i, "mobility"],
  [/utbildning|skola|elev|lärare|vuxenutbildning/i, "education"],
  [/hälsa|vård|sjuk/i, "health"],
  [/forskning|innovation|pilot/i, "research"],
];

function guessSector(text: string): Sector {
  for (const [pattern, sector] of SECTOR_KEYWORDS) {
    if (pattern.test(text)) return sector;
  }
  return "digital";
}

const QUANTIFIED_PATTERN = /\d+\s?(%|procent|mwh|kwh|kr|sek|mnkr|deltagare|personer)/i;

function computeImportedReadiness(description: string, hasOwner: boolean, hasBudget: boolean): {
  score: number;
  missing_sv: string[];
  missing_en: string[];
} {
  const missing_sv: string[] = [];
  const missing_en: string[] = [];
  let score = 40;

  if (description.length > 200) {
    score += 20;
  } else {
    missing_sv.push("Mer utförlig projektbeskrivning");
    missing_en.push("A more detailed project description");
  }

  if (QUANTIFIED_PATTERN.test(description)) {
    score += 20;
  } else {
    missing_sv.push("Kvantifierad förväntad effekt (t.ex. MWh, %, antal deltagare)");
    missing_en.push("A quantified expected effect (e.g. MWh, %, number of participants)");
  }

  if (hasOwner) {
    score += 10;
  } else {
    missing_sv.push("Utsedd projektägare");
    missing_en.push("A designated project owner");
  }

  if (hasBudget) {
    score += 10;
  } else {
    missing_sv.push("Uppskattad budget");
    missing_en.push("An estimated budget");
  }

  missing_sv.push("Möjlighet till internationellt partnerskap");
  missing_en.push("Potential for an international partnership");

  return { score: Math.min(95, score), missing_sv, missing_en };
}

function slugify(input: string, fallback: string): string {
  const s = input
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
  return s || fallback;
}

function parseNumber(raw: string | undefined): number {
  if (!raw) return 0;
  const digits = raw.replace(/[^\d]/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

function getField(row: Record<string, string>, ...names: string[]): string {
  const keys = Object.keys(row);
  for (const name of names) {
    const key = keys.find((k) => k.trim().toLowerCase() === name.toLowerCase());
    if (key && row[key]) return row[key].trim();
  }
  return "";
}

export interface ImportResult {
  entries: ProjectBankEntry[];
  errors: string[];
}

export function parseProjectsCsv(csvText: string): ImportResult {
  const parsed = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = parsed.errors.map((e) => `Rad ${e.row ?? "?"}: ${e.message}`);
  const entries: ProjectBankEntry[] = [];
  const usedIds = new Set<string>();
  const currentYear = new Date().getFullYear();

  parsed.data.forEach((row, i) => {
    const title = getField(row, "titel", "title", "projekt", "projektnamn");
    if (!title) {
      errors.push(`Rad ${i + 2}: saknar titel, hoppar över.`);
      return;
    }

    const department = getField(row, "förvaltning", "department", "avdelning") || "Ej angiven";
    const owner = getField(row, "ägare", "projektägare", "owner", "kontaktperson");
    const description = getField(row, "beskrivning", "description") || title;
    const budgetRaw = getField(row, "budget", "kostnad", "cost", "estimatedcost");
    const startRaw = getField(row, "startår", "start", "startyear");
    const endRaw = getField(row, "slutår", "slut", "end", "endyear");
    const sectorRaw = getField(row, "sektor", "tema", "sector", "theme");
    const partnerRaw = getField(row, "internationell partner", "international partner", "partner");

    const estimatedCostSEK = parseNumber(budgetRaw);
    const periodStart = parseInt(startRaw, 10) || currentYear + 1;
    const periodEnd = parseInt(endRaw, 10) || periodStart + 2;
    const sector = sectorRaw ? guessSector(sectorRaw) : guessSector(`${title} ${description}`);
    const hasInternationalPartner = /^(ja|yes|true|1|x)$/i.test(partnerRaw.trim());

    const readiness = computeImportedReadiness(description, Boolean(owner), estimatedCostSEK > 0);

    let id = `import-${slugify(title, `projekt-${i}`)}`;
    while (usedIds.has(id)) id = `${id}-2`;
    usedIds.add(id);

    entries.push({
      id,
      title_sv: title,
      title_en: title,
      department_sv: department,
      department_en: department,
      owner: owner || "—",
      status: "idea",
      estimatedCostSEK,
      periodStart,
      periodEnd,
      sector,
      description_sv: description,
      description_en: description,
      hasInternationalPartner,
      aiReadinessPct: readiness.score,
      missingFields_sv: readiness.missing_sv,
      missingFields_en: readiness.missing_en,
    });
  });

  return { entries, errors };
}

export const CSV_TEMPLATE = `Titel,Förvaltning,Ägare,Budget,Startår,Slutår,Sektor,Beskrivning,Internationell partner
Exempel: Solceller på idrottshallar,Fastighet,Anna Andersson,45000000,2028,2030,Energi,"Installation av solceller och energilager på 8 idrottshallar för att minska nettoenergianvändningen.",Nej
`;

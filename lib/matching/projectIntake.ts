import Papa from "papaparse";
import { PartnerLevel, ProjectBankEntry, Sector } from "@/lib/types";
import {
  ALL_ACTIVITY_TYPES,
  ALL_REGIONS,
  ALL_TARGET_GROUPS,
  activityTypeLabel,
  partnerLevelLabel,
  regionLabel,
  targetGroupLabel,
} from "@/lib/data/matchingVocabulary";
import { ALL_APPLICANT_TYPES, applicantTypeLabel } from "@/lib/data/fundingCalls";
import { ALL_TAGS } from "@/lib/data/tags";
import { projectMatchingFields } from "@/lib/matching/portfolio";

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

// Excludes currency units (kr/sek/mnkr) for the same reason as the
// readiness/coach engines: a budget figure isn't a quantified effect, and
// every imported row already has a separate budget field.
const QUANTIFIED_PATTERN = /\d+\s?(%|procent|mwh|kwh|co2e?|ton\b|deltagare|personer)/i;

function computeImportedReadiness(
  description: string,
  hasOwner: boolean,
  hasBudget: boolean,
  hasInternationalPartner: boolean
): {
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

  if (!hasInternationalPartner) {
    missing_sv.push("Möjlighet till internationellt partnerskap");
    missing_en.push("Potential for an international partnership");
  }

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

// Naively stripping every non-digit character (the previous approach) turns
// "450 000,50 kr" into "45000050" — about 100x too large — by deleting the
// decimal separator along with the currency text and thousands spaces. This
// keeps exactly one separator as the decimal point and treats the rest as
// thousands separators, handling both Swedish ("450 000,50") and plain
// ("450000.50" / "450.000" / "450000") styles.
function parseNumber(raw: string | undefined): number {
  if (!raw) return 0;
  let cleaned = raw.trim().replace(/[^\d,.\-]/g, "");
  if (!cleaned) return 0;

  const lastComma = cleaned.lastIndexOf(",");
  const lastDot = cleaned.lastIndexOf(".");

  if (lastComma !== -1 && lastDot !== -1) {
    // Both separators present — whichever comes last is the decimal point.
    cleaned = lastComma > lastDot ? cleaned.replace(/\./g, "").replace(",", ".") : cleaned.replace(/,/g, "");
  } else if (lastComma !== -1) {
    // Only a comma: a Swedish decimal comma has 1-2 digits after it,
    // otherwise it's a thousands separator (e.g. "1,000").
    const decimals = cleaned.length - lastComma - 1;
    cleaned = decimals <= 2 ? cleaned.replace(",", ".") : cleaned.replace(/,/g, "");
  } else if (lastDot !== -1) {
    const decimals = cleaned.length - lastDot - 1;
    if (decimals > 2) cleaned = cleaned.replace(/\./g, ""); // thousands-style dot, e.g. "450.000"
  }

  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

function getField(row: Record<string, string>, ...names: string[]): string {
  const keys = Object.keys(row);
  for (const name of names) {
    const key = keys.find((k) => k.trim().toLowerCase() === name.toLowerCase());
    if (key && row[key]) return row[key].trim();
  }
  return "";
}

// ---------------------------------------------------------------------------
// The columns — one definition that the template, the parser and the
// import panel's help all read, so they can't drift apart as projects gain
// fields. Every column but Titel is optional; the matching columns take the
// same values as the intake form's lists (Swedish or English label, or the
// short first word, e.g. "Investering"), and several values in one cell are
// separated by commas.
// ---------------------------------------------------------------------------

export type CsvColumnKey =
  | "title"
  | "department"
  | "owner"
  | "budget"
  | "requestedGrant"
  | "start"
  | "end"
  | "sector"
  | "secondarySectors"
  | "activityType"
  | "targetGroups"
  | "region"
  | "applicantType"
  | "partnership"
  | "tags"
  | "description";

export interface CsvColumn {
  key: CsvColumnKey;
  /** The template's header — Swedish, like the rest of the template. */
  header: string;
  /** Other headers accepted on import (older templates, English exports). */
  aliases: string[];
  multiple?: boolean;
}

export const CSV_COLUMNS: CsvColumn[] = [
  { key: "title", header: "Titel", aliases: ["title", "projekt", "projektnamn"] },
  { key: "department", header: "Förvaltning", aliases: ["department", "avdelning"] },
  { key: "owner", header: "Ägare", aliases: ["projektägare", "owner", "kontaktperson"] },
  { key: "budget", header: "Budget", aliases: ["total budget", "kostnad", "cost", "estimatedcost"] },
  { key: "requestedGrant", header: "Sökt EU-bidrag", aliases: ["sökt bidrag", "requested grant", "eu-bidrag"] },
  { key: "start", header: "Startår", aliases: ["start", "startyear"] },
  { key: "end", header: "Slutår", aliases: ["slut", "end", "endyear"] },
  { key: "sector", header: "Sektor", aliases: ["huvudsakligt område", "tema", "sector", "theme"] },
  { key: "secondarySectors", header: "Övriga sektorer", aliases: ["övriga områden", "other sectors"], multiple: true },
  { key: "activityType", header: "Typ av insats", aliases: ["insats", "activity type"] },
  { key: "targetGroups", header: "Målgrupp", aliases: ["målgrupper", "target groups", "target group"], multiple: true },
  { key: "region", header: "Län", aliases: ["region", "county"] },
  { key: "applicantType", header: "Organisationstyp", aliases: ["sökande organisationstyp", "applicant type"] },
  { key: "partnership", header: "Partnerskap", aliases: ["internationell partner", "international partner", "partner", "partnership"] },
  { key: "tags", header: "Taggar", aliases: ["tags"], multiple: true },
  { key: "description", header: "Beskrivning", aliases: ["description"] },
];

/** Lower-case, å/ä → a, ö → o, é → e, anything else non-alphanumeric → "-". */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[åä]/g, "a")
    .replace(/ö/g, "o")
    .replace(/é/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

const withoutExamples = (label: string) => label.replace(/\s*\(.*\)$/, "");
const firstWord = (label: string) => withoutExamples(label).split(/\s+/)[0];

/** Every way a value may be written: its key, its labels, the labels
 * without their parenthesised examples, and — where that's unambiguous —
 * their first word. */
function aliasesFor(key: string, labels: string[], extra: string[], short: boolean): string[] {
  return [key, ...labels, ...labels.map(withoutExamples), ...(short ? labels.map(firstWord) : []), ...extra].map(normalize);
}

export interface CsvVocabulary<T extends string> {
  values: T[];
  /** What the template and the help show, e.g. "Investering". */
  display: (value: T) => string;
  /** Every value as display() shows it, in list order. */
  displayValues: string[];
  match: (raw: string) => T | undefined;
}

function vocabulary<T extends string>(
  entries: { value: T; labels: string[]; extra?: string[]; display: string }[],
  { short = true }: { short?: boolean } = {}
): CsvVocabulary<T> {
  const lookup = new Map<string, T>();
  for (const e of entries) {
    // What the template and the help show is always accepted too.
    for (const alias of aliasesFor(e.value, e.labels, [e.display, ...(e.extra ?? [])], short)) if (alias && !lookup.has(alias)) lookup.set(alias, e.value);
  }
  return {
    values: entries.map((e) => e.value),
    display: (value) => entries.find((e) => e.value === value)?.display ?? value,
    displayValues: entries.map((e) => e.display),
    match: (raw) => lookup.get(normalize(raw)),
  };
}

const SECTOR_VALUES: { value: Sector; sv: string; en: string }[] = [
  { value: "energy", sv: "Energi", en: "Energy" },
  { value: "climate", sv: "Klimat och miljö", en: "Climate and environment" },
  { value: "digital", sv: "Digitalisering", en: "Digital" },
  { value: "social", sv: "Social omsorg", en: "Social care" },
  { value: "mobility", sv: "Mobilitet och transport", en: "Mobility and transport" },
  { value: "education", sv: "Utbildning", en: "Education" },
  { value: "health", sv: "Hälsa", en: "Health" },
  { value: "research", sv: "Forskning och innovation", en: "Research and innovation" },
];

export const CSV_VOCABULARIES = {
  sector: vocabulary(SECTOR_VALUES.map((s) => ({ value: s.value, labels: [s.sv, s.en], display: s.sv }))),
  activityType: vocabulary(
    ALL_ACTIVITY_TYPES.map((a) => ({
      value: a,
      labels: [activityTypeLabel(a, "sv"), activityTypeLabel(a, "en")],
      display: firstWord(activityTypeLabel(a, "sv")),
    }))
  ),
  targetGroup: vocabulary(
    ALL_TARGET_GROUPS.map((g) => ({
      value: g,
      labels: [targetGroupLabel(g, "sv"), targetGroupLabel(g, "en")],
      display: withoutExamples(targetGroupLabel(g, "sv")),
    }))
  ),
  region: vocabulary(
    ALL_REGIONS.map((r) => ({
      value: r,
      labels: [regionLabel(r)],
      extra: [`${regionLabel(r)} län`, `region ${regionLabel(r)}`],
      display: regionLabel(r),
    }))
  ),
  applicantType: vocabulary(
    ALL_APPLICANT_TYPES.map((a) => ({
      value: a,
      labels: [applicantTypeLabel(a, "sv"), applicantTypeLabel(a, "en")],
      display: applicantTypeLabel(a, "sv"),
    }))
  ),
  partnerLevel: vocabulary<PartnerLevel>([
    { value: "none", labels: [partnerLevelLabel("none", "sv"), partnerLevelLabel("none", "en")], extra: ["nej", "ingen", "no"], display: "Inga" },
    { value: "national", labels: [partnerLevelLabel("national", "sv"), partnerLevelLabel("national", "en")], extra: ["sverige", "nationell"], display: "Sverige" },
    // "Ja" is what the old "Internationell partner" column held.
    { value: "international", labels: [partnerLevelLabel("international", "sv"), partnerLevelLabel("international", "en")], extra: ["ja", "yes", "true", "x", "1", "internationell"], display: "Internationell" },
    { value: "consortium", labels: [partnerLevelLabel("consortium", "sv"), partnerLevelLabel("consortium", "en")], extra: ["konsortium"], display: "Konsortium" },
  ], { short: false }),
  tag: vocabulary(
    ALL_TAGS.map((tag) => ({ value: tag.id, labels: [tag.label_sv, tag.label_en], display: tag.label_sv })),
    { short: false }
  ),
};

function splitCell(raw: string): string[] {
  return raw
    .split(/[,;|]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export interface ImportResult {
  entries: ProjectBankEntry[];
  errors: string[];
}

// `existingIds` should be every id already in the project bank (seeded +
// previously imported) — without it, re-importing the same file twice
// regenerates the exact same slugified ids both times (this function's own
// dedup set starts empty on every call), so the second import silently adds
// entries whose id collides with the first import's. Passing the current
// ids in makes id generation idempotent across repeated imports, not just
// within one file.
export function parseProjectsCsv(csvText: string, existingIds: Iterable<string> = []): ImportResult {
  // Comma or semicolon (Swedish Excel's default) — Papa detects which.
  const parsed = Papa.parse<Record<string, string>>(csvText.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: true,
  });

  const errors: string[] = parsed.errors.map((e) => `Rad ${e.row ?? "?"}: ${e.message}`);
  const entries: ProjectBankEntry[] = [];
  const usedIds = new Set<string>(existingIds);
  const currentYear = new Date().getFullYear();
  const column = (row: Record<string, string>, key: CsvColumnKey) => {
    const col = CSV_COLUMNS.find((c) => c.key === key)!;
    return getField(row, col.header, ...col.aliases);
  };

  parsed.data.forEach((row, i) => {
    const line = i + 2;
    const title = column(row, "title");
    if (!title) {
      errors.push(`Rad ${line}: saknar titel, hoppar över.`);
      return;
    }
    // A value that isn't in the column's list is reported and left out,
    // rather than guessed — the rest of the row is still imported.
    const unknown = (header: string, value: string) => errors.push(`Rad ${line}: okänt värde "${value}" i ${header}, utelämnas.`);
    const one = <T extends string>(key: CsvColumnKey, vocab: CsvVocabulary<T>): T | undefined => {
      const raw = column(row, key);
      if (!raw) return undefined;
      const value = vocab.match(raw);
      if (!value) unknown(CSV_COLUMNS.find((c) => c.key === key)!.header, raw);
      return value;
    };
    const many = <T extends string>(key: CsvColumnKey, vocab: CsvVocabulary<T>): T[] => {
      const values: T[] = [];
      for (const raw of splitCell(column(row, key))) {
        const value = vocab.match(raw);
        if (!value) unknown(CSV_COLUMNS.find((c) => c.key === key)!.header, raw);
        else if (!values.includes(value)) values.push(value);
      }
      return values;
    };

    const department = column(row, "department") || "Ej angiven";
    const owner = column(row, "owner");
    const description = column(row, "description") || title;
    const estimatedCostSEK = parseNumber(column(row, "budget"));
    const requestedGrantSEK = parseNumber(column(row, "requestedGrant"));
    const periodStart = parseInt(column(row, "start"), 10) || currentYear + 1;
    const periodEnd = parseInt(column(row, "end"), 10) || periodStart + 2;

    // The main sector: one of the list's values, else guessed from the
    // cell's words (or, without one, from the title and description).
    const sectorRaw = column(row, "sector");
    const sector = (sectorRaw && CSV_VOCABULARIES.sector.match(sectorRaw)) || guessSector(sectorRaw || `${title} ${description}`);
    const secondarySectors = many("secondarySectors", CSV_VOCABULARIES.sector).filter((s) => s !== sector);
    const activityType = one("activityType", CSV_VOCABULARIES.activityType);
    const targetGroups = many("targetGroups", CSV_VOCABULARIES.targetGroup);
    const region = one("region", CSV_VOCABULARIES.region);
    const applicantType = one("applicantType", CSV_VOCABULARIES.applicantType);
    const partnerLevel = one("partnership", CSV_VOCABULARIES.partnerLevel);
    const tags = many("tags", CSV_VOCABULARIES.tag);
    const hasInternationalPartner = partnerLevel === "international" || partnerLevel === "consortium";

    if (requestedGrantSEK > 0 && estimatedCostSEK > 0 && requestedGrantSEK > estimatedCostSEK) {
      errors.push(`Rad ${line}: sökt EU-bidrag är större än budgeten.`);
    }

    const readiness = computeImportedReadiness(description, Boolean(owner), estimatedCostSEK > 0, hasInternationalPartner);

    const baseId = `import-${slugify(title, `projekt-${i}`)}`;
    let id = baseId;
    let suffix = 2;
    while (usedIds.has(id)) id = `${baseId}-${suffix++}`;
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
      ...(tags.length > 0 ? { tags } : {}),
      ...projectMatchingFields({
        activityType,
        secondarySectors,
        targetGroups,
        region,
        applicantType,
        partnerLevel,
        requestedGrantSEK: requestedGrantSEK || undefined,
      }),
    });
  });

  return { entries, errors };
}

// Semicolon-separated, which is what Excel with Swedish settings opens into
// columns (and saves back); the import reads commas as well.
function csvRow(values: string[]): string {
  return values.map((v) => (/[;"\n]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v)).join(";");
}

export const CSV_TEMPLATE =
  [
    csvRow(CSV_COLUMNS.map((c) => c.header)),
    csvRow([
      "Exempel: Solceller på idrottshallar",
      "Fastighet",
      "Anna Andersson",
      "45000000",
      "20000000",
      "2028",
      "2030",
      "Energi",
      "Klimat och miljö",
      "Investering",
      "",
      "Västra Götaland",
      "Kommun",
      "Inga",
      "Grön stadsutveckling",
      "Installation av solceller och energilager på 8 idrottshallar för att minska nettoenergianvändningen med 1 200 MWh per år.",
    ]),
    csvRow([
      "Exempel: Kompetenslyft inom äldreomsorgen",
      "Vård och omsorg",
      "Erik Svensson",
      "8000000",
      "",
      "2027",
      "2029",
      "Social omsorg",
      "Utbildning, Hälsa",
      "Kompetensutveckling",
      "Anställda och personal, Äldre",
      "Västra Götaland",
      "Kommun",
      "Sverige",
      "Utbildning och kompetensutveckling, Social inkludering",
      "Utbildningsinsatser för 300 medarbetare i äldreomsorgen inom digitala arbetssätt och språk.",
    ]),
  ].join("\n") + "\n";

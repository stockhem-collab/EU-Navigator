import {
  ActivityType,
  ApplicantType,
  EvaluationCriterion,
  ReportingPeriodicity,
  SwedishRegion,
  TargetGroup,
} from "@/lib/types";
import { ALL_REGIONS, regionLabel } from "@/lib/data/matchingVocabulary";

// A deliberately simple, deterministic, rule-based first pass over a
// pasted utlysningstext — standing in for what a real AI-assisted
// extraction step would do, without an actual model call (this demo makes
// no live AI calls anywhere, on principle: see the reporting-cycle and
// AI-dependency discussions this tool grew out of). It never publishes
// anything on its own: every field it proposes carries a "detected" or
// "default" confidence flag, and Datacenter's import review form requires
// a person to look at every field — most obviously the "default" ones —
// before a call is saved. Good enough to save typing on the fields that
// are usually easy to spot in real call text; anything subtler (the
// application form's own structure) is left for the reviewer to enter by
// hand rather than guessed at unreliably. Evaluation criteria are only
// picked up when written as "Name – 30 poäng", one per line.

export type ExtractionConfidence = "detected" | "default";

export interface ExtractedField<T> {
  value: T;
  confidence: ExtractionConfidence;
}

export interface ExtractedCallDraft {
  budgetTotalSEK: ExtractedField<number>;
  minGrantSEK: ExtractedField<number>;
  maxGrantSEK: ExtractedField<number>;
  requiresPartnership: ExtractedField<boolean>;
  applicantTypes: ExtractedField<ApplicantType[]>;
  priorities_sv: ExtractedField<string[]>;
  periodicity: ExtractedField<ReportingPeriodicity>;
  requiresAuditAboveSEK: ExtractedField<number | null>;
  // Fields matching (lib/matching/scoreMatch.ts) reads beyond the above.
  minPartnerCountries: ExtractedField<number | null>;
  activityTypes: ExtractedField<ActivityType[]>;
  targetGroups: ExtractedField<TargetGroup[]>;
  eligibleRegions: ExtractedField<SwedishRegion[]>;
  /** ISO date (YYYY-MM-DD) of the application deadline. */
  deadlineDate: ExtractedField<string | null>;
  /** Share of eligible costs the grant covers, 0–1. */
  coFinancingRate: ExtractedField<number | null>;
  evaluationCriteria: ExtractedField<EvaluationCriterion[]>;
}

const SCALE_WORDS: [RegExp, number][] = [
  [/miljarder|miljard/i, 1_000_000_000],
  [/miljoner|miljon|mnkr/i, 1_000_000],
  [/tusen|tkr/i, 1_000],
];

function parseAmount(numberPart: string, scaleWord: string | undefined): number {
  const cleaned = numberPart.replace(/\s/g, "").replace(/\./g, "").replace(",", ".");
  const n = parseFloat(cleaned);
  if (!Number.isFinite(n)) return 0;
  const scale = SCALE_WORDS.find(([pattern]) => scaleWord && pattern.test(scaleWord))?.[1] ?? 1;
  return Math.round(n * scale);
}

const AMOUNT_PATTERN = /([\d][\d\s.,]*)\s*(miljarder|miljard|miljoner|miljon|mnkr|tkr|tusen)?\s*(?:kr|kronor|sek)\b/gi;

function findAllAmounts(text: string): number[] {
  return [...text.matchAll(AMOUNT_PATTERN)].map((m) => parseAmount(m[1], m[2])).filter((n) => n > 0);
}

const APPLICANT_TYPE_KEYWORDS: [RegExp, ApplicantType][] = [
  [/kommunala? bolag/i, "municipal-company"],
  [/kommun/i, "municipality"],
  [/region/i, "region"],
  [/lärosäte|universitet|högskola/i, "university"],
  [/utbildningsanordnare/i, "training-provider"],
  [/\bsme\b|småföretag|små och medelstora/i, "sme"],
  [/stora företag|storföretag/i, "large-enterprise"],
  [/civilsamhälle|ideell/i, "ngo"],
  [/(?:statlig|nationell) myndighet/i, "national-authority"],
  [/forskningsinstitut/i, "research-institute"],
];

/** Reads an organisation-type free-text value (e.g. the organisation
 * profile's "Kommun") as an ApplicantType — the first category it names,
 * in the same precedence as the call-text detection above (so "Kommunalt
 * bolag" is a municipal company, not a municipality). Undefined when the
 * text doesn't name any known category. */
export function applicantTypeFromText(text: string): ApplicantType | undefined {
  return APPLICANT_TYPE_KEYWORDS.find(([pattern]) => pattern.test(text))?.[1];
}

const ACTIVITY_TYPE_KEYWORDS: [RegExp, ActivityType][] = [
  [/investering|infrastruktur|ombyggnad|renovering|anläggning/i, "investment"],
  [/kompetensutveckling|kompetenslyft|kompetensförsörjning|utbildningsinsats/i, "competence"],
  [/forskning/i, "research"],
  [/pilot|demonstration|testbädd/i, "pilot"],
  [/samverkan|erfarenhetsutbyte|nätverk/i, "cooperation"],
];

const TARGET_GROUP_KEYWORDS: [RegExp, TargetGroup][] = [
  [/elever|studerande|studenter/i, "pupils"],
  [/(?<![\wåäö])unga(?![\wåäö])|ungdomar/i, "young"],
  [/arbetssökande|arbetslösa/i, "unemployed"],
  [/nyanlända/i, "newly-arrived"],
  [/anställda|medarbetare|yrkesverksamma/i, "employees"],
  [/(?<![\wåäö])äldre(?![\wåäö])/i, "elderly"],
  [/funktionsnedsättning/i, "disabilities"],
];

const NUMBER_WORDS: Record<string, number> = { två: 2, tre: 3, fyra: 4, fem: 5, sex: 6 };

// "minst tre länder" = three countries in total; "minst två andra länder"
// = two besides the applicant's own, i.e. three in total.
function detectMinPartnerCountries(text: string): number | null {
  const m = text.match(/minst\s+(två|tre|fyra|fem|sex|\d+)\s+(andra\s+)?(?:olika\s+)?(?:[\wåäö-]+\s+)?(?:[\wåäö]+-)?länder/i);
  if (!m) return null;
  const n = NUMBER_WORDS[m[1].toLowerCase()] ?? Number(m[1]);
  if (!Number.isFinite(n) || n < 1) return null;
  return m[2] ? n + 1 : n;
}

// Only county names in a sentence that's actually about the geographic
// scope — a call text naming a county in passing (an example project, a
// contact office) mustn't restrict the call to it.
function detectRegions(text: string): SwedishRegion[] {
  const scopeSentences = sentencesOf(text)
    .filter((sentence) => /programområde|geografiskt område|stödberättigat område|följande län/i.test(sentence));
  const found = new Set<SwedishRegion>();
  for (const sentence of scopeSentences) {
    for (const region of ALL_REGIONS) {
      const name = regionLabel(region).split(" ")[0];
      // \b doesn't treat å/ä/ö as word characters, so "Örebro" needs an
      // explicit boundary.
      if (new RegExp(`(?<![\\wåäö])${name}`, "i").test(sentence)) found.add(region);
    }
  }
  return [...found];
}

const SWEDISH_MONTHS = ["januari", "februari", "mars", "april", "maj", "juni", "juli", "augusti", "september", "oktober", "november", "december"];

function detectDeadlineDate(text: string): string | null {
  const sentences = sentencesOf(text)
    .filter((sentence) => /sista ansökningsdag|deadline|senast|stänger|ansökningstiden/i.test(sentence));
  for (const sentence of sentences) {
    const iso = sentence.match(/\b(20\d{2})-(\d{2})-(\d{2})\b/);
    if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
    const written = sentence.match(new RegExp(`\\b(\\d{1,2})\\s+(${SWEDISH_MONTHS.join("|")})\\s+(20\\d{2})\\b`, "i"));
    if (written) {
      const month = SWEDISH_MONTHS.indexOf(written[2].toLowerCase()) + 1;
      return `${written[3]}-${String(month).padStart(2, "0")}-${written[1].padStart(2, "0")}`;
    }
  }
  return null;
}

// The grant's share of eligible costs — only from a sentence that says so
// explicitly ("stödnivå", "% av de stödberättigande kostnaderna"), since a
// bare "medfinansiering 40 %" could equally mean the applicant's share.
function detectCoFinancingRate(text: string): number | null {
  const sentence = sentencesOf(text)
    .find((s) => /stödnivå|stödandel|%\s*av\s*(?:de\s+)?stödberättigande|procent\s+av\s+(?:de\s+)?stödberättigande/i.test(s));
  const m = sentence?.match(/(\d{1,3})\s*(?:%|procent)/i);
  if (!m) return null;
  const pct = Number(m[1]);
  return pct > 0 && pct <= 100 ? pct / 100 : null;
}

// "Relevans – 30 poäng", "Genomförande: 20 p", "Effekt (25 poäng)"
const CRITERION_LINE = /^\s*(?:[-•*]|\d+[.)])?\s*([A-Za-zÅÄÖåäö][^:–—(\d]{1,60}?)\s*(?:[:–—-]|\()\s*(\d{1,3})\s*(?:poäng|p\b)/i;

function detectEvaluationCriteria(text: string): EvaluationCriterion[] {
  return text
    .split("\n")
    .map((line) => line.match(CRITERION_LINE))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ name_sv: m[1].trim(), name_en: m[1].trim(), maxPoints: Number(m[2]) }));
}

function detectAll<T>(text: string, keywords: [RegExp, T][]): T[] {
  return Array.from(new Set(keywords.filter(([pattern]) => pattern.test(text)).map(([, value]) => value)));
}

function listField<T>(values: T[]): ExtractedField<T[]> {
  return values.length > 0 ? { value: values, confidence: "detected" } : { value: [], confidence: "default" };
}

function nullableField<T>(value: T | null): ExtractedField<T | null> {
  return value !== null ? { value, confidence: "detected" } : { value: null, confidence: "default" };
}

function sentencesOf(text: string): string[] {
  return text.split(/(?<=[.!?])\s+|\n/);
}

// The call's total budget — only "detected" from a sentence that says it's
// the total. Falling back to the largest amount anywhere in the text used
// to report a grant ceiling ("mellan 5 och 80 miljoner per projekt") as the
// total budget with a "found in the text" badge; now the fallback skips
// per-project and audit amounts and is marked as a default to check.
function detectTotalBudget(text: string): ExtractedField<number> {
  const sentences = sentencesOf(text);
  const budgetSentence = sentences.find(
    (s) =>
      /total(?:a)?\s+budget|totalt|sammanlagt|budgetram|avsätts|avsatt|budgeten för utlysningen|finns\s+.*\s+att\s+söka/i.test(s) &&
      findAllAmounts(s).length > 0
  );
  if (budgetSentence) return { value: Math.max(...findAllAmounts(budgetSentence)), confidence: "detected" };

  const otherAmounts = sentences
    .filter((s) => !/per\s+projekt|mellan\s+.*\s+och|revision|revisor/i.test(s))
    .flatMap(findAllAmounts);
  return { value: otherAmounts.length > 0 ? Math.max(...otherAmounts) : 0, confidence: "default" };
}

export function extractCallDraft(text: string): ExtractedCallDraft {
  const budgetTotalSEK = detectTotalBudget(text);

  const rangeMatch = text.match(
    /mellan\s+([\d\s.,]+)\s*(miljarder|miljard|miljoner|miljon|mnkr|tkr|tusen)?\s*(?:kr|kronor|sek)?\s+och\s+([\d\s.,]+)\s*(miljarder|miljard|miljoner|miljon|mnkr|tkr|tusen)?\s*(?:kr|kronor|sek)?/i
  );
  let minGrantSEK: ExtractedField<number>;
  let maxGrantSEK: ExtractedField<number>;
  if (rangeMatch) {
    minGrantSEK = { value: parseAmount(rangeMatch[1], rangeMatch[2]), confidence: "detected" };
    maxGrantSEK = { value: parseAmount(rangeMatch[3], rangeMatch[4]), confidence: "detected" };
  } else {
    // No explicit range sentence found — fall back to a fraction of the
    // detected total budget as a starting point the reviewer must confirm.
    const base = budgetTotalSEK.value;
    minGrantSEK = { value: Math.round(base * 0.02), confidence: "default" };
    maxGrantSEK = { value: Math.round(base * 0.5), confidence: "default" };
  }

  const requiresPartnership: ExtractedField<boolean> = /partnerskap|konsorti|minst\s+(två|tre|\d+)\s+(länder|organisationer|partner)/i.test(
    text
  )
    ? { value: true, confidence: "detected" }
    : { value: false, confidence: "default" };

  const detectedApplicantTypes = Array.from(
    new Set(APPLICANT_TYPE_KEYWORDS.filter(([pattern]) => pattern.test(text)).map(([, type]) => type))
  );
  const applicantTypes: ExtractedField<ApplicantType[]> =
    detectedApplicantTypes.length > 0 ? { value: detectedApplicantTypes, confidence: "detected" } : { value: [], confidence: "default" };

  const bulletLines = text
    .split("\n")
    .filter((line) => /^\s*([-•*]|\d+[.)])\s*\S/.test(line) && !CRITERION_LINE.test(line))
    .map((line) => line.trim().replace(/^[-•*]\s*/, "").replace(/^\d+[.)]\s*/, ""))
    .filter((line) => line.length > 0 && line.length < 160);
  const priorities_sv: ExtractedField<string[]> =
    bulletLines.length > 0
      ? { value: bulletLines.slice(0, 6), confidence: "detected" }
      : { value: [], confidence: "default" };

  let periodicity: ExtractedField<ReportingPeriodicity> = { value: "annual", confidence: "default" };
  if (/kvartalsvis|varje kvartal/i.test(text)) periodicity = { value: "quarterly", confidence: "detected" };
  else if (/halvår/i.test(text)) periodicity = { value: "biannual", confidence: "detected" };
  else if (/årlig|årsvis|en gång per år/i.test(text)) periodicity = { value: "annual", confidence: "detected" };

  let requiresAuditAboveSEK: ExtractedField<number | null> = { value: null, confidence: "default" };
  const auditSentenceMatch = text.match(/[^.]*revisor[^.]*\./i) ?? text.match(/[^.]*revision[^.]*\./i);
  if (auditSentenceMatch) {
    const amountsInSentence = findAllAmounts(auditSentenceMatch[0]);
    if (amountsInSentence.length > 0) requiresAuditAboveSEK = { value: amountsInSentence[0], confidence: "detected" };
  }

  const minPartnerCountries = nullableField(detectMinPartnerCountries(text));

  return {
    budgetTotalSEK,
    minGrantSEK,
    maxGrantSEK,
    // A stated minimum number of countries implies a partnership.
    requiresPartnership:
      minPartnerCountries.value !== null && minPartnerCountries.value > 1
        ? { value: true, confidence: "detected" }
        : requiresPartnership,
    applicantTypes,
    priorities_sv,
    periodicity,
    requiresAuditAboveSEK,
    minPartnerCountries,
    activityTypes: listField(detectAll(text, ACTIVITY_TYPE_KEYWORDS)),
    targetGroups: listField(detectAll(text, TARGET_GROUP_KEYWORDS)),
    eligibleRegions: listField(detectRegions(text)),
    deadlineDate: nullableField(detectDeadlineDate(text)),
    coFinancingRate: nullableField(detectCoFinancingRate(text)),
    evaluationCriteria: listField(detectEvaluationCriteria(text)),
  };
}

/** A short, URL-safe id from a call title plus a counter suffix to avoid
 * colliding with the seed catalogue or an earlier import — same pattern as
 * projectIntake.ts's imported-project ids. */
export function slugifyCallId(title: string, existingIds: string[]): string {
  const base =
    title
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40) || "utlysning";
  let candidate = base;
  let suffix = 2;
  while (existingIds.includes(candidate)) {
    candidate = `${base}-${suffix}`;
    suffix += 1;
  }
  return candidate;
}

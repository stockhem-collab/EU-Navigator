import { ApplicantType, ReportingPeriodicity } from "@/lib/types";

// A deliberately simple, deterministic, rule-based first pass over a
// pasted utlysningstext — standing in for what a real AI-assisted
// extraction step would do, without an actual model call (this demo makes
// no live AI calls anywhere, on principle: see the reporting-cycle and
// AI-dependency discussions this tool grew out of). It never publishes
// anything on its own: every field it proposes carries a "detected" or
// "default" confidence flag, and Datacenter's import review form requires
// a person to look at every field — most obviously the "default" ones —
// before a call is saved. Good enough to save typing on the fields that
// are usually easy to spot in real call text; anything subtler
// (evaluationCriteria weights, the application form's own structure) is
// left for the reviewer to enter by hand rather than guessed at unreliably.

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

export function extractCallDraft(text: string): ExtractedCallDraft {
  const amounts = findAllAmounts(text);
  const budgetTotalSEK: ExtractedField<number> = amounts.length > 0 ? { value: Math.max(...amounts), confidence: "detected" } : { value: 0, confidence: "default" };

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
    .filter((line) => /^\s*([-•*]|\d+[.)])\s*\S/.test(line))
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

  return { budgetTotalSEK, minGrantSEK, maxGrantSEK, requiresPartnership, applicantTypes, priorities_sv, periodicity, requiresAuditAboveSEK };
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

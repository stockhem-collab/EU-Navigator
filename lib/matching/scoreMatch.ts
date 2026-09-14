import { EvaluationCriterion, FundingCall, FundingProgram, MatchResult, ProjectInput, RationaleLine } from "@/lib/types";
import { findProgram } from "@/lib/data/fundingPrograms";

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zåäö0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function keywordOverlapCount(project: ProjectInput, program: FundingProgram, call: FundingCall): string[] {
  const projectWords = new Set([
    ...normalizeWords(project.title),
    ...normalizeWords(project.description),
  ]);
  const allKeywords = [...program.keywords, ...call.extraKeywords];
  return allKeywords.filter((kw) => kw.split(/\s+/).every((part) => projectWords.has(part.toLowerCase())));
}

function budgetFit(project: ProjectInput, call: FundingCall): "in-range" | "partial" | "off" {
  const { budgetSEK } = project;
  const { minGrantSEK, maxGrantSEK } = call;
  if (budgetSEK >= minGrantSEK && budgetSEK <= maxGrantSEK) return "in-range";
  const lower = minGrantSEK * 0.4;
  const upper = maxGrantSEK * 2;
  if (budgetSEK >= lower && budgetSEK <= upper) return "partial";
  return "off";
}

function durationFit(project: ProjectInput, program: FundingProgram): boolean {
  const years = project.endYear - project.startYear;
  const [min, max] = program.typicalDurationYears;
  return years >= min - 1 && years <= max + 1;
}

export function fmtMSEK(n: number): string {
  return (n / 1_000_000).toLocaleString("sv-SE", { maximumFractionDigits: 0 });
}

// scoreMatch groups its signals into two buckets — "thematic fit" (sector +
// keyword overlap) and "implementation fit" (budget + partnership +
// duration) — and blends them 60/40 by default. But calls carry their own
// real evaluationCriteria (e.g. Relevance 30, Impact 30, Quality 20,
// Implementation 20, extracted from real call documents), which is shown to
// the user as if it's how the application gets judged. Ignoring it and
// always applying the fixed 60/40 split would mean the displayed criteria
// and the actual score are unrelated to each other. Instead, a call whose
// own criteria weight "quality"/"implementation" more heavily shifts more of
// the match score onto the implementation bucket, and vice versa — an
// honest (if still heuristic) use of real data, not a fabricated per-
// criterion mapping we have no way to actually measure.
const RELEVANCE_CRITERION_PATTERN = /relevan|priorit|impact|effekt|alignment|koppling/i;
const IMPLEMENTATION_CRITERION_PATTERN =
  /kvalit|quality|genomför|implement|resurs|budget|kapacitet|organisat|efficien|effektivitet/i;

interface CriteriaWeights {
  thematicPct: number; // 0-1, share of the 100 match points from thematic fit
  implementationPct: number; // 0-1, share from budget/partnership/duration fit
}

// Mirrors the previous fixed split (sector 35 + keywords 25 = 60,
// budget 20 + partnership 15 + duration 5 = 40) — used whenever a call's
// criteria names don't say anything the classifier recognises, so scoring
// never silently changes for a call with generic/unlabelled criteria.
const DEFAULT_WEIGHTS: CriteriaWeights = { thematicPct: 0.6, implementationPct: 0.4 };

function criteriaWeights(criteria: EvaluationCriterion[]): CriteriaWeights {
  let relevancePoints = 0;
  let implementationPoints = 0;
  for (const c of criteria) {
    if (RELEVANCE_CRITERION_PATTERN.test(c.name_sv) || RELEVANCE_CRITERION_PATTERN.test(c.name_en)) {
      relevancePoints += c.maxPoints;
    } else if (IMPLEMENTATION_CRITERION_PATTERN.test(c.name_sv) || IMPLEMENTATION_CRITERION_PATTERN.test(c.name_en)) {
      implementationPoints += c.maxPoints;
    }
  }
  const total = relevancePoints + implementationPoints;
  if (total === 0) return DEFAULT_WEIGHTS;
  return { thematicPct: relevancePoints / total, implementationPct: implementationPoints / total };
}

export function scoreMatch(project: ProjectInput, call: FundingCall, program: FundingProgram): MatchResult {
  const rationale: RationaleLine[] = [];
  let thematicScore = 0; // nominal max 60
  let implementationScore = 0; // nominal max 40 (can go to -10 on a missing required partner)

  // Sector alignment (max 35 of the thematic bucket)
  const sectorMatch = program.sectors.includes(project.sector);
  if (sectorMatch) {
    thematicScore += 35;
    rationale.push({
      type: "positive",
      category: "sector",
      text_sv: `Stark koppling till sektorn "${sectorLabel(project.sector, "sv")}"`,
      text_en: `Strong alignment with the "${sectorLabel(project.sector, "en")}" sector`,
    });
  }

  // Keyword overlap (max 25 of the thematic bucket)
  const matchedKeywords = keywordOverlapCount(project, program, call);
  const keywordScore = Math.min(25, matchedKeywords.length * 6);
  thematicScore += keywordScore;
  if (matchedKeywords.length > 0) {
    rationale.push({
      type: "positive",
      category: "keywords",
      text_sv: `Projektbeskrivningen matchar ${matchedKeywords.length} nyckelbegrepp i utlysningens prioriteringar (t.ex. "${matchedKeywords[0]}")`,
      text_en: `Your project description matches ${matchedKeywords.length} key terms in the call's priorities (e.g. "${matchedKeywords[0]}")`,
    });
  } else if (!sectorMatch) {
    rationale.push({
      type: "warning",
      category: "keywords",
      text_sv: "Svag tematisk koppling mellan projektet och utlysningens prioriteringar",
      text_en: "Weak thematic overlap between the project and the call's priorities",
      deltaIfFixed: 15,
    });
  }

  // Budget fit (max 20 of the implementation bucket)
  const fit = budgetFit(project, call);
  if (fit === "in-range") {
    implementationScore += 20;
    rationale.push({
      type: "positive",
      category: "budget",
      text_sv: `Budget inom utlysningens intervall (${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)} mnkr)`,
      text_en: `Budget within the call's range (SEK ${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)}M)`,
    });
  } else if (fit === "partial") {
    implementationScore += 8;
    rationale.push({
      type: "warning",
      category: "budget",
      text_sv: "Projektets budget ligger delvis utanför utlysningens intervall",
      text_en: "Your budget is partly outside the call's range",
      deltaIfFixed: 12,
    });
  } else {
    rationale.push({
      type: "warning",
      category: "budget",
      text_sv: "Projektets budget avviker kraftigt från utlysningens intervall",
      text_en: "Your budget deviates significantly from the call's range",
      deltaIfFixed: 20,
    });
  }

  // Partnership requirement (max 15 of the implementation bucket, can penalize)
  if (call.requiresPartnership) {
    if (project.hasInternationalPartner) {
      implementationScore += 15;
      rationale.push({
        type: "positive",
        category: "partnership",
        text_sv: "Kravet på internationellt partnerskap/konsortium är uppfyllt",
        text_en: "The requirement for an international partner/consortium is met",
      });
    } else {
      implementationScore -= 10;
      rationale.push({
        type: "warning",
        category: "partnership",
        text_sv: "Utlysningen kräver internationellt partnerskap – inte angivet för detta projekt",
        text_en: "This call requires an international partner — none indicated for this project",
        deltaIfFixed: 25,
      });
    }
  } else {
    implementationScore += 5;
  }

  // Duration fit (max 5 of the implementation bucket)
  if (durationFit(project, program)) {
    implementationScore += 5;
  } else {
    rationale.push({
      type: "neutral",
      category: "duration",
      text_sv: `Projektets tidsplan avviker något från utlysningens typiska projektlängd (${program.typicalDurationYears[0]}–${program.typicalDurationYears[1]} år)`,
      text_en: `Your timeline differs somewhat from the call's typical project length (${program.typicalDurationYears[0]}–${program.typicalDurationYears[1]} years)`,
      deltaIfFixed: 5,
    });
  }

  // Blend the two buckets by the call's own real evaluation-criteria split
  // instead of a universal fixed ratio (see criteriaWeights above). For a
  // call whose criteria wording doesn't map to either bucket, this reduces
  // to exactly the old fixed-60/40 formula.
  const weights = criteriaWeights(call.evaluationCriteria);
  const thematicMaxContribution = weights.thematicPct * 100;
  const implementationMaxContribution = weights.implementationPct * 100;
  const thematicRatio = thematicMaxContribution / 60;
  const implementationRatio = implementationMaxContribution / 40;

  // Rescale each gap's point-upside by the same ratio, so a gap in a bucket
  // this call's own criteria weight more heavily also shows a proportionally
  // larger "fix this to gain N points" — keeping gapAnalysis's potential-
  // score consistent with the score it's built from.
  for (const line of rationale) {
    if (line.deltaIfFixed === undefined) continue;
    const ratio = line.category === "keywords" ? thematicRatio : implementationRatio;
    line.deltaIfFixed = Math.round(line.deltaIfFixed * ratio);
  }

  let score = thematicScore * thematicRatio + implementationScore * implementationRatio;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));

  let recommendation: MatchResult["recommendation"] = "low";
  if (score >= 75) recommendation = "proceed";
  else if (score >= 50) recommendation = "consider";

  const estimatedFundingSEK: [number, number] = [
    Math.round(project.budgetSEK * program.typicalCoFinancingRate * 0.7),
    Math.round(project.budgetSEK * program.typicalCoFinancingRate),
  ];

  rationale.push({
    type: "neutral",
    category: "deadline",
    text_sv: `Nästa deadline om cirka ${call.deadlineMonthsFromNow} månader`,
    text_en: `Next deadline in approximately ${call.deadlineMonthsFromNow} months`,
  });

  return { call, program, score, stars, rationale, recommendation, estimatedFundingSEK };
}

export function computeMatches(project: ProjectInput, calls: FundingCall[]): MatchResult[] {
  return calls
    .map((call) => {
      const program = findProgram(call.programId);
      if (!program) return null;
      return scoreMatch(project, call, program);
    })
    .filter((m): m is MatchResult => m !== null)
    .sort((a, b) => b.score - a.score);
}

const sectorLabels: Record<string, { sv: string; en: string }> = {
  energy: { sv: "energi", en: "energy" },
  climate: { sv: "klimat", en: "climate" },
  digital: { sv: "digitalisering", en: "digital" },
  social: { sv: "social omsorg", en: "social care" },
  mobility: { sv: "mobilitet", en: "mobility" },
  education: { sv: "utbildning", en: "education" },
  health: { sv: "hälsa", en: "health" },
  research: { sv: "forskning", en: "research" },
};

export function sectorLabel(sector: string, lang: "sv" | "en"): string {
  return sectorLabels[sector]?.[lang] ?? sector;
}

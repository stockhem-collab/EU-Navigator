import { FundingCall, FundingProgram, MatchResult, ProjectInput, RationaleLine } from "@/lib/types";
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

export function scoreMatch(project: ProjectInput, call: FundingCall, program: FundingProgram): MatchResult {
  const rationale: RationaleLine[] = [];
  let score = 0;

  // Sector alignment (max 35)
  const sectorMatch = program.sectors.includes(project.sector);
  if (sectorMatch) {
    score += 35;
    rationale.push({
      type: "positive",
      category: "sector",
      text_sv: `Stark koppling till sektorn "${sectorLabel(project.sector, "sv")}"`,
      text_en: `Strong alignment with the "${sectorLabel(project.sector, "en")}" sector`,
    });
  }

  // Keyword overlap (max 25)
  const matchedKeywords = keywordOverlapCount(project, program, call);
  const keywordScore = Math.min(25, matchedKeywords.length * 6);
  score += keywordScore;
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

  // Budget fit (max 20)
  const fit = budgetFit(project, call);
  if (fit === "in-range") {
    score += 20;
    rationale.push({
      type: "positive",
      category: "budget",
      text_sv: `Budget inom utlysningens intervall (${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)} mnkr)`,
      text_en: `Budget within the call's range (SEK ${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)}M)`,
    });
  } else if (fit === "partial") {
    score += 8;
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

  // Partnership requirement (max 15, can penalize)
  if (call.requiresPartnership) {
    if (project.hasInternationalPartner) {
      score += 15;
      rationale.push({
        type: "positive",
        category: "partnership",
        text_sv: "Kravet på internationellt partnerskap/konsortium är uppfyllt",
        text_en: "The requirement for an international partner/consortium is met",
      });
    } else {
      score -= 10;
      rationale.push({
        type: "warning",
        category: "partnership",
        text_sv: "Utlysningen kräver internationellt partnerskap – inte angivet för detta projekt",
        text_en: "This call requires an international partner — none indicated for this project",
        deltaIfFixed: 25,
      });
    }
  } else {
    score += 5;
  }

  // Duration fit (max 5)
  if (durationFit(project, program)) {
    score += 5;
  } else {
    rationale.push({
      type: "neutral",
      category: "duration",
      text_sv: `Projektets tidsplan avviker något från utlysningens typiska projektlängd (${program.typicalDurationYears[0]}–${program.typicalDurationYears[1]} år)`,
      text_en: `Your timeline differs somewhat from the call's typical project length (${program.typicalDurationYears[0]}–${program.typicalDurationYears[1]} years)`,
      deltaIfFixed: 5,
    });
  }

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

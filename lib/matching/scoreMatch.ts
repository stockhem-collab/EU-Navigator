import { FundingProgram, MatchResult, ProjectInput, RationaleLine } from "@/lib/types";

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zåäö0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function keywordOverlapCount(project: ProjectInput, program: FundingProgram): string[] {
  const projectWords = new Set([
    ...normalizeWords(project.title),
    ...normalizeWords(project.description),
  ]);
  return program.keywords.filter((kw) =>
    kw.split(/\s+/).every((part) => projectWords.has(part.toLowerCase()))
  );
}

function budgetFit(project: ProjectInput, program: FundingProgram): "in-range" | "partial" | "off" {
  const { budgetSEK } = project;
  const { minBudgetSEK, maxBudgetSEK } = program;
  if (budgetSEK >= minBudgetSEK && budgetSEK <= maxBudgetSEK) return "in-range";
  const lower = minBudgetSEK * 0.4;
  const upper = maxBudgetSEK * 2;
  if (budgetSEK >= lower && budgetSEK <= upper) return "partial";
  return "off";
}

function durationFit(project: ProjectInput, program: FundingProgram): boolean {
  const years = project.endYear - project.startYear;
  const [min, max] = program.typicalDurationYears;
  return years >= min - 1 && years <= max + 1;
}

function fmtMSEK(n: number): string {
  return (n / 1_000_000).toLocaleString("sv-SE", { maximumFractionDigits: 0 });
}

export function scoreMatch(project: ProjectInput, program: FundingProgram): MatchResult {
  const rationale: RationaleLine[] = [];
  let score = 0;

  // Sector alignment (max 35)
  const sectorMatch = program.sectors.includes(project.sector);
  if (sectorMatch) {
    score += 35;
    rationale.push({
      type: "positive",
      text_sv: `Stark koppling till sektorn "${sectorLabel(project.sector, "sv")}"`,
      text_en: `Strong alignment with the "${sectorLabel(project.sector, "en")}" sector`,
    });
  }

  // Keyword overlap (max 25)
  const matchedKeywords = keywordOverlapCount(project, program);
  const keywordScore = Math.min(25, matchedKeywords.length * 6);
  score += keywordScore;
  if (matchedKeywords.length > 0) {
    rationale.push({
      type: "positive",
      text_sv: `Projektbeskrivningen matchar ${matchedKeywords.length} nyckelbegrepp i programmets prioriteringar (t.ex. "${matchedKeywords[0]}")`,
      text_en: `Your project description matches ${matchedKeywords.length} key terms in the programme's priorities (e.g. "${matchedKeywords[0]}")`,
    });
  } else if (!sectorMatch) {
    rationale.push({
      type: "warning",
      text_sv: "Svag tematisk koppling mellan projektet och programmets prioriteringar",
      text_en: "Weak thematic overlap between the project and the programme's priorities",
    });
  }

  // Budget fit (max 20)
  const fit = budgetFit(project, program);
  if (fit === "in-range") {
    score += 20;
    rationale.push({
      type: "positive",
      text_sv: `Budget inom programmets typiska intervall (${fmtMSEK(program.minBudgetSEK)}–${fmtMSEK(
        program.maxBudgetSEK
      )} mnkr)`,
      text_en: `Budget within the programme's typical range (SEK ${fmtMSEK(
        program.minBudgetSEK
      )}–${fmtMSEK(program.maxBudgetSEK)}M)`,
    });
  } else if (fit === "partial") {
    score += 8;
    rationale.push({
      type: "warning",
      text_sv: "Projektets budget ligger delvis utanför programmets typiska storlek",
      text_en: "Your budget is partly outside the programme's typical project size",
    });
  } else {
    rationale.push({
      type: "warning",
      text_sv: "Projektets budget avviker kraftigt från programmets typiska storlek",
      text_en: "Your budget deviates significantly from the programme's typical project size",
    });
  }

  // Partnership requirement (max 15, can penalize)
  if (program.requiresPartnership) {
    if (project.hasInternationalPartner) {
      score += 15;
      rationale.push({
        type: "positive",
        text_sv: "Kravet på internationellt partnerskap/konsortium är uppfyllt",
        text_en: "The requirement for an international partner/consortium is met",
      });
    } else {
      score -= 10;
      rationale.push({
        type: "warning",
        text_sv: "Programmet kräver internationellt partnerskap – inte angivet för detta projekt",
        text_en: "This programme requires an international partner — none indicated for this project",
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
      text_sv: `Projektets tidsplan avviker något från programmets typiska projektlängd (${program.typicalDurationYears[0]}–${program.typicalDurationYears[1]} år)`,
      text_en: `Your timeline differs somewhat from the programme's typical project length (${program.typicalDurationYears[0]}–${program.typicalDurationYears[1]} years)`,
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
    text_sv: `Nästa deadline om cirka ${program.nextDeadlineMonthsFromNow} månader`,
    text_en: `Next deadline in approximately ${program.nextDeadlineMonthsFromNow} months`,
  });

  return { program, score, stars, rationale, recommendation, estimatedFundingSEK };
}

export function computeMatches(project: ProjectInput, programs: FundingProgram[]): MatchResult[] {
  return programs
    .map((program) => scoreMatch(project, program))
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

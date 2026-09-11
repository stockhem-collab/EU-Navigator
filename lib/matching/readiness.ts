import { MatchResult, ProjectInput, ReadinessBreakdown } from "@/lib/types";

const IMPACT_PATTERN = /\d+\s?(%|procent|percent|mwh|kwh|co2|co2e|ton|kr|sek|mnkr)/i;
const INDICATOR_PATTERN = /\d+\s?(deltagare|elever|personer|participants|students|people|byggnader|buildings)/i;

// Most EU funds require applicants to address a set of "horizontal
// principles" (jämställdhet, tillgänglighet, icke-diskriminering, ekologisk
// hållbarhet) — real evaluation criteria used by e.g. Svenska ESF-rådet and
// Tillväxtverket, not an invented dimension.
const HORIZONTAL_PRINCIPLES_PATTERN =
  /jämställd|jämlik|tillgänglig|icke-diskriminer|mångfald|inklud|hållbar|miljö|gender|equalit|accessib|inclusi|sustainab/i;

function budgetDimensionScore(match: MatchResult): number {
  const budgetLine = match.rationale.find((r) => r.category === "budget");
  if (!budgetLine) return 100;
  if (budgetLine.type === "positive") return 100;
  if (budgetLine.deltaIfFixed === 12) return 70;
  return 40;
}

export function computeReadiness(project: ProjectInput, match: MatchResult): ReadinessBreakdown {
  const sectorMatch = match.program.sectors.includes(project.sector);
  const budgetScore = budgetDimensionScore(match);

  const eligibility = Math.round((sectorMatch ? 60 : 20) + budgetScore * 0.4);

  const logicScore =
    project.description.length > 220 ? 92 : project.description.length > 120 ? 78 : 45;

  const impactScore = IMPACT_PATTERN.test(project.description) ? 85 : 32;

  const partnershipScore = !match.call.requiresPartnership
    ? 100
    : project.hasInternationalPartner
    ? 100
    : 30;

  const indicatorsScore = INDICATOR_PATTERN.test(project.description) ? 82 : 40;

  const horizontalPrinciplesScore = HORIZONTAL_PRINCIPLES_PATTERN.test(project.description) ? 85 : 35;

  const documentationScore = 91;

  const dims: ReadinessBreakdown["dimensions"] = [
    {
      key: "strategic",
      label_sv: "Strategisk matchning",
      label_en: "Strategic match",
      score: match.score,
    },
    {
      key: "eligibility",
      label_sv: "Eligibility",
      label_en: "Eligibility",
      score: eligibility,
      action_sv: eligibility < 80 ? "Kontrollera att projektet uppfyller utlysningens grundläggande behörighetskrav." : undefined,
      action_en: eligibility < 80 ? "Confirm the project meets the call's basic eligibility requirements." : undefined,
    },
    {
      key: "logic",
      label_sv: "Projektlogik",
      label_en: "Project logic",
      score: logicScore,
      action_sv: logicScore < 80 ? "Beskriv problem, mål och aktiviteter mer utförligt och konkret." : undefined,
      action_en: logicScore < 80 ? "Describe the problem, goal and activities more thoroughly and concretely." : undefined,
    },
    {
      key: "impact",
      label_sv: "Impact",
      label_en: "Impact",
      score: impactScore,
      action_sv: impactScore < 80 ? "Ange en kvantifierad förväntad effekt (t.ex. MWh, %, antal deltagare)." : undefined,
      action_en: impactScore < 80 ? "State a quantified expected effect (e.g. MWh, %, number of participants)." : undefined,
    },
    {
      key: "budget",
      label_sv: "Budget",
      label_en: "Budget",
      score: budgetScore,
      action_sv: budgetScore < 80 ? "Justera budgeten mot utlysningens intervall eller motivera avvikelsen." : undefined,
      action_en: budgetScore < 80 ? "Align the budget with the call's range, or justify the deviation." : undefined,
    },
    {
      key: "partnership",
      label_sv: "Partnerskap",
      label_en: "Partnership",
      score: partnershipScore,
      action_sv: partnershipScore < 80 ? "Säkra en internationell partner eller ett konsortium innan ansökan." : undefined,
      action_en: partnershipScore < 80 ? "Secure an international partner or consortium before applying." : undefined,
    },
    {
      key: "indicators",
      label_sv: "Indikatorer",
      label_en: "Indicators",
      score: indicatorsScore,
      action_sv: indicatorsScore < 80 ? "Definiera mätbara indikatorer med tydligt utgångsvärde och målvärde." : undefined,
      action_en: indicatorsScore < 80 ? "Define measurable indicators with a clear baseline and target." : undefined,
    },
    {
      key: "horizontalPrinciples",
      label_sv: "Horisontella principer",
      label_en: "Horizontal principles",
      score: horizontalPrinciplesScore,
      action_sv:
        horizontalPrinciplesScore < 80
          ? "Beskriv hur projektet arbetar med jämställdhet, tillgänglighet, icke-diskriminering och/eller ekologisk hållbarhet — de flesta fonder kräver detta."
          : undefined,
      action_en:
        horizontalPrinciplesScore < 80
          ? "Describe how the project addresses gender equality, accessibility, non-discrimination and/or environmental sustainability — most funds require this."
          : undefined,
    },
    {
      key: "documentation",
      label_sv: "Dokumentation",
      label_en: "Documentation",
      score: documentationScore,
    },
  ];

  const overall = Math.round(
    dims.reduce((sum, d, i) => {
      const weights = [0.18, 0.13, 0.09, 0.13, 0.09, 0.09, 0.09, 0.1, 0.1];
      return sum + d.score * weights[i];
    }, 0)
  );

  return { overall, dimensions: dims };
}

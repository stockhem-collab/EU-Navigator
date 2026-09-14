import { MatchResult, ProjectInput, ReadinessBreakdown } from "@/lib/types";

// Quantified-value patterns require the number to be immediately followed by
// a *unit specific to that dimension* (not just "any number near a currency
// or percent sign") — otherwise a project description that only ever states
// its budget ("...kostar 45 000 000 kr...") would satisfy the "quantified
// impact" check on the strength of a cost figure alone. Currency units are
// deliberately excluded from IMPACT_PATTERN for this reason: a budget is not
// an impact.
const IMPACT_PATTERN = /\d+\s?(%|procent|percent|mwh|kwh|co2e?|ton\b)/i;
const INDICATOR_PATTERN = /\d+\s?(deltagare|elever|personer|participants|students|people|byggnader|buildings)/i;

// Most EU funds require applicants to address a set of "horizontal
// principles" (jämställdhet, tillgänglighet, icke-diskriminering, ekologisk
// hållbarhet) — real evaluation criteria used by e.g. Svenska ESF-rådet and
// Tillväxtverket, not an invented dimension.
const HORIZONTAL_PRINCIPLES_PATTERN =
  /jämställd|jämlik|tillgänglig|icke-diskriminer|mångfald|inklud|hållbar|miljö|gender|equalit|accessib|inclusi|sustainab/i;

// Readiness used to also carry separate "eligibility"/"budget"/"partnership"
// dimensions — but those are exactly the signals already inside
// match.score ("Strategic match" below), and a "documentation" dimension
// that was a hardcoded constant (91, always, for every project) rather than
// anything measured. Both meant the weighted overall score silently
// triple-counted budget/partnership fit (once via Strategic match, again via
// "eligibility", again via its own dimension) while pretending to measure a
// dimension it didn't. The detailed budget/partnership/eligibility gaps are
// still fully visible to the user via Gap Analysis (computeGapAnalysis),
// right alongside this breakdown — removing them here removes the double
// count without losing that information. What's left are the dimensions
// that are each measuring something genuinely different from the others.
export function computeReadiness(project: ProjectInput, match: MatchResult): ReadinessBreakdown {
  const logicScore = project.description.length > 220 ? 92 : project.description.length > 120 ? 78 : 45;
  const impactScore = IMPACT_PATTERN.test(project.description) ? 85 : 32;
  const indicatorsScore = INDICATOR_PATTERN.test(project.description) ? 82 : 40;
  const horizontalPrinciplesScore = HORIZONTAL_PRINCIPLES_PATTERN.test(project.description) ? 85 : 35;

  const dims: ReadinessBreakdown["dimensions"] = [
    {
      key: "strategic",
      label_sv: "Strategisk matchning",
      label_en: "Strategic match",
      score: match.score,
      weight: 0.4,
    },
    {
      key: "logic",
      label_sv: "Projektlogik",
      label_en: "Project logic",
      score: logicScore,
      weight: 0.15,
      action_sv: logicScore < 80 ? "Beskriv problem, mål och aktiviteter mer utförligt och konkret." : undefined,
      action_en: logicScore < 80 ? "Describe the problem, goal and activities more thoroughly and concretely." : undefined,
    },
    {
      key: "impact",
      label_sv: "Impact",
      label_en: "Impact",
      score: impactScore,
      weight: 0.15,
      action_sv: impactScore < 80 ? "Ange en kvantifierad förväntad effekt (t.ex. MWh, %, ton CO2e) — inte bara en budgetsiffra." : undefined,
      action_en: impactScore < 80 ? "State a quantified expected effect (e.g. MWh, %, tonnes CO2e) — not just a budget figure." : undefined,
    },
    {
      key: "indicators",
      label_sv: "Indikatorer",
      label_en: "Indicators",
      score: indicatorsScore,
      weight: 0.15,
      action_sv: indicatorsScore < 80 ? "Definiera mätbara indikatorer med tydligt utgångsvärde och målvärde." : undefined,
      action_en: indicatorsScore < 80 ? "Define measurable indicators with a clear baseline and target." : undefined,
    },
    {
      key: "horizontalPrinciples",
      label_sv: "Horisontella principer",
      label_en: "Horizontal principles",
      score: horizontalPrinciplesScore,
      weight: 0.15,
      action_sv:
        horizontalPrinciplesScore < 80
          ? "Beskriv hur projektet arbetar med jämställdhet, tillgänglighet, icke-diskriminering och/eller ekologisk hållbarhet — de flesta fonder kräver detta."
          : undefined,
      action_en:
        horizontalPrinciplesScore < 80
          ? "Describe how the project addresses gender equality, accessibility, non-discrimination and/or environmental sustainability — most funds require this."
          : undefined,
    },
  ];

  const overall = Math.round(dims.reduce((sum, d) => sum + d.score * d.weight, 0));

  return { overall, dimensions: dims };
}

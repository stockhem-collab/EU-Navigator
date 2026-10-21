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

// A starting point the change is measured from — reviewers ask for it on
// every effect indicator.
const BASELINE_PATTERN = /utgångsvärde|utgångsläge|nuläge|baseline|jämfört med (idag|dagens|nuvarande)|från dagens|compared (with|to) (today|current)/i;

/** What the assessment looks for in a piece of text — exported so the
 * workspace can show, next to each section, what that section contributes. */
export interface TextSignals {
  quantifiedEffect: boolean;
  indicator: boolean;
  baseline: boolean;
  horizontalPrinciples: boolean;
  length: number;
}

export function textSignals(text: string): TextSignals {
  return {
    quantifiedEffect: IMPACT_PATTERN.test(text),
    indicator: INDICATOR_PATTERN.test(text),
    baseline: BASELINE_PATTERN.test(text),
    horizontalPrinciples: HORIZONTAL_PRINCIPLES_PATTERN.test(text),
    length: text.trim().length,
  };
}

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
//
// `text` is what is being assessed: the project description on its own
// (the project page), or — in the application workspace — the description
// plus every section the user has written or edited (see
// assessedApplicationText). Unedited AI suggestions are left out on
// purpose: they are generated from the call's own wording, so counting
// them would let an untouched draft score as if someone had written it.
/** How complete the whole application is — its form, budget, annexes,
 * certificates and formal conditions (summarizeCompleteness in
 * lib/data/applicationRequirements.ts) — for the workspace's assessment. */
export interface CompletenessInput {
  /** 0–100. */
  score: number;
  /** The mandatory requirements still open, in list order. */
  open: { title_sv: string; title_en: string }[];
}

function listTitles(titles: string[], and: string): string {
  const shown = titles.slice(0, 3);
  return shown.length <= 1 ? shown.join("") : `${shown.slice(0, -1).join(", ")} ${and} ${shown[shown.length - 1]}`;
}

/** The completeness dimension: 30 % of the overall score — about as much
 * as the strategic match — so an application that reads well but lacks its
 * sections, annexes or certificates can't look ready. */
export function completenessDimension(completeness: CompletenessInput): ReadinessBreakdown["dimensions"][number] {
  const n = completeness.open.length;
  const missing = n > 0;
  return {
    key: "completeness",
    label_sv: "Färdigställande",
    label_en: "Completeness",
    score: completeness.score,
    weight: 0.3,
    action_sv: missing
      ? `${n === 1 ? "Ett obligatoriskt krav återstår" : `${n} obligatoriska krav återstår`}: ${listTitles(completeness.open.map((o) => o.title_sv), "och")}${n > 3 ? " med flera" : ""}.`
      : undefined,
    action_en: missing
      ? `${n === 1 ? "One mandatory requirement is left" : `${n} mandatory requirements are left`}: ${listTitles(completeness.open.map((o) => o.title_en), "and")}${n > 3 ? " and more" : ""}.`
      : undefined,
  };
}

// `completeness`, when given (the application workspace), adds how
// complete the whole application is as a dimension of its own. The other
// dimensions then share the remaining weight in the same proportions, so
// the project page's readiness (without it) is unchanged.
export function computeReadiness(
  project: ProjectInput,
  match: MatchResult,
  text: string = project.description,
  completeness?: CompletenessInput
): ReadinessBreakdown {
  const signals = textSignals(text);
  const logicScore = signals.length > 220 ? 92 : signals.length > 120 ? 78 : 45;
  const impactScore = signals.quantifiedEffect ? (signals.baseline ? 92 : 85) : 32;
  const indicatorsScore = signals.indicator ? (signals.baseline ? 90 : 82) : 40;
  const horizontalPrinciplesScore = signals.horizontalPrinciples ? 85 : 35;

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

  if (completeness) {
    const dimension = completenessDimension(completeness);
    for (const d of dims) d.weight = Math.round(d.weight * (1 - dimension.weight) * 1000) / 1000;
    dims.push(dimension);
  }

  const overall = Math.round(dims.reduce((sum, d) => sum + d.score * d.weight, 0));

  return { overall, dimensions: dims };
}

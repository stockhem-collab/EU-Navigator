import { MatchResult, ProjectInput, SectionCoachResult } from "@/lib/types";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import { textSignals } from "@/lib/matching/readiness";

// Deliberately excludes currency units (kr/sek/mnkr) — a budget figure is
// not a quantified *effect*, and including them let any project that simply
// stated its cost score as if it had described a measurable outcome.
const QUANTIFIED_PATTERN = /\d+\s?(%|procent|percent|mwh|kwh|co2e?|ton\b|deltagare|participants|personer|people)/i;

// A demonstrative "Application Coach" analysis of the free-text project
// description against the specific call it's being matched to. Deterministic
// heuristics standing in for a real per-call, document-grounded AI review.
// `text` is the text being reviewed — see computeReadiness for what the
// workspace passes (description plus the user's own section text).
export function analyzeSection(project: ProjectInput, match: MatchResult, text: string = project.description): SectionCoachResult {
  const relevance = Math.max(1, Math.min(10, Math.round(match.score / 10)));
  const hasQuantifiedEffect = QUANTIFIED_PATTERN.test(text);
  const hasBaseline = textSignals(text).baseline;
  const impact = hasQuantifiedEffect ? 8 : 3;
  const isDetailed = text.length > 180;
  const evidence = hasQuantifiedEffect && isDetailed ? 8 : hasQuantifiedEffect || isDetailed ? 5 : 3;
  // Neither signal found — the heuristics have nothing concrete to go on,
  // so the feedback below is necessarily generic. That's the natural
  // hand-off point to a real, human-reviewed AI reading of the text,
  // rather than a rule engine guessing at prose it found no pattern in.
  const confidence: SectionCoachResult["confidence"] =
    hasQuantifiedEffect && isDetailed ? "high" : hasQuantifiedEffect || isDetailed ? "medium" : "low";

  const sectorSv = sectorLabel(project.sector, "sv");
  const sectorEn = sectorLabel(project.sector, "en");

  const feedback_sv = hasQuantifiedEffect && hasBaseline
    ? `Ansökan anger både en kvantifierad effekt och ett utgångsvärde att mäta den mot. Beskriv gärna också hur och när effekten följs upp under projektet.`
    : hasQuantifiedEffect
    ? `Beskrivningen kopplar tydligt till utlysningens prioriteringar och innehåller en kvantifierad effekt. Komplettera gärna med utgångsvärde (baseline) så bedömaren kan se förändringen.`
    : `Ansökan beskriver åtgärden väl men saknar kvantifierad effekt. Utlysningen efterfrågar mätbara resultat inom ${sectorSv}. Ange till exempel förväntad förändring i procent eller absoluta tal.`;

  const feedback_en = hasQuantifiedEffect && hasBaseline
    ? `The application states both a quantified effect and a baseline to measure it against. Consider also describing how and when the effect is followed up during the project.`
    : hasQuantifiedEffect
    ? `The description links clearly to the call's priorities and includes a quantified effect. Consider adding a baseline value so the assessor can see the change.`
    : `The application describes the activity well but lacks a quantified effect. The call asks for measurable results in ${sectorEn}. State, for example, the expected change in percent or absolute figures.`;

  const excerpt = `${text.trim().slice(0, 140)}${text.trim().length > 140 ? "…" : ""}`;
  const suggestion_sv = hasQuantifiedEffect && hasBaseline
    ? `Föreslagen komplettering: "Effekten följs upp genom mätning vid projektstart, halvtid och projektslut, och redovisas i varje lägesrapport."`
    : hasQuantifiedEffect
    ? `"${excerpt}" — lägg till: "Utgångsvärdet före projektstart är X, vilket innebär en förväntad förbättring på Y."`
    : `Föreslagen komplettering: "Projektet beräknas ge en mätbar effekt inom ${sectorSv}, motsvarande cirka X enheter/procent per år jämfört med dagens nivå."`;

  const suggestion_en = hasQuantifiedEffect && hasBaseline
    ? `Suggested addition: "The effect is measured at project start, mid-term and project end, and reported in every progress report."`
    : hasQuantifiedEffect
    ? `"${excerpt}" — add: "The baseline before project start is X, implying an expected improvement of Y."`
    : `Suggested addition: "The project is expected to deliver a measurable effect in ${sectorEn}, equivalent to approximately X units/percent per year compared with the current level."`;

  return { relevance, impact, evidence, confidence, feedback_sv, feedback_en, suggestion_sv, suggestion_en };
}

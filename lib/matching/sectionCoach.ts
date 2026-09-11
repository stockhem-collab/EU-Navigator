import { MatchResult, ProjectInput, SectionCoachResult } from "@/lib/types";
import { sectorLabel } from "@/lib/matching/scoreMatch";

const QUANTIFIED_PATTERN = /\d+\s?(%|procent|percent|mwh|kwh|co2|co2e|ton|kr|sek|mnkr|deltagare|participants|personer|people)/i;

// A demonstrative "Application Coach" analysis of the free-text project
// description against the specific call it's being matched to. Deterministic
// heuristics standing in for a real per-call, document-grounded AI review.
export function analyzeSection(project: ProjectInput, match: MatchResult): SectionCoachResult {
  const relevance = Math.max(1, Math.min(10, Math.round(match.score / 10)));
  const hasQuantifiedEffect = QUANTIFIED_PATTERN.test(project.description);
  const impact = hasQuantifiedEffect ? 8 : 3;
  const isDetailed = project.description.length > 180;
  const evidence = hasQuantifiedEffect && isDetailed ? 8 : hasQuantifiedEffect || isDetailed ? 5 : 3;

  const sectorSv = sectorLabel(project.sector, "sv");
  const sectorEn = sectorLabel(project.sector, "en");

  const feedback_sv = hasQuantifiedEffect
    ? `Beskrivningen kopplar tydligt till utlysningens prioriteringar och innehåller en kvantifierad effekt. Komplettera gärna med utgångsvärde (baseline) så bedömaren kan se förändringen.`
    : `Ansökan beskriver åtgärden väl men saknar kvantifierad effekt. Utlysningen efterfrågar mätbara resultat inom ${sectorSv}. Ange till exempel förväntad förändring i procent eller absoluta tal.`;

  const feedback_en = hasQuantifiedEffect
    ? `The description links clearly to the call's priorities and includes a quantified effect. Consider adding a baseline value so the assessor can see the change.`
    : `The application describes the activity well but lacks a quantified effect. The call asks for measurable results in ${sectorEn}. State, for example, the expected change in percent or absolute figures.`;

  const suggestion_sv = hasQuantifiedEffect
    ? `"${project.description.trim().slice(0, 140)}${project.description.length > 140 ? "…" : ""}" — lägg till: "Utgångsvärdet före projektstart är X, vilket innebär en förväntad förbättring på Y."`
    : `Föreslagen komplettering: "Projektet beräknas ge en mätbar effekt inom ${sectorSv}, motsvarande cirka X enheter/procent per år jämfört med dagens nivå."`;

  const suggestion_en = hasQuantifiedEffect
    ? `"${project.description.trim().slice(0, 140)}${project.description.length > 140 ? "…" : ""}" — add: "The baseline before project start is X, implying an expected improvement of Y."`
    : `Suggested addition: "The project is expected to deliver a measurable effect in ${sectorEn}, equivalent to approximately X units/percent per year compared with the current level."`;

  return { relevance, impact, evidence, feedback_sv, feedback_en, suggestion_sv, suggestion_en };
}

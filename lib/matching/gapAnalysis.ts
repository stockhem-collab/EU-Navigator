import { GapAnalysis, MatchResult } from "@/lib/types";

export function computeGapAnalysis(match: MatchResult): GapAnalysis {
  const strengths = match.rationale.filter((r) => r.type === "positive");
  const gaps = match.rationale.filter((r) => r.type === "warning");

  const uplift = gaps.reduce((sum, g) => sum + (g.deltaIfFixed ?? 0), 0);
  const potentialScore = Math.max(match.score, Math.min(100, match.score + uplift));

  return {
    strengths,
    gaps,
    currentScore: match.score,
    potentialScore,
  };
}

import { FundedProject, ProjectInput, SimilarProjectResult } from "@/lib/types";
import { findProgram } from "@/lib/data/fundingPrograms";

// Deterministic "liknande projekt" — no live LLM calls, same principle as
// scoreMatch.ts: a real, explainable signal (keyword overlap between the
// customer's project text and each funded project's text) rather than a
// fabricated similarity score. This is the prototype's stand-in for
// docs/DATA_MODEL.md §2.5's `SimilarProject`, which in a real backend would
// be computed from text embeddings and materialised, not recomputed live.

// Common Swedish function words plus generic municipal-project boilerplate
// ("kommun", "projektet", "verksamhet" …) that would otherwise dominate the
// overlap between almost any two project descriptions without saying
// anything about whether the projects are actually similar.
const STOPWORDS = new Set([
  "och",
  "att",
  "det",
  "den",
  "som",
  "för",
  "med",
  "till",
  "från",
  "inom",
  "genom",
  "samt",
  "eller",
  "men",
  "både",
  "vid",
  "hos",
  "om",
  "har",
  "hade",
  "kan",
  "ska",
  "skall",
  "kommer",
  "vara",
  "blir",
  "blivit",
  "sig",
  "sina",
  "sitt",
  "sina",
  "vår",
  "våra",
  "detta",
  "denna",
  "dessa",
  "vilka",
  "vilken",
  "där",
  "här",
  "även",
  "också",
  "mer",
  "mest",
  "flera",
  "olika",
  "andra",
  "nya",
  "nytt",
  "ökad",
  "ökade",
  "öka",
  "minska",
  "minskad",
  "kommun",
  "kommunen",
  "kommunens",
  "exempelstad",
  "exempelstads",
  "staden",
  "stadens",
  "projekt",
  "projektet",
  "projektets",
  "verksamhet",
  "verksamheten",
  "verksamheter",
  "arbete",
  "arbetet",
  "insats",
  "insatser",
  "insatsen",
  "åtgärd",
  "åtgärder",
  "aktivitet",
  "aktiviteter",
  "utveckla",
  "utveckling",
  "utvecklas",
  "genomföra",
  "genomförs",
  "genomförande",
  "syftar",
  "syfte",
  "bidrar",
  "bidra",
  "bidrog",
  "idag",
  "region",
  "regionen",
  "regionens",
  "kring",
  "behov",
  "behöver",
  "finns",
  "göra",
  "gör",
  "sätt",
  "allt",
  "alla",
  "varje",
  "stort",
  "stora",
  "viktigt",
  "viktiga",
  "delar",
  "fler",
  "många",
]);

export function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-zåäö0-9\s]/gi, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOPWORDS.has(w))
  );
}

function overlap(a: Set<string>, b: Set<string>): { score: number; shared: string[] } {
  const shared = [...a].filter((w) => b.has(w));
  const union = new Set([...a, ...b]).size;
  return { score: union === 0 ? 0 : shared.length / union, shared };
}

const MIN_SCORE = 0.03;
// Rewards a project sharing its sector with the funded project's programme,
// on top of the raw text overlap — a real thematic link even when the exact
// wording differs.
const SECTOR_BONUS = 0.08;

export function computeSimilarProjects(
  project: ProjectInput,
  funded: FundedProject[],
  limit = 3
): SimilarProjectResult[] {
  const projectWords = significantWords(`${project.title} ${project.description}`);
  if (projectWords.size === 0) return [];

  const scored = funded.map((fp) => {
    const fpWords = significantWords(`${fp.title} ${fp.theme_sv} ${fp.description_sv}`);
    const { score, shared } = overlap(projectWords, fpWords);
    const program = findProgram(fp.programId);
    const sectorBonus = program?.sectors.includes(project.sector) ? SECTOR_BONUS : 0;
    return { fp, rawScore: score + sectorBonus, shared };
  });

  return scored
    .filter((s) => s.rawScore >= MIN_SCORE)
    .sort((a, b) => b.rawScore - a.rawScore)
    .slice(0, limit)
    .map((s) => ({
      project: s.fp,
      similarityPct: Math.round(Math.min(1, s.rawScore) * 100),
      sharedKeywords: s.shared.slice(0, 4),
    }));
}

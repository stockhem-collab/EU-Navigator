import { FundedProject } from "@/lib/types";
import { significantWords } from "@/lib/matching/similarProjects";

// "Vad brukar vinna?" — the second feature from the same idea as
// similarProjects.ts: instead of comparing one customer project against the
// funded-project library, this looks across the whole library for a given
// programme and surfaces the recurring terms, so a coordinator sees what
// kind of projects that programme's calls actually tend to fund before
// writing their own. Still just word-frequency counting — an honest,
// explainable pattern rather than a fabricated "success formula".

export interface KeywordFrequency {
  word: string;
  count: number;
}

const MIN_PROJECTS_FOR_PATTERN = 3;

export function topKeywords(projects: FundedProject[], limit = 8): KeywordFrequency[] {
  if (projects.length < MIN_PROJECTS_FOR_PATTERN) return [];

  const counts = new Map<string, number>();
  for (const p of projects) {
    // Count each word at most once per project — otherwise one
    // keyword-heavy description could dominate the ranking on its own.
    const words = significantWords(`${p.title} ${p.theme_sv} ${p.description_sv}`);
    for (const w of words) counts.set(w, (counts.get(w) ?? 0) + 1);
  }

  return [...counts.entries()]
    .filter(([, count]) => count >= 2) // must recur across at least two projects to count as a pattern
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([word, count]) => ({ word, count }));
}

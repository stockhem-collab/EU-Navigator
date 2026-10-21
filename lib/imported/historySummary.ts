// Totals for the EU history view, computed from the rows that count: the
// sure matches plus any possible matches the user confirmed. Client-safe,
// so the page can recount when a match is confirmed or rejected.
import type { HistoryCandidateRow, HistoryRow, HistoryView } from "./server";

export function candidateAsProject(c: HistoryCandidateRow): HistoryRow {
  return {
    id: c.id,
    source: c.source,
    title: c.title,
    acronym: c.acronym,
    programId: c.programId,
    programme: c.programme,
    period: c.period,
    startDate: c.startDate,
    endDate: c.endDate,
    role: null,
    matchedOn: c.organisationName ? `${c.reason} (${c.organisationName})` : c.reason,
    euContribution: c.euContribution,
    eur: c.eur,
    url: c.url,
    confirmedManually: true,
  };
}

export function summariseHistory(projects: HistoryRow[]): Pick<HistoryView, "totalSek" | "totalEur" | "byProgram"> {
  const byProgram = new Map<string, HistoryView["byProgram"][number]>();
  for (const p of projects) {
    const key = p.programId ?? p.programme;
    const entry = byProgram.get(key) ?? { programId: p.programId, programme: p.programme, projects: 0, sek: 0, eur: 0 };
    entry.projects += 1;
    entry.sek += p.euContribution?.sek ?? 0;
    entry.eur += p.eur;
    byProgram.set(key, entry);
  }
  return {
    totalSek: projects.reduce((s, p) => s + (p.euContribution?.sek ?? 0), 0),
    totalEur: [...byProgram.values()].reduce((s, p) => s + p.eur, 0),
    byProgram: [...byProgram.values()].sort((a, b) => b.sek - a.sek),
  };
}

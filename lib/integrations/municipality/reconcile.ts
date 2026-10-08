// Reconciles a municipality's sure hits and candidates with a hand-made
// checklist (data/kontrollista.csv). Rows are linked to source projects by
// the identifiers the checklist carries (CORDIS project id in Källa, ESF
// diarienummer in Källa or Anteckning, the acronym) and otherwise by title.
// Rows whose "Förväntas i källa" is "Ingen" and rows that ended before 2014
// are reported on their own, not as deviations. Amounts the checklist marks
// as estimated ("uppskattad"), or that measure something other than the EU
// contribution, are not compared.

import { convert, EurSekRates } from "../core/currency";
import { CurrencyCode, GeneratedDataset, ImportedFundedProject, Money } from "../core/types";
import { parseAmount } from "../core/values";
import {
  Candidate,
  HISTORY_FROM,
  HistoryProject,
  MunicipalityResult,
  normaliseName,
} from "./match";

export interface ChecklistRow {
  /** 1-based row number in the CSV, header excluded. */
  row: number;
  name: string;
  programme: string;
  period: string;
  role: string;
  amount: number | null;
  currency: CurrencyCode | null;
  amountMeaning: string;
  source: string;
  expectedIn: string;
  note: string;
  startDate: string | null;
  endDate: string | null;
  cordisId: string | null;
  diarienummer: string | null;
  acronym: string | null;
}

export function parseChecklist(records: Record<string, string>[]): ChecklistRow[] {
  return records
    .filter((r) => (r["Projektnamn"] ?? "").trim())
    .map((r, i) => {
      const period = (r["Period"] ?? "").trim();
      const dates = period.match(/(\d{4}-\d{2}-\d{2})\s*–\s*(\d{4}-\d{2}-\d{2})/);
      const years = period.match(/(\d{4})\s*–\s*(\d{4})/);
      const source = (r["Källa"] ?? "").trim();
      const note = (r["Anteckning"] ?? "").trim();
      const name = r["Projektnamn"].trim();
      const currency = (r["Valuta"] ?? "").trim();
      const acronym = name.match(/^([A-ZÅÄÖ][A-ZÅÄÖ0-9-]{2,})(?:\s|$)/);
      return {
        row: i + 1,
        name,
        programme: (r["Program"] ?? "").trim(),
        period,
        role: (r["Roll"] ?? "").trim(),
        amount: parseAmount(r["Belopp"]),
        currency: currency === "EUR" || currency === "SEK" ? currency : null,
        amountMeaning: (r["Vad beloppet avser"] ?? "").trim(),
        source,
        expectedIn: (r["Förväntas i källa"] ?? "").trim(),
        note,
        startDate: dates?.[1] ?? (years ? `${years[1]}-01-01` : null),
        endDate: dates?.[2] ?? (years ? `${years[2]}-12-31` : null),
        cordisId: source.match(/cordis\.europa\.eu\/project\/id\/(\d+)/)?.[1] ?? null,
        diarienummer:
          (source.match(/[?&]dnr=([\w/-]+)/i)?.[1] ??
            note.match(/\b(?:dnr|diarienummer)\s+(\d{4}\/\d{5}|\d{2}-\d{3}-S\d+)/i)?.[1] ??
            null)?.toUpperCase() ?? null,
        acronym: acronym?.[1] ?? null,
      };
    });
}

export type AmountCheck =
  | { status: "lika"; detail: string }
  | { status: "avviker"; detail: string }
  | { status: "jämförs inte"; detail: string };

export interface BothEntry {
  row: ChecklistRow;
  project: HistoryProject;
  linkedBy: string;
  amount: AmountCheck;
  dateDiff: string | null;
}

export interface ChecklistOnlyEntry {
  row: ChecklistRow;
  /** What the sources do have, when the project is there under someone else. */
  finding: string;
}

export interface CandidateEntry {
  candidate: Candidate;
  row: ChecklistRow | null;
  linkedBy: string | null;
}

export interface Reconciliation {
  both: BothEntry[];
  sourcesOnly: HistoryProject[];
  checklistOnly: ChecklistOnlyEntry[];
  candidates: CandidateEntry[];
  notExpected: ChecklistRow[];
  before2014: ChecklistRow[];
}

/** ESF diarienummer of a project: ESF+ "23-017-S01", or the 2014–2020
 * "2018/00076" Kohesio keeps as Operation_Local_Identifier. */
export function diarienummerOf(p: {
  externalProjectId: string;
  externalIds?: Record<string, string>;
  sourceSystem: string;
}): string | null {
  const ids = p.externalIds ?? {};
  if (ids.diarienummer) return ids.diarienummer.toUpperCase();
  if (ids.localId && /^\d{4}\/\d{5}$/.test(ids.localId)) return ids.localId;
  if (p.sourceSystem === "esf") return p.externalProjectId.toUpperCase();
  return null;
}

function words(text: string): Set<string> {
  return new Set(normaliseName(text).split(" ").filter((w) => w.length > 2));
}

/** Share of the checklist name's words found in the title. */
export function titleSimilarity(checklistName: string, title: string): number {
  const a = words(checklistName.replace(/\(.*?\)/g, ""));
  const b = words(title);
  if (a.size === 0) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared++;
  return shared / a.size;
}

interface Linkable {
  id: string;
  sourceSystem: string;
  externalProjectId: string;
  externalIds?: Record<string, string>;
  acronym?: string | null;
  title: string;
  titleEn?: string | null;
  startDate: string | null;
}

/** How a checklist row links to a project, or null. Identifiers decide when
 * the row has them; otherwise the title must match closely. */
export function linkRow(row: ChecklistRow, p: Linkable): string | null {
  if (row.cordisId) {
    return p.sourceSystem === "cordis" && p.externalProjectId === row.cordisId
      ? `CORDIS-id ${row.cordisId}`
      : null;
  }
  if (row.diarienummer) {
    const d = diarienummerOf(p);
    if (d) return d === row.diarienummer ? `diarienummer ${row.diarienummer}` : null;
  }
  if (row.acronym && p.acronym && p.acronym.toUpperCase() === row.acronym.toUpperCase()) {
    return `akronym ${row.acronym}`;
  }
  const sim = Math.max(titleSimilarity(row.name, p.title), titleSimilarity(row.name, p.titleEn ?? ""));
  if (sim >= 0.8) {
    // Same title, different project (a follow-up) when the start differs a lot.
    if (row.startDate && p.startDate && Math.abs(yearsBetween(row.startDate, p.startDate)) > 1) {
      return null;
    }
    return `projektnamn (${Math.round(sim * 100)} % av orden)`;
  }
  return null;
}

function yearsBetween(a: string, b: string): number {
  return (Date.parse(a) - Date.parse(b)) / (365.25 * 24 * 3600 * 1000);
}

const EU_SHARE = /EU-bidrag|EU-stöd|nettobidrag från EU|ERUF-budget/i;

export function checkAmount(
  row: ChecklistRow,
  amount: Money | null,
  startDate: string | null,
  rates: EurSekRates,
): AmountCheck {
  if (row.amount === null || !row.currency) return { status: "jämförs inte", detail: "inget belopp i kontrollistan" };
  if (/uppskatt/i.test(row.amountMeaning)) {
    return { status: "jämförs inte", detail: "beloppet är uppskattat i kontrollistan" };
  }
  if (!EU_SHARE.test(row.amountMeaning)) {
    return {
      status: "jämförs inte",
      detail: `kontrollistan anger "${row.amountMeaning}", källan anger EU-bidrag`,
    };
  }
  if (!amount) return { status: "jämförs inte", detail: "inget belopp i källan" };
  const fmt = (n: number, c: string) =>
    `${n.toLocaleString("sv-SE", { maximumFractionDigits: 2 })} ${c}`;
  if (amount.currency === row.currency) {
    const same = Math.abs(amount.amount - row.amount) < 1;
    return same
      ? { status: "lika", detail: fmt(amount.amount, amount.currency) }
      : {
          status: "avviker",
          detail: `kontrollistan ${fmt(row.amount, row.currency)}, källan ${fmt(amount.amount, amount.currency)}`,
        };
  }
  const year = Number((startDate ?? row.startDate ?? "2020").slice(0, 4));
  const converted = convert(amount, row.currency, year, rates).amount;
  const diff = Math.abs(converted - row.amount) / row.amount;
  const detail = `kontrollistan ${fmt(row.amount, row.currency)}, källan ${fmt(amount.amount, amount.currency)} (≈ ${fmt(converted, row.currency)} med årssnittskurs ${year})`;
  return diff <= 0.05 ? { status: "lika", detail: `ungefär lika: ${detail}` } : { status: "avviker", detail };
}

function dateDiff(row: ChecklistRow, p: { startDate: string | null; endDate: string | null }): string | null {
  if (!/\d{4}-\d{2}-\d{2}\s*–\s*\d{4}-\d{2}-\d{2}/.test(row.period)) return null;
  const parts: string[] = [];
  if (p.startDate && row.startDate !== p.startDate) parts.push(`start ${row.startDate} i listan, ${p.startDate} i källan`);
  if (p.endDate && row.endDate !== p.endDate) parts.push(`slut ${row.endDate} i listan, ${p.endDate} i källan`);
  return parts.length ? parts.join("; ") : null;
}

export function reconcile(
  result: MunicipalityResult,
  rows: ChecklistRow[],
  datasets: GeneratedDataset[],
  rates: EurSekRates,
  excludedNames: RegExp[],
): Reconciliation {
  const both: BothEntry[] = [];
  const checklistOnly: ChecklistOnlyEntry[] = [];
  const notExpected: ChecklistRow[] = [];
  const before2014: ChecklistRow[] = [];
  const linkedProjects = new Set<string>();
  const candidateLinks = new Map<string, { row: ChecklistRow; linkedBy: string }>();
  const extraCandidates: Candidate[] = [];

  const allProjects: ImportedFundedProject[] = datasets.flatMap((d) => d.projects);
  const leadName = new Map<string, string>();
  for (const d of datasets) {
    const orgName = new Map(d.organisations.map((o) => [o.id, o.name]));
    for (const pp of d.partners) {
      if (pp.role === "coordinator" && !leadName.has(pp.fundedProjectId)) {
        leadName.set(pp.fundedProjectId, pp.sourceName || orgName.get(pp.organisationId) || "");
      }
    }
  }

  for (const row of rows) {
    if (/^ingen/i.test(row.expectedIn)) {
      notExpected.push(row);
      continue;
    }
    if (row.endDate && row.endDate < HISTORY_FROM) {
      before2014.push(row);
      continue;
    }
    const sure = result.projects.find((p) => linkRow(row, p));
    if (sure) {
      linkedProjects.add(sure.id);
      both.push({
        row,
        project: sure,
        linkedBy: linkRow(row, sure)!,
        amount: checkAmount(row, sure.euContribution, sure.startDate, rates),
        dateDiff: dateDiff(row, sure),
      });
      continue;
    }
    const cand = result.candidates.find((c) => linkRow(row, projectOf(c, allProjects)));
    if (cand) {
      candidateLinks.set(cand.projectId, { row, linkedBy: linkRow(row, projectOf(cand, allProjects))! });
      continue;
    }
    const elsewhere = allProjects.find((p) => linkRow(row, p));
    if (elsewhere) {
      const lead = leadName.get(elsewhere.id) ?? "okänd stödmottagare";
      if (excludedNames.some((re) => re.test(lead))) {
        checklistOnly.push({
          row,
          finding: `Finns i ${elsewhere.sourceSystem} som "${elsewhere.title}" med ${lead} som stödmottagare; kommunen syns inte som egen partner där.`,
        });
      } else {
        const linkedBy = linkRow(row, elsewhere)!;
        extraCandidates.push({
          projectId: elsewhere.id,
          sourceSystem: elsewhere.sourceSystem,
          title: elsewhere.title,
          acronym: elsewhere.acronym ?? null,
          programmeName: elsewhere.programmeName,
          period: elsewhere.period,
          startDate: elsewhere.startDate,
          endDate: elsewhere.endDate,
          organisationName: lead,
          organisationNumber: null,
          reason: "diarienummer i kontrollistan",
          detail: linkedBy,
          euContribution: elsewhere.euContribution,
          euContributionEur: null,
          sourceUrl: elsewhere.sourceUrl,
        });
        candidateLinks.set(elsewhere.id, { row, linkedBy });
      }
      continue;
    }
    checklistOnly.push({ row, finding: `Hittades inte i de importerade källorna (förväntas i ${row.expectedIn}).` });
  }

  const candidates: CandidateEntry[] = [...result.candidates, ...extraCandidates].map((c) => {
    const link = candidateLinks.get(c.projectId);
    return { candidate: c, row: link?.row ?? null, linkedBy: link?.linkedBy ?? null };
  });

  return {
    both,
    sourcesOnly: result.projects.filter((p) => !linkedProjects.has(p.id)),
    checklistOnly,
    candidates,
    notExpected,
    before2014,
  };
}

function projectOf(c: Candidate, all: ImportedFundedProject[]): Linkable {
  return (
    all.find((p) => p.id === c.projectId) ?? {
      id: c.projectId,
      sourceSystem: c.sourceSystem,
      externalProjectId: c.projectId.split(":")[1] ?? c.projectId,
      acronym: c.acronym,
      title: c.title,
      startDate: c.startDate,
    }
  );
}

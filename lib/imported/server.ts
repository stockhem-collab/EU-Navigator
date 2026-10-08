// Server-only access to the imported reference data. Reads
// data/app/referensdata.json.gz once per server process and answers the
// API routes and server components: the reference project list, the
// similarity search for a project idea, partner suggestions, amount
// benchmarks and the municipality's own EU history. Never import this from
// a client component — it reads the file system and holds ~10 000
// projects in memory.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { convert, eurSekRate, parseEurSekRates, type EurSekRates } from "@/lib/integrations/core/currency";
import type { Money, PartnerRole, SourceSystem } from "@/lib/integrations/core/types";
import type { Candidate, HistoryProject } from "@/lib/integrations/municipality/match";
import { findProgram } from "@/lib/data/fundingPrograms";
import { findTag } from "@/lib/data/tags";
import { significantWords } from "@/lib/matching/similarProjects";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import type { Sector } from "@/lib/types";
import { conceptsInText, projectThemes, searchableText, termOccurs, type ThemeMatch } from "./themes";
import type {
  AmountStats,
  IdeaInput,
  IndexProject,
  PartnerSuggestion,
  ReferenceFilterOptions,
  ReferenceIndex,
  ReferenceListResponse,
  ReferenceProjectCard,
  SekAmount,
  SimilarImportedProject,
  SimilarResponse,
  SimilarityReason,
} from "./types";

const INDEX_FILE = path.join(process.cwd(), "data", "app", "referensdata.json.gz");
const RATES_FILE = path.join(process.cwd(), "data", "vaxelkurs.csv");

interface Loaded {
  index: ReferenceIndex;
  rates: EurSekRates;
  cards: ReferenceProjectCard[];
  /** Per project: title text and title + summary text, for the searches. */
  titleText: string[];
  fullText: string[];
  /** Per project: [organisation index, role] pairs. */
  partnersOf: [number, PartnerRole][][];
  options: ReferenceFilterOptions;
}

let cache: Loaded | null = null;

export function referenceDataAvailable(): boolean {
  return fs.existsSync(INDEX_FILE);
}

function load(): Loaded {
  if (cache) return cache;
  const rates = parseEurSekRates(fs.readFileSync(RATES_FILE, "utf8"));
  const index: ReferenceIndex = referenceDataAvailable()
    ? JSON.parse(zlib.gunzipSync(fs.readFileSync(INDEX_FILE)).toString("utf8"))
    : { generatedAt: "", sources: [], projects: [], organisations: [], partners: [], history: null, peers: null };

  const partnersOf: [number, PartnerRole][][] = index.projects.map(() => []);
  for (const [pi, oi, role] of index.partners) partnersOf[pi].push([oi, role]);

  const cards = index.projects.map((p, i) => toCard(p, partnersOf[i].length, rates));
  const titleText = index.projects.map((p) => searchableText(`${p.title} ${p.titleEn ?? ""} ${p.acronym ?? ""}`));
  const fullText = index.projects.map((p, i) => `${titleText[i]}${searchableText(`${p.summary ?? ""} ${p.summaryEn ?? ""}`)}`);

  cache = { index, rates, cards, titleText, fullText, partnersOf, options: filterOptions(cards) };
  return cache;
}

function startYear(date: string | null): number | null {
  const y = date ? Number(date.slice(0, 4)) : NaN;
  return Number.isFinite(y) ? y : null;
}

/** An amount in kronor at the yearly average rate of `year` (the project's
 * start year), keeping the published amount alongside. */
export function toSek(money: Money | null, year: number | null, rates: EurSekRates): SekAmount | null {
  // CORDIS writes 0 for a total cost it doesn't publish (ERC, MSCA).
  if (!money || money.amount <= 0) return null;
  if (money.currency === "SEK") return { sek: Math.round(money.amount), original: money };
  const rateYear = year ?? new Date().getFullYear();
  return {
    sek: convert(money, "SEK", rateYear, rates).amount,
    original: { amount: Math.round(money.amount), currency: money.currency },
    rate: eurSekRate(rates, rateYear),
    rateYear,
  };
}

function toEur(money: Money | null, year: number | null, rates: EurSekRates): number | null {
  if (!money) return null;
  return convert(money, "EUR", year ?? new Date().getFullYear(), rates).amount;
}

function toCard(p: IndexProject, partnerCount: number, rates: EurSekRates): ReferenceProjectCard {
  const year = startYear(p.startDate);
  return {
    id: p.id,
    source: p.source,
    programId: p.programId,
    programme: p.programme,
    period: p.period,
    title: p.title,
    titleEn: p.titleEn ?? null,
    acronym: p.acronym ?? null,
    summary: p.summary ?? null,
    summaryEn: p.summaryEn ?? null,
    startYear: year,
    startDate: p.startDate,
    endDate: p.endDate,
    country: p.country,
    url: p.url,
    euContribution: toSek(p.eu, year, rates),
    totalBudget: toSek(p.total, year, rates),
    themes: projectThemes(p),
    partnerCount,
  };
}

/** The key the programme filter uses: the app's programme id when the
 * source's programme maps onto one, otherwise the source's own name. */
export function programKey(card: Pick<ReferenceProjectCard, "programId" | "programme">): string {
  return card.programId ?? `name:${card.programme}`;
}

function programLabel(key: string, fallback: string): string {
  if (key.startsWith("name:")) return fallback;
  return findProgram(key)?.shortName ?? fallback;
}

function filterOptions(cards: ReferenceProjectCard[]): ReferenceFilterOptions {
  const sources = new Map<SourceSystem, number>();
  const programs = new Map<string, { label: string; count: number }>();
  const countries = new Map<string, number>();
  const years = new Set<number>();
  for (const c of cards) {
    sources.set(c.source, (sources.get(c.source) ?? 0) + 1);
    const key = programKey(c);
    const prev = programs.get(key);
    programs.set(key, { label: prev?.label ?? programLabel(key, c.programme), count: (prev?.count ?? 0) + 1 });
    if (c.country) countries.set(c.country, (countries.get(c.country) ?? 0) + 1);
    if (c.startYear) years.add(c.startYear);
  }
  return {
    sources: [...sources].map(([id, count]) => ({ id, count })),
    programs: [...programs]
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "sv")),
    countries: [...countries].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
    years: [...years].sort((a, b) => b - a),
  };
}

// ---------------------------------------------------------------------------
// Reference project list
// ---------------------------------------------------------------------------

export interface ReferenceFilters {
  source?: string | null;
  program?: string | null;
  country?: string | null;
  year?: number | null;
  q?: string | null;
  page?: number;
  pageSize?: number;
}

export function listReferenceProjects(filters: ReferenceFilters): ReferenceListResponse {
  const { cards, fullText, options } = load();
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const q = filters.q?.trim() ? searchableText(filters.q).trim() : "";
  const hits: number[] = [];
  cards.forEach((c, i) => {
    if (filters.source && c.source !== filters.source) return;
    if (filters.program && programKey(c) !== filters.program) return;
    if (filters.country && c.country !== filters.country) return;
    if (filters.year && c.startYear !== filters.year) return;
    if (q && !fullText[i].includes(q)) return;
    hits.push(i);
  });
  hits.sort((a, b) => (cards[b].startDate ?? "").localeCompare(cards[a].startDate ?? ""));
  return {
    total: hits.length,
    page,
    pageSize,
    projects: hits.slice((page - 1) * pageSize, page * pageSize).map((i) => cards[i]),
    options,
  };
}

// ---------------------------------------------------------------------------
// Similar projects and partners for a project idea
// ---------------------------------------------------------------------------

const PRIMARY_THEME = 0.3;
const SECONDARY_THEME = 0.15;
const CONCEPT_IN_TITLE = 0.2;
const CONCEPT_IN_TEXT = 0.1;
const MAX_CONCEPTS = 0.6;
const WORD = 0.05;
const MAX_WORDS = 0.2;
const CURRENT_PERIOD = 0.05;

const SIMILAR_LIMIT = 12;
const PARTNER_SOURCE_PROJECTS = 30;
const PARTNER_LIMIT = 15;

function themeReason(t: ThemeMatch): SimilarityReason {
  const label = t.label ? ` – ${t.label}` : "";
  return {
    kind: "theme",
    text_sv: `Temat ${sectorLabel(t.sector, "sv")}: ${t.code_sv}${label}`,
    text_en: `Theme ${sectorLabel(t.sector, "en")}: ${t.code_en}${label}`,
  };
}

const display = (term: string) => term.replace(/\*$/, "…");

export function findSimilar(idea: IdeaInput): SimilarResponse {
  const { cards, titleText, fullText, partnersOf, index } = load();
  const tagText = (idea.tags ?? []).map((id) => findTag(id)?.label_sv ?? "").join(" ");
  const ideaText = `${idea.title} ${idea.description} ${tagText}`;
  const concepts = conceptsInText(ideaText);
  const conceptTerms = new Set(concepts.flatMap((c) => [...c.sv, ...c.terms].map((t) => t.replace(/\*$/, ""))));
  // The idea's own longer words, for projects written in Swedish — those
  // the word list already covers are left to it.
  const words = [...significantWords(ideaText)].filter(
    (w) => w.length >= 6 && ![...conceptTerms].some((t) => w.startsWith(t))
  );
  const secondary = new Set(idea.secondarySectors ?? []);

  const scored: { i: number; score: number; reasons: SimilarityReason[] }[] = [];
  cards.forEach((card, i) => {
    const reasons: SimilarityReason[] = [];
    let conceptScore = 0;
    for (const c of concepts) {
      const inTitle = c.terms.find((t) => termOccurs(t, titleText[i]));
      const inText = inTitle ?? c.terms.find((t) => termOccurs(t, fullText[i]));
      if (!inText) continue;
      conceptScore += inTitle ? CONCEPT_IN_TITLE : CONCEPT_IN_TEXT;
      const where_sv = inTitle ? "i titeln" : "i beskrivningen";
      const where_en = inTitle ? "in the title" : "in the description";
      reasons.push({
        kind: "keyword",
        text_sv: `Idén handlar om ${c.label_sv} – projektet nämner "${display(inText)}" ${where_sv}`,
        text_en: `The idea is about ${c.label_sv} — the project mentions "${display(inText)}" ${where_en}`,
      });
    }
    let wordScore = 0;
    const sharedWords = words.filter((w) => fullText[i].includes(` ${w}`));
    if (sharedWords.length > 0) {
      wordScore = Math.min(MAX_WORDS, sharedWords.length * WORD);
      reasons.push({
        kind: "keyword",
        text_sv: `Samma ord som i idén: ${sharedWords.slice(0, 4).join(", ")}`,
        text_en: `Same words as the idea: ${sharedWords.slice(0, 4).join(", ")}`,
      });
    }
    // A project has to share something with the idea's own words; the
    // theme alone would make thousands of projects equally similar.
    if (conceptScore === 0 && wordScore === 0) return;

    let themeScore = 0;
    const primary = card.themes.find((t) => t.sector === idea.sector);
    const second = card.themes.find((t) => secondary.has(t.sector));
    if (primary) {
      themeScore = PRIMARY_THEME;
      reasons.unshift(themeReason(primary));
    } else if (second) {
      themeScore = SECONDARY_THEME;
      reasons.unshift(themeReason(second));
    }
    const score =
      Math.min(MAX_CONCEPTS, conceptScore) + wordScore + themeScore + (card.period === "2021-2027" ? CURRENT_PERIOD : 0);
    scored.push({ i, score, reasons });
  });
  scored.sort((a, b) => b.score - a.score || (cards[b.i].startDate ?? "").localeCompare(cards[a.i].startDate ?? ""));

  const similar: SimilarImportedProject[] = scored.slice(0, SIMILAR_LIMIT).map((s) => ({
    project: cards[s.i],
    similarityPct: Math.round(Math.min(1, s.score) * 100),
    reasons: s.reasons,
  }));

  return {
    similar,
    partners: partnerSuggestions(
      scored.slice(0, PARTNER_SOURCE_PROJECTS).map((s) => s.i),
      idea.ownOrganisation?.name ?? null,
      cards,
      partnersOf,
      index
    ),
    compared: cards.length,
  };
}

function normalised(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9åäöéü]+/g, " ").trim();
}

function partnerSuggestions(
  projectIdx: number[],
  ownName: string | null,
  cards: ReferenceProjectCard[],
  partnersOf: [number, PartnerRole][][],
  index: ReferenceIndex
): PartnerSuggestion[] {
  const own = ownName ? normalised(ownName) : null;
  const byOrg = new Map<number, PartnerSuggestion>();
  for (const pi of projectIdx) {
    for (const [oi, role] of partnersOf[pi]) {
      const org = index.organisations[oi];
      if (own && normalised(org.name).includes(own)) continue;
      const entry =
        byOrg.get(oi) ??
        ({
          organisationId: org.id,
          name: org.name,
          country: org.country,
          type: org.type,
          projectCount: 0,
          coordinatorCount: 0,
          partnerCount: 0,
          associatedCount: 0,
          projects: [],
        } satisfies PartnerSuggestion);
      if (entry.projects.some((p) => p.id === cards[pi].id)) continue;
      entry.projectCount += 1;
      if (role === "coordinator") entry.coordinatorCount += 1;
      else if (role === "partner") entry.partnerCount += 1;
      else entry.associatedCount += 1;
      entry.projects.push({ id: cards[pi].id, title: cards[pi].title, role, source: cards[pi].source });
      byOrg.set(oi, entry);
    }
  }
  return [...byOrg.values()]
    .sort((a, b) => b.projectCount - a.projectCount || b.coordinatorCount - a.coordinatorCount || a.name.localeCompare(b.name))
    .slice(0, PARTNER_LIMIT);
}

// ---------------------------------------------------------------------------
// Amount benchmarks for a match card
// ---------------------------------------------------------------------------

/** Below this many projects a programme-and-theme figure says too little;
 * the programme as a whole is used instead. */
const MIN_PROJECTS = 5;
/** Enough projects for a 10th–90th percentile span instead of min–max. */
const PERCENTILE_FROM = 10;

/** A predecessor programme counted with the current one when the current
 * one has too few imported projects of its own. */
const PREDECESSORS: Record<string, string[]> = { horizon: ["horizon2020"] };

function quantile(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0;
  const pos = (sorted.length - 1) * q;
  const lo = Math.floor(pos);
  const hi = Math.ceil(pos);
  return Math.round(sorted[lo] + (sorted[hi] - sorted[lo]) * (pos - lo));
}

export function amountStats(programId: string, sector: Sector): AmountStats {
  const { cards, index, rates } = load();
  const inPrograms = (ids: string[]) =>
    cards
      .map((c, i) => ({ c, i }))
      .filter(({ c }) => c.programId !== null && ids.includes(c.programId) && c.euContribution && c.euContribution.sek > 0);

  let programIds = [programId];
  let pool = inPrograms(programIds);
  let themed = pool.filter(({ c }) => c.themes.some((t) => t.sector === sector));
  if (themed.length < MIN_PROJECTS && PREDECESSORS[programId]) {
    programIds = [programId, ...PREDECESSORS[programId]];
    pool = inPrograms(programIds);
    themed = pool.filter(({ c }) => c.themes.some((t) => t.sector === sector));
  }
  const basis: AmountStats["basis"] = themed.length >= MIN_PROJECTS ? "program-theme" : pool.length > 0 ? "program" : "none";
  const chosen = basis === "program-theme" ? themed : pool;
  const sek = chosen.map(({ c }) => c.euContribution!.sek).sort((a, b) => a - b);
  const eur = chosen
    .map(({ c, i }) => toEur(index.projects[i].eu, c.startYear, rates) ?? 0)
    .sort((a, b) => a - b);
  const spread: AmountStats["spread"] = sek.length >= PERCENTILE_FROM ? "p10-p90" : "min-max";
  const [lowQ, highQ] = spread === "p10-p90" ? [0.1, 0.9] : [0, 1];
  return {
    programId,
    basis,
    sector,
    count: sek.length,
    low: quantile(sek, lowQ),
    median: quantile(sek, 0.5),
    high: quantile(sek, highQ),
    lowEur: quantile(eur, lowQ),
    medianEur: quantile(eur, 0.5),
    highEur: quantile(eur, highQ),
    spread,
    programIds: basis === "none" ? [] : [...new Set(chosen.map(({ c }) => c.programId!))],
  };
}

// ---------------------------------------------------------------------------
// The municipality's own EU history (uppsala-history.json, peers.json)
// ---------------------------------------------------------------------------

export interface HistoryRow {
  id: string;
  source: SourceSystem;
  title: string;
  acronym: string | null;
  programId: string | null;
  programme: string;
  period: string | null;
  startDate: string | null;
  endDate: string | null;
  role: string | null;
  matchedOn: string;
  euContribution: SekAmount | null;
  url: string | null;
}

export interface HistoryCandidateRow {
  id: string;
  source: SourceSystem;
  title: string;
  acronym: string | null;
  programme: string;
  period: string | null;
  organisationName: string | null;
  reason: string;
  euContribution: SekAmount | null;
  url: string | null;
}

export interface PeerRow {
  name: string;
  reference: boolean;
  projects: number;
  euContributionSek: number;
  euContributionEur: number;
}

export interface HistoryView {
  generatedAt: string;
  municipality: { name: string; orgNumber: string; pic: string | null };
  rules: { sureMatch: string; candidates: string; historyFrom: string };
  projects: HistoryRow[];
  candidates: HistoryCandidateRow[];
  totalSek: number;
  totalEur: number;
  byProgram: { programId: string | null; programme: string; projects: number; sek: number; eur: number }[];
  peers: PeerRow[];
  peerCaveats: string[];
}

interface HistoryFile {
  generatedAt: string;
  municipality: { name: string; orgNumber: string; pic?: string | null };
  rules: { sureMatch: string; candidates: string; historyFrom: string };
  projects: HistoryProject[];
  candidates: Candidate[];
}

interface PeersFile {
  rules?: { caveats?: string[] };
  municipalities: { name: string; reference: boolean; projects: number; euContributionSek: number; euContributionEur: number }[];
}

export function historyView(): HistoryView | null {
  const { index, rates } = load();
  const history = index.history as HistoryFile | null;
  if (!history) return null;
  const peers = index.peers as PeersFile | null;

  const projects: HistoryRow[] = history.projects
    .map((p) => ({
      id: p.id,
      source: p.sourceSystem,
      title: p.title,
      acronym: p.acronym,
      programId: p.programId,
      programme: (p.programId && findProgram(p.programId)?.shortName) || p.programmeName,
      period: p.period,
      startDate: p.startDate,
      endDate: p.endDate,
      role: p.partners[0]?.role ?? null,
      matchedOn: `${p.matchedOn} ${p.matchedValue}`,
      euContribution: toSek(p.euContribution, startYear(p.startDate), rates),
      url: p.sourceUrl,
    }))
    .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));

  const byProgram = new Map<string, HistoryView["byProgram"][number]>();
  for (const p of projects) {
    const key = p.programId ?? p.programme;
    const entry = byProgram.get(key) ?? { programId: p.programId, programme: p.programme, projects: 0, sek: 0, eur: 0 };
    entry.projects += 1;
    entry.sek += p.euContribution?.sek ?? 0;
    entry.eur += toEur(p.euContribution?.original ?? null, startYear(p.startDate), rates) ?? 0;
    byProgram.set(key, entry);
  }

  return {
    generatedAt: history.generatedAt,
    municipality: { name: history.municipality.name, orgNumber: history.municipality.orgNumber, pic: history.municipality.pic ?? null },
    rules: history.rules,
    projects,
    candidates: history.candidates.map((c) => ({
      id: c.projectId,
      source: c.sourceSystem,
      title: c.title,
      acronym: c.acronym,
      programme: c.programmeName,
      period: c.period,
      organisationName: c.organisationName,
      reason: c.reason,
      euContribution: toSek(c.euContribution, startYear(c.startDate), rates),
      url: c.sourceUrl,
    })),
    totalSek: projects.reduce((s, p) => s + (p.euContribution?.sek ?? 0), 0),
    totalEur: [...byProgram.values()].reduce((s, p) => s + p.eur, 0),
    byProgram: [...byProgram.values()].sort((a, b) => b.sek - a.sek),
    peers: (peers?.municipalities ?? [])
      .map((m) => ({
        name: m.name,
        reference: m.reference,
        projects: m.projects,
        euContributionSek: m.euContributionSek,
        euContributionEur: m.euContributionEur,
      }))
      .sort((a, b) => b.euContributionSek - a.euContributionSek),
    peerCaveats: peers?.rules?.caveats ?? [],
  };
}

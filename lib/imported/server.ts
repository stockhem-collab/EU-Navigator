// Server-only access to the imported reference data. Reads
// data/app/referensdata.json.gz (and, for the municipality's own EU history
// and comparison, data/app/kommunhistorik.json.gz) once per server process
// and answers the API routes and server components: the reference project
// list, the similarity search for a project idea, partner suggestions,
// amount benchmarks and the history. Never import this from a client
// component — it reads the file system and holds ~30 000 projects in
// memory.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { convert, eurSekRate, parseEurSekRates, type EurSekRates } from "@/lib/integrations/core/currency";
import type { Money, OrganisationType, PartnerRole, SourceSystem } from "@/lib/integrations/core/types";
import type { Candidate, HistoryProject } from "@/lib/integrations/municipality/match";
import type { VinnovaProject } from "@/lib/integrations/municipality/vinnova";
import { findProgram } from "@/lib/data/fundingPrograms";
import { findTag } from "@/lib/data/tags";
import { populationOf, POPULATION_YEAR } from "@/lib/data/population";
import { DEFAULT_PROFILE, type DemoProfileId } from "@/lib/data/demoProfiles";
import { significantWords } from "@/lib/matching/similarProjects";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import type { Sector } from "@/lib/types";
import { conceptsInText, projectThemes, searchableText, termOccurs, type ThemeMatch } from "./themes";
import type {
  AmountStats,
  IdeaInput,
  IndexProject,
  PartnerSearchFilters,
  PartnerSearchHit,
  PartnerSearchResponse,
  PartnerSuggestion,
  ReferenceFilterOptions,
  ReferenceIndex,
  ReferenceListResponse,
  ReferenceProfiles,
  ReferenceProjectCard,
  SekAmount,
  SimilarImportedProject,
  SimilarResponse,
  SimilarityReason,
} from "./types";

const INDEX_FILE = path.join(process.cwd(), "data", "app", "referensdata.json.gz");
const PROFILES_FILE = path.join(process.cwd(), "data", "app", "kommunhistorik.json.gz");
const RATES_FILE = path.join(process.cwd(), "data", "vaxelkurs.csv");

interface Loaded {
  index: ReferenceIndex;
  rates: EurSekRates;
  cards: ReferenceProjectCard[];
  /** Per project: [organisation index, role] pairs. */
  partnersOf: [number, PartnerRole][][];
  options: ReferenceFilterOptions;
}

interface SearchTexts {
  /** Per project: title text and title + summary text, for the searches. */
  titleText: string[];
  fullText: string[];
  /** Per organisation: its name as searchable text. */
  orgText: string[];
}

// Kept on globalThis: the dev server bundles every route separately, and a
// module-level cache would load the index once per route.
const shared = globalThis as typeof globalThis & {
  euNavigatorReference?: {
    loaded?: Loaded;
    texts?: SearchTexts;
    profiles?: { profiles: ReferenceProfiles; rates: EurSekRates };
  };
};
const caches = (shared.euNavigatorReference ??= {});

export function referenceDataAvailable(): boolean {
  return fs.existsSync(INDEX_FILE);
}

function load(): Loaded {
  if (caches.loaded) return caches.loaded;
  const rates = parseEurSekRates(fs.readFileSync(RATES_FILE, "utf8"));
  const index: ReferenceIndex = referenceDataAvailable()
    ? JSON.parse(zlib.gunzipSync(fs.readFileSync(INDEX_FILE)).toString("utf8"))
    : { generatedAt: "", sources: [], projects: [], organisations: [], partners: [] };

  const partnersOf: [number, PartnerRole][][] = index.projects.map(() => []);
  for (const [pi, oi, role] of index.partners) partnersOf[pi].push([oi, role]);

  const cards = index.projects.map((p, i) => toCard(p, partnersOf[i].length, rates));

  caches.loaded = { index, rates, cards, partnersOf, options: filterOptions(cards) };
  return caches.loaded;
}

/** The searchable texts, built on the first search rather than on load:
 * they take as long as the rest of the load, and a list without words, the
 * amount benchmarks and the history don't need them. */
function texts(): SearchTexts {
  if (caches.texts) return caches.texts;
  const { index } = load();
  const titleText = index.projects.map((p) => searchableText(`${p.title} ${p.titleEn ?? ""} ${p.acronym ?? ""}`));
  const fullText = index.projects.map((p, i) => `${titleText[i]}${searchableText(`${p.summary ?? ""} ${p.summaryEn ?? ""}`)}`);
  const orgText = index.organisations.map((o) => searchableText(o.name));
  caches.texts = { titleText, fullText, orgText };
  return caches.texts;
}

/** The demo municipalities' history and comparison, kept in a small file of
 * their own so those pages don't load the whole reference index. */
function loadProfiles(): { profiles: ReferenceProfiles; rates: EurSekRates } {
  if (caches.profiles) return caches.profiles;
  const rates = caches.loaded?.rates ?? parseEurSekRates(fs.readFileSync(RATES_FILE, "utf8"));
  const profiles: ReferenceProfiles = fs.existsSync(PROFILES_FILE)
    ? JSON.parse(zlib.gunzipSync(fs.readFileSync(PROFILES_FILE)).toString("utf8"))
    : { generatedAt: "", profiles: {} };
  caches.profiles = { profiles, rates };
  return caches.profiles;
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
  const { cards, options } = load();
  const pageSize = Math.min(Math.max(filters.pageSize ?? 20, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const q = filters.q?.trim() ? searchableText(filters.q).trim() : "";
  const fullText = q ? texts().fullText : [];
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
  const { cards, partnersOf, index } = load();
  const { titleText, fullText } = texts();
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
    // EU projects only: the idea is matched against EU calls, and Vinnova's
    // Swedish summaries would otherwise outrank the EU projects on shared
    // Swedish words. Vinnova projects are found in the reference list and
    // the partner search.
    if (card.source === "vinnova") return;
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
    compared: cards.filter((c) => c.source !== "vinnova").length,
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
// Partner search
// ---------------------------------------------------------------------------

/** Words that make an organisation the source gives no type a
 * municipality — the sources leave most public bodies untyped, and these
 * are the partners a municipality most often looks for. Whole words, in
 * the languages of the countries with the most imported organisations. */
const MUNICIPAL_NAME =
  /(^|[^\p{L}])(kommun|stad|municipality|city of|city council|borough council|gemeente|kommune|stadt|gemeinde|landeshauptstadt|ville de|commune de|comune di|ayuntamiento|concello|municipio|câmara municipal|miasto|gmina|kaupunki|kunta|linn|vald|savivaldybė|pašvaldība|dimos|δήμος)($|[^\p{L}])/iu;

/** The organisation's type, or "municipality" read from its name when the
 * source gives no type. */
export function organisationTypeOf(org: { name: string; type: OrganisationType | null }): {
  type: OrganisationType | null;
  fromName: boolean;
} {
  if (org.type) return { type: org.type, fromName: false };
  return MUNICIPAL_NAME.test(org.name) ? { type: "municipality", fromName: true } : { type: null, fromName: false };
}

const PARTNER_PAGE_SIZE = 25;
const PARTNER_PROJECTS_SHOWN = 5;

export function searchPartners(filters: PartnerSearchFilters): PartnerSearchResponse {
  const { cards, partnersOf, index } = load();
  const { fullText, orgText } = texts();
  const pageSize = Math.min(Math.max(filters.pageSize ?? PARTNER_PAGE_SIZE, 1), 100);
  const page = Math.max(filters.page ?? 1, 1);
  const q = filters.q?.trim() ? searchableText(filters.q).trim() : "";
  // Swedish words also find English projects through the theme word list
  // ("klimatanpassning" → "climate adaptation").
  const concepts = filters.q?.trim() ? conceptsInText(filters.q) : [];
  const own = filters.own?.trim() ? normalised(filters.own) : null;
  const types = index.organisations.map(organisationTypeOf);

  interface Acc {
    oi: number;
    projects: { pi: number; role: PartnerRole }[];
  }
  const byOrg = new Map<number, Acc>();
  let matchedProjects = 0;
  cards.forEach((c, pi) => {
    if (filters.program && programKey(c) !== filters.program) return;
    if (filters.sector && !c.themes.some((t) => t.sector === filters.sector)) return;
    if (filters.period && c.period !== filters.period) return;
    const textHit =
      !q || fullText[pi].includes(q) || concepts.some((c) => c.terms.some((t) => termOccurs(t, fullText[pi])));
    let counted = false;
    for (const [oi, role] of partnersOf[pi]) {
      const org = index.organisations[oi];
      // A word that names the organisation finds all its projects, not
      // only those that mention the word.
      if (!textHit && !orgText[oi].includes(q)) continue;
      if (own && normalised(org.name).includes(own)) continue;
      if (filters.role === "coordinator" && role !== "coordinator") continue;
      const acc = byOrg.get(oi) ?? { oi, projects: [] };
      if (!acc.projects.some((p) => p.pi === pi)) acc.projects.push({ pi, role });
      byOrg.set(oi, acc);
      counted = true;
    }
    if (counted) matchedProjects += 1;
  });

  // The type and country choices count what the other filters left, so
  // a choice never leads to an empty list.
  const typeCounts = new Map<string, number>();
  const countryCounts = new Map<string, number>();
  const hits: Acc[] = [];
  for (const acc of byOrg.values()) {
    const org = index.organisations[acc.oi];
    const type = types[acc.oi].type ?? "unknown";
    typeCounts.set(type, (typeCounts.get(type) ?? 0) + 1);
    if (org.country) countryCounts.set(org.country, (countryCounts.get(org.country) ?? 0) + 1);
    if (filters.type && type !== filters.type) continue;
    if (filters.country && org.country !== filters.country) continue;
    hits.push(acc);
  }

  const latestYear = (acc: Acc) => Math.max(0, ...acc.projects.map((p) => cards[p.pi].startYear ?? 0));
  const coordinated = (acc: Acc) => acc.projects.filter((p) => p.role === "coordinator").length;
  hits.sort(
    (a, b) =>
      b.projects.length - a.projects.length ||
      coordinated(b) - coordinated(a) ||
      latestYear(b) - latestYear(a) ||
      index.organisations[a.oi].name.localeCompare(index.organisations[b.oi].name, "sv")
  );

  const toHit = (acc: Acc): PartnerSearchHit => {
    const org = index.organisations[acc.oi];
    const programmes = new Map<string, { key: string; label: string; count: number }>();
    for (const { pi } of acc.projects) {
      const key = programKey(cards[pi]);
      const prev = programmes.get(key);
      programmes.set(key, { key, label: prev?.label ?? programLabel(key, cards[pi].programme), count: (prev?.count ?? 0) + 1 });
    }
    const newest = [...acc.projects].sort((a, b) => (cards[b.pi].startDate ?? "").localeCompare(cards[a.pi].startDate ?? ""));
    const year = latestYear(acc);
    return {
      organisationId: org.id,
      name: org.name,
      type: types[acc.oi].type,
      typeFromName: types[acc.oi].fromName,
      country: org.country,
      projectCount: acc.projects.length,
      coordinatorCount: coordinated(acc),
      partnerCount: acc.projects.filter((p) => p.role === "partner").length,
      associatedCount: acc.projects.filter((p) => p.role === "associated-partner").length,
      latestYear: year > 0 ? year : null,
      programmes: [...programmes.values()].sort((a, b) => b.count - a.count).slice(0, 3),
      projects: newest.slice(0, PARTNER_PROJECTS_SHOWN).map(({ pi, role }) => ({
        id: cards[pi].id,
        title: cards[pi].title,
        acronym: cards[pi].acronym,
        programme: programLabel(programKey(cards[pi]), cards[pi].programme),
        role,
        source: cards[pi].source,
        startYear: cards[pi].startYear,
        url: cards[pi].url,
      })),
    };
  };

  return {
    total: hits.length,
    page,
    pageSize,
    matchedProjects,
    organisations: hits.slice((page - 1) * pageSize, page * pageSize).map(toHit),
    options: {
      types: [...typeCounts].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
      countries: [...countryCounts].map(([id, count]) => ({ id, count })).sort((a, b) => b.count - a.count),
    },
  };
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
// The municipality's own EU history (<profile>-history.json, <profile>-peers.json)
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
  /** Vinnova projects the municipality coordinated (national funding, not
   * part of the EU figures); null when the data has no Vinnova count. */
  vinnova: { projects: number; grantSek: number } | null;
}

/** A Vinnova project the municipality coordinated (national funding). */
export interface VinnovaRow {
  id: string;
  diarienummer: string;
  title: string;
  programme: string;
  startDate: string | null;
  endDate: string | null;
  coordinator: string;
  grantSek: number | null;
  url: string | null;
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
  /** Kept apart from the EU history above; null when not imported. */
  vinnova: { rule: string; projects: VinnovaRow[]; totalSek: number } | null;
}

interface HistoryFile {
  generatedAt: string;
  municipality: { name: string; orgNumber: string; pic?: string | null };
  rules: { sureMatch: string; candidates: string; historyFrom: string };
  projects: HistoryProject[];
  candidates: Candidate[];
  vinnova?: { rule: string; projects: VinnovaProject[] };
}

interface PeersFile {
  rules?: { caveats?: string[]; vinnova?: string };
  municipalities: {
    name: string;
    reference: boolean;
    kommunkod?: string;
    projects: number;
    euContributionSek: number;
    euContributionEur: number;
    vinnova?: { projects: number; grantSek: number };
    byProgram?: {
      programId: string | null;
      programme: string;
      projects: number;
      euContributionEur: number;
      euContributionSek: number;
      byPeriod?: Record<string, { projects: number; euContributionEur: number }>;
    }[];
  }[];
}

export function historyView(profile: DemoProfileId = DEFAULT_PROFILE): HistoryView | null {
  const { profiles, rates } = loadProfiles();
  const history = (profiles.profiles[profile]?.history ?? null) as HistoryFile | null;
  if (!history) return null;
  const peers = (profiles.profiles[profile]?.peers ?? null) as PeersFile | null;

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
        vinnova: m.vinnova ? { projects: m.vinnova.projects, grantSek: m.vinnova.grantSek } : null,
      }))
      .sort((a, b) => b.euContributionSek - a.euContributionSek),
    peerCaveats: [...(peers?.rules?.caveats ?? []), ...(peers?.rules?.vinnova ? [peers.rules.vinnova] : [])],
    vinnova: history.vinnova
      ? {
          rule: history.vinnova.rule,
          projects: history.vinnova.projects
            .map((p) => ({
              id: p.id,
              diarienummer: p.diarienummer,
              title: p.title,
              programme: p.programmeName,
              startDate: p.startDate,
              endDate: p.endDate,
              coordinator: p.coordinator,
              grantSek: p.grant?.currency === "SEK" ? p.grant.amount : null,
              url: p.sourceUrl,
            }))
            .sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? "")),
          totalSek: history.vinnova.projects.reduce((s, p) => s + (p.grant?.currency === "SEK" ? p.grant.amount : 0), 0),
        }
      : null,
  };
}

// ---------------------------------------------------------------------------
// The leadership report's municipality comparison (peers.json)
// ---------------------------------------------------------------------------

export interface LeadershipPeer {
  name: string;
  reference: boolean;
  population: number | null;
  projects: number;
  euContributionSek: number;
  euContributionEur: number;
  /** Kronor per inhabitant; null without a population figure. */
  perCapitaSek: number | null;
  /** Per programme period: projects and EU grant in kronor. Kronor are the
   * period's share of the municipality's kronor total, by its euro share
   * (the file gives periods in euro only). */
  byPeriod: Record<"2014-2020" | "2021-2027", { projects: number; sek: number }>;
  byProgram: { key: string; programme: string; projects: number; sek: number }[];
  /** Vinnova projects coordinated (national funding, kept out of the EU
   * figures); null when the data has no Vinnova count. */
  vinnova: { projects: number; grantSek: number } | null;
}

export interface LeadershipView {
  generatedAt: string;
  populationYear: number;
  peers: LeadershipPeer[];
  caveats: string[];
}

export function leadershipView(profile: DemoProfileId = DEFAULT_PROFILE): LeadershipView | null {
  const { profiles } = loadProfiles();
  const peers = (profiles.profiles[profile]?.peers ?? null) as (PeersFile & { generatedAt?: string }) | null;
  if (!peers?.municipalities?.length) return null;
  return {
    generatedAt: peers.generatedAt ?? profiles.generatedAt,
    populationYear: POPULATION_YEAR,
    caveats: [...(peers.rules?.caveats ?? []), ...(peers.rules?.vinnova ? [peers.rules.vinnova] : [])],
    peers: peers.municipalities.map((m) => {
      const population = populationOf(m.kommunkod);
      // Kronor per euro for this municipality's own mix of years.
      const sekPerEur = m.euContributionEur > 0 ? m.euContributionSek / m.euContributionEur : 0;
      const byPeriod: LeadershipPeer["byPeriod"] = {
        "2014-2020": { projects: 0, sek: 0 },
        "2021-2027": { projects: 0, sek: 0 },
      };
      const byProgram = new Map<string, LeadershipPeer["byProgram"][number]>();
      for (const p of m.byProgram ?? []) {
        for (const [period, v] of Object.entries(p.byPeriod ?? {})) {
          if (period !== "2014-2020" && period !== "2021-2027") continue;
          byPeriod[period].projects += v.projects;
          byPeriod[period].sek += Math.round(v.euContributionEur * sekPerEur);
        }
        const key = p.programId ?? `name:${p.programme}`;
        const label = (p.programId && findProgram(p.programId)?.shortName) || p.programme;
        const prev = byProgram.get(key);
        byProgram.set(key, {
          key,
          programme: prev?.programme ?? label,
          projects: (prev?.projects ?? 0) + p.projects,
          sek: (prev?.sek ?? 0) + p.euContributionSek,
        });
      }
      return {
        name: m.name,
        reference: m.reference,
        population,
        projects: m.projects,
        euContributionSek: m.euContributionSek,
        euContributionEur: m.euContributionEur,
        perCapitaSek: population ? m.euContributionSek / population : null,
        byPeriod,
        byProgram: [...byProgram.values()].sort((a, b) => b.sek - a.sek),
        vinnova: m.vinnova ? { projects: m.vinnova.projects, grantSek: m.vinnova.grantSek } : null,
      };
    }),
  };
}

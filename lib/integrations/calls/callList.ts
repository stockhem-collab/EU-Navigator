// Reads data/utlysningar.csv — the hand-kept list of real calls (open,
// planned, upcoming and expected) — into the app's FundingCall shape.
// Columns: Namn, Program, Länk, Öppnar, Stänger, Minsta bidrag, Största
// bidrag, Valuta, Stödnivå (%), Vem får söka, Beskrivning, Status, Tema,
// Kommentar. Dates may be months and preliminary ("2027-04 (prel.)");
// euro amounts are converted at the yearly average rate of the year the
// call opens (data/vaxelkurs.csv).

import type { CallDate, CallSourceStatus, FundingCall, FundTheme, Sector } from "../../types";
import { convert, eurSekRate, type EurSekRates } from "../core/currency";
import { parseAmount } from "../core/values";

const STATUS: Record<string, CallSourceStatus> = {
  öppen: "open",
  planerad: "planned",
  kommande: "upcoming",
  förväntad: "expected",
};

const TEMA_SECTORS: Record<string, Sector> = {
  "klimat och miljö": "climate",
  energi: "energy",
  "mobilitet och transport": "mobility",
  utbildning: "education",
  "social omsorg": "social",
  hälsa: "health",
};

/** The app's programme for the call list's free-text Program column. */
export function programIdFor(program: string): string | null {
  const p = program.toLowerCase();
  if (/\bdut\b|driving urban transitions/.test(p)) return "driving-urban-transitions";
  if (/horisont europa|horizon europe/.test(p)) return "horizon";
  if (/socialfonden|esf/.test(p)) return "esf";
  if (/\blife\b/.test(p)) return "life";
  if (/regionalfonden|erdf/.test(p)) return "erdf";
  if (/interreg/.test(p)) return null;
  if (/erasmus/.test(p)) return "erasmus";
  if (/digital europe|digitala europa/.test(p)) return "digital-europe";
  return null;
}

/** "2026-02-04", "2027-04 (prel.)" → a CallDate; null for an empty cell. */
export function parseCallDate(value: string | undefined): CallDate | null {
  const v = (value ?? "").trim();
  if (!v) return null;
  const m = v.match(/^(\d{4}-\d{2}(?:-\d{2})?)/);
  if (!m) throw new Error(`Ogiltigt datum i utlysningslistan: "${v}"`);
  return { date: m[1], preliminary: /prel/i.test(v) };
}

/** The last day a CallDate can mean: the day itself, or a month's last day. */
export function lastDayOf(date: CallDate): string {
  if (date.date.length === 10) return date.date;
  const [y, m] = date.date.split("-").map(Number);
  const last = new Date(Date.UTC(y, m, 0)).getUTCDate();
  return `${date.date}-${String(last).padStart(2, "0")}`;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

function monthsUntil(isoDate: string, now: Date): number {
  const days = (new Date(`${isoDate}T23:59:59`).getTime() - now.getTime()) / 86_400_000;
  return days < 0 ? Math.floor(days / 30.44) : Math.round(days / 30.44);
}

export interface CallListOptions {
  rates: EurSekRates;
  /** Rule-based tag suggestions for a call's text (lib/matching/tagSuggestions). */
  suggestTags: (text: string) => string[];
  /** The eufonder.se themes for a Tema value (lib/data/fundThemes). */
  themesFromTema: (tema: string) => FundTheme[] | undefined;
  now?: Date;
}

export function callsFromList(records: Record<string, string>[], options: CallListOptions): FundingCall[] {
  const { rates, suggestTags, themesFromTema, now = new Date() } = options;
  const seen = new Set<string>();
  return records
    .filter((r) => (r["Namn"] ?? "").trim())
    .map((r, i) => {
      const row = i + 2; // header is row 1
      const name = r["Namn"].trim();
      const programId = programIdFor(r["Program"] ?? "");
      if (!programId) throw new Error(`Rad ${row}: okänt program "${r["Program"]}"`);
      const statusText = (r["Status"] ?? "").trim().toLowerCase();
      const sourceStatus = STATUS[statusText];
      if (!sourceStatus) throw new Error(`Rad ${row}: okänd status "${r["Status"]}"`);
      const opens = parseCallDate(r["Öppnar"]);
      const closes = parseCallDate(r["Stänger"]);
      if (!closes) throw new Error(`Rad ${row}: stängningsdatum saknas`);

      const topic = name.match(/\(([A-Z][A-Z0-9-]{6,})\)/)?.[1];
      let id = topic ? topic.toLowerCase() : slug(name);
      while (seen.has(id)) id = `${id}-2`;
      seen.add(id);

      const currency = (r["Valuta"] ?? "").trim().toUpperCase() === "EUR" ? "EUR" : "SEK";
      const min = parseAmount(r["Minsta bidrag"]);
      const max = parseAmount(r["Största bidrag"]);
      const rateYear = Number((opens ?? closes).date.slice(0, 4));
      const toSek = (amount: number | null) =>
        amount === null ? null : convert({ amount, currency }, "SEK", rateYear, rates).amount;
      const minSek = toSek(min);
      const maxSek = toSek(max);
      const stated = min !== null || max !== null;

      const rate = (r["Stödnivå (%)"] ?? "").trim();
      const who = (r["Vem får söka"] ?? "").trim();
      const description = (r["Beskrivning"] ?? "").trim();
      const comment = (r["Kommentar"] ?? "").trim();
      const tema = (r["Tema"] ?? "").trim();
      const sector = TEMA_SECTORS[tema.toLowerCase()];
      const consortium = /konsorti|minst tre|tre (?:partner|organisationer)/i.test(who);
      const deadlineDate = lastDayOf(closes);

      const call: FundingCall = {
        id,
        programId,
        title_sv: name,
        title_en: name,
        status: sourceStatus === "open" ? "open" : "upcoming",
        sourceStatus,
        ...(opens ? { opens } : {}),
        closes,
        deadlineDate,
        deadlineMonthsFromNow: monthsUntil(deadlineDate, now),
        budgetTotalSEK: 0,
        minGrantSEK: minSek ?? 0,
        maxGrantSEK: maxSek ?? minSek ?? 0,
        ...(stated ? {} : { grantRangeStated: false }),
        ...(stated && currency === "EUR"
          ? { originalGrantRange: { min, max, currency: "EUR" as const, rate: eurSekRate(rates, rateYear), rateYear } }
          : {}),
        requiresPartnership: consortium,
        ...(consortium && /tre länder/i.test(who) ? { minPartnerCountries: 3 } : {}),
        eligibleApplicants_sv: who,
        eligibleApplicants_en: who,
        ...(rate && Number.isFinite(Number(rate)) ? { coFinancingRate: Number(rate) / 100 } : {}),
        priorities_sv: [],
        priorities_en: [],
        extraKeywords: [],
        tags: suggestTags(`${name} ${description}`),
        ...(themesFromTema(tema) ? { themes: themesFromTema(tema) } : {}),
        ...(sector ? { sectors: [sector] } : {}),
        evaluationCriteria: [],
        documents: [],
        ...(r["Länk"]?.trim() ? { link: r["Länk"].trim() } : {}),
        ...(description ? { description_sv: description } : {}),
        ...(comment ? { comment_sv: comment } : {}),
        extractionSource: "call-list",
      };
      return call;
    });
}

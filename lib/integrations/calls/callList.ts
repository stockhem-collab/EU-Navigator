// Reads data/utlysningar.csv — the hand-kept list of real calls (open,
// planned, upcoming and expected) — into the app's FundingCall shape.
// Columns: Namn, Program, Länk, Öppnar, Stänger, Minsta bidrag, Största
// bidrag, Valuta, Stödnivå (%), Vem får söka, Beskrivning, Status, Tema,
// Kommentar, Taggar, Ansökningsmall, Rapportmall. Dates may be months and preliminary ("2027-04 (prel.)");
// euro amounts are converted at the yearly average rate of the year the
// call opens (data/vaxelkurs.csv). Taggar holds hand-set tags (labels or
// ids from lib/data/tags.ts, comma-separated); when it is empty the tags are
// suggested from the call's name and description. Ansökningsmall names
// the funder's application form the call uses (a CallTemplate id from
// lib/data/callTemplates.ts); the call then takes the form's evaluation
// criteria too. Rapportmall names the report form the grant's reports
// follow (a report CallTemplate id).

import type {
  ApplicationRequirement,
  CallDate,
  CallSourceStatus,
  FundingCall,
  FundTheme,
  RequirementChanges,
  RequirementDue,
  RequirementKind,
  RequirementOwner,
  Sector,
  SwedishRegion,
} from "../../types";
import { convert, eurSekRate, type EurSekRates } from "../core/currency";
import { parseAmount } from "../core/values";
import { findCallTemplate } from "../../data/callTemplates";

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
  if (/interreg/.test(p) && /central baltic/.test(p)) return "interreg-central-baltic";
  if (/interreg/.test(p) && /östersjö|baltic sea/.test(p)) return "interreg-baltic-sea";
  if (/interreg/.test(p)) return null;
  if (/\bcerv\b/.test(p)) return "cerv";
  if (/erasmus/.test(p)) return "erasmus";
  if (/digital europe|digitala europa/.test(p)) return "digital-europe";
  return null;
}

/** ESF+ calls are announced per region; the region is the last part of the
 * call name ("A1 … – Stockholm"). The counties follow ESF-rådets eight
 * regions. */
const ESF_REGIONS: Record<string, SwedishRegion[]> = {
  stockholm: ["stockholm"],
  "östra mellansverige": ["uppsala", "sodermanland", "ostergotland", "orebro", "vastmanland"],
};

export function esfRegionsFor(name: string): SwedishRegion[] | undefined {
  const region = name.split(/\s+–\s+/).pop()?.trim().toLowerCase() ?? "";
  return ESF_REGIONS[region];
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
  /** Rule-based tag suggestions for a call's text (lib/matching/tagSuggestions),
   * used when the row has no Taggar. */
  suggestTags: (text: string) => string[];
  /** A Taggar value (label or id) → tag id (lib/data/tags.ts). */
  tagIdFor: (label: string) => string | undefined;
  /** The eufonder.se themes for a Tema value (lib/data/fundThemes). */
  themesFromTema: (tema: string) => FundTheme[] | undefined;
  /** The rows of data/utlysningskrav.csv — each call's own requirements
   * for a complete application (see requirementChangesFromList). */
  requirements?: Record<string, string>[];
  now?: Date;
}

export function callsFromList(records: Record<string, string>[], options: CallListOptions): FundingCall[] {
  const { rates, suggestTags, tagIdFor, themesFromTema, requirements = [], now = new Date() } = options;
  const seen = new Set<string>();
  const calls = records
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
      const handTags = (r["Taggar"] ?? "")
        .split(/[,;]/)
        .map((t) => t.trim())
        .filter(Boolean)
        .map((label) => {
          const tagId = tagIdFor(label);
          if (!tagId) throw new Error(`Rad ${row}: okänd tagg "${label}"`);
          return tagId;
        });
      const templateId = (r["Ansökningsmall"] ?? "").trim();
      const template = findCallTemplate(templateId);
      if (templateId && (!template || template.kind === "report")) throw new Error(`Rad ${row}: okänd ansökningsmall "${templateId}"`);
      const reportTemplateId = (r["Rapportmall"] ?? "").trim();
      if (reportTemplateId && findCallTemplate(reportTemplateId)?.kind !== "report") {
        throw new Error(`Rad ${row}: okänd rapportmall "${reportTemplateId}"`);
      }
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
        ...(programId === "esf" && esfRegionsFor(name) ? { eligibleRegions: esfRegionsFor(name) } : {}),
        ...(consortium && /tre länder/i.test(who) ? { minPartnerCountries: 3 } : {}),
        eligibleApplicants_sv: who,
        eligibleApplicants_en: who,
        ...(rate && Number.isFinite(Number(rate)) ? { coFinancingRate: Number(rate) / 100 } : {}),
        priorities_sv: [],
        priorities_en: [],
        extraKeywords: [],
        tags: handTags.length > 0 ? handTags : suggestTags(`${name} ${description}`),
        ...(themesFromTema(tema) ? { themes: themesFromTema(tema) } : {}),
        ...(sector ? { sectors: [sector] } : {}),
        evaluationCriteria: template?.evaluationCriteria ? [...template.evaluationCriteria] : [],
        documents: [],
        ...(template ? { applicationTemplateId: template.id } : {}),
        ...(reportTemplateId ? { reportTemplateId } : {}),
        ...(r["Länk"]?.trim() ? { link: r["Länk"].trim() } : {}),
        ...(description ? { description_sv: description } : {}),
        ...(comment ? { comment_sv: comment } : {}),
        extractionSource: "call-list",
      };
      return call;
    });
  const changes = requirementChangesFromList(requirements, calls.map((c) => c.id));
  return calls.map((c) => (changes[c.id] ? { ...c, requirementChanges: changes[c.id] } : c));
}

const KINDS: Record<string, RequirementKind> = {
  formulär: "form",
  budget: "budget",
  bilaga: "annex",
  intyg: "certificate",
  deklaration: "declaration",
  behörighet: "eligibility",
  inlämning: "submission",
};

const OWNERS: Record<string, RequirementOwner> = {
  sökande: "applicant",
  firmatecknare: "signatory",
  ekonomi: "finance",
  inköp: "procurement",
  partner: "partners",
  hr: "hr",
};

const DUE: Record<string, RequirementDue> = {
  "med ansökan": "with-application",
  "efter stängning": "after-close",
  "före avtal": "before-agreement",
};

/** Reads data/utlysningskrav.csv — each call's own changes to its form's
 * requirements for a complete application. Columns: Utlysning (the call's
 * id), Åtgärd ("lägg till", "ta bort" or "sidgräns"), Krav-id, Typ
 * (formulär, budget, bilaga, intyg, deklaration, behörighet, inlämning),
 * Titel, Beskrivning, Villkor, Obligatorisk (ja/nej), Undantag offentliga
 * organ (ja), Ansvarig (sökande, firmatecknare, ekonomi, inköp, partner,
 * hr), Ledtid (dagar), Lämnas (med ansökan, efter stängning, före avtal),
 * Länk, Länktext, Sidgräns, Källa, Källänk, Kontrollerad. "ta bort" names
 * a requirement of the form or programme that doesn't apply to the call;
 * "sidgräns" sets the call's page limit. The texts are Swedish only, like
 * the call list itself. */
export function requirementChangesFromList(rows: Record<string, string>[], callIds: string[]): Record<string, RequirementChanges> {
  const out: Record<string, RequirementChanges> = {};
  rows.forEach((r, i) => {
    const row = i + 2;
    const callId = (r["Utlysning"] ?? "").trim();
    if (!callId) return;
    if (!callIds.includes(callId)) throw new Error(`utlysningskrav.csv rad ${row}: okänd utlysning "${callId}"`);
    const changes = (out[callId] ??= {});
    const action = (r["Åtgärd"] ?? "").trim().toLowerCase();
    const id = (r["Krav-id"] ?? "").trim();
    if (action === "sidgräns") {
      const pages = Number((r["Sidgräns"] ?? "").trim());
      if (!Number.isInteger(pages) || pages <= 0) throw new Error(`utlysningskrav.csv rad ${row}: ogiltig sidgräns`);
      changes.pageLimit = pages;
      return;
    }
    if (!id) throw new Error(`utlysningskrav.csv rad ${row}: Krav-id saknas`);
    if (action === "ta bort") {
      changes.remove = [...(changes.remove ?? []), id];
      return;
    }
    if (action !== "lägg till") throw new Error(`utlysningskrav.csv rad ${row}: okänd åtgärd "${r["Åtgärd"]}"`);
    const kind = KINDS[(r["Typ"] ?? "").trim().toLowerCase()];
    if (!kind) throw new Error(`utlysningskrav.csv rad ${row}: okänd typ "${r["Typ"]}"`);
    const title = (r["Titel"] ?? "").trim();
    if (!title) throw new Error(`utlysningskrav.csv rad ${row}: titel saknas`);
    const ownerText = (r["Ansvarig"] ?? "").trim().toLowerCase();
    const owner = OWNERS[ownerText];
    if (ownerText && !owner) throw new Error(`utlysningskrav.csv rad ${row}: okänd ansvarig "${r["Ansvarig"]}"`);
    const dueText = (r["Lämnas"] ?? "").trim().toLowerCase();
    const due = DUE[dueText];
    if (dueText && !due) throw new Error(`utlysningskrav.csv rad ${row}: okänt värde i Lämnas "${r["Lämnas"]}"`);
    const lead = Number((r["Ledtid (dagar)"] ?? "").trim());
    const why = (r["Beskrivning"] ?? "").trim();
    const condition = (r["Villkor"] ?? "").trim();
    const url = (r["Länk"] ?? "").trim();
    const sourceUrl = (r["Källänk"] ?? "").trim();
    const requirement: ApplicationRequirement = {
      id,
      kind,
      title_sv: title,
      title_en: title,
      why_sv: why,
      why_en: why,
      mandatory: (r["Obligatorisk"] ?? "").trim().toLowerCase() !== "nej",
      ...(condition ? { condition_sv: condition, condition_en: condition } : {}),
      ...((r["Undantag offentliga organ"] ?? "").trim().toLowerCase() === "ja" ? { exemptPublicBodies: true } : {}),
      ...(owner ? { owner } : {}),
      ...(lead > 0 ? { leadTimeDays: lead } : {}),
      ...(due && due !== "with-application" ? { due } : {}),
      ...(url ? { link: { url, label_sv: (r["Länktext"] ?? "").trim() || title, label_en: (r["Länktext"] ?? "").trim() || title } } : {}),
      source: {
        document: (r["Källa"] ?? "").trim() || "Utlysningen",
        ...(sourceUrl ? { url: sourceUrl } : {}),
        checkedAt: (r["Kontrollerad"] ?? "").trim(),
      },
    };
    changes.add = [...(changes.add ?? []), requirement];
  });
  return out;
}

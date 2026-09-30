import { Commitment, ReportingEvent, ReportingPeriodicity } from "@/lib/types";

// A grant's full reporting plan, generated when it's registered: one
// interim report per reporting period from the project's start (or today,
// if it has already started) to its end, then the final report — each with
// a real date, not a "months from now" that goes stale. Reports are due a
// month after their period ends; the final report three months after the
// project ends, the usual windows in EU programmes.

const PERIOD_MONTHS: Record<ReportingPeriodicity, number> = { quarterly: 3, biannual: 6, annual: 12 };
const INTERIM_DUE_AFTER_MONTHS = 1;
const FINAL_DUE_AFTER_MONTHS = 3;
/** Guards against an implausibly long project producing hundreds of rows. */
const MAX_INTERIM_REPORTS = 16;

const MONTHS_SV = ["jan", "feb", "mar", "apr", "maj", "jun", "jul", "aug", "sep", "okt", "nov", "dec"];
const MONTHS_EN = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function addMonths(date: Date, months: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + months, date.getDate());
}

function isoDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Whole months from `now` until `date` — 0 within the coming month, and
 * negative (at least -1) once it has passed. */
export function monthsUntil(date: Date, now: Date = new Date()): number {
  if (date >= now) {
    const raw = (date.getFullYear() - now.getFullYear()) * 12 + (date.getMonth() - now.getMonth());
    return date.getDate() < now.getDate() ? Math.max(0, raw - 1) : raw;
  }
  const back =
    (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth()) - (now.getDate() < date.getDate() ? 1 : 0);
  return -Math.max(1, back);
}

/** When a report is due: its own date when it has one, else the month its
 * relative deadline points at (seed data only has the relative form). */
export function reportDueDate(event: Pick<ReportingEvent, "deadlineDate" | "deadlineMonthsFromNow">, now: Date = new Date()): Date {
  if (event.deadlineDate) return new Date(`${event.deadlineDate}T00:00:00`);
  return new Date(now.getFullYear(), now.getMonth() + event.deadlineMonthsFromNow, 1);
}

/** The report's due date as text — the exact day when it has a real date,
 * the month otherwise. */
export function formatReportDue(event: Pick<ReportingEvent, "deadlineDate" | "deadlineMonthsFromNow">, lang: "sv" | "en", now: Date = new Date()): string {
  const date = reportDueDate(event, now);
  const locale = lang === "sv" ? "sv-SE" : "en-GB";
  return event.deadlineDate
    ? date.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })
    : date.toLocaleDateString(locale, { month: "long", year: "numeric" });
}

/** Keeps deadlineMonthsFromNow in step with a real deadline date, so every
 * list, sort and notification that reads the relative form stays right. */
export function withCurrentDeadline<T extends Pick<ReportingEvent, "deadlineDate" | "deadlineMonthsFromNow">>(event: T, now: Date = new Date()): T {
  if (!event.deadlineDate) return event;
  const months = monthsUntil(reportDueDate(event, now), now);
  return months === event.deadlineMonthsFromNow ? event : { ...event, deadlineMonthsFromNow: months };
}

function periodLabel(from: Date, to: Date, lang: "sv" | "en"): string {
  const names = lang === "sv" ? MONTHS_SV : MONTHS_EN;
  const last = new Date(to.getFullYear(), to.getMonth() - 1, 1); // the period's last month
  return from.getFullYear() === last.getFullYear()
    ? `${names[from.getMonth()]}–${names[last.getMonth()]} ${last.getFullYear()}`
    : `${names[from.getMonth()]} ${from.getFullYear()}–${names[last.getMonth()]} ${last.getFullYear()}`;
}

export function buildReportingSchedule({
  idPrefix,
  periodStart,
  periodEnd,
  periodicity,
  now = new Date(),
}: {
  idPrefix: string;
  /** The project's first and last year. */
  periodStart: number;
  periodEnd: number;
  periodicity: ReportingPeriodicity;
  now?: Date;
}): ReportingEvent[] {
  const interval = PERIOD_MONTHS[periodicity];
  const projectStart = new Date(periodStart, 0, 1);
  const projectEnd = new Date(Math.max(periodEnd, periodStart) + 1, 0, 1); // exclusive: 1 Jan after the last year
  // Reporting starts from the project's start, or from the current month
  // for a grant registered after the project has started.
  const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  let from = projectStart > thisMonth ? projectStart : thisMonth;
  const events: ReportingEvent[] = [];

  let n = 1;
  while (n <= MAX_INTERIM_REPORTS) {
    const to = addMonths(from, interval);
    if (to >= projectEnd) break;
    const due = addMonths(to, INTERIM_DUE_AFTER_MONTHS);
    events.push({
      id: `${idPrefix}-report-${n}`,
      type: "interim",
      periodLabel_sv: `Lägesrapport ${n} (${periodLabel(from, to, "sv")})`,
      periodLabel_en: `Progress report ${n} (${periodLabel(from, to, "en")})`,
      deadlineDate: isoDate(due),
      deadlineMonthsFromNow: monthsUntil(due, now),
      status: "upcoming",
      outcomes: [],
    });
    from = to;
    n += 1;
  }

  const finalDue = addMonths(projectEnd, FINAL_DUE_AFTER_MONTHS);
  events.push({
    id: `${idPrefix}-final`,
    type: "final",
    periodLabel_sv: "Slutrapport",
    periodLabel_en: "Final report",
    deadlineDate: isoDate(finalDue),
    deadlineMonthsFromNow: monthsUntil(finalDue, now),
    status: "upcoming",
    outcomes: [],
  });
  return events;
}

// ---------------------------------------------------------------------------
// Commitments from the application's text: every sentence that states a
// number with a unit ("minska energianvändningen med 20 %", "300
// medarbetare deltar i utbildning") becomes a suggested commitment — the
// user confirms, corrects or removes each one when registering the grant.
// ---------------------------------------------------------------------------

const UNIT_PATTERN =
  "%|procent|mwh|kwh|gwh|ton(?:\\s*co2e?)?|deltagare|personer|medarbetare|anställda|elever|skolor|byggnader|st(?:ycken)?\\b|platser|timmar|km|kvm|m2|hushåll|företag|organisationer|kommuner";
const QUANTITY = new RegExp(`(\\d[\\d\\s]*(?:[.,]\\d+)?)\\s*(${UNIT_PATTERN})`, "i");

const UNIT_EN: Record<string, string> = {
  procent: "%",
  deltagare: "participants",
  personer: "people",
  medarbetare: "employees",
  anställda: "employees",
  elever: "pupils",
  skolor: "schools",
  byggnader: "buildings",
  st: "units",
  stycken: "units",
  platser: "places",
  timmar: "hours",
  hushåll: "households",
  företag: "companies",
  organisationer: "organisations",
  kommuner: "municipalities",
};

export function extractCommitments(text: string, max = 8): Commitment[] {
  const commitments: Commitment[] = [];
  const sentences = text.split(/(?<=[.!?])\s+|\n+/).map((s) => s.trim()).filter(Boolean);
  for (const sentence of sentences) {
    const match = sentence.match(QUANTITY);
    if (!match) continue;
    const value = parseFloat(match[1].replace(/\s/g, "").replace(",", "."));
    if (!Number.isFinite(value) || value <= 0) continue;
    // Years and budget figures aren't commitments.
    if (/^(19|20)\d\d$/.test(match[1].trim()) || /kr\b|kronor|sek\b|mnkr/i.test(sentence.slice(match.index ?? 0, (match.index ?? 0) + match[0].length + 6))) continue;
    const rawUnit = match[2].toLowerCase().replace(/\s+/g, " ");
    const unit = rawUnit === "procent" ? "%" : rawUnit;
    const indicator = sentence
      .replace(match[0], "")
      .replace(/\s{2,}/g, " ")
      .replace(/[\s.!?,:;]+$/, "")
      .replace(/\s+(med|till|om|på|av|för|i)$/i, "")
      .trim();
    if (indicator.length < 4) continue;
    const label = (indicator.charAt(0).toUpperCase() + indicator.slice(1)).slice(0, 90);
    if (commitments.some((c) => c.indicator_sv === label)) continue;
    commitments.push({
      indicator_sv: label,
      indicator_en: label,
      promisedValue: value,
      unit_sv: unit,
      unit_en: UNIT_EN[unit] ?? unit,
    });
    if (commitments.length >= max) break;
  }
  return commitments;
}

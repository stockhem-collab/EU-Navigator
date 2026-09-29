import { Grant, ReportingEvent } from "@/lib/types";

// Grants ("beviljat stöd") — the funding decision an awarded application
// leads to, and the reporting/compliance loop that follows. Each project's `reportingEvents` is only as long as its actual
// history so far (past interim reports plus the next one known about) —
// not a pre-filled slot for every report the call's ReportingRequirement
// will eventually require, the same way a real grantee doesn't schedule a
// report before the funder has opened that reporting window. Illustrative
// demo data.
export const seedGrants: Grant[] = [
  {
    id: "ap-1",
    title_sv: "LIFE – Green Schools",
    title_en: "LIFE – Green Schools",
    callId: "life-2027-climate-schools",
    // The Projektbank idea this award actually came from — same theme
    // (school energy efficiency), still sitting at status "idea" there
    // even though it's this far into its own reporting cycle.
    projectBankEntryId: "pb-1",
    awardedAmountSEK: 42_400_000,
    commitments: [
      {
        indicator_sv: "Antal deltagare i informationsinsatser",
        indicator_en: "Participants in outreach activities",
        promisedValue: 1500,
        unit_sv: "personer",
        unit_en: "people",
      },
      {
        indicator_sv: "Minskad energianvändning",
        indicator_en: "Reduced energy use",
        promisedValue: 20,
        unit_sv: "%",
        unit_en: "%",
      },
      {
        indicator_sv: "Pilotanläggningar i drift",
        indicator_en: "Pilot installations in operation",
        promisedValue: 5,
        unit_sv: "st",
        unit_en: "units",
      },
    ],
    reportingEvents: [
      {
        id: "ap-1-report-1",
        type: "interim",
        periodLabel_sv: "Lägesrapport 2027",
        periodLabel_en: "Progress report 2027",
        deadlineMonthsFromNow: -10,
        status: "approved",
        outcomes: [
          { indicator_sv: "Antal deltagare i informationsinsatser", value: 620 },
          { indicator_sv: "Minskad energianvändning", value: 5 },
          { indicator_sv: "Pilotanläggningar i drift", value: 2 },
        ],
        financials: { spentThisPeriodSEK: 9_500_000 },
        note_sv: "Tidig fas — ungefär hälften av skolorna har påbörjat renovering.",
        note_en: "Early phase — roughly half the schools have started renovation.",
      },
      {
        id: "ap-1-report-2",
        type: "interim",
        periodLabel_sv: "Lägesrapport 2028",
        periodLabel_en: "Progress report 2028",
        deadlineMonthsFromNow: -1,
        status: "submitted",
        outcomes: [
          { indicator_sv: "Antal deltagare i informationsinsatser", value: 1034 },
          { indicator_sv: "Minskad energianvändning", value: 12 },
          { indicator_sv: "Pilotanläggningar i drift", value: 5 },
        ],
        financials: { spentThisPeriodSEK: 8_900_000 },
        note_sv:
          "Deltagarutfallet ligger under plan — två informationsträffar återstår innan årsslut. Energiminskningen förklaras delvis av att endast 6 av 14 skolor hittills färdigställts. Pilotanläggningarna är levererade enligt plan.",
        note_en:
          "Participant outturn is behind plan — two outreach sessions remain before year-end. The energy figure is partly explained by only 6 of 14 schools being completed so far. The pilot installations were delivered as planned.",
      },
      {
        id: "ap-1-report-3",
        type: "final",
        periodLabel_sv: "Slutrapport",
        periodLabel_en: "Final report",
        deadlineMonthsFromNow: 4,
        status: "upcoming",
        outcomes: [],
      },
    ],
  },
  {
    id: "ap-2",
    title_sv: "ESF+ – Kompetenslyft äldreomsorg",
    title_en: "ESF+ – Elderly care skills upgrade",
    callId: "esf-2027-care-skills",
    // Same underlying idea as Projektbank's "pb-3" (identical title),
    // still marked "idea" there despite already being mid-reporting here.
    projectBankEntryId: "pb-3",
    awardedAmountSEK: 12_800_000,
    commitments: [
      {
        indicator_sv: "Antal utbildade medarbetare",
        indicator_en: "Staff trained",
        promisedValue: 400,
        unit_sv: "personer",
        unit_en: "people",
      },
      {
        indicator_sv: "Minskad personalomsättning",
        indicator_en: "Reduced staff turnover",
        promisedValue: 10,
        unit_sv: "%",
        unit_en: "%",
      },
    ],
    reportingEvents: [
      {
        id: "ap-2-report-1",
        type: "interim",
        periodLabel_sv: "Delrapport Q1 2027",
        periodLabel_en: "Interim report Q1 2027",
        deadlineMonthsFromNow: -8,
        status: "revision-requested",
        outcomes: [
          { indicator_sv: "Antal utbildade medarbetare", value: 140 },
          { indicator_sv: "Minskad personalomsättning", value: 1 },
        ],
        financials: { spentThisPeriodSEK: 2_100_000 },
        note_sv:
          "Handläggande myndighet har begärt komplettering av underlaget för deltagarstatistik innan rapporten kan godkännas.",
        note_en: "The managing authority has requested supplementary participant-statistics documentation before the report can be approved.",
      },
      {
        id: "ap-2-report-2",
        type: "interim",
        periodLabel_sv: "Delrapport Q2 2027",
        periodLabel_en: "Interim report Q2 2027",
        deadlineMonthsFromNow: -5,
        status: "approved",
        outcomes: [
          { indicator_sv: "Antal utbildade medarbetare", value: 410 },
          { indicator_sv: "Minskad personalomsättning", value: 4 },
        ],
        financials: { spentThisPeriodSEK: 3_400_000 },
        note_sv:
          "Utbildningsmålet nått något tidigare än planerat. Effekten på personalomsättningen uppstår sannolikt med viss eftersläpning — följs upp i nästa rapport.",
        note_en:
          "The training target was reached slightly ahead of plan. The effect on staff turnover likely lags somewhat — to be followed up in the next report.",
      },
      {
        id: "ap-2-report-3",
        type: "interim",
        periodLabel_sv: "Delrapport Q3 2027",
        periodLabel_en: "Interim report Q3 2027",
        deadlineMonthsFromNow: 2,
        status: "upcoming",
        outcomes: [],
      },
    ],
  },
];

export function findGrant(id: string): Grant | undefined {
  return seedGrants.find((a) => a.id === id);
}

/** The next reporting event still awaiting submission, in chronological
 * order — what "nästa rapportering" should point at. Undefined once every
 * known event has been submitted (nothing scheduled yet). Does not surface
 * a "revision-requested" event — see nextActionableReport for the version
 * that also does. */
export function nextUpcomingReport(project: Grant): ReportingEvent | undefined {
  return project.reportingEvents.find((r) => r.status === "upcoming");
}

/** The reporting event that actually needs someone to do something right
 * now: a report sent back for correction takes priority — it's blocking —
 * over the next scheduled-but-not-yet-due report. This is what the
 * submission form should open on, so a "revision-requested" report is
 * actually fixable rather than just visibly stuck. */
export function nextActionableReport(project: Grant): ReportingEvent | undefined {
  return project.reportingEvents.find((r) => r.status === "revision-requested") ?? nextUpcomingReport(project);
}

/** The most recently reported outturn for one Commitment indicator (by
 * indicator_sv) — the last reporting event that actually carries outcomes
 * for it, regardless of whether that event has since been approved.
 * Undefined if nothing has been reported for this indicator yet. */
export function latestOutcomeFor(project: Grant, indicatorSv: string): number | undefined {
  for (let i = project.reportingEvents.length - 1; i >= 0; i--) {
    const outcome = project.reportingEvents[i].outcomes.find((o) => o.indicator_sv === indicatorSv);
    if (outcome) return outcome.value;
  }
  return undefined;
}

/** Every reported outturn for one indicator across the project's history,
 * in chronological order, each paired with the period label of the report
 * it came from — the series a trend chart needs, rather than just the
 * latest point latestOutcomeFor gives. */
export function outcomeHistoryFor(
  project: Grant,
  indicatorSv: string
): { periodLabel_sv: string; periodLabel_en: string; value: number }[] {
  return project.reportingEvents
    .map((event) => {
      const outcome = event.outcomes.find((o) => o.indicator_sv === indicatorSv);
      return outcome ? { periodLabel_sv: event.periodLabel_sv, periodLabel_en: event.periodLabel_en, value: outcome.value } : null;
    })
    .filter((row): row is NonNullable<typeof row> => row !== null);
}

/** True once the final report specifically has been submitted (or
 * approved) — found by type rather than assumed to be the last array
 * entry, since a later sustainability follow-up event can be appended
 * after it. A final report still sitting at "revision-requested" does NOT
 * count as complete: there's a correction outstanding, so the project
 * isn't actually done winding down into closure/archiving yet. */
export function isReportingComplete(project: Grant): boolean {
  const final = project.reportingEvents.find((e) => e.type === "final");
  return final !== undefined && (final.status === "submitted" || final.status === "approved");
}

/** Every reported "spent this period" figure across the project's
 * reporting history, in chronological order — the series a spend view
 * needs, mirroring outcomeHistoryFor's shape for indicators. */
export function financialHistory(
  project: Grant
): { periodLabel_sv: string; periodLabel_en: string; spentThisPeriodSEK: number }[] {
  return project.reportingEvents
    .filter((e) => e.financials !== undefined)
    .map((e) => ({
      periodLabel_sv: e.periodLabel_sv,
      periodLabel_en: e.periodLabel_en,
      spentThisPeriodSEK: e.financials!.spentThisPeriodSEK,
    }));
}

/** Total spent to date, as of and including one specific reporting event
 * — the running sum of every period's spend up to that point in the
 * project's chronological reporting history. Computed from the per-period
 * figures rather than stored as its own running total, so it can't drift
 * from them. */
export function cumulativeSpentThrough(project: Grant, eventId: string): number {
  let total = 0;
  for (const event of project.reportingEvents) {
    if (event.financials) total += event.financials.spentThisPeriodSEK;
    if (event.id === eventId) break;
  }
  return total;
}

export type ReportingHealth = "good" | "attention" | "blocked";

/** A single, portfolio-scannable status per awarded project: "blocked" if
 * any report is stuck awaiting a correction (the most urgent state —
 * takes priority regardless of how the numbers look), "attention" if the
 * latest known outturn for any commitment is meaningfully behind plan,
 * "good" otherwise. Same 90%-of-promised threshold already used for the
 * per-indicator deviation flag, just rolled up to one project-level
 * verdict for list views. */
export function reportingHealth(project: Grant): ReportingHealth {
  if (project.reportingEvents.some((e) => e.status === "revision-requested")) return "blocked";
  const anyDeviates = project.commitments.some((c) => {
    const latest = latestOutcomeFor(project, c.indicator_sv);
    return latest !== undefined && latest < c.promisedValue * 0.9;
  });
  return anyDeviates ? "attention" : "good";
}

/** Where a report stands from the reporter's point of view: "attention"
 * (returned for revision, or past its deadline without being submitted),
 * "upcoming" (still to do, not yet due), or "done" (submitted/approved).
 * Shared by Rapportera, Översikt and the notifications. */
export type ReportState = "attention" | "upcoming" | "done";

export function reportState(event: ReportingEvent): ReportState {
  if (event.status === "revision-requested") return "attention";
  if (event.status === "upcoming") return event.deadlineMonthsFromNow < 0 ? "attention" : "upcoming";
  return "done";
}

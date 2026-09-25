import { AwardedProject, ReportingEvent } from "@/lib/types";

// Awarded projects — the reporting/compliance loop after the money is
// granted. Each project's `reportingEvents` is only as long as its actual
// history so far (past interim reports plus the next one known about) —
// not a pre-filled slot for every report the call's ReportingRequirement
// will eventually require, the same way a real grantee doesn't schedule a
// report before the funder has opened that reporting window. Illustrative
// demo data.
export const awardedProjects: AwardedProject[] = [
  {
    id: "ap-1",
    title_sv: "LIFE – Green Schools",
    title_en: "LIFE – Green Schools",
    callId: "life-2027-climate-schools",
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

export function findAwardedProject(id: string): AwardedProject | undefined {
  return awardedProjects.find((a) => a.id === id);
}

/** The next reporting event still awaiting submission, in chronological
 * order — what "nästa rapportering" should point at. Undefined once every
 * known event has been submitted (nothing scheduled yet). */
export function nextUpcomingReport(project: AwardedProject): ReportingEvent | undefined {
  return project.reportingEvents.find((r) => r.status === "upcoming");
}

/** The most recently reported outturn for one Commitment indicator (by
 * indicator_sv) — the last reporting event that actually carries outcomes
 * for it, regardless of whether that event has since been approved.
 * Undefined if nothing has been reported for this indicator yet. */
export function latestOutcomeFor(project: AwardedProject, indicatorSv: string): number | undefined {
  for (let i = project.reportingEvents.length - 1; i >= 0; i--) {
    const outcome = project.reportingEvents[i].outcomes.find((o) => o.indicator_sv === indicatorSv);
    if (outcome) return outcome.value;
  }
  return undefined;
}

/** True once every known reporting event is done (submitted, approved, or
 * flagged for revision) and the most recent one was the final report —
 * i.e. there's nothing left to report and the project is winding down into
 * closure/archiving rather than still mid-delivery. */
export function isReportingComplete(project: AwardedProject): boolean {
  const last = project.reportingEvents[project.reportingEvents.length - 1];
  return last !== undefined && last.type === "final" && last.status !== "upcoming";
}

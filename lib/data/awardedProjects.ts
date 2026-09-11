import { AwardedProject } from "@/lib/types";

// Awarded projects — the reporting/compliance loop. Commitments come
// straight from what was promised in the application; actuals are what has
// been reported so far. Illustrative demo data.
export const awardedProjects: AwardedProject[] = [
  {
    id: "ap-1",
    title_sv: "LIFE – Green Schools",
    title_en: "LIFE – Green Schools",
    callId: "life-2027-climate-schools",
    awardedAmountSEK: 42_400_000,
    nextReportDueMonthsFromNow: 4,
    commitments: [
      {
        indicator_sv: "Antal deltagare i informationsinsatser",
        indicator_en: "Participants in outreach activities",
        promisedValue: 1500,
        unit_sv: "personer",
        unit_en: "people",
        currentValue: 1034,
        comment_sv: "Utfallet ligger under plan inför halvårsskiftet. Två informationsträffar återstår innan årsslut.",
        comment_en: "Outturn is behind plan at the half-year mark. Two outreach sessions remain before year-end.",
      },
      {
        indicator_sv: "Minskad energianvändning",
        indicator_en: "Reduced energy use",
        promisedValue: 20,
        unit_sv: "%",
        unit_en: "%",
        currentValue: 12,
        comment_sv: "Delvis förklarat av att endast 6 av 14 skolor hittills färdigställts.",
        comment_en: "Partly explained by only 6 of 14 schools being completed so far.",
      },
      {
        indicator_sv: "Pilotanläggningar i drift",
        indicator_en: "Pilot installations in operation",
        promisedValue: 5,
        unit_sv: "st",
        unit_en: "units",
        currentValue: 5,
        comment_sv: "Levererat enligt plan.",
        comment_en: "Delivered as planned.",
      },
    ],
  },
  {
    id: "ap-2",
    title_sv: "ESF+ – Kompetenslyft äldreomsorg",
    title_en: "ESF+ – Elderly care skills upgrade",
    callId: "esf-2027-care-skills",
    awardedAmountSEK: 12_800_000,
    nextReportDueMonthsFromNow: 2,
    commitments: [
      {
        indicator_sv: "Antal utbildade medarbetare",
        indicator_en: "Staff trained",
        promisedValue: 400,
        unit_sv: "personer",
        unit_en: "people",
        currentValue: 410,
        comment_sv: "Målet nått något tidigare än planerat.",
        comment_en: "Target reached slightly ahead of plan.",
      },
      {
        indicator_sv: "Minskad personalomsättning",
        indicator_en: "Reduced staff turnover",
        promisedValue: 10,
        unit_sv: "%",
        unit_en: "%",
        currentValue: 4,
        comment_sv: "Effekten uppstår sannolikt med viss eftersläpning — följs upp i nästa rapport.",
        comment_en: "The effect likely lags somewhat — to be followed up in the next report.",
      },
    ],
  },
];

export function findAwardedProject(id: string): AwardedProject | undefined {
  return awardedProjects.find((a) => a.id === id);
}

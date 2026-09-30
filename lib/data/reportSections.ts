import { ReportingEventType } from "@/lib/types";

// The text sections a report is written in — the structure EU programmes'
// progress and final reports broadly share (summary, activities, results,
// deviations, horizontal principles, and what comes next). Calls in this
// demo don't carry a report template of their own, so this standard one is
// used for all; a call-specific template would replace it the same way an
// application template does.
export interface ReportSection {
  key: string;
  label_sv: string;
  label_en: string;
  hint_sv: string;
  hint_en: string;
}

const SUMMARY: ReportSection = {
  key: "summary",
  label_sv: "Sammanfattning",
  label_en: "Summary",
  hint_sv: "Kort om hur projektet har gått under perioden.",
  hint_en: "Briefly, how the project went during the period.",
};
const ACTIVITIES: ReportSection = {
  key: "activities",
  label_sv: "Genomförda aktiviteter",
  label_en: "Activities carried out",
  hint_sv: "Vad som gjorts under perioden, jämfört med aktivitetsplanen.",
  hint_en: "What was done during the period, compared with the activity plan.",
};
const RESULTS: ReportSection = {
  key: "results",
  label_sv: "Resultat och effekter",
  label_en: "Results and effects",
  hint_sv: "Vad aktiviteterna har lett till — med siffror där det går.",
  hint_en: "What the activities have led to — with figures where possible.",
};
const DEVIATIONS: ReportSection = {
  key: "deviations",
  label_sv: "Avvikelser och åtgärder",
  label_en: "Deviations and measures",
  hint_sv: "Förseningar, ändrade aktiviteter eller budget, och vad ni gör åt dem.",
  hint_en: "Delays, changed activities or budget, and what you're doing about them.",
};
const HORIZONTAL: ReportSection = {
  key: "horizontal",
  label_sv: "Horisontella principer",
  label_en: "Horizontal principles",
  hint_sv: "Hur projektet har arbetat med jämställdhet, likabehandling och hållbar utveckling.",
  hint_en: "How the project has worked with gender equality, non-discrimination and sustainable development.",
};
const NEXT_PERIOD: ReportSection = {
  key: "nextPeriod",
  label_sv: "Plan för nästa period",
  label_en: "Plan for the next period",
  hint_sv: "Vad som ska göras fram till nästa rapport.",
  hint_en: "What will be done until the next report.",
};
const SUSTAINABILITY: ReportSection = {
  key: "sustainability",
  label_sv: "Resultatens hållbarhet",
  label_en: "Sustainability of the results",
  hint_sv: "Hur resultaten tas om hand och förvaltas efter projektet.",
  hint_en: "How the results are taken care of and maintained after the project.",
};

export function reportSectionsFor(type: ReportingEventType): ReportSection[] {
  if (type === "final") return [SUMMARY, ACTIVITIES, RESULTS, DEVIATIONS, HORIZONTAL, SUSTAINABILITY];
  if (type === "sustainability") return [SUMMARY, RESULTS, SUSTAINABILITY];
  return [SUMMARY, ACTIVITIES, RESULTS, DEVIATIONS, HORIZONTAL, NEXT_PERIOD];
}

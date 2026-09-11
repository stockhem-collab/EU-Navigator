import { OrgProcessStep } from "@/lib/types";

// The municipality's own internal process for external funding — a second,
// independent rule layer alongside the EU's own requirements. Illustrative
// example; the real version is meant to be built from the organisation's
// actual process/instruction material.
export const orgProcessSteps: OrgProcessStep[] = [
  {
    title_sv: "Projektägare utsedd",
    title_en: "Project owner assigned",
    desc_sv: "En namngiven person i berörd förvaltning ansvarar för projektet.",
    desc_en: "A named person in the relevant department is responsible for the project.",
    done: true,
  },
  {
    title_sv: "Förankring hos förvaltningschef",
    title_en: "Sign-off from department head",
    desc_sv: "Förvaltningschefen har godkänt att ansökan tas fram.",
    desc_en: "The department head has approved preparing the application.",
    done: true,
  },
  {
    title_sv: "Ekonomisk kalkyl godkänd",
    title_en: "Financial calculation approved",
    desc_sv: "Ekonomiavdelningen har granskat och godkänt budgetkalkylen.",
    desc_en: "The finance department has reviewed and approved the budget calculation.",
    done: true,
  },
  {
    title_sv: "Beslut om medfinansiering",
    title_en: "Co-financing decision",
    desc_sv: "Kommunstyrelsen eller motsvarande har fattat beslut om kommunens medfinansiering.",
    desc_en: "The municipal executive board (or equivalent) has decided on the municipality's co-financing.",
    done: false,
  },
  {
    title_sv: "Juridisk granskning",
    title_en: "Legal review",
    desc_sv: "Juridiska avdelningen har granskat avtalsvillkor och statsstödsfrågor.",
    desc_en: "The legal department has reviewed contract terms and state-aid questions.",
    done: false,
  },
];

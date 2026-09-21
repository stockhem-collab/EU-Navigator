import { ApplicationTemplateSection, FundingCall, FundingProgram, ProjectInput } from "@/lib/types";
import { sectorLabel } from "@/lib/matching/scoreMatch";

export interface ProjectLogicRow {
  label_sv: string;
  label_en: string;
  content_sv: string;
  content_en: string;
}

export interface ReviewerNote {
  type: "warning" | "positive";
  text_sv: string;
  text_en: string;
}

const IMPACT_HINT = /effekt|impact|resultat|nytta|spridning|result|benefit|dissemin/i;
const IMPLEMENTATION_HINT = /genomför|implement|resurs|kapacitet|organisat|risk|budget|tidplan|resource|capacit|timeline/i;
const PARTNERSHIP_HINT = /partner|konsortium|samarbet|consorti|collaborat/i;

// Generates content for one of a CALL'S OWN application-form sections
// (call.applicationTemplate), rather than the generic six-field fallback
// below. Still a deterministic heuristic, not a live AI call — same
// principle as the rest of this app — but it reads the section's own
// instructions to decide what to weave in (an impact-flavoured section talks
// about expected effect; an implementation-flavoured one talks about
// budget/timeline/partnership), so two sections with different instructions
// genuinely produce different draft text instead of one template repeated
// under different headings.
function generateTemplatedSection(
  section: ApplicationTemplateSection,
  project: ProjectInput,
  call: FundingCall,
  program: FundingProgram
): ProjectLogicRow {
  const sectorSv = sectorLabel(project.sector, "sv");
  const sectorEn = sectorLabel(project.sector, "en");
  const instructions = `${section.instructions_sv} ${section.instructions_en}`;

  const base_sv = project.description ? project.description : `"${project.title}"`;
  const base_en = project.description ? project.description : `"${project.title}"`;

  let tail_sv: string;
  let tail_en: string;
  if (IMPACT_HINT.test(instructions)) {
    tail_sv = `Projektet förväntas ge en mätbar effekt inom ${sectorSv}, i linje med ${call.title_sv}s prioriteringar.`;
    tail_en = `The project is expected to deliver a measurable effect in ${sectorEn}, aligned with ${call.title_en}'s priorities.`;
  } else if (IMPLEMENTATION_HINT.test(instructions)) {
    tail_sv = `Genomförs ${project.startYear}–${project.endYear} med en total budget om ${(project.budgetSEK / 1_000_000).toLocaleString("sv-SE", { maximumFractionDigits: 1 })} mnkr.`;
    tail_en = `Delivered ${project.startYear}–${project.endYear} with a total budget of SEK ${(project.budgetSEK / 1_000_000).toLocaleString("en-US", { maximumFractionDigits: 1 })}M.`;
  } else if (PARTNERSHIP_HINT.test(instructions)) {
    tail_sv = project.hasInternationalPartner
      ? "Genomförs tillsammans med en internationell partnerorganisation."
      : "En internationell partnerorganisation behöver ännu säkras för denna del.";
    tail_en = project.hasInternationalPartner
      ? "Delivered together with an international partner organisation."
      : "An international partner organisation still needs to be secured for this part.";
  } else {
    tail_sv = `Kopplat till sektorn ${sectorSv} och ${program.name_sv}s syfte.`;
    tail_en = `Linked to the ${sectorEn} sector and ${program.shortName}'s purpose.`;
  }

  return {
    label_sv: section.label_sv,
    label_en: section.label_en,
    content_sv: `${base_sv} ${tail_sv}`,
    content_en: `${base_en} ${tail_en}`,
  };
}

export function generateProjectLogic(
  project: ProjectInput,
  call: FundingCall,
  program: FundingProgram
): ProjectLogicRow[] {
  if (call.applicationTemplate && call.applicationTemplate.length > 0) {
    return call.applicationTemplate.map((section) => generateTemplatedSection(section, project, call, program));
  }

  const sectorSv = sectorLabel(project.sector, "sv");
  const sectorEn = sectorLabel(project.sector, "en");
  return [
    {
      label_sv: "Problem",
      label_en: "Problem",
      content_sv: `${project.municipality || "Kommunen"} har idag ett omotiverat stort behov inom ${sectorSv} som inte kan lösas fullt ut inom ordinarie budget.`,
      content_en: `${project.municipality || "The municipality"} currently has a significant unmet need in ${sectorEn} that cannot be fully addressed within the regular budget.`,
    },
    {
      label_sv: "Mål",
      label_en: "Goal",
      content_sv: `Genomföra "${project.title}" och därigenom uppnå mätbar förbättring inom ${sectorSv} under perioden ${project.startYear}–${project.endYear}.`,
      content_en: `Deliver "${project.title}" and achieve measurable improvement in ${sectorEn} during ${project.startYear}–${project.endYear}.`,
    },
    {
      label_sv: "Aktiviteter",
      label_en: "Activities",
      content_sv: project.description || "Aktiviteter enligt projektbeskrivningen.",
      content_en: project.description || "Activities as described in the project description.",
    },
    {
      label_sv: "Outputs",
      label_en: "Outputs",
      content_sv: `Genomförda leveranser kopplade till ${call.title_sv} och utlysningens stödberättigade aktiviteter.`,
      content_en: `Delivered outputs aligned with ${call.title_en}'s eligible activities.`,
    },
    {
      label_sv: "Effekter (outcomes)",
      label_en: "Outcomes",
      content_sv: `Långsiktig förbättring av kommunens förmåga inom ${sectorSv}, i linje med ${program.name_sv}s prioriteringar.`,
      content_en: `Long-term improvement of the municipality's capability in ${sectorEn}, aligned with ${program.shortName}'s priorities.`,
    },
    {
      label_sv: "Indikatorer",
      label_en: "Indicators",
      content_sv: "Budgetutfall, tidplan, antal genomförda aktiviteter, samt en programspecifik effektindikator (definieras i ansökan).",
      content_en: "Budget outturn, schedule adherence, number of completed activities, and one programme-specific impact indicator (to be defined in the application).",
    },
  ];
}

export function generateReviewerNotes(project: ProjectInput, call: FundingCall): ReviewerNote[] {
  const notes: ReviewerNote[] = [];

  if (call.requiresPartnership && !project.hasInternationalPartner) {
    notes.push({
      type: "warning",
      text_sv: `Utlysningen kräver gränsöverskridande samarbete. Projektet saknar för närvarande en internationell partner — lägg till detta innan ansökan lämnas in.`,
      text_en: `This call requires cross-border cooperation. The project currently lacks an international partner — add one before submitting.`,
    });
  } else if (call.requiresPartnership) {
    notes.push({
      type: "positive",
      text_sv: "Partnerskapskravet är uppfyllt.",
      text_en: "The partnership requirement is satisfied.",
    });
  }

  if (project.description.length < 120) {
    notes.push({
      type: "warning",
      text_sv: "Projektbeskrivningen är kort. Beskriv aktiviteten mer konkret och koppla den tydligt till förväntad effekt.",
      text_en: "The project description is brief. Describe the activity more concretely and link it clearly to the expected effect.",
    });
  }

  notes.push({
    type: "warning",
    text_sv: "Indikator för förväntad effekt saknar mätbart utgångsvärde (baseline). Lägg till innan inlämning.",
    text_en: "The expected-impact indicator lacks a measurable baseline. Add one before submission.",
  });

  if (project.sector === "climate" || project.sector === "energy") {
    notes.push({
      type: "positive",
      text_sv: "Projektets klimat-/energimål har en stark koppling till utlysningens miljöprioriteringar.",
      text_en: "The project's climate/energy goals have a strong link to the call's environmental priorities.",
    });
  }

  return notes;
}

import type { RequirementOwner, RequirementStatus, RequirementKind } from "../types";
import type { RequirementGroup, RequirementOrigin } from "../data/applicationRequirements";

// Texts for what a complete application needs (lib/data/applicationRequirements.ts):
// the Ansökningsstudio's Krav tab, its line in the sidebar, the export and
// status warnings, the completeness part of the assessment and Datacenter
// › Krav. Reached as t.req.

export interface RequirementTexts {
  tab: string;
  title: string;
  intro: string;
  callTextWins: string;
  summaryDeadline: string;
  summarySubmittedIn: string;
  summaryForm: string;
  summaryPageLimit: string;
  summaryPageLimitValue: (pages: number) => string;
  summaryGrantRate: string;
  summaryOwnShare: (own: number) => string;
  summaryPartnership: string;
  summaryPartnershipValue: (countries: number) => string;
  summaryNoForm: string;
  daysLeft: (days: number) => string;
  closed: string;
  progress: (done: number, total: number) => string;
  allDone: string;
  completenessLabel: string;
  groups: Record<RequirementGroup, string>;
  kinds: Record<RequirementKind, string>;
  statuses: Record<RequirementStatus, string>;
  statusLabel: (title: string) => string;
  owners: Record<RequirementOwner, string>;
  ownerLabel: (owner: string) => string;
  origins: Record<RequirementOrigin, string>;
  autoBadge: string;
  autoReset: string;
  recommended: string;
  condition: (c: string) => string;
  leadTime: (days: number) => string;
  leadTimeUrgent: (days: number) => string;
  dueAfterClose: (hours: number) => string;
  dueBeforeAgreement: string;
  source: (document: string, date: string) => string;
  sourceLink: string;
  noteLabel: string;
  notApplicablePlaceholder: string;
  openSection: string;
  openBudget: string;
  upload: string;
  uploadNotSaved: string;
  uploadTooLarge: string;
  removeFile: string;
  callPage: string;
  addOwnTitle: string;
  addOwnHint: string;
  addOwnTitleLabel: string;
  addOwnKindLabel: string;
  addOwnMandatory: string;
  addOwnButton: string;
  removeOwn: string;
  removeOwnConfirm: string;
  startWriting: string;
  showFirstLabel: string;
  sidebarLabel: string;
  sidebarOpen: string;
  sidebarUrgent: (n: number) => string;
  exportOpen: (n: number, titles: string) => string;
  submitWarning: (n: number) => string;
  completenessTitle: string;
  completenessHint: string;
  completenessGroup: (done: number, total: number) => string;
  goToRequirements: string;
  nextUpOpen: (n: number) => string;
  datacenter: {
    tab: string;
    title: string;
    intro: string;
    coverage: (n: number, total: number) => string;
    columnCall: string;
    columnForm: string;
    columnCount: string;
    columnOwn: string;
    pick: string;
    noForm: string;
    listTitle: (call: string) => string;
    exclude: string;
    restore: string;
    excluded: string;
    removeAdded: string;
    pasteTitle: string;
    pasteHint: string;
    pastePlaceholder: string;
    suggest: string;
    noSuggestions: string;
    suggestionsTitle: (n: number) => string;
    include: string;
    sourceDocument: string;
    sourceDocumentDefault: string;
    sourceUrl: string;
    save: (n: number) => string;
    saved: (n: number) => string;
    addTitle: string;
    whyLabel: string;
    conditionLabel: string;
  };
}

export const requirementSv: RequirementTexts = {
  tab: "Krav",
  title: "Det här krävs för en komplett ansökan",
  intro:
    "Utlysningens krav på formulär, budget, bilagor, intyg och formella villkor. Där systemet kan se hur långt ansökan har kommit sätts statusen automatiskt; resten markerar du själv.",
  callTextWins: "Utlysningens egen text gäller alltid. Kontrollera kraven mot den innan ansökan skickas in.",
  summaryDeadline: "Sista dag",
  summarySubmittedIn: "Lämnas i",
  summaryForm: "Formulär",
  summaryPageLimit: "Sidgräns",
  summaryPageLimitValue: (pages) => `${pages} sidor`,
  summaryGrantRate: "Stödnivå",
  summaryOwnShare: (own) => `egen medfinansiering ${own} %`,
  summaryPartnership: "Partnerskap",
  summaryPartnershipValue: (countries) => `minst ${countries} länder`,
  summaryNoForm: "Finansiärens eget formulär (inte inlagt)",
  daysLeft: (days) => (days === 0 ? "stänger i dag" : days === 1 ? "1 dag kvar" : `${days} dagar kvar`),
  closed: "har stängt",
  progress: (done, total) => `Komplett: ${done} av ${total} krav`,
  allDone: "Alla krav som ska lämnas med ansökan är klara",
  completenessLabel: "Färdigställande",
  groups: {
    form: "Ansökningsformulär",
    budget: "Budget och ekonomi",
    annexes: "Bilagor, intyg och deklarationer",
    eligibility: "Behörighet och formella krav",
    submission: "Inlämning",
  },
  kinds: {
    form: "Formulär",
    budget: "Budget",
    annex: "Bilaga",
    certificate: "Intyg",
    declaration: "Deklaration",
    eligibility: "Behörighet",
    submission: "Inlämning",
  },
  statuses: { todo: "Ej påbörjad", "in-progress": "Pågår", done: "Klar", "not-applicable": "Ej tillämplig" },
  statusLabel: (title) => `Status: ${title}`,
  owners: {
    applicant: "Projektledaren",
    signatory: "Firmatecknare",
    finance: "Ekonomi",
    procurement: "Inköp",
    partners: "Partner",
    hr: "HR",
  },
  ownerLabel: (owner) => `Ansvarig: ${owner}`,
  origins: {
    form: "Finansiärens formulär",
    programme: "Programmet",
    call: "Utlysningen",
    derived: "Härlett ur utlysningen",
    datacenter: "Datacenter",
    own: "Eget krav",
  },
  autoBadge: "Följer ansökan",
  autoReset: "Låt systemet avgöra",
  recommended: "Rekommenderas",
  condition: (c) => `Gäller ${c}`,
  leadTime: (days) => `Tar ofta ${days} dagar`,
  leadTimeUrgent: (days) => `Tar ofta ${days} dagar – börja nu`,
  dueAfterClose: (hours) => `Lämnas senast ${hours} timmar efter att utlysningen stängt`,
  dueBeforeAgreement: "Krävs inför avtalet och räknas inte in i ansökans färdigställande",
  source: (document, date) => `Källa: ${document}${date ? `, kontrollerad ${date}` : ""}`,
  sourceLink: "Öppna källan",
  noteLabel: "Anteckning",
  notApplicablePlaceholder: "Varför gäller kravet inte er?",
  openSection: "Öppna i ansökan",
  openBudget: "Gå till budgeten",
  upload: "Ladda upp fil",
  uploadNotSaved: "Spara projektet för att kunna ladda upp filer.",
  uploadTooLarge: "Filen är för stor för att sparas i webbläsaren.",
  removeFile: "Ta bort",
  callPage: "Utlysningens sida",
  addOwnTitle: "Lägg till eget krav",
  addOwnHint: "Sådant er organisation kräver, eller som utlysningen kräver men som saknas i listan.",
  addOwnTitleLabel: "Krav",
  addOwnKindLabel: "Typ",
  addOwnMandatory: "Obligatoriskt",
  addOwnButton: "Lägg till",
  removeOwn: "Ta bort",
  removeOwnConfirm: "Ta bort kravet från ansökan?",
  startWriting: "Börja skriva ansökan →",
  showFirstLabel: "Visa kraven först när en ansökan öppnas första gången",
  sidebarLabel: "Krav för komplett ansökan",
  sidebarOpen: "Visa kraven",
  sidebarUrgent: (n) => (n === 1 ? "1 krav tar längre tid än det som är kvar" : `${n} krav tar längre tid än det som är kvar`),
  exportOpen: (n, titles) =>
    `${n === 1 ? "Ett obligatoriskt krav är" : `${n} obligatoriska krav är`} inte klart än: ${titles}. Exporten är gjord ändå.`,
  submitWarning: (n) =>
    `${n === 1 ? "Ett obligatoriskt krav är" : `${n} obligatoriska krav är`} inte markerat som klart. Kontrollera fliken Krav innan ansökan skickas in.`,
  completenessTitle: "Färdigställandegrad",
  completenessHint:
    "Väger 30 % i bedömningen: formulärets avsnitt, budget, bilagor, intyg och formella krav som ska lämnas med ansökan. Krav som inte gäller er eller rekommenderas räknas inte.",
  completenessGroup: (done, total) => `${done} av ${total} klara`,
  goToRequirements: "Visa kraven",
  nextUpOpen: (n) => (n === 1 ? "1 bilaga, intyg eller villkor kvar" : `${n} bilagor, intyg och villkor kvar`),
  datacenter: {
    tab: "Krav",
    title: "Krav för komplett ansökan",
    intro:
      "Det varje utlysning kräver för en komplett ansökan: formulärets och programmets krav, utlysningens egna och de du lägger till här. Ändringar här gäller alla ansökningar till utlysningen i den här webbläsaren.",
    coverage: (n, total) => `${n} av ${total} utlysningar har utlysningens egna krav inlagda`,
    columnCall: "Utlysning",
    columnForm: "Formulär",
    columnCount: "Krav",
    columnOwn: "Utlysningens egna",
    pick: "Visa",
    noForm: "Inget",
    listTitle: (call) => `Krav för ${call}`,
    exclude: "Gäller inte",
    restore: "Återställ",
    excluded: "Gäller inte utlysningen",
    removeAdded: "Ta bort",
    pasteTitle: "Föreslå krav ur utlysningstext",
    pasteHint:
      "Klistra in utlysningens avsnitt om bilagor och dokument. Systemet föreslår krav ur texten; granska dem innan de sparas. Förslagen bygger på regler, inte på AI.",
    pastePlaceholder: "Till exempel: Bilagor som ska bifogas ansökan …",
    suggest: "Föreslå krav",
    noSuggestions: "Hittade inga krav i texten. Lägg till dem för hand nedan.",
    suggestionsTitle: (n) => `${n} förslag – granska innan du sparar`,
    include: "Ta med",
    sourceDocument: "Källa",
    sourceDocumentDefault: "Utlysningstexten",
    sourceUrl: "Länk till källan",
    save: (n) => `Spara ${n} krav`,
    saved: (n) => (n === 1 ? "1 krav sparat" : `${n} krav sparade`),
    addTitle: "Lägg till krav för utlysningen",
    whyLabel: "Beskrivning",
    conditionLabel: "Villkor (om det bara gäller vissa)",
  },
};

export const requirementEn: RequirementTexts = {
  tab: "Requirements",
  title: "What a complete application needs",
  intro:
    "The call's requirements for the form, budget, annexes, certificates and formal conditions. Where the system can see how far the application has come the status is set automatically; the rest you mark yourself.",
  callTextWins: "The call's own text always applies. Check the requirements against it before the application is submitted.",
  summaryDeadline: "Deadline",
  summarySubmittedIn: "Submitted in",
  summaryForm: "Form",
  summaryPageLimit: "Page limit",
  summaryPageLimitValue: (pages) => `${pages} pages`,
  summaryGrantRate: "Funding rate",
  summaryOwnShare: (own) => `own co-financing ${own} %`,
  summaryPartnership: "Partnership",
  summaryPartnershipValue: (countries) => `at least ${countries} countries`,
  summaryNoForm: "The funder's own form (not on file)",
  daysLeft: (days) => (days === 0 ? "closes today" : days === 1 ? "1 day left" : `${days} days left`),
  closed: "has closed",
  progress: (done, total) => `Complete: ${done} of ${total} requirements`,
  allDone: "Every requirement due with the application is done",
  completenessLabel: "Completeness",
  groups: {
    form: "Application form",
    budget: "Budget and finances",
    annexes: "Annexes, certificates and declarations",
    eligibility: "Eligibility and formal requirements",
    submission: "Submission",
  },
  kinds: {
    form: "Form",
    budget: "Budget",
    annex: "Annex",
    certificate: "Certificate",
    declaration: "Declaration",
    eligibility: "Eligibility",
    submission: "Submission",
  },
  statuses: { todo: "Not started", "in-progress": "In progress", done: "Done", "not-applicable": "Not applicable" },
  statusLabel: (title) => `Status: ${title}`,
  owners: {
    applicant: "Project lead",
    signatory: "Authorised signatory",
    finance: "Finance",
    procurement: "Procurement",
    partners: "Partners",
    hr: "HR",
  },
  ownerLabel: (owner) => `Owner: ${owner}`,
  origins: {
    form: "Funder's form",
    programme: "Programme",
    call: "The call",
    derived: "Derived from the call",
    datacenter: "Data centre",
    own: "Own requirement",
  },
  autoBadge: "Follows the application",
  autoReset: "Let the system decide",
  recommended: "Recommended",
  condition: (c) => `Applies to ${c}`,
  leadTime: (days) => `Often takes ${days} days`,
  leadTimeUrgent: (days) => `Often takes ${days} days – start now`,
  dueAfterClose: (hours) => `Due at the latest ${hours} hours after the call closes`,
  dueBeforeAgreement: "Needed before the grant agreement; not counted in the application's completeness",
  source: (document, date) => `Source: ${document}${date ? `, checked ${date}` : ""}`,
  sourceLink: "Open the source",
  noteLabel: "Note",
  notApplicablePlaceholder: "Why doesn't it apply to you?",
  openSection: "Open in the application",
  openBudget: "Go to the budget",
  upload: "Upload file",
  uploadNotSaved: "Save the project to upload files.",
  uploadTooLarge: "The file is too large to keep in the browser.",
  removeFile: "Remove",
  callPage: "The call's page",
  addOwnTitle: "Add a requirement of your own",
  addOwnHint: "Something your organisation requires, or that the call requires but is missing from the list.",
  addOwnTitleLabel: "Requirement",
  addOwnKindLabel: "Type",
  addOwnMandatory: "Mandatory",
  addOwnButton: "Add",
  removeOwn: "Remove",
  removeOwnConfirm: "Remove the requirement from the application?",
  startWriting: "Start writing the application →",
  showFirstLabel: "Show the requirements first when an application is opened for the first time",
  sidebarLabel: "Requirements for a complete application",
  sidebarOpen: "Show the requirements",
  sidebarUrgent: (n) => (n === 1 ? "1 requirement takes longer than the time left" : `${n} requirements take longer than the time left`),
  exportOpen: (n, titles) =>
    `${n === 1 ? "One mandatory requirement isn't" : `${n} mandatory requirements aren't`} done yet: ${titles}. The export was made anyway.`,
  submitWarning: (n) =>
    `${n === 1 ? "One mandatory requirement isn't" : `${n} mandatory requirements aren't`} marked as done. Check the Requirements tab before the application is submitted.`,
  completenessTitle: "Completeness",
  completenessHint:
    "Weighs 30 % in the assessment: the form's sections, budget, annexes, certificates and formal requirements due with the application. Requirements that don't apply to you or are only recommended don't count.",
  completenessGroup: (done, total) => `${done} of ${total} done`,
  goToRequirements: "Show the requirements",
  nextUpOpen: (n) => (n === 1 ? "1 annex, certificate or condition left" : `${n} annexes, certificates and conditions left`),
  datacenter: {
    tab: "Requirements",
    title: "Requirements for a complete application",
    intro:
      "What each call needs for a complete application: the form's and programme's requirements, the call's own and the ones you add here. Changes here apply to every application to the call in this browser.",
    coverage: (n, total) => `${n} of ${total} calls have the call's own requirements on file`,
    columnCall: "Call",
    columnForm: "Form",
    columnCount: "Requirements",
    columnOwn: "The call's own",
    pick: "Show",
    noForm: "None",
    listTitle: (call) => `Requirements for ${call}`,
    exclude: "Doesn't apply",
    restore: "Restore",
    excluded: "Doesn't apply to the call",
    removeAdded: "Remove",
    pasteTitle: "Suggest requirements from call text",
    pasteHint:
      "Paste the call's section on annexes and documents. The system suggests requirements from the text; review them before saving. The suggestions are rule-based, not AI.",
    pastePlaceholder: "For example: Mandatory annexes and supporting documents …",
    suggest: "Suggest requirements",
    noSuggestions: "Found no requirements in the text. Add them by hand below.",
    suggestionsTitle: (n) => `${n} suggestions – review before saving`,
    include: "Include",
    sourceDocument: "Source",
    sourceDocumentDefault: "The call text",
    sourceUrl: "Link to the source",
    save: (n) => `Save ${n} requirements`,
    saved: (n) => (n === 1 ? "1 requirement saved" : `${n} requirements saved`),
    addTitle: "Add a requirement for the call",
    whyLabel: "Description",
    conditionLabel: "Condition (if it only applies to some)",
  },
};

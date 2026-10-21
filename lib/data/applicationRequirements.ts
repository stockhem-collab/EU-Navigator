import type {
  ApplicationRequirement,
  CallTemplate,
  FundingCall,
  FundingProgram,
  RequirementChanges,
  RequirementKind,
  RequirementState,
  RequirementStatus,
} from "../types";

// What a call asks for before an application counts as complete: the form,
// the budget, annexes, certificates, declarations, eligibility conditions
// and the submission itself. The Ansökningsstudio's Krav tab lists them
// with a status per application, and the application's assessment counts
// how far they have come (completenessDimension in lib/matching/readiness).
//
// Four sources, in this order:
//   1. the funder's form (CallTemplate.requirements) — most requirements
//      follow the programme and type of action, not the single call;
//   2. the programme, for calls without a form on file (the Funding &
//      Tenders Portal's common steps, or a generic list);
//   3. the call's own changes from data/utlysningskrav.csv
//      (FundingCall.requirementChanges) and from Datacenter › Krav;
//   4. requirements derived from what the app already knows about the call
//      (partnership, co-financing).
// Every requirement states where it comes from and when it was checked —
// the call's own text always wins.

const CHECKED = "2026-10-21";

const HE_GENERAL_ANNEXES = {
  document: "Horisont Europa, arbetsprogram 2026–2027, General Annexes",
  url: "https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/horizon/wp-call/2026-2027/wp-15-general-annexes_horizon-2026-2027_en.pdf",
};
const HE_FORM = {
  document: "Standard application form HE RIA/IA, V5.1",
  url: "https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/horizon/temp-form/af/af_he-ria-ia_en.pdf",
};
const ESF_CALL = {
  document: "Svenska ESF-rådets utlysning 26-024 (samma bilagekrav i rådets utlysningar 2021–2027)",
  url: "https://www.esf.se/utlysningar/",
};

/** The Funding & Tenders Portal's own steps — common to the programmes the
 * Commission and its agencies run there. */
export const PORTAL_PROGRAMMES = ["horizon", "life", "cerv", "digital-europe", "cef", "kreativa-europa"];

export const PORTAL_REQUIREMENTS: ApplicationRequirement[] = [
  {
    id: "portal-part-a",
    kind: "form",
    title_sv: "Del A i portalen",
    title_en: "Part A in the portal",
    why_sv:
      "Fylls i direkt i Funding & Tenders Portal av koordinatorn: deltagare, sammanfattad budget, utlysningens egna frågor och deklarationerna. Alla deklarationer är obligatoriska.",
    why_en:
      "Filled in directly in the Funding & Tenders Portal by the coordinator: participants, summarised budget, the call's own questions and the declarations. All declarations are mandatory.",
    mandatory: true,
    owner: "applicant",
    source: { ...HE_GENERAL_ANNEXES, section: "E — Documents", checkedAt: CHECKED },
  },
  {
    id: "portal-pic",
    kind: "eligibility",
    title_sv: "PIC för alla deltagare",
    title_en: "A PIC for every participant",
    why_sv:
      "Alla stödmottagare och anknutna enheter ska vara registrerade i deltagarregistret och ha ett PIC-nummer innan ansökan lämnas in. Partner utan PIC behöver registrera sig i tid.",
    why_en:
      "Every beneficiary and affiliated entity must be registered in the Participant Register with a PIC before the application is submitted. Partners without one need to register in time.",
    mandatory: true,
    owner: "partners",
    leadTimeDays: 7,
    source: { ...HE_GENERAL_ANNEXES, section: "B — Eligibility", checkedAt: CHECKED },
  },
  {
    id: "portal-mandate",
    kind: "declaration",
    title_sv: "Mandat från alla sökande",
    title_en: "A mandate from every applicant",
    why_sv:
      "Vid inlämning intygar koordinatorn att alla sökande samtycker till ansökan och dess innehåll och att uppgifterna är korrekta och fullständiga. Ansökningar utan fullt stöd avvisas.",
    why_en:
      "On submission the coordinator confirms that every applicant consents to the application and its content and that the information is correct and complete. Applications without full support are rejected.",
    mandatory: true,
    owner: "signatory",
    source: { ...HE_GENERAL_ANNEXES, section: "E — Documents", checkedAt: CHECKED },
  },
  {
    id: "portal-lear",
    kind: "eligibility",
    title_sv: "Validerad organisation och utsedd LEAR",
    title_en: "Validated organisation and an appointed LEAR",
    why_sv:
      "Inför avtalet validerar EU organisationen, och organisationen utser en LEAR som sköter dess uppgifter i portalen. Krävs inte för att söka, men tar ofta flera veckor.",
    why_en:
      "Before the grant agreement the EU validates the organisation, which appoints a LEAR to manage its data in the portal. Not needed to apply, but often takes weeks.",
    mandatory: true,
    owner: "signatory",
    leadTimeDays: 30,
    due: "before-agreement",
    link: {
      url: "https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/common/guidance/rules-lev-lear-fca_en.pdf",
      label_sv: "Regler för validering och LEAR",
      label_en: "Rules for validation and LEAR",
    },
    source: { ...HE_GENERAL_ANNEXES, section: "B — Eligibility", checkedAt: CHECKED },
  },
  {
    id: "portal-submit",
    kind: "submission",
    title_sv: "Inskickad i portalen före sista dag kl. 17.00 (Bryssel)",
    title_en: "Submitted in the portal by 17:00 Brussels time on the deadline",
    why_sv: "Ansökan lämnas bara elektroniskt i portalens inlämningssystem. Den kan skickas in på nytt fram till sista dag; den senaste versionen gäller.",
    why_en: "Applications are submitted only electronically in the portal's submission system. It can be resubmitted until the deadline; the latest version counts.",
    mandatory: true,
    owner: "applicant",
    check: { type: "submitted" },
    source: { ...HE_GENERAL_ANNEXES, section: "A — Admissibility", checkedAt: CHECKED },
  },
];

/** Horizon Europe RIA/IA — besides the portal's common steps. */
export const HE_RIA_IA_REQUIREMENTS: ApplicationRequirement[] = [
  {
    id: "he-part-b",
    kind: "form",
    title_sv: "Del B – teknisk beskrivning",
    title_en: "Part B – technical description",
    why_sv: "Laddas ner från inlämningssystemet, fylls i enligt mallens rubriker och laddas upp som PDF.",
    why_en: "Downloaded from the submission system, completed following the template's headings and uploaded as a PDF.",
    mandatory: true,
    owner: "applicant",
    check: { type: "form" },
    source: { ...HE_FORM, checkedAt: CHECKED },
  },
  {
    id: "he-page-limit",
    kind: "form",
    title_sv: "Del B inom sidgränsen",
    title_en: "Part B within the page limit",
    why_sv: "40 sidor, 45 för ämnen med klumpsumma. Sidor över gränsen döljs efter sista dag och läses inte av bedömarna.",
    why_en: "40 pages, 45 for lump-sum topics. Pages over the limit are hidden after the deadline and not read by the evaluators.",
    mandatory: true,
    owner: "applicant",
    check: { type: "page-limit" },
    source: { ...HE_GENERAL_ANNEXES, section: "A — Page limits", checkedAt: CHECKED },
  },
  {
    id: "he-dec-plan",
    kind: "form",
    title_sv: "Plan för spridning, nyttiggörande och kommunikation",
    title_en: "Plan for dissemination, exploitation and communication",
    why_sv: "Ett formellt krav för att ansökan ska prövas, om inte ämnet säger annat. Skrivs i avsnitt 2.2.",
    why_en: "A condition for the application to be admissible unless the topic says otherwise. Written in section 2.2.",
    mandatory: true,
    owner: "applicant",
    check: { type: "section", key: "he-2.2" },
    source: { ...HE_GENERAL_ANNEXES, section: "A — Admissibility", checkedAt: CHECKED },
  },
  {
    id: "he-budget",
    kind: "budget",
    title_sv: "Budget per deltagare och kostnadskategori",
    title_en: "Budget per participant and cost category",
    why_sv: "Den sammanfattade budgeten i del A, per kostnadskategori A–E. Indirekta kostnader (E) är 25 % av A, C och D.",
    why_en: "The summarised budget in Part A, per cost category A–E. Indirect costs (E) are 25 % of A, C and D.",
    mandatory: true,
    owner: "finance",
    check: { type: "cost-categories" },
    source: { ...HE_FORM, section: "Part A — Budget", checkedAt: CHECKED },
  },
  {
    id: "he-gep",
    kind: "eligibility",
    title_sv: "Jämställdhetsplan (GEP)",
    title_en: "Gender equality plan (GEP)",
    why_sv:
      "Offentliga organ, forskningsorganisationer och lärosäten måste ha en jämställdhetsplan när avtalet undertecknas: publicerad och antagen av ledningen, med avsatta resurser, könsuppdelad data och utbildning. Frågan besvaras i del A.",
    why_en:
      "Public bodies, research organisations and higher education establishments must have a gender equality plan at grant signature: published and adopted by top management, with dedicated resources, sex-disaggregated data and training. Answered in Part A.",
    mandatory: true,
    condition_sv: "offentliga organ, forskningsorganisationer och lärosäten",
    condition_en: "public bodies, research organisations and higher education establishments",
    owner: "hr",
    leadTimeDays: 60,
    source: { ...HE_GENERAL_ANNEXES, section: "B — Gender equality plans", checkedAt: CHECKED },
  },
  {
    id: "he-ethics",
    kind: "declaration",
    title_sv: "Etiktabell och etisk självskattning",
    title_en: "Ethics issues table and ethics self-assessment",
    why_sv: "Etiktabellen i del A besvaras alltid. Svarar ni ja på någon fråga ska den etiska självskattningen också fyllas i.",
    why_en: "The ethics issues table in Part A is always completed. Any 'yes' also needs the ethics self-assessment.",
    mandatory: true,
    owner: "applicant",
    source: { ...HE_FORM, section: "Part A — 4. Ethics and security", checkedAt: CHECKED },
  },
  {
    id: "he-topic-conditions",
    kind: "eligibility",
    title_sv: "Ämnets egna villkor uppfyllda",
    title_en: "The topic's own conditions met",
    why_sv: "Läs villkoren på ämnessidan (Other eligible conditions, Specific conditions), till exempel krav på deltagande städer eller begränsningar för vissa länder.",
    why_en: "Read the conditions on the topic page (other eligible conditions, specific conditions), e.g. required participating cities or restrictions for some countries.",
    mandatory: true,
    owner: "applicant",
    source: { document: "Ämnessidan i Funding & Tenders Portal", checkedAt: CHECKED },
  },
];

/** ESF+ — the attachments ESF-rådet lists in its calls. */
export const ESF_REQUIREMENTS: ApplicationRequirement[] = [
  {
    id: "esf-form",
    kind: "form",
    title_sv: "Ansökan om stöd i Projektrummet+, alla fält ifyllda",
    title_en: "Application in Projektrummet+, every field completed",
    why_sv: "Ansökan är komplett först när samtliga fält i det digitala formuläret är ifyllda.",
    why_en: "The application is complete only when every field of the online form is filled in.",
    mandatory: true,
    owner: "applicant",
    check: { type: "form" },
    source: { ...ESF_CALL, section: "Praktisk information", checkedAt: CHECKED },
  },
  {
    id: "esf-budget",
    kind: "budget",
    title_sv: "Budget per kostnadsslag och medfinansiering",
    title_en: "Budget per cost type and co-financing",
    why_sv: "Budgeten i ansökan, med den medfinansiering utlysningen anger.",
    why_en: "The application's budget, with the co-financing the call states.",
    mandatory: true,
    owner: "finance",
    check: { type: "cost-categories" },
    source: { ...ESF_CALL, checkedAt: CHECKED },
  },
  {
    id: "esf-authorised-signatory",
    kind: "certificate",
    title_sv: "Verifiering av behörig företrädare",
    title_en: "Proof of the authorised signatory",
    why_sv: "Obligatorisk för alla sökande. Underlaget ska visa att den som skrivit under ansökan är behörig att göra det, till exempel delegationsordning eller protokollsutdrag.",
    why_en: "Mandatory for every applicant. Shows that the person signing the application may do so, e.g. a delegation order or minutes.",
    mandatory: true,
    owner: "signatory",
    leadTimeDays: 14,
    source: { ...ESF_CALL, section: "Bilagor som ska bifogas ansökan om stöd", checkedAt: CHECKED },
  },
  {
    id: "esf-procurement-policy",
    kind: "annex",
    title_sv: "Inköpspolicy",
    title_en: "Procurement policy",
    why_sv: "Obligatorisk för offentliga aktörer. Samma dokument används i revisionsberedskapen om ansökan beviljas.",
    why_en: "Mandatory for public actors. The same document is used for audit readiness if the grant is awarded.",
    mandatory: true,
    condition_sv: "offentliga aktörer",
    condition_en: "public actors",
    owner: "procurement",
    leadTimeDays: 3,
    source: { ...ESF_CALL, section: "Bilagor som ska bifogas ansökan om stöd", checkedAt: CHECKED },
  },
  {
    id: "esf-de-minimis-form",
    kind: "annex",
    title_sv: "De minimis-blankett för deltagande företag",
    title_en: "De minimis form for participating companies",
    why_sv: "För de företag som är inlagda som deltagande företag i Projektrummet+ när stödet lämnas som de minimis.",
    why_en: "For the companies entered as participating companies in Projektrummet+ when aid is given as de minimis.",
    mandatory: true,
    condition_sv: "om stöd lämnas som de minimis",
    condition_en: "if aid is given as de minimis",
    owner: "partners",
    leadTimeDays: 14,
    source: { ...ESF_CALL, section: "Bilagor som ska bifogas ansökan om stöd", checkedAt: CHECKED },
  },
  {
    id: "esf-de-minimis-model",
    kind: "annex",
    title_sv: "Beräkningsmodell för de minimis",
    title_en: "De minimis calculation model",
    why_sv: "Visar hur stödet fördelas på stödmottagare och deltagande företag.",
    why_en: "Shows how the aid is shared between beneficiaries and participating companies.",
    mandatory: true,
    condition_sv: "om stöd lämnas som de minimis",
    condition_en: "if aid is given as de minimis",
    owner: "finance",
    source: { ...ESF_CALL, section: "Statsstöd", checkedAt: CHECKED },
  },
  {
    id: "esf-submit",
    kind: "submission",
    title_sv: "Inskickad i Projektrummet+ senast kl. 16.00 sista dagen",
    title_en: "Submitted in Projektrummet+ by 16:00 on the closing day",
    why_sv: "En ansökan som kommer in senare kan inte beviljas.",
    why_en: "An application that arrives later cannot be granted.",
    mandatory: true,
    owner: "applicant",
    check: { type: "submitted" },
    source: { ...ESF_CALL, section: "Praktisk information", checkedAt: CHECKED },
  },
  {
    id: "esf-confirmation",
    kind: "declaration",
    title_sv: "Bekräftelse av ansökan",
    title_en: "Confirmation of the application",
    why_sv: "Behörig företrädare bekräftar ansökan, digitalt eller med bekräftelsebrev, senast 24 timmar efter att utlysningen stängt.",
    why_en: "The authorised signatory confirms the application, digitally or by letter, at the latest 24 hours after the call closes.",
    mandatory: true,
    owner: "signatory",
    due: "after-close",
    dueOffsetHours: 24,
    source: { ...ESF_CALL, section: "Bilagor som ska bifogas ansökan om stöd", checkedAt: CHECKED },
  },
];

/** For calls without a form on file — the steps nearly every funder has. */
export const GENERIC_REQUIREMENTS: ApplicationRequirement[] = [
  {
    id: "generic-form",
    kind: "form",
    title_sv: "Finansiärens ansökningsformulär",
    title_en: "The funder's application form",
    why_sv: "Ansökan lämnas i finansiärens eget formulär. Studion ger ett utkast att utgå från; formulärets exakta uppställning står i utlysningen.",
    why_en: "The application goes in the funder's own form. The studio gives a draft to start from; the form's exact layout is in the call.",
    mandatory: true,
    owner: "applicant",
    check: { type: "form" },
    source: { document: "Utlysningen", checkedAt: CHECKED },
  },
  {
    id: "generic-budget",
    kind: "budget",
    title_sv: "Budget och sökt belopp",
    title_en: "Budget and requested amount",
    why_sv: "Stödberättigande kostnader och det belopp som söks, inom utlysningens ramar.",
    why_en: "Eligible costs and the amount requested, within the call's limits.",
    mandatory: true,
    owner: "finance",
    check: { type: "budget" },
    source: { document: "Utlysningen", checkedAt: CHECKED },
  },
  {
    id: "generic-signatory",
    kind: "certificate",
    title_sv: "Underskrift av behörig företrädare",
    title_en: "Signature by an authorised signatory",
    why_sv: "Nästan alla finansiärer kräver att ansökan undertecknas eller bekräftas av någon som får företräda organisationen.",
    why_en: "Nearly every funder requires the application to be signed or confirmed by someone who may represent the organisation.",
    mandatory: true,
    owner: "signatory",
    leadTimeDays: 14,
    source: { document: "Utlysningen", checkedAt: CHECKED },
  },
  {
    id: "generic-call-annexes",
    kind: "annex",
    title_sv: "Utlysningens bilagekrav genomgångna",
    title_en: "The call's annex requirements reviewed",
    why_sv:
      "Bilagekraven för den här utlysningen är inte inlagda i systemet. Läs utlysningstexten och lägg till de bilagor och intyg den kräver som egna krav, eller i Datacenter › Krav för alla ansökningar till utlysningen.",
    why_en:
      "This call's annex requirements aren't in the system. Read the call text and add the annexes and certificates it asks for as your own requirements, or in Datacenter › Requirements for every application to the call.",
    mandatory: true,
    owner: "applicant",
    source: { document: "Utlysningen", checkedAt: CHECKED },
  },
  {
    id: "generic-submit",
    kind: "submission",
    title_sv: "Inskickad före sista dag",
    title_en: "Submitted before the deadline",
    why_sv: "Kontrollera klockslaget i utlysningen — många stänger mitt på dagen.",
    why_en: "Check the time in the call — many close in the middle of the day.",
    mandatory: true,
    owner: "applicant",
    check: { type: "submitted" },
    source: { document: "Utlysningen", checkedAt: CHECKED },
  },
];

/** The ids PORTAL_REQUIREMENTS and the generic list share a role with —
 * the portal list replaces these for portal programmes. */
const REPLACED_BY_PORTAL = ["generic-signatory", "generic-submit"];

/** Requirements the app derives from what it knows about the call. */
export function derivedRequirements(call: FundingCall, program: FundingProgram | undefined): ApplicationRequirement[] {
  const out: ApplicationRequirement[] = [];
  if (call.requiresPartnership) {
    const countries = call.minPartnerCountries ?? 2;
    out.push({
      id: "derived-partnership",
      kind: "eligibility",
      title_sv: `Partnerskap med organisationer från minst ${countries} länder`,
      title_en: `A partnership with organisations from at least ${countries} countries`,
      why_sv: `Utlysningen kräver partnerskap. Vem får söka: ${call.eligibleApplicants_sv}`,
      why_en: `The call requires a partnership. Who may apply: ${call.eligibleApplicants_en}`,
      mandatory: true,
      owner: "partners",
      leadTimeDays: 60,
      source: { document: "Utlysningen (Vem får söka)", url: call.link, checkedAt: CHECKED },
    });
  }
  const rate = call.coFinancingRate ?? program?.typicalCoFinancingRate;
  if (rate !== undefined && rate < 1) {
    const own = Math.round((1 - rate) * 100);
    out.push({
      id: "derived-cofinancing",
      kind: "budget",
      title_sv: `Beslut om egen medfinansiering (${own} %)`,
      title_en: `Decision on own co-financing (${own} %)`,
      why_sv: `Stödet täcker ${Math.round(rate * 100)} % av de stödberättigande kostnaderna. Resten betalas av er eller andra medfinansiärer, och det behöver vara beslutat i organisationen.`,
      why_en: `The grant covers ${Math.round(rate * 100)} % of eligible costs. The rest is paid by you or other co-funders and needs a decision in the organisation.`,
      mandatory: false,
      owner: "finance",
      leadTimeDays: 30,
      source: { document: call.coFinancingRate !== undefined ? "Utlysningen (Stödnivå)" : "Programmets typiska stödnivå", url: call.link, checkedAt: CHECKED },
    });
  }
  return out;
}

/** Where a requirement in an application's list came from. */
export type RequirementOrigin = "form" | "programme" | "call" | "derived" | "datacenter" | "own";

export interface ResolvedRequirement {
  requirement: ApplicationRequirement;
  origin: RequirementOrigin;
}

export interface RequirementSources {
  call: FundingCall;
  program: FundingProgram | undefined;
  /** The funder's form the call's applications follow, if any. */
  template?: CallTemplate;
  /** Changes made in Datacenter › Krav for this call. */
  datacenter?: RequirementChanges;
  /** Requirements the user added to this application. */
  own?: ApplicationRequirement[];
}

/** Every requirement for one call (and application), each once, by group. */
export function resolveRequirements({ call, program, template, datacenter, own = [] }: RequirementSources): ResolvedRequirement[] {
  const portal = PORTAL_PROGRAMMES.includes(call.programId);
  const fromForm = template?.requirements ?? [];
  const callAdds = [...(call.requirementChanges?.add ?? []), ...(datacenter?.add ?? [])];
  const removed = new Set([...(call.requirementChanges?.remove ?? []), ...(datacenter?.remove ?? [])]);

  let programme: ApplicationRequirement[] = [];
  if (portal) programme = PORTAL_REQUIREMENTS;
  if (fromForm.length === 0) {
    programme = [
      ...programme,
      ...GENERIC_REQUIREMENTS.filter((r) => !(portal && REPLACED_BY_PORTAL.includes(r.id))),
    ];
    // Without a form, the call's annexes are only known when someone has
    // added them.
    if (callAdds.some((r) => ["annex", "certificate", "declaration"].includes(r.kind))) {
      programme = programme.filter((r) => r.id !== "generic-call-annexes");
    }
  }

  const all: ResolvedRequirement[] = [
    ...fromForm.map((requirement) => ({ requirement, origin: "form" as const })),
    ...programme.map((requirement) => ({ requirement, origin: "programme" as const })),
    ...(call.requirementChanges?.add ?? []).map((requirement) => ({ requirement, origin: "call" as const })),
    ...(datacenter?.add ?? []).map((requirement) => ({ requirement, origin: "datacenter" as const })),
    ...derivedRequirements(call, program).map((requirement) => ({ requirement, origin: "derived" as const })),
    ...own.map((requirement) => ({ requirement, origin: "own" as const })),
  ];
  const seen = new Set<string>();
  const kept = all.filter(({ requirement }) => {
    if (removed.has(requirement.id) || seen.has(requirement.id)) return false;
    seen.add(requirement.id);
    return true;
  });
  return kept
    .map((r, i) => ({ r, i }))
    .sort((a, b) => GROUP_ORDER.indexOf(groupOf(a.r.requirement.kind)) - GROUP_ORDER.indexOf(groupOf(b.r.requirement.kind)) || a.i - b.i)
    .map(({ r }) => r);
}

/** The Krav tab's groups. */
export type RequirementGroup = "form" | "budget" | "annexes" | "eligibility" | "submission";
export const GROUP_ORDER: RequirementGroup[] = ["form", "budget", "annexes", "eligibility", "submission"];

export function groupOf(kind: RequirementKind): RequirementGroup {
  if (kind === "annex" || kind === "certificate" || kind === "declaration") return "annexes";
  return kind;
}

/** The call's page limit — its own when it states one, else the form's. */
export function pageLimitFor(template: CallTemplate | undefined, call: FundingCall): number | undefined {
  return call.requirementChanges?.pageLimit ?? template?.pageLimit;
}

/** What the app knows about an application, for the requirements it can
 * check itself. */
export interface RequirementFacts {
  /** The application's sections: whether each is required, written by the
   * user (not the untouched suggestion) and over its character limit. */
  sections: { key: string; required: boolean; written: boolean; overLimit: boolean }[];
  estimatedPages?: number;
  pageLimit?: number;
  /** Cost categories with an amount, and how many can take one. */
  costCategoriesFilled: number;
  costCategoriesTotal: number;
  /** Whether the application states its budget (or the project has one). */
  budgetStated: boolean;
  /** The application has been submitted (or has come further). */
  submitted: boolean;
  /** Partner countries the application names, when known. */
  partnerCountries?: number;
  /** The applicant is a public body — exemptions apply. */
  publicBody: boolean;
  /** Files uploaded per requirement id. */
  attachments: Record<string, number>;
  /** The call's deadline (YYYY-MM-DD) and today, for lead-time warnings. */
  deadlineDate?: string;
  today?: Date;
}

export interface EvaluatedRequirement extends ResolvedRequirement {
  group: RequirementGroup;
  status: RequirementStatus;
  /** True when the app set the status from the application itself. */
  auto: boolean;
  /** Progress from 0 to 1, for the completeness score. */
  progress: number;
  detail_sv?: string;
  detail_en?: string;
  /** The deadline is closer than the requirement's lead time. */
  leadTimeWarning: boolean;
  /** Counted in the application's completeness. */
  counted: boolean;
  note?: string;
}

interface AutoResult {
  status: RequirementStatus;
  progress: number;
  detail_sv?: string;
  detail_en?: string;
}

const fmtPages = (n: number) => (Math.round(n * 10) / 10).toLocaleString("sv-SE");

function autoStatus(req: ApplicationRequirement, facts: RequirementFacts): AutoResult | null {
  const check = req.check;
  if (!check) return null;
  switch (check.type) {
    case "form": {
      const required = facts.sections.filter((s) => s.required);
      if (required.length === 0) return null;
      const written = required.filter((s) => s.written).length;
      const over = facts.sections.filter((s) => s.overLimit).length;
      const progress = written / required.length;
      const status: RequirementStatus = written === required.length && over === 0 ? "done" : written > 0 ? "in-progress" : "todo";
      return {
        status,
        progress: over > 0 ? Math.min(progress, 0.9) : progress,
        detail_sv: `${written} av ${required.length} obligatoriska avsnitt skrivna${over > 0 ? `, ${over} över teckengränsen` : ""}`,
        detail_en: `${written} of ${required.length} required sections written${over > 0 ? `, ${over} over the character limit` : ""}`,
      };
    }
    case "page-limit": {
      if (facts.pageLimit === undefined || facts.estimatedPages === undefined) return null;
      const anyWritten = facts.sections.some((s) => s.written);
      const within = facts.estimatedPages <= facts.pageLimit;
      return {
        status: !anyWritten ? "todo" : within ? "done" : "in-progress",
        progress: !anyWritten ? 0 : within ? 1 : 0.5,
        detail_sv: `Beräknat ${fmtPages(facts.estimatedPages)} av ${facts.pageLimit} sidor${within ? "" : " – kortas"}`,
        detail_en: `Estimated ${fmtPages(facts.estimatedPages)} of ${facts.pageLimit} pages${within ? "" : " – shorten"}`,
      };
    }
    case "section": {
      const section = facts.sections.find((s) => s.key === check.key);
      if (!section) return null;
      return {
        status: section.written ? (section.overLimit ? "in-progress" : "done") : "todo",
        progress: section.written ? (section.overLimit ? 0.5 : 1) : 0,
        detail_sv: section.written ? "Avsnittet är skrivet" : "Avsnittet är inte skrivet än",
        detail_en: section.written ? "The section is written" : "The section isn't written yet",
      };
    }
    case "cost-categories": {
      if (facts.costCategoriesTotal === 0) return autoStatus({ ...req, check: { type: "budget" } }, facts);
      const filled = facts.costCategoriesFilled;
      return {
        status: filled > 0 ? "done" : "todo",
        progress: filled > 0 ? 1 : 0,
        detail_sv: `${filled} av ${facts.costCategoriesTotal} kostnadskategorier med belopp`,
        detail_en: `${filled} of ${facts.costCategoriesTotal} cost categories with an amount`,
      };
    }
    case "budget":
      return {
        status: facts.budgetStated ? "done" : "todo",
        progress: facts.budgetStated ? 1 : 0,
        detail_sv: facts.budgetStated ? "Budget och sökt belopp angivna" : "Ange budget och sökt belopp",
        detail_en: facts.budgetStated ? "Budget and requested amount stated" : "State the budget and requested amount",
      };
    case "submitted":
      return {
        status: facts.submitted ? "done" : "todo",
        progress: facts.submitted ? 1 : 0,
        detail_sv: facts.submitted ? "Ansökan har status inskickad" : undefined,
        detail_en: facts.submitted ? "The application is marked as submitted" : undefined,
      };
    case "partner-countries": {
      if (facts.partnerCountries === undefined) return null;
      const ok = facts.partnerCountries >= check.min;
      return {
        status: ok ? "done" : facts.partnerCountries > 0 ? "in-progress" : "todo",
        progress: Math.min(1, facts.partnerCountries / check.min),
        detail_sv: `${facts.partnerCountries} av minst ${check.min} länder`,
        detail_en: `${facts.partnerCountries} of at least ${check.min} countries`,
      };
    }
  }
}

const PROGRESS: Record<RequirementStatus, number> = { todo: 0, "in-progress": 0.5, done: 1, "not-applicable": 1 };

/** Each requirement's status in one application: the user's own status
 * when set, else what the app can tell (a check, an uploaded file, an
 * exemption), else not started. */
export function evaluateRequirements(
  resolved: ResolvedRequirement[],
  states: Record<string, RequirementState>,
  facts: RequirementFacts
): EvaluatedRequirement[] {
  const daysLeft =
    facts.deadlineDate && facts.today
      ? Math.floor((new Date(`${facts.deadlineDate}T23:59:59`).getTime() - facts.today.getTime()) / 86_400_000)
      : undefined;
  return resolved.map((r) => {
    const req = r.requirement;
    const own = states[req.id];
    const auto = autoStatus(req, facts);
    const files = facts.attachments[req.id] ?? 0;
    let result: AutoResult & { auto: boolean };
    if (own) {
      result = {
        status: own.status,
        progress: own.status === "in-progress" && auto ? Math.max(0.5, auto.progress) : PROGRESS[own.status],
        detail_sv: auto?.detail_sv,
        detail_en: auto?.detail_en,
        auto: false,
      };
    } else if (req.exemptPublicBodies && facts.publicBody) {
      result = {
        status: "not-applicable",
        progress: 1,
        detail_sv: "Offentliga organ är undantagna",
        detail_en: "Public bodies are exempt",
        auto: true,
      };
    } else if (auto) {
      result = { ...auto, auto: true };
    } else if (files > 0) {
      result = {
        status: "done",
        progress: 1,
        detail_sv: files === 1 ? "Fil uppladdad" : `${files} filer uppladdade`,
        detail_en: files === 1 ? "File uploaded" : `${files} files uploaded`,
        auto: true,
      };
    } else {
      result = { status: "todo", progress: 0, auto: false };
    }
    const counted = req.mandatory && req.due !== "before-agreement" && result.status !== "not-applicable";
    const open = result.status === "todo" || result.status === "in-progress";
    return {
      ...r,
      group: groupOf(req.kind),
      status: result.status,
      auto: result.auto,
      progress: result.progress,
      detail_sv: result.detail_sv,
      detail_en: result.detail_en,
      leadTimeWarning: open && req.leadTimeDays !== undefined && daysLeft !== undefined && daysLeft >= 0 && daysLeft <= req.leadTimeDays,
      counted,
      note: own?.note,
    };
  });
}

export interface CompletenessSummary {
  /** 0–100: how far the requirements counted for the application have come. */
  score: number;
  counted: number;
  done: number;
  /** Mandatory requirements still open, in list order. */
  open: EvaluatedRequirement[];
  /** Open requirements whose lead time is longer than the time left. */
  urgent: EvaluatedRequirement[];
}

/** The application's completeness: the mandatory requirements due with
 * the application, weighted by how far each has come. Not applicable and
 * recommended ones don't count; those due before the grant agreement
 * neither. */
export function summarizeCompleteness(items: EvaluatedRequirement[]): CompletenessSummary {
  const counted = items.filter((i) => i.counted);
  const done = counted.filter((i) => i.status === "done").length;
  const sum = counted.reduce((s, i) => s + i.progress, 0);
  return {
    score: counted.length === 0 ? 100 : Math.round((sum / counted.length) * 100),
    counted: counted.length,
    done,
    open: counted.filter((i) => i.status !== "done"),
    urgent: items.filter((i) => i.leadTimeWarning),
  };
}

/** Attachment key of a file uploaded for one requirement of one application. */
export const requirementFileKey = (applicationId: string, requirementId: string) => `requirement:${applicationId}:${requirementId}`;

/** The requirements of an application that only the user can tick off —
 * annexes, certificates, declarations and conditions the app can't check
 * from the application itself — still open. For views outside the
 * workspace (Översikt), which don't have the application's sections. */
export function openManualRequirements(
  resolved: ResolvedRequirement[],
  states: Record<string, RequirementState>,
  publicBody: boolean,
  attachments: Record<string, number>,
  deadlineDate?: string,
  today?: Date
): EvaluatedRequirement[] {
  const manual = resolved.filter((r) => !r.requirement.check);
  const items = evaluateRequirements(manual, states, {
    sections: [],
    costCategoriesFilled: 0,
    costCategoriesTotal: 0,
    budgetStated: false,
    submitted: false,
    publicBody,
    attachments,
    deadlineDate,
    today,
  });
  return items.filter((i) => i.counted && i.status !== "done");
}

/** Whether the organisation is a public body, from its stated type. An
 * organisation without one is taken to be — the system is built for
 * municipalities and regions. */
export function isPublicBody(orgType: string | null | undefined): boolean {
  if (!orgType || !orgType.trim()) return true;
  return /kommun|region|myndighet|offentlig|landsting|stat|public|authority|municipal/i.test(orgType);
}

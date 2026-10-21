import type {
  ApplicationRequirement,
  CallTemplate,
  CostCategory,
  FundingCall,
  FundingProgram,
  Grant,
  ReportingEvent,
  ReportingEventType,
  RequirementChanges,
} from "../types";
import { PORTAL_PROGRAMMES, ReportFacts, ResolvedRequirement, groupOf, GROUP_ORDER } from "./applicationRequirements";
import { expectedShareAt, isDeviation } from "./grants";
import { costAmounts } from "./costCategories";
import type { ReportSection } from "./reportSections";

// What a call asks for before a report counts as complete — the report
// form, the financial statement, annexes and certificates, the conditions
// of the grant and the submission — the reporting side of
// applicationRequirements.ts. The grant page opens with an overview of
// them, and each report shows how far it has come.
//
// Sources, as for the application: the funder's report form
// (CallTemplate.requirements of a report form), the programme for calls
// without one, the call's own from data/utlysningskrav.csv (Gäller:
// rapport, delrapport or slutrapport) and from Datacenter › Krav, and what
// the app derives from the grant (its commitments, the call's required
// documents and audit certificate threshold).

const CHECKED = "2026-10-21";

const HE_PERIODIC = {
  document: "Periodic report template (Horizon Europe and Euratom)",
  url: "https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/common/temp-form/report/periodic-report_horizon-euratom_en.docx",
};
const HE_MGA = {
  document: "HE Model Grant Agreement, art. 21 och 24",
  url: "https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/common/agr-contr/general-mga_horizon-euratom_en.pdf",
};
const ESF_TERMS = {
  document: "Svenska ESF-rådets allmänna beslutsvillkor (bilaga till utlysning 26-024)",
  url: "https://www.esf.se/utlysningar/",
};

/** Horizon Europe periodic and final reports. */
export const HE_REPORT_REQUIREMENTS: ApplicationRequirement[] = [
  {
    id: "he-r-part-b",
    kind: "form",
    title_sv: "Teknisk rapport, del B",
    title_en: "Technical report, Part B",
    why_sv: "En berättande redovisning av arbetet under perioden, enligt mallen i rapportmodulen. Laddas upp som PDF av koordinatorn.",
    why_en: "A narrative account of the work during the period, following the template in the reporting module. Uploaded as a PDF by the coordinator.",
    mandatory: true,
    owner: "applicant",
    check: { type: "report-sections" },
    source: { ...HE_PERIODIC, checkedAt: CHECKED },
  },
  {
    id: "he-r-continuous",
    kind: "form",
    title_sv: "Continuous Reporting uppdaterad (del A)",
    title_en: "Continuous Reporting up to date (Part A)",
    why_sv:
      "Leveranser, milstolpar, risker, resultat, publikationer och spridning förs in i portalens modul för löpande rapportering. Den blir del A av rapporten; uppdatera innan rapporten låses för granskning.",
    why_en:
      "Deliverables, milestones, risks, results, publications and dissemination are entered in the portal's Continuous Reporting module. It becomes Part A of the report; update it before the report is locked for review.",
    mandatory: true,
    owner: "partners",
    source: { ...HE_PERIODIC, checkedAt: CHECKED },
  },
  {
    id: "he-r-financial-statements",
    kind: "budget",
    title_sv: "Finansiella rapporter och sammanställning",
    title_en: "Financial statements and summary",
    why_sv: "Varje stödmottagare fyller i sin finansiella rapport i portalen; koordinatorn sammanställer dem. Vid klumpsumma redovisas i stället att arbetspaketen är slutförda.",
    why_en: "Each beneficiary completes its financial statement in the portal; the coordinator consolidates them. With a lump sum, the completed work packages are declared instead.",
    mandatory: true,
    owner: "finance",
    check: { type: "report-spend" },
    source: { ...HE_PERIODIC, checkedAt: CHECKED },
  },
  {
    id: "he-r-cfs",
    kind: "certificate",
    title_sv: "Revisorsintyg för de finansiella rapporterna (CFS)",
    title_en: "Certificate on the financial statements (CFS)",
    why_sv: "Krävs med slutrapporten för en stödmottagare som begär minst 430 000 euro i faktiska kostnader. Gäller inte klumpsummebidrag. Upphandla revisorn i god tid.",
    why_en: "Required with the final report for a beneficiary requesting at least EUR 430 000 as actual costs. Not for lump-sum grants. Procure the auditor in good time.",
    mandatory: true,
    condition_sv: "begärt EU-bidrag i faktiska kostnader på minst 430 000 euro",
    condition_en: "a requested EU contribution of at least EUR 430 000 as actual costs",
    owner: "finance",
    leadTimeDays: 60,
    reports: ["final"],
    source: { ...HE_MGA, section: "art. 24", checkedAt: CHECKED },
  },
  {
    id: "he-r-submit",
    kind: "submission",
    title_sv: "Inskickad av koordinatorn inom 60 dagar efter perioden",
    title_en: "Submitted by the coordinator within 60 days of the period",
    why_sv: "Rapporten är villkoret för utbetalning och lämnas i portalens system för bidragshantering.",
    why_en: "The report is the condition for payment and is submitted in the portal's grant management system.",
    mandatory: true,
    owner: "applicant",
    check: { type: "submitted" },
    source: { ...HE_PERIODIC, checkedAt: CHECKED },
  },
];

/** ESF+ — payment claims, quarterly reports and the final report. */
export const ESF_REPORT_REQUIREMENTS: ApplicationRequirement[] = [
  {
    id: "esf-r-quarterly",
    kind: "form",
    title_sv: "Kvartalsrapport",
    title_en: "Quarterly report",
    why_sv: "ESF-rådets dokument Kvartalsrapport lämnas var tredje månad, första gången tre månader efter projektstart. Gäller inte klumpsummeprojekt.",
    why_en: "ESF-rådet's Quarterly report form is submitted every three months, first three months after the project starts. Not for lump-sum projects.",
    mandatory: true,
    owner: "applicant",
    check: { type: "report-sections" },
    reports: ["interim"],
    source: { ...ESF_TERMS, section: "9.1 Kvartalsrapport", checkedAt: CHECKED },
  },
  {
    id: "esf-r-final-report",
    kind: "form",
    title_sv: "Slutrapport med sista ansökan om utbetalning",
    title_en: "Final report with the last payment claim",
    why_sv: "Sista ansökan om utbetalning ska innehålla en slutrapport, och ersätter då kvartalsrapporten.",
    why_en: "The last payment claim must include a final report, which replaces the quarterly report.",
    mandatory: true,
    owner: "applicant",
    check: { type: "report-sections" },
    reports: ["final"],
    source: { ...ESF_TERMS, section: "3.1 c och 9.1", checkedAt: CHECKED },
  },
  {
    id: "esf-r-payment-claim",
    kind: "budget",
    title_sv: "Ansökan om utbetalning i e-tjänsten",
    title_en: "Payment claim in the e-service",
    why_sv: "Omfattar alla stödberättigande utgifter för en kalendermånad och ska vara inne senast två månader efter månadens slut (den sista senast två månader efter projektets slut).",
    why_en: "Covers every eligible cost for a calendar month and must arrive within two months of the month's end (the last within two months of the project's end).",
    mandatory: true,
    owner: "finance",
    check: { type: "report-spend" },
    source: { ...ESF_TERMS, section: "3.1 Innehåll och inlämnande", checkedAt: CHECKED },
  },
  {
    id: "esf-r-evidence",
    kind: "annex",
    title_sv: "Underlag som verifierar att utgifterna är stödberättigande",
    title_en: "Evidence that the costs are eligible",
    why_sv: "Bifogas ansökan om utbetalning. Vid klumpsumma: underlag som visar att leveransmålen är uppfyllda.",
    why_en: "Attached to the payment claim. With a lump sum: evidence that the delivery targets are met.",
    mandatory: true,
    owner: "finance",
    source: { ...ESF_TERMS, section: "3.1 c och 3.2", checkedAt: CHECKED },
  },
  {
    id: "esf-r-cofinancing",
    kind: "budget",
    title_sv: "Medfinansiering redovisad",
    title_en: "Co-financing reported",
    why_sv: "Medfinansiering redovisas i den takt den blir stödberättigande. Stöd och medfinansiering ska vara i balans med sista ansökan om utbetalning.",
    why_en: "Co-financing is reported as it becomes eligible. Grant and co-financing must balance with the last payment claim.",
    mandatory: true,
    owner: "finance",
    source: { ...ESF_TERMS, section: "5.5 Medfinansiering", checkedAt: CHECKED },
  },
  {
    id: "esf-r-participants",
    kind: "form",
    title_sv: "Deltagare rapporterade till SCB",
    title_en: "Participants reported to Statistics Sweden",
    why_sv: "Projekt med deltagare rapporterar dem i ESF-rådets e-tjänst eller enligt rådets mall, när beslutet anger det.",
    why_en: "Projects with participants report them in ESF-rådet's e-service or on its template, when the decision says so.",
    mandatory: true,
    condition_sv: "projekt med deltagare",
    condition_en: "projects with participants",
    owner: "applicant",
    source: { ...ESF_TERMS, section: "2.3 och 6", checkedAt: CHECKED },
  },
  {
    id: "esf-r-signatory",
    kind: "certificate",
    title_sv: "Undertecknad av behörig företrädare",
    title_en: "Signed by the authorised signatory",
    why_sv: "Ansökan om utbetalning undertecknas av behörig företrädare.",
    why_en: "The payment claim is signed by the authorised signatory.",
    mandatory: true,
    owner: "signatory",
    source: { ...ESF_TERMS, section: "3.1 a", checkedAt: CHECKED },
  },
  {
    id: "esf-r-on-request",
    kind: "annex",
    title_sv: "Underlag redo att lämna på begäran",
    title_en: "Records ready to hand over on request",
    why_sv:
      "Tidsredovisning i ESF-rådets system, verifiering av medfinansiering, upphandlings- och inköpsunderlag, deltagarersättning och inkomster i projektet.",
    why_en:
      "Time records in ESF-rådet's system, proof of co-financing, procurement and purchase records, participant allowances and income in the project.",
    mandatory: false,
    owner: "finance",
    source: { ...ESF_TERMS, section: "3.1 d", checkedAt: CHECKED },
  },
  {
    id: "esf-r-submit",
    kind: "submission",
    title_sv: "Inskickad i tid",
    title_en: "Submitted on time",
    why_sv: "Senast två månader efter den månad ansökan om utbetalning gäller; slutrapporten senast två månader efter projektets slut.",
    why_en: "Within two months of the month the claim covers; the final report within two months of the project's end.",
    mandatory: true,
    owner: "applicant",
    check: { type: "submitted" },
    source: { ...ESF_TERMS, section: "3.1 b", checkedAt: CHECKED },
  },
];

const PORTAL_REPORT_REQUIREMENTS: ApplicationRequirement[] = [
  {
    id: "portal-r-technical",
    kind: "form",
    title_sv: "Teknisk rapport (del A i portalen och del B)",
    title_en: "Technical report (Part A in the portal and Part B)",
    why_sv: "Del A fylls i i portalens modul för löpande rapportering, del B är den berättande rapporten enligt mallen i rapportmodulen.",
    why_en: "Part A is filled in in the portal's Continuous Reporting module; Part B is the narrative report on the template in the reporting module.",
    mandatory: true,
    owner: "applicant",
    check: { type: "report-sections" },
    source: { document: "Funding & Tenders Portal, Online Manual: Reporting", checkedAt: CHECKED },
  },
  {
    id: "portal-r-financial",
    kind: "budget",
    title_sv: "Finansiell rapport",
    title_en: "Financial report",
    why_sv: "Kostnaderna per stödmottagare, eller vid klumpsumma vilka arbetspaket som är slutförda.",
    why_en: "The costs per beneficiary, or with a lump sum which work packages are completed.",
    mandatory: true,
    owner: "finance",
    check: { type: "report-spend" },
    source: { document: "Funding & Tenders Portal, Online Manual: Reporting", checkedAt: CHECKED },
  },
  {
    id: "portal-r-submit",
    kind: "submission",
    title_sv: "Inskickad av koordinatorn i portalen",
    title_en: "Submitted by the coordinator in the portal",
    why_sv: "Inom den tid bidragsavtalet anger, oftast 60 dagar efter rapportperioden.",
    why_en: "Within the time the grant agreement sets, usually 60 days after the reporting period.",
    mandatory: true,
    owner: "applicant",
    check: { type: "submitted" },
    source: { document: "Bidragsavtalet", checkedAt: CHECKED },
  },
];

const GENERIC_REPORT_REQUIREMENTS: ApplicationRequirement[] = [
  {
    id: "generic-r-form",
    kind: "form",
    title_sv: "Finansiärens rapportformulär",
    title_en: "The funder's report form",
    why_sv: "Rapporten skrivs i finansiärens eget formulär; rapportens avsnitt här är ett utkast att utgå från.",
    why_en: "The report goes in the funder's own form; the report sections here are a draft to start from.",
    mandatory: true,
    owner: "applicant",
    check: { type: "report-sections" },
    source: { document: "Beslutet om stöd", checkedAt: CHECKED },
  },
  {
    id: "generic-r-spend",
    kind: "budget",
    title_sv: "Ekonomisk redovisning",
    title_en: "Financial statement",
    why_sv: "Kostnaderna för perioden, med underlag enligt beslutet.",
    why_en: "The period's costs, with evidence as the decision requires.",
    mandatory: true,
    owner: "finance",
    check: { type: "report-spend" },
    source: { document: "Beslutet om stöd", checkedAt: CHECKED },
  },
  {
    id: "generic-r-decision",
    kind: "annex",
    title_sv: "Rapportkraven i beslutet genomgångna",
    title_en: "The decision's reporting requirements reviewed",
    why_sv: "Utlysningens krav på bilagor till rapporterna är inte inlagda i systemet. Läs beslutet om stöd och lägg till dem som egna krav eller i Datacenter › Krav.",
    why_en: "The call's requirements for report annexes aren't in the system. Read the grant decision and add them as your own requirements or in Datacenter › Requirements.",
    mandatory: true,
    owner: "applicant",
    source: { document: "Beslutet om stöd", checkedAt: CHECKED },
  },
  {
    id: "generic-r-submit",
    kind: "submission",
    title_sv: "Inskickad före sista dag",
    title_en: "Submitted before the due date",
    why_sv: "Utbetalningen följer rapporten; en sen rapport försenar pengarna.",
    why_en: "Payment follows the report; a late report delays the money.",
    mandatory: true,
    owner: "applicant",
    check: { type: "submitted" },
    source: { document: "Beslutet om stöd", checkedAt: CHECKED },
  },
];

/** Requirements derived from the grant and the call's reporting terms. */
export function derivedReportRequirements(grant: Grant, call: FundingCall | undefined): ApplicationRequirement[] {
  const out: ApplicationRequirement[] = [];
  if (grant.commitments.length > 0) {
    out.push({
      id: "derived-r-indicators",
      kind: "form",
      title_sv: "Utfall för projektets åtaganden",
      title_en: "Outcomes for the project's commitments",
      why_sv: "Värdet för varje indikator som ansökan lovade, med en förklaring där utfallet avviker från det som skulle vara nått.",
      why_en: "The value of every indicator the application promised, with an explanation where the outcome differs from what should have been reached.",
      mandatory: true,
      owner: "applicant",
      check: { type: "report-indicators" },
      source: { document: "Beslutet om stöd (åtaganden)", checkedAt: CHECKED },
    });
  }
  const req = call?.reportingRequirements;
  if (req) {
    const docs = (type: "interim" | "final", sv: string[], en: string[]) =>
      sv.map((name, index) => ({
        id: `derived-r-${type}-doc-${index}`,
        kind: "annex" as const,
        title_sv: name,
        title_en: en[index] ?? name,
        why_sv: type === "final" ? "Ett dokument utlysningen kräver med slutrapporten." : "Ett dokument utlysningen kräver med delrapporterna.",
        why_en: type === "final" ? "A document the call requires with the final report." : "A document the call requires with the interim reports.",
        mandatory: true,
        check: { type: "report-document" as const, index },
        reports: [type],
        source: { document: "Utlysningens rapportkrav", url: call?.link, checkedAt: CHECKED },
      }));
    out.push(...docs("interim", req.interimDocuments_sv, req.interimDocuments_en));
    out.push(...docs("final", req.finalReportDocuments_sv, req.finalReportDocuments_en));
    // Unless the call already lists the certificate among its documents.
    const listsCertificate = req.finalReportDocuments_sv.some((name) => /revision|revisor/i.test(name));
    if (req.requiresAuditAboveSEK !== null && grant.awardedAmountSEK > req.requiresAuditAboveSEK && !listsCertificate) {
      out.push({
        id: "derived-r-audit-certificate",
        kind: "certificate",
        title_sv: "Revisorsintyg med slutrapporten",
        title_en: "Auditor's certificate with the final report",
        why_sv: "Bidraget är över utlysningens gräns för revisorsintyg. Upphandla en oberoende revisor i god tid.",
        why_en: "The grant is above the call's threshold for an auditor's certificate. Procure an independent auditor in good time.",
        mandatory: true,
        owner: "finance",
        leadTimeDays: 60,
        reports: ["final"],
        source: { document: "Utlysningens rapportkrav", url: call?.link, checkedAt: CHECKED },
      });
    }
  }
  return out;
}

export interface ReportRequirementSources {
  grant: Grant;
  call: FundingCall | undefined;
  program: FundingProgram | undefined;
  /** The funder's report form the call's reports follow, if any. */
  template?: CallTemplate;
  /** Changes made in Datacenter › Krav for this call's reports. */
  datacenter?: RequirementChanges;
  /** Requirements the user added for the grant's reports. */
  own?: ApplicationRequirement[];
  /** Only those for this kind of report; undefined = every report. */
  reportType?: ReportingEventType;
}

/** Every requirement for the grant's reports (or one kind of report), each once, by group. */
export function resolveReportRequirements({ grant, call, program, template, datacenter, own = [], reportType }: ReportRequirementSources): ResolvedRequirement[] {
  if (reportType === "sustainability") return [];
  const portal = !!call && PORTAL_PROGRAMMES.includes(call.programId);
  const fromForm = template?.requirements ?? [];
  const callAdds = [...(call?.reportRequirementChanges?.add ?? []), ...(datacenter?.add ?? [])];
  const removed = new Set([...(call?.reportRequirementChanges?.remove ?? []), ...(datacenter?.remove ?? [])]);
  const derived = derivedReportRequirements(grant, call);

  let programme: ApplicationRequirement[] = [];
  if (fromForm.length === 0) {
    // The portal's own report steps replace the generic form, statement
    // and submission; the reminder to read the decision stays.
    programme = portal
      ? [...PORTAL_REPORT_REQUIREMENTS, ...GENERIC_REPORT_REQUIREMENTS.filter((r) => r.id === "generic-r-decision")]
      : GENERIC_REPORT_REQUIREMENTS;
    const knowsDocuments = [...callAdds, ...derived].some((r) => ["annex", "certificate", "declaration"].includes(r.kind));
    if (knowsDocuments) programme = programme.filter((r) => r.id !== "generic-r-decision");
  }

  const all: ResolvedRequirement[] = [
    ...fromForm.map((requirement) => ({ requirement, origin: "form" as const })),
    ...programme.map((requirement) => ({ requirement, origin: "programme" as const })),
    ...(call?.reportRequirementChanges?.add ?? []).map((requirement) => ({ requirement, origin: "call" as const })),
    ...(datacenter?.add ?? []).map((requirement) => ({ requirement, origin: "datacenter" as const })),
    ...derived.map((requirement) => ({ requirement, origin: "derived" as const })),
    ...own.map((requirement) => ({ requirement, origin: "own" as const })),
  ];
  const seen = new Set<string>();
  return all
    .filter(({ requirement }) => {
      if (removed.has(requirement.id) || seen.has(requirement.id)) return false;
      if (reportType && requirement.reports && !requirement.reports.includes(reportType)) return false;
      seen.add(requirement.id);
      return true;
    })
    .map((r, i) => ({ r, i }))
    .sort((a, b) => GROUP_ORDER.indexOf(groupOf(a.r.requirement.kind)) - GROUP_ORDER.indexOf(groupOf(b.r.requirement.kind)) || a.i - b.i)
    .map(({ r }) => r);
}

/** Datacenter › Krav key of a call's report requirements — kept beside
 * the application's, under their own key. */
export const reportRequirementsKey = (callId: string) => `report:${callId}`;

/** What a report draft holds, for the requirements the app checks itself:
 * the figures and text as typed, else what the report already holds. */
export function reportFacts({
  grant,
  event,
  draft,
  sections,
  categories,
  documentsReady,
}: {
  grant: Grant;
  event: ReportingEvent;
  draft: { sections: Record<string, string>; deviations: Record<string, string>; outcomes: Record<string, string>; spentThisPeriod: string; costs: Record<string, string> };
  sections: ReportSection[];
  categories?: CostCategory[];
  documentsReady: boolean[];
}): ReportFacts {
  const required = sections.filter((s) => s.required !== false);
  const sectionText = (key: string) => draft.sections[key] ?? (key === "summary" ? event.note_sv ?? event.note_en ?? "" : "");
  const outcome = (indicator: string) => draft.outcomes[indicator] ?? event.outcomes.find((o) => o.indicator_sv === indicator)?.value.toString() ?? "";
  const share = expectedShareAt(grant, event.id);
  const filled = grant.commitments.filter((c) => outcome(c.indicator_sv).trim() !== "");
  const unexplained = filled.filter(
    (c) => isDeviation(Number(outcome(c.indicator_sv)), c.promisedValue, share) && !draft.deviations[c.indicator_sv]?.trim()
  );
  const costs =
    Object.keys(draft.costs).length > 0 ? draft.costs : Object.fromEntries(Object.entries(event.financials?.byCategory ?? {}).map(([k, v]) => [k, String(v)]));
  const spendReported = categories
    ? Object.values(costAmounts(categories, costs)).some((v) => v > 0)
    : (draft.spentThisPeriod || (event.financials ? String(event.financials.spentThisPeriodSEK) : "")).trim() !== "";
  return {
    sectionsWritten: required.filter((s) => sectionText(s.key).trim()).length,
    sectionsTotal: required.length,
    indicatorsFilled: filled.length,
    indicatorsTotal: grant.commitments.length,
    deviationsUnexplained: unexplained.length,
    spendReported,
    documentsReady,
  };
}

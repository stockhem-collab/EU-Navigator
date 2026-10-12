import { FundingCall, FundingProgram, Grant } from "@/lib/types";

// Audit readiness for a grant: what an auditor or the funder's control
// will ask to see, so it is in order before the reports rather than
// reconstructed afterwards. Money is most often paid back over personnel
// costs without time records, purchases made outside public procurement,
// missing EU branding and documents that can no longer be found — not over
// the application. Generic items apply to every grant; the others follow
// the programme (participants for ESF+ and AMIF, first-level control for
// Interreg, a partnership agreement where there are partners, an audit
// certificate where the call requires one above an amount). The texts are
// guidance, not the funder's rules: the grant agreement decides.

export interface AuditContext {
  program: FundingProgram | undefined;
  call: FundingCall | undefined;
  grant: Grant;
}

export interface AuditItem {
  id: string;
  title_sv: string;
  title_en: string;
  why_sv: string;
  why_en: string;
  appliesTo?: (ctx: AuditContext) => boolean;
}

const PARTICIPANT_PROGRAMMES = ["esf", "amif"];

const isInterreg = (ctx: AuditContext) => !!ctx.program && (ctx.program.id.startsWith("interreg") || ctx.program.id === "urbact");
const isShared = (ctx: AuditContext) => ctx.program?.management === "shared";
const hasPartners = (ctx: AuditContext) =>
  !!ctx.call?.requiresPartnership || (ctx.call?.minPartnerCountries ?? 0) > 1 || isInterreg(ctx) || ctx.program?.management === "direct";

/** The amount above which the call requires an audit certificate, when the
 * grant is above it. */
export function auditCertificateThreshold(ctx: AuditContext): number | null {
  const threshold = ctx.call?.reportingRequirements?.requiresAuditAboveSEK ?? null;
  return threshold !== null && ctx.grant.awardedAmountSEK > threshold ? threshold : null;
}

export const AUDIT_ITEMS: AuditItem[] = [
  {
    id: "project-code",
    title_sv: "Egen projektkod i ekonomisystemet",
    title_en: "A project code of its own in the finance system",
    why_sv: "Alla intäkter och kostnader i projektet bokförs på projektkoden, så att projektets redovisning går att ta fram direkt ur bokföringen.",
    why_en: "Every income and cost of the project is booked on its code, so the project's accounts can be produced straight from the books.",
  },
  {
    id: "time-records",
    title_sv: "Tidredovisning för personal som belastar projektet",
    title_en: "Time records for staff charged to the project",
    why_sv:
      "Personalkostnader är den största kostnaden och den som oftast underkänns. Spara tidrapporter, eller ett beslut om att personen arbetar hela sin tid i projektet, attesterade av chef.",
    why_en:
      "Staff costs are the largest cost and the one most often rejected. Keep timesheets, or a decision that the person works full time in the project, approved by their manager.",
  },
  {
    id: "vouchers",
    title_sv: "Fakturor, betalningsbevis och lönespecifikationer sparade per kostnad",
    title_en: "Invoices, proof of payment and payslips kept per cost",
    why_sv: "Varje redovisad kostnad ska gå att styrka med verifikation och bevis på att den är betald under projektperioden.",
    why_en: "Every reported cost must be backed by a voucher and proof that it was paid within the project period.",
  },
  {
    id: "procurement",
    title_sv: "Inköp gjorda enligt LOU och dokumenterade",
    title_en: "Purchases made under public procurement rules and documented",
    why_sv:
      "Brister i upphandling är en vanlig orsak till återkrav. Spara upphandlingsdokument, eller hänvisning till ramavtal, för varje inköp i projektet, också under direktupphandlingsgränsen.",
    why_en:
      "Procurement errors are a common reason for recovery. Keep the procurement documents, or the framework agreement used, for every purchase, also below the direct-award threshold.",
  },
  {
    id: "state-aid",
    title_sv: "Statsstöd och de minimis bedömt",
    title_en: "State aid and de minimis assessed",
    why_sv: "Om företag får del av projektets resurser, till exempel rådgivning eller utbildning, ska det bedömas och dokumenteras om det är statsstöd.",
    why_en: "If companies benefit from the project, for example through advice or training, whether that is state aid must be assessed and documented.",
  },
  {
    id: "double-funding",
    title_sv: "Ingen kostnad finansieras av ett annat bidrag",
    title_en: "No cost is funded by another grant",
    why_sv: "Samma kostnad får inte redovisas mot två finansiärer. Kontrollera mot organisationens övriga externa medel.",
    why_en: "The same cost must not be reported to two funders. Check against the organisation's other external funding.",
  },
  {
    id: "communication",
    title_sv: "EU-emblem och finansieringstext där projektet syns",
    title_en: "EU emblem and funding statement wherever the project appears",
    why_sv:
      "Webbplats, material, inbjudningar och lokaler ska visa att projektet är EU-finansierat enligt finansiärens kommunikationskrav. Brister kan leda till att en del av bidraget dras in.",
    why_en:
      "Website, material, invitations and premises must show EU funding according to the funder's communication rules. Shortcomings can cost part of the grant.",
  },
  {
    id: "participants",
    title_sv: "Deltagaruppgifter, närvaro och samtycken dokumenterade",
    title_en: "Participant data, attendance and consents documented",
    why_sv: "Deltagare ska kunna styrkas med uppgifter enligt programmets krav, närvarolistor och information enligt dataskyddsförordningen.",
    why_en: "Participants must be documented as the programme requires, with attendance lists and data protection information.",
    appliesTo: (ctx) => !!ctx.program && PARTICIPANT_PROGRAMMES.includes(ctx.program.id),
  },
  {
    id: "indicators",
    title_sv: "Underlag för rapporterade indikatorer sparade",
    title_en: "Evidence kept for the reported indicators",
    why_sv: "Varje värde i en rapport, som antal deltagare eller minskade utsläpp, ska gå att visa hur det är framräknat.",
    why_en: "Every value in a report, such as participants or emissions cut, must show how it was arrived at.",
  },
  {
    id: "partnership-agreement",
    title_sv: "Partnerskapsavtal undertecknat",
    title_en: "Partnership agreement signed",
    why_sv: "Avtalet reglerar ansvar, budgetfördelning och hur pengar förs vidare mellan partnerna. Finansiären kan begära att få se det.",
    why_en: "The agreement sets out responsibilities, budget shares and how money passes between partners. The funder may ask to see it.",
    appliesTo: hasPartners,
  },
  {
    id: "first-level-control",
    title_sv: "Första nivåns kontroll bokad för varje rapportperiod",
    title_en: "First-level control booked for every reporting period",
    why_sv: "I Interreg granskas varje partners kostnader av en godkänd kontrollant innan rapporten lämnas. Boka i god tid, det tar ofta flera veckor.",
    why_en: "In Interreg each partner's costs are checked by an approved controller before the report is submitted. Book early; it often takes weeks.",
    appliesTo: isInterreg,
  },
  {
    id: "audit-certificate",
    title_sv: "Revisionsintyg beställt inför slutrapporten",
    title_en: "Audit certificate ordered for the final report",
    why_sv: "Utlysningen kräver ett intyg från oberoende revisor när bidraget är över gränsbeloppet. Upphandla revisorn i tid.",
    why_en: "The call requires an independent auditor's certificate when the grant is above the threshold. Procure the auditor in time.",
    appliesTo: (ctx) => auditCertificateThreshold(ctx) !== null,
  },
  {
    id: "changes-approved",
    title_sv: "Ändringar godkända av finansiären innan de genomförs",
    title_en: "Changes approved by the funder before they are made",
    why_sv: "Större ändringar av budget, tidsplan, aktiviteter eller partner kräver ofta ett godkännande i förväg. Spara beslutet.",
    why_en: "Larger changes to budget, timetable, activities or partners often need approval in advance. Keep the decision.",
  },
  {
    id: "archiving",
    title_sv: "Arkivering så länge avtalet kräver",
    title_en: "Archiving for as long as the agreement requires",
    why_sv:
      "Underlagen ska finnas kvar efter projektets slut. För strukturfonderna 2021–2027 i regel fem år från den 31 december det år då sista utbetalningen gjordes (förordning (EU) 2021/1060, art. 82). Stäm av mot organisationens gallringsbeslut.",
    why_en:
      "The records must be kept after the project ends. For the 2021–2027 structural funds, as a rule five years from 31 December of the year of the last payment (Regulation (EU) 2021/1060, Art. 82). Check against the organisation's retention rules.",
    appliesTo: isShared,
  },
  {
    id: "archiving-direct",
    title_sv: "Arkivering så länge bidragsavtalet kräver",
    title_en: "Archiving for as long as the grant agreement requires",
    why_sv: "Bidragsavtalet anger hur länge underlagen ska sparas efter slututbetalningen, i regel fem år. Stäm av mot organisationens gallringsbeslut.",
    why_en: "The grant agreement states how long records are kept after the final payment, usually five years. Check against the organisation's retention rules.",
    appliesTo: (ctx) => !isShared(ctx),
  },
];

/** The items that apply to this grant, in the list's order. */
export function auditItemsFor(ctx: AuditContext): AuditItem[] {
  return AUDIT_ITEMS.filter((item) => !item.appliesTo || item.appliesTo(ctx));
}

export type Lang = "sv" | "en";

export type Sector =
  | "energy"
  | "climate"
  | "digital"
  | "social"
  | "mobility"
  | "education"
  | "health"
  | "research";

export type GapCategory = "sector" | "keywords" | "budget" | "partnership" | "duration";

// ---------------------------------------------------------------------------
// Level 1: Programme / fund — permanent, slow-changing information.
// ---------------------------------------------------------------------------
export interface FundingProgram {
  id: string;
  name: string;
  name_sv: string;
  shortName: string;
  logoLetter: string;
  description_sv: string;
  description_en: string;
  sectors: Sector[];
  keywords: string[];
  geographicScope: "sweden" | "eu-wide" | "cross-border-region";
  typicalCoFinancingRate: number; // 0-1
  typicalDurationYears: [number, number];
  /** "active" = currently open to new applications; "legacy" = closed programme
   * from the 2014-2020 period, kept for its historical reference projects. */
  status: "active" | "legacy";
}

// ---------------------------------------------------------------------------
// Level 2: Call (utlysning) — the thing a project actually applies to.
// ---------------------------------------------------------------------------
export interface EvaluationCriterion {
  name_sv: string;
  name_en: string;
  maxPoints: number;
}

/** One section of a call's own real application form — docs/DATA_MODEL.md
 * §1.6's `ApplicationRequirementDefinition`, inlined onto the call rather
 * than normalised into its own table since the prototype has no database.
 * When a call defines these, the Ansökningsstudio generates and exports the
 * application around THIS structure instead of the generic six-field
 * fallback (Problem/Mål/Aktiviteter/Outputs/Effekter/Indikatorer) — so two
 * different calls can genuinely produce two different-shaped applications,
 * matching their own real instructions. Left undefined on most calls today:
 * populating it accurately requires the call's real application-form text,
 * which isn't available for every illustrative call in this dataset — see
 * the one seeded example (Horizon Europe) for what a real one looks like. */
export interface ApplicationTemplateSection {
  key: string;
  label_sv: string;
  label_en: string;
  instructions_sv: string;
  instructions_en: string;
}

export interface FundingCall {
  id: string;
  programId: string;
  title_sv: string;
  title_en: string;
  status: "open" | "upcoming";
  deadlineMonthsFromNow: number;
  budgetTotalSEK: number;
  minGrantSEK: number;
  maxGrantSEK: number;
  requiresPartnership: boolean;
  eligibleApplicants_sv: string;
  eligibleApplicants_en: string;
  priorities_sv: string[];
  priorities_en: string[];
  extraKeywords: string[]; // in addition to the programme's own keywords
  evaluationCriteria: EvaluationCriterion[];
  documents: FundingDocument[];
  /** This call's own application-form structure, when known — see
   * ApplicationTemplateSection. Undefined = no call-specific structure on
   * file; the workspace falls back to the generic project-logic template. */
  applicationTemplate?: ApplicationTemplateSection[];
}

// ---------------------------------------------------------------------------
// Level 3: Document — the actual AI context package for a call.
// ---------------------------------------------------------------------------
export type DocumentType =
  | "call"
  | "guide"
  | "form"
  | "criteria"
  | "budget"
  | "faq"
  | "agreement"
  | "reporting"
  | "template"
  | "annex"
  | "corrigendum";

export interface FundingDocument {
  id: string;
  type: DocumentType;
  title_sv: string;
  title_en: string;
  updatedAt: string; // ISO date
  needsUpdate: boolean;
}

// ---------------------------------------------------------------------------
// Project bank — the municipality's own project ideas / investments.
// ---------------------------------------------------------------------------
/** The customer's own project-pipeline lifecycle, matching
 * docs/DATA_MODEL.md §2.2's `CustomerProject.status`. The prototype doesn't
 * yet have a separate persisted `Application` record driving this (see
 * `useApplication` for what is persisted today), so a project only moves
 * through these stages when its seed/import data or the Projektbank UI says
 * so — nothing here auto-advances the status yet. */
export type ProjectStatus =
  | "idea"
  | "assessing"
  | "funding-search"
  | "application"
  | "submitted"
  | "approved"
  | "rejected"
  | "running"
  | "completed";

/** The lifecycle in its natural, logical order — a single source of truth
 * so Översikt's "Projekt per status" breakdown and Mina projekt's own copy
 * of it can't quietly drift apart. */
export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "idea",
  "assessing",
  "funding-search",
  "application",
  "submitted",
  "approved",
  "rejected",
  "running",
  "completed",
];

export interface ProjectBankEntry {
  id: string;
  title_sv: string;
  title_en: string;
  department_sv: string;
  department_en: string;
  owner: string;
  status: ProjectStatus;
  estimatedCostSEK: number;
  periodStart: number;
  periodEnd: number;
  sector: Sector;
  description_sv: string;
  description_en: string;
  hasInternationalPartner: boolean;
  aiReadinessPct: number;
  missingFields_sv: string[];
  missingFields_en: string[];
}

// ---------------------------------------------------------------------------
// Funded projects — previously awarded projects used to teach the system
// patterns of what gets funded ("Lär av vinnarna"). This is REAL data: an
// example municipality's actual EU-funded projects 2014-2027, extracted
// from that municipality's own "Projekt med beviljade medel" documentation
// (organisation names anonymised to "Exempelstad").
//
// This is the prototype's version of the `FundedProject` reference-data
// entity in docs/DATA_MODEL.md §1.8 (which also folds in what a real backend
// would call `AwardedProject`/`Commitment` for the customer's own post-award
// reporting loop — that half stays a separate, simpler `AwardedProject` type
// below for now, since building the full `Application`/`Report` chain the
// doc describes is later-phase work).
// ---------------------------------------------------------------------------
export interface ProjectIndicator {
  label_sv: string;
  label_en: string;
  target: number;
  actual: number;
  unit_sv: string;
  unit_en: string;
}

/** Reference-data lifecycle state (docs/DATA_MODEL.md §1.8). Left unset in
 * today's dataset: the source documentation doesn't disclose a per-project
 * status, and inferring one from the project period would be a guess
 * presented as fact — better to leave it absent than fake precision. A real
 * sync job would populate this from the source system. */
export type FundedProjectStatus = "signed" | "ongoing" | "closed" | "terminated";

export interface FundedProject {
  id: string;
  title: string;
  organisation: string;
  theme_sv: string;
  theme_en: string;
  programId: string;
  fundName: string; // the original, un-normalized name of the fund/programme
  /** Which of the source organisation's two published EU programme periods
   * this project belongs to — a real distinction in the source data, not an
   * invented one. */
  period: "2021-2027" | "2014-2020";
  periodLabel: string; // raw project period text, e.g. "2023-01-01 till 2028-01-01"
  role: "owner" | "partner";
  description_sv: string;
  /** Our own editorial summary in English. Per docs/DATA_MODEL.md §7.1,
   * source-published text can stay single-language, but this field is
   * content we authored ourselves — optional here only because translating
   * all 74 extracted Swedish summaries is future content work, not a
   * modelling gap. UI falls back to `description_sv` when absent. */
  description_en?: string;
  status?: FundedProjectStatus;
  totalBudgetSEK: number | null;
  euFundingSEK: number | null;
  /** Only populated for the small number of projects where a detailed final
   * report was available (e.g. Digitalt kompetenslyft) — most entries rely on
   * the summary description instead. */
  indicators?: ProjectIndicator[];
}

// ---------------------------------------------------------------------------
// Awarded projects — the reporting/compliance loop after money is granted.
// ---------------------------------------------------------------------------
export interface Commitment {
  indicator_sv: string;
  indicator_en: string;
  promisedValue: number;
  unit_sv: string;
  unit_en: string;
  currentValue: number;
  comment_sv: string;
  comment_en: string;
}

export interface AwardedProject {
  id: string;
  title_sv: string;
  title_en: string;
  callId: string;
  awardedAmountSEK: number;
  nextReportDueMonthsFromNow: number;
  commitments: Commitment[];
}

// ---------------------------------------------------------------------------
// Organisation's own internal process — a second, independent rule layer
// alongside the EU's own requirements. This is real (an example
// municipality's actual 4-phase EU-project process), but the specific
// internal roles below belong to one example organisation — every
// municipality structures its own internal support functions differently,
// so this is not a system default.
// ---------------------------------------------------------------------------
export interface OrgProcessDocument {
  title_sv: string;
  title_en: string;
}

export interface OrgProcessPhase {
  key: string;
  title_sv: string;
  title_en: string;
  desc_sv: string;
  desc_en: string;
  documents: OrgProcessDocument[];
  /** One example organisation's internal division of responsibility for this
   * phase — illustrative of how a municipality *could* structure it, not a
   * prescribed standard. */
  roleExample?: {
    organisationName: string;
    responsibilities: { role_sv: string; role_en: string; tasks_sv: string[]; tasks_en: string[] }[];
  };
  done: boolean;
}

// ---------------------------------------------------------------------------
// Organisation structure & people. Still part of the client-only demo (see
// README) — there is no real backend, authentication or invite delivery.
// Modelled here so /installningar can show a believable org chart and user
// directory instead of only a single-person profile form; a real deployment
// would back this with actual accounts and enforce it server-side.
// ---------------------------------------------------------------------------
export interface OrgUnit {
  id: string;
  name: string;
  parentId: string | null;
}

/** Organisation-level role — coarse access to the organisation's own data,
 * independent of any one project. */
export type OrgRoleKey = "org-admin" | "eu-coordinator" | "finance" | "read-only";

/** Project-level role — a person can hold a different one of these per
 * project (docs/DATA_MODEL.md's ambition: person → organisation → project →
 * role), mirroring how the EU Funding & Tenders Portal separates
 * organisation roles from project/contract roles. */
export type ProjectRoleKey =
  | "project-owner"
  | "project-lead"
  | "application-owner"
  | "economist"
  | "reporting-owner"
  | "project-member"
  | "read-only";

export interface ProjectRoleAssignment {
  projectId: string; // ProjectBankEntry.id
  role: ProjectRoleKey;
}

export interface DemoUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  title_sv: string;
  title_en: string;
  unitId: string | null; // OrgUnit.id
  orgRole: OrgRoleKey;
  status: "active" | "invited";
  /** True when login/profile fields are managed by an SSO provider rather
   * than editable in-app (illustrative only — no real SSO is wired up). */
  ssoManaged: boolean;
  projectRoles: ProjectRoleAssignment[];
}

// ---------------------------------------------------------------------------
// Project input from the intake form.
// ---------------------------------------------------------------------------
export interface ProjectInput {
  title: string;
  description: string;
  sector: Sector;
  budgetSEK: number;
  startYear: number;
  endYear: number;
  municipality: string;
  hasInternationalPartner: boolean;
}

// ---------------------------------------------------------------------------
// Matching / gap analysis / readiness output.
// ---------------------------------------------------------------------------
export interface RationaleLine {
  type: "positive" | "warning" | "neutral";
  category: GapCategory | "deadline" | "fundingProfile";
  text_sv: string;
  text_en: string;
  deltaIfFixed?: number;
}

export interface MatchResult {
  call: FundingCall;
  program: FundingProgram;
  score: number;
  stars: number;
  rationale: RationaleLine[];
  recommendation: "proceed" | "consider" | "low";
  estimatedFundingSEK: [number, number];
}

export interface GapAnalysis {
  strengths: RationaleLine[];
  gaps: RationaleLine[];
  currentScore: number;
  potentialScore: number;
}

export interface ReadinessBreakdown {
  overall: number;
  dimensions: {
    key: string;
    label_sv: string;
    label_en: string;
    score: number;
    /** This dimension's share of `overall`, 0-1 — carried on the dimension
     * itself (not a parallel array indexed by position) so reordering or
     * adding a dimension can't silently misalign weights and labels. */
    weight: number;
    action_sv?: string;
    action_en?: string;
  }[];
}

// ---------------------------------------------------------------------------
// "Similar projects" — the prototype's version of docs/DATA_MODEL.md §2.5's
// `SimilarProject`. Computed live from deterministic keyword overlap against
// the real FundedProject library, the same "no live LLM calls" approach used
// everywhere else in this app — not a real embedding search, but a genuine,
// explainable signal rather than a fabricated one.
// ---------------------------------------------------------------------------
export interface SimilarProjectResult {
  project: FundedProject;
  similarityPct: number; // 0-100
  sharedKeywords: string[];
}

// ---------------------------------------------------------------------------
// A named, immutable snapshot of an application draft — e.g. "Utkast",
// "Slutgiltig version" — the prototype's version of docs/DATA_MODEL.md
// §2.7's `ApplicationSection` history. Distinct from the continuously
// autosaved live draft (see useApplication): a saved version's text doesn't
// change later even if the underlying AI suggestion or project data does.
// ---------------------------------------------------------------------------
export interface ApplicationVersion {
  id: string;
  name: string;
  createdAt: string; // ISO
  /** Every section's fully resolved text at save time (project-logic row
   * label -> text), not just the user's overrides. */
  sectionDrafts: Record<string, string>;
}

export interface SectionCoachResult {
  relevance: number; // 0-10
  impact: number;
  evidence: number;
  feedback_sv: string;
  feedback_en: string;
  suggestion_sv: string;
  suggestion_en: string;
}

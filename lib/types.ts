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
export type ProjectStatus =
  | "idea"
  | "in-development"
  | "applying"
  | "awarded"
  | "delivering"
  | "closed";

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
// Reference projects — previously awarded projects used to teach the system
// patterns of what gets funded ("Lär av vinnarna"). This is REAL data:
// Stockholms stads faktiska EU-finansierade projekt 2014-2027, extracted
// from the municipality's own "Projekt med beviljade medel" documentation.
// ---------------------------------------------------------------------------
export interface ReferenceProjectIndicator {
  label_sv: string;
  label_en: string;
  target: number;
  actual: number;
  unit_sv: string;
  unit_en: string;
}

export interface ReferenceProject {
  id: string;
  title: string;
  url?: string;
  organisation: string;
  theme_sv: string;
  theme_en: string;
  programId: string;
  fundName: string; // the original, un-normalized name of the fund/programme
  /** Which of Stockholm's own two published EU programme periods this project
   * belongs to — a real distinction in the source data, not an invented one. */
  period: "2021-2027" | "2014-2020";
  periodLabel: string; // raw project period text, e.g. "2023-01-01 till 2028-01-01"
  role: "owner" | "partner";
  description_sv: string;
  totalBudgetSEK: number | null;
  euFundingSEK: number | null;
  contactEmail?: string;
  /** Only populated for the small number of projects where a detailed final
   * report was available (e.g. Digitalt kompetenslyft) — most entries rely on
   * the summary description instead. */
  indicators?: ReferenceProjectIndicator[];
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
// alongside the EU's own requirements. This is real (Stockholms stads
// faktiska 5-fas EU-projektprocess), but the specific internal roles below
// belong to one example organisation — every municipality structures its own
// internal support functions differently, so this is not a system default.
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
  category: GapCategory | "deadline";
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
    action_sv?: string;
    action_en?: string;
  }[];
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

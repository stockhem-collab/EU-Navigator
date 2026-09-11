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
// patterns of what gets funded. Illustrative example data until the
// municipality's real 20-30 awarded projects are ingested.
// ---------------------------------------------------------------------------
export interface ReferenceProject {
  id: string;
  programId: string;
  organisation: string;
  area_sv: string;
  area_en: string;
  problem_sv: string;
  problem_en: string;
  goal_sv: string;
  goal_en: string;
  budgetSEK: number;
  fundingRate: number; // 0-1
  partners: string[];
  indicators_sv: string[];
  indicators_en: string[];
  innovationLevel_sv: string;
  innovationLevel_en: string;
  successFactors: (
    | "quantified-impact"
    | "scalability"
    | "multi-org"
    | "pilot-demo"
    | "strong-goal-alignment"
  )[];
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
// Organisation's own internal process — a second, independent rule layer.
// ---------------------------------------------------------------------------
export interface OrgProcessStep {
  title_sv: string;
  title_en: string;
  desc_sv: string;
  desc_en: string;
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

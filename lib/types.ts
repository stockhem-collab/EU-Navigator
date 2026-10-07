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

export type GapCategory =
  | "sector"
  | "keywords"
  | "tags"
  | "budget"
  | "partnership"
  | "duration"
  | "eligibility"
  | "geography"
  | "activity"
  | "targetGroup"
  | "timing";

// ---------------------------------------------------------------------------
// Matching vocabulary — the structured facts about a project (and the calls
// it's matched against) that decide whether a call is even open to it, or
// what kind of work it funds, beyond thematic fit. Labels live in
// lib/data/matchingVocabulary.ts.
// ---------------------------------------------------------------------------

/** What kind of work a project mainly is — the single biggest thing that
 * separates EU programmes from each other (ERDF funds investment, ESF+
 * funds people/skills, Horizon funds research), independent of sector. */
export type ActivityType = "investment" | "competence" | "research" | "pilot" | "cooperation";

/** Who a project's activities are aimed at. Only people-focused calls
 * (ESF+, AMIF, Erasmus+ …) define these; for other calls it's ignored. */
export type TargetGroup = "pupils" | "young" | "unemployed" | "newly-arrived" | "employees" | "elderly" | "disabilities";

/** How far a project's partnership reaches. "international" = partners in
 * at least one other country (2 countries in total), "consortium" = at
 * least three countries — the usual Horizon Europe / Erasmus+ threshold. */
export type PartnerLevel = "none" | "national" | "international" | "consortium";

/** Swedish counties (län) — where the project is carried out. Regional
 * programmes (Interreg's cross-border areas, ERDF's regional programmes)
 * are only open to projects inside their own programme area. */
export type SwedishRegion =
  | "blekinge"
  | "dalarna"
  | "gotland"
  | "gavleborg"
  | "halland"
  | "jamtland"
  | "jonkoping"
  | "kalmar"
  | "kronoberg"
  | "norrbotten"
  | "skane"
  | "stockholm"
  | "sodermanland"
  | "uppsala"
  | "varmland"
  | "vasterbotten"
  | "vasternorrland"
  | "vastmanland"
  | "vastra-gotaland"
  | "orebro"
  | "ostergotland";

// ---------------------------------------------------------------------------
// Tags — a fixed, curated vocabulary shared between funding calls and
// projects (lib/data/tags.ts), the structured complement to the free-text
// keyword matching above. A call's tags are chosen once, by hand or via a
// reviewed rule-based suggestion (see extractionSource on FundingCall,
// same review gate); a project's tags are picked by the user or accepted
// from a suggestion (lib/matching/tagSuggestions.ts) — never inferred
// silently. Catches synonym/paraphrase matches that exact-word keyword
// overlap misses, without any AI call at match time.
// ---------------------------------------------------------------------------
export interface Tag {
  id: string;
  label_sv: string;
  label_en: string;
  /** Optional grouping under the existing Sector taxonomy, for browsability
   * in the tag picker — not used in scoring. */
  sector?: Sector;
}

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

/** Structured applicant-eligibility categories — the typed alternative to
 * parsing eligibleApplicants_sv/en free text, per docs/DATA_MODEL.md §1.5's
 * "hybrid approach" (real, structured columns for the checks that are
 * genuinely common shapes, free text for the rest). Mirrors
 * Organisation.organisation_type in that doc's §1.9. */
export type ApplicantType =
  | "municipality"
  | "region"
  | "municipal-company"
  | "university"
  | "training-provider"
  | "sme"
  | "large-enterprise"
  | "ngo"
  | "national-authority"
  | "research-institute";

export interface FundingCall {
  id: string;
  programId: string;
  title_sv: string;
  title_en: string;
  status: "open" | "upcoming";
  /** Relative deadline — what the illustrative seed calls use. Read it via
   * callDeadlineMonths(), which prefers deadlineDate when set. */
  deadlineMonthsFromNow: number;
  /** The real application deadline (YYYY-MM-DD), for imported calls. A
   * relative "months from now" goes stale the day after import; this
   * doesn't. */
  deadlineDate?: string;
  budgetTotalSEK: number;
  minGrantSEK: number;
  maxGrantSEK: number;
  requiresPartnership: boolean;
  eligibleApplicants_sv: string;
  eligibleApplicants_en: string;
  /** The structured reading of eligibleApplicants_sv/en, when the free text
   * maps cleanly onto one or more ApplicantType categories. Undefined =
   * not broken out yet — the free text is still the source of truth, this
   * is additive. Datacenter tracks the split so it's visible how much of
   * the call catalogue still relies on free text for this check. */
  applicantTypes?: ApplicantType[];
  /** The kinds of work this call funds (see ActivityType). Undefined = not
   * classified; scoring treats it as unknown rather than a mismatch. */
  activityTypes?: ActivityType[];
  /** The people this call's activities must reach, for people-focused
   * calls. Undefined = the call isn't aimed at a specific target group. */
  targetGroups?: TargetGroup[];
  /** The share of eligible costs this call's grant covers (0–1), when the
   * call states it. Undefined = the programme's typicalCoFinancingRate. */
  coFinancingRate?: number;
  /** Minimum number of countries in the partnership, counting the
   * applicant's own, when requiresPartnership is set (e.g. 3 for a Horizon
   * Europe consortium). Undefined with requiresPartnership = 2. */
  minPartnerCountries?: number;
  /** The Swedish counties inside this call's programme area, for calls
   * restricted to a region. Undefined = open to projects anywhere. */
  eligibleRegions?: SwedishRegion[];
  priorities_sv: string[];
  priorities_en: string[];
  extraKeywords: string[]; // in addition to the programme's own keywords
  /** This call's tags from the curated vocabulary (lib/data/tags.ts) — the
   * primary thematic-fit signal in scoreMatch, ahead of the free-text
   * keyword overlap above. */
  tags: string[];
  evaluationCriteria: EvaluationCriterion[];
  documents: FundingDocument[];
  /** This call's own application-form structure, when known — see
   * ApplicationTemplateSection. Undefined = no call-specific structure on
   * file; the workspace falls back to the generic project-logic template. */
  applicationTemplate?: ApplicationTemplateSection[];
  /** This call's post-award reporting obligation, when known — see
   * ReportingRequirement (defined further down, alongside Grant).
   * Undefined = not on file yet. */
  reportingRequirements?: ReportingRequirement;
  /** How this call's structured fields (evaluationCriteria,
   * applicationTemplate, reportingRequirements, applicantTypes) got into
   * the system. Every seeded call here is "manual" (hand-authored from the
   * real call documents). "assisted-import" marks a call added through
   * Datacenter's utlysningsimport tool: its fields started as a rule-based
   * reading of pasted call text and were reviewed and edited by a person
   * before saving — never auto-published from the extraction alone. */
  extractionSource?: "manual" | "assisted-import";
  /** ISO date the call was added via the import tool. Undefined for every
   * hand-authored seed call. */
  importedAt?: string;
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
/** The project's own lifecycle, independent of any one application —
 * docs/DATA_MODEL.md §2.2's `CustomerProject.status`. Where each
 * application stands (draft, submitted, awarded, rejected…) lives on the
 * application itself (ApplicationStatus); a project with several
 * applications is simply "searching for funding" until one is awarded,
 * then "funded", "running" and "completed" as its grant's reporting
 * progresses. See projectStatusFromApplications. */
export type ProjectStatus = "idea" | "assessing" | "funding-search" | "funded" | "running" | "completed";

/** The lifecycle in its natural, logical order — a single source of truth
 * for every "projects per status" breakdown. */
export const PROJECT_STATUS_ORDER: ProjectStatus[] = [
  "idea",
  "assessing",
  "funding-search",
  "funded",
  "running",
  "completed",
];

/** Reads a stored project status, mapping the application-level statuses
 * projects used to carry before applications had their own status (still
 * present in older browser-stored edits) onto the lifecycle. */
export function normalizeProjectStatus(value: unknown): ProjectStatus {
  if (PROJECT_STATUS_ORDER.includes(value as ProjectStatus)) return value as ProjectStatus;
  if (value === "approved") return "funded";
  if (value === "application" || value === "submitted" || value === "rejected") return "funding-search";
  return "idea";
}

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
  /** Tags from the curated vocabulary (lib/data/tags.ts), picked by the
   * user or accepted from a suggestion. Undefined/empty = not tagged yet —
   * scoreMatch degrades gracefully, just without this signal's points. */
  tags?: string[];
  /** OrgUnit ids this project has been explicitly shared with, in addition
   * to whoever already has a ProjectRoleAssignment on it — lets it surface
   * under "Mina projekt" for people outside its own role assignments,
   * scoped to their organisation (the root unit) or a specific department.
   * Undefined/empty = not shared beyond its own assignees. */
  sharedWithUnitIds?: string[];
  /** The matching fields a project is described with in the intake form
   * (see ProjectInput) — stored so a saved or imported project is matched
   * on the same terms as one just described. All optional: unset is
   * scored as "unknown", never as a mismatch. */
  applicantType?: ApplicantType;
  activityType?: ActivityType;
  secondarySectors?: Sector[];
  targetGroups?: TargetGroup[];
  region?: SwedishRegion;
  /** Undefined = derived from hasInternationalPartner. */
  partnerLevel?: PartnerLevel;
  /** The EU grant the project plans to apply for, when known. */
  requestedGrantSEK?: number;
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
// would call `Grant`/`Commitment` for the customer's own post-award
// reporting loop — that half stays a separate, simpler `Grant` type
// below, modelling the reporting *cycle* (ReportingRequirement +
// ReportingEvent) rather than the doc's full `Application`/`Report` chain,
// which would need a real per-application record this prototype doesn't
// have yet (see useApplication's own note on that).
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
// Every fund requires the grantee to report back against what the
// application promised, on a schedule and with evidence that varies by
// fund (ESF+'s frequent participant reporting looks nothing like LIFE's
// half-yearly progress reports) — then a heavier final report closes the
// project out. Modelled as two halves, mirroring docs/DATA_MODEL.md's
// future `ReportingRequirementDefinition` (§1.7) / `Report` (§2.10) split:
// the *obligation* a call imposes (ReportingRequirement, reference data on
// FundingCall) versus the *instances* of actually reporting against it
// (ReportingEvent, per Grant).
// ---------------------------------------------------------------------------

export type ReportingPeriodicity = "quarterly" | "biannual" | "annual";

/** The reporting obligation a call imposes on whoever is awarded funding
 * under it — reference data that lives on the call, not on any one
 * project. Undefined on a FundingCall = not on file yet (most calls in
 * this demo have no awarded project to report against). */
export interface ReportingRequirement {
  periodicity: ReportingPeriodicity;
  interimReportsRequired: number;
  /** SEK threshold above which an independent auditor's certificate must
   * accompany the final report — null if this call never requires one. */
  requiresAuditAboveSEK: number | null;
  interimDocuments_sv: string[];
  interimDocuments_en: string[];
  finalReportDocuments_sv: string[];
  finalReportDocuments_en: string[];
}

/** What the application promised to deliver for one indicator — the
 * baseline definition only. Actual outturn is reported more than once over
 * a project's life (interim reports, then a final report), so it lives on
 * ReportingEvent below rather than as a single value here. */
export interface Commitment {
  indicator_sv: string;
  indicator_en: string;
  promisedValue: number;
  unit_sv: string;
  unit_en: string;
}

export type ReportingEventType = "interim" | "final" | "sustainability";
export type ReportingEventStatus = "upcoming" | "submitted" | "approved" | "revision-requested";

/** A reporting event's economic summary — deliberately narrow (spend for
 * this period, compared against the project's total awarded amount)
 * rather than a fund-specific cost-category breakdown (personnel,
 * overhead, travel, …) that varies by fund and that this app has no real
 * source to populate honestly. */
export interface FinancialOutcome {
  spentThisPeriodSEK: number;
}

/** The outturn reported for one Commitment indicator as of one specific
 * ReportingEvent, keyed by indicator_sv — the same stable key used on
 * Commitment (no seeded project has two commitments sharing a Swedish
 * indicator name). */
export interface ReportingOutcome {
  indicator_sv: string;
  value: number;
}

/** One point in a call's reporting cycle for an awarded project — an
 * interim report or the closing final report. The instance of an actual
 * submission, as opposed to ReportingRequirement above, which is the
 * definition of the obligation it satisfies. */
export interface ReportingEvent {
  id: string;
  type: ReportingEventType;
  periodLabel_sv: string;
  periodLabel_en: string;
  /** Same "relative to today" convention as FundingCall's own
   * deadlineMonthsFromNow — negative once the deadline has passed. */
  deadlineMonthsFromNow: number;
  /** The real due date (YYYY-MM-DD), for reports scheduled when a grant is
   * registered — deadlineMonthsFromNow is then kept in step with it (see
   * withCurrentDeadline). Seed reports only have the relative form. */
  deadlineDate?: string;
  status: ReportingEventStatus;
  /** Populated once status is "submitted" or later; empty for "upcoming". */
  outcomes: ReportingOutcome[];
  note_sv?: string;
  note_en?: string;
  /** This event's economic summary, when reported — undefined for an
   * "upcoming" event, or for an already-submitted seed event whose real
   * figures aren't on file. */
  financials?: FinancialOutcome;
}

/** A grant ("beviljat stöd"): the funding decision on an awarded
 * application, with its amount, commitments and reporting plan. It belongs
 * to a project (projectBankEntryId) and, when created from one, to the
 * application that won it (applicationId) — so the chain Projekt →
 * Ansökan → Beviljat stöd → Rapporter is unbroken. docs/DATA_MODEL.md
 * calls the persisted form `FundedProject`. */
export interface Grant {
  id: string;
  title_sv: string;
  title_en: string;
  callId: string;
  /** The project this grant funds, when known. Undefined where the link
   * was never captured (older seed data). */
  projectBankEntryId?: string;
  /** The application (ApplicationRecord.id) this grant was awarded on.
   * Undefined for seed grants and for ones created before applications
   * had their own records. */
  applicationId?: string;
  awardedAmountSEK: number;
  /** The budget the application planned with, when the grant was
   * registered from one — the follow-up compares what's spent with it. */
  plannedBudget?: {
    totalBudgetSEK: number;
    eligibleBudgetSEK: number;
    ownFinancingSEK: number;
  };
  commitments: Commitment[];
  /** Chronological — interim reports followed by the closing final report.
   * A "sustainability" event, added on demand once the final report is in,
   * is a later, separate long-tail follow-up rather than part of this
   * core cycle. */
  reportingEvents: ReportingEvent[];
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
  /** The unit's own PIC, when it is registered separately in the EU
   * Funding & Tenders Portal (e.g. a school with its own Erasmus+ PIC). */
  pic?: string;
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
  /** See ProjectBankEntry.tags. */
  tags?: string[];
  /** The fields below were added so matching can check eligibility and
   * programme fit, not only theme. All optional: a project that doesn't
   * state them (e.g. one bridged from the Projektbank) is scored as
   * "unknown" on that signal, never as a mismatch. */
  /** The applying organisation's type — prefilled from the organisation
   * profile (Inställningar → Organisation) and checked against
   * FundingCall.applicantTypes. */
  applicantType?: ApplicantType;
  activityType?: ActivityType;
  /** Further sectors the project touches besides `sector`. */
  secondarySectors?: Sector[];
  targetGroups?: TargetGroup[];
  /** The EU grant being applied for — as opposed to budgetSEK, the
   * project's total cost. Undefined = estimated from budgetSEK and the
   * programme's typical co-financing rate. */
  requestedGrantSEK?: number;
  region?: SwedishRegion;
  /** Undefined = derived from hasInternationalPartner. */
  partnerLevel?: PartnerLevel;
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
  /** The application's own amounts at save time (see ApplicationBudget).
   * Absent on versions saved before applications had amounts of their own. */
  budget?: { eligibleBudgetSEK?: number; requestedGrantSEK?: number };
}

/** Where one application stands — docs/DATA_MODEL.md §2.6. */
export type ApplicationStatus = "draft" | "submitted" | "under-review" | "awarded" | "rejected" | "withdrawn";

export const APPLICATION_STATUS_ORDER: ApplicationStatus[] = [
  "draft",
  "submitted",
  "under-review",
  "awarded",
  "rejected",
  "withdrawn",
];

/** One application from a Projektbank project to one call — the
 * client-only stand-in for docs/DATA_MODEL.md §2.6's `Application`. A
 * project can have any number of these: to different calls, and more than
 * one to the same call (a new round after a rejection). The draft text and
 * saved versions live under this record's id (see useApplication). */
export interface ApplicationRecord {
  id: string;
  projectId: string;
  callId: string;
  status: ApplicationStatus;
  createdAt: string; // ISO
  updatedAt: string; // ISO
  /** Set the first time the status moves past "draft". */
  submittedAt?: string;
  /** The Grant created when this application was marked awarded. */
  awardedProjectId?: string;
}

/** How much signal the deterministic heuristics actually had to go on —
 * "low" is the natural hand-off point to a real, human-in-the-loop AI
 * review, rather than trusting a generic heuristic verdict on a
 * description too short or unpatterned for regex to say anything specific
 * about. See ApplicationWorkspace's coach panel. */
export type CoachConfidence = "low" | "medium" | "high";

export interface SectionCoachResult {
  relevance: number; // 0-10
  impact: number;
  evidence: number;
  confidence: CoachConfidence;
  feedback_sv: string;
  feedback_en: string;
  suggestion_sv: string;
  suggestion_en: string;
}

// ---------------------------------------------------------------------------
// Attachments — real supporting documents (budget files, decision letters,
// partnership agreements, a report's evidence, …) saved against a specific
// project or reporting event during the process, as distinct from the docx
// exports the system itself generates. Client-only demo, so a file's bytes
// live as a data URL in localStorage rather than on a real document server —
// see useAttachments for the size cap that keeps that workable.
// ---------------------------------------------------------------------------
export interface Attachment {
  id: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedAt: string; // ISO
  dataUrl: string;
}

// ---------------------------------------------------------------------------
// Ad-hoc tasks attached to a Projektbank entry — "what's actually left to do
// on this, right now". See useProjectTasks.
// ---------------------------------------------------------------------------
export interface ProjectTask {
  id: string;
  text: string;
  done: boolean;
  dueDate?: string; // ISO date, optional
  createdAt: string; // ISO
}

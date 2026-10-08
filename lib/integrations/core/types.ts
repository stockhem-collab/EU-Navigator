// Normalised reference data written by the import scripts in scripts/import/.
// Follows docs/DATA_MODEL.md §1.8–1.10 (FundedProject, Organisation,
// ProjectPartner), in the repo's camelCase. These are deliberately separate
// from the app's FundedProject in lib/types.ts, which is SEK-only and has no
// partners; an adapter maps between the two when the app starts reading
// generated data.

export type SourceSystem = "kohesio" | "keep-eu" | "cordis" | "esf";

export type CurrencyCode = "EUR" | "SEK";

export type ProgrammePeriod = "2021-2027" | "2014-2020";

export type FundedProjectStatus = "signed" | "ongoing" | "closed" | "terminated";

/** DATA_MODEL.md §1.9. Only set when the source itself states the type. */
export type OrganisationType =
  | "municipality"
  | "region"
  | "university"
  | "sme"
  | "large-enterprise"
  | "ngo"
  | "national-authority"
  | "research-institute";

/** DATA_MODEL.md §1.10. The role in one project, kept apart from the type. */
export type PartnerRole = "coordinator" | "partner" | "associated-partner";

/** An amount in the currency the source published it in. */
export interface Money {
  amount: number;
  currency: CurrencyCode;
}

export interface ImportedFundedProject {
  /** `<source>:<external id>`, unique across all generated files. */
  id: string;
  sourceSystem: SourceSystem;
  externalProjectId: string;
  /** Other identifiers the source carries, e.g. the ESF case number. */
  externalIds?: Record<string, string>;
  /** Matching id in lib/data/fundingPrograms.ts, when one exists. */
  programId: string | null;
  /** The source's own fund/programme name, un-normalised. */
  programmeName: string;
  programmeCode?: string | null;
  period: ProgrammePeriod | null;
  title: string;
  titleEn?: string | null;
  acronym?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  expectedResults?: string | null;
  actualResults?: string | null;
  startDate: string | null;
  endDate: string | null;
  totalBudget: Money | null;
  euContribution: Money | null;
  /** 0–1. */
  coFinancingRate: number | null;
  status: FundedProjectStatus | null;
  /** ISO 3166-1 alpha-2 of the coordinator. */
  country: string | null;
  sourceUrl: string | null;
  /** Free-form source facts worth keeping (themes, topics, mission flags). */
  tags?: string[];
  /** The cohesion-policy category of intervention (Kohesio, ESF+), when the
   * source gives it. Codes are only unique within a period: 2014–2020 uses
   * 1–123, 2021–2027 uses 1–182 with other meanings. */
  interventionCategory?: { code: string; label: string | null } | null;
}

export interface ImportedOrganisation {
  /** `<source>:<external id>`. */
  id: string;
  sourceSystem: SourceSystem;
  externalId: string;
  name: string;
  /** Every name the source used for this id (Kohesio has several). */
  sourceNames?: string[];
  organisationType: OrganisationType | null;
  /** The source's own type/category value, verbatim. */
  sourceOrganisationType?: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  vatNumber: string | null;
  picNumber: string | null;
  /** Swedish organisationsnummer, 10 digits without dash. */
  organisationNumber: string | null;
  website: string | null;
}

export interface ImportedProjectPartner {
  fundedProjectId: string;
  organisationId: string;
  role: PartnerRole;
  /** The source's own role value, verbatim. */
  sourceRole: string;
  /** The name the organisation was listed under in this project. */
  sourceName: string;
  euContribution: Money | null;
  totalCost: Money | null;
  country: string | null;
}

export interface ImportFileInfo {
  name: string;
  bytes: number;
}

export interface ImportReport {
  source: SourceSystem;
  inputFiles: ImportFileInfo[];
  rowsRead: Record<string, number>;
  written: { projects: number; organisations: number; partners: number };
  skipped: Record<string, number>;
  outputFile: ImportFileInfo;
}

export interface GeneratedDataset {
  source: SourceSystem;
  generatedAt: string;
  projects: ImportedFundedProject[];
  organisations: ImportedOrganisation[];
  partners: ImportedProjectPartner[];
  /** Source-specific extra output, e.g. ESF rows matched to Kohesio. */
  extra?: Record<string, unknown>;
}

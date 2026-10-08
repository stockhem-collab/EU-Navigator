// The app's read model of the imported reference data (Kohesio, keep.eu,
// CORDIS, ESF-rådets projektbank): a slimmed-down copy of the generated
// import files, built by `npm run build:reference-index` into
// data/app/referensdata.json.gz and read on the server only. The full
// generated files (lib/data/generated/, ~70 MB) stay out of the repo and
// out of the browser.

import type {
  Money,
  OrganisationType,
  PartnerRole,
  ProgrammePeriod,
  SourceSystem,
} from "@/lib/integrations/core/types";
import type { Sector } from "@/lib/types";
import type { ThemeMatch } from "./themes";

export type { Money, SourceSystem };

export interface IndexProject {
  id: string;
  source: SourceSystem;
  programId: string | null;
  programme: string;
  period: ProgrammePeriod | null;
  title: string;
  titleEn?: string | null;
  acronym?: string | null;
  /** The start of the source's description, in the source's language. */
  summary?: string | null;
  /** The English description, where the source has one besides. */
  summaryEn?: string | null;
  startDate: string | null;
  endDate: string | null;
  eu: Money | null;
  total: Money | null;
  /** ISO 3166-1 alpha-2 of the coordinator. */
  country: string | null;
  url: string | null;
  tags?: string[];
  category?: { code: string; label: string | null } | null;
}

export interface IndexOrganisation {
  id: string;
  name: string;
  type: OrganisationType | null;
  country: string | null;
}

/** [project index, organisation index, role]. */
export type IndexPartner = [number, number, PartnerRole];

export interface ReferenceIndex {
  generatedAt: string;
  sources: { source: SourceSystem; generatedAt: string; projects: number }[];
  projects: IndexProject[];
  organisations: IndexOrganisation[];
  partners: IndexPartner[];
  /** lib/data/generated/uppsala-history.json, as written. */
  history: unknown;
  /** lib/data/generated/peers.json, as written. */
  peers: unknown;
}

// ---------------------------------------------------------------------------
// What the API routes send to the browser.
// ---------------------------------------------------------------------------

/** An amount in kronor, with the amount the source published when it was
 * in another currency (shown as a tooltip). */
export interface SekAmount {
  sek: number;
  original: Money;
  /** The EUR/SEK yearly average used, when converted. */
  rate?: number;
  rateYear?: number;
}

export interface ReferenceProjectCard {
  id: string;
  source: SourceSystem;
  programId: string | null;
  programme: string;
  period: ProgrammePeriod | null;
  title: string;
  titleEn: string | null;
  acronym: string | null;
  summary: string | null;
  summaryEn: string | null;
  startYear: number | null;
  startDate: string | null;
  endDate: string | null;
  country: string | null;
  url: string | null;
  euContribution: SekAmount | null;
  totalBudget: SekAmount | null;
  themes: ThemeMatch[];
  partnerCount: number;
}

export interface ReferenceListResponse {
  total: number;
  page: number;
  pageSize: number;
  projects: ReferenceProjectCard[];
  options: ReferenceFilterOptions;
}

export interface ReferenceFilterOptions {
  sources: { id: SourceSystem; count: number }[];
  programs: { id: string; label: string; count: number }[];
  countries: { id: string; count: number }[];
  years: number[];
}

/** The fields of a project idea the similarity search reads — what the
 * browser sends, since ideas live only in the browser's localStorage. */
export interface IdeaInput {
  title: string;
  description: string;
  sector: Sector;
  secondarySectors?: Sector[];
  tags?: string[];
  /** The idea's own organisation, left out of the partner suggestions. */
  ownOrganisation?: { name?: string | null; orgNumber?: string | null; pic?: string | null; vatNumber?: string | null };
}

export interface SimilarityReason {
  kind: "theme" | "keyword";
  text_sv: string;
  text_en: string;
}

export interface SimilarImportedProject {
  project: ReferenceProjectCard;
  similarityPct: number;
  reasons: SimilarityReason[];
}

export interface PartnerSuggestion {
  organisationId: string;
  name: string;
  country: string | null;
  type: OrganisationType | null;
  /** In how many of the similar projects the organisation took part. */
  projectCount: number;
  coordinatorCount: number;
  partnerCount: number;
  associatedCount: number;
  projects: { id: string; title: string; role: PartnerRole; source: SourceSystem }[];
}

export interface SimilarResponse {
  similar: SimilarImportedProject[];
  partners: PartnerSuggestion[];
  /** How many imported projects were compared. */
  compared: number;
}

export interface AmountStats {
  programId: string;
  /** "program-theme" = same programme and theme; "program" = the theme had
   * too few projects, so the whole programme; "none" = no imported
   * projects in the programme. */
  basis: "program-theme" | "program" | "none";
  sector: Sector;
  count: number;
  /** Kronor, EU contribution per project. */
  low: number;
  median: number;
  high: number;
  /** The same figures in euro. */
  lowEur: number;
  medianEur: number;
  highEur: number;
  /** "p10-p90" when there were enough projects, otherwise "min-max". */
  spread: "p10-p90" | "min-max";
  /** Which programmes the figures come from (a predecessor programme is
   * included when the current one has too few projects). */
  programIds: string[];
}

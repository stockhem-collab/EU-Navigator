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

export interface FundingProgram {
  id: string;
  name: string;
  shortName: string;
  logoLetter: string;
  name_sv: string;
  description_sv: string;
  description_en: string;
  sectors: Sector[];
  keywords: string[];
  minBudgetSEK: number;
  maxBudgetSEK: number;
  requiresPartnership: boolean;
  geographicScope: "sweden" | "eu-wide" | "cross-border-region";
  typicalCoFinancingRate: number; // 0-1, share EU typically covers
  nextDeadlineMonthsFromNow: number;
  typicalDurationYears: [number, number];
}

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

export interface RationaleLine {
  type: "positive" | "warning" | "neutral";
  text_sv: string;
  text_en: string;
}

export interface MatchResult {
  program: FundingProgram;
  score: number; // 0-100
  stars: number; // 1-5
  rationale: RationaleLine[];
  recommendation: "proceed" | "consider" | "low";
  estimatedFundingSEK: [number, number];
}

import {
  EvaluationCriterion,
  FundingCall,
  FundingProgram,
  MatchResult,
  ProjectInput,
  RationaleLine,
} from "@/lib/types";
import { findProgram } from "@/lib/data/fundingPrograms";
import { tagLabel } from "@/lib/data/tags";
import { applicantTypeLabel, callDeadlineMonths } from "@/lib/data/fundingCalls";
import {
  activityTypeShortLabel,
  partnerCountryCount,
  regionLabel,
  targetGroupLabel,
} from "@/lib/data/matchingVocabulary";
import type { FundingProfile } from "@/lib/hooks/useFundingProfile";

function normalizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-zåäö0-9\s]/gi, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function keywordOverlapCount(project: ProjectInput, program: FundingProgram, call: FundingCall): string[] {
  const projectWords = new Set([
    ...normalizeWords(project.title),
    ...normalizeWords(project.description),
  ]);
  const allKeywords = [...program.keywords, ...call.extraKeywords];
  return allKeywords.filter((kw) => kw.split(/\s+/).every((part) => projectWords.has(part.toLowerCase())));
}

function budgetFit(requestedGrantSEK: number, call: FundingCall): "in-range" | "partial" | "off" {
  const { minGrantSEK, maxGrantSEK } = call;
  if (requestedGrantSEK >= minGrantSEK && requestedGrantSEK <= maxGrantSEK) return "in-range";
  const lower = minGrantSEK * 0.4;
  const upper = maxGrantSEK * 2;
  if (requestedGrantSEK >= lower && requestedGrantSEK <= upper) return "partial";
  return "off";
}

function durationFit(project: ProjectInput, program: FundingProgram): boolean {
  const years = project.endYear - project.startYear;
  const [min, max] = program.typicalDurationYears;
  return years >= min - 1 && years <= max + 1;
}

export function fmtMSEK(n: number): string {
  // One decimal below 10 mnkr, so e.g. a 0.5 mnkr minimum grant doesn't
  // round to "1" (or "0").
  return (n / 1_000_000).toLocaleString("sv-SE", { maximumFractionDigits: n < 10_000_000 ? 1 : 0 });
}

// scoreMatch groups its signals into two buckets — "thematic fit" (sector,
// activity type, tags, keywords, target group) and "implementation fit"
// (budget, partnership, duration, timing) — and blends them 60/40 by
// default. Eligibility (applicant type, programme area) sits outside both:
// failing it caps the score rather than subtracting points. But calls carry their own
// real evaluationCriteria (e.g. Relevance 30, Impact 30, Quality 20,
// Implementation 20, extracted from real call documents), which is shown to
// the user as if it's how the application gets judged. Ignoring it and
// always applying the fixed 60/40 split would mean the displayed criteria
// and the actual score are unrelated to each other. Instead, a call whose
// own criteria weight "quality"/"implementation" more heavily shifts more of
// the match score onto the implementation bucket, and vice versa — an
// honest (if still heuristic) use of real data, not a fabricated per-
// criterion mapping we have no way to actually measure.
const RELEVANCE_CRITERION_PATTERN = /relevan|priorit|impact|effekt|alignment|koppling/i;
const IMPLEMENTATION_CRITERION_PATTERN =
  /kvalit|quality|genomför|implement|resurs|budget|kapacitet|organisat|efficien|effektivitet/i;

interface CriteriaWeights {
  thematicPct: number; // 0-1, share of the 100 match points from thematic fit
  implementationPct: number; // 0-1, share from budget/partnership/duration fit
}

// The nominal split (sector 20 + activity 10 + tags 20 + keywords/target
// group 10 = 60, budget 20 + partnership 15 + duration 5 = 40) — used whenever a call's
// criteria names don't say anything the classifier recognises, so scoring
// never silently changes for a call with generic/unlabelled criteria.
const DEFAULT_WEIGHTS: CriteriaWeights = { thematicPct: 0.6, implementationPct: 0.4 };

function criteriaWeights(criteria: EvaluationCriterion[]): CriteriaWeights {
  let relevancePoints = 0;
  let implementationPoints = 0;
  for (const c of criteria) {
    if (RELEVANCE_CRITERION_PATTERN.test(c.name_sv) || RELEVANCE_CRITERION_PATTERN.test(c.name_en)) {
      relevancePoints += c.maxPoints;
    } else if (IMPLEMENTATION_CRITERION_PATTERN.test(c.name_sv) || IMPLEMENTATION_CRITERION_PATTERN.test(c.name_en)) {
      implementationPoints += c.maxPoints;
    }
  }
  const total = relevancePoints + implementationPoints;
  if (total === 0) return DEFAULT_WEIGHTS;
  return { thematicPct: relevancePoints / total, implementationPct: implementationPoints / total };
}

// How long after a call's deadline a funding decision typically arrives —
// costs incurred before the decision are usually not eligible, so a project
// planned to start before then is a timing problem, not just a detail.
const DECISION_LAG_MONTHS = 6;

// Cap on the score of a call the project is formally ineligible for (wrong
// applicant type, outside the programme area, deadline passed). Kept above 0 so the card
// still sorts sensibly among the other low matches, but always well below
// the "consider" threshold — thematic fit can't outweigh eligibility.
const INELIGIBLE_SCORE_CAP = 15;

const THEMATIC_CATEGORIES: RationaleLine["category"][] = ["sector", "keywords", "tags", "activity", "targetGroup"];

export function scoreMatch(
  project: ProjectInput,
  call: FundingCall,
  program: FundingProgram,
  fundingProfile?: FundingProfile,
  now: Date = new Date()
): MatchResult {
  const rationale: RationaleLine[] = [];
  let thematicScore = 0; // nominal max 60
  let implementationScore = 0; // nominal max 40 (can go negative on a missing required partner / bad timing)

  // --- Eligibility gates -------------------------------------------------
  // Checked first and listed first: if the organisation can't apply at
  // all, nothing else on the card matters. These don't add points; failing
  // one caps the final score (INELIGIBLE_SCORE_CAP) instead.
  const ineligibility: RationaleLine[] = [];

  if (call.applicantTypes && call.applicantTypes.length > 0 && project.applicantType) {
    const allowed_sv = call.applicantTypes.map((t) => applicantTypeLabel(t, "sv").toLowerCase()).join(", ");
    const allowed_en = call.applicantTypes.map((t) => applicantTypeLabel(t, "en").toLowerCase()).join(", ");
    if (call.applicantTypes.includes(project.applicantType)) {
      rationale.push({
        type: "positive",
        category: "eligibility",
        text_sv: `Er organisationstyp (${applicantTypeLabel(project.applicantType, "sv").toLowerCase()}) är behörig sökande`,
        text_en: `Your organisation type (${applicantTypeLabel(project.applicantType, "en").toLowerCase()}) is an eligible applicant`,
      });
    } else {
      ineligibility.push({
        type: "warning",
        category: "eligibility",
        text_sv: `Er organisationstyp (${applicantTypeLabel(project.applicantType, "sv").toLowerCase()}) kan inte söka – utlysningen är öppen för: ${allowed_sv}`,
        text_en: `Your organisation type (${applicantTypeLabel(project.applicantType, "en").toLowerCase()}) can't apply — the call is open to: ${allowed_en}`,
      });
    }
  } else if (!call.applicantTypes || call.applicantTypes.length === 0) {
    rationale.push({
      type: "neutral",
      category: "eligibility",
      text_sv: `Kontrollera behörighet: ${call.eligibleApplicants_sv}`,
      text_en: `Check eligibility: ${call.eligibleApplicants_en}`,
    });
  }

  const deadlineMonths = callDeadlineMonths(call, now);
  if (deadlineMonths < 0) {
    ineligibility.push({
      type: "warning",
      category: "timing",
      text_sv: `Ansökningstiden har gått ut (deadline ${call.deadlineDate})`,
      text_en: `The application period has closed (deadline ${call.deadlineDate})`,
    });
  }

  if (call.eligibleRegions && call.eligibleRegions.length > 0) {
    if (!project.region) {
      rationale.push({
        type: "neutral",
        category: "geography",
        text_sv: "Utlysningen gäller bara vissa län – ange län för projektet för att se om det ingår i programområdet",
        text_en: "The call is limited to certain counties — state the project's county to see whether it's in the programme area",
      });
    } else if (call.eligibleRegions.includes(project.region)) {
      rationale.push({
        type: "positive",
        category: "geography",
        text_sv: `${regionLabel(project.region)} ingår i utlysningens programområde`,
        text_en: `${regionLabel(project.region)} is inside the call's programme area`,
      });
    } else {
      const areas = call.eligibleRegions.map(regionLabel).join(", ");
      ineligibility.push({
        type: "warning",
        category: "geography",
        text_sv: `${regionLabel(project.region)} ingår inte i utlysningens programområde (${areas})`,
        text_en: `${regionLabel(project.region)} is outside the call's programme area (${areas})`,
      });
    }
  }

  // --- Thematic fit (nominal 60) -----------------------------------------

  // Sector alignment (max 20) — the primary sector gets full credit, a
  // secondary one partial, since a project that merely touches a
  // programme's sector is a weaker fit than one centred on it.
  const sectorMatch = program.sectors.includes(project.sector);
  const secondaryMatch = sectorMatch
    ? undefined
    : (project.secondarySectors ?? []).find((s) => program.sectors.includes(s));
  if (sectorMatch) {
    thematicScore += 20;
    rationale.push({
      type: "positive",
      category: "sector",
      text_sv: `Stark koppling till sektorn "${sectorLabel(project.sector, "sv")}"`,
      text_en: `Strong alignment with the "${sectorLabel(project.sector, "en")}" sector`,
    });
  } else if (secondaryMatch) {
    thematicScore += 12;
    rationale.push({
      type: "positive",
      category: "sector",
      text_sv: `Koppling till sektorn "${sectorLabel(secondaryMatch, "sv")}" (projektets sekundära sektor)`,
      text_en: `Alignment with the "${sectorLabel(secondaryMatch, "en")}" sector (the project's secondary sector)`,
    });
  }

  // Activity type (max 10) — what kind of work the call funds. Unknown on
  // either side scores half, so projects that don't state it (Projektbank
  // entries, imported calls) aren't ranked as mismatches.
  const callActivities = call.activityTypes ?? [];
  if (project.activityType && callActivities.length > 0) {
    if (callActivities.includes(project.activityType)) {
      thematicScore += 10;
      rationale.push({
        type: "positive",
        category: "activity",
        text_sv: `Utlysningen finansierar den typ av insats projektet är (${activityTypeShortLabel(project.activityType, "sv").toLowerCase()})`,
        text_en: `The call funds this kind of work (${activityTypeShortLabel(project.activityType, "en").toLowerCase()})`,
      });
    } else {
      rationale.push({
        type: "warning",
        category: "activity",
        text_sv: `Utlysningen finansierar främst ${callActivities.map((a) => activityTypeShortLabel(a, "sv").toLowerCase()).join(" / ")} – inte ${activityTypeShortLabel(project.activityType, "sv").toLowerCase()}`,
        text_en: `The call mainly funds ${callActivities.map((a) => activityTypeShortLabel(a, "en").toLowerCase()).join(" / ")} — not ${activityTypeShortLabel(project.activityType, "en").toLowerCase()}`,
        deltaIfFixed: 10,
      });
    }
  } else {
    thematicScore += 5;
    if (!project.activityType) {
      rationale.push({
        type: "neutral",
        category: "activity",
        text_sv: "Ingen typ av insats angiven – ange den i projektformuläret för säkrare matchning.",
        text_en: "No activity type given — set it in the project form for more accurate matching.",
      });
    }
  }

  // Tag overlap (max 20 of the thematic bucket) — the curated, controlled
  // vocabulary (lib/data/tags.ts) shared between calls and projects,
  // chosen by the user or accepted from a keyword-based suggestion
  // (lib/matching/tagSuggestions.ts) rather than inferred live from free
  // text. This is now the primary thematic-fit signal, ahead of the raw
  // keyword overlap below: it catches genuine thematic matches that exact
  // word matching misses on synonyms/paraphrasing, without any AI call at
  // match time.
  const matchedTags = (project.tags ?? []).filter((id) => call.tags.includes(id));
  const tagScore = Math.min(20, matchedTags.length * 7);
  thematicScore += tagScore;
  if (matchedTags.length > 0) {
    rationale.push({
      type: "positive",
      category: "tags",
      text_sv: `Matchar ${matchedTags.length} tagg${matchedTags.length > 1 ? "ar" : ""} med utlysningens tema (t.ex. "${tagLabel(matchedTags[0], "sv")}")`,
      text_en: `Matches ${matchedTags.length} tag${matchedTags.length > 1 ? "s" : ""} with the call's theme (e.g. "${tagLabel(matchedTags[0], "en")}")`,
    });
  } else if ((project.tags ?? []).length === 0) {
    rationale.push({
      type: "neutral",
      category: "tags",
      text_sv: "Inga taggar valda för projektet – välj taggar i projektformuläret för säkrare matchning.",
      text_en: "No tags selected for the project — pick tags in the project form for more accurate matching.",
    });
  }

  // Keyword + target-group overlap (max 10 together) — secondary signals
  // now that tags above carry the primary thematic-fit weight. Keywords
  // are pure exact-word matching with no synonym handling, so they
  // shouldn't outweigh the curated tag signal.
  const matchedKeywords = keywordOverlapCount(project, program, call);
  let secondaryThematicScore = matchedKeywords.length * 3;
  if (matchedKeywords.length > 0) {
    rationale.push({
      type: "positive",
      category: "keywords",
      text_sv: `Projektbeskrivningen matchar ${matchedKeywords.length} nyckelbegrepp i utlysningens prioriteringar (t.ex. "${matchedKeywords[0]}")`,
      text_en: `Your project description matches ${matchedKeywords.length} key terms in the call's priorities (e.g. "${matchedKeywords[0]}")`,
    });
  } else if (!sectorMatch && !secondaryMatch && matchedTags.length === 0) {
    rationale.push({
      type: "warning",
      category: "keywords",
      text_sv: "Svag tematisk koppling mellan projektet och utlysningens prioriteringar",
      text_en: "Weak thematic overlap between the project and the call's priorities",
      deltaIfFixed: 20,
    });
  }

  // Target groups — only for calls aimed at specific people (ESF+,
  // Erasmus+ …); for every other call this is simply not a criterion.
  const callGroups = call.targetGroups ?? [];
  if (callGroups.length > 0) {
    const projectGroups = project.targetGroups ?? [];
    const matchedGroups = projectGroups.filter((g) => callGroups.includes(g));
    const callGroups_sv = callGroups.map((g) => targetGroupLabel(g, "sv").toLowerCase()).join(", ");
    const callGroups_en = callGroups.map((g) => targetGroupLabel(g, "en").toLowerCase()).join(", ");
    if (matchedGroups.length > 0) {
      secondaryThematicScore += 5;
      rationale.push({
        type: "positive",
        category: "targetGroup",
        text_sv: `Projektets målgrupp (${matchedGroups.map((g) => targetGroupLabel(g, "sv").toLowerCase()).join(", ")}) är en av utlysningens målgrupper`,
        text_en: `The project's target group (${matchedGroups.map((g) => targetGroupLabel(g, "en").toLowerCase()).join(", ")}) is one the call is aimed at`,
      });
    } else if (projectGroups.length > 0) {
      rationale.push({
        type: "warning",
        category: "targetGroup",
        text_sv: `Utlysningen riktar sig till ${callGroups_sv} – projektets målgrupp ingår inte`,
        text_en: `The call is aimed at ${callGroups_en} — the project's target group isn't among them`,
        deltaIfFixed: 5,
      });
    } else {
      rationale.push({
        type: "neutral",
        category: "targetGroup",
        text_sv: `Utlysningen riktar sig till ${callGroups_sv} – ange målgrupp om projektet når dem`,
        text_en: `The call is aimed at ${callGroups_en} — state the target group if the project reaches them`,
      });
    }
  }
  thematicScore += Math.min(10, secondaryThematicScore);

  // --- Implementation fit (nominal 40) -----------------------------------

  // What's compared against the call's grant range is the grant being
  // applied for, not the project's total cost — the two differ by the
  // applicant's own co-financing. Estimated from the programme's typical
  // co-financing rate when the user didn't state it.
  const coFinancingRate = call.coFinancingRate ?? program.typicalCoFinancingRate;
  const maxGrantByRate = Math.round(project.budgetSEK * coFinancingRate);
  const requestedGrant = project.requestedGrantSEK ?? maxGrantByRate;
  const grantDescription_sv = project.requestedGrantSEK
    ? `Sökt belopp (${fmtMSEK(requestedGrant)} mnkr)`
    : `Beräknat bidrag (${fmtMSEK(requestedGrant)} mnkr, ${Math.round(coFinancingRate * 100)} % av budgeten)`;
  const grantDescription_en = project.requestedGrantSEK
    ? `Requested grant (SEK ${fmtMSEK(requestedGrant)}M)`
    : `Estimated grant (SEK ${fmtMSEK(requestedGrant)}M, ${Math.round(coFinancingRate * 100)}% of the budget)`;

  // Budget fit (max 20 of the implementation bucket)
  const fit = budgetFit(requestedGrant, call);
  if (fit === "in-range") {
    implementationScore += 20;
    rationale.push({
      type: "positive",
      category: "budget",
      text_sv: `${grantDescription_sv} inom utlysningens intervall (${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)} mnkr)`,
      text_en: `${grantDescription_en} within the call's range (SEK ${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)}M)`,
    });
  } else if (fit === "partial") {
    implementationScore += 8;
    rationale.push({
      type: "warning",
      category: "budget",
      text_sv: `${grantDescription_sv} ligger delvis utanför utlysningens intervall (${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)} mnkr)`,
      text_en: `${grantDescription_en} is partly outside the call's range (SEK ${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)}M)`,
      deltaIfFixed: 12,
    });
  } else {
    rationale.push({
      type: "warning",
      category: "budget",
      text_sv: `${grantDescription_sv} avviker kraftigt från utlysningens intervall (${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)} mnkr)`,
      text_en: `${grantDescription_en} deviates significantly from the call's range (SEK ${fmtMSEK(call.minGrantSEK)}–${fmtMSEK(call.maxGrantSEK)}M)`,
      deltaIfFixed: 20,
    });
  }

  // A stated grant that's a larger share of the budget than the programme
  // usually co-finances means more own funding will be needed than
  // planned — flagged, not scored, since it's about the budget's
  // realism rather than the call's fit.
  if (project.requestedGrantSEK && project.budgetSEK > 0 && project.requestedGrantSEK > maxGrantByRate * 1.05) {
    const share = Math.round((project.requestedGrantSEK / project.budgetSEK) * 100);
    const rate = Math.round(coFinancingRate * 100);
    rationale.push({
      type: "warning",
      category: "budget",
      text_sv: `Sökt belopp motsvarar ${share} % av budgeten – programmet finansierar normalt upp till ${rate} %, räkna med högre egen medfinansiering`,
      text_en: `The requested grant is ${share}% of the budget — the programme normally funds up to ${rate}%, so expect more own co-financing`,
    });
  }

  // Partnership requirement (max 15 of the implementation bucket, can
  // penalize) — compared by number of countries, so a single foreign
  // partner doesn't count as meeting a three-country consortium rule.
  if (call.requiresPartnership) {
    const requiredCountries = call.minPartnerCountries ?? 2;
    const projectLevel = project.partnerLevel ?? (project.hasInternationalPartner ? "international" : "none");
    const projectCountries = partnerCountryCount(projectLevel);
    if (projectCountries >= requiredCountries) {
      implementationScore += 15;
      rationale.push({
        type: "positive",
        category: "partnership",
        text_sv: `Kravet på partnerskap (minst ${requiredCountries} länder) är uppfyllt`,
        text_en: `The partnership requirement (at least ${requiredCountries} countries) is met`,
      });
    } else if (projectCountries > 1) {
      rationale.push({
        type: "warning",
        category: "partnership",
        text_sv: `Utlysningen kräver partner från minst ${requiredCountries} länder – projektet har ${projectCountries}`,
        text_en: `The call requires partners from at least ${requiredCountries} countries — the project has ${projectCountries}`,
        deltaIfFixed: 15,
      });
    } else {
      implementationScore -= 10;
      rationale.push({
        type: "warning",
        category: "partnership",
        text_sv: `Utlysningen kräver internationellt partnerskap (minst ${requiredCountries} länder) – inte angivet för detta projekt`,
        text_en: `This call requires an international partnership (at least ${requiredCountries} countries) — none indicated for this project`,
        deltaIfFixed: 25,
      });
    }
  } else {
    implementationScore += 5;
  }

  // Duration fit (max 5 of the implementation bucket)
  if (durationFit(project, program)) {
    implementationScore += 5;
  } else {
    rationale.push({
      type: "neutral",
      category: "duration",
      text_sv: `Projektets tidsplan avviker något från utlysningens typiska projektlängd (${program.typicalDurationYears[0]}–${program.typicalDurationYears[1]} år)`,
      text_en: `Your timeline differs somewhat from the call's typical project length (${program.typicalDurationYears[0]}–${program.typicalDurationYears[1]} years)`,
      deltaIfFixed: 5,
    });
  }

  // Timing — a project that starts before the funding decision can
  // usually not charge those costs to the grant; one that starts years
  // later is likely better served by a later call.
  const decision = new Date(now.getFullYear(), now.getMonth() + Math.max(0, deadlineMonths) + DECISION_LAG_MONTHS, 1);
  const decisionYear = decision.getFullYear();
  if (project.startYear < decisionYear) {
    implementationScore -= 5;
    rationale.push({
      type: "warning",
      category: "timing",
      text_sv: `Projektet planeras starta ${project.startYear}, men beslut väntas tidigast ${decisionYear} – kostnader före beslut är normalt inte stödberättigande`,
      text_en: `The project is planned to start in ${project.startYear}, but a decision is expected in ${decisionYear} at the earliest — costs before the decision are normally not eligible`,
      deltaIfFixed: 5,
    });
  } else if (project.startYear > decisionYear + 2) {
    rationale.push({
      type: "neutral",
      category: "timing",
      text_sv: `Projektet startar ${project.startYear}, långt efter utlysningens beslut (${decisionYear}) – en senare utlysning kan passa bättre i tid`,
      text_en: `The project starts in ${project.startYear}, well after the call's decision (${decisionYear}) — a later call may fit the timeline better`,
    });
  } else {
    rationale.push({
      type: "positive",
      category: "timing",
      text_sv: `Tidsplanen passar: beslut väntas ${decisionYear}, projektstart ${project.startYear}`,
      text_en: `The timeline fits: decision expected in ${decisionYear}, project start in ${project.startYear}`,
    });
  }

  // Blend the two buckets by the call's own real evaluation-criteria split
  // instead of a universal fixed ratio (see criteriaWeights above). For a
  // call whose criteria wording doesn't map to either bucket, this reduces
  // to exactly the old fixed-60/40 formula.
  const weights = criteriaWeights(call.evaluationCriteria);
  const thematicMaxContribution = weights.thematicPct * 100;
  const implementationMaxContribution = weights.implementationPct * 100;
  const thematicRatio = thematicMaxContribution / 60;
  const implementationRatio = implementationMaxContribution / 40;

  // Rescale each gap's point-upside by the same ratio, so a gap in a bucket
  // this call's own criteria weight more heavily also shows a proportionally
  // larger "fix this to gain N points" — keeping gapAnalysis's potential-
  // score consistent with the score it's built from.
  for (const line of rationale) {
    if (line.deltaIfFixed === undefined) continue;
    const ratio = THEMATIC_CATEGORIES.includes(line.category) ? thematicRatio : implementationRatio;
    line.deltaIfFixed = Math.round(line.deltaIfFixed * ratio);
  }

  let score = thematicScore * thematicRatio + implementationScore * implementationRatio;
  score = Math.max(0, Math.min(100, Math.round(score)));
  const ineligible = ineligibility.length > 0;
  if (ineligible) {
    score = Math.min(score, INELIGIBLE_SCORE_CAP);
    rationale.unshift(...ineligibility);
  }
  const stars = Math.max(1, Math.min(5, Math.round(score / 20)));

  let recommendation: MatchResult["recommendation"] = "low";
  if (!ineligible && score >= 75) recommendation = "proceed";
  else if (!ineligible && score >= 50) recommendation = "consider";

  // Never more than the grant asked for, what the programme typically
  // co-finances, or the call's own maximum grant.
  const fundingUpper = Math.min(requestedGrant, maxGrantByRate, call.maxGrantSEK);
  const estimatedFundingSEK: [number, number] = [
    Math.min(Math.round(maxGrantByRate * 0.7), fundingUpper),
    fundingUpper,
  ];

  if (deadlineMonths >= 0) {
    rationale.push({
      type: "neutral",
      category: "deadline",
      text_sv: `Nästa deadline om cirka ${deadlineMonths} månader`,
      text_en: `Next deadline in approximately ${deadlineMonths} months`,
    });
  }

  // Purely informational — the organisation's own funding profile
  // (Inställningar → Finansieringsprofil) is a statement of intent, not a
  // criterion any funder judges the application on, so it's surfaced
  // alongside the score rather than folded into it.
  if (fundingProfile) {
    const label_sv = sectorLabel(project.sector, "sv").toLowerCase();
    const label_en = sectorLabel(project.sector, "en").toLowerCase();
    const matchesFocusArea = fundingProfile.focusAreas.some((tag) => {
      const t = tag.toLowerCase();
      return label_sv.includes(t) || t.includes(label_sv) || label_en.includes(t) || t.includes(label_en);
    });
    if (matchesFocusArea) {
      rationale.push({
        type: "positive",
        category: "fundingProfile",
        text_sv: `"${sectorLabel(project.sector, "sv")}" är ett av organisationens fokusområden i er finansieringsprofil.`,
        text_en: `"${sectorLabel(project.sector, "en")}" is one of the organisation's focus areas in your funding profile.`,
      });
    }
  }

  return { call, program, score, stars, rationale, recommendation, estimatedFundingSEK };
}

export function computeMatches(project: ProjectInput, calls: FundingCall[], fundingProfile?: FundingProfile): MatchResult[] {
  return calls
    .map((call) => {
      const program = findProgram(call.programId);
      if (!program) return null;
      return scoreMatch(project, call, program, fundingProfile);
    })
    .filter((m): m is MatchResult => m !== null)
    .sort((a, b) => b.score - a.score);
}

const sectorLabels: Record<string, { sv: string; en: string }> = {
  energy: { sv: "energi", en: "energy" },
  climate: { sv: "klimat", en: "climate" },
  digital: { sv: "digitalisering", en: "digital" },
  social: { sv: "social omsorg", en: "social care" },
  mobility: { sv: "mobilitet", en: "mobility" },
  education: { sv: "utbildning", en: "education" },
  health: { sv: "hälsa", en: "health" },
  research: { sv: "forskning", en: "research" },
};

export function sectorLabel(sector: string, lang: "sv" | "en"): string {
  return sectorLabels[sector]?.[lang] ?? sector;
}

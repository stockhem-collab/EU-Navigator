import { test, expect } from "@playwright/test";
import { extractCallDraft, slugifyCallId } from "../../lib/matching/callExtraction";

// The utlysningsimport tool's deterministic first pass over pasted call
// text — deliberately simple keyword/pattern matching, not real language
// understanding. Every field carries a confidence flag so the review form
// knows what to highlight; these tests lock in that every field it claims
// to have "detected" really was present in the text, and that it degrades
// to an honest "default" rather than a wrong guess when it isn't.

const SAMPLE_TEXT = `
Utlysningen riktar sig till kommuner, regioner och kommunala bolag.
Projektet ska genomföras i partnerskap med minst två andra länder.
Total budget för utlysningen är 300 miljoner kronor.
Bidrag ges på mellan 5 miljoner kronor och 80 miljoner kronor per projekt.
Rapportering sker kvartalsvis under hela projekttiden.
Ett revisionsintyg krävs för projekt över 2 miljoner kronor.

Prioriteringar:
- Mätbar klimateffekt
- Skalbarhet till andra kommuner
- Innovativ teknik
`;

test("extractCallDraft finds budget, grant range, partnership, applicant types, periodicity, audit threshold and priorities", () => {
  const draft = extractCallDraft(SAMPLE_TEXT);

  expect(draft.budgetTotalSEK).toEqual({ value: 300_000_000, confidence: "detected" });
  expect(draft.minGrantSEK).toEqual({ value: 5_000_000, confidence: "detected" });
  expect(draft.maxGrantSEK).toEqual({ value: 80_000_000, confidence: "detected" });
  expect(draft.requiresPartnership).toEqual({ value: true, confidence: "detected" });
  expect(draft.applicantTypes.confidence).toBe("detected");
  expect(draft.applicantTypes.value.sort()).toEqual(["municipal-company", "municipality", "region"].sort());
  expect(draft.periodicity).toEqual({ value: "quarterly", confidence: "detected" });
  expect(draft.requiresAuditAboveSEK).toEqual({ value: 2_000_000, confidence: "detected" });
  expect(draft.priorities_sv.confidence).toBe("detected");
  expect(draft.priorities_sv.value).toEqual(["Mätbar klimateffekt", "Skalbarhet till andra kommuner", "Innovativ teknik"]);
});

test("extractCallDraft falls back to defaults, never a wrong guess, when the text has no clear signal", () => {
  const draft = extractCallDraft("Detta är en kort text utan några tydliga mönster alls.");

  expect(draft.budgetTotalSEK.confidence).toBe("default");
  expect(draft.budgetTotalSEK.value).toBe(0);
  expect(draft.requiresPartnership).toEqual({ value: false, confidence: "default" });
  expect(draft.applicantTypes).toEqual({ value: [], confidence: "default" });
  expect(draft.requiresAuditAboveSEK).toEqual({ value: null, confidence: "default" });
  expect(draft.priorities_sv).toEqual({ value: [], confidence: "default" });
});

test("slugifyCallId produces a URL-safe id and avoids collisions", () => {
  expect(slugifyCallId("LIFE – Nya åtgärder 2028!", [])).toBe("life-nya-atgarder-2028");
  expect(slugifyCallId("Test", ["test"])).toBe("test-2");
  expect(slugifyCallId("Test", ["test", "test-2"])).toBe("test-3");
});

// The fields matching reads beyond the ones above (activity type, target
// group, partnership size, programme area, deadline, funding rate,
// evaluation criteria) — same rule: "detected" only when the text says so.
const MATCHING_TEXT = `
Utlysningen finansierar investeringar och pilotprojekt för energieffektivisering.
Insatserna ska nå arbetssökande och nyanlända.
Projektet ska genomföras med partner från minst två andra länder.
Programområdet omfattar Skåne, Blekinge och Örebro län.
Sista ansökningsdag är 15 mars 2027.
Stödnivån är högst 65 % av de stödberättigande kostnaderna.

Bedömningskriterier:
- Relevans – 30 poäng
- EU-mervärde: 25 poäng
- Genomförande (45 poäng)
`;

test("extractCallDraft finds the fields matching needs", () => {
  const draft = extractCallDraft(MATCHING_TEXT);
  expect(draft.activityTypes.value.sort()).toEqual(["investment", "pilot"]);
  expect(draft.targetGroups.value.sort()).toEqual(["newly-arrived", "unemployed"]);
  // "two other countries" = three in total, counting the applicant's own.
  expect(draft.minPartnerCountries).toEqual({ value: 3, confidence: "detected" });
  expect(draft.requiresPartnership.value).toBe(true);
  expect(draft.eligibleRegions.value.sort()).toEqual(["blekinge", "orebro", "skane"]);
  expect(draft.deadlineDate).toEqual({ value: "2027-03-15", confidence: "detected" });
  expect(draft.coFinancingRate).toEqual({ value: 0.65, confidence: "detected" });
  expect(draft.evaluationCriteria.value).toEqual([
    { name_sv: "Relevans", name_en: "Relevans", maxPoints: 30 },
    { name_sv: "EU-mervärde", name_en: "EU-mervärde", maxPoints: 25 },
    { name_sv: "Genomförande", name_en: "Genomförande", maxPoints: 45 },
  ]);
  // Criteria lines aren't also read as priorities.
  expect(draft.priorities_sv.value).toEqual([]);
});

test("matching fields stay at their defaults without a clear signal", () => {
  const draft = extractCallDraft(
    "Vi har kontor i Skåne. Medfinansiering 40 % krävs. Kontakta oss senast i vår för frågor om projektet."
  );
  expect(draft.activityTypes).toEqual({ value: [], confidence: "default" });
  expect(draft.targetGroups).toEqual({ value: [], confidence: "default" });
  // A county named outside a sentence about the programme area doesn't
  // restrict the call.
  expect(draft.eligibleRegions).toEqual({ value: [], confidence: "default" });
  // "Medfinansiering 40 %" could be either share, so it isn't read as the rate.
  expect(draft.coFinancingRate).toEqual({ value: null, confidence: "default" });
  expect(draft.deadlineDate).toEqual({ value: null, confidence: "default" });
  expect(draft.minPartnerCountries).toEqual({ value: null, confidence: "default" });
  expect(draft.evaluationCriteria).toEqual({ value: [], confidence: "default" });
});

test("an ISO deadline date and 'minst tre länder' are read as written", () => {
  const draft = extractCallDraft("Ansökan ska vara inne senast 2027-09-30. Konsortiet ska ha partner från minst tre olika EU-länder.");
  expect(draft.deadlineDate.value).toBe("2027-09-30");
  expect(draft.minPartnerCountries.value).toBe(3);
});

test("the total budget is only 'detected' from a sentence about the total, never a per-project grant", () => {
  const onlyGrants = extractCallDraft(
    "Bidrag ges på mellan 5 miljoner kronor och 80 miljoner kronor per projekt. Revisionsintyg krävs över 2 miljoner kronor."
  );
  expect(onlyGrants.budgetTotalSEK).toEqual({ value: 0, confidence: "default" });

  const withTotal = extractCallDraft(
    "Bidrag ges på mellan 5 miljoner kronor och 80 miljoner kronor per projekt. Totalt avsätts 400 miljoner kronor i utlysningen."
  );
  expect(withTotal.budgetTotalSEK).toEqual({ value: 400_000_000, confidence: "detected" });

  // An amount outside any recognised sentence is still offered, but as a
  // default to check.
  const unlabelled = extractCallDraft("Utlysningen omfattar 150 miljoner kronor.");
  expect(unlabelled.budgetTotalSEK).toEqual({ value: 150_000_000, confidence: "default" });
});

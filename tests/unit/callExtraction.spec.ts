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

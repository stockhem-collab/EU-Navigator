import { test, expect } from "@playwright/test";
import { buildReportingSchedule, extractCommitments, monthsUntil, withCurrentDeadline } from "../../lib/matching/reportingSchedule";
import { expectedShareAt, isDeviation, reportingHealth } from "../../lib/data/grants";
import { Grant } from "../../lib/types";

// A registered grant's reporting plan: every report the call's cycle gives
// over the project's period, with real due dates; commitments suggested
// from what the application promised; and deviations judged against what
// should have been reached by each report, not the whole commitment.

const now = new Date(2026, 8, 30); // 30 Sep 2026

test("the schedule has one report per period, then the final report, with dates", () => {
  const events = buildReportingSchedule({ idPrefix: "g", periodStart: 2027, periodEnd: 2028, periodicity: "biannual", now });
  expect(events.map((e) => e.type)).toEqual(["interim", "interim", "interim", "final"]);
  expect(events.map((e) => e.deadlineDate)).toEqual(["2027-08-01", "2028-02-01", "2028-08-01", "2029-04-01"]);
  expect(events[0].periodLabel_sv).toBe("Lägesrapport 1 (jan–jun 2027)");
  expect(events[2].periodLabel_sv).toBe("Lägesrapport 3 (jan–jun 2028)");
  expect(events.every((e) => e.status === "upcoming")).toBe(true);
  expect(events[0].deadlineMonthsFromNow).toBe(10);
});

test("a project that has already started is reported on from now", () => {
  const events = buildReportingSchedule({ idPrefix: "g", periodStart: 2025, periodEnd: 2027, periodicity: "annual", now });
  expect(events[0].periodLabel_sv).toBe("Lägesrapport 1 (sep 2026–aug 2027)");
  expect(events.at(-1)?.type).toBe("final");
  expect(events.at(-1)?.deadlineDate).toBe("2028-04-01");
});

test("months until a date, and a stored date keeps the relative form current", () => {
  expect(monthsUntil(new Date(2026, 9, 15), now)).toBe(0);
  expect(monthsUntil(new Date(2026, 11, 1), now)).toBe(2);
  expect(monthsUntil(new Date(2026, 8, 1), now)).toBe(-1);
  expect(monthsUntil(new Date(2026, 5, 1), now)).toBe(-3);
  const event = withCurrentDeadline({ deadlineDate: "2027-03-31", deadlineMonthsFromNow: 99 }, now);
  expect(event.deadlineMonthsFromNow).toBe(6);
});

test("commitments are suggested from quantified statements in the application", () => {
  const text =
    "Projektet ska minska energianvändningen med 20 %. Totalt 300 medarbetare deltar i utbildningen.\n" +
    "Budgeten är 45 000 000 kr. Projektet pågår 2027–2029. Vi installerar solceller på 8 skolor.";
  const commitments = extractCommitments(text);
  expect(commitments.map((c) => [c.indicator_sv, c.promisedValue, c.unit_sv])).toEqual([
    ["Projektet ska minska energianvändningen", 20, "%"],
    ["Totalt deltar i utbildningen", 300, "medarbetare"],
    ["Vi installerar solceller", 8, "skolor"],
  ]);
  expect(extractCommitments("Ingen siffra här.")).toEqual([]);
});

function grant(events: Grant["reportingEvents"]): Grant {
  return {
    id: "g",
    title_sv: "G",
    title_en: "G",
    callId: "c",
    awardedAmountSEK: 1,
    commitments: [{ indicator_sv: "Deltagare", indicator_en: "Participants", promisedValue: 100, unit_sv: "st", unit_en: "units" }],
    reportingEvents: events,
  };
}
const event = (id: string, type: "interim" | "final", value?: number) => ({
  id,
  type,
  periodLabel_sv: id,
  periodLabel_en: id,
  deadlineMonthsFromNow: 0,
  status: value === undefined ? ("upcoming" as const) : ("approved" as const),
  outcomes: value === undefined ? [] : [{ indicator_sv: "Deltagare", value }],
});

test("a report is judged against what should be reached by then", () => {
  const g = grant([event("r1", "interim", 30), event("r2", "interim"), event("r3", "interim"), event("f", "final")]);
  expect(expectedShareAt(g, "r1")).toBe(0.25);
  expect(expectedShareAt(g, "f")).toBe(1);
  // 30 of an expected 25 is on track, even though far from the 100 promised.
  expect(isDeviation(30, 100, 0.25)).toBe(false);
  expect(isDeviation(20, 100, 0.25)).toBe(true);
  expect(reportingHealth(g)).toBe("good");
  // Without a final report in the plan, the whole commitment is the yardstick.
  expect(expectedShareAt(grant([event("r1", "interim", 30)]), "r1")).toBe(1);
});

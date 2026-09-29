import { test, expect } from "@playwright/test";
import {
  nextUpcomingReport,
  nextActionableReport,
  latestOutcomeFor,
  outcomeHistoryFor,
  isReportingComplete,
  reportingHealth,
  financialHistory,
  cumulativeSpentThrough,
} from "../../lib/data/grants";
import { Grant } from "../../lib/types";

// Coverage for the post-award reporting-cycle helpers: the next upcoming
// report, the latest known outturn per indicator (regardless of whether
// that report has since been approved), and whether a project's reporting
// is fully wrapped up (so the UI can hand off to the closure phase).

function makeProject(overrides: Partial<Grant> = {}): Grant {
  return {
    id: "ap-test",
    title_sv: "Test",
    title_en: "Test",
    callId: "test-call",
    awardedAmountSEK: 1_000_000,
    commitments: [{ indicator_sv: "Deltagare", indicator_en: "Participants", promisedValue: 100, unit_sv: "st", unit_en: "units" }],
    reportingEvents: [],
    ...overrides,
  };
}

test("nextUpcomingReport finds the first event still awaiting submission", () => {
  const project = makeProject({
    reportingEvents: [
      { id: "r1", type: "interim", periodLabel_sv: "R1", periodLabel_en: "R1", deadlineMonthsFromNow: -3, status: "approved", outcomes: [] },
      { id: "r2", type: "interim", periodLabel_sv: "R2", periodLabel_en: "R2", deadlineMonthsFromNow: 1, status: "upcoming", outcomes: [] },
      { id: "r3", type: "final", periodLabel_sv: "R3", periodLabel_en: "R3", deadlineMonthsFromNow: 6, status: "upcoming", outcomes: [] },
    ],
  });
  expect(nextUpcomingReport(project)?.id).toBe("r2");
});

test("nextUpcomingReport is undefined once every known event is reported", () => {
  const project = makeProject({
    reportingEvents: [
      { id: "r1", type: "final", periodLabel_sv: "R1", periodLabel_en: "R1", deadlineMonthsFromNow: -1, status: "approved", outcomes: [] },
    ],
  });
  expect(nextUpcomingReport(project)).toBeUndefined();
});

test("latestOutcomeFor returns the most recent reported value for an indicator, approved or not", () => {
  const project = makeProject({
    reportingEvents: [
      {
        id: "r1",
        type: "interim",
        periodLabel_sv: "R1",
        periodLabel_en: "R1",
        deadlineMonthsFromNow: -6,
        status: "approved",
        outcomes: [{ indicator_sv: "Deltagare", value: 40 }],
      },
      {
        id: "r2",
        type: "interim",
        periodLabel_sv: "R2",
        periodLabel_en: "R2",
        deadlineMonthsFromNow: -1,
        status: "submitted",
        outcomes: [{ indicator_sv: "Deltagare", value: 75 }],
      },
      { id: "r3", type: "final", periodLabel_sv: "R3", periodLabel_en: "R3", deadlineMonthsFromNow: 3, status: "upcoming", outcomes: [] },
    ],
  });
  expect(latestOutcomeFor(project, "Deltagare")).toBe(75);
});

test("latestOutcomeFor is undefined when nothing has been reported for that indicator yet", () => {
  const project = makeProject({
    reportingEvents: [{ id: "r1", type: "interim", periodLabel_sv: "R1", periodLabel_en: "R1", deadlineMonthsFromNow: 2, status: "upcoming", outcomes: [] }],
  });
  expect(latestOutcomeFor(project, "Deltagare")).toBeUndefined();
});

test("isReportingComplete is true only once the final report is no longer upcoming", () => {
  const midway = makeProject({
    reportingEvents: [
      { id: "r1", type: "interim", periodLabel_sv: "R1", periodLabel_en: "R1", deadlineMonthsFromNow: -3, status: "approved", outcomes: [] },
      { id: "r2", type: "final", periodLabel_sv: "R2", periodLabel_en: "R2", deadlineMonthsFromNow: 2, status: "upcoming", outcomes: [] },
    ],
  });
  expect(isReportingComplete(midway)).toBe(false);

  const done = makeProject({
    reportingEvents: [
      { id: "r1", type: "interim", periodLabel_sv: "R1", periodLabel_en: "R1", deadlineMonthsFromNow: -6, status: "approved", outcomes: [] },
      { id: "r2", type: "final", periodLabel_sv: "R2", periodLabel_en: "R2", deadlineMonthsFromNow: -1, status: "submitted", outcomes: [] },
    ],
  });
  expect(isReportingComplete(done)).toBe(true);
});

test("isReportingComplete is false while the final report itself is stuck in revision-requested", () => {
  const project = makeProject({
    reportingEvents: [
      { id: "r1", type: "interim", periodLabel_sv: "R1", periodLabel_en: "R1", deadlineMonthsFromNow: -6, status: "approved", outcomes: [] },
      {
        id: "r2",
        type: "final",
        periodLabel_sv: "R2",
        periodLabel_en: "R2",
        deadlineMonthsFromNow: -1,
        status: "revision-requested",
        outcomes: [],
      },
    ],
  });
  expect(isReportingComplete(project)).toBe(false);
});

test("nextActionableReport prioritizes a revision-requested report over a merely upcoming one", () => {
  const project = makeProject({
    reportingEvents: [
      {
        id: "r1",
        type: "interim",
        periodLabel_sv: "R1",
        periodLabel_en: "R1",
        deadlineMonthsFromNow: -3,
        status: "revision-requested",
        outcomes: [],
      },
      { id: "r2", type: "interim", periodLabel_sv: "R2", periodLabel_en: "R2", deadlineMonthsFromNow: 2, status: "upcoming", outcomes: [] },
    ],
  });
  expect(nextActionableReport(project)?.id).toBe("r1");
});

test("nextActionableReport falls back to nextUpcomingReport when nothing needs revision", () => {
  const project = makeProject({
    reportingEvents: [
      { id: "r1", type: "interim", periodLabel_sv: "R1", periodLabel_en: "R1", deadlineMonthsFromNow: -3, status: "approved", outcomes: [] },
      { id: "r2", type: "interim", periodLabel_sv: "R2", periodLabel_en: "R2", deadlineMonthsFromNow: 2, status: "upcoming", outcomes: [] },
    ],
  });
  expect(nextActionableReport(project)?.id).toBe("r2");
});

test("outcomeHistoryFor returns every reported point for an indicator in chronological order", () => {
  const project = makeProject({
    reportingEvents: [
      {
        id: "r1",
        type: "interim",
        periodLabel_sv: "R1",
        periodLabel_en: "R1 en",
        deadlineMonthsFromNow: -6,
        status: "approved",
        outcomes: [{ indicator_sv: "Deltagare", value: 40 }],
      },
      { id: "r2", type: "interim", periodLabel_sv: "R2", periodLabel_en: "R2 en", deadlineMonthsFromNow: -1, status: "upcoming", outcomes: [] },
      {
        id: "r3",
        type: "final",
        periodLabel_sv: "R3",
        periodLabel_en: "R3 en",
        deadlineMonthsFromNow: 3,
        status: "submitted",
        outcomes: [{ indicator_sv: "Deltagare", value: 90 }],
      },
    ],
  });
  expect(outcomeHistoryFor(project, "Deltagare")).toEqual([
    { periodLabel_sv: "R1", periodLabel_en: "R1 en", value: 40 },
    { periodLabel_sv: "R3", periodLabel_en: "R3 en", value: 90 },
  ]);
});

test("reportingHealth is blocked if any report needs revision, regardless of outturn", () => {
  const project = makeProject({
    reportingEvents: [
      {
        id: "r1",
        type: "interim",
        periodLabel_sv: "R1",
        periodLabel_en: "R1",
        deadlineMonthsFromNow: -3,
        status: "revision-requested",
        outcomes: [{ indicator_sv: "Deltagare", value: 100 }],
      },
    ],
  });
  expect(reportingHealth(project)).toBe("blocked");
});

test("reportingHealth is attention when the latest outturn is meaningfully behind plan", () => {
  const project = makeProject({
    reportingEvents: [
      {
        id: "r1",
        type: "interim",
        periodLabel_sv: "R1",
        periodLabel_en: "R1",
        deadlineMonthsFromNow: -3,
        status: "approved",
        outcomes: [{ indicator_sv: "Deltagare", value: 50 }],
      },
    ],
  });
  expect(reportingHealth(project)).toBe("attention");
});

test("reportingHealth is good when nothing is blocked or behind plan", () => {
  const project = makeProject({
    reportingEvents: [
      {
        id: "r1",
        type: "interim",
        periodLabel_sv: "R1",
        periodLabel_en: "R1",
        deadlineMonthsFromNow: -3,
        status: "approved",
        outcomes: [{ indicator_sv: "Deltagare", value: 95 }],
      },
    ],
  });
  expect(reportingHealth(project)).toBe("good");
});

// Coverage for the financial-reporting helpers: each event's own "spent
// this period" figure (lib/types.ts's FinancialOutcome), rolled up into a
// history series and a running cumulative total, without storing a
// redundant total that could drift from the underlying per-period figures.

function makeFinancialProject(): Grant {
  return makeProject({
    awardedAmountSEK: 1_000_000,
    reportingEvents: [
      {
        id: "r1",
        type: "interim",
        periodLabel_sv: "R1",
        periodLabel_en: "R1",
        deadlineMonthsFromNow: -6,
        status: "approved",
        outcomes: [],
        financials: { spentThisPeriodSEK: 200_000 },
      },
      {
        id: "r2",
        type: "interim",
        periodLabel_sv: "R2",
        periodLabel_en: "R2",
        deadlineMonthsFromNow: -3,
        status: "submitted",
        outcomes: [],
        financials: { spentThisPeriodSEK: 150_000 },
      },
      {
        id: "r3",
        type: "final",
        periodLabel_sv: "R3",
        periodLabel_en: "R3",
        deadlineMonthsFromNow: 3,
        status: "upcoming",
        outcomes: [],
      },
    ],
  });
}

test("financialHistory returns only the events that actually reported a spend figure, in order", () => {
  const project = makeFinancialProject();
  expect(financialHistory(project)).toEqual([
    { periodLabel_sv: "R1", periodLabel_en: "R1", spentThisPeriodSEK: 200_000 },
    { periodLabel_sv: "R2", periodLabel_en: "R2", spentThisPeriodSEK: 150_000 },
  ]);
});

test("cumulativeSpentThrough sums every period's spend up to and including the given event", () => {
  const project = makeFinancialProject();
  expect(cumulativeSpentThrough(project, "r1")).toBe(200_000);
  expect(cumulativeSpentThrough(project, "r2")).toBe(350_000);
  // r3 (the upcoming final report) has no financials of its own yet, but
  // the running total through it still includes everything reported so far.
  expect(cumulativeSpentThrough(project, "r3")).toBe(350_000);
});

test("a project with no reported spend figures has an empty financial history", () => {
  const project = makeProject({
    reportingEvents: [
      { id: "r1", type: "interim", periodLabel_sv: "R1", periodLabel_en: "R1", deadlineMonthsFromNow: -3, status: "approved", outcomes: [] },
    ],
  });
  expect(financialHistory(project)).toEqual([]);
});

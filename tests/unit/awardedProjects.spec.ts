import { test, expect } from "@playwright/test";
import { nextUpcomingReport, latestOutcomeFor, isReportingComplete } from "../../lib/data/awardedProjects";
import { AwardedProject } from "../../lib/types";

// Coverage for the post-award reporting-cycle helpers: the next upcoming
// report, the latest known outturn per indicator (regardless of whether
// that report has since been approved), and whether a project's reporting
// is fully wrapped up (so the UI can hand off to the closure phase).

function makeProject(overrides: Partial<AwardedProject> = {}): AwardedProject {
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

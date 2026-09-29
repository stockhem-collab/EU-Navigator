import { test, expect } from "@playwright/test";
import { computeNotifications, filterForUser, NotificationInputs } from "../../lib/notifications";
import { DEFAULT_NOTIFICATION_PREFERENCES } from "../../lib/hooks/useNotificationPreferences";
import { ApplicationRecord, FundingCall, Grant, ProjectBankEntry } from "../../lib/types";

// The notification list is a pure function of the data: deadlines coming
// up, reports returned or overdue, awarded applications waiting for their
// grant, calls that fit a project, and what people did (the activity log).

const project = { id: "p1", title_sv: "Skolor", title_en: "Schools" } as ProjectBankEntry;
const call = {
  id: "c1",
  programId: "life",
  title_sv: "LIFE-utlysning",
  title_en: "LIFE call",
  deadlineMonthsFromNow: 1,
  documents: [],
} as unknown as FundingCall;

function app(status: ApplicationRecord["status"], extra: Partial<ApplicationRecord> = {}): ApplicationRecord {
  return { id: `a-${status}`, projectId: "p1", callId: "c1", status, createdAt: "2026-01-01", updatedAt: "2026-01-02", ...extra };
}

function inputs(overrides: Partial<NotificationInputs> = {}): NotificationInputs {
  return {
    now: new Date(2026, 0, 15),
    prefs: DEFAULT_NOTIFICATION_PREFERENCES,
    projects: [project],
    calls: [call],
    findProgram: () => undefined,
    applications: [],
    grants: [],
    tasks: {},
    watchedCallIds: [],
    watchedProgramIds: [],
    strongMatches: [],
    activity: [],
    ...overrides,
  };
}

test("a draft application whose call closes within the reminder window is a deadline notice", () => {
  const list = computeNotifications(inputs({ applications: [app("draft")] }));
  const n = list.find((x) => x.id.startsWith("app-deadline:"));
  expect(n).toMatchObject({ category: "deadlines", urgent: true, projectId: "p1" });
  expect(n?.entityKeys).toContain("application:a-draft");
  // Outside the window (lead 1 month, deadline 1 month away → still in; 3 months → out).
  const far = computeNotifications(inputs({ applications: [app("draft")], calls: [{ ...call, deadlineMonthsFromNow: 3 }] }));
  expect(far.some((x) => x.id.startsWith("app-deadline:"))).toBe(false);
});

test("the reminder id changes as the deadline gets closer, so it shows again", () => {
  const at2 = computeNotifications(inputs({ applications: [app("draft")], calls: [{ ...call, deadlineMonthsFromNow: 2 }] }));
  const at1 = computeNotifications(inputs({ applications: [app("draft")] }));
  expect(at2.find((x) => x.id.startsWith("app-deadline:"))?.id).not.toBe(at1.find((x) => x.id.startsWith("app-deadline:"))?.id);
});

test("an awarded application without a registered grant asks for the grant to be registered", () => {
  const list = computeNotifications(inputs({ applications: [app("awarded")] }));
  expect(list.find((x) => x.id === "app-register-grant:a-awarded")).toMatchObject({ category: "applications", urgent: true });
  const done = computeNotifications(inputs({ applications: [app("awarded", { awardedProjectId: "g1" })] }));
  expect(done.some((x) => x.id.startsWith("app-register-grant:"))).toBe(false);
});

test("reports: returned and overdue are urgent reporting notices, upcoming ones are reminders", () => {
  const grant = {
    id: "g1",
    title_sv: "Stöd",
    title_en: "Grant",
    callId: "c1",
    projectBankEntryId: "p1",
    awardedAmountSEK: 1,
    commitments: [],
    reportingEvents: [
      { id: "r1", type: "interim", periodLabel_sv: "R1", periodLabel_en: "R1", deadlineMonthsFromNow: 1, status: "revision-requested", outcomes: [] },
      { id: "r2", type: "interim", periodLabel_sv: "R2", periodLabel_en: "R2", deadlineMonthsFromNow: -1, status: "upcoming", outcomes: [] },
      { id: "r3", type: "final", periodLabel_sv: "R3", periodLabel_en: "R3", deadlineMonthsFromNow: 2, status: "upcoming", outcomes: [] },
    ],
  } as Grant;
  const list = computeNotifications(inputs({ grants: [grant] }));
  expect(list.find((x) => x.id === "report-revision:r1")).toMatchObject({ category: "reporting", urgent: true });
  expect(list.find((x) => x.id === "report-overdue:r2")).toMatchObject({ category: "reporting", urgent: true });
  expect(list.find((x) => x.id === "report-due:r3:2")).toMatchObject({ category: "deadlines", urgent: false });
  // Urgent ones come first.
  expect(list[0].urgent).toBe(true);
});

test("a strong match is only suggested for a call the project hasn't applied to", () => {
  const match = { projectId: "p1", callId: "c1", score: 82 };
  expect(computeNotifications(inputs({ strongMatches: [match] })).some((x) => x.id === "call-match:p1:c1")).toBe(true);
  expect(
    computeNotifications(inputs({ strongMatches: [match], applications: [app("submitted")] })).some((x) => x.id === "call-match:p1:c1")
  ).toBe(false);
});

test("logged activity becomes notifications with the time it happened", () => {
  const list = computeNotifications(
    inputs({
      applications: [app("submitted")],
      activity: [
        { id: "act-1", at: "2026-01-10T10:00:00Z", kind: "application-status", applicationId: "a-submitted", projectId: "p1", callId: "c1", status: "submitted" },
        { id: "act-2", at: "2026-01-11T10:00:00Z", kind: "project-shared", projectId: "p1", unitName: "Miljöförvaltningen" },
      ],
    })
  );
  expect(list.find((x) => x.id === "act-1")).toMatchObject({ category: "applications", at: "2026-01-10T10:00:00Z" });
  expect(list.find((x) => x.id === "act-2")?.title_sv).toContain("Miljöförvaltningen");
});

test("user preferences: categories off in the app are dropped, and 'mine' hides other projects", () => {
  const list = computeNotifications(inputs({ applications: [app("awarded")], strongMatches: [{ projectId: "p1", callId: "c1", score: 90 }] }));
  const noCalls = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    categories: { ...DEFAULT_NOTIFICATION_PREFERENCES.categories, calls: { inApp: false, email: "off" as const } },
  };
  expect(filterForUser(list, noCalls, () => true).some((x) => x.category === "calls")).toBe(false);
  const mine = { ...DEFAULT_NOTIFICATION_PREFERENCES, scope: "mine" as const };
  expect(filterForUser(list, mine, () => false).filter((x) => x.projectId)).toHaveLength(0);
  expect(filterForUser(list, mine, () => true).length).toBe(list.length);
});

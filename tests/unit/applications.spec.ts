import { test, expect } from "@playwright/test";
import { projectStatusFromApplications } from "../../lib/matching/applications";
import { ApplicationRecord, ApplicationStatus } from "../../lib/types";

// How a project's own status follows its applications, now that a project
// can have several (to different calls, or more than one to the same call).

function app(status: ApplicationStatus, callId = "c1"): ApplicationRecord {
  return { id: `${callId}-${status}`, projectId: "p", callId, status, createdAt: "", updatedAt: "" };
}

test("no applications leaves the project status as it is", () => {
  expect(projectStatusFromApplications("idea", [])).toBe("idea");
});

test("the most advanced application decides the project status", () => {
  expect(projectStatusFromApplications("idea", [app("draft")])).toBe("application");
  expect(projectStatusFromApplications("application", [app("draft", "c1"), app("submitted", "c2")])).toBe("submitted");
  expect(projectStatusFromApplications("submitted", [app("under-review")])).toBe("submitted");
  // One award outweighs a rejection elsewhere.
  expect(projectStatusFromApplications("submitted", [app("rejected", "c1"), app("awarded", "c2")])).toBe("approved");
  // A new draft after a rejection puts the project back in the application stage.
  expect(projectStatusFromApplications("rejected", [app("rejected", "c1"), app("draft", "c1")])).toBe("application");
});

test("only when every application is closed does the project fall back", () => {
  expect(projectStatusFromApplications("submitted", [app("rejected", "c1"), app("withdrawn", "c2")])).toBe("rejected");
  expect(projectStatusFromApplications("application", [app("withdrawn")])).toBe("funding-search");
});

test("a running or completed project isn't moved back by its applications", () => {
  expect(projectStatusFromApplications("running", [app("draft")])).toBe("running");
  expect(projectStatusFromApplications("completed", [app("rejected")])).toBe("completed");
});

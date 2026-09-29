import { test, expect } from "@playwright/test";
import { projectStatusFromApplications } from "../../lib/matching/applications";
import { ApplicationRecord, ApplicationStatus, normalizeProjectStatus } from "../../lib/types";

// The project status is a lifecycle (idea → searching for funding →
// funded → running → completed); where each of its applications stands is
// shown on the application itself.

function app(status: ApplicationStatus, callId = "c1"): ApplicationRecord {
  return { id: `${callId}-${status}`, projectId: "p", callId, status, createdAt: "", updatedAt: "" };
}

test("no applications leaves the project status as it is", () => {
  expect(projectStatusFromApplications("idea", [])).toBe("idea");
  expect(projectStatusFromApplications("assessing", [])).toBe("assessing");
});

test("any application puts the project in 'searching for funding' until one is awarded", () => {
  expect(projectStatusFromApplications("idea", [app("draft")])).toBe("funding-search");
  expect(projectStatusFromApplications("assessing", [app("submitted")])).toBe("funding-search");
  // Rejected or withdrawn: still searching — the rejection is on the application.
  expect(projectStatusFromApplications("idea", [app("rejected"), app("withdrawn", "c2")])).toBe("funding-search");
});

test("one awarded application makes the project funded, whatever happened to the others", () => {
  expect(projectStatusFromApplications("funding-search", [app("rejected", "c1"), app("awarded", "c2")])).toBe("funded");
});

test("a running or completed project isn't moved back by its applications", () => {
  expect(projectStatusFromApplications("running", [app("draft")])).toBe("running");
  expect(projectStatusFromApplications("completed", [app("rejected")])).toBe("completed");
});

test("older, application-level project statuses are read as lifecycle statuses", () => {
  expect(normalizeProjectStatus("approved")).toBe("funded");
  expect(normalizeProjectStatus("application")).toBe("funding-search");
  expect(normalizeProjectStatus("submitted")).toBe("funding-search");
  expect(normalizeProjectStatus("rejected")).toBe("funding-search");
  expect(normalizeProjectStatus("running")).toBe("running");
  expect(normalizeProjectStatus(undefined)).toBe("idea");
});

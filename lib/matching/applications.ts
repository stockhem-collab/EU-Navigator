import { ApplicationRecord, ApplicationStatus, ProjectStatus } from "@/lib/types";

// Pure rules for how a project's own status follows its applications —
// kept separate from the localStorage hook so they can be unit-tested.

/** Statuses where the application is still in play (shown under
 * "Pågående ansökningar"). */
export const ACTIVE_APPLICATION_STATUSES: ApplicationStatus[] = ["draft", "submitted", "under-review"];

export function isActiveApplication(record: ApplicationRecord): boolean {
  return ACTIVE_APPLICATION_STATUSES.includes(record.status);
}

// A project that has already started or finished is past the application
// stage — its applications' statuses no longer say anything about it.
const PAST_APPLICATION_STAGE: ProjectStatus[] = ["running", "completed"];

/**
 * The project status its applications imply, or `current` when they don't
 * imply a change. The most advanced application wins: one award makes the
 * project approved even if other applications were rejected; otherwise any
 * application still with the funder means "submitted", any draft means
 * "application", and only when every application has been rejected or
 * withdrawn does the project fall back ("rejected", or back to searching
 * for funding when they were all withdrawn).
 */
export function projectStatusFromApplications(current: ProjectStatus, records: ApplicationRecord[]): ProjectStatus {
  if (records.length === 0 || PAST_APPLICATION_STAGE.includes(current)) return current;
  const statuses = new Set(records.map((r) => r.status));
  if (statuses.has("awarded")) return "approved";
  if (statuses.has("submitted") || statuses.has("under-review")) return "submitted";
  if (statuses.has("draft")) return "application";
  if (statuses.has("rejected")) return "rejected";
  return "funding-search";
}

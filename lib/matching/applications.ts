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
 * imply a change. The project status is a lifecycle, not an application
 * status: one awarded application makes the project "funded"; otherwise,
 * as soon as it has any application — in progress, or closed without an
 * award — it is "searching for funding". Where each application stands is
 * shown on the application itself.
 */
export function projectStatusFromApplications(current: ProjectStatus, records: ApplicationRecord[]): ProjectStatus {
  if (records.length === 0 || PAST_APPLICATION_STAGE.includes(current)) return current;
  if (records.some((r) => r.status === "awarded")) return "funded";
  return "funding-search";
}

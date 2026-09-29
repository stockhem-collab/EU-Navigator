import { ApplicationRecord } from "@/lib/types";

// Example applications, so the demo shows the whole chain from the start
// — Översikt, Ansöka and the project pages would otherwise all open empty.
// Consistent with the rest of the seed data: the two grants in grants.ts
// are the awarded applications of pb-1 and pb-3, and pb-5 (searching for
// funding) has an application with the funder. Used only when this
// browser has never stored any application records (see
// readApplicationRecords); once the user has any, including none after
// deleting them all, these are not added again.
export const seedApplications: ApplicationRecord[] = [
  {
    id: "pb-1:life-2027-climate-schools",
    projectId: "pb-1",
    callId: "life-2027-climate-schools",
    status: "awarded",
    awardedProjectId: "ap-1",
    createdAt: "2025-09-02T09:00:00.000Z",
    updatedAt: "2026-02-10T09:00:00.000Z",
    submittedAt: "2025-10-15T09:00:00.000Z",
  },
  {
    id: "pb-3:esf-2027-care-skills",
    projectId: "pb-3",
    callId: "esf-2027-care-skills",
    status: "awarded",
    awardedProjectId: "ap-2",
    createdAt: "2025-08-20T09:00:00.000Z",
    updatedAt: "2026-01-20T09:00:00.000Z",
    submittedAt: "2025-09-30T09:00:00.000Z",
  },
  {
    id: "pb-5:interreg-2027-nordic-climate",
    projectId: "pb-5",
    callId: "interreg-2027-nordic-climate",
    status: "submitted",
    createdAt: "2026-06-01T09:00:00.000Z",
    updatedAt: "2026-09-01T09:00:00.000Z",
    submittedAt: "2026-09-01T09:00:00.000Z",
  },
];

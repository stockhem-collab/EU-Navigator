"use client";

import { ApplicationStatus } from "@/lib/types";

// Things people do in the system that others should hear about — the
// user-generated half of the notifications (the other half is derived from
// the data itself: deadlines, returned reports, matching calls…; see
// lib/notifications.ts). Browser-only, like everything else in the demo:
// in a real deployment this is the server-side event log notifications and
// e-mails are sent from.
const STORAGE_KEY = "eu-navigator-activity-log";
const MAX_ENTRIES = 100;

/** Fired on window whenever data the notifications are built from changes
 * outside a page navigation, so they can be recomputed straight away. */
export const DATA_CHANGED_EVENT = "eu-navigator:data-changed";

export type ActivityEntry =
  | { id: string; at: string; kind: "application-status"; applicationId: string; projectId: string; callId: string; status: ApplicationStatus }
  | { id: string; at: string; kind: "grant-registered"; grantId: string; projectId: string; callId: string }
  | { id: string; at: string; kind: "project-shared"; projectId: string; unitName: string }
  | { id: string; at: string; kind: "call-imported"; callId: string; programId: string };

type NewActivity = ActivityEntry extends infer E ? (E extends ActivityEntry ? Omit<E, "id" | "at"> : never) : never;

// Dispatched asynchronously: callers write storage from inside React state
// updaters, where synchronously updating another component is not allowed.
export function notifyDataChanged() {
  if (typeof window === "undefined") return;
  window.setTimeout(() => window.dispatchEvent(new Event(DATA_CHANGED_EVENT)), 0);
}

export function readActivity(): ActivityEntry[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function logActivity(entry: NewActivity) {
  try {
    const at = new Date().toISOString();
    const next = [{ ...entry, id: `act-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`, at }, ...readActivity()];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next.slice(0, MAX_ENTRIES)));
  } catch {
    // localStorage unavailable — the event just isn't recorded.
  }
  notifyDataChanged();
}

"use client";

import { useCallback, useEffect, useState } from "react";
import { notifyDataChanged } from "@/lib/hooks/useActivityLog";

// What each user wants to be notified about, where, and how far ahead.
// Stored per browser in the demo; e-mail choices are saved but nothing is
// actually sent until the system is connected to an e-mail service.
const STORAGE_KEY = "eu-navigator-notification-preferences";

export type NotificationCategory = "deadlines" | "calls" | "applications" | "reporting" | "projects" | "system";

export const NOTIFICATION_CATEGORIES: NotificationCategory[] = [
  "deadlines",
  "reporting",
  "applications",
  "calls",
  "projects",
  "system",
];

export type EmailMode = "off" | "instant" | "daily" | "weekly";

export interface CategoryPreference {
  inApp: boolean;
  email: EmailMode;
}

export interface NotificationPreferences {
  categories: Record<NotificationCategory, CategoryPreference>;
  /** "mine": only notifications about projects the user has a role in or
   * that are shared with their unit (calls and system notices always
   * show). "all": the whole organisation's. */
  scope: "mine" | "all";
  /** How many months ahead a deadline starts producing reminders. */
  leadMonths: 1 | 2 | 3;
}

// Sensible defaults so nobody has to configure anything for it to be
// useful: everything in the app, e-mail only for what's time-critical,
// and a weekly digest for new calls rather than one mail per call.
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  categories: {
    deadlines: { inApp: true, email: "daily" },
    reporting: { inApp: true, email: "instant" },
    applications: { inApp: true, email: "daily" },
    calls: { inApp: true, email: "weekly" },
    projects: { inApp: true, email: "off" },
    system: { inApp: true, email: "off" },
  },
  scope: "all",
  leadMonths: 2,
};

const EMAIL_MODES: EmailMode[] = ["off", "instant", "daily", "weekly"];

export function readNotificationPreferences(): NotificationPreferences {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NOTIFICATION_PREFERENCES;
    const parsed = JSON.parse(raw);
    const categories = { ...DEFAULT_NOTIFICATION_PREFERENCES.categories };
    for (const key of NOTIFICATION_CATEGORIES) {
      const c = parsed?.categories?.[key];
      if (c && typeof c === "object") {
        categories[key] = {
          inApp: typeof c.inApp === "boolean" ? c.inApp : categories[key].inApp,
          email: EMAIL_MODES.includes(c.email) ? c.email : categories[key].email,
        };
      }
    }
    return {
      categories,
      scope: parsed?.scope === "mine" ? "mine" : "all",
      leadMonths: [1, 2, 3].includes(parsed?.leadMonths) ? parsed.leadMonths : DEFAULT_NOTIFICATION_PREFERENCES.leadMonths,
    };
  } catch {
    return DEFAULT_NOTIFICATION_PREFERENCES;
  }
}

export function useNotificationPreferences() {
  const [prefs, setPrefs] = useState<NotificationPreferences>(DEFAULT_NOTIFICATION_PREFERENCES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setPrefs(readNotificationPreferences());
    setHydrated(true);
  }, []);

  const update = useCallback((change: (prev: NotificationPreferences) => NotificationPreferences) => {
    setPrefs((prev) => {
      const next = change(prev);
      try {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // localStorage unavailable — the choice lasts this session only.
      }
      return next;
    });
    notifyDataChanged();
  }, []);

  const setCategory = useCallback(
    (category: NotificationCategory, patch: Partial<CategoryPreference>) =>
      update((prev) => ({
        ...prev,
        categories: { ...prev.categories, [category]: { ...prev.categories[category], ...patch } },
      })),
    [update]
  );

  const setScope = useCallback((scope: NotificationPreferences["scope"]) => update((prev) => ({ ...prev, scope })), [update]);
  const setLeadMonths = useCallback(
    (leadMonths: NotificationPreferences["leadMonths"]) => update((prev) => ({ ...prev, leadMonths })),
    [update]
  );
  const reset = useCallback(() => update(() => DEFAULT_NOTIFICATION_PREFERENCES), [update]);

  return { prefs, hydrated, setCategory, setScope, setLeadMonths, reset };
}

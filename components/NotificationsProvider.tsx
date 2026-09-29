"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname } from "next/navigation";
import { useApplications } from "@/lib/hooks/useApplications";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useGrants } from "@/lib/hooks/useGrants";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import { useProjectTasks } from "@/lib/hooks/useProjectTasks";
import { useWatchPreferences } from "@/lib/hooks/useWatchPreferences";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { DATA_CHANGED_EVENT, readActivity } from "@/lib/hooks/useActivityLog";
import { readNotificationPreferences } from "@/lib/hooks/useNotificationPreferences";
import { findProgram } from "@/lib/data/fundingPrograms";
import { callDeadlineMonths } from "@/lib/data/fundingCalls";
import { CURRENT_USER_ID, isProjectRelevantToUser, orgUnits as seedOrgUnits } from "@/lib/data/users";
import { computeMatchesForCall } from "@/lib/matching/portfolio";
import { AppNotification, computeNotifications, filterForUser } from "@/lib/notifications";

// One place that builds the notification list, shared by the bell in the
// header and the unread markers on Översikt / Ansöka / Rapportera rows —
// so it's computed once per page, not once per row.
//
// The data hooks read browser storage once, on mount. Rather than
// teaching each of them to share state, the part that reads them
// (NotificationsSource) is remounted on every navigation and whenever
// something signals a change (DATA_CHANGED_EVENT, or another tab via the
// "storage" event); only it remounts, not the page.

const READ_KEY = "eu-navigator-notifications-read";
const MAX_READ_IDS = 500;
const STRONG_MATCH_SCORE = 75;

interface NotificationsContextValue {
  ready: boolean;
  items: AppNotification[];
  unreadCount: number;
  isUnread: (id: string) => boolean;
  unreadForEntity: (entityKey: string) => number;
  markRead: (id: string) => void;
  markAllRead: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue>({
  ready: false,
  items: [],
  unreadCount: 0,
  isUnread: () => false,
  unreadForEntity: () => 0,
  markRead: () => {},
  markAllRead: () => {},
});

export function useNotifications() {
  return useContext(NotificationsContext);
}

function readReadIds(): string[] {
  try {
    const parsed = JSON.parse(window.localStorage.getItem(READ_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeReadIds(ids: string[]) {
  try {
    window.localStorage.setItem(READ_KEY, JSON.stringify(ids.slice(-MAX_READ_IDS)));
  } catch {
    // localStorage unavailable — read state lasts this session only.
  }
}

export default function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [version, setVersion] = useState(0);
  const [items, setItems] = useState<AppNotification[] | null>(null);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setReadIds(new Set(readReadIds()));
    const bump = () => setVersion((v) => v + 1);
    window.addEventListener(DATA_CHANGED_EVENT, bump);
    window.addEventListener("storage", bump);
    return () => {
      window.removeEventListener(DATA_CHANGED_EVENT, bump);
      window.removeEventListener("storage", bump);
    };
  }, []);

  const markRead = useCallback((id: string) => {
    setReadIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev).add(id);
      writeReadIds([...next]);
      return next;
    });
  }, []);

  const markAllRead = useCallback(() => {
    setReadIds((prev) => {
      const next = new Set(prev);
      for (const n of items ?? []) next.add(n.id);
      writeReadIds([...next]);
      return next;
    });
  }, [items]);

  const value = useMemo<NotificationsContextValue>(() => {
    const list = items ?? [];
    const unread = list.filter((n) => !readIds.has(n.id));
    return {
      ready: items !== null,
      items: list,
      unreadCount: unread.length,
      isUnread: (id) => !readIds.has(id),
      unreadForEntity: (key) => unread.filter((n) => n.entityKeys.includes(key)).length,
      markRead,
      markAllRead,
    };
  }, [items, readIds, markRead, markAllRead]);

  return (
    <NotificationsContext.Provider value={value}>
      <NotificationsSource key={`${pathname}|${version}`} onReady={setItems} />
      {children}
    </NotificationsContext.Provider>
  );
}

function NotificationsSource({ onReady }: { onReady: (items: AppNotification[]) => void }) {
  const { records: applications, hydrated: h1 } = useApplications();
  const { all: projects, hydrated: h2 } = useProjectBank();
  const { all: calls, hydrated: h3 } = useFundingCalls();
  const { all: grants, hydrated: h4 } = useGrants();
  const { withSubmissions, hydrated: h5 } = useReportingSubmissions();
  const { tasks, hydrated: h6 } = useProjectTasks();
  const { prefs: watch, hydrated: h7 } = useWatchPreferences();
  const { users, hydrated: h8 } = useUsersDirectory();
  const { config: orgConfig, hydrated: h9 } = useOrgConfig();
  const ready = h1 && h2 && h3 && h4 && h5 && h6 && h7 && h8 && h9;

  useEffect(() => {
    if (!ready) return;
    const now = new Date();
    const prefs = readNotificationPreferences();
    const strongMatches = calls
      .filter((c) => callDeadlineMonths(c, now) >= 0)
      .flatMap((call) => {
        const program = findProgram(call.programId);
        if (!program) return [];
        return computeMatchesForCall(call, program, projects)
          .filter((m) => m.match.score >= STRONG_MATCH_SCORE && m.match.recommendation !== "low")
          .map((m) => ({ projectId: m.entry.id, callId: call.id, score: m.match.score }));
      });
    const all = computeNotifications({
      now,
      prefs,
      projects,
      calls,
      findProgram,
      applications,
      grants: grants.map(withSubmissions),
      tasks,
      watchedCallIds: watch.callIds,
      watchedProgramIds: watch.programIds,
      strongMatches,
      activity: readActivity(),
    });
    const currentUser = users.find((u) => u.id === CURRENT_USER_ID);
    const orgUnits = orgConfig.units ?? seedOrgUnits;
    const isMine = (projectId: string) => {
      const entry = projects.find((p) => p.id === projectId);
      return entry ? isProjectRelevantToUser(entry, currentUser, orgUnits) : false;
    };
    onReady(filterForUser(all, prefs, isMine));
    // Computed once per mount — the parent remounts this on every change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  return null;
}

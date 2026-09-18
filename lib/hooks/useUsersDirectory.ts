"use client";

import { useCallback, useEffect, useState } from "react";
import { DemoUser, OrgRoleKey, ProjectRoleKey } from "@/lib/types";
import { demoUsers as seedUsers } from "@/lib/data/users";

// Demo "Användare & behörigheter" directory — same no-backend pattern as
// useOrgConfig: overrides on top of the seeded example people, persisted to
// this browser's localStorage. Invites don't send email and removals don't
// revoke real access; there is no backend to enforce any of it (see
// README's "no login, no backend" note). It exists so the settings UI can
// show a believable multi-person directory instead of a single account.
const STORAGE_KEY = "eu-navigator-users-directory";

interface DirectoryState {
  invited: DemoUser[];
  removedIds: string[];
  edits: Record<string, Partial<Pick<DemoUser, "firstName" | "lastName" | "email" | "phone" | "unitId" | "orgRole">>>;
  projectRoleEdits: Record<string, Record<string, ProjectRoleKey | null>>; // userId -> projectId -> role (null = removed)
}

const EMPTY: DirectoryState = { invited: [], removedIds: [], edits: {}, projectRoleEdits: {} };

function read(): DirectoryState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw);
    return {
      invited: Array.isArray(parsed.invited) ? parsed.invited : [],
      removedIds: Array.isArray(parsed.removedIds) ? parsed.removedIds : [],
      edits: parsed.edits && typeof parsed.edits === "object" ? parsed.edits : {},
      projectRoleEdits: parsed.projectRoleEdits && typeof parsed.projectRoleEdits === "object" ? parsed.projectRoleEdits : {},
    };
  } catch {
    return EMPTY;
  }
}

function write(state: DirectoryState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage unavailable — overrides just won't persist.
  }
}

function resolveUsers(state: DirectoryState): DemoUser[] {
  const base = [...seedUsers, ...state.invited].filter((u) => !state.removedIds.includes(u.id));
  return base.map((u) => {
    const edit = state.edits[u.id];
    const roleEdits = state.projectRoleEdits[u.id];
    let projectRoles = u.projectRoles;
    if (roleEdits) {
      const byProject = new Map(projectRoles.map((r) => [r.projectId, r.role]));
      for (const [projectId, role] of Object.entries(roleEdits)) {
        if (role === null) byProject.delete(projectId);
        else byProject.set(projectId, role);
      }
      projectRoles = Array.from(byProject, ([projectId, role]) => ({ projectId, role }));
    }
    return edit ? { ...u, ...edit, projectRoles } : { ...u, projectRoles };
  });
}

let inviteIdCounter = 0;
function newUserId(): string {
  inviteIdCounter += 1;
  return `invited-${Date.now()}-${inviteIdCounter}`;
}

export interface InviteInput {
  firstName: string;
  lastName: string;
  email: string;
  unitId: string | null;
  orgRole: OrgRoleKey;
}

export function useUsersDirectory() {
  const [state, setState] = useState<DirectoryState>(EMPTY);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
  }, []);

  const update = useCallback((updater: (prev: DirectoryState) => DirectoryState) => {
    setState((prev) => {
      const next = updater(prev);
      write(next);
      return next;
    });
  }, []);

  const inviteUser = useCallback(
    (input: InviteInput) =>
      update((prev) => ({
        ...prev,
        invited: [
          ...prev.invited,
          {
            id: newUserId(),
            firstName: input.firstName.trim(),
            lastName: input.lastName.trim(),
            email: input.email.trim(),
            title_sv: "",
            title_en: "",
            unitId: input.unitId,
            orgRole: input.orgRole,
            status: "invited",
            ssoManaged: false,
            projectRoles: [],
          },
        ],
      })),
    [update]
  );

  const removeUser = useCallback(
    (id: string) =>
      update((prev) => ({
        ...prev,
        invited: prev.invited.filter((u) => u.id !== id),
        removedIds: prev.invited.some((u) => u.id === id) ? prev.removedIds : [...prev.removedIds, id],
      })),
    [update]
  );

  const updateProfile = useCallback(
    (id: string, patch: Partial<Pick<DemoUser, "firstName" | "lastName" | "email" | "phone" | "unitId">>) =>
      update((prev) => ({ ...prev, edits: { ...prev.edits, [id]: { ...prev.edits[id], ...patch } } })),
    [update]
  );

  const setOrgRole = useCallback(
    (id: string, role: OrgRoleKey) =>
      update((prev) => ({ ...prev, edits: { ...prev.edits, [id]: { ...prev.edits[id], orgRole: role } } })),
    [update]
  );

  const setProjectRole = useCallback(
    (userId: string, projectId: string, role: ProjectRoleKey | null) =>
      update((prev) => ({
        ...prev,
        projectRoleEdits: {
          ...prev.projectRoleEdits,
          [userId]: { ...prev.projectRoleEdits[userId], [projectId]: role },
        },
      })),
    [update]
  );

  const resetAll = useCallback(() => {
    setState(EMPTY);
    write(EMPTY);
  }, []);

  return {
    users: resolveUsers(state),
    hydrated,
    inviteUser,
    removeUser,
    updateProfile,
    setOrgRole,
    setProjectRole,
    resetAll,
  };
}

import { DemoUser, OrgRoleKey, OrgUnit, ProjectBankEntry, ProjectRoleKey } from "@/lib/types";

// Illustrative example organisation structure and people — one plausible
// setup a municipality could have, editable in Organisationsinställningar,
// not a system default.
export const orgUnits: OrgUnit[] = [
  { id: "u-root", name: "Exempelstad", parentId: null },
  { id: "u-slk", name: "Stadsledningskontoret", parentId: "u-root" },
  { id: "u-service", name: "Serviceförvaltningen", parentId: "u-root" },
  { id: "u-social", name: "Socialförvaltningen", parentId: "u-root" },
  { id: "u-miljo", name: "Miljöförvaltningen", parentId: "u-root" },
];

export const orgRoleLabels: Record<OrgRoleKey, { sv: string; en: string }> = {
  "org-admin": { sv: "Organisationsadministratör", en: "Organisation administrator" },
  "eu-coordinator": { sv: "EU-samordnare", en: "EU coordinator" },
  finance: { sv: "Ekonomi", en: "Finance" },
  "read-only": { sv: "Läsbehörighet", en: "Read-only" },
};

export const projectRoleLabels: Record<ProjectRoleKey, { sv: string; en: string }> = {
  "project-owner": { sv: "Projektägare", en: "Project owner" },
  "project-lead": { sv: "Projektledare", en: "Project leader" },
  "application-owner": { sv: "Ansvarig för ansökan", en: "Application owner" },
  economist: { sv: "Ekonom", en: "Economist" },
  "reporting-owner": { sv: "Rapporteringsansvarig", en: "Reporting owner" },
  "project-member": { sv: "Projektmedlem", en: "Project member" },
  "read-only": { sv: "Läsbehörighet", en: "Read-only" },
};

/** Which rights each organisation role grants — Visa/Redigera/Skicka
 * in/Godkänna/Administrera. Used only to render the permission matrix;
 * nothing in the demo actually enforces it (no backend). */
export const orgRolePermissions: Record<OrgRoleKey, { view: boolean; edit: boolean; submit: boolean; approve: boolean; manageUsers: boolean }> = {
  "org-admin": { view: true, edit: true, submit: true, approve: true, manageUsers: true },
  "eu-coordinator": { view: true, edit: true, submit: true, approve: false, manageUsers: false },
  finance: { view: true, edit: true, submit: false, approve: false, manageUsers: false },
  "read-only": { view: true, edit: false, submit: false, approve: false, manageUsers: false },
};

/** The demo's "logged in" user. Min profil always edits this person, and
 * Mina projekt's "mina och delade" filter uses it as the viewer. */
export const CURRENT_USER_ID = "u-1";

/** How many parentId hops `id` is from a root unit (depth 0). */
export function unitDepth(units: OrgUnit[], id: string): number {
  let depth = 0;
  let current = units.find((u) => u.id === id);
  while (current && current.parentId) {
    depth += 1;
    current = units.find((u) => u.id === current!.parentId);
  }
  return depth;
}

/** The two organisation levels project sharing is scoped to — the whole
 * organisation (root) and its immediate departments — matching "kommunen
 * totalt eller specifik förvaltning" rather than exposing every level a
 * customised org tree might grow beneath that. */
export function shareableUnits(units: OrgUnit[]): OrgUnit[] {
  return units.filter((u) => unitDepth(units, u.id) <= 1);
}

/** True when someone in `viewerUnitId` should see a project shared with
 * `sharedUnitId` — sharing with a unit reaches that unit and everyone
 * below it, so this walks up from the viewer's own unit rather than down
 * from the shared one. Sharing with the root unit therefore reaches every
 * viewer, regardless of which department they belong to. */
export function unitIncludesUnit(units: OrgUnit[], sharedUnitId: string, viewerUnitId: string): boolean {
  let current = units.find((u) => u.id === viewerUnitId);
  while (current) {
    if (current.id === sharedUnitId) return true;
    current = current.parentId ? units.find((u) => u.id === current!.parentId) : undefined;
  }
  return false;
}

/** True once a project counts as "mine" for `viewer` — it has a role
 * assignment for them, or has been explicitly shared (see
 * ProjectBankEntry.sharedWithUnitIds) with an org unit that reaches their
 * own unit. The single definition behind every "mina och delade projekt"
 * filter in the system (Mina projekt, and Översikt's Verksamhetsutvecklare
 * view), so they all agree on what "shared with me" means. */
export function isProjectRelevantToUser(entry: ProjectBankEntry, viewer: DemoUser | undefined, units: OrgUnit[]): boolean {
  if (!viewer) return true;
  if (viewer.projectRoles.some((r) => r.projectId === entry.id)) return true;
  if (!viewer.unitId) return false;
  return (entry.sharedWithUnitIds ?? []).some((unitId) => unitIncludesUnit(units, unitId, viewer.unitId!));
}

const PROJECT_ROLE_PRIORITY: ProjectRoleKey[] = [
  "project-owner",
  "project-lead",
  "application-owner",
  "economist",
  "reporting-owner",
  "project-member",
  "read-only",
];

export interface ProjectAssignmentSummary {
  user: DemoUser;
  role: ProjectRoleKey;
  /** How many other people also have a role on this project, so a card can
   * show "+2 more" instead of only ever naming one person. */
  othersCount: number;
}

/** The most senior person assigned to a project (Användare & behörigheter's
 * project-role assignments), so Projektbank can surface "who owns this"
 * instead of that assignment only being visible on the settings page. */
export function primaryProjectAssignment(users: DemoUser[], projectId: string): ProjectAssignmentSummary | null {
  const assigned = users
    .map((u) => {
      const role = u.projectRoles.find((r) => r.projectId === projectId)?.role;
      return role ? { user: u, role } : null;
    })
    .filter((a): a is { user: DemoUser; role: ProjectRoleKey } => a !== null)
    .sort((a, b) => PROJECT_ROLE_PRIORITY.indexOf(a.role) - PROJECT_ROLE_PRIORITY.indexOf(b.role));
  if (assigned.length === 0) return null;
  const [primary, ...rest] = assigned;
  return { user: primary.user, role: primary.role, othersCount: rest.length };
}

export const demoUsers: DemoUser[] = [
  {
    id: "u-1",
    firstName: "Andrea",
    lastName: "Lindqvist",
    email: "andrea.lindqvist@exempelstad.se",
    phone: "+46 70 123 45 67",
    title_sv: "EU-samordnare",
    title_en: "EU coordinator",
    unitId: "u-slk",
    orgRole: "org-admin",
    status: "active",
    ssoManaged: true,
    projectRoles: [
      { projectId: "pb-1", role: "project-lead" },
      { projectId: "pb-2", role: "project-member" },
    ],
  },
  {
    id: "u-2",
    firstName: "Erik",
    lastName: "Berg",
    email: "erik.berg@exempelstad.se",
    title_sv: "Ekonom",
    title_en: "Economist",
    unitId: "u-service",
    orgRole: "finance",
    status: "active",
    ssoManaged: true,
    projectRoles: [{ projectId: "pb-1", role: "economist" }],
  },
  {
    id: "u-3",
    firstName: "Lisa",
    lastName: "Svensson",
    email: "lisa.svensson@exempelstad.se",
    title_sv: "Projektledare",
    title_en: "Project manager",
    unitId: "u-social",
    orgRole: "read-only",
    status: "active",
    ssoManaged: true,
    projectRoles: [
      { projectId: "pb-2", role: "project-lead" },
      { projectId: "pb-3", role: "read-only" },
    ],
  },
  {
    id: "u-4",
    firstName: "Johan",
    lastName: "Nilsson",
    email: "johan.nilsson@exempelstad.se",
    title_sv: "Miljöstrateg",
    title_en: "Environmental strategist",
    unitId: "u-miljo",
    orgRole: "read-only",
    status: "invited",
    ssoManaged: false,
    projectRoles: [],
  },
];

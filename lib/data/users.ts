import { DemoUser, OrgRoleKey, OrgUnit, ProjectRoleKey } from "@/lib/types";

// Illustrative example organisation structure and people — same status as
// orgProcess.ts's role example: one plausible setup a municipality could
// have, editable in Organisationsinställningar, not a system default.
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

/** The demo's "logged in" user. Min profil always edits this person. */
export const CURRENT_USER_ID = "u-1";

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

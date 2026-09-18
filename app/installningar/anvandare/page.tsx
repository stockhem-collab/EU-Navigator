"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useUsersDirectory, InviteInput } from "@/lib/hooks/useUsersDirectory";
import { orgUnits, orgRoleLabels, projectRoleLabels, orgRolePermissions } from "@/lib/data/users";
import { projectBank } from "@/lib/data/projectBank";
import { DemoUser, OrgRoleKey, ProjectRoleKey } from "@/lib/types";

const ORG_ROLE_KEYS = Object.keys(orgRoleLabels) as OrgRoleKey[];
const PROJECT_ROLE_KEYS = Object.keys(projectRoleLabels) as ProjectRoleKey[];

function unitName(unitId: string | null): string {
  return orgUnits.find((u) => u.id === unitId)?.name ?? "—";
}

export default function UsersSettingsPage() {
  const { t, lang } = useLanguage();
  const us = t.usersSettings;
  const { users, hydrated, inviteUser, removeUser, setOrgRole, setProjectRole } = useUsersDirectory();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<OrgRoleKey | "all">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [inviting, setInviting] = useState(false);
  const [inviteForm, setInviteForm] = useState<InviteInput>({
    firstName: "",
    lastName: "",
    email: "",
    unitId: orgUnits[0]?.id ?? null,
    orgRole: "read-only",
  });

  if (!hydrated) return null;

  const filtered = users.filter((u) => {
    const matchesSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter === "all" || u.orgRole === roleFilter;
    return matchesSearch && matchesRole;
  });

  const selected = users.find((u) => u.id === selectedId) ?? null;

  if (selected) {
    return (
      <UserDetail
        user={selected}
        onBack={() => setSelectedId(null)}
        setOrgRole={setOrgRole}
        setProjectRole={setProjectRole}
        onRemove={() => {
          removeUser(selected.id);
          setSelectedId(null);
        }}
      />
    );
  }

  return (
    <>
      <Header />
      <main className="section max-w-4xl">
        <Link href="/installningar" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          {us.back}
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-navy-900">{us.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{us.subtitle}</p>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={us.searchPlaceholder}
            className="w-64 rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value as OrgRoleKey | "all")}
            className="rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            <option value="all">{us.roleFilterAll}</option>
            {ORG_ROLE_KEYS.map((key) => (
              <option key={key} value={key}>
                {orgRoleLabels[key][lang]}
              </option>
            ))}
          </select>
          <button
            type="button"
            onClick={() => setInviting((v) => !v)}
            className="ml-auto rounded-md bg-navy-700 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800"
          >
            {us.invite}
          </button>
        </div>

        {inviting && (
          <div className="mt-4 rounded-xl border border-navy-100 bg-white p-5">
            <p className="font-semibold text-navy-900">{us.inviteTitle}</p>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <input
                value={inviteForm.firstName}
                onChange={(e) => setInviteForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder={us.inviteFirstName}
                className="rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <input
                value={inviteForm.lastName}
                onChange={(e) => setInviteForm((f) => ({ ...f, lastName: e.target.value }))}
                placeholder={us.inviteLastName}
                className="rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <input
                value={inviteForm.email}
                onChange={(e) => setInviteForm((f) => ({ ...f, email: e.target.value }))}
                placeholder={us.inviteEmail}
                className="rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <select
                value={inviteForm.unitId ?? ""}
                onChange={(e) => setInviteForm((f) => ({ ...f, unitId: e.target.value || null }))}
                className="rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                {orgUnits.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name}
                  </option>
                ))}
              </select>
              <select
                value={inviteForm.orgRole}
                onChange={(e) => setInviteForm((f) => ({ ...f, orgRole: e.target.value as OrgRoleKey }))}
                className="rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                {ORG_ROLE_KEYS.map((key) => (
                  <option key={key} value={key}>
                    {orgRoleLabels[key][lang]}
                  </option>
                ))}
              </select>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                onClick={() => {
                  if (!inviteForm.firstName.trim() || !inviteForm.email.trim()) return;
                  inviteUser(inviteForm);
                  setInviteForm({ firstName: "", lastName: "", email: "", unitId: orgUnits[0]?.id ?? null, orgRole: "read-only" });
                  setInviting(false);
                }}
                className="rounded-md bg-gold-500 px-3 py-2 text-xs font-semibold text-navy-900 hover:bg-gold-400"
              >
                {us.inviteSubmit}
              </button>
              <button
                type="button"
                onClick={() => setInviting(false)}
                className="rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50"
              >
                {us.inviteCancel}
              </button>
            </div>
          </div>
        )}

        <div className="mt-6 overflow-hidden rounded-xl border border-navy-100 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-navy-100 bg-navy-50/60 text-xs font-semibold uppercase text-navy-500">
              <tr>
                <th className="px-4 py-3">{us.columnUser}</th>
                <th className="px-4 py-3">{us.columnUnit}</th>
                <th className="px-4 py-3">{us.columnRole}</th>
                <th className="px-4 py-3">{us.columnStatus}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <tr
                  key={u.id}
                  onClick={() => setSelectedId(u.id)}
                  className="cursor-pointer border-b border-navy-50 last:border-0 hover:bg-navy-50/50"
                >
                  <td className="px-4 py-3">
                    <p className="font-semibold text-navy-800">
                      {u.firstName} {u.lastName}
                    </p>
                    <p className="text-xs text-navy-400">{u.email}</p>
                  </td>
                  <td className="px-4 py-3 text-navy-600">{unitName(u.unitId)}</td>
                  <td className="px-4 py-3 text-navy-600">{orgRoleLabels[u.orgRole][lang]}</td>
                  <td className="px-4 py-3">
                    <span className={u.status === "active" ? "text-green-700" : "text-navy-400"}>
                      {u.status === "active" ? us.statusActive : us.statusInvited}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mb-16 mt-8 rounded-xl border border-navy-100 bg-white p-6">
          <p className="text-sm font-semibold text-navy-800">{us.permissionMatrixTitle}</p>
          <table className="mt-3 w-full text-left text-xs">
            <thead className="text-navy-400">
              <tr>
                <th className="py-1.5 pr-4">{us.columnRole}</th>
                <th className="px-2">{us.permView}</th>
                <th className="px-2">{us.permEdit}</th>
                <th className="px-2">{us.permSubmit}</th>
                <th className="px-2">{us.permApprove}</th>
                <th className="px-2">{us.permManageUsers}</th>
              </tr>
            </thead>
            <tbody>
              {ORG_ROLE_KEYS.map((key) => {
                const perm = orgRolePermissions[key];
                return (
                  <tr key={key} className="border-t border-navy-50 text-navy-700">
                    <td className="py-1.5 pr-4 font-semibold">{orgRoleLabels[key][lang]}</td>
                    <td className="px-2">{perm.view ? "✓" : ""}</td>
                    <td className="px-2">{perm.edit ? "✓" : ""}</td>
                    <td className="px-2">{perm.submit ? "✓" : ""}</td>
                    <td className="px-2">{perm.approve ? "✓" : ""}</td>
                    <td className="px-2">{perm.manageUsers ? "✓" : ""}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </>
  );
}

function UserDetail({
  user,
  onBack,
  setOrgRole,
  setProjectRole,
  onRemove,
}: {
  user: DemoUser;
  onBack: () => void;
  setOrgRole: (id: string, role: OrgRoleKey) => void;
  setProjectRole: (userId: string, projectId: string, role: ProjectRoleKey | null) => void;
  onRemove: () => void;
}) {
  const { t, lang } = useLanguage();
  const us = t.usersSettings;
  const [newProjectId, setNewProjectId] = useState("");

  const assignedIds = useMemo(() => new Set(user.projectRoles.map((r) => r.projectId)), [user.projectRoles]);
  const availableProjects = projectBank.filter((p) => !assignedIds.has(p.id));

  return (
    <>
      <Header />
      <main className="section max-w-2xl">
        <button type="button" onClick={onBack} className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          {us.detailBack}
        </button>

        <div className="mt-4 flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-navy-700 text-base font-bold text-white">
            {user.firstName[0]}
            {user.lastName[0]}
          </span>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-navy-900">
              {user.firstName} {user.lastName}
            </h1>
            <p className="text-sm text-navy-500">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={() => {
              if (window.confirm(us.confirmRemove(`${user.firstName} ${user.lastName}`))) onRemove();
            }}
            className="shrink-0 text-xs font-semibold text-navy-400 hover:text-red-600"
          >
            {us.remove}
          </button>
        </div>

        <div className="mb-16 mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <label className="block text-sm font-semibold text-navy-700">{us.detailOrgRole}</label>
          <select
            value={user.orgRole}
            onChange={(e) => setOrgRole(user.id, e.target.value as OrgRoleKey)}
            className="mt-1 w-full max-w-xs rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            {ORG_ROLE_KEYS.map((key) => (
              <option key={key} value={key}>
                {orgRoleLabels[key][lang]}
              </option>
            ))}
          </select>

          <div className="mt-6 border-t border-navy-50 pt-5">
            <p className="text-sm font-semibold text-navy-700">{us.detailProjectRoles}</p>
            {user.projectRoles.length === 0 && <p className="mt-2 text-xs text-navy-400">{us.noProjectRoles}</p>}
            <ul className="mt-2 space-y-2">
              {user.projectRoles.map((assignment) => {
                const project = projectBank.find((p) => p.id === assignment.projectId);
                if (!project) return null;
                return (
                  <li key={assignment.projectId} className="flex items-center gap-2 rounded-md border border-navy-100 px-3 py-2">
                    <span className="flex-1 text-sm text-navy-800">{lang === "sv" ? project.title_sv : project.title_en}</span>
                    <select
                      value={assignment.role}
                      onChange={(e) => setProjectRole(user.id, assignment.projectId, e.target.value as ProjectRoleKey)}
                      className="rounded-md border border-navy-200 px-2 py-1 text-xs focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                    >
                      {PROJECT_ROLE_KEYS.map((key) => (
                        <option key={key} value={key}>
                          {projectRoleLabels[key][lang]}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setProjectRole(user.id, assignment.projectId, null)}
                      className="text-xs font-semibold text-navy-400 hover:text-red-600"
                    >
                      {us.removeRole}
                    </button>
                  </li>
                );
              })}
            </ul>

            {availableProjects.length > 0 && (
              <div className="mt-3 flex items-center gap-2">
                <select
                  value={newProjectId}
                  onChange={(e) => setNewProjectId(e.target.value)}
                  className="flex-1 rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                >
                  <option value="">{us.projectRolePlaceholder}</option>
                  {availableProjects.map((p) => (
                    <option key={p.id} value={p.id}>
                      {lang === "sv" ? p.title_sv : p.title_en}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    if (!newProjectId) return;
                    setProjectRole(user.id, newProjectId, "project-member");
                    setNewProjectId("");
                  }}
                  className="shrink-0 rounded-md bg-navy-700 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800"
                >
                  {us.addProjectRole}
                </button>
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { orgProcessPhases, masterRoles } from "@/lib/data/orgProcess";
import { useOrgConfig, roleLabel, OrgTextField } from "@/lib/hooks/useOrgConfig";
import { orgUnits as seedOrgUnits } from "@/lib/data/users";
import { OrgUnit } from "@/lib/types";

function buildTree(units: OrgUnit[]): { unit: OrgUnit; depth: number }[] {
  const byParent = new Map<string | null, OrgUnit[]>();
  for (const u of units) byParent.set(u.parentId, [...(byParent.get(u.parentId) ?? []), u]);
  const result: { unit: OrgUnit; depth: number }[] = [];
  const visit = (parentId: string | null, depth: number) => {
    for (const u of byParent.get(parentId) ?? []) {
      result.push({ unit: u, depth });
      visit(u.id, depth + 1);
    }
  };
  visit(null, 0);
  return result;
}

/** How many descendants removing this unit would cascade-delete (removeUnit
 * in useOrgConfig drops a unit's whole subtree), so we can warn before it
 * happens rather than after. */
function countDescendants(units: OrgUnit[], id: string): number {
  let count = 0;
  for (const u of units) {
    if (u.parentId === id) count += 1 + countDescendants(units, u.id);
  }
  return count;
}

export default function OrganisationSettingsPage() {
  const { t, lang } = useLanguage();
  const os = t.orgSettings;
  const { config, hydrated, setOrganisationName, setOrgField, setTasksFor, setRoleName, addUnit, renameUnit, removeUnit, resetAll } =
    useOrgConfig();
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitParent, setNewUnitParent] = useState<string>("");

  if (!hydrated) return null;

  const orgName = config.organisationName ?? orgProcessPhases[0]?.roleExample?.organisationName ?? "";
  const units = config.units ?? seedOrgUnits;
  const tree = buildTree(units);

  const registryFields: { field: OrgTextField; label: string; placeholder: string }[] = [
    { field: "orgNumber", label: os.orgNumberLabel, placeholder: "212000-0142" },
    { field: "orgType", label: os.orgTypeLabel, placeholder: "Kommun" },
    { field: "country", label: os.countryLabel, placeholder: "Sverige" },
    { field: "website", label: os.websiteLabel, placeholder: "https://www.exempelstad.se" },
    { field: "pic", label: os.picLabel, placeholder: "999999999" },
    { field: "contactName", label: os.contactNameLabel, placeholder: "Andrea Lindqvist" },
    { field: "contactEmail", label: os.contactEmailLabel, placeholder: "andrea.lindqvist@exempelstad.se" },
  ];

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <Link href="/installningar" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          {os.back}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{os.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{os.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="shrink-0 rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50"
          >
            {os.resetAll}
          </button>
        </div>

        <div className="mt-8">
          <label className="block text-sm font-semibold text-navy-800">{os.orgNameLabel}</label>
          <input
            value={orgName}
            onChange={(e) => setOrganisationName(e.target.value)}
            placeholder={os.orgNamePlaceholder}
            className="mt-1 w-full max-w-sm rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>

        <section className="mt-8 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="font-bold text-navy-900">{os.registryTitle}</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            {registryFields.map((f) => (
              <div key={f.field}>
                <label className="block text-sm font-semibold text-navy-700">{f.label}</label>
                <input
                  value={config[f.field] ?? ""}
                  onChange={(e) => setOrgField(f.field, e.target.value)}
                  placeholder={f.placeholder}
                  className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>
            ))}
          </div>
        </section>

        <section className="mt-8 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="font-bold text-navy-900">{os.structureTitle}</h2>
          <p className="mt-1 text-xs text-navy-400">{os.structureHint}</p>

          <ul className="mt-4 space-y-1.5">
            {tree.map(({ unit, depth }) => (
              <li key={unit.id} className="flex items-center gap-2" style={{ paddingLeft: depth * 20 }}>
                {depth > 0 && <span className="text-navy-300">├─</span>}
                <input
                  value={unit.name}
                  onChange={(e) => renameUnit(unit.id, e.target.value)}
                  className="flex-1 rounded-md border border-transparent px-2 py-1 text-sm text-navy-700 hover:border-navy-200 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    const descendants = countDescendants(units, unit.id);
                    const message =
                      descendants > 0 ? os.confirmRemoveUnitCascade(unit.name, descendants) : os.confirmRemoveUnit(unit.name);
                    if (window.confirm(message)) removeUnit(unit.id);
                  }}
                  className="shrink-0 text-xs font-semibold text-navy-400 hover:text-red-600"
                >
                  {os.removeUnitLabel}
                </button>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <input
              value={newUnitName}
              onChange={(e) => setNewUnitName(e.target.value)}
              placeholder={os.addUnitPlaceholder}
              className="w-48 rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
            <select
              value={newUnitParent}
              onChange={(e) => setNewUnitParent(e.target.value)}
              className="rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                if (!newUnitName.trim()) return;
                addUnit(newUnitName, newUnitParent || units[0]?.id || null);
                setNewUnitName("");
              }}
              className="rounded-md bg-navy-700 px-3 py-2 text-xs font-semibold text-white hover:bg-navy-800"
            >
              {os.addUnitButton}
            </button>
          </div>
        </section>

        <section className="mb-16 mt-8">
          <h2 className="text-lg font-bold text-navy-900">{os.rolesProcessTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{os.rolesProcessHint}</p>

          <div className="mt-5 rounded-xl border border-navy-100 bg-white p-6">
            <label className="block text-sm font-semibold text-navy-800">{os.rolesSectionTitle}</label>
            <p className="mt-1 text-xs text-navy-400">{os.rolesSectionHint}</p>
            <div className="mt-3 grid gap-4 sm:grid-cols-3">
              {masterRoles.map((r) => {
                const defaultName = lang === "sv" ? r.role_sv : r.role_en;
                return (
                  <div key={r.role_sv}>
                    <input
                      value={config.roleNames[r.role_sv] ?? defaultName}
                      onChange={(e) => setRoleName(r.role_sv, e.target.value)}
                      placeholder={os.roleNamePlaceholder(defaultName)}
                      className="w-full rounded-md border border-navy-200 px-3 py-2 text-sm font-semibold text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                    />
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-6 space-y-8">
            {orgProcessPhases.map((phase) => (
              <section key={phase.key} className="rounded-xl border border-navy-100 bg-white p-6">
                <h3 className="font-bold text-navy-900">{lang === "sv" ? phase.title_sv : phase.title_en}</h3>
                <p className="mt-1 text-sm text-navy-500">{lang === "sv" ? phase.desc_sv : phase.desc_en}</p>

                {phase.roleExample && (
                  <div className="mt-5 grid gap-5 sm:grid-cols-3">
                    {phase.roleExample.responsibilities.map((r) => {
                      const overrideTasks = config.phaseTasks[phase.key]?.[r.role_sv];
                      const currentTasks = overrideTasks ?? (lang === "sv" ? r.tasks_sv : r.tasks_en);
                      return (
                        <div key={r.role_sv}>
                          <label className="block text-sm font-semibold text-navy-700">
                            {roleLabel(config, r.role_sv, r.role_en, lang)}
                          </label>
                          <p className="mt-0.5 text-xs text-navy-400">{os.tasksHint}</p>
                          <textarea
                            rows={5}
                            value={currentTasks.join("\n")}
                            onChange={(e) => setTasksFor(phase.key, r.role_sv, e.target.value.split("\n"))}
                            className="mt-2 w-full rounded-md border border-navy-200 px-3 py-2 text-xs text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            ))}
          </div>

          <p className="mt-4 text-xs text-navy-400">{os.savedIndicator}</p>
        </section>
      </main>
      <Footer />
    </>
  );
}

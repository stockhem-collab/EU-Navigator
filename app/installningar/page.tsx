"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { orgProcessPhases, masterRoles } from "@/lib/data/orgProcess";
import { useOrgConfig, roleLabel } from "@/lib/hooks/useOrgConfig";

export default function OrgSettingsPage() {
  const { t, lang } = useLanguage();
  const os = t.orgSettings;
  const { config, hydrated, setOrganisationName, setTasksFor, setRoleName, resetAll } = useOrgConfig();

  if (!hydrated) return null;

  const orgName = config.organisationName ?? orgProcessPhases[0]?.roleExample?.organisationName ?? "";

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
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
          <p className="mt-1 text-xs text-navy-400">{os.savedIndicator}</p>
        </div>

        <div className="mt-8">
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

        <div className="mb-16 mt-8 space-y-8">
          {orgProcessPhases.map((phase) => (
            <section key={phase.key} className="rounded-xl border border-navy-100 bg-white p-6">
              <h2 className="font-bold text-navy-900">{lang === "sv" ? phase.title_sv : phase.title_en}</h2>
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
                          onChange={(e) =>
                            setTasksFor(
                              phase.key,
                              r.role_sv,
                              e.target.value.split("\n").filter((line) => line.trim().length > 0)
                            )
                          }
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
      </main>
      <Footer />
    </>
  );
}

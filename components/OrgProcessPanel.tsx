"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { orgProcessPhases } from "@/lib/data/orgProcess";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";

interface Props {
  phaseKey: string;
  /** When given, shows a readiness-linked ready/blocked message instead of
   * just the reference panel (used on the pre-submission Ansökningsstudio). */
  readinessScore?: number;
}

export default function OrgProcessPanel({ phaseKey, readinessScore }: Props) {
  const { t, lang } = useLanguage();
  const org = t.orgProcess;
  const phase = orgProcessPhases.find((p) => p.key === phaseKey);
  const { config } = useOrgConfig();
  if (!phase) return null;

  const orgName = config.organisationName ?? phase.roleExample?.organisationName ?? "";
  const isCustomised = config.organisationName !== null || Object.keys(config.phaseTasks).length > 0;
  const ready = readinessScore !== undefined && readinessScore >= 75;

  return (
    <section className="rounded-xl border border-navy-100 bg-white p-6">
      <h2 className="text-sm font-semibold uppercase text-navy-400">
        {org.title} — {lang === "sv" ? phase.title_sv : phase.title_en}
      </h2>
      <p className="mt-2 text-sm text-navy-600">{lang === "sv" ? phase.desc_sv : phase.desc_en}</p>

      {phase.documents.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase text-navy-400">{org.documentsLabel}</p>
          <ul className="mt-2 space-y-1">
            {phase.documents.map((d) => (
              <li key={d.title_sv} className="text-sm text-navy-600">
                📄 {lang === "sv" ? d.title_sv : d.title_en}
              </li>
            ))}
          </ul>
        </div>
      )}

      {phase.roleExample && (
        <div className="mt-5 border-t border-navy-50 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-semibold uppercase text-navy-400">{org.rolesLabel}</p>
            <Link href="/installningar" className="text-xs font-semibold text-navy-500 hover:text-navy-800">
              ⚙ {isCustomised ? org.customisedLabel : org.customiseLabel}
            </Link>
          </div>
          <p className="mt-1 text-xs italic text-navy-400">{org.exampleDisclaimer(orgName)}</p>
          <div className="mt-3 grid gap-4 sm:grid-cols-3">
            {phase.roleExample.responsibilities.map((r) => {
              const overrideTasks = config.phaseTasks[phase.key]?.[r.role_sv];
              const tasks = overrideTasks ?? (lang === "sv" ? r.tasks_sv : r.tasks_en);
              return (
                <div key={r.role_sv}>
                  <p className="text-sm font-semibold text-navy-700">{lang === "sv" ? r.role_sv : r.role_en}</p>
                  <ul className="mt-1.5 space-y-1">
                    {tasks.map((task) => (
                      <li key={task} className="text-xs text-navy-500">
                        · {task}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {readinessScore !== undefined && (
        <p
          className={`mt-5 rounded-md p-3 text-sm ${ready ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-800"}`}
        >
          {ready ? org.dualComplianceReady : org.dualComplianceBlocked}
        </p>
      )}
    </section>
  );
}

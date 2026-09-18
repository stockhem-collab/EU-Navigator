"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { fundingCalls } from "@/lib/data/fundingCalls";
import { fundedProjects } from "@/lib/data/fundedProjects";
import { projectRoleLabels } from "@/lib/data/users";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import { computeMatchesForEntry, projectBankEntryToProjectInput } from "@/lib/matching/portfolio";
import { computeSimilarProjects } from "@/lib/matching/similarProjects";
import { fmtSEK } from "@/lib/format";
import { ProjectStatus, Sector } from "@/lib/types";

const SECTORS: Sector[] = ["energy", "climate", "digital", "social", "mobility", "education", "health", "research"];
const STATUSES: ProjectStatus[] = [
  "idea",
  "assessing",
  "funding-search",
  "application",
  "submitted",
  "approved",
  "rejected",
  "running",
  "completed",
];

interface EditDraft {
  title: string;
  department: string;
  description: string;
  owner: string;
  status: ProjectStatus;
  estimatedCostSEK: number;
  periodStart: number;
  periodEnd: number;
  sector: Sector;
  hasInternationalPartner: boolean;
}

export default function ProjectBankDetailPage() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const pb = t.projectBank;
  const results = t.demo.results;

  // Imported (CSV) entries only exist in this browser's localStorage, which
  // isn't available during the server render — so we can't decide "not
  // found" until the project-bank hook has actually finished checking the
  // client. Seeded entries render immediately either way; imported ones
  // appear once `hydrated` flips true.
  const { all, hydrated, updateEntry } = useProjectBank();
  const { users } = useUsersDirectory();
  const entry = all.find((p) => p.id === params.id);
  const assignedUsers = entry ? users.filter((u) => u.projectRoles.some((r) => r.projectId === entry.id)) : [];
  const [draft, setDraft] = useState<EditDraft | null>(null);

  if (!entry) {
    if (!hydrated) return null;
    return (
      <>
        <Header />
        <main className="section max-w-3xl">
          <Link href="/projektbank" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
            ← {pb.back}
          </Link>
          <p className="mt-8 text-sm text-navy-500">{pb.detailNotFound}</p>
        </main>
        <Footer />
      </>
    );
  }

  const missing = lang === "sv" ? entry.missingFields_sv : entry.missingFields_en;
  const matches = computeMatchesForEntry(entry, fundingCalls);
  const similar = computeSimilarProjects(projectBankEntryToProjectInput(entry), fundedProjects);

  const recommendationStyle = (rec: (typeof matches)[number]["recommendation"]) => {
    if (rec === "proceed") return "bg-green-100 text-green-800";
    if (rec === "consider") return "bg-gold-100 text-gold-800";
    return "bg-navy-100 text-navy-600";
  };

  const startEditing = () =>
    setDraft({
      title: lang === "sv" ? entry.title_sv : entry.title_en,
      department: lang === "sv" ? entry.department_sv : entry.department_en,
      description: lang === "sv" ? entry.description_sv : entry.description_en,
      owner: entry.owner,
      status: entry.status,
      estimatedCostSEK: entry.estimatedCostSEK,
      periodStart: entry.periodStart,
      periodEnd: entry.periodEnd,
      sector: entry.sector,
      hasInternationalPartner: entry.hasInternationalPartner,
    });

  const saveEdit = () => {
    if (!draft) return;
    // The project's own idea/notes aren't professionally bilingual content
    // like the seeded reference data — same pattern the CSV importer uses
    // (projectIntake.ts), so an edit made in either language replaces both.
    updateEntry(entry.id, {
      title_sv: draft.title,
      title_en: draft.title,
      department_sv: draft.department,
      department_en: draft.department,
      description_sv: draft.description,
      description_en: draft.description,
      owner: draft.owner,
      status: draft.status,
      estimatedCostSEK: draft.estimatedCostSEK,
      periodStart: draft.periodStart,
      periodEnd: draft.periodEnd,
      sector: draft.sector,
      hasInternationalPartner: draft.hasInternationalPartner,
    });
    setDraft(null);
  };

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <Link href="/projektbank" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          ← {pb.back}
        </Link>

        {draft ? (
          <div className="mt-4 rounded-xl border border-navy-100 bg-white p-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-navy-700">{pb.editFieldTitle}</label>
                <input
                  value={draft.title}
                  onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                  className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700">{pb.columnDepartment}</label>
                <input
                  value={draft.department}
                  onChange={(e) => setDraft({ ...draft, department: e.target.value })}
                  className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700">{pb.detailOwner}</label>
                <input
                  value={draft.owner}
                  onChange={(e) => setDraft({ ...draft, owner: e.target.value })}
                  className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700">{pb.columnStatus}</label>
                <select
                  value={draft.status}
                  onChange={(e) => setDraft({ ...draft, status: e.target.value as ProjectStatus })}
                  className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {pb.statusLabels[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700">{pb.detailThemeLabel}</label>
                <select
                  value={draft.sector}
                  onChange={(e) => setDraft({ ...draft, sector: e.target.value as Sector })}
                  className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                >
                  {SECTORS.map((s) => (
                    <option key={s} value={s}>
                      {t.demo.intake.sectors[s]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-navy-700">{pb.columnCost}</label>
                <input
                  type="number"
                  value={draft.estimatedCostSEK}
                  onChange={(e) => setDraft({ ...draft, estimatedCostSEK: Number(e.target.value) })}
                  className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-navy-700">{t.demo.intake.fieldStartYear}</label>
                  <input
                    type="number"
                    value={draft.periodStart}
                    onChange={(e) => setDraft({ ...draft, periodStart: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-navy-700">{t.demo.intake.fieldEndYear}</label>
                  <input
                    type="number"
                    value={draft.periodEnd}
                    onChange={(e) => setDraft({ ...draft, periodEnd: Number(e.target.value) })}
                    className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-navy-700">{pb.detailDescriptionLabel}</label>
                <textarea
                  rows={4}
                  value={draft.description}
                  onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                  className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                />
              </div>
              <label className="flex items-center gap-2 text-sm font-semibold text-navy-700 sm:col-span-2">
                <input
                  type="checkbox"
                  checked={draft.hasInternationalPartner}
                  onChange={(e) => setDraft({ ...draft, hasInternationalPartner: e.target.checked })}
                />
                {pb.editFieldPartnership}
              </label>
            </div>
            <div className="mt-5 flex items-center gap-2">
              <button
                type="button"
                onClick={saveEdit}
                className="rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 hover:bg-gold-400"
              >
                {pb.editSave}
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                className="rounded-md border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-50"
              >
                {pb.editCancel}
              </button>
              <span className="ml-2 text-xs text-navy-400">{pb.editSavedIndicator}</span>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-navy-900">{lang === "sv" ? entry.title_sv : entry.title_en}</h1>
                <p className="mt-1 text-sm text-navy-500">
                  {lang === "sv" ? entry.department_sv : entry.department_en} · {pb.detailOwner}: {entry.owner}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-3">
                <StatusBadge status={entry.status} />
                <button
                  type="button"
                  onClick={startEditing}
                  className="text-xs font-semibold text-navy-500 hover:text-navy-800"
                >
                  {pb.editButton}
                </button>
              </div>
            </div>

            <dl className="mt-8 grid gap-6 rounded-xl border border-navy-100 bg-white p-6 sm:grid-cols-2">
              <div>
                <dt className="text-xs font-semibold uppercase text-navy-400">{pb.columnCost}</dt>
                <dd className="mt-1 text-lg font-bold text-navy-900">{fmtSEK(entry.estimatedCostSEK, lang)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-navy-400">{pb.columnPeriod}</dt>
                <dd className="mt-1 text-lg font-bold text-navy-900">
                  {entry.periodStart}–{entry.periodEnd}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-navy-400">{pb.detailThemeLabel}</dt>
                <dd className="mt-1 text-lg font-bold text-navy-900">{sectorLabel(entry.sector, lang)}</dd>
              </div>
              <div>
                <dt className="text-xs font-semibold uppercase text-navy-400">{pb.columnReadiness}</dt>
                <dd className="mt-1 text-lg font-bold text-gold-600">{entry.aiReadinessPct}%</dd>
              </div>
            </dl>

            <div className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase text-navy-400">{pb.detailDescriptionLabel}</h2>
              <p className="mt-2 text-sm text-navy-700">{lang === "sv" ? entry.description_sv : entry.description_en}</p>
            </div>
          </>
        )}

        <div className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase text-navy-400">{pb.assignedRolesTitle}</h2>
            <Link href="/installningar/anvandare" className="text-xs font-semibold text-navy-500 hover:text-navy-800">
              ⚙ {t.usersSettings.title}
            </Link>
          </div>
          {assignedUsers.length === 0 ? (
            <p className="mt-2 text-sm text-navy-500">{pb.noAssignedRoles}</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {assignedUsers.map((u) => {
                const role = u.projectRoles.find((r) => r.projectId === entry.id)?.role;
                if (!role) return null;
                return (
                  <li key={u.id} className="flex items-center justify-between text-sm">
                    <span className="text-navy-800">
                      {u.firstName} {u.lastName}
                    </span>
                    <span className="text-navy-500">{projectRoleLabels[role][lang]}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {missing.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold text-amber-900">{pb.detailMissingInfoTitle}</h2>
            <p className="mt-1 text-sm text-amber-800">{pb.detailMissingInfoBody}</p>
            <ul className="mt-4 space-y-1.5">
              {missing.map((m) => (
                <li key={m} className="text-sm text-amber-800">
                  ⚠ {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-bold text-navy-800">{pb.detailMatchesTitle}</h2>
          {matches.length === 0 ? (
            <p className="mt-2 text-sm text-navy-500">{pb.detailNoMatches}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {matches.map((match) => (
                <div
                  key={match.call.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-xs font-bold text-white">
                      {match.program.logoLetter}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase text-navy-400">{match.program.shortName}</p>
                      <p className="font-semibold text-navy-800">
                        {lang === "sv" ? match.call.title_sv : match.call.title_en}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${recommendationStyle(match.recommendation)}`}>{match.score}%</span>
                    <Link
                      href={`/demo?project=${entry.id}&call=${match.call.id}`}
                      className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
                    >
                      {results.startApplication}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-16 mt-8">
          <h2 className="text-lg font-bold text-navy-800">{pb.similarProjectsTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{pb.similarProjectsIntro}</p>
          {similar.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{pb.similarProjectsNone}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {similar.map(({ project, similarityPct, sharedKeywords }) => (
                <div key={project.id} className="rounded-xl border border-navy-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-navy-400">
                        {lang === "sv" ? project.theme_sv : project.theme_en}
                      </p>
                      <p className="font-semibold text-navy-800">{project.title}</p>
                    </div>
                    <span className="badge bg-navy-100 text-navy-700">{similarityPct}%</span>
                  </div>
                  {sharedKeywords.length > 0 && (
                    <p className="mt-2 text-xs text-navy-400">
                      {pb.similarProjectsSharedLabel}: {sharedKeywords.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

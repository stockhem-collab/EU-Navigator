"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import LinkedReportingBadge from "@/components/LinkedReportingBadge";
import CsvImportPanel from "@/components/projectbank/CsvImportPanel";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useGrants } from "@/lib/hooks/useGrants";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import { useApplications } from "@/lib/hooks/useApplications";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { isActiveApplication } from "@/lib/matching/applications";
import {
  CURRENT_USER_ID,
  isProjectRelevantToUser,
  orgUnits as seedOrgUnits,
  primaryProjectAssignment,
  projectRoleLabels,
} from "@/lib/data/users";
import { computeBestMatchForEntry } from "@/lib/matching/portfolio";
import { fmtSEK } from "@/lib/format";
import { PROJECT_STATUS_ORDER, ProjectStatus } from "@/lib/types";
import ConfirmButton from "@/components/ConfirmButton";
import { useOnlyMineAndShared } from "@/lib/hooks/useOnlyMineAndShared";

// The one list of projects — what used to be split between Projektbank
// (ideas) and Mina projekt (the same projects, filtered by status). Each
// row shows where the project stands on its own lifecycle, its
// applications and, once funded, its reporting; the project page is the
// hub for all of it.
export default function ProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ProjectsPageInner />
    </Suspense>
  );
}

function isProjectStatus(value: string | null): value is ProjectStatus {
  return PROJECT_STATUS_ORDER.includes(value as ProjectStatus);
}

function ProjectsPageInner() {
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const pb = t.projectBank;
  const ap = t.grants;
  const ov = t.oversikt;
  const { all: projectBank, imported, deletedEntries, addImported, deleteEntry, restoreEntry, clearImported } = useProjectBank();
  const { all: fundingCalls } = useFundingCalls();
  const { all: grants } = useGrants();
  const { withSubmissions } = useReportingSubmissions();
  const { records: applications } = useApplications();
  const { users } = useUsersDirectory();
  const { config: orgConfig } = useOrgConfig();
  const orgUnitsAll = orgConfig.units ?? seedOrgUnits;
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID);
  const importedIds = useMemo(() => new Set(imported.map((p) => p.id)), [imported]);

  // ?status=… (e.g. from Datacenter's portfolio tiles) opens the list
  // pre-filtered to that status.
  const initialStatus = searchParams.get("status");
  const [statusFilter, setStatusFilter] = useState<ProjectStatus | "all">(
    isProjectStatus(initialStatus) ? initialStatus : "all"
  );
  const [onlyMineAndShared, setOnlyMineAndShared] = useOnlyMineAndShared();
  const [search, setSearch] = useState("");

  const rows = useMemo(
    () =>
      projectBank
        .map((entry) => ({ entry, match: computeBestMatchForEntry(entry, fundingCalls) }))
        .sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1)),
    [projectBank, fundingCalls]
  );

  // The status tiles count what the other filters leave, so their numbers
  // always add up to the list below.
  const query = search.trim().toLowerCase();
  const scoped = rows
    .filter((r) => !onlyMineAndShared || isProjectRelevantToUser(r.entry, currentUser, orgUnitsAll))
    .filter(({ entry }) =>
      query
        ? `${entry.title_sv} ${entry.title_en} ${entry.department_sv} ${entry.department_en}`.toLowerCase().includes(query)
        : true
    );
  const statusCounts = new Map<ProjectStatus, number>();
  for (const r of scoped) statusCounts.set(r.entry.status, (statusCounts.get(r.entry.status) ?? 0) + 1);
  const visible = scoped.filter((r) => statusFilter === "all" || r.entry.status === statusFilter);

  const tile = (active: boolean) =>
    `rounded-xl border p-3 text-left transition ${
      active ? "border-navy-800 bg-navy-800 text-white" : "border-navy-100 bg-white hover:border-navy-300"
    }`;

  return (
    <>
      <Header />
      <main className="section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{pb.title}</h1>
            <p className="mt-2 max-w-2xl text-sm text-navy-600">{pb.subtitle}</p>
          </div>
        </div>

        {/* The two ways a project gets into the system, side by side: the
            form, one at a time, or a file, several at once. Applying for
            funding starts from the header's "Ny ansökan" instead. */}
        <section className="mt-6 rounded-xl border border-navy-100 bg-white p-4 sm:p-5" aria-labelledby="add-project-heading">
          <h2 id="add-project-heading" className="text-sm font-semibold uppercase text-navy-400">
            {pb.addProjectTitle}
          </h2>
          <div className="mt-3 grid gap-4 md:grid-cols-2">
            <div className="flex flex-col rounded-lg border border-navy-100 p-4">
              <h3 className="font-semibold text-navy-800">{pb.addFormTitle}</h3>
              <p className="mt-1 text-sm text-navy-500">{pb.addFormBody}</p>
              <div className="mt-3">
                <Link
                  href="/projekt/nytt"
                  className="inline-block rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400"
                >
                  {pb.newProjectButton}
                </Link>
              </div>
            </div>
            <div className="rounded-lg border border-navy-100 p-4">
              <h3 className="font-semibold text-navy-800">{pb.addImportTitle}</h3>
              <p className="mb-3 mt-1 text-sm text-navy-500">{pb.addImportBody}</p>
              {/* Includes soft-deleted ids too (not just the visible
                  `projectBank`) — otherwise re-importing the same CSV after
                  deleting its row would regenerate the exact same slugified id
                  and collide with the still-stored, just-hidden entry. */}
              <CsvImportPanel onImport={addImported} existingIds={[...projectBank, ...deletedEntries].map((p) => p.id)} />
            </div>
          </div>
          {imported.length > 0 && (
            <ConfirmButton
              label={`${pb.clearImported} (${imported.length})`}
              message={pb.confirmClearImported}
              confirmLabel={t.confirm.yesRemove}
              cancelLabel={t.confirm.cancel}
              onConfirm={() => clearImported()}
              danger
              className="mt-3 text-xs font-semibold text-navy-400 hover:text-amber-700"
            />
          )}
        </section>

        {deletedEntries.length > 0 && (
          <section className="mt-6 rounded-xl border border-navy-100 bg-navy-50/50 p-4">
            <h2 className="text-sm font-semibold text-navy-800">
              {pb.deletedProjectsTitle} ({deletedEntries.length})
            </h2>
            <p className="mt-1 text-xs text-navy-500">{pb.deletedProjectsHint}</p>
            <ul className="mt-3 divide-y divide-navy-100">
              {deletedEntries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                  <span className="text-navy-700">{lang === "sv" ? entry.title_sv : entry.title_en}</span>
                  <button
                    type="button"
                    onClick={() => restoreEntry(entry.id)}
                    className="shrink-0 text-xs font-semibold text-navy-600 hover:text-navy-900"
                  >
                    {pb.restoreProjectButton}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="mt-8" aria-label={ov.sectionStatusBreakdown}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={pb.searchPlaceholder}
              aria-label={pb.searchPlaceholder}
              className="w-full max-w-xs rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
            <label className="flex items-center gap-2 text-sm font-semibold text-navy-700">
              <input type="checkbox" checked={onlyMineAndShared} onChange={(e) => setOnlyMineAndShared(e.target.checked)} />
              {ap.onlyMineAndSharedToggle}
            </label>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            <button type="button" onClick={() => setStatusFilter("all")} className={tile(statusFilter === "all")}>
              <p className="text-xl font-extrabold">{scoped.length}</p>
              <p className={`text-xs ${statusFilter === "all" ? "text-navy-200" : "text-navy-500"}`}>{ap.statusFilterAll}</p>
            </button>
            {PROJECT_STATUS_ORDER.map((status) => {
              const active = statusFilter === status;
              return (
                <button
                  key={status}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setStatusFilter(active ? "all" : status)}
                  className={tile(active)}
                >
                  <p className="text-xl font-extrabold">{statusCounts.get(status) ?? 0}</p>
                  <p className={`text-xs ${active ? "text-navy-200" : "text-navy-500"}`}>{pb.statusLabels[status]}</p>
                </button>
              );
            })}
          </div>
        </section>

        <div className="mb-16 mt-6 overflow-x-auto rounded-xl border border-navy-100 bg-white">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase text-navy-400">
              <tr>
                <th className="px-4 py-3">{pb.columnTitle}</th>
                <th className="px-4 py-3">{pb.columnDepartment}</th>
                <th className="px-4 py-3">{pb.columnStatus}</th>
                <th className="px-4 py-3">{pb.columnApplications}</th>
                <th className="px-4 py-3">{pb.columnCost}</th>
                <th className="px-4 py-3">{pb.columnBestMatch}</th>
                <th className="px-4 py-3" aria-hidden="true" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {visible.map(({ entry: p, match }) => {
                const projectApplications = applications.filter((r) => r.projectId === p.id);
                const activeCount = projectApplications.filter(isActiveApplication).length;
                const awardedCount = projectApplications.filter((r) => r.status === "awarded").length;
                const projectGrants = grants.filter((g) => g.projectBankEntryId === p.id);
                const assignment = primaryProjectAssignment(users, p.id);
                return (
                  <tr key={p.id} className="transition hover:bg-navy-50/50">
                    <td className="px-4 py-3">
                      <Link href={`/projekt/${p.id}`} className="font-semibold text-navy-800 hover:underline">
                        {lang === "sv" ? p.title_sv : p.title_en}
                      </Link>
                      {assignment && (
                        <p className="mt-0.5 text-xs text-navy-400">
                          {assignment.user.firstName} {assignment.user.lastName} · {projectRoleLabels[assignment.role][lang]}
                          {assignment.othersCount > 0 && ` ${pb.plusOthers(assignment.othersCount)}`}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-navy-600">{lang === "sv" ? p.department_sv : p.department_en}</td>
                    <td className="px-4 py-3">
                      <StatusBadge status={p.status} />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {(activeCount > 0 || awardedCount > 0) && (
                          <span className="text-xs text-navy-600">{pb.applicationsSummary(activeCount, awardedCount)}</span>
                        )}
                        {projectGrants.map((g) => (
                          <LinkedReportingBadge key={g.id} project={withSubmissions(g)} />
                        ))}
                        {activeCount === 0 && awardedCount === 0 && projectGrants.length === 0 && (
                          <span className="text-xs text-navy-400">—</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-navy-600">{fmtSEK(p.estimatedCostSEK, lang)}</td>
                    <td className="px-4 py-3">
                      {match ? (
                        <span
                          className={`badge ${
                            match.recommendation === "proceed"
                              ? "bg-green-100 text-green-800"
                              : match.recommendation === "consider"
                              ? "bg-gold-100 text-gold-800"
                              : "bg-navy-100 text-navy-600"
                          }`}
                        >
                          {match.score}% · {match.program.shortName}
                        </span>
                      ) : (
                        <span className="text-xs text-navy-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {importedIds.has(p.id) && (
                        <ConfirmButton
                          label="✕"
                          ariaLabel={pb.removeImportedRow}
                          message={pb.confirmRemoveProject(lang === "sv" ? p.title_sv : p.title_en)}
                          confirmLabel={t.confirm.yesRemove}
                          cancelLabel={t.confirm.cancel}
                          onConfirm={() => deleteEntry(p.id)}
                          danger
                          className="text-navy-300 hover:text-amber-700"
                        />
                      )}
                    </td>
                  </tr>
                );
              })}
              {visible.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-6 text-center text-sm text-navy-500">
                    {projectBank.length === 0 ? pb.noProjectsYet : pb.noProjectsMatch}
                    <Link href="/projekt/nytt" className="ml-2 font-semibold text-navy-700 hover:underline">
                      {pb.newProjectButton}
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </>
  );
}

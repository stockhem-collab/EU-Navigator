"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useProjectTasks } from "@/lib/hooks/useProjectTasks";
import { useAttachments, downloadAttachment, MAX_ATTACHMENT_BYTES } from "@/lib/hooks/useAttachments";
import { useGrants } from "@/lib/hooks/useGrants";
import { syncProjectStatus, useApplications } from "@/lib/hooks/useApplications";
import { logActivity } from "@/lib/hooks/useActivityLog";
import { isActiveApplication } from "@/lib/matching/applications";
import { scoreMatch } from "@/lib/matching/scoreMatch";
import { findProgram } from "@/lib/data/fundingPrograms";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import ProjectLifecycle from "@/components/ProjectLifecycle";
import { computeReadiness } from "@/lib/matching/readiness";
import ConfirmButton from "@/components/ConfirmButton";
import { readApplicationBudget } from "@/lib/hooks/useApplication";
import { resolveApplicationBudget } from "@/lib/matching/applicationBudget";
import LinkedReportingBadge from "@/components/LinkedReportingBadge";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { fundedProjects } from "@/lib/data/fundedProjects";
import { orgUnits as seedOrgUnits, projectRoleLabels, shareableUnits, unitDepth } from "@/lib/data/users";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import { computeMatchesForEntry, projectToGrant, projectBankEntryToProjectInput } from "@/lib/matching/portfolio";
import { computeSimilarProjects } from "@/lib/matching/similarProjects";
import { fmtSEK, fmtFileSize } from "@/lib/format";
import { APPLICATION_STATUS_ORDER, ApplicationRecord, ApplicationStatus, PROJECT_STATUS_ORDER, ProjectStatus, Sector } from "@/lib/types";
import { suggestTags } from "@/lib/matching/tagSuggestions";
import { useTags } from "@/lib/hooks/useTags";
import TagPicker from "@/components/TagPicker";

const SECTORS: Sector[] = ["energy", "climate", "digital", "social", "mobility", "education", "health", "research"];
const STATUSES: ProjectStatus[] = PROJECT_STATUS_ORDER;

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
  tags: string[];
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
  const router = useRouter();
  const { all, hydrated, updateEntry } = useProjectBank();
  const { all: allTags, addCustomTag } = useTags();
  const { all: fundingCalls } = useFundingCalls();
  const { all: awardedProjectsAll, addGrant } = useGrants();
  const { records: applicationRecords, setApplicationStatus, updateApplication, deleteApplication } = useApplications();
  const { withSubmissions } = useReportingSubmissions();
  const at = t.applications;
  const { users } = useUsersDirectory();
  const { config: orgConfig } = useOrgConfig();
  const orgUnits = orgConfig.units ?? seedOrgUnits;
  const shareTargets = shareableUnits(orgUnits);
  const { tasksFor, addTask, toggleTask, editTask, removeTask } = useProjectTasks();
  const { attachmentsFor, addAttachment, removeAttachment } = useAttachments();
  const entry = all.find((p) => p.id === params.id);
  const assignedUsers = entry ? users.filter((u) => u.projectRoles.some((r) => r.projectId === entry.id)) : [];
  const [draft, setDraft] = useState<EditDraft | null>(null);
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDue, setNewTaskDue] = useState("");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editTaskText, setEditTaskText] = useState("");
  const [editTaskDue, setEditTaskDue] = useState("");
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const suggestedTagsForDraft = useMemo(
    () => suggestTags(`${draft?.title ?? ""} ${draft?.description ?? ""}`),
    [draft?.title, draft?.description]
  );

  if (!entry) {
    if (!hydrated) return null;
    return (
      <>
        <Header />
        <main className="section max-w-3xl">
          <Link href="/projekt" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
            ← {pb.back}
          </Link>
          <p className="mt-8 text-sm text-navy-500">{pb.detailNotFound}</p>
        </main>
        <Footer />
      </>
    );
  }

  const storedMissing = lang === "sv" ? entry.missingFields_sv : entry.missingFields_en;
  const matches = computeMatchesForEntry(entry, fundingCalls);
  // The same readiness measure as the application workspace, computed from
  // the project as it is now against its best-matching call — so it moves
  // when the project is edited, and reads the same as a new application to
  // that call would start at.
  const bestMatch = matches[0];
  const readiness = bestMatch ? computeReadiness(projectBankEntryToProjectInput(entry), bestMatch) : null;
  const readinessPct = readiness ? readiness.overall : entry.aiReadinessPct;
  // What to add before applying: the project's own recorded gaps plus
  // whatever the readiness measure still asks for, without repeats — the
  // latter only while the project is still at the application stage.
  const stillApplying = !["funded", "running", "completed"].includes(entry.status);
  const missing = [
    ...new Set([
      ...storedMissing,
      ...((stillApplying ? readiness?.dimensions : undefined)?.flatMap((d) => {
        const action = lang === "sv" ? d.action_sv : d.action_en;
        return action ? [action] : [];
      }) ?? []),
    ]),
  ];
  const similar = computeSimilarProjects(projectBankEntryToProjectInput(entry), fundedProjects);
  const projectGrants = awardedProjectsAll.filter((a) => a.projectBankEntryId === entry.id).map(withSubmissions);
  const linkedAwardedProject = projectGrants[0];
  const applications = applicationRecords
    .filter((r) => r.projectId === entry.id)
    .sort((a, b) => (a.createdAt < b.createdAt ? -1 : 1));
  // "Ansökan 2" etc. only where a project has more than one application to
  // the same call — otherwise the call title alone identifies it.
  const roundOf = (record: ApplicationRecord) => {
    const sameCall = applications.filter((r) => r.callId === record.callId);
    return sameCall.length > 1 ? sameCall.indexOf(record) + 1 : null;
  };
  const activeApplicationFor = (callId: string) =>
    applications.filter((r) => r.callId === callId && isActiveApplication(r)).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))[0];
  const applicationHref = (record: ApplicationRecord) =>
    `/ansokan?project=${entry.id}&call=${record.callId}&application=${encodeURIComponent(record.id)}`;

  const handleApplicationStatus = (record: ApplicationRecord, status: ApplicationStatus) => {
    setApplicationStatus(record.id, status);
    syncProjectStatus(entry.id, entry.status, updateEntry);
  };

  const handleDeleteApplication = (record: ApplicationRecord) => {
    deleteApplication(record.id);
    syncProjectStatus(entry.id, entry.status, updateEntry);
  };

  // An awarded application becomes an awarded project under the call it
  // was actually made to — not just the project's best match.
  // The grant the application applied for — its own requested amount, or
  // the estimate the workspace showed when none was set. Pre-fills the
  // awarded amount, which the user confirms (or corrects) when registering.
  const plannedGrantFor = (record: ApplicationRecord): number | undefined => {
    const call = fundingCalls.find((c) => c.id === record.callId);
    const program = call ? findProgram(call.programId) : undefined;
    if (!call || !program) return undefined;
    return resolveApplicationBudget(projectBankEntryToProjectInput(entry), { call, program }, readApplicationBudget(record.id))
      .requestedGrantSEK;
  };

  const handleCreateAwarded = (record: ApplicationRecord, awardedAmountSEK?: number) => {
    const call = fundingCalls.find((c) => c.id === record.callId);
    const program = call ? findProgram(call.programId) : undefined;
    if (!call || !program) return;
    const match = scoreMatch(projectBankEntryToProjectInput(entry), call, program);
    const awarded = projectToGrant(entry, match, record.id, awardedAmountSEK ?? plannedGrantFor(record));
    addGrant(awarded);
    updateApplication(record.id, { awardedProjectId: awarded.id });
    logActivity({ kind: "grant-registered", grantId: awarded.id, projectId: entry.id, callId: call.id });
    updateEntry(entry.id, { status: "running" });
    router.push(`/stod/${awarded.id}`);
  };

  const recommendationStyle = (rec: (typeof matches)[number]["recommendation"]) => {
    if (rec === "proceed") return "bg-green-100 text-green-800";
    if (rec === "consider") return "bg-gold-100 text-gold-800";
    return "bg-navy-100 text-navy-600";
  };

  // Turns this idea into a real awarded project once it's actually won
  // funding — before this there was no path forward except hand-editing
  // seed data, so a real project bank status went stale in "approved"
  // forever. Only offered for a project with no application records (e.g.
  // one marked "funded" by hand): with records, each awarded application gets
  // its own button under the call it was made to (handleCreateAwarded).
  // Without them there's no record of which call was applied to, so this
  // uses the project's best match.
  const handleMarkAsAwarded = () => {
    const bestMatch = matches[0];
    if (!bestMatch) return;
    const awarded = projectToGrant(entry, bestMatch);
    addGrant(awarded);
    logActivity({ kind: "grant-registered", grantId: awarded.id, projectId: entry.id, callId: bestMatch.call.id });
    updateEntry(entry.id, { status: "running" });
    router.push(`/stod/${awarded.id}`);
  };

  const toggleShareUnit = (unitId: string) => {
    const current = entry.sharedWithUnitIds ?? [];
    const sharing = !current.includes(unitId);
    const next = sharing ? [...current, unitId] : current.filter((id) => id !== unitId);
    updateEntry(entry.id, { sharedWithUnitIds: next });
    const unit = orgUnits.find((u) => u.id === unitId);
    if (sharing && unit) logActivity({ kind: "project-shared", projectId: entry.id, unitName: unit.name });
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
      tags: entry.tags ?? [],
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
      tags: draft.tags,
      hasInternationalPartner: draft.hasInternationalPartner,
    });
    setDraft(null);
  };

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <Link href="/projekt" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
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
              <div className="sm:col-span-2">
                <label className="block text-sm font-semibold text-navy-700">{t.demo.intake.fieldTags}</label>
                <div className="mt-1">
                  <TagPicker
                    tags={allTags}
                    selected={draft.tags}
                    onChange={(tags) => setDraft({ ...draft, tags })}
                    suggested={suggestedTagsForDraft}
                    lang={lang}
                    labels={{
                      hint: t.demo.intake.tagsHint,
                      suggestedLabel: t.demo.intake.tagsSuggestedLabel,
                      addAllLabel: t.demo.intake.tagsAddAllLabel,
                      addNewPlaceholder: t.demo.intake.tagsAddNewPlaceholder,
                      addNewButton: t.demo.intake.tagsAddNewButton,
                    }}
                    onAddTag={addCustomTag}
                  />
                </div>
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

            <ProjectLifecycle status={entry.status} applications={applications} grants={projectGrants} />

            {!linkedAwardedProject && applications.length === 0 && entry.status === "funded" && matches.length > 0 && (
              <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-dashed border-navy-200 px-4 py-3">
                <p className="text-xs text-navy-600">{pb.markAsAwardedHint}</p>
                <ConfirmButton
                  label={pb.markAsAwardedButton}
                  message={pb.confirmMarkAsAwarded}
                  confirmLabel={t.confirm.yesRegister}
                  cancelLabel={t.confirm.cancel}
                  onConfirm={handleMarkAsAwarded}
                  className="shrink-0 rounded-md bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700"
                />
              </div>
            )}

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
                <dd className="mt-1 text-lg font-bold text-gold-600" data-testid="project-readiness">
                  {readinessPct}%
                </dd>
                {bestMatch && (
                  <dd className="mt-0.5 text-xs text-navy-400">
                    {pb.readinessAgainst(lang === "sv" ? bestMatch.call.title_sv : bestMatch.call.title_en)}
                  </dd>
                )}
              </div>
              {entry.tags && entry.tags.length > 0 && (
                <div className="sm:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-navy-400">{t.demo.intake.fieldTags}</dt>
                  <dd className="mt-2 flex flex-wrap gap-2">
                    {entry.tags.map((id) => {
                      const tag = allTags.find((t) => t.id === id);
                      const label = tag ? (lang === "sv" ? tag.label_sv : tag.label_en) : id;
                      return (
                        <span key={id} className="rounded-full bg-navy-50 px-2.5 py-1 text-xs font-medium text-navy-700">
                          {label}
                        </span>
                      );
                    })}
                  </dd>
                </div>
              )}
            </dl>

            <div className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
              <h2 className="text-sm font-semibold uppercase text-navy-400">{pb.detailDescriptionLabel}</h2>
              <p className="mt-2 text-sm text-navy-700">{lang === "sv" ? entry.description_sv : entry.description_en}</p>
            </div>
          </>
        )}

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

        <section className="mt-6" aria-labelledby="applications-title">
          <h2 id="applications-title" className="text-lg font-bold text-navy-800">
            {at.sectionTitle}
          </h2>
          <p className="mt-1 text-sm text-navy-500">{at.sectionHint}</p>
          {applications.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{at.none}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {applications.map((record) => {
                const call = fundingCalls.find((c) => c.id === record.callId);
                const program = call ? findProgram(call.programId) : undefined;
                const round = roundOf(record);
                const awardedProject = record.awardedProjectId
                  ? awardedProjectsAll.find((a) => a.id === record.awardedProjectId)
                  : undefined;
                const callTitle = call ? (lang === "sv" ? call.title_sv : call.title_en) : record.callId;
                return (
                  <li
                    key={record.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-xs font-bold text-white">
                        {program?.logoLetter ?? "?"}
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase text-navy-400">
                          {program?.shortName}
                          {round !== null && ` · ${at.roundLabel(round)}`}
                        </p>
                        <p className="font-semibold text-navy-800">{callTitle}</p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-navy-400">
                          <ApplicationStatusBadge status={record.status} />
                          {at.updatedAt(new Date(record.updatedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-US"))}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <label className="sr-only" htmlFor={`status-${record.id}`}>
                        {at.statusLabel}: {callTitle}
                      </label>
                      <select
                        id={`status-${record.id}`}
                        value={record.status}
                        onChange={(e) => handleApplicationStatus(record, e.target.value as ApplicationStatus)}
                        className="rounded-md border border-navy-200 px-2 py-1.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                      >
                        {APPLICATION_STATUS_ORDER.map((st) => (
                          <option key={st} value={st}>
                            {at.statusLabels[st]}
                          </option>
                        ))}
                      </select>
                      {record.status === "awarded" && !awardedProject && (
                        <RegisterGrantButton
                          recordId={record.id}
                          plannedAmount={plannedGrantFor(record)}
                          onConfirm={(amount) => handleCreateAwarded(record, amount)}
                        />
                      )}
                      {awardedProject && (
                        <Link
                          href={`/stod/${awardedProject.id}`}
                          className="text-sm font-semibold text-navy-700 hover:underline"
                        >
                          {at.viewAwardedLink}
                        </Link>
                      )}
                      {call && (
                        <Link
                          href={applicationHref(record)}
                          className="rounded-md bg-navy-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy-700"
                        >
                          {isActiveApplication(record) ? at.resume : at.open}
                        </Link>
                      )}
                      <ConfirmButton
                        label={at.deleteButton}
                        ariaLabel={`${at.deleteButton}: ${callTitle}`}
                        message={at.confirmDelete}
                        confirmLabel={t.confirm.yesRemove}
                        cancelLabel={t.confirm.cancel}
                        onConfirm={() => handleDeleteApplication(record)}
                        danger
                        className="rounded-md px-2 py-1.5 text-sm text-navy-400 hover:bg-navy-50 hover:text-navy-700"
                      />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mt-6" aria-labelledby="grants-title">
          <h2 id="grants-title" className="text-lg font-bold text-navy-800">
            {pb.grantsSectionTitle}
          </h2>
          <p className="mt-1 text-sm text-navy-500">{pb.grantsSectionHint}</p>
          {projectGrants.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{pb.grantsNone}</p>
          ) : (
            <ul className="mt-4 space-y-3">
              {projectGrants.map((grant) => {
                const call = fundingCalls.find((c) => c.id === grant.callId);
                const program = call ? findProgram(call.programId) : undefined;
                return (
                  <li
                    key={grant.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-700 text-xs font-bold text-white">
                        {program?.logoLetter ?? "?"}
                      </span>
                      <div>
                        <p className="text-xs font-semibold uppercase text-navy-400">{program?.shortName}</p>
                        <p className="font-semibold text-navy-800">{call ? (lang === "sv" ? call.title_sv : call.title_en) : grant.callId}</p>
                        <p className="mt-0.5 text-xs text-navy-500">
                          {t.grants.awardedAmount}: {fmtSEK(grant.awardedAmountSEK, lang)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <LinkedReportingBadge project={grant} />
                      <Link
                        href={`/stod/${grant.id}`}
                        className="rounded-md bg-navy-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy-700"
                      >
                        {at.viewAwardedLink}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="mt-6" id="matches">
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
                    {(() => {
                      // An application already in progress to this call is
                      // resumed; otherwise a new one starts.
                      const active = activeApplicationFor(match.call.id);
                      return (
                        <Link
                          href={active ? applicationHref(active) : `/ansokan?project=${entry.id}&call=${match.call.id}`}
                          className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
                        >
                          {active ? at.continueApplication : results.startApplication}
                        </Link>
                      );
                    })()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Who, tasks and attachments come after the project's applications,
            grants and matches — those are what people open the page for. */}
        <div className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <div className="flex items-center justify-between gap-2">
            <h2 className="text-sm font-semibold uppercase text-navy-400">{pb.peopleAndSharingTitle}</h2>
            <Link href="/installningar/anvandare" className="text-xs font-semibold text-navy-500 hover:text-navy-800">
              ⚙ {t.usersSettings.title}
            </Link>
          </div>

          <div className="mt-3">
            <h3 className="text-xs font-semibold uppercase text-navy-400">{pb.assignedRolesTitle}</h3>
            {assignedUsers.length === 0 ? (
              <p className="mt-1 text-sm text-navy-500">{pb.noAssignedRoles}</p>
            ) : (
              <ul className="mt-1.5 space-y-1.5">
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

          <div className="mt-5 border-t border-navy-50 pt-4">
            <h3 className="text-xs font-semibold uppercase text-navy-400">{pb.shareTitle}</h3>
            <p className="mt-1 text-xs text-navy-400">{pb.shareHint}</p>
            <ul className="mt-2 space-y-1.5">
              {shareTargets.map((unit) => (
                <li key={unit.id} className="flex items-center gap-2" style={{ paddingLeft: unitDepth(orgUnits, unit.id) * 20 }}>
                  <label className="flex items-center gap-2 text-sm text-navy-700">
                    <input
                      type="checkbox"
                      checked={(entry.sharedWithUnitIds ?? []).includes(unit.id)}
                      onChange={() => toggleShareUnit(unit.id)}
                    />
                    {unit.name}
                  </label>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-navy-400">{pb.tasksTitle}</h2>
          <p className="mt-1 text-xs text-navy-400">{pb.tasksHint}</p>

          {tasksFor(entry.id).length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{pb.noTasks}</p>
          ) : (
            <ul className="mt-3 space-y-1.5">
              {tasksFor(entry.id).map((task) =>
                editingTaskId === task.id ? (
                  <li key={task.id} className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={editTaskText}
                      onChange={(e) => setEditTaskText(e.target.value)}
                      className="min-w-0 flex-1 rounded-md border border-navy-200 px-2 py-1 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                    />
                    <input
                      type="date"
                      value={editTaskDue}
                      onChange={(e) => setEditTaskDue(e.target.value)}
                      aria-label={pb.taskDueDateLabel}
                      className="rounded-md border border-navy-200 px-2 py-1 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        editTask(entry.id, task.id, editTaskText, editTaskDue || undefined);
                        setEditingTaskId(null);
                      }}
                      disabled={!editTaskText.trim()}
                      className="shrink-0 text-xs font-semibold text-navy-700 hover:text-navy-900 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {pb.taskSaveButton}
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingTaskId(null)}
                      className="shrink-0 text-xs font-medium text-navy-400 hover:text-navy-700"
                    >
                      {pb.taskCancelButton}
                    </button>
                  </li>
                ) : (
                  <li key={task.id} className="flex items-center justify-between gap-3 text-sm">
                    <label className="flex flex-1 items-center gap-2">
                      <input type="checkbox" checked={task.done} onChange={() => toggleTask(entry.id, task.id)} />
                      <span className={task.done ? "text-navy-400 line-through" : "text-navy-800"}>{task.text}</span>
                      {task.dueDate && <span className="text-xs text-navy-400">{pb.taskDueLabel(task.dueDate)}</span>}
                    </label>
                    <div className="flex shrink-0 items-center gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTaskId(task.id);
                          setEditTaskText(task.text);
                          setEditTaskDue(task.dueDate ?? "");
                        }}
                        className="text-xs font-medium text-navy-400 hover:text-navy-700"
                      >
                        {pb.taskEditLabel}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeTask(entry.id, task.id)}
                        className="text-xs font-medium text-navy-400 hover:text-amber-700"
                      >
                        {pb.taskRemoveLabel}
                      </button>
                    </div>
                  </li>
                )
              )}
            </ul>
          )}

          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-navy-50 pt-4">
            <input
              type="text"
              value={newTaskText}
              onChange={(e) => setNewTaskText(e.target.value)}
              placeholder={pb.taskAddPlaceholder}
              className="min-w-0 flex-1 rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
            <input
              type="date"
              value={newTaskDue}
              onChange={(e) => setNewTaskDue(e.target.value)}
              aria-label={pb.taskDueDateLabel}
              className="rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
            <button
              type="button"
              onClick={() => {
                if (!newTaskText.trim()) return;
                addTask(entry.id, newTaskText, newTaskDue || undefined);
                setNewTaskText("");
                setNewTaskDue("");
              }}
              disabled={!newTaskText.trim()}
              className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {pb.taskAddButton}
            </button>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-navy-400">{pb.attachmentsTitle}</h2>
          <p className="mt-1 text-xs text-navy-400">{pb.attachmentsHint}</p>

          {attachmentsFor(`projectbank:${entry.id}`).length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{pb.noAttachments}</p>
          ) : (
            <ul className="mt-3 divide-y divide-navy-50">
              {attachmentsFor(`projectbank:${entry.id}`).map((a) => (
                <li key={a.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-sm">
                  <button
                    type="button"
                    onClick={() => downloadAttachment(a)}
                    className="font-semibold text-navy-700 hover:underline"
                  >
                    {a.fileName}
                  </button>
                  <div className="flex items-center gap-3 text-xs text-navy-400">
                    <span>{fmtFileSize(a.sizeBytes)}</span>
                    <span>{pb.attachmentUploadedAt(new Date(a.uploadedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-US"))}</span>
                    <ConfirmButton
                      label={pb.attachmentRemoveLabel}
                      message={pb.confirmRemoveAttachment(a.fileName)}
                      confirmLabel={t.confirm.yesRemove}
                      cancelLabel={t.confirm.cancel}
                      onConfirm={() => removeAttachment(`projectbank:${entry.id}`, a.id)}
                      danger
                      className="font-medium text-navy-400 hover:text-amber-700"
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}

          <label className="mt-4 inline-block cursor-pointer rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50">
            {pb.attachmentUploadButton}
            <input
              type="file"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (!file) return;
                setAttachmentError(null);
                const error = await addAttachment(`projectbank:${entry.id}`, file);
                if (error === "too-large") setAttachmentError(pb.attachmentTooLarge(MAX_ATTACHMENT_BYTES / (1024 * 1024)));
              }}
            />
          </label>
          {attachmentError && <p className="mt-2 text-xs text-amber-700">⚠ {attachmentError}</p>}
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

// "Registrera beviljat stöd", asking for the amount actually awarded —
// pre-filled with what the application applied for, since the decision
// often grants less.
function RegisterGrantButton({
  recordId,
  plannedAmount,
  onConfirm,
}: {
  recordId: string;
  plannedAmount: number | undefined;
  onConfirm: (amountSEK: number | undefined) => void;
}) {
  const { t, lang } = useLanguage();
  const at = t.applications;
  const [amount, setAmount] = useState<string>("");
  const value = amount === "" ? plannedAmount : Number(amount);
  const invalid = value !== undefined && (!Number.isFinite(value) || value <= 0);
  const inputId = `awarded-amount-${recordId}`;
  return (
    <ConfirmButton
      label={at.createAwardedButton}
      message={at.confirmCreateAwarded}
      confirmLabel={t.confirm.yesRegister}
      cancelLabel={t.confirm.cancel}
      onConfirm={() => onConfirm(value)}
      confirmDisabled={invalid}
      className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-800"
    >
      <label htmlFor={inputId} className="flex flex-wrap items-center gap-2 text-xs font-semibold text-navy-700">
        {at.awardedAmountLabel}
        <input
          id={inputId}
          type="number"
          inputMode="numeric"
          min={0}
          step={100000}
          value={amount}
          placeholder={plannedAmount !== undefined ? String(plannedAmount) : undefined}
          onChange={(e) => setAmount(e.target.value)}
          className="w-36 rounded-md border border-navy-200 bg-white px-2 py-1 text-xs font-normal text-navy-800 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
        {value !== undefined && !invalid && <span className="font-normal text-navy-500">{fmtSEK(value, lang)}</span>}
      </label>
    </ConfirmButton>
  );
}

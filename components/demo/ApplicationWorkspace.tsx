"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MatchResult, ProjectInput, ReadinessBreakdown } from "@/lib/types";
import { assessedApplicationText, generateProjectLogic, generateReviewerNotes, ProjectLogicRow } from "@/lib/matching/generateWorkspace";
import { computeGapAnalysis } from "@/lib/matching/gapAnalysis";
import { computeReadiness, textSignals } from "@/lib/matching/readiness";
import ConfirmButton from "@/components/ConfirmButton";
import { analyzeSection } from "@/lib/matching/sectionCoach";
import { useApplication, seedApplicationDraft } from "@/lib/hooks/useApplication";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { syncProjectStatus, useApplications } from "@/lib/hooks/useApplications";
import { APPLICATION_STATUS_ORDER, ApplicationStatus, ApplicationVersion } from "@/lib/types";
import { projectInputToProjectBankEntry } from "@/lib/matching/portfolio";
import { buildApplicationDocx, downloadBlob } from "@/lib/export/exportApplication";
import { fmtSEK } from "@/lib/format";
import { scoreMatch } from "@/lib/matching/scoreMatch";
import { useFundingProfile } from "@/lib/hooks/useFundingProfile";
import {
  applicationBudgetIssues,
  hasApplicationBudget,
  projectForApplication,
  resolveApplicationBudget,
} from "@/lib/matching/applicationBudget";

interface Props {
  project: ProjectInput;
  match: MatchResult;
  onBack: () => void;
  /** The saved Projektbank entry this application is for, when there is
   * one — enables the draft to survive a refresh (see useApplication). Null
   * for an ad-hoc intake that was never saved anywhere. */
  customerProjectId?: string | null;
  /** Which of the project's applications to this call to open (see
   * useApplication) — from the URL's ?application=. Undefined = the most
   * recent one, or a new one if there's none yet. */
  applicationId?: string | null;
  /** Called once an ad-hoc intake is saved as a brand-new Projektbank entry
   * (see handleSaveAsNewProject below), with that entry's new id — lets the
   * parent adopt it as customerProjectId so this same workspace instance
   * becomes persisted without a page navigation or losing the draft.
   * Undefined when the workspace was reached from an already-saved entry,
   * where saving-as-new doesn't apply. */
  onSavedAsProject?: (newProjectId: string) => void;
  /** "back" when the workspace was opened directly (from a project, Ansöka
   * or a notification) and onBack returns there; "matches" when it goes
   * back to the match list this workspace was picked from. */
  backLabel?: "back" | "matches";
}

type Tab = "application" | "assessment" | "process";

export default function ApplicationWorkspace({
  project,
  match,
  onBack,
  customerProjectId = null,
  applicationId: requestedApplicationId = null,
  onSavedAsProject,
  backLabel = "matches",
}: Props) {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const ws = t.demo.workspace;
  const at = t.applications;
  const gapT = t.demo.gapAnalysis;
  const readinessT = t.demo.readiness;
  const coachT = t.demo.coach;

  const [tab, setTab] = useState<Tab>("application");

  const logic = generateProjectLogic(project, match.call, match.program);

  // Editable draft of the AI-generated project logic. Persisted per (project,
  // call) when the project was saved in the Projektbank — see useApplication.
  const {
    sectionDrafts,
    setSection,
    resetSection,
    versions,
    saveVersion,
    restoreVersion,
    deleteVersion,
    budget,
    setBudget,
    isPersisted,
    applicationId,
    record,
    setStatus,
    hydrated: draftLoaded,
  } = useApplication(customerProjectId, match.call.id, requestedApplicationId);

  // The amounts this application states (eligible budget, requested grant)
  // replace the project's own in the match's budget fit, so the score and
  // the assessment are about what's actually applied for. Without any set,
  // the match stays as it was computed for the project.
  const { profile: fundingProfile } = useFundingProfile();
  const scoredMatch = useMemo(
    () =>
      hasApplicationBudget(budget)
        ? scoreMatch(projectForApplication(project, budget), match.call, match.program, fundingProfile)
        : match,
    [budget, project, match, fundingProfile]
  );
  const gap = computeGapAnalysis(scoredMatch);
  const budgetFigures = resolveApplicationBudget(project, match, budget);
  const budgetIssues = applicationBudgetIssues(budgetFigures, match, fundingProfile.coFinancingCap);

  // The assessment reads what the application actually says — the project
  // description plus every section the user has written or edited — and
  // is recomputed on every keystroke (see assessedApplicationText).
  const assessedText = useMemo(() => assessedApplicationText(project, sectionDrafts), [project, sectionDrafts]);
  const readiness = useMemo(() => computeReadiness(project, scoredMatch, assessedText), [project, scoredMatch, assessedText]);
  const coach = useMemo(() => analyzeSection(project, scoredMatch, assessedText), [project, scoredMatch, assessedText]);
  const notes = useMemo(() => generateReviewerNotes(project, match.call, assessedText), [project, match.call, assessedText]);

  // Readiness as it was when this application was opened, so the effect of
  // an edit is visible ("↑ +12 sedan du öppnade ansökan"). Taken once the
  // stored draft has loaded, and again if another application or project
  // is opened in the same workspace.
  const [openedReadiness, setOpenedReadiness] = useState<ReadinessBreakdown | null>(null);
  useEffect(() => {
    setOpenedReadiness(null);
  }, [project, applicationId]);
  useEffect(() => {
    if (draftLoaded && openedReadiness === null) setOpenedReadiness(readiness);
  }, [draftLoaded, openedReadiness, readiness]);
  const overallChange = openedReadiness ? readiness.overall - openedReadiness.overall : 0;
  const dimensionChange = (key: string) => {
    const before = openedReadiness?.dimensions.find((d) => d.key === key)?.score;
    const now = readiness.dimensions.find((d) => d.key === key)?.score;
    return before === undefined || now === undefined ? 0 : now - before;
  };

  // Which section of the application each readiness dimension is about, so
  // an action can point to where to write it and each section can show
  // what it's still missing.
  const sectionForDimension = useMemo(() => {
    const find = (pattern: RegExp) => logic.findIndex((row) => pattern.test(`${row.label_sv} ${row.label_en}`));
    const impact = find(/effekt|outcome|impact|resultat|result/i);
    const indicators = find(/indikator|indicator|uppfölj|mät|measur|monitor/i);
    const logicRow = find(/problem|behov|need|aktivitet|activit|genomför|implement|mål|goal|objective/i);
    const activities = find(/aktivitet|activit|genomför|implement/i);
    const horizontalOwn = find(/horisont|horizontal|jämställ|hållbar|equal|sustain/i);
    // How the project works with the horizontal principles is described
    // with the activities, when the call has no section of its own for it.
    const horizontal = horizontalOwn >= 0 ? horizontalOwn : activities;
    const map: Record<string, number> = {
      impact: impact >= 0 ? impact : 0,
      indicators: indicators >= 0 ? indicators : impact >= 0 ? impact : 0,
      logic: logicRow >= 0 ? logicRow : 0,
      horizontalPrinciples: horizontal >= 0 ? horizontal : logicRow >= 0 ? logicRow : 0,
    };
    return map;
  }, [logic]);
  const sectionLabel = (row: ProjectLogicRow) => (lang === "sv" ? row.label_sv : row.label_en);
  const goToSection = (index: number) => {
    setTab("application");
    window.setTimeout(() => {
      const el = document.getElementById(`section-${index}`);
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
      el?.focus();
    }, 0);
  };
  const { all: projectBankEntries, addImported, updateEntry, hydrated: projectBankHydrated } = useProjectBank();
  const { records: allApplications, createApplication } = useApplications();
  const otherApplicationsToCall = allApplications.filter(
    (r) => r.projectId === customerProjectId && r.callId === match.call.id && r.id !== applicationId
  ).length;
  const applicationStatus: ApplicationStatus = record?.status ?? "draft";

  // The project's own status follows its applications — re-checked whenever
  // this application gets its record (first edit) or a new status.
  const projectStatus = customerProjectId ? projectBankEntries.find((e) => e.id === customerProjectId)?.status : undefined;
  const recordStatus = record?.status;
  useEffect(() => {
    if (!projectBankHydrated || !customerProjectId || !projectStatus || !recordStatus) return;
    syncProjectStatus(customerProjectId, projectStatus, updateEntry);
  }, [projectBankHydrated, customerProjectId, projectStatus, recordStatus, updateEntry]);

  const handleNewApplication = () => {
    if (!customerProjectId) return;
    const created = createApplication(customerProjectId, match.call.id);
    router.replace(`/ansokan?project=${customerProjectId}&call=${match.call.id}&application=${encodeURIComponent(created.id)}`, {
      scroll: false,
    });
  };
  const [versionName, setVersionName] = useState("");

  const callTitle = lang === "sv" ? match.call.title_sv : match.call.title_en;
  const hasCallTemplate = Boolean(match.call.applicationTemplate && match.call.applicationTemplate.length > 0);

  // Every section's currently *displayed* text (an override, or the AI
  // suggestion when there isn't one) — what a saved version or an export
  // should actually contain.
  const resolveSection = (row: { label_sv: string; content_sv: string; content_en: string }) =>
    sectionDrafts[row.label_sv] ?? (lang === "sv" ? row.content_sv : row.content_en);

  const handleExport = async () => {
    const resolved = Object.fromEntries(logic.map((row) => [row.label_sv, resolveSection(row)]));
    const blob = await buildApplicationDocx(project, match, logic, resolved, budgetFigures, lang);
    downloadBlob(blob, `ansokan-${match.call.id}.docx`);
  };

  // Turns this ad-hoc, never-saved intake into a real Projektbank entry —
  // carrying over everything already typed into the draft, not just the
  // original intake fields — so "save it to the project bank" (the note
  // shown below while unpersisted) is something the user can actually do
  // right here, not an instruction with no matching control anywhere in
  // the app.
  const handleSaveAsNewProject = () => {
    const resolved = Object.fromEntries(logic.map((row) => [row.label_sv, resolveSection(row)]));
    const entry = projectInputToProjectBankEntry(project, readiness);
    addImported([entry]);
    seedApplicationDraft(entry.id, match.call.id, resolved, budget);
    onSavedAsProject?.(entry.id);
  };

  // An ad-hoc, unpersisted draft's edits live only in this component's
  // state (see useApplication) — leaving without a warning would silently
  // discard everything typed so far.
  const hasUnsavedDraft = !isPersisted && (Object.keys(sectionDrafts).length > 0 || hasApplicationBudget(budget));

  const handleSaveVersion = (name: string) => {
    if (!name.trim()) return;
    const resolved = Object.fromEntries(logic.map((row) => [row.label_sv, resolveSection(row)]));
    saveVersion(name.trim(), resolved);
    setVersionName("");
  };

  // Exports exactly what was saved under this version's name, not whatever
  // the live draft has since become — falling back to the current display
  // text only for a row saveVersion wouldn't have seen yet (a call template
  // that gained a section after this version was saved).
  const handleExportVersion = async (version: ApplicationVersion) => {
    const resolved = Object.fromEntries(logic.map((row) => [row.label_sv, version.sectionDrafts[row.label_sv] ?? resolveSection(row)]));
    const versionBudget = version.budget ? resolveApplicationBudget(project, match, version.budget) : budgetFigures;
    const blob = await buildApplicationDocx(project, match, logic, resolved, versionBudget, lang);
    downloadBlob(blob, `ansokan-${match.call.id}-${version.name.toLowerCase().replace(/\s+/g, "-")}.docx`);
  };

  // The single most impactful thing to fix right now, surfaced ambiently in
  // the sidebar so it's visible regardless of which tab is open — without
  // requiring the full dimension breakdown to be on screen at all times.
  const topPriority = useMemo(() => {
    const withActions = readiness.dimensions.filter((d) => d.action_sv);
    if (withActions.length === 0) return null;
    return withActions.reduce((worst, d) => (d.score < worst.score ? d : worst));
  }, [readiness]);

  const tabs: { key: Tab; label: string }[] = [
    { key: "application", label: ws.tabApplication },
    { key: "assessment", label: ws.tabAssessment },
    { key: "process", label: ws.tabProcess },
  ];

  return (
    // data-draft-loaded: set once the stored draft has been read — before
    // that, text typed into the (server-rendered) fields may be replaced.
    <div className="mx-auto max-w-5xl" data-draft-loaded={draftLoaded}>
      <ConfirmButton
        label={`← ${backLabel === "back" ? ws.backToPrevious : ws.back}`}
        message={ws.confirmLeaveUnsavedDraft}
        confirmLabel={t.confirm.yesLeave}
        cancelLabel={t.confirm.cancel}
        onConfirm={onBack}
        skipConfirm={!hasUnsavedDraft}
        danger
        className="text-sm font-semibold text-navy-600 hover:text-navy-900"
      />

      <div className="mt-4 flex items-center gap-4">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-base font-bold text-white">
          {match.program.logoLetter}
        </span>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{project.title}</h1>
          <p className="text-sm text-navy-600">
            {ws.title} — {lang === "sv" ? match.call.title_sv : match.call.title_en}
          </p>
        </div>
      </div>

      {isPersisted && customerProjectId && (
        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-navy-100 bg-white px-4 py-3">
          <label htmlFor="application-status" className="text-sm font-semibold text-navy-700">
            {at.workspaceStatusLabel}
          </label>
          <select
            id="application-status"
            value={applicationStatus}
            onChange={(e) => setStatus(e.target.value as ApplicationStatus)}
            className="rounded-md border border-navy-200 px-2 py-1 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            {APPLICATION_STATUS_ORDER.map((st) => (
              <option key={st} value={st}>
                {at.statusLabels[st]}
              </option>
            ))}
          </select>
          <ConfirmButton
            label={`+ ${at.newApplicationButton}`}
            message={at.confirmNewApplication}
            confirmLabel={t.confirm.yesCreate}
            cancelLabel={t.confirm.cancel}
            onConfirm={handleNewApplication}
            className="text-sm font-semibold text-navy-600 hover:text-navy-900"
          />
          <Link href={`/projekt/${customerProjectId}`} className="text-sm font-semibold text-navy-600 hover:text-navy-900">
            {at.allApplicationsLink} →
          </Link>
          {otherApplicationsToCall > 0 && (
            <p className="w-full text-xs text-navy-500">{at.otherApplicationsNote(otherApplicationsToCall)}</p>
          )}
        </div>
      )}

      <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
        {/* Persistent sidebar: readiness stays visible whichever tab is open */}
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="rounded-xl border border-navy-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-navy-400">{readinessT.title}</p>
            <p className="mt-1 text-4xl font-extrabold text-navy-900" data-testid="readiness-overall">
              {readiness.overall}
              <span className="text-base font-normal text-navy-400">/100</span>
            </p>
            {overallChange !== 0 && (
              <p className={`mt-1 text-xs font-semibold ${overallChange > 0 ? "text-green-700" : "text-amber-700"}`} aria-live="polite">
                {ws.changeSinceOpened(overallChange)}
              </p>
            )}
            <div className="mt-3 border-t border-navy-50 pt-3">
              <p className="text-xs font-semibold uppercase text-navy-400">{ws.topPriorityLabel}</p>
              <p className="mt-1 text-sm text-amber-800">
                {topPriority
                  ? lang === "sv"
                    ? topPriority.action_sv
                    : topPriority.action_en
                  : ws.topPriorityNone}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleExport}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-md border border-navy-200 bg-white px-3 py-2 text-sm font-semibold text-navy-700 transition hover:bg-navy-50"
          >
            {ws.exportButton}
          </button>

          <div
            role="tablist"
            aria-label={ws.title}
            className="mt-4 flex gap-2 overflow-x-auto md:mt-6 md:flex-col md:gap-1 md:overflow-visible"
            onKeyDown={(e) => {
              if (!["ArrowRight", "ArrowLeft", "ArrowDown", "ArrowUp", "Home", "End"].includes(e.key)) return;
              e.preventDefault();
              const i = tabs.findIndex((tb) => tb.key === tab);
              let next = i;
              if (e.key === "Home") next = 0;
              else if (e.key === "End") next = tabs.length - 1;
              else if (e.key === "ArrowRight" || e.key === "ArrowDown") next = (i + 1) % tabs.length;
              else next = (i - 1 + tabs.length) % tabs.length;
              setTab(tabs[next].key);
              document.getElementById(`tab-${tabs[next].key}`)?.focus();
            }}
          >
            {tabs.map((tb) => (
              <button
                key={tb.key}
                id={`tab-${tb.key}`}
                role="tab"
                aria-selected={tab === tb.key}
                aria-controls={`panel-${tb.key}`}
                tabIndex={tab === tb.key ? 0 : -1}
                onClick={() => setTab(tb.key)}
                className={`shrink-0 rounded-md px-3 py-2 text-left text-sm font-semibold transition ${
                  tab === tb.key ? "bg-navy-800 text-white" : "text-navy-600 hover:bg-navy-50"
                }`}
              >
                {tb.label}
              </button>
            ))}
          </div>
        </aside>

        {/* Active tab content */}
        <div className="min-w-0">
          {tab === "application" && (
            <div id="panel-application" role="tabpanel" aria-labelledby="tab-application" tabIndex={0}>
              <section>
                <h2 className="text-lg font-bold text-navy-800">{ws.logicTitle}</h2>
                <p className="mt-1 text-sm text-navy-500">{ws.logicHint}</p>
                <p className="mt-1 text-xs text-navy-400">
                  {hasCallTemplate ? ws.templateSourceNote(callTitle) : ws.templateGenericNote}
                </p>
                <p className="mt-1 text-xs text-navy-400">{isPersisted ? ws.draftSavedNote : ws.draftNotSavedNote}</p>
                <div className="mt-4 space-y-4">
                  {logic.map((row, index) => {
                    const content = lang === "sv" ? row.content_sv : row.content_en;
                    const isEdited = sectionDrafts[row.label_sv] !== undefined;
                    const signals = isEdited ? textSignals(sectionDrafts[row.label_sv]) : null;
                    const found = signals
                      ? [
                          signals.quantifiedEffect && ws.signalQuantified,
                          signals.indicator && ws.signalIndicator,
                          signals.baseline && ws.signalBaseline,
                          signals.horizontalPrinciples && ws.signalHorizontal,
                        ].filter((x): x is string => Boolean(x))
                      : [];
                    const missing = readiness.dimensions.filter(
                      (d) => d.action_sv && sectionForDimension[d.key] === index
                    );
                    return (
                      <div key={row.label_sv} className="rounded-xl border border-navy-100 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <label className="text-sm font-semibold text-navy-700">
                              {lang === "sv" ? row.label_sv : row.label_en}
                            </label>
                            <span
                              className={`badge ${isEdited ? "bg-gold-100 text-gold-800" : "bg-navy-50 text-navy-400"}`}
                            >
                              {isEdited ? ws.fieldSourceEdited : ws.fieldSourceTemplate}
                            </span>
                          </div>
                          <ConfirmButton
                            label={ws.resetField}
                            ariaLabel={`${ws.resetField}: ${sectionLabel(row)}`}
                            message={ws.confirmResetField}
                            confirmLabel={t.confirm.yesReset}
                            cancelLabel={t.confirm.cancel}
                            onConfirm={() => resetSection(row.label_sv)}
                            skipConfirm={!isEdited}
                            danger
                            className="text-xs font-medium text-navy-400 hover:text-navy-700"
                          />
                        </div>
                        <textarea
                          id={`section-${index}`}
                          aria-label={sectionLabel(row)}
                          rows={3}
                          value={sectionDrafts[row.label_sv] ?? content}
                          onChange={(e) => setSection(row.label_sv, e.target.value)}
                          className="mt-2 w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                        />
                        <div className="mt-2 flex flex-wrap items-center gap-1.5" data-testid={`section-assessment-${index}`}>
                          {!isEdited && <span className="text-xs text-navy-400">{ws.notAssessedNote}</span>}
                          {found.map((label) => (
                            <span key={label} className="badge bg-green-100 text-green-800">
                              ✓ {label}
                            </span>
                          ))}
                          {missing.map((d) => (
                            <span key={d.key} className="badge bg-amber-100 text-amber-800">
                              {ws.sectionMissing(lang === "sv" ? d.label_sv : d.label_en)}
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="mt-8" aria-labelledby="budget-title">
                <h2 id="budget-title" className="text-lg font-bold text-navy-800">{ws.budgetTitle}</h2>
                <div className="mt-4 rounded-xl border border-navy-100 bg-white p-6">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <p className="text-xs font-semibold uppercase text-navy-400">{ws.totalBudget}</p>
                      <p className="mt-1 text-xl font-bold text-navy-900">{fmtSEK(budgetFigures.totalBudgetSEK, lang)}</p>
                      <p className="mt-1 text-xs text-navy-400">{ws.budgetFromProject}</p>
                    </div>
                    <div>
                      <p className="text-xs font-semibold uppercase text-navy-400">{ws.ownFinancing}</p>
                      <p className="mt-1 text-xl font-bold text-navy-700" data-testid="own-financing">
                        {fmtSEK(budgetFigures.ownFinancingSEK, lang)}
                      </p>
                      {budgetFigures.totalBudgetSEK > 0 && (
                        <p className="mt-1 text-xs text-navy-400">
                          {ws.ownFinancingShare(
                            `${Math.round((budgetFigures.ownFinancingSEK / budgetFigures.totalBudgetSEK) * 100)} %`
                          )}
                        </p>
                      )}
                    </div>
                    <BudgetAmountField
                      id="application-eligible-budget"
                      label={ws.eligibleBudget}
                      hint={ws.eligibleBudgetHint}
                      value={budget.eligibleBudgetSEK}
                      placeholder={budgetFigures.totalBudgetSEK}
                      lang={lang}
                      resetLabel={ws.budgetResetToEstimate}
                      onChange={(value) => setBudget({ eligibleBudgetSEK: value })}
                    />
                    <BudgetAmountField
                      id="application-requested-grant"
                      label={ws.requestedGrant}
                      hint={ws.requestedGrantHint(
                        `${Math.round(budgetFigures.fundingRate * 100)} %`,
                        match.call.grantRangeStated === false ? t.imported.grantNotStated : fmtSEK(match.call.maxGrantSEK, lang)
                      )}
                      value={budget.requestedGrantSEK}
                      placeholder={budgetFigures.requestedGrantSEK}
                      lang={lang}
                      resetLabel={ws.budgetResetToEstimate}
                      emphasis
                      onChange={(value) => setBudget({ requestedGrantSEK: value })}
                    />
                  </div>
                  {budgetIssues.length > 0 && (
                    <div className="mt-5 rounded-md border border-amber-200 bg-amber-50 p-3" role="status" data-testid="budget-issues">
                      <p className="text-xs font-semibold uppercase text-amber-800">{ws.budgetIssuesTitle}</p>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-amber-900">
                        {budgetIssues.map((issue) => (
                          <li key={issue.key}>{lang === "sv" ? issue.text_sv : issue.text_en}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <p className="mt-4 text-xs text-navy-400">{ws.estEuShareNote}</p>
                  {!isPersisted && hasApplicationBudget(budget) && (
                    <p className="mt-1 text-xs text-navy-400">{ws.budgetNotSavedNote}</p>
                  )}
                </div>
              </section>

              <section className="mb-16 mt-8">
                <h2 className="text-lg font-bold text-navy-800">{ws.versionsTitle}</h2>
                <p className="mt-1 text-sm text-navy-500">{isPersisted ? ws.versionsHint : ws.draftNotSavedNote}</p>
                {!isPersisted && (
                  <button
                    type="button"
                    onClick={handleSaveAsNewProject}
                    className="mt-3 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
                  >
                    {ws.saveAsNewProjectButton}
                  </button>
                )}

                <div className="mt-4 rounded-xl border border-navy-100 bg-white p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      value={versionName}
                      onChange={(e) => setVersionName(e.target.value)}
                      placeholder={ws.versionNamePlaceholder}
                      disabled={!isPersisted}
                      className="min-w-0 flex-1 rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500 disabled:cursor-not-allowed disabled:bg-navy-50 disabled:text-navy-400"
                    />
                    <button
                      type="button"
                      onClick={() => setVersionName(ws.versionQuickDraft)}
                      disabled={!isPersisted}
                      className="rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {ws.versionQuickDraft}
                    </button>
                    <button
                      type="button"
                      onClick={() => setVersionName(ws.versionQuickFinal)}
                      disabled={!isPersisted}
                      className="rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {ws.versionQuickFinal}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveVersion(versionName)}
                      disabled={!isPersisted || !versionName.trim()}
                      className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      {ws.saveVersionButton}
                    </button>
                  </div>

                  {versions.length === 0 ? (
                    <p className="mt-4 text-sm text-navy-500">{ws.noVersions}</p>
                  ) : (
                    <ul className="mt-4 divide-y divide-navy-50 border-t border-navy-50">
                      {[...versions].reverse().map((v) => (
                        <li key={v.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                          <div>
                            <p className="text-sm font-semibold text-navy-800">{v.name}</p>
                            <p className="text-xs text-navy-400">
                              {ws.versionSavedAt(new Date(v.createdAt).toLocaleString(lang === "sv" ? "sv-SE" : "en-US"))}
                            </p>
                          </div>
                          <div className="flex items-center gap-4">
                            <ConfirmButton
                              label={ws.restoreVersionButton}
                              message={ws.confirmRestoreVersion(v.name)}
                              confirmLabel={t.confirm.yesRestore}
                              cancelLabel={t.confirm.cancel}
                              onConfirm={() => restoreVersion(v.id)}
                              className="text-xs font-semibold text-navy-600 hover:text-navy-900"
                            />
                            <button
                              type="button"
                              onClick={() => handleExportVersion(v)}
                              className="text-xs font-semibold text-navy-600 hover:text-navy-900"
                            >
                              {ws.exportVersionButton}
                            </button>
                            <ConfirmButton
                              label={ws.deleteVersionButton}
                              message={ws.confirmDeleteVersion(v.name)}
                              confirmLabel={t.confirm.yesRemove}
                              cancelLabel={t.confirm.cancel}
                              onConfirm={() => deleteVersion(v.id)}
                              danger
                              className="text-xs font-medium text-navy-400 hover:text-amber-700"
                            />
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            </div>
          )}

          {tab === "assessment" && (
            <div id="panel-assessment" role="tabpanel" aria-labelledby="tab-assessment" tabIndex={0}>
              <section>
                <h2 className="text-lg font-bold text-navy-800">{readinessT.title}</h2>
                <p className="mt-1 text-xs text-navy-400">{readinessT.disclaimer}</p>
                <div className="mt-5 space-y-2.5 rounded-xl border border-navy-100 bg-white p-6">
                  {readiness.dimensions.map((d) => (
                    <div key={d.key} className="flex items-center gap-3">
                      <span className="w-40 shrink-0 text-sm text-navy-700">
                        {lang === "sv" ? d.label_sv : d.label_en}
                      </span>
                      <div className="h-2 flex-1 rounded-full bg-navy-100">
                        <div
                          className={`h-2 rounded-full ${
                            d.score >= 80 ? "bg-green-500" : d.score >= 55 ? "bg-gold-500" : "bg-amber-500"
                          }`}
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                      <span className="w-10 shrink-0 text-right text-sm font-semibold text-navy-800">{d.score}</span>
                      <span
                        className={`w-10 shrink-0 text-right text-xs font-semibold ${
                          dimensionChange(d.key) > 0 ? "text-green-700" : "text-amber-700"
                        }`}
                      >
                        {dimensionChange(d.key) !== 0 && `${dimensionChange(d.key) > 0 ? "+" : ""}${dimensionChange(d.key)}`}
                      </span>
                    </div>
                  ))}

                  {readiness.dimensions.some((d) => d.action_sv) && (
                    <div className="mt-3 border-t border-navy-50 pt-4">
                      <p className="text-sm font-semibold text-navy-700">{readinessT.recommendedActions}</p>
                      <ul className="mt-2 space-y-1.5">
                        {readiness.dimensions
                          .filter((d) => d.action_sv)
                          .map((d) => (
                            <li key={d.key} className="text-sm text-amber-800">
                              ⚠ {lang === "sv" ? d.action_sv : d.action_en}{" "}
                              {sectionForDimension[d.key] !== undefined && logic[sectionForDimension[d.key]] && (
                                <button
                                  type="button"
                                  onClick={() => goToSection(sectionForDimension[d.key])}
                                  className="font-semibold text-navy-700 underline hover:text-navy-900"
                                >
                                  {ws.goToSection(sectionLabel(logic[sectionForDimension[d.key]]))}
                                </button>
                              )}
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}
                </div>
              </section>

              <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
                <h2 className="text-lg font-bold text-navy-800">{gapT.title}</h2>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">
                  <div>
                    <p className="text-sm font-semibold text-green-700">{gapT.strengthsTitle}</p>
                    <ul className="mt-2 space-y-1.5">
                      {gap.strengths.map((s, i) => (
                        <li key={i} className="text-sm text-green-800">
                          ✓ {lang === "sv" ? s.text_sv : s.text_en}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-amber-700">{gapT.gapsTitle}</p>
                    {gap.gaps.length === 0 ? (
                      <p className="mt-2 text-sm text-navy-500">{gapT.noGaps}</p>
                    ) : (
                      <ul className="mt-2 space-y-1.5">
                        {gap.gaps.map((g, i) => (
                          <li key={i} className="text-sm text-amber-800">
                            ⚠ {lang === "sv" ? g.text_sv : g.text_en}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
                {gap.potentialScore > gap.currentScore && (
                  <p className="mt-5 rounded-md bg-gold-50 px-4 py-3 text-sm font-semibold text-gold-800">
                    {gapT.uplift(gap.currentScore, gap.potentialScore)}
                  </p>
                )}
              </section>

              <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
                <h2 className="text-lg font-bold text-navy-800">{coachT.title}</h2>
                <p className="mt-1 text-sm text-navy-500">{coachT.subtitle}</p>

                <div className="mt-4 grid grid-cols-3 gap-3">
                  <ScoreTile label={coachT.relevance} value={coach.relevance} />
                  <ScoreTile label={coachT.impact} value={coach.impact} />
                  <ScoreTile label={coachT.evidence} value={coach.evidence} />
                </div>

                <p className="mt-4 text-sm text-navy-700">{lang === "sv" ? coach.feedback_sv : coach.feedback_en}</p>

                <div className="mt-3 rounded-md bg-navy-50 p-4">
                  <p className="text-xs font-semibold uppercase text-navy-400">{coachT.suggestionLabel}</p>
                  <p className="mt-1 text-sm italic text-navy-700">
                    {lang === "sv" ? coach.suggestion_sv : coach.suggestion_en}
                  </p>
                </div>

                {coach.confidence === "low" && (
                  <div className="mt-3 rounded-md border border-amber-200 bg-amber-50 p-4">
                    <p className="text-sm text-amber-800">{coachT.lowConfidenceNote}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        type="button"
                        disabled
                        title={coachT.requestAiReviewDisabledReason}
                        className="cursor-not-allowed rounded-md border border-dashed border-amber-300 bg-white px-3 py-2 text-xs font-semibold text-amber-700 opacity-70"
                      >
                        {coachT.requestAiReviewButton}
                      </button>
                      <span className="badge bg-amber-100 text-amber-800">{coachT.requestAiReviewComingSoonBadge}</span>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {tab === "process" && (
            <div id="panel-process" role="tabpanel" aria-labelledby="tab-process" tabIndex={0}>
              <section>
                <h2 className="text-lg font-bold text-navy-800">{ws.reviewerTitle}</h2>
                <p className="mt-1 text-sm text-navy-500">{ws.reviewerSubtitle}</p>
                <ul className="mt-4 space-y-2">
                  {notes.map((note, i) => (
                    <li
                      key={i}
                      className={`rounded-lg border p-3 text-sm ${
                        note.type === "warning"
                          ? "border-amber-200 bg-amber-50 text-amber-800"
                          : "border-green-200 bg-green-50 text-green-800"
                      }`}
                    >
                      {note.type === "warning" ? "⚠ " : "✓ "}
                      {lang === "sv" ? note.text_sv : note.text_en}
                    </li>
                  ))}
                </ul>
              </section>

              <section className="mb-16 mt-6">
                <h2 className="text-lg font-bold text-navy-800">{ws.nextStepsTitle}</h2>
                <ol className="mt-4 space-y-2">
                  {ws.nextSteps.map((step, i) => (
                    <li key={step} className="flex gap-3 text-sm text-navy-600">
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy-100 text-xs font-semibold text-navy-500">
                        {i + 1}
                      </span>
                      {step}
                    </li>
                  ))}
                </ol>
              </section>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ScoreTile({ label, value }: { label: string; value: number }) {
  const color = value >= 7 ? "text-green-600" : value >= 4 ? "text-gold-600" : "text-amber-600";
  return (
    <div className="rounded-lg border border-navy-100 p-3 text-center">
      <p className={`text-2xl font-extrabold ${color}`}>{value}/10</p>
      <p className="mt-1 text-xs text-navy-500">{label}</p>
    </div>
  );
}

// An amount in whole kronor, shown with its mnkr reading beside it. Empty
// means "not set in the application": the placeholder is the suggestion used
// instead (the project's budget, or the match's estimated grant).
function BudgetAmountField({
  id,
  label,
  hint,
  value,
  placeholder,
  lang,
  resetLabel,
  emphasis = false,
  onChange,
}: {
  id: string;
  label: string;
  hint: string;
  value: number | undefined;
  placeholder: number;
  lang: "sv" | "en";
  resetLabel: string;
  emphasis?: boolean;
  onChange: (value: number | undefined) => void;
}) {
  const shown = value ?? placeholder;
  return (
    <div>
      <label htmlFor={id} className="block text-xs font-semibold uppercase text-navy-400">
        {label}
      </label>
      <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
        <input
          id={id}
          type="number"
          inputMode="numeric"
          min={0}
          step={100000}
          value={value ?? ""}
          placeholder={String(placeholder)}
          aria-describedby={`${id}-hint`}
          onChange={(e) => onChange(e.target.value === "" ? undefined : Number(e.target.value))}
          className="w-40 rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-800 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />
        <span className={`text-xl font-bold ${emphasis ? "text-green-700" : "text-navy-900"}`}>{fmtSEK(shown, lang)}</span>
        {value !== undefined && (
          <button type="button" onClick={() => onChange(undefined)} className="text-xs font-medium text-navy-400 hover:text-navy-700">
            {resetLabel}
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className="mt-1 text-xs text-navy-400">
        {hint}
      </p>
    </div>
  );
}

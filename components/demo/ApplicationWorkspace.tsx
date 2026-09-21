"use client";

import { useMemo, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MatchResult, ProjectInput } from "@/lib/types";
import { generateProjectLogic, generateReviewerNotes } from "@/lib/matching/generateWorkspace";
import { computeGapAnalysis } from "@/lib/matching/gapAnalysis";
import { computeReadiness } from "@/lib/matching/readiness";
import { analyzeSection } from "@/lib/matching/sectionCoach";
import { useApplication } from "@/lib/hooks/useApplication";
import { buildApplicationDocx, downloadBlob } from "@/lib/export/exportApplication";
import OrgProcessPanel from "@/components/OrgProcessPanel";
import { fmtSEK } from "@/lib/format";

interface Props {
  project: ProjectInput;
  match: MatchResult;
  onBack: () => void;
  /** The saved Projektbank entry this application is for, when there is
   * one — enables the draft to survive a refresh (see useApplication). Null
   * for an ad-hoc intake that was never saved anywhere. */
  customerProjectId?: string | null;
}

type Tab = "application" | "assessment" | "process";

export default function ApplicationWorkspace({ project, match, onBack, customerProjectId = null }: Props) {
  const { t, lang } = useLanguage();
  const ws = t.demo.workspace;
  const gapT = t.demo.gapAnalysis;
  const readinessT = t.demo.readiness;
  const coachT = t.demo.coach;

  const [tab, setTab] = useState<Tab>("application");

  const logic = generateProjectLogic(project, match.call, match.program);
  const notes = generateReviewerNotes(project, match.call);
  const gap = computeGapAnalysis(match);
  const readiness = computeReadiness(project, match);
  const coach = analyzeSection(project, match);

  // Editable draft of the AI-generated project logic. Persisted per (project,
  // call) when the project was saved in the Projektbank — see useApplication.
  const { sectionDrafts, setSection, resetSection, versions, saveVersion, restoreVersion, deleteVersion, isPersisted } =
    useApplication(customerProjectId, match.call.id);
  const [versionName, setVersionName] = useState("");

  const estEu = (match.estimatedFundingSEK[0] + match.estimatedFundingSEK[1]) / 2;
  const coFinancing = Math.max(0, project.budgetSEK - estEu);
  const callTitle = lang === "sv" ? match.call.title_sv : match.call.title_en;
  const hasCallTemplate = Boolean(match.call.applicationTemplate && match.call.applicationTemplate.length > 0);

  // Every section's currently *displayed* text (an override, or the AI
  // suggestion when there isn't one) — what a saved version or an export
  // should actually contain.
  const resolveSection = (row: { label_sv: string; content_sv: string; content_en: string }) =>
    sectionDrafts[row.label_sv] ?? (lang === "sv" ? row.content_sv : row.content_en);

  const handleExport = async () => {
    const resolved = Object.fromEntries(logic.map((row) => [row.label_sv, resolveSection(row)]));
    const blob = await buildApplicationDocx(project, match, logic, resolved, lang);
    downloadBlob(blob, `ansokan-${match.call.id}.docx`);
  };

  const handleSaveVersion = (name: string) => {
    if (!name.trim()) return;
    const resolved = Object.fromEntries(logic.map((row) => [row.label_sv, resolveSection(row)]));
    saveVersion(name.trim(), resolved);
    setVersionName("");
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
    <div className="mx-auto max-w-5xl">
      <button onClick={onBack} className="text-sm font-semibold text-navy-600 hover:text-navy-900">
        ← {ws.back}
      </button>

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

      <div className="mt-8 grid gap-8 md:grid-cols-[240px_1fr]">
        {/* Persistent sidebar: readiness stays visible whichever tab is open */}
        <aside className="md:sticky md:top-20 md:self-start">
          <div className="rounded-xl border border-navy-100 bg-white p-5">
            <p className="text-xs font-semibold uppercase text-navy-400">{readinessT.title}</p>
            <p className="mt-1 text-4xl font-extrabold text-navy-900">
              {readiness.overall}
              <span className="text-base font-normal text-navy-400">/100</span>
            </p>
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
                  {logic.map((row) => {
                    const content = lang === "sv" ? row.content_sv : row.content_en;
                    return (
                      <div key={row.label_sv} className="rounded-xl border border-navy-100 bg-white p-4">
                        <div className="flex items-center justify-between gap-3">
                          <label className="text-sm font-semibold text-navy-700">
                            {lang === "sv" ? row.label_sv : row.label_en}
                          </label>
                          <button
                            type="button"
                            onClick={() => resetSection(row.label_sv)}
                            className="text-xs font-medium text-navy-400 hover:text-navy-700"
                          >
                            {ws.resetField}
                          </button>
                        </div>
                        <textarea
                          rows={3}
                          value={sectionDrafts[row.label_sv] ?? content}
                          onChange={(e) => setSection(row.label_sv, e.target.value)}
                          className="mt-2 w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                        />
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="mt-8">
                <h2 className="text-lg font-bold text-navy-800">{ws.budgetTitle}</h2>
                <dl className="mt-4 grid gap-4 rounded-xl border border-navy-100 bg-white p-6 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs font-semibold uppercase text-navy-400">{ws.totalBudget}</dt>
                    <dd className="mt-1 text-xl font-bold text-navy-900">{fmtSEK(project.budgetSEK, lang)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-navy-400">{ws.estEuShare}</dt>
                    <dd className="mt-1 text-xl font-bold text-green-700">{fmtSEK(estEu, lang)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-semibold uppercase text-navy-400">{ws.coFinancing}</dt>
                    <dd className="mt-1 text-xl font-bold text-navy-700">{fmtSEK(coFinancing, lang)}</dd>
                  </div>
                </dl>
              </section>

              <section className="mb-16 mt-8">
                <h2 className="text-lg font-bold text-navy-800">{ws.versionsTitle}</h2>
                <p className="mt-1 text-sm text-navy-500">{isPersisted ? ws.versionsHint : ws.draftNotSavedNote}</p>

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
                            <button
                              type="button"
                              onClick={() => restoreVersion(v.id)}
                              className="text-xs font-semibold text-navy-600 hover:text-navy-900"
                            >
                              {ws.restoreVersionButton}
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteVersion(v.id)}
                              className="text-xs font-medium text-navy-400 hover:text-amber-700"
                            >
                              {ws.deleteVersionButton}
                            </button>
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
                              ⚠ {lang === "sv" ? d.action_sv : d.action_en}
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

              <div className="mt-6">
                <OrgProcessPanel phaseKey="application" readinessScore={readiness.overall} />
              </div>

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

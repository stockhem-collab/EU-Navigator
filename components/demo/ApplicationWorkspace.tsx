"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MatchResult, ProjectInput } from "@/lib/types";
import { generateProjectLogic, generateReviewerNotes } from "@/lib/matching/generateWorkspace";
import { computeGapAnalysis } from "@/lib/matching/gapAnalysis";
import { computeReadiness } from "@/lib/matching/readiness";
import { analyzeSection } from "@/lib/matching/sectionCoach";
import OrgProcessPanel from "@/components/OrgProcessPanel";
import { fmtSEK } from "@/lib/format";

interface Props {
  project: ProjectInput;
  match: MatchResult;
  onBack: () => void;
}

export default function ApplicationWorkspace({ project, match, onBack }: Props) {
  const { t, lang } = useLanguage();
  const ws = t.demo.workspace;
  const gapT = t.demo.gapAnalysis;
  const readinessT = t.demo.readiness;
  const coachT = t.demo.coach;

  const logic = generateProjectLogic(project, match.call, match.program);
  const notes = generateReviewerNotes(project, match.call);
  const gap = computeGapAnalysis(match);
  const readiness = computeReadiness(project, match);
  const coach = analyzeSection(project, match);

  const estEu = (match.estimatedFundingSEK[0] + match.estimatedFundingSEK[1]) / 2;
  const coFinancing = Math.max(0, project.budgetSEK - estEu);

  return (
    <div className="mx-auto max-w-3xl">
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

      {/* Application Readiness Score */}
      <section className="mt-10 rounded-xl border border-navy-100 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-lg font-bold text-navy-800">{readinessT.title}</h2>
          <div className="text-right">
            <p className="text-3xl font-extrabold text-navy-900">
              {readiness.overall}
              <span className="text-base font-normal text-navy-400"> / 100</span>
            </p>
          </div>
        </div>
        <p className="mt-2 text-xs text-navy-400">{readinessT.disclaimer}</p>

        <div className="mt-5 space-y-2.5">
          {readiness.dimensions.map((d) => (
            <div key={d.key} className="flex items-center gap-3">
              <span className="w-40 shrink-0 text-sm text-navy-700">{lang === "sv" ? d.label_sv : d.label_en}</span>
              <div className="h-2 flex-1 rounded-full bg-navy-100">
                <div
                  className={`h-2 rounded-full ${d.score >= 80 ? "bg-green-500" : d.score >= 55 ? "bg-gold-500" : "bg-amber-500"}`}
                  style={{ width: `${d.score}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-sm font-semibold text-navy-800">{d.score}</span>
            </div>
          ))}
        </div>

        {readiness.dimensions.some((d) => d.action_sv) && (
          <div className="mt-5 border-t border-navy-50 pt-4">
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
      </section>

      {/* Gap analysis */}
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

      {/* Application Coach */}
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

      {/* Project logic */}
      <section className="mt-6">
        <h2 className="text-lg font-bold text-navy-800">{ws.logicTitle}</h2>
        <div className="mt-4 divide-y divide-navy-50 overflow-hidden rounded-xl border border-navy-100 bg-white">
          {logic.map((row) => (
            <div key={row.label_sv} className="grid gap-1 p-4 sm:grid-cols-[160px_1fr]">
              <dt className="text-sm font-semibold text-navy-700">
                {lang === "sv" ? row.label_sv : row.label_en}
              </dt>
              <dd className="text-sm text-navy-600">{lang === "sv" ? row.content_sv : row.content_en}</dd>
            </div>
          ))}
        </div>
      </section>

      {/* Reviewer checklist */}
      <section className="mt-10">
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

      {/* Budget */}
      <section className="mt-10">
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

      <div className="mt-10">
        <OrgProcessPanel phaseKey="application" readinessScore={readiness.overall} />
      </div>

      <section className="mb-16 mt-10">
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

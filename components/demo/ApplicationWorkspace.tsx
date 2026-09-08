"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MatchResult, ProjectInput } from "@/lib/types";
import { generateProjectLogic, generateReviewerNotes } from "@/lib/matching/generateWorkspace";

function fmtSEK(n: number, lang: "sv" | "en"): string {
  const millions = n / 1_000_000;
  const formatted = millions.toLocaleString(lang === "sv" ? "sv-SE" : "en-US", {
    maximumFractionDigits: 1,
  });
  return lang === "sv" ? `${formatted} mnkr` : `SEK ${formatted}M`;
}

interface Props {
  project: ProjectInput;
  match: MatchResult;
  onBack: () => void;
}

export default function ApplicationWorkspace({ project, match, onBack }: Props) {
  const { t, lang } = useLanguage();
  const ws = t.demo.workspace;
  const logic = generateProjectLogic(project, match.program);
  const notes = generateReviewerNotes(project, match.program);
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
            {ws.title} — {lang === "sv" ? match.program.name_sv : match.program.name}
          </p>
        </div>
      </div>

      <section className="mt-10">
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

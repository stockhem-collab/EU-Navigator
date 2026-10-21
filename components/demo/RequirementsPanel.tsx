"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtSEK } from "@/lib/format";
import { CompletenessSummary, EvaluatedRequirement, PORTAL_PROGRAMMES } from "@/lib/data/applicationRequirements";
import RequirementList, { RequirementFiles } from "@/components/demo/RequirementList";
import type { ApplicationRequirement, CallTemplate, FundingCall, FundingProgram, RequirementState } from "@/lib/types";

interface Props {
  call: FundingCall;
  program: FundingProgram;
  /** The funder's form the application follows, if any. */
  template?: CallTemplate;
  /** The call's page limit (its own, else the form's). */
  pageLimit?: number;
  items: EvaluatedRequirement[];
  summary: CompletenessSummary;
  /** The user's own states (only the ones they set). */
  states: Record<string, RequirementState>;
  onSetState: (id: string, state: Omit<RequirementState, "updatedAt"> | null) => void;
  onAddOwn: (requirement: ApplicationRequirement) => void;
  onRemoveOwn: (id: string) => void;
  /** Files per requirement; undefined = the application isn't saved, so
   * files can't be kept. */
  files?: RequirementFiles;
  /** Opens the application at a section (by key) or its first section. */
  onOpenSection: (key?: string) => void;
  onOpenBudget: () => void;
  onStartWriting: () => void;
  showFirst: boolean;
  onShowFirstChange: (value: boolean) => void;
}

// The Krav tab: what the call asks for before the application is complete
// — a summary of the call's terms, then every requirement by group with a
// status, why it is asked for and where, who usually provides it, and a
// way to it (the section, the budget, the funder's template, an upload).
export default function RequirementsPanel({
  call,
  program,
  template,
  pageLimit,
  items,
  summary,
  states,
  onSetState,
  onAddOwn,
  onRemoveOwn,
  files,
  onOpenSection,
  onOpenBudget,
  onStartWriting,
  showFirst,
  onShowFirstChange,
}: Props) {
  const { t, lang } = useLanguage();
  const rq = t.req;
  const sv = lang === "sv";
  const locale = sv ? "sv-SE" : "en-GB";

  const deadline = call.deadlineDate;
  const daysLeft = deadline ? Math.floor((new Date(`${deadline}T23:59:59`).getTime() - Date.now()) / 86_400_000) : undefined;
  const rate = call.coFinancingRate ?? program.typicalCoFinancingRate;
  const submittedIn = template?.submittedIn ?? (PORTAL_PROGRAMMES.includes(call.programId) ? "Funding & Tenders Portal" : undefined);
  const pct = summary.score;

  return (
    <div data-testid="requirements-panel">
      <section className="rounded-xl border border-navy-100 bg-white p-5">
        <h2 className="text-lg font-bold text-navy-800">{rq.title}</h2>
        <p className="mt-1 text-sm text-navy-500">{rq.intro}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3" data-testid="requirements-summary">
          {deadline && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryDeadline}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">
                {new Date(`${deadline}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                {call.closes?.preliminary && " (prel.)"}
                {daysLeft !== undefined && (
                  <span className={`ml-1 text-xs font-normal ${daysLeft < 0 ? "text-navy-400" : daysLeft <= 30 ? "text-amber-700" : "text-navy-500"}`}>
                    · {daysLeft < 0 ? rq.closed : rq.daysLeft(daysLeft)}
                  </span>
                )}
              </dd>
            </div>
          )}
          {submittedIn && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summarySubmittedIn}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">{submittedIn}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryForm}</dt>
            <dd className="mt-0.5 font-semibold text-navy-800">{template ? (sv ? template.title_sv : template.title_en) : rq.summaryNoForm}</dd>
          </div>
          {pageLimit !== undefined && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryPageLimit}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">{rq.summaryPageLimitValue(pageLimit)}</dd>
            </div>
          )}
          {rate !== undefined && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryGrantRate}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">
                {Math.round(rate * 100)} %{rate < 1 && <span className="font-normal text-navy-500"> · {rq.summaryOwnShare(Math.round((1 - rate) * 100))}</span>}
              </dd>
            </div>
          )}
          {call.requiresPartnership && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryPartnership}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">{rq.summaryPartnershipValue(call.minPartnerCountries ?? 2)}</dd>
            </div>
          )}
          {call.maxGrantSEK > 0 && call.grantRangeStated !== false && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{t.demo.workspace.requestedGrant}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">≤ {fmtSEK(call.maxGrantSEK, lang)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 border-t border-navy-50 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-navy-700" data-testid="requirements-progress">
              {summary.counted > 0 && summary.done === summary.counted ? rq.allDone : rq.progress(summary.done, summary.counted)}
            </p>
            <p className="text-sm text-navy-500">
              {rq.completenessLabel}: <span className="font-bold text-navy-800">{pct} %</span>
            </p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-navy-100">
            <div className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-green-600" : "bg-gold-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-navy-500">
              <input type="checkbox" checked={showFirst} onChange={(e) => onShowFirstChange(e.target.checked)} />
              {rq.showFirstLabel}
            </label>
            <button type="button" onClick={onStartWriting} className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
              {rq.startWriting}
            </button>
          </div>
        </div>
      </section>

      <RequirementList
        items={items}
        states={states}
        onSetState={onSetState}
        onAddOwn={onAddOwn}
        onRemoveOwn={onRemoveOwn}
        files={files}
        actions={(item) => {
          const req = item.requirement;
          const check = req.check;
          return (
            <>
              {(check?.type === "form" || check?.type === "page-limit") && (
                <button type="button" onClick={() => onOpenSection()} className="font-semibold text-navy-700 underline hover:text-navy-900">
                  {rq.openSection}
                </button>
              )}
              {check?.type === "section" && (
                <button type="button" onClick={() => onOpenSection(check.key)} className="font-semibold text-navy-700 underline hover:text-navy-900">
                  {rq.openSection}
                </button>
              )}
              {(check?.type === "cost-categories" || check?.type === "budget") && (
                <button type="button" onClick={onOpenBudget} className="font-semibold text-navy-700 underline hover:text-navy-900">
                  {rq.openBudget}
                </button>
              )}
              {req.id === "generic-call-annexes" && call.link && (
                <a href={call.link} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-700 underline hover:text-navy-900">
                  {rq.callPage}
                </a>
              )}
            </>
          );
        }}
      />

      <p className="mt-4 text-xs text-navy-500">{rq.callTextWins}</p>
      {/* From the end of the list straight on to writing. */}
      <button
        type="button"
        onClick={onStartWriting}
        className="mb-16 mt-4 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
        data-testid="requirements-start-writing-bottom"
      >
        {rq.startWriting}
      </button>
    </div>
  );
}

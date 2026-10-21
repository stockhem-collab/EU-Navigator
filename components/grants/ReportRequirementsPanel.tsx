"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtSEK } from "@/lib/format";
import { findCall } from "@/lib/data/fundingCalls";
import { GROUP_ORDER, PORTAL_PROGRAMMES, ResolvedRequirement, groupOf } from "@/lib/data/applicationRequirements";
import { reportRequirementFileKey } from "@/lib/data/reportDocuments";
import { formatReportDue } from "@/lib/matching/reportingSchedule";
import { useAttachments } from "@/lib/hooks/useAttachments";
import { useCallTemplates } from "@/lib/hooks/useCallTemplates";
import { useReportRequirements } from "@/lib/hooks/useReportRequirements";
import { ReportDraft } from "@/lib/hooks/useReportingSubmissions";
import RequirementList from "@/components/demo/RequirementList";
import type { ApplicationRequirement, Grant, ReportingEvent, RequirementState } from "@/lib/types";

// The overview at the top of a grant: what the call's reports require to be
// complete — the reporting terms, then every requirement by group, with the
// status for the report to write now and the ones that come with a later
// report. Opened the first time the grant is opened, a line after that.
export default function ReportRequirementsPanel({
  grant,
  event,
  draft,
  onStatesChange,
  onOwnChange,
  open,
  onOpenChange,
}: {
  grant: Grant;
  /** The report to write now, if any. */
  event?: ReportingEvent;
  draft?: ReportDraft;
  onStatesChange: (states: Record<string, RequirementState>) => void;
  onOwnChange: (own: ApplicationRequirement[]) => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, lang } = useLanguage();
  const rq = t.req;
  const rp = rq.report;
  const ap = t.grants;
  const sv = lang === "sv";
  const call = findCall(grant.callId);
  const template = useCallTemplates().reportTemplateFor(call);
  const { attachmentsFor, addAttachment, removeAttachment } = useAttachments();
  const active = event && event.type !== "sustainability" ? event : undefined;
  const { all, items, summary } = useReportRequirements(grant, active, draft);
  const reqTerms = call?.reportingRequirements;
  const submittedIn = template?.submittedIn ?? (call && PORTAL_PROGRAMMES.includes(call.programId) ? "Funding & Tenders Portal" : undefined);
  const states = draft?.requirementStates ?? {};
  const shownIds = new Set((items ?? []).map((i) => i.requirement.id));
  const other = all.filter((r) => !shownIds.has(r.requirement.id));
  const reportLabel = active ? (sv ? active.periodLabel_sv : active.periodLabel_en) : "";

  const appliesTo = (req: ApplicationRequirement) =>
    req.reports?.length === 1 ? (req.reports[0] === "final" ? rp.appliesFinal : rp.appliesInterim) : undefined;
  const periodicity =
    reqTerms?.periodicity === "quarterly" ? ap.periodicityQuarterly : reqTerms?.periodicity === "biannual" ? ap.periodicityBiannual : reqTerms ? ap.periodicityAnnual : undefined;

  const setState = (id: string, state: Omit<RequirementState, "updatedAt"> | null) => {
    const next = { ...states };
    if (state) next[id] = { ...state, updatedAt: new Date().toISOString() };
    else delete next[id];
    onStatesChange(next);
  };

  const pct = summary?.score ?? 0;
  return (
    <section id="report-requirements" className="mt-8 rounded-xl border border-navy-100 bg-white p-5" data-testid="report-requirements" aria-labelledby="report-requirements-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="report-requirements-heading" className="text-lg font-bold text-navy-800">
            {rp.title}
          </h2>
          {summary && (
            <p className="mt-0.5 text-sm text-navy-600" data-testid="report-requirements-line">
              {rp.cardLine(pct, summary.open.length)}
            </p>
          )}
        </div>
        <button
          type="button"
          aria-expanded={open}
          onClick={() => onOpenChange(!open)}
          className="text-sm font-semibold text-navy-600 hover:text-navy-900"
          data-testid="report-requirements-toggle"
        >
          {open ? rp.hide : rp.show}
        </button>
      </div>

      {open && (
        <div className="mt-3">
          <p className="text-sm text-navy-500">{rp.intro}</p>
          <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3" data-testid="report-requirements-summary">
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rp.summaryReportForm}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">{template ? (sv ? template.title_sv : template.title_en) : rq.summaryNoForm}</dd>
            </div>
            {submittedIn && (
              <div>
                <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summarySubmittedIn}</dt>
                <dd className="mt-0.5 font-semibold text-navy-800">{submittedIn}</dd>
              </div>
            )}
            {reqTerms && (
              <div>
                <dt className="text-xs font-semibold uppercase text-navy-400">{rp.summaryPeriodicity}</dt>
                <dd className="mt-0.5 font-semibold text-navy-800">
                  {periodicity}
                  <span className="block text-xs font-normal text-navy-500">{ap.interimReportsRequiredLabel(reqTerms.interimReportsRequired)}</span>
                </dd>
              </div>
            )}
            {active && (
              <div>
                <dt className="text-xs font-semibold uppercase text-navy-400">{rp.summaryNextReport}</dt>
                <dd className="mt-0.5 font-semibold text-navy-800">
                  {reportLabel}
                  <span className="block text-xs font-normal text-navy-500">{ap.dueOn(formatReportDue(active, lang))}</span>
                </dd>
              </div>
            )}
            {reqTerms?.requiresAuditAboveSEK != null && grant.awardedAmountSEK > reqTerms.requiresAuditAboveSEK && (
              <div>
                <dt className="text-xs font-semibold uppercase text-navy-400">{rp.summaryAudit}</dt>
                <dd className="mt-0.5 font-semibold text-navy-800">{rp.summaryAuditValue(fmtSEK(reqTerms.requiresAuditAboveSEK, lang))}</dd>
              </div>
            )}
          </dl>

          {items && summary ? (
            <>
              <div className="mt-5 border-t border-navy-50 pt-4">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <p className="text-sm font-semibold text-navy-700" data-testid="report-requirements-progress">
                    {summary.counted > 0 && summary.done === summary.counted ? rp.allDone : rp.progress(summary.done, summary.counted)}
                  </p>
                  <p className="text-sm text-navy-500">
                    {rq.completenessLabel}: <span className="font-bold text-navy-800">{pct} %</span>
                  </p>
                </div>
                <div className="mt-2 h-2 rounded-full bg-navy-100">
                  <div className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-green-600" : "bg-gold-500"}`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-2 text-xs text-navy-500">{rp.statusFor(reportLabel)}</p>
              </div>
              <RequirementList
                items={items}
                states={states}
                onSetState={setState}
                onAddOwn={(r) => onOwnChange([...(grant.ownReportRequirements ?? []), r])}
                onRemoveOwn={(id) => {
                  onOwnChange((grant.ownReportRequirements ?? []).filter((r) => r.id !== id));
                  setState(id, null);
                }}
                files={
                  active && {
                    list: (id) => attachmentsFor(reportRequirementFileKey(grant.id, active.id, id)),
                    add: (id, file) => addAttachment(reportRequirementFileKey(grant.id, active.id, id), file),
                    remove: (id, attachmentId) => removeAttachment(reportRequirementFileKey(grant.id, active.id, id), attachmentId),
                  }
                }
                badges={(item) => {
                  const applies = appliesTo(item.requirement);
                  return applies ? <span className="badge bg-gold-100 text-gold-800">{applies}</span> : null;
                }}
                actions={(item) =>
                  item.requirement.check?.type.startsWith("report-") ? (
                    <a href="#next-report" className="font-semibold text-navy-700 underline hover:text-navy-900">
                      {rp.goToReport}
                    </a>
                  ) : null
                }
                groupLabels={rp.groups}
                autoLabel={rp.autoBadge}
                addOwnHint={rp.addOwnHint}
              />
            </>
          ) : (
            <p className="mt-4 text-sm text-navy-600">{rp.noActiveReport}</p>
          )}

          {other.length > 0 && (
            <OtherReports title={items ? rp.otherReportsTitle : undefined} requirements={other} appliesTo={appliesTo} />
          )}
          <p className="mt-4 text-xs text-navy-500">{rp.callTextWins}</p>
        </div>
      )}
    </section>
  );
}

// The requirements that come with another report than the one being
// written (or, with no report to write, all of them) — for reference.
function OtherReports({
  title,
  requirements,
  appliesTo,
}: {
  title?: string;
  requirements: ResolvedRequirement[];
  appliesTo: (req: ApplicationRequirement) => string | undefined;
}) {
  const { t, lang } = useLanguage();
  const rp = t.req.report;
  return (
    <div className="mt-6" data-testid="report-requirements-other">
      {title && (
        <>
          <h3 className="font-bold text-navy-800">{title}</h3>
          <p className="text-xs text-navy-500">{rp.otherReportsHint}</p>
        </>
      )}
      {GROUP_ORDER.map((group) => {
        const inGroup = requirements.filter((r) => groupOf(r.requirement.kind) === group);
        if (inGroup.length === 0) return null;
        return (
          <div key={group} className="mt-3">
            <p className="text-xs font-semibold uppercase text-navy-400">{rp.groups[group]}</p>
            <ul className="mt-1 space-y-1">
              {inGroup.map(({ requirement: req }) => {
                const applies = appliesTo(req);
                return (
                  <li key={req.id} className="flex flex-wrap items-center gap-2 text-sm text-navy-700">
                    <span>{lang === "sv" ? req.title_sv : req.title_en}</span>
                    {applies && <span className="badge bg-gold-100 text-gold-800">{applies}</span>}
                  </li>
                );
              })}
            </ul>
          </div>
        );
      })}
    </div>
  );
}

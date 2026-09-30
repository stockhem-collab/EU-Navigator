"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  nextActionableReport,
  latestOutcomeEventFor,
  outcomeHistoryFor,
  isReportingComplete,
  reportingHealth,
  ReportingHealth,
  financialHistory,
  expectedShareAt,
  isDeviation,
} from "@/lib/data/grants";
import { seedGrants } from "@/lib/data/grants";
import { findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useGrants } from "@/lib/hooks/useGrants";
import { useApplications } from "@/lib/hooks/useApplications";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { useAttachments } from "@/lib/hooks/useAttachments";
import { buildGrantDocx, ReportContent } from "@/lib/export/exportReport";
import { downloadBlob } from "@/lib/export/exportApplication";
import { formatReportDue } from "@/lib/matching/reportingSchedule";
import { fmtSEK } from "@/lib/format";
import { Grant, Commitment, ReportingEvent, ReportingPeriodicity } from "@/lib/types";
import ReportCard, { documentAttachmentKey, reportAttachmentKey, requiredDocuments, statusStyle } from "@/components/grants/ReportCard";
import CommitmentsEditor, { completeCommitments } from "@/components/grants/CommitmentsEditor";

// A grant and its reporting, ordered from "what do I do now" to reference:
// the key figures, the report to write next, how the project is doing
// (commitments and finances together), every report in the plan, and last
// the call's reporting requirements and the links to project and
// application.
export default function GrantPage() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const ap = t.grants;
  const pb = t.projectBank;
  const {
    withSubmissions,
    submitReport,
    submissionHistory,
    addSustainabilityEvent,
    setEventStatus,
    statusChanges,
    reportDraft,
    updateReportDraft,
  } = useReportingSubmissions();
  const { all: projectBank, updateEntry, hydrated: projectBankHydrated } = useProjectBank();
  const { all: grants, updateGrant, hydrated: grantsHydrated } = useGrants();
  const { records: applicationRecords } = useApplications();
  const { users } = useUsersDirectory();
  const { attachmentsFor } = useAttachments();
  const [openReports, setOpenReports] = useState<string[]>([]);

  // A grant registered from an application only exists in this browser's
  // storage, unavailable during the server render — wait for it before
  // deciding it doesn't exist.
  const storedGrant = grants.find((a) => a.id === params.id);
  const grant = storedGrant ? withSubmissions(storedGrant) : undefined;
  const linkedEntry = grant?.projectBankEntryId ? projectBank.find((p) => p.id === grant.projectBankEntryId) : undefined;
  const linkedApplication = grant
    ? applicationRecords.find((r) => r.id === grant.applicationId || r.awardedProjectId === grant.id)
    : undefined;
  const reportingComplete = grant ? isReportingComplete(grant) : false;

  // The project's status follows its reporting: running while it goes on,
  // completed once it's done.
  useEffect(() => {
    if (!projectBankHydrated || !linkedEntry) return;
    if (reportingComplete && linkedEntry.status !== "completed") {
      updateEntry(linkedEntry.id, { status: "completed" });
    } else if (!reportingComplete && linkedEntry.status !== "running") {
      updateEntry(linkedEntry.id, { status: "running" });
    }
  }, [projectBankHydrated, linkedEntry, reportingComplete, updateEntry]);

  if (!grant) {
    if (!grantsHydrated) return null;
    return (
      <>
        <Header />
        <main className="section max-w-3xl">
          <Link href="/rapportera" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
            ← {ap.back}
          </Link>
          <p className="mt-8 text-sm text-navy-500">{pb.detailNotFound}</p>
        </main>
        <Footer />
      </>
    );
  }

  const call = findCall(grant.callId);
  const program = call ? findProgram(call.programId) : undefined;
  const reportingReq = call?.reportingRequirements;
  const nextActionable = nextActionableReport(grant);
  const health = reportingHealth(grant);
  const hasSustainabilityEvent = grant.reportingEvents.some((e) => e.type === "sustainability");
  const seedGrant = seedGrants.find((g) => g.id === grant.id);
  const totalSpent = financialHistory(grant).reduce((sum, h) => sum + h.spentThisPeriodSEK, 0);

  const periodicityLabel = (p: ReportingPeriodicity) =>
    p === "quarterly" ? ap.periodicityQuarterly : p === "biannual" ? ap.periodicityBiannual : ap.periodicityAnnual;
  const healthStyle = (h: ReportingHealth) =>
    h === "blocked" ? "bg-amber-100 text-amber-800" : h === "attention" ? "bg-gold-100 text-gold-800" : "bg-green-100 text-green-800";
  const healthLabel = (h: ReportingHealth) =>
    h === "blocked" ? ap.healthBlockedLabel : h === "attention" ? ap.healthAttentionLabel : ap.healthGoodLabel;

  // What a report says, for its export: the latest submission's text, or
  // the draft being written.
  const contentFor = (event: ReportingEvent): ReportContent => {
    const draft = reportDraft(grant.id, event.id);
    const latest = submissionHistory(grant.id, event.id).slice(-1)[0];
    const note = lang === "sv" ? event.note_sv : event.note_en;
    const sections = { ...(note ? { summary: note } : {}), ...(latest?.sections ?? {}), ...draft.sections };
    const owner = users.find((u) => u.id === draft.ownerId);
    return {
      sections,
      deviations: { ...(latest?.deviations ?? {}), ...draft.deviations },
      documents: requiredDocuments(grant, event, lang).map((name, i) => {
        const files = attachmentsFor(documentAttachmentKey(grant.id, event.id, i)).map((a) => a.fileName);
        return { name, ready: Boolean(draft.checklist[name]) || files.length > 0, files };
      }),
      otherAttachments: attachmentsFor(reportAttachmentKey(grant.id, event.id)).map((a) => a.fileName),
      ownerName: owner ? `${owner.firstName} ${owner.lastName}` : undefined,
    };
  };

  const apiFor = (event: ReportingEvent) => ({
    draft: reportDraft(grant.id, event.id),
    updateDraft: (patch: Parameters<typeof updateReportDraft>[2]) => updateReportDraft(grant.id, event.id, patch),
    history: submissionHistory(grant.id, event.id),
    statusChanges: statusChanges(grant.id, event.id),
    onSubmit: (
      outcomes: Record<string, number>,
      note: string,
      spent: number | undefined,
      content: { sections: Record<string, string>; deviations: Record<string, string> }
    ) => submitReport(grant.id, event.id, outcomes, note, spent, content),
    onSetStatus: (status: Parameters<typeof setEventStatus>[2]) => setEventStatus(grant.id, event.id, status),
    contentFor: () => contentFor(event),
    seedEvent: seedGrant?.reportingEvents.find((e) => e.id === event.id),
  });

  const handleExportAll = async () => {
    const blob = await buildGrantDocx(grant, call, program, contentFor, lang);
    downloadBlob(blob, `stod-${grant.id}.docx`);
  };

  const projectName = linkedEntry ? (lang === "sv" ? linkedEntry.title_sv : linkedEntry.title_en) : lang === "sv" ? grant.title_sv : grant.title_en;
  const grantName = lang === "sv" ? grant.title_sv : grant.title_en;

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <Link href="/rapportera" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          ← {ap.back}
        </Link>

        {/* 1. Header and key figures */}
        <div className="mt-4 flex items-center gap-4">
          {program && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-base font-bold text-white">
              {program.logoLetter}
            </span>
          )}
          <div className="flex-1">
            <p className="text-xs font-semibold uppercase text-navy-400">{ap.title}</p>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-navy-900">{projectName}</h1>
              <span className={`badge ${healthStyle(health)}`}>{healthLabel(health)}</span>
            </div>
            {projectName !== grantName && <p className="text-sm text-navy-500">{ap.euProjectName(grantName)}</p>}
            {call && <p className="text-sm text-navy-600">{lang === "sv" ? call.title_sv : call.title_en}</p>}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 rounded-xl border border-navy-100 bg-white p-6 sm:grid-cols-3">
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{ap.awardedAmount}</dt>
            <dd className="mt-1 text-xl font-bold text-navy-900">{fmtSEK(grant.awardedAmountSEK, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{ap.spentLabel}</dt>
            <dd className="mt-1 text-xl font-bold text-navy-900">{fmtSEK(totalSpent, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{ap.nextReportDueLabel}</dt>
            <dd className="mt-1 text-base font-bold text-navy-900">
              {nextActionable ? (
                <>
                  {lang === "sv" ? nextActionable.periodLabel_sv : nextActionable.periodLabel_en}
                  <span className="block text-sm font-normal text-navy-600">
                    {nextActionable.status === "revision-requested"
                      ? ap.reportStatusRevisionRequested
                      : ap.dueOn(formatReportDue(nextActionable, lang))}
                  </span>
                </>
              ) : (
                ap.reportingCompleteLabel
              )}
            </dd>
          </div>
        </dl>

        {/* 2. The report to write now */}
        <section id="next-report" className="mt-8" aria-labelledby="next-report-heading">
          <h2 id="next-report-heading" className="text-lg font-bold text-navy-800">
            {ap.nextReportTitle}
          </h2>
          {nextActionable ? (
            <div className="mt-3">
              <ReportCard grant={grant} event={nextActionable} working users={users} api={apiFor(nextActionable)} />
            </div>
          ) : (
            <div className="mt-3 rounded-xl border border-dashed border-navy-200 p-4">
              <p className="text-sm font-semibold text-navy-700">{ap.reportingCompleteLabel}</p>
              {reportingComplete && !hasSustainabilityEvent && (
                <>
                  <p className="mt-1 text-sm text-navy-600">{ap.addSustainabilityHint}</p>
                  <button
                    type="button"
                    onClick={() => addSustainabilityEvent(grant.id, 36)}
                    className="mt-2 rounded-md border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50"
                  >
                    {ap.addSustainabilityButton}
                  </button>
                </>
              )}
            </div>
          )}
        </section>

        {/* 3. How it's going: commitments and finances together */}
        <section id="follow-up" className="mt-10" aria-labelledby="follow-up-heading">
          <h2 id="follow-up-heading" className="text-lg font-bold text-navy-800">
            {ap.followUpTitle}
          </h2>
          <CommitmentsSection grant={grant} onSave={(commitments) => updateGrant(grant.id, { commitments })} />
          <FinancialSummaryCard grant={grant} totalSpent={totalSpent} />
        </section>

        {/* 4. Every report in the plan */}
        <section id="reports" className="mt-10" aria-labelledby="reports-heading">
          <h2 id="reports-heading" className="text-lg font-bold text-navy-800">
            {ap.allReportsTitle}
          </h2>
          <p className="mt-1 text-sm text-navy-500">{ap.allReportsHint}</p>
          <ul className="mt-3 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
            {grant.reportingEvents.map((event) => {
              const isNext = event.id === nextActionable?.id;
              const open = openReports.includes(event.id);
              return (
                <li key={event.id} className="px-4 py-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-sm font-semibold text-navy-800">{lang === "sv" ? event.periodLabel_sv : event.periodLabel_en}</h3>
                      <p className="text-xs text-navy-500">{ap.dueOn(formatReportDue(event, lang))}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`badge ${statusStyle(event.status)}`}>
                        {event.status === "approved"
                          ? ap.reportStatusApproved
                          : event.status === "submitted"
                          ? ap.reportStatusSubmitted
                          : event.status === "revision-requested"
                          ? ap.reportStatusRevisionRequested
                          : ap.reportStatusUpcoming}
                      </span>
                      {isNext ? (
                        <a href="#next-report" className="text-xs font-semibold text-navy-600 hover:text-navy-900">
                          {ap.seeNextReport}
                        </a>
                      ) : (
                        <button
                          type="button"
                          aria-expanded={open}
                          onClick={() => setOpenReports(open ? openReports.filter((id) => id !== event.id) : [...openReports, event.id])}
                          className="text-xs font-semibold text-navy-600 hover:text-navy-900"
                        >
                          {open ? ap.hideDetails : ap.showDetails}
                        </button>
                      )}
                    </div>
                  </div>
                  {open && !isNext && (
                    <div className="mt-3">
                      <ReportCard grant={grant} event={event} working={false} users={users} api={apiFor(event)} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </section>

        {/* 5. Reference: the call's reporting requirements, in one place */}
        {reportingReq && (
          <details className="mt-10 rounded-xl border border-navy-100 bg-white p-5">
            <summary className="cursor-pointer text-sm font-semibold text-navy-800">{ap.reportingRequirementsTitle}</summary>
            <dl className="mt-3">
              <dt className="text-xs text-navy-400">{ap.periodicityLabel}</dt>
              <dd className="font-semibold text-navy-800">{periodicityLabel(reportingReq.periodicity)}</dd>
            </dl>
            <p className="mt-3 text-sm text-navy-600">{ap.interimReportsRequiredLabel(reportingReq.interimReportsRequired)}</p>
            {reportingReq.requiresAuditAboveSEK !== null && grant.awardedAmountSEK > reportingReq.requiresAuditAboveSEK && (
              <p className="mt-3 text-sm text-navy-600">
                {ap.auditRequiredAboveLabel} {fmtSEK(reportingReq.requiresAuditAboveSEK, lang)}
              </p>
            )}
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              {[
                { label: ap.interimDocumentsLabel, docs: lang === "sv" ? reportingReq.interimDocuments_sv : reportingReq.interimDocuments_en },
                { label: ap.finalReportDocumentsLabel, docs: lang === "sv" ? reportingReq.finalReportDocuments_sv : reportingReq.finalReportDocuments_en },
              ].map((group) => (
                <div key={group.label}>
                  <p className="text-xs font-semibold uppercase text-navy-400">{group.label}</p>
                  <ul className="mt-1.5 space-y-1">
                    {group.docs.map((d) => (
                      <li key={d} className="text-sm text-navy-600">
                        · {d}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </details>
        )}

        {/* 6. Links, and the whole grant as one document */}
        <section className="mb-16 mt-6 rounded-xl bg-navy-50 px-4 py-3" aria-labelledby="links-heading">
          <h2 id="links-heading" className="text-xs font-semibold uppercase text-navy-400">
            {ap.linksTitle}
          </h2>
          {projectBankHydrated && linkedEntry && (
            <p className="mt-1 text-xs text-navy-600">
              {ap.linkedProjectBankLabel}:{" "}
              <Link href={`/projekt/${linkedEntry.id}`} className="font-semibold text-navy-800 hover:underline">
                {lang === "sv" ? linkedEntry.title_sv : linkedEntry.title_en}
              </Link>
            </p>
          )}
          {linkedApplication && call && (
            <p className="mt-1 text-xs text-navy-600">
              {ap.linkedApplicationLabel}:{" "}
              <Link
                href={`/ansokan?project=${linkedApplication.projectId}&call=${linkedApplication.callId}&application=${encodeURIComponent(linkedApplication.id)}`}
                className="font-semibold text-navy-800 hover:underline"
              >
                {ap.openApplicationLink}
              </Link>
            </p>
          )}
          {linkedEntry && <p className="mt-1 text-xs text-navy-400">{ap.linkedProjectStatusAutoSyncNote}</p>}
          <button
            type="button"
            onClick={handleExportAll}
            className="mt-3 rounded-md border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-100"
          >
            {ap.exportGrantButton}
          </button>
        </section>
      </main>
      <Footer />
    </>
  );
}

// The commitments against their latest outcome, judged against what should
// have been reached by the report it came from — and editable, since a
// grant registered without them (or with the wrong ones) needs fixing.
function CommitmentsSection({ grant, onSave }: { grant: Grant; onSave: (commitments: Commitment[]) => void }) {
  const { t } = useLanguage();
  const ap = t.grants;
  const [editing, setEditing] = useState<Commitment[] | null>(null);

  return (
    <div className="mt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold uppercase text-navy-400">{ap.commitmentsTitle}</h3>
        {!editing && (
          <button
            type="button"
            onClick={() => setEditing(grant.commitments)}
            className="text-xs font-semibold text-navy-600 hover:text-navy-900"
          >
            {ap.commitmentsEdit}
          </button>
        )}
      </div>
      {editing ? (
        <div className="mt-2 rounded-xl border border-navy-100 bg-white p-4">
          <CommitmentsEditor value={editing} onChange={setEditing} idPrefix={`grant-${grant.id}`} />
          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={() => {
                onSave(completeCommitments(editing));
                setEditing(null);
              }}
              className="rounded-md bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white hover:bg-navy-700"
            >
              {ap.commitmentsSave}
            </button>
            <button
              type="button"
              onClick={() => setEditing(null)}
              className="rounded-md border border-navy-200 px-3 py-1.5 text-xs font-semibold text-navy-600 hover:bg-navy-50"
            >
              {t.confirm.cancel}
            </button>
          </div>
        </div>
      ) : grant.commitments.length === 0 ? (
        <p className="mt-2 rounded-xl border border-dashed border-navy-200 p-4 text-sm text-navy-600">{ap.commitmentsEmptyHint}</p>
      ) : (
        <div className="mt-2 space-y-3">
          {grant.commitments.map((c) => (
            <CommitmentCard key={c.indicator_sv} commitment={c} grant={grant} />
          ))}
        </div>
      )}
    </div>
  );
}

function CommitmentCard({ commitment: c, grant }: { commitment: Commitment; grant: Grant }) {
  const { t, lang } = useLanguage();
  const ap = t.grants;
  const latest = latestOutcomeEventFor(grant, c.indicator_sv);
  const deviates = latest !== undefined && isDeviation(latest.value, c.promisedValue, expectedShareAt(grant, latest.eventId));
  const unit = lang === "sv" ? c.unit_sv : c.unit_en;
  const fmt = (v: number) => v.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");
  const history = outcomeHistoryFor(grant, c.indicator_sv);
  const maxValue = Math.max(c.promisedValue, ...history.map((h) => h.value), 1);
  const targetPct = Math.min(100, (c.promisedValue / maxValue) * 100);

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-semibold text-navy-800">{lang === "sv" ? c.indicator_sv : c.indicator_en}</h4>
        <span
          className={`badge ${
            latest === undefined ? "bg-navy-50 text-navy-400" : deviates ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
          }`}
        >
          {latest !== undefined ? `${fmt(latest.value)} / ${fmt(c.promisedValue)} ${unit}` : ap.noLatestOutcome}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-navy-100">
        <div
          className={`h-2 rounded-full ${latest === undefined ? "bg-navy-200" : deviates ? "bg-amber-500" : "bg-green-500"}`}
          style={{ width: `${c.promisedValue > 0 ? Math.min(100, ((latest?.value ?? 0) / c.promisedValue) * 100) : 0}%` }}
        />
      </div>
      {history.length > 1 && (
        <div className="mt-4 border-t border-navy-50 pt-3">
          <p className="text-xs font-semibold uppercase text-navy-400">{ap.trendChartTitle}</p>
          <div className="relative mt-2" style={{ height: 56 }}>
            <div
              className="absolute inset-x-0 border-t border-dashed border-gold-500"
              style={{ bottom: `${targetPct}%` }}
              title={`${ap.trendChartTarget}: ${fmt(c.promisedValue)} ${unit}`}
            />
            <div className="flex h-full items-end gap-2">
              {history.map((h, i) => (
                <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={`${fmt(h.value)} ${unit}`}>
                  <div className="w-full rounded-t bg-navy-600" style={{ height: `${Math.min(100, (h.value / maxValue) * 100)}%` }} />
                  <span className="text-[10px] text-navy-400">{lang === "sv" ? h.periodLabel_sv : h.periodLabel_en}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Spend against the grant, and — for a grant registered from an
// application — against the budget it planned with.
function FinancialSummaryCard({ grant, totalSpent }: { grant: Grant; totalSpent: number }) {
  const { t, lang } = useLanguage();
  const ap = t.grants;
  const history = financialHistory(grant);
  const remaining = grant.awardedAmountSEK - totalSpent;
  const pct = grant.awardedAmountSEK > 0 ? Math.min(100, (totalSpent / grant.awardedAmountSEK) * 100) : 0;
  const maxSpend = Math.max(...history.map((h) => h.spentThisPeriodSEK), 1);

  return (
    <div className="mt-4 rounded-xl border border-navy-100 bg-white p-6">
      <h3 className="text-sm font-semibold uppercase text-navy-400">{ap.financialSummaryTitle}</h3>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-sm text-navy-600">{ap.financialSpentLabel}</span>
        <span className="font-semibold text-navy-800">
          {fmtSEK(totalSpent, lang)} / {fmtSEK(grant.awardedAmountSEK, lang)}
        </span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-navy-100">
        <div className="h-2 rounded-full bg-navy-600" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-xs text-navy-500">
        {ap.financialRemainingLabel}: {fmtSEK(remaining, lang)}
      </p>
      {grant.plannedBudget && (
        <dl className="mt-4 grid gap-3 border-t border-navy-50 pt-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-xs text-navy-400">{ap.plannedBudgetLabel}</dt>
            <dd className="font-semibold text-navy-800">{fmtSEK(grant.plannedBudget.totalBudgetSEK, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs text-navy-400">{ap.plannedOwnFinancingLabel}</dt>
            <dd className="font-semibold text-navy-800">{fmtSEK(grant.plannedBudget.ownFinancingSEK, lang)}</dd>
          </div>
        </dl>
      )}
      {history.length > 1 && (
        <div className="mt-4 border-t border-navy-50 pt-3">
          <p className="text-xs font-semibold uppercase text-navy-400">{ap.financialHistoryTitle}</p>
          <div className="mt-2 flex h-14 items-end gap-2">
            {history.map((h, i) => (
              <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1" title={fmtSEK(h.spentThisPeriodSEK, lang)}>
                <div className="w-full rounded-t bg-navy-600" style={{ height: `${Math.min(100, (h.spentThisPeriodSEK / maxSpend) * 100)}%` }} />
                <span className="text-[10px] text-navy-400">{lang === "sv" ? h.periodLabel_sv : h.periodLabel_en}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

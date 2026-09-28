"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  nextActionableReport,
  latestOutcomeFor,
  outcomeHistoryFor,
  isReportingComplete,
  reportingHealth,
  ReportingHealth,
} from "@/lib/data/awardedProjects";
import { findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { useReportingSubmissions, ReportingSubmission } from "@/lib/hooks/useReportingSubmissions";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useAwardedProjects } from "@/lib/hooks/useAwardedProjects";
import { useAttachments, downloadAttachment, MAX_ATTACHMENT_BYTES } from "@/lib/hooks/useAttachments";
import { buildReportDocx } from "@/lib/export/exportReport";
import { downloadBlob } from "@/lib/export/exportApplication";
import { fmtSEK, fmtFileSize } from "@/lib/format";
import { AwardedProject, Commitment, ReportingEvent, ReportingEventStatus, ReportingPeriodicity } from "@/lib/types";

export default function AwardedProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const ap = t.awardedProjects;
  const pb = t.projectBank;
  const { withSubmissions, submitReport, submissionHistory, addSustainabilityEvent } = useReportingSubmissions();
  const { all: projectBank, updateEntry, hydrated: projectBankHydrated } = useProjectBank();
  const { all: awardedProjects, hydrated: awardedProjectsHydrated } = useAwardedProjects();

  // A project added via "Markera som beviljad" only exists in this
  // browser's localStorage, unavailable during the server render — same
  // "wait for hydrated before deciding not-found" pattern as the
  // Projektbank detail page uses for CSV-imported entries.
  const seedProject = awardedProjects.find((a) => a.id === params.id);

  const project = seedProject ? withSubmissions(seedProject) : undefined;
  const linkedEntry = project?.projectBankEntryId ? projectBank.find((p) => p.id === project.projectBankEntryId) : undefined;
  const reportingComplete = project ? isReportingComplete(project) : false;

  // Keeps the originating Projektbank entry's status in sync with reality
  // instead of requiring a manual "update status" click: an entry linked to
  // an awarded project is, by definition, no longer just an "idea" — and
  // once reporting is fully done, it's "completed" rather than left
  // "running" forever.
  useEffect(() => {
    if (!projectBankHydrated || !linkedEntry) return;
    if (reportingComplete && linkedEntry.status !== "completed") {
      updateEntry(linkedEntry.id, { status: "completed" });
    } else if (!reportingComplete && linkedEntry.status !== "running") {
      updateEntry(linkedEntry.id, { status: "running" });
    }
  }, [projectBankHydrated, linkedEntry, reportingComplete, updateEntry]);

  if (!project) {
    if (!awardedProjectsHydrated) return null;
    return (
      <>
        <Header />
        <main className="section max-w-3xl">
          <Link href="/projekt" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
            ← {ap.back}
          </Link>
          <p className="mt-8 text-sm text-navy-500">{pb.detailNotFound}</p>
        </main>
        <Footer />
      </>
    );
  }

  const call = findCall(project.callId);
  const program = call ? findProgram(call.programId) : undefined;
  const reportingReq = call?.reportingRequirements;
  const nextActionable = nextActionableReport(project);
  const health = reportingHealth(project);
  const hasSustainabilityEvent = project.reportingEvents.some((e) => e.type === "sustainability");

  const periodicityLabel = (p: ReportingPeriodicity) =>
    p === "quarterly" ? ap.periodicityQuarterly : p === "biannual" ? ap.periodicityBiannual : ap.periodicityAnnual;

  const statusStyle = (status: ReportingEventStatus) => {
    if (status === "approved") return "bg-green-100 text-green-800";
    if (status === "submitted") return "bg-navy-100 text-navy-700";
    if (status === "revision-requested") return "bg-amber-100 text-amber-800";
    return "bg-navy-50 text-navy-500";
  };
  const statusLabel = (status: ReportingEventStatus) => {
    if (status === "approved") return ap.reportStatusApproved;
    if (status === "submitted") return ap.reportStatusSubmitted;
    if (status === "revision-requested") return ap.reportStatusRevisionRequested;
    return ap.reportStatusUpcoming;
  };
  const healthStyle = (h: ReportingHealth) => {
    if (h === "blocked") return "bg-amber-100 text-amber-800";
    if (h === "attention") return "bg-gold-100 text-gold-800";
    return "bg-green-100 text-green-800";
  };
  const healthLabel = (h: ReportingHealth) => {
    if (h === "blocked") return ap.healthBlockedLabel;
    if (h === "attention") return ap.healthAttentionLabel;
    return ap.healthGoodLabel;
  };

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <Link href="/projekt" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          ← {ap.back}
        </Link>

        <div className="mt-4 flex items-center gap-4">
          {program && (
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-base font-bold text-white">
              {program.logoLetter}
            </span>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold text-navy-900">{lang === "sv" ? project.title_sv : project.title_en}</h1>
              <span className={`badge ${healthStyle(health)}`}>{healthLabel(health)}</span>
            </div>
            {call && <p className="text-sm text-navy-600">{lang === "sv" ? call.title_sv : call.title_en}</p>}
          </div>
        </div>

        {projectBankHydrated && linkedEntry && (
          <div className="mt-4 rounded-md bg-navy-50 px-4 py-3">
            <p className="text-xs text-navy-600">
              {ap.linkedProjectBankLabel}:{" "}
              <Link href={`/projektbank/${linkedEntry.id}`} className="font-semibold text-navy-800 hover:underline">
                {lang === "sv" ? linkedEntry.title_sv : linkedEntry.title_en}
              </Link>
            </p>
            <p className="mt-1 text-xs text-navy-400">{ap.linkedProjectStatusAutoSyncNote}</p>
          </div>
        )}

        <dl className="mt-6 grid gap-4 rounded-xl border border-navy-100 bg-white p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{ap.awardedAmount}</dt>
            <dd className="mt-1 text-xl font-bold text-navy-900">{fmtSEK(project.awardedAmountSEK, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{ap.nextReportDueLabel}</dt>
            <dd className="mt-1 text-xl font-bold text-navy-900">
              {nextActionable
                ? nextActionable.status === "revision-requested"
                  ? ap.reportStatusRevisionRequested
                  : ap.nextReportDue(nextActionable.deadlineMonthsFromNow)
                : ap.reportingCompleteLabel}
            </dd>
          </div>
        </dl>

        {reportingReq && (
          <section className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
            <h2 className="text-sm font-semibold uppercase text-navy-400">{ap.reportingRequirementsTitle}</h2>
            <dl className="mt-3">
              <dt className="text-xs text-navy-400">{ap.periodicityLabel}</dt>
              <dd className="font-semibold text-navy-800">{periodicityLabel(reportingReq.periodicity)}</dd>
            </dl>
            <p className="mt-3 text-sm text-navy-600">{ap.interimReportsRequiredLabel(reportingReq.interimReportsRequired)}</p>
            {reportingReq.requiresAuditAboveSEK !== null && project.awardedAmountSEK > reportingReq.requiresAuditAboveSEK && (
              <p className="mt-3 text-sm text-navy-600">
                {ap.auditRequiredAboveLabel} {fmtSEK(reportingReq.requiresAuditAboveSEK, lang)}
              </p>
            )}
            <div className="mt-4 grid gap-5 sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase text-navy-400">{ap.interimDocumentsLabel}</p>
                <ul className="mt-1.5 space-y-1">
                  {(lang === "sv" ? reportingReq.interimDocuments_sv : reportingReq.interimDocuments_en).map((d) => (
                    <li key={d} className="text-sm text-navy-600">
                      · {d}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-navy-400">{ap.finalReportDocumentsLabel}</p>
                <ul className="mt-1.5 space-y-1">
                  {(lang === "sv" ? reportingReq.finalReportDocuments_sv : reportingReq.finalReportDocuments_en).map((d) => (
                    <li key={d} className="text-sm text-navy-600">
                      · {d}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </section>
        )}

        {project.commitments.length > 0 && (
          <section className="mt-6">
            <h2 className="text-lg font-bold text-navy-800">{ap.commitmentsTitle}</h2>
            <div className="mt-4 space-y-3">
              {project.commitments.map((c) => (
                <CommitmentCard key={c.indicator_sv} commitment={c} project={project} />
              ))}
            </div>
          </section>
        )}

        <section className="mb-16 mt-6">
          <h2 className="text-lg font-bold text-navy-800">{ap.reportingTimelineTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{ap.reportingTimelineHint}</p>
          <div className="mt-4 space-y-3">
            {project.reportingEvents.map((event) => (
              <ReportingEventCard
                key={event.id}
                event={event}
                seedEvent={seedProject?.reportingEvents.find((e) => e.id === event.id)}
                project={project}
                call={call}
                program={program}
                isNext={nextActionable?.id === event.id}
                history={submissionHistory(project.id, event.id)}
                statusStyle={statusStyle}
                statusLabel={statusLabel}
                onSubmit={(outcomes, note) => submitReport(project.id, event.id, outcomes, note)}
              />
            ))}
          </div>
          {isReportingComplete(project) && !hasSustainabilityEvent && (
            <div className="mt-4 rounded-xl border border-dashed border-navy-200 p-4">
              <p className="text-sm text-navy-600">{ap.addSustainabilityHint}</p>
              <button
                type="button"
                onClick={() => addSustainabilityEvent(project.id, 36)}
                className="mt-2 rounded-md border border-navy-200 bg-white px-3 py-2 text-xs font-semibold text-navy-700 hover:bg-navy-50"
              >
                {ap.addSustainabilityButton}
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

function CommitmentCard({ commitment: c, project }: { commitment: Commitment; project: AwardedProject }) {
  const { t, lang } = useLanguage();
  const ap = t.awardedProjects;
  const latest = latestOutcomeFor(project, c.indicator_sv);
  const deviates = latest !== undefined && latest < c.promisedValue * 0.9;
  const unit = lang === "sv" ? c.unit_sv : c.unit_en;
  const fmt = (v: number) => v.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");
  const history = outcomeHistoryFor(project, c.indicator_sv);
  const maxValue = Math.max(c.promisedValue, ...history.map((h) => h.value), 1);
  const targetPct = Math.min(100, (c.promisedValue / maxValue) * 100);

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="font-semibold text-navy-800">{lang === "sv" ? c.indicator_sv : c.indicator_en}</h3>
        <span
          className={`badge ${
            latest === undefined ? "bg-navy-50 text-navy-400" : deviates ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"
          }`}
        >
          {latest !== undefined ? `${fmt(latest)} / ${fmt(c.promisedValue)} ${unit}` : ap.noLatestOutcome}
        </span>
      </div>
      <div className="mt-3 h-2 rounded-full bg-navy-100">
        <div
          className={`h-2 rounded-full ${latest === undefined ? "bg-navy-200" : deviates ? "bg-amber-500" : "bg-green-500"}`}
          style={{ width: `${c.promisedValue > 0 ? Math.min(100, ((latest ?? 0) / c.promisedValue) * 100) : 0}%` }}
        />
      </div>
      <p className="mt-3 text-sm text-navy-600">
        <span className="font-semibold">{ap.promised}: </span>
        {fmt(c.promisedValue)} {unit}
        {" · "}
        <span className="font-semibold">{ap.reported}: </span>
        {latest !== undefined ? `${fmt(latest)} ${unit}` : ap.noLatestOutcome}
      </p>

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
                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" title={`${fmt(h.value)} ${unit}`}>
                  <div
                    className="w-full rounded-t bg-navy-600"
                    style={{ height: `${Math.min(100, (h.value / maxValue) * 100)}%` }}
                  />
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

function ReportingEventCard({
  event,
  seedEvent,
  project,
  call,
  program,
  isNext,
  history,
  statusStyle,
  statusLabel,
  onSubmit,
}: {
  event: ReportingEvent;
  /** The same event as originally seeded, before any local correction is
   * overlaid — the "before" state a resubmission needs to show as history,
   * since it lives in static seed data rather than as a dated submission
   * the app itself ever recorded. Undefined for an event with no seed
   * counterpart (e.g. a locally-added sustainability follow-up). */
  seedEvent: ReportingEvent | undefined;
  project: AwardedProject;
  call: ReturnType<typeof findCall>;
  program: ReturnType<typeof findProgram>;
  isNext: boolean;
  history: ReportingSubmission[];
  statusStyle: (s: ReportingEventStatus) => string;
  statusLabel: (s: ReportingEventStatus) => string;
  onSubmit: (outcomes: Record<string, number>, note: string) => void;
}) {
  const { t, lang } = useLanguage();
  const ap = t.awardedProjects;
  const { attachmentsFor, addAttachment, removeAttachment } = useAttachments();
  const attachmentKey = `report:${project.id}:${event.id}`;
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      project.commitments.map((c) => {
        const existing = event.outcomes.find((o) => o.indicator_sv === c.indicator_sv);
        return [c.indicator_sv, existing ? String(existing.value) : ""];
      })
    )
  );
  const [note, setNote] = useState(event.note_sv ?? event.note_en ?? "");
  const [justSubmitted, setJustSubmitted] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const showForm = isNext && (event.status === "upcoming" || event.status === "revision-requested");
  const fmt = (v: number) => v.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");

  // The seed data's own original outcome is never itself recorded as a
  // dated submission — it's baked into the event, not written through
  // submitReport. So the very first correction of a seeded event has no
  // "before" entry in `history` to show as previous submissions unless we
  // synthesize one here, with no real timestamp to mark it as such.
  const fullHistory: ReportingSubmission[] =
    history.length > 0 && seedEvent && seedEvent.outcomes.length > 0
      ? [
          {
            outcomes: Object.fromEntries(seedEvent.outcomes.map((o) => [o.indicator_sv, o.value])),
            note: seedEvent.note_sv ?? seedEvent.note_en ?? "",
            submittedAt: "",
          },
          ...history,
        ]
      : history;

  const reportTypeLabel =
    event.type === "final" ? ap.reportTypeFinal : event.type === "sustainability" ? ap.reportTypeSustainability : ap.reportTypeInterim;

  const handleExport = async () => {
    const blob = await buildReportDocx(project, event, call, program, lang);
    downloadBlob(blob, `rapport-${project.id}-${event.id}.docx`);
  };

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-navy-400">{reportTypeLabel}</p>
          <h3 className="font-semibold text-navy-800">{lang === "sv" ? event.periodLabel_sv : event.periodLabel_en}</h3>
        </div>
        <div className="text-right">
          <span className={`badge ${statusStyle(event.status)}`}>{statusLabel(event.status)}</span>
          {event.status === "upcoming" && (
            <p className="mt-1 text-xs text-navy-500">
              {event.deadlineMonthsFromNow >= 0
                ? ap.reportDueInMonths(event.deadlineMonthsFromNow)
                : ap.reportOverdueBy(Math.abs(event.deadlineMonthsFromNow))}
            </p>
          )}
        </div>
      </div>

      {call?.reportingRequirements &&
        event.type !== "sustainability" &&
        (event.status === "upcoming" || event.status === "revision-requested") && (
          <div className="mt-3 rounded-md bg-navy-50 px-3 py-3">
            <p className="text-xs font-semibold uppercase text-navy-400">
              {event.type === "final" ? ap.finalReportDocumentsLabel : ap.interimDocumentsLabel}
            </p>
            <ul className="mt-1.5 space-y-1">
              {(event.type === "final"
                ? lang === "sv"
                  ? call.reportingRequirements.finalReportDocuments_sv
                  : call.reportingRequirements.finalReportDocuments_en
                : lang === "sv"
                ? call.reportingRequirements.interimDocuments_sv
                : call.reportingRequirements.interimDocuments_en
              ).map((d) => (
                <li key={d} className="text-sm text-navy-700">
                  · {d}
                </li>
              ))}
            </ul>
            {event.type === "final" &&
              call.reportingRequirements.requiresAuditAboveSEK !== null &&
              project.awardedAmountSEK > call.reportingRequirements.requiresAuditAboveSEK && (
                <p className="mt-2 text-xs font-semibold text-amber-700">
                  ⚠ {ap.auditRequiredAboveLabel} {fmtSEK(call.reportingRequirements.requiresAuditAboveSEK, lang)}
                </p>
              )}
            {call.documents.some((d) => d.type === "reporting") && (
              <Link
                href={`/eu-databas/${call.programId}/${call.id}`}
                className="mt-2 inline-block text-xs font-semibold text-navy-600 hover:text-navy-900"
              >
                {ap.viewReportingInstructionsLink}
              </Link>
            )}
          </div>
        )}

      {event.outcomes.length > 0 && (
        <ul className="mt-3 space-y-1 border-t border-navy-50 pt-3">
          {event.outcomes.map((o) => {
            const commitment = project.commitments.find((c) => c.indicator_sv === o.indicator_sv);
            if (!commitment) return null;
            return (
              <li key={o.indicator_sv} className="flex items-center justify-between text-sm">
                <span className="text-navy-600">{lang === "sv" ? commitment.indicator_sv : commitment.indicator_en}</span>
                <span className="font-semibold text-navy-800">
                  {fmt(o.value)} {lang === "sv" ? commitment.unit_sv : commitment.unit_en}
                </span>
              </li>
            );
          })}
        </ul>
      )}
      {event.outcomes.length === 0 && !showForm && (
        <p className="mt-3 text-sm text-navy-500">{ap.noOutcomesYet}</p>
      )}

      {(event.note_sv || event.note_en) && (
        <p className="mt-3 text-sm text-navy-500">
          <span className="font-semibold">{ap.reportNoteLabel}: </span>
          {lang === "sv" ? event.note_sv : event.note_en}
        </p>
      )}

      {event.outcomes.length > 0 && (
        <button
          type="button"
          onClick={handleExport}
          className="mt-3 text-xs font-semibold text-navy-500 hover:text-navy-800"
        >
          {ap.exportReportButton}
        </button>
      )}

      <div className="mt-3 border-t border-navy-50 pt-3">
        <p className="text-xs font-semibold uppercase text-navy-400">{ap.reportAttachmentsLabel}</p>
        {attachmentsFor(attachmentKey).length > 0 && (
          <ul className="mt-1.5 space-y-1">
            {attachmentsFor(attachmentKey).map((a) => (
              <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
                <button type="button" onClick={() => downloadAttachment(a)} className="text-navy-700 hover:underline">
                  {a.fileName}
                </button>
                <button
                  type="button"
                  onClick={() => removeAttachment(attachmentKey, a.id)}
                  className="shrink-0 text-navy-400 hover:text-amber-700"
                >
                  {ap.reportAttachmentRemoveLabel}
                </button>
              </li>
            ))}
          </ul>
        )}
        <label className="mt-1.5 inline-block cursor-pointer text-xs font-semibold text-navy-500 hover:text-navy-800">
          {ap.reportAttachmentUploadButton}
          <input
            type="file"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              e.target.value = "";
              if (!file) return;
              setAttachmentError(null);
              const error = await addAttachment(attachmentKey, file);
              if (error === "too-large") setAttachmentError(ap.reportAttachmentTooLarge(MAX_ATTACHMENT_BYTES / (1024 * 1024)));
            }}
          />
        </label>
        {attachmentError && <p className="mt-1 text-xs text-amber-700">⚠ {attachmentError}</p>}
      </div>

      {fullHistory.length > 1 && (
        <div className="mt-3 border-t border-navy-50 pt-3">
          <button
            type="button"
            onClick={() => setShowHistory((v) => !v)}
            className="text-xs font-semibold text-navy-500 hover:text-navy-800"
          >
            {ap.reportHistoryToggle(fullHistory.length - 1)}
          </button>
          {showHistory && (
            <ul className="mt-2 space-y-2">
              {fullHistory.slice(0, -1).map((s, i) => (
                <li key={i} className="rounded-md bg-navy-50 p-2 text-xs text-navy-600">
                  <p className="font-semibold text-navy-700">
                    {s.submittedAt
                      ? ap.reportHistoryEntryLabel(new Date(s.submittedAt).toLocaleString(lang === "sv" ? "sv-SE" : "en-US"))
                      : ap.reportHistoryOriginalLabel}
                  </p>
                  {Object.entries(s.outcomes).map(([indicator, value]) => (
                    <p key={indicator}>
                      {indicator}: {value}
                    </p>
                  ))}
                  {s.note && <p className="mt-1 italic">{s.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {showForm && (
        <div className="mt-4 space-y-3 border-t border-navy-50 pt-4">
          <p className="text-sm font-semibold text-navy-800">{ap.reportFormTitle}</p>
          {project.commitments.map((c) => (
            <div key={c.indicator_sv} className="flex items-center gap-3">
              <label className="flex-1 text-sm text-navy-700">{lang === "sv" ? c.indicator_sv : c.indicator_en}</label>
              <input
                type="number"
                value={values[c.indicator_sv]}
                onChange={(e) => setValues({ ...values, [c.indicator_sv]: e.target.value })}
                placeholder="0"
                className="w-28 rounded-md border border-navy-200 px-2 py-1.5 text-right text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <span className="w-16 shrink-0 text-xs text-navy-400">{lang === "sv" ? c.unit_sv : c.unit_en}</span>
            </div>
          ))}
          <div>
            <label className="block text-sm font-semibold text-navy-700">{ap.reportFormNoteLabel}</label>
            <textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={ap.reportFormNotePlaceholder}
              className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>
          <button
            type="button"
            onClick={() => {
              const outcomes = Object.fromEntries(Object.entries(values).map(([k, v]) => [k, Number(v) || 0]));
              onSubmit(outcomes, note);
              setJustSubmitted(true);
            }}
            className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
          >
            {event.status === "revision-requested" ? ap.reportFormCorrectButton : ap.reportFormSubmitButton}
          </button>
        </div>
      )}
      {justSubmitted && <p className="mt-3 text-xs text-navy-400">{ap.reportSubmittedIndicator}</p>}
    </div>
  );
}

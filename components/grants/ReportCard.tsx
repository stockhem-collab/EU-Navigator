"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { expectedShareAt, isDeviation } from "@/lib/data/grants";
import { reportSectionsFor } from "@/lib/data/reportSections";
import { formatReportDue } from "@/lib/matching/reportingSchedule";
import { findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { ReportDraft, ReportingSubmission, StatusChange } from "@/lib/hooks/useReportingSubmissions";
import { useAttachments, downloadAttachment, MAX_ATTACHMENT_BYTES } from "@/lib/hooks/useAttachments";
import { buildReportDocx, ReportContent } from "@/lib/export/exportReport";
import { downloadBlob } from "@/lib/export/exportApplication";
import { fmtSEK } from "@/lib/format";
import { DemoUser, Grant, ReportingEvent, ReportingEventStatus } from "@/lib/types";
import ConfirmButton from "@/components/ConfirmButton";

export interface ReportCardApi {
  draft: ReportDraft;
  updateDraft: (patch: Partial<Omit<ReportDraft, "updatedAt">>) => void;
  history: ReportingSubmission[];
  statusChanges: StatusChange[];
  onSubmit: (
    outcomes: Record<string, number>,
    note: string,
    spentThisPeriodSEK: number | undefined,
    content: { sections: Record<string, string>; deviations: Record<string, string> }
  ) => void;
  onSetStatus: (status: ReportingEventStatus) => void;
  contentFor: () => ReportContent;
  /** The same report as originally seeded, before any local submission. */
  seedEvent?: ReportingEvent;
}

/** Attachment storage key of one report, and of one required document. */
export const reportAttachmentKey = (grantId: string, eventId: string) => `report:${grantId}:${eventId}`;
export const documentAttachmentKey = (grantId: string, eventId: string, index: number) =>
  `${reportAttachmentKey(grantId, eventId)}:doc:${index}`;

/** The documents the call requires for this kind of report. */
export function requiredDocuments(grant: Grant, event: ReportingEvent, lang: "sv" | "en"): string[] {
  const req = findCall(grant.callId)?.reportingRequirements;
  if (!req || event.type === "sustainability") return [];
  if (event.type === "final") return lang === "sv" ? req.finalReportDocuments_sv : req.finalReportDocuments_en;
  return lang === "sv" ? req.interimDocuments_sv : req.interimDocuments_en;
}

export function statusStyle(status: ReportingEventStatus): string {
  if (status === "approved") return "bg-green-100 text-green-800";
  if (status === "submitted") return "bg-navy-100 text-navy-700";
  if (status === "revision-requested") return "bg-amber-100 text-amber-800";
  return "bg-navy-50 text-navy-500";
}

// One report. `working` is the report to do now (the next one, or one sent
// back for correction): it opens as a form — responsible person, required
// documents, figures with explanations for deviations, the text sections
// and the spend — saved as it's typed. Any other report shows what was
// reported, the funder's response and its history.
export default function ReportCard({
  grant,
  event,
  working,
  users,
  api,
}: {
  grant: Grant;
  event: ReportingEvent;
  working: boolean;
  users: DemoUser[];
  api: ReportCardApi;
}) {
  const { t, lang } = useLanguage();
  const ap = t.grants;
  const { attachmentsFor, addAttachment, removeAttachment } = useAttachments();
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmMissing, setConfirmMissing] = useState(false);
  const [justSubmitted, setJustSubmitted] = useState(false);
  const call = findCall(grant.callId);
  const program = call ? findProgram(call.programId) : undefined;
  const fmt = (v: number) => v.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");
  const { draft, updateDraft } = api;
  const share = expectedShareAt(grant, event.id);
  const sections = reportSectionsFor(event.type);
  const documents = requiredDocuments(grant, event, lang);
  const otherKey = reportAttachmentKey(grant.id, event.id);

  const typeLabel =
    event.type === "final" ? ap.reportTypeFinal : event.type === "sustainability" ? ap.reportTypeSustainability : ap.reportTypeInterim;
  const statusLabel = (s: ReportingEventStatus) =>
    s === "approved"
      ? ap.reportStatusApproved
      : s === "submitted"
      ? ap.reportStatusSubmitted
      : s === "revision-requested"
      ? ap.reportStatusRevisionRequested
      : ap.reportStatusUpcoming;
  const label = lang === "sv" ? event.periodLabel_sv : event.periodLabel_en;
  const docReady = (name: string, index: number) =>
    Boolean(draft.checklist[name]) || attachmentsFor(documentAttachmentKey(grant.id, event.id, index)).length > 0;

  // Figures: as typed in the draft, else what the report already holds.
  const outcomeValue = (indicator: string) =>
    draft.outcomes[indicator] ?? (event.outcomes.find((o) => o.indicator_sv === indicator)?.value.toString() ?? "");
  const spentValue = draft.spentThisPeriod || (event.financials ? String(event.financials.spentThisPeriodSEK) : "");
  const sectionValue = (key: string) =>
    draft.sections[key] ?? (key === "summary" ? (lang === "sv" ? event.note_sv : event.note_en) ?? "" : "");

  const deviating = grant.commitments.filter((c) => {
    const raw = outcomeValue(c.indicator_sv);
    return raw !== "" && isDeviation(Number(raw), c.promisedValue, share);
  });

  const handleExport = async () => {
    const blob = await buildReportDocx(grant, event, call, program, api.contentFor(), lang);
    downloadBlob(blob, `rapport-${grant.id}-${event.id}.docx`);
  };

  const submit = (skipDocumentCheck: boolean) => {
    const missingExplanations = deviating.filter((c) => !draft.deviations[c.indicator_sv]?.trim());
    if (missingExplanations.length > 0) {
      setErrors([ap.deviationRequiredError]);
      return;
    }
    setErrors([]);
    const missingDocs = documents.filter((name, i) => !docReady(name, i));
    if (!skipDocumentCheck && missingDocs.length > 0) {
      setConfirmMissing(true);
      return;
    }
    setConfirmMissing(false);
    const outcomes = Object.fromEntries(grant.commitments.map((c) => [c.indicator_sv, Number(outcomeValue(c.indicator_sv)) || 0]));
    const resolvedSections = Object.fromEntries(sections.map((s) => [s.key, sectionValue(s.key)]));
    api.onSubmit(outcomes, resolvedSections.summary ?? "", spentValue.trim() ? Number(spentValue) : undefined, {
      sections: resolvedSections,
      deviations: draft.deviations,
    });
    setJustSubmitted(true);
  };

  // The seed data's own original outcome is never a dated submission, so
  // the first correction of a seeded report shows it as the "before".
  const seedEvent = api.seedEvent;
  const fullHistory: ReportingSubmission[] =
    api.history.length > 0 && seedEvent && seedEvent.outcomes.length > 0
      ? [
          {
            outcomes: Object.fromEntries(seedEvent.outcomes.map((o) => [o.indicator_sv, o.value])),
            note: seedEvent.note_sv ?? seedEvent.note_en ?? "",
            spentThisPeriodSEK: seedEvent.financials?.spentThisPeriodSEK,
            submittedAt: "",
          },
          ...api.history,
        ]
      : api.history;

  // A dated trail: every submission and every response from the funder.
  const log = [
    ...api.history.filter((h) => h.submittedAt).map((h) => ({ at: h.submittedAt, text: ap.eventLogSubmitted })),
    ...api.statusChanges.map((c) => ({ at: c.at, text: ap.eventLogStatus(statusLabel(c.status)) })),
  ].sort((a, b) => (a.at < b.at ? -1 : 1));

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5" data-testid={`report-${event.id}`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-navy-400">{typeLabel}</p>
          <h3 className="font-semibold text-navy-800">{label}</h3>
          <p className="mt-0.5 text-xs text-navy-500">
            {ap.dueOn(formatReportDue(event, lang))}
            {event.status === "upcoming" &&
              ` · ${event.deadlineMonthsFromNow >= 0 ? ap.reportDueInMonths(event.deadlineMonthsFromNow) : ap.reportOverdueBy(Math.abs(event.deadlineMonthsFromNow))}`}
          </p>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span className={`badge ${statusStyle(event.status)}`} data-testid="report-status">
            {statusLabel(event.status)}
          </span>
          <button type="button" onClick={handleExport} className="text-xs font-semibold text-navy-600 hover:text-navy-900">
            {ap.exportReportButton}
          </button>
        </div>
      </div>

      {/* Who writes it — can be set ahead, for any report. */}
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
        <label htmlFor={`owner-${event.id}`} className="font-semibold text-navy-600">
          {ap.reportOwnerLabel}
        </label>
        <select
          id={`owner-${event.id}`}
          value={draft.ownerId ?? ""}
          onChange={(e) => updateDraft({ ownerId: e.target.value || undefined })}
          className="rounded-md border border-navy-200 px-2 py-1 text-xs focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          <option value="">{ap.reportOwnerNone}</option>
          {users.map((u) => (
            <option key={u.id} value={u.id}>
              {u.firstName} {u.lastName}
            </option>
          ))}
        </select>
      </div>

      {event.status === "revision-requested" && (
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">{ap.revisionNotice}</p>
      )}

      {working ? (
        <div className="mt-4 space-y-5">
          {/* The call's required documents, as a checklist tied to files. */}
          {documents.length > 0 && (
            <div className="rounded-md bg-navy-50 px-3 py-3">
              <p className="text-xs font-semibold uppercase text-navy-400">
                {event.type === "final" ? ap.finalReportDocumentsLabel : ap.interimDocumentsLabel}
              </p>
              <p className="mt-0.5 text-xs text-navy-500">{ap.checklistHint}</p>
              <ul className="mt-2 space-y-2">
                {documents.map((name, i) => {
                  const key = documentAttachmentKey(grant.id, event.id, i);
                  const files = attachmentsFor(key);
                  const ready = docReady(name, i);
                  return (
                    <li key={name} className="text-sm">
                      <div className="flex flex-wrap items-center gap-2">
                        <label className="flex items-center gap-2 text-navy-700">
                          <input
                            type="checkbox"
                            checked={ready}
                            disabled={files.length > 0}
                            onChange={(e) => updateDraft({ checklist: { ...draft.checklist, [name]: e.target.checked } })}
                          />
                          {name}
                        </label>
                        <label className="cursor-pointer text-xs font-semibold text-navy-500 hover:text-navy-800">
                          {ap.checklistAttach}
                          <input
                            type="file"
                            className="hidden"
                            aria-label={`${ap.checklistAttach}: ${name}`}
                            onChange={async (e) => {
                              const file = e.target.files?.[0];
                              e.target.value = "";
                              if (!file) return;
                              const error = await addAttachment(key, file);
                              if (error === "too-large") setAttachmentError(ap.reportAttachmentTooLarge(MAX_ATTACHMENT_BYTES / (1024 * 1024)));
                            }}
                          />
                        </label>
                      </div>
                      {files.length > 0 && (
                        <ul className="ml-6 mt-1 space-y-0.5">
                          {files.map((a) => (
                            <li key={a.id} className="flex items-center gap-2 text-xs">
                              <button type="button" onClick={() => downloadAttachment(a)} className="text-navy-700 hover:underline">
                                {a.fileName}
                              </button>
                              <button
                                type="button"
                                onClick={() => removeAttachment(key, a.id)}
                                className="text-navy-400 hover:text-amber-700"
                              >
                                {ap.reportAttachmentRemoveLabel}
                              </button>
                            </li>
                          ))}
                        </ul>
                      )}
                    </li>
                  );
                })}
              </ul>
              {event.type === "final" &&
                call?.reportingRequirements?.requiresAuditAboveSEK != null &&
                grant.awardedAmountSEK > call.reportingRequirements.requiresAuditAboveSEK && (
                  <p className="mt-2 text-xs font-semibold text-amber-700">
                    ⚠ {ap.auditRequiredAboveLabel} {fmtSEK(call.reportingRequirements.requiresAuditAboveSEK, lang)}
                  </p>
                )}
              {call?.documents.some((d) => d.type === "reporting") && (
                <Link
                  href={`/eu-databas/${call.programId}/${call.id}`}
                  className="mt-2 inline-block text-xs font-semibold text-navy-600 hover:text-navy-900"
                >
                  {ap.viewReportingInstructionsLink}
                </Link>
              )}
            </div>
          )}

          {/* Figures against the commitments, with explanations where behind. */}
          {grant.commitments.length > 0 && (
            <div>
              <p className="text-sm font-semibold text-navy-800">{ap.reportFormTitle}</p>
              <div className="mt-2 space-y-3">
                {grant.commitments.map((c) => {
                  const unit = lang === "sv" ? c.unit_sv : c.unit_en;
                  const deviates = deviating.includes(c);
                  const inputId = `outcome-${event.id}-${c.indicator_sv}`;
                  return (
                    <div key={c.indicator_sv}>
                      <div className="flex items-center gap-3">
                        <label htmlFor={inputId} className="flex-1 text-sm text-navy-700">
                          {lang === "sv" ? c.indicator_sv : c.indicator_en}
                          <span className="block text-xs text-navy-400">
                            {ap.expectedByNow(`${fmt(Math.round(c.promisedValue * share * 10) / 10)} ${unit}`)}
                          </span>
                        </label>
                        <input
                          id={inputId}
                          type="number"
                          value={outcomeValue(c.indicator_sv)}
                          onChange={(e) => updateDraft({ outcomes: { ...draft.outcomes, [c.indicator_sv]: e.target.value } })}
                          placeholder="0"
                          className="w-28 rounded-md border border-navy-200 px-2 py-1.5 text-right text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                        />
                        <span className="w-16 shrink-0 text-xs text-navy-400">{unit}</span>
                      </div>
                      {deviates && (
                        <div className="mt-2 rounded-md border border-amber-200 bg-amber-50 p-2">
                          <label htmlFor={`${inputId}-why`} className="block text-xs font-semibold text-amber-900">
                            {ap.deviationLabel}
                          </label>
                          <textarea
                            id={`${inputId}-why`}
                            rows={2}
                            value={draft.deviations[c.indicator_sv] ?? ""}
                            onChange={(e) => updateDraft({ deviations: { ...draft.deviations, [c.indicator_sv]: e.target.value } })}
                            className="mt-1 w-full rounded-md border border-amber-200 bg-white px-2 py-1.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <label htmlFor={`spent-${event.id}`} className="flex-1 text-sm text-navy-700">
              {ap.reportFormFinancialLabel}
            </label>
            <input
              id={`spent-${event.id}`}
              type="number"
              value={spentValue}
              onChange={(e) => updateDraft({ spentThisPeriod: e.target.value })}
              placeholder="0"
              className="w-32 rounded-md border border-navy-200 px-2 py-1.5 text-right text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>

          {/* The report's text, section by section. */}
          <div>
            <p className="text-sm font-semibold text-navy-800">{ap.sectionsTitle}</p>
            <p className="text-xs text-navy-400">{ap.reportDraftSaved}</p>
            <div className="mt-2 space-y-3">
              {sections.map((s) => (
                <div key={s.key}>
                  <label htmlFor={`section-${event.id}-${s.key}`} className="block text-sm font-semibold text-navy-700">
                    {lang === "sv" ? s.label_sv : s.label_en}
                  </label>
                  <p className="text-xs text-navy-400">{lang === "sv" ? s.hint_sv : s.hint_en}</p>
                  <textarea
                    id={`section-${event.id}-${s.key}`}
                    rows={3}
                    value={sectionValue(s.key)}
                    onChange={(e) => updateDraft({ sections: { ...draft.sections, [s.key]: e.target.value } })}
                    className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <OtherAttachments
            attachmentKey={otherKey}
            onError={setAttachmentError}
          />
          {attachmentError && <p className="text-xs text-amber-700">⚠ {attachmentError}</p>}

          {errors.map((e) => (
            <p key={e} role="alert" className="text-sm font-semibold text-amber-800">
              ⚠ {e}
            </p>
          ))}
          {confirmMissing ? (
            <div className="flex flex-wrap items-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2" role="alert">
              <p className="text-sm text-amber-900">
                {ap.checklistMissingConfirm(documents.filter((name, i) => !docReady(name, i)).length)}
              </p>
              <button
                type="button"
                onClick={() => submit(true)}
                className="rounded-md bg-amber-700 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-800"
              >
                {ap.submitAnyway}
              </button>
              <button
                type="button"
                onClick={() => setConfirmMissing(false)}
                className="rounded-md border border-navy-200 bg-white px-3 py-1.5 text-xs font-semibold text-navy-700 hover:bg-navy-50"
              >
                {t.confirm.cancel}
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => submit(false)}
              className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
            >
              {event.status === "revision-requested" ? ap.reportFormCorrectButton : ap.reportFormSubmitButton}
            </button>
          )}
          {justSubmitted && <p className="text-xs text-navy-400">{ap.reportSubmittedIndicator}</p>}
        </div>
      ) : (
        <div className="mt-3 space-y-3">
          {event.outcomes.length > 0 ? (
            <ul className="space-y-1 border-t border-navy-50 pt-3">
              {event.outcomes.map((o) => {
                const c = grant.commitments.find((x) => x.indicator_sv === o.indicator_sv);
                if (!c) return null;
                const why = draft.deviations[c.indicator_sv] ?? fullHistory[fullHistory.length - 1]?.deviations?.[c.indicator_sv];
                return (
                  <li key={o.indicator_sv} className="text-sm">
                    <div className="flex items-center justify-between">
                      <span className="text-navy-600">{lang === "sv" ? c.indicator_sv : c.indicator_en}</span>
                      <span className="font-semibold text-navy-800">
                        {fmt(o.value)} {lang === "sv" ? c.unit_sv : c.unit_en}
                      </span>
                    </div>
                    {why && <p className="text-xs text-navy-500">{why}</p>}
                  </li>
                );
              })}
            </ul>
          ) : (
            event.status === "upcoming" && <p className="text-sm text-navy-500">{ap.upcomingLaterNote}</p>
          )}
          {event.financials && (
            <p className="text-sm text-navy-600">{ap.reportFinancialLine(fmtSEK(event.financials.spentThisPeriodSEK, lang))}</p>
          )}
          <SubmittedText event={event} history={fullHistory} />

          {/* The funder's response, as actions — each one dated below. */}
          {(event.status === "submitted" || event.status === "approved") && (
            <div className="flex flex-wrap items-center gap-2 border-t border-navy-50 pt-3 text-xs">
              <span className="font-semibold text-navy-600">{ap.funderResponseLabel}:</span>
              {event.status === "submitted" ? (
                <>
                  <button
                    type="button"
                    onClick={() => api.onSetStatus("approved")}
                    className="rounded-md border border-green-300 bg-green-50 px-2.5 py-1 font-semibold text-green-800 hover:bg-green-100"
                  >
                    {ap.markApproved}
                  </button>
                  <button
                    type="button"
                    onClick={() => api.onSetStatus("revision-requested")}
                    className="rounded-md border border-amber-300 bg-amber-50 px-2.5 py-1 font-semibold text-amber-800 hover:bg-amber-100"
                  >
                    {ap.markRevisionRequested}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => api.onSetStatus("submitted")} className="font-semibold text-navy-500 hover:text-navy-800">
                  {ap.changeResponse}
                </button>
              )}
            </div>
          )}

          <OtherAttachments attachmentKey={otherKey} onError={setAttachmentError} />
          {attachmentError && <p className="text-xs text-amber-700">⚠ {attachmentError}</p>}
        </div>
      )}

      {log.length > 0 && (
        <div className="mt-3 border-t border-navy-50 pt-3">
          <p className="text-xs font-semibold uppercase text-navy-400">{ap.eventLogTitle}</p>
          <ul className="mt-1 space-y-0.5">
            {log.map((entry, i) => (
              <li key={i} className="text-xs text-navy-600">
                {new Date(entry.at).toLocaleString(lang === "sv" ? "sv-SE" : "en-GB")} — {entry.text}
              </li>
            ))}
          </ul>
        </div>
      )}

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
                  {s.spentThisPeriodSEK !== undefined && <p>{ap.reportFinancialLine(fmtSEK(s.spentThisPeriodSEK, lang))}</p>}
                  {s.note && <p className="mt-1 italic">{s.note}</p>}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

// What a submitted report says — its text sections, or the seed data's
// single comment for reports from before reports had sections.
function SubmittedText({ event, history }: { event: ReportingEvent; history: ReportingSubmission[] }) {
  const { t, lang } = useLanguage();
  const latest = history[history.length - 1];
  const sections = reportSectionsFor(event.type).filter((s) => latest?.sections?.[s.key]?.trim());
  if (sections.length > 0) {
    return (
      <div className="space-y-2 border-t border-navy-50 pt-3">
        {sections.map((s) => (
          <div key={s.key}>
            <p className="text-xs font-semibold uppercase text-navy-400">{lang === "sv" ? s.label_sv : s.label_en}</p>
            <p className="whitespace-pre-line text-sm text-navy-700">{latest!.sections![s.key]}</p>
          </div>
        ))}
      </div>
    );
  }
  const note = lang === "sv" ? event.note_sv : event.note_en;
  if (!note) return null;
  return (
    <p className="text-sm text-navy-500">
      <span className="font-semibold">{t.grants.reportNoteLabel}: </span>
      {note}
    </p>
  );
}

function OtherAttachments({ attachmentKey, onError }: { attachmentKey: string; onError: (e: string | null) => void }) {
  const { t } = useLanguage();
  const ap = t.grants;
  const { attachmentsFor, addAttachment, removeAttachment } = useAttachments();
  const files = attachmentsFor(attachmentKey);
  return (
    <div className="border-t border-navy-50 pt-3">
      <p className="text-xs font-semibold uppercase text-navy-400">{ap.otherAttachmentsLabel}</p>
      {files.length > 0 && (
        <ul className="mt-1.5 space-y-1">
          {files.map((a) => (
            <li key={a.id} className="flex items-center justify-between gap-2 text-xs">
              <button type="button" onClick={() => downloadAttachment(a)} className="text-navy-700 hover:underline">
                {a.fileName}
              </button>
              <ConfirmButton
                label={ap.reportAttachmentRemoveLabel}
                message={ap.confirmRemoveReportAttachment(a.fileName)}
                confirmLabel={t.confirm.yesRemove}
                cancelLabel={t.confirm.cancel}
                onConfirm={() => removeAttachment(attachmentKey, a.id)}
                danger
                className="shrink-0 text-navy-400 hover:text-amber-700"
              />
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
            onError(null);
            const error = await addAttachment(attachmentKey, file);
            if (error === "too-large") onError(ap.reportAttachmentTooLarge(MAX_ATTACHMENT_BYTES / (1024 * 1024)));
          }}
        />
      </label>
    </div>
  );
}

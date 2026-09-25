"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import {
  findAwardedProject,
  nextUpcomingReport,
  latestOutcomeFor,
  isReportingComplete,
} from "@/lib/data/awardedProjects";
import { findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import OrgProcessPanel from "@/components/OrgProcessPanel";
import { fmtSEK } from "@/lib/format";
import { AwardedProject, ReportingEvent, ReportingEventStatus, ReportingPeriodicity } from "@/lib/types";

export default function AwardedProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const ap = t.awardedProjects;
  const { withSubmissions, submitReport } = useReportingSubmissions();

  const seedProject = findAwardedProject(params.id);
  if (!seedProject) return notFound();
  const project = withSubmissions(seedProject);
  const call = findCall(project.callId);
  const program = call ? findProgram(call.programId) : undefined;
  const reportingReq = call?.reportingRequirements;
  const nextReport = nextUpcomingReport(project);

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
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{lang === "sv" ? project.title_sv : project.title_en}</h1>
            {call && <p className="text-sm text-navy-600">{lang === "sv" ? call.title_sv : call.title_en}</p>}
          </div>
        </div>

        <dl className="mt-6 grid gap-4 rounded-xl border border-navy-100 bg-white p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{ap.awardedAmount}</dt>
            <dd className="mt-1 text-xl font-bold text-navy-900">{fmtSEK(project.awardedAmountSEK, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{ap.nextReportDueLabel}</dt>
            <dd className="mt-1 text-xl font-bold text-navy-900">
              {nextReport ? ap.nextReportDue(nextReport.deadlineMonthsFromNow) : ap.reportingCompleteLabel}
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
            {reportingReq.requiresAuditAboveSEK !== null && (
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

        <section className="mt-6">
          <h2 className="text-lg font-bold text-navy-800">{ap.commitmentsTitle}</h2>
          <div className="mt-4 space-y-3">
            {project.commitments.map((c) => {
              const latest = latestOutcomeFor(project, c.indicator_sv);
              const deviates = latest !== undefined && latest < c.promisedValue * 0.9;
              const unit = lang === "sv" ? c.unit_sv : c.unit_en;
              const fmt = (v: number) => v.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");
              return (
                <div key={c.indicator_sv} className="rounded-xl border border-navy-100 bg-white p-5">
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
                </div>
              );
            })}
          </div>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-bold text-navy-800">{ap.reportingTimelineTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{ap.reportingTimelineHint}</p>
          <div className="mt-4 space-y-3">
            {project.reportingEvents.map((event) => (
              <ReportingEventCard
                key={event.id}
                event={event}
                project={project}
                isNext={nextReport?.id === event.id}
                statusStyle={statusStyle}
                statusLabel={statusLabel}
                onSubmit={(outcomes, note) => submitReport(project.id, event.id, outcomes, note)}
              />
            ))}
          </div>
        </section>

        <div className="mb-16 mt-6">
          <OrgProcessPanel phaseKey={isReportingComplete(project) ? "closure" : "delivery"} />
        </div>
      </main>
      <Footer />
    </>
  );
}

function ReportingEventCard({
  event,
  project,
  isNext,
  statusStyle,
  statusLabel,
  onSubmit,
}: {
  event: ReportingEvent;
  project: AwardedProject;
  isNext: boolean;
  statusStyle: (s: ReportingEventStatus) => string;
  statusLabel: (s: ReportingEventStatus) => string;
  onSubmit: (outcomes: Record<string, number>, note: string) => void;
}) {
  const { t, lang } = useLanguage();
  const ap = t.awardedProjects;
  const [values, setValues] = useState<Record<string, string>>(() =>
    Object.fromEntries(project.commitments.map((c) => [c.indicator_sv, ""]))
  );
  const [note, setNote] = useState("");
  const [justSubmitted, setJustSubmitted] = useState(false);

  const showForm = isNext && event.status === "upcoming";
  const fmt = (v: number) => v.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase text-navy-400">
            {event.type === "final" ? ap.reportTypeFinal : ap.reportTypeInterim}
          </p>
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
            {ap.reportFormSubmitButton}
          </button>
        </div>
      )}
      {justSubmitted && <p className="mt-3 text-xs text-navy-400">{ap.reportSubmittedIndicator}</p>}
    </div>
  );
}

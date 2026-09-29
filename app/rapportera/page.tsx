"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import LinkedReportingBadge from "@/components/LinkedReportingBadge";
import UnreadDot from "@/components/UnreadDot";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useGrants } from "@/lib/hooks/useGrants";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { reportState } from "@/lib/data/grants";
import { findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { CURRENT_USER_ID, isProjectRelevantToUser, orgUnits as seedOrgUnits } from "@/lib/data/users";
import { fmtSEK } from "@/lib/format";
import { Grant, ProjectBankEntry, ReportingEvent } from "@/lib/types";

// Rapportera: every report due on every grant, across projects — what
// needs action now, what's coming, and what's done — plus the grants
// themselves. A project with several grants shows one row per report, each
// saying which grant and project it belongs to.
export default function ReportPage() {
  const { t, lang } = useLanguage();
  const r = t.report;
  const ap = t.grants;
  const { all: grants, hydrated } = useGrants();
  const { withSubmissions, hydrated: submissionsHydrated } = useReportingSubmissions();
  const { all: projectBank } = useProjectBank();
  const { users } = useUsersDirectory();
  const { config: orgConfig } = useOrgConfig();
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID);
  const orgUnitsAll = orgConfig.units ?? seedOrgUnits;
  const [onlyMineAndShared, setOnlyMineAndShared] = useState(false);
  const [showDone, setShowDone] = useState(false);

  const visibleGrants = useMemo(
    () =>
      grants.map(withSubmissions).filter((g) => {
        if (!onlyMineAndShared) return true;
        const entry = projectBank.find((p) => p.id === g.projectBankEntryId);
        return entry ? isProjectRelevantToUser(entry, currentUser, orgUnitsAll) : false;
      }),
    [grants, withSubmissions, onlyMineAndShared, projectBank, currentUser, orgUnitsAll]
  );

  const reports = visibleGrants.flatMap((grant) => grant.reportingEvents.map((event) => ({ grant, event })));
  const byDeadline = (a: { event: ReportingEvent }, b: { event: ReportingEvent }) =>
    a.event.deadlineMonthsFromNow - b.event.deadlineMonthsFromNow;
  const attention = reports.filter((x) => reportState(x.event) === "attention").sort(byDeadline);
  const upcoming = reports.filter((x) => reportState(x.event) === "upcoming").sort(byDeadline);
  const done = reports.filter((x) => reportState(x.event) === "done").sort((a, b) => -byDeadline(a, b));

  const ready = hydrated && submissionsHydrated;

  return (
    <>
      <Header />
      <main className="section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{r.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{r.subtitle}</p>
          </div>
          <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-navy-700">
            <input type="checkbox" checked={onlyMineAndShared} onChange={(e) => setOnlyMineAndShared(e.target.checked)} />
            {ap.onlyMineAndSharedToggle}
          </label>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: r.statAttention, value: attention.length, warn: attention.length > 0 },
            { label: r.statUpcoming, value: upcoming.length, warn: false },
            { label: r.statDone, value: done.length, warn: false },
            { label: r.statGrants, value: visibleGrants.length, warn: false },
          ].map((st) => (
            <div
              key={st.label}
              className={`rounded-xl border p-4 ${st.warn ? "border-amber-200 bg-amber-50" : "border-navy-100 bg-white"}`}
            >
              <p className={`text-2xl font-extrabold ${st.warn ? "text-amber-800" : "text-navy-900"}`}>{ready ? st.value : "…"}</p>
              <p className="text-xs text-navy-500">{st.label}</p>
            </div>
          ))}
        </div>

        {ready && visibleGrants.length === 0 ? (
          <p className="mt-8 rounded-xl border border-dashed border-navy-200 p-6 text-center text-sm text-navy-500">{r.noGrants}</p>
        ) : (
          <>
            <section className="mt-8" aria-labelledby="attention-heading">
              <h2 id="attention-heading" className="text-lg font-bold text-navy-800">
                {r.attentionTitle}
              </h2>
              <p className="mt-1 text-sm text-navy-500">{r.attentionHint}</p>
              {attention.length === 0 ? (
                <p className="mt-3 text-sm text-navy-500">{r.noAttention}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {attention.map((x) => (
                    <ReportRow key={x.event.id} grant={x.grant} event={x.event} projectBank={projectBank} />
                  ))}
                </ul>
              )}
            </section>

            <section className="mt-8" aria-labelledby="upcoming-heading">
              <h2 id="upcoming-heading" className="text-lg font-bold text-navy-800">
                {r.upcomingTitle}
              </h2>
              {upcoming.length === 0 ? (
                <p className="mt-3 text-sm text-navy-500">{r.noUpcoming}</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {upcoming.map((x) => (
                    <ReportRow key={x.event.id} grant={x.grant} event={x.event} projectBank={projectBank} />
                  ))}
                </ul>
              )}
            </section>

            {done.length > 0 && (
              <section className="mt-8">
                <button
                  type="button"
                  onClick={() => setShowDone((v) => !v)}
                  aria-expanded={showDone}
                  className="text-sm font-semibold text-navy-600 hover:text-navy-900"
                >
                  {showDone ? r.hideDone : r.showDone(done.length)}
                </button>
                {showDone && (
                  <ul className="mt-3 space-y-2">
                    {done.map((x) => (
                      <ReportRow key={x.event.id} grant={x.grant} event={x.event} projectBank={projectBank} />
                    ))}
                  </ul>
                )}
              </section>
            )}

            <section className="mb-16 mt-12 border-t border-navy-100 pt-8" aria-labelledby="grants-heading">
              <h2 id="grants-heading" className="text-lg font-bold text-navy-800">
                {r.grantsTitle}
              </h2>
              <p className="mt-1 text-sm text-navy-500">{r.grantsHint}</p>
              <ul className="mt-3 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
                {visibleGrants.map((grant) => {
                  const call = findCall(grant.callId);
                  // Named after its project, like the report rows above; the
                  // EU project's own name (often an acronym) is shown under
                  // it when it differs.
                  const entry = grant.projectBankEntryId ? projectBank.find((p) => p.id === grant.projectBankEntryId) : undefined;
                  const grantName = lang === "sv" ? grant.title_sv : grant.title_en;
                  const projectName = entry ? (lang === "sv" ? entry.title_sv : entry.title_en) : grantName;
                  return (
                    <li key={grant.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                      <div>
                        <Link href={`/stod/${grant.id}`} className="font-semibold text-navy-800 hover:underline">
                          {projectName}
                        </Link>
                        {projectName !== grantName && <p className="text-xs text-navy-500">{r.euProjectName(grantName)}</p>}
                        <p className="text-xs text-navy-500">
                          {call ? (lang === "sv" ? call.title_sv : call.title_en) : grant.callId} ·{" "}
                          {fmtSEK(grant.awardedAmountSEK, lang)}
                        </p>
                      </div>
                      <LinkedReportingBadge project={grant} />
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

function ReportRow({ grant, event, projectBank }: { grant: Grant; event: ReportingEvent; projectBank: ProjectBankEntry[] }) {
  const { t, lang } = useLanguage();
  const r = t.report;
  const ap = t.grants;
  const entry = projectBank.find((p) => p.id === grant.projectBankEntryId);
  const call = findCall(grant.callId);
  const program = call ? findProgram(call.programId) : undefined;

  const typeLabel =
    event.type === "final" ? ap.reportTypeFinal : event.type === "sustainability" ? ap.reportTypeSustainability : ap.reportTypeInterim;
  const status =
    event.status === "revision-requested"
      ? { text: ap.reportStatusRevisionRequested, style: "bg-amber-100 text-amber-800" }
      : event.status === "approved"
      ? { text: ap.reportStatusApproved, style: "bg-green-100 text-green-800" }
      : event.status === "submitted"
      ? { text: ap.reportStatusSubmitted, style: "bg-navy-100 text-navy-700" }
      : event.deadlineMonthsFromNow < 0
      ? { text: r.overdueLabel(Math.abs(event.deadlineMonthsFromNow)), style: "bg-amber-100 text-amber-800" }
      : { text: ap.reportDueInMonths(event.deadlineMonthsFromNow), style: "bg-navy-50 text-navy-600" };

  return (
    <li className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-green-700 text-xs font-bold text-white">
          {program?.logoLetter ?? "?"}
        </span>
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase text-navy-400">
            {entry ? (
              <Link href={`/projekt/${entry.id}`} className="hover:underline">
                {lang === "sv" ? entry.title_sv : entry.title_en}
              </Link>
            ) : (
              <span>{lang === "sv" ? grant.title_sv : grant.title_en}</span>
            )}
            {program && <span>· {program.shortName}</span>}
            <UnreadDot entityKey={`report:${event.id}`} />
          </p>
          <p className="font-semibold text-navy-800">
            {lang === "sv" ? event.periodLabel_sv : event.periodLabel_en}
            <span className="ml-2 text-xs font-normal text-navy-400">{typeLabel}</span>
          </p>
          {call && <p className="text-xs text-navy-500">{lang === "sv" ? call.title_sv : call.title_en}</p>}
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className={`badge ${status.style}`}>{status.text}</span>
        <Link
          href={`/stod/${grant.id}`}
          className="rounded-md bg-navy-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy-700"
        >
          {r.open}
        </Link>
      </div>
    </li>
  );
}

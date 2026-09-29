"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms, findProgram } from "@/lib/data/fundingPrograms";
import { fundedProjects } from "@/lib/data/fundedProjects";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useGrants } from "@/lib/hooks/useGrants";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";

/** Formatted after mount only, so the demo's "last synced" stat always
 * reads as just now instead of a timestamp that was frozen at write time
 * and drifts further into the past on every visit. Computed client-side
 * to avoid a server/client hydration mismatch on the exact minute. */
function useNowStamp(): string | null {
  const [stamp, setStamp] = useState<string | null>(null);
  useEffect(() => {
    const now = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    setStamp(`${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}`);
  }, []);
  return stamp;
}

function StatTile({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-5">
      <p className="text-2xl font-extrabold text-navy-900">{value}</p>
      <p className="mt-1 text-sm text-navy-500">{label}</p>
    </div>
  );
}

export default function DatacenterPage() {
  const { t, lang } = useLanguage();
  const dc = t.datacenter;
  const ap = t.grants;
  const { all: projectBank } = useProjectBank();
  const { all: fundingCalls } = useFundingCalls();
  const { all: awardedProjects } = useGrants();
  const { withSubmissions } = useReportingSubmissions();
  const lastSync = useNowStamp();

  const docs = fundingCalls.flatMap((c) => c.documents.map((d) => ({ ...d, callId: c.id })));
  const docsNeedingUpdate = docs.filter((d) => d.needsUpdate);
  const openCalls = fundingCalls.filter((c) => c.status === "open");
  const upcomingCalls = fundingCalls.filter((c) => c.status === "upcoming");
  const activeProjects = projectBank.filter(
    (p) => p.status !== "idea" && p.status !== "completed"
  );
  const incompleteProjects = projectBank.filter(
    (p) => (lang === "sv" ? p.missingFields_sv : p.missingFields_en).length > 0
  );

  const reportingRows = awardedProjects.flatMap((p) => {
    const project = withSubmissions(p);
    return project.reportingEvents.map((event) => ({ project, event }));
  });
  const reportsNeedingAttention = reportingRows
    .filter((r) => r.event.status === "revision-requested" || r.event.status === "upcoming")
    // Revision-requested is the more urgent of the two — surface it first.
    .sort((a, b) => (a.event.status === b.event.status ? 0 : a.event.status === "revision-requested" ? -1 : 1));
  const upcomingReportsCount = reportingRows.filter((r) => r.event.status === "upcoming").length;
  const reportsNeedingRevisionCount = reportingRows.filter((r) => r.event.status === "revision-requested").length;

  const callsWithStructuredEligibility = fundingCalls.filter((c) => c.applicantTypes && c.applicantTypes.length > 0).length;

  return (
    <>
      <Header />
      <main className="section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{dc.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{dc.subtitle}</p>
          </div>
          <Link
            href="/datacenter/import-utlysning"
            className="shrink-0 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
          >
            {dc.importCallButton}
          </Link>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatTile label={dc.statProjectIdeas} value={projectBank.length} />
          <StatTile label={dc.statActiveProjects} value={activeProjects.length} />
          <StatTile label={dc.statPrograms} value={fundingPrograms.length} />
          <StatTile label={dc.statCalls} value={fundingCalls.length} />
          <StatTile label={dc.statOpenCalls} value={openCalls.length} />
          <StatTile label={dc.statUpcomingCalls} value={upcomingCalls.length} />
          <StatTile label={dc.statReferenceProjects} value={fundedProjects.length} />
          <StatTile label={dc.statDocuments} value={docs.length} />
          <StatTile label={dc.statDocumentsNeedUpdate} value={docsNeedingUpdate.length} />
          <StatTile label={dc.statLastSync} value={lastSync ?? "…"} />
          <StatTile label={dc.statUpcomingReports} value={upcomingReportsCount} />
          <StatTile label={dc.statReportsNeedingRevision} value={reportsNeedingRevisionCount} />
          <StatTile label={dc.statStructuredEligibility} value={`${callsWithStructuredEligibility} / ${fundingCalls.length}`} />
        </div>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-navy-800">{dc.documentsNeedingUpdateTitle}</h2>
          <div className="mt-4 overflow-hidden rounded-xl border border-navy-100 bg-white">
            <ul className="divide-y divide-navy-50">
              {docsNeedingUpdate.map((d) => {
                const call = fundingCalls.find((c) => c.id === d.callId);
                const program = call ? findProgram(call.programId) : undefined;
                return (
                  <li key={`${d.callId}-${d.id}`} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-navy-800">{lang === "sv" ? d.title_sv : d.title_en}</p>
                      <p className="text-xs text-navy-400">
                        {program?.shortName} · {call ? (lang === "sv" ? call.title_sv : call.title_en) : ""}
                      </p>
                    </div>
                    {call && (
                      <Link
                        href={`/eu-databas/${call.programId}/${call.id}`}
                        className="text-xs font-semibold text-navy-600 hover:text-navy-900"
                      >
                        {dc.viewCallLink}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>

        <section className="mt-10">
          <h2 className="text-lg font-bold text-navy-800">{dc.reportingAttentionTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{dc.reportingAttentionBody}</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-navy-100 bg-white">
            {reportsNeedingAttention.length === 0 ? (
              <p className="px-4 py-3 text-sm text-navy-500">{dc.noReportingAttention}</p>
            ) : (
              <ul className="divide-y divide-navy-50">
                {reportsNeedingAttention.map(({ project, event }) => (
                  <li key={event.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                    <div>
                      <p className="font-medium text-navy-800">
                        {lang === "sv" ? project.title_sv : project.title_en}
                      </p>
                      <p className="text-xs text-navy-400">
                        {lang === "sv" ? event.periodLabel_sv : event.periodLabel_en} ·{" "}
                        <span className={event.status === "revision-requested" ? "text-amber-700" : ""}>
                          {event.status === "revision-requested" ? ap.reportStatusRevisionRequested : ap.nextReportDue(event.deadlineMonthsFromNow)}
                        </span>
                      </p>
                    </div>
                    <Link href={`/stod/${project.id}`} className="text-xs font-semibold text-navy-600 hover:text-navy-900">
                      {dc.viewProjectLink}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <section className="mb-16 mt-10">
          <h2 className="text-lg font-bold text-navy-800">{dc.incompleteProjectsTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{dc.incompleteProjectsBody}</p>
          <div className="mt-4 overflow-hidden rounded-xl border border-navy-100 bg-white">
            <ul className="divide-y divide-navy-50">
              {incompleteProjects.map((p) => (
                <li key={p.id} className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm">
                  <div>
                    <p className="font-medium text-navy-800">{lang === "sv" ? p.title_sv : p.title_en}</p>
                    <p className="text-xs text-navy-400">
                      {dc.fieldsMissing((lang === "sv" ? p.missingFields_sv : p.missingFields_en).length)}
                    </p>
                  </div>
                  <Link href={`/projekt/${p.id}`} className="text-xs font-semibold text-navy-600 hover:text-navy-900">
                    {dc.openLink}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms, findProgram } from "@/lib/data/fundingPrograms";
import { fundingCalls, allDocuments } from "@/lib/data/fundingCalls";
import { fundedProjects } from "@/lib/data/fundedProjects";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { awardedProjects } from "@/lib/data/awardedProjects";
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
  const { all: projectBank } = useProjectBank();
  const { withSubmissions } = useReportingSubmissions();
  const lastSync = useNowStamp();

  const docs = allDocuments();
  const docsNeedingUpdate = docs.filter((d) => d.needsUpdate);
  const openCalls = fundingCalls.filter((c) => c.status === "open");
  const upcomingCalls = fundingCalls.filter((c) => c.status === "upcoming");
  const activeProjects = projectBank.filter(
    (p) => p.status !== "idea" && p.status !== "completed" && p.status !== "rejected"
  );
  const incompleteProjects = projectBank.filter(
    (p) => (lang === "sv" ? p.missingFields_sv : p.missingFields_en).length > 0
  );

  const reportingEvents = awardedProjects.flatMap((p) => withSubmissions(p).reportingEvents);
  const upcomingReportsCount = reportingEvents.filter((e) => e.status === "upcoming").length;
  const reportsNeedingRevisionCount = reportingEvents.filter((e) => e.status === "revision-requested").length;

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{dc.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{dc.subtitle}</p>

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
                  <Link href={`/projektbank/${p.id}`} className="text-xs font-semibold text-navy-600 hover:text-navy-900">
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

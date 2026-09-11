"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { findAwardedProject } from "@/lib/data/awardedProjects";
import { findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import OrgProcessPanel from "@/components/OrgProcessPanel";
import { fmtSEK } from "@/lib/format";

export default function AwardedProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const ap = t.awardedProjects;

  const project = findAwardedProject(params.id);
  if (!project) return notFound();
  const call = findCall(project.callId);
  const program = call ? findProgram(call.programId) : undefined;

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
            <dt className="text-xs font-semibold uppercase text-navy-400">
              {lang === "sv" ? "Nästa rapportering" : "Next report"}
            </dt>
            <dd className="mt-1 text-xl font-bold text-navy-900">
              {ap.nextReportDue(project.nextReportDueMonthsFromNow)}
            </dd>
          </div>
        </dl>

        <section className="mt-6">
          <h2 className="text-lg font-bold text-navy-800">{ap.commitmentsTitle}</h2>
          <div className="mt-4 space-y-3">
            {project.commitments.map((c) => {
              const deviates = c.currentValue < c.promisedValue * 0.9;
              return (
                <div key={c.indicator_sv} className="rounded-xl border border-navy-100 bg-white p-5">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <h3 className="font-semibold text-navy-800">
                      {lang === "sv" ? c.indicator_sv : c.indicator_en}
                    </h3>
                    <span className={`badge ${deviates ? "bg-amber-100 text-amber-800" : "bg-green-100 text-green-800"}`}>
                      {c.currentValue.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")}
                      {" / "}
                      {c.promisedValue.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")}{" "}
                      {lang === "sv" ? c.unit_sv : c.unit_en}
                    </span>
                  </div>
                  <div className="mt-3 h-2 rounded-full bg-navy-100">
                    <div
                      className={`h-2 rounded-full ${deviates ? "bg-amber-500" : "bg-green-500"}`}
                      style={{ width: `${Math.min(100, (c.currentValue / c.promisedValue) * 100)}%` }}
                    />
                  </div>
                  <p className="mt-3 text-sm text-navy-600">
                    <span className="font-semibold">{ap.promised}: </span>
                    {c.promisedValue.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")} {lang === "sv" ? c.unit_sv : c.unit_en}
                    {" · "}
                    <span className="font-semibold">{ap.reported}: </span>
                    {c.currentValue.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")} {lang === "sv" ? c.unit_sv : c.unit_en}
                  </p>
                  <p className="mt-2 text-sm text-navy-500">{lang === "sv" ? c.comment_sv : c.comment_en}</p>
                </div>
              );
            })}
          </div>
        </section>

        <div className="mb-16 mt-6">
          <OrgProcessPanel phaseKey="delivery" />
        </div>
      </main>
      <Footer />
    </>
  );
}

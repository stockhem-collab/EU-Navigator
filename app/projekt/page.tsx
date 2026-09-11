"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { awardedProjects } from "@/lib/data/awardedProjects";
import { findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { fmtSEK } from "@/lib/format";

export default function AwardedProjectsPage() {
  const { t, lang } = useLanguage();
  const ap = t.awardedProjects;

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{ap.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{ap.subtitle}</p>

        <div className="mt-8 space-y-5">
          {awardedProjects.map((project) => {
            const call = findCall(project.callId);
            const program = call ? findProgram(call.programId) : undefined;
            return (
              <Link
                key={project.id}
                href={`/projekt/${project.id}`}
                className="block rounded-xl border border-navy-100 bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {program && (
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-xs font-bold text-white">
                        {program.logoLetter}
                      </span>
                    )}
                    <h2 className="font-bold text-navy-900">
                      {lang === "sv" ? project.title_sv : project.title_en}
                    </h2>
                  </div>
                  <span className="badge bg-navy-100 text-navy-600">
                    {ap.nextReportDue(project.nextReportDueMonthsFromNow)}
                  </span>
                </div>
                <p className="mt-3 text-sm text-navy-500">
                  {ap.awardedAmount}: <span className="font-semibold text-navy-800">{fmtSEK(project.awardedAmountSEK, lang)}</span>
                </p>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}

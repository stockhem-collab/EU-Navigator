"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { findProgram } from "@/lib/data/fundingPrograms";
import { callsForProgram } from "@/lib/data/fundingCalls";
import { fmtSEK } from "@/lib/format";

export default function ProgramCallsPage() {
  const params = useParams<{ programId: string }>();
  const { t, lang } = useLanguage();
  const db = t.euDatabase;

  const program = findProgram(params.programId);
  if (!program) return notFound();
  const calls = callsForProgram(program.id);

  return (
    <>
      <Header />
      <main className="section">
        <Link href="/eu-databas" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          ← {db.backToPrograms}
        </Link>

        <div className="mt-4 flex items-center gap-4">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-base font-bold text-white">
            {program.logoLetter}
          </span>
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{lang === "sv" ? program.name_sv : program.name}</h1>
            <p className="mt-1 text-sm text-navy-600">
              {lang === "sv" ? program.description_sv : program.description_en}
            </p>
          </div>
        </div>

        <div className="mt-8 space-y-4">
          {calls.map((call) => (
            <Link
              key={call.id}
              href={`/eu-databas/${program.id}/${call.id}`}
              className="block rounded-xl border border-navy-100 bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <h2 className="font-bold text-navy-900">{lang === "sv" ? call.title_sv : call.title_en}</h2>
                <span
                  className={`badge ${
                    call.status === "open" ? "bg-green-100 text-green-800" : "bg-navy-100 text-navy-600"
                  }`}
                >
                  {call.status === "open" ? db.statusOpen : db.statusUpcoming}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-navy-500">
                <span>{db.deadlineIn(call.deadlineMonthsFromNow)}</span>
                <span>
                  {db.grantRangeLabel}: {fmtSEK(call.minGrantSEK, lang)}–{fmtSEK(call.maxGrantSEK, lang)}
                </span>
                <span>{db.documentsCount(call.documents.length)}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

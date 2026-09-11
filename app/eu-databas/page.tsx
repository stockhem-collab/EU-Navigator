"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms } from "@/lib/data/fundingPrograms";
import { callsForProgram } from "@/lib/data/fundingCalls";

export default function EuDatabasePage() {
  const { t, lang } = useLanguage();
  const db = t.euDatabase;

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{db.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{db.subtitle}</p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {fundingPrograms.map((program) => {
            const calls = callsForProgram(program.id);
            const docCount = calls.reduce((sum, c) => sum + c.documents.length, 0);
            return (
              <Link
                key={program.id}
                href={`/eu-databas/${program.id}`}
                className="rounded-xl border border-navy-100 bg-white p-6 transition hover:border-navy-300 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-sm font-bold text-white">
                    {program.logoLetter}
                  </span>
                  <div>
                    <h2 className="font-bold text-navy-900">{lang === "sv" ? program.name_sv : program.name}</h2>
                    <p className="mt-1 text-sm text-navy-600">
                      {lang === "sv" ? program.description_sv : program.description_en}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-4 text-xs font-semibold text-navy-400">
                  <span>{db.callsCount(calls.length)}</span>
                  <span>{db.documentsCount(docCount)}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}

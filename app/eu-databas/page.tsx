"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms } from "@/lib/data/fundingPrograms";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";

export default function EuDatabasePage() {
  const { t, lang } = useLanguage();
  const db = t.euDatabase;
  const { all: fundingCalls } = useFundingCalls();
  const [search, setSearch] = useState("");

  const query = search.trim().toLowerCase();
  const filteredPrograms = fundingPrograms.filter((p) =>
    query ? `${p.name_sv} ${p.name} ${p.description_sv} ${p.description_en}`.toLowerCase().includes(query) : true
  );

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{db.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{db.subtitle}</p>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={db.searchProgramsPlaceholder}
          className="mt-6 w-full max-w-sm rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />

        {filteredPrograms.length === 0 && <p className="mt-6 text-sm text-navy-500">{db.noProgramsMatch}</p>}

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {[...filteredPrograms]
            .sort((a, b) => (a.status === b.status ? 0 : a.status === "active" ? -1 : 1))
            .map((program) => {
              const calls = fundingCalls.filter((c) => c.programId === program.id);
              const docCount = calls.reduce((sum, c) => sum + c.documents.length, 0);
              return (
                <Link
                  key={program.id}
                  href={`/eu-databas/${program.id}`}
                  className={`rounded-xl border bg-white p-6 transition hover:border-navy-300 hover:shadow-sm ${
                    program.status === "legacy" ? "border-navy-100 opacity-70" : "border-navy-100"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-sm font-bold text-white">
                      {program.logoLetter}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="font-bold text-navy-900">{lang === "sv" ? program.name_sv : program.name}</h2>
                        {program.status === "legacy" && (
                          <span className="badge bg-navy-100 text-navy-500">{db.closedProgrammeBadge}</span>
                        )}
                      </div>
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

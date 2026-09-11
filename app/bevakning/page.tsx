"use client";

import { useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { fundingCalls } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { computeMatchesForCall } from "@/lib/matching/portfolio";

const MATCH_THRESHOLD = 50;

export default function BevakningPage() {
  const { t, lang } = useLanguage();
  const bv = t.bevakning;
  const { all: projectBank } = useProjectBank();

  const rows = useMemo(
    () =>
      [...fundingCalls]
        .sort((a, b) => a.deadlineMonthsFromNow - b.deadlineMonthsFromNow)
        .map((call) => {
          const program = findProgram(call.programId);
          if (!program) return null;
          const matches = computeMatchesForCall(call, program, projectBank).filter(
            (m) => m.match.score >= MATCH_THRESHOLD
          );
          return { call, program, matches };
        })
        .filter((r): r is NonNullable<typeof r> => r !== null),
    [projectBank]
  );

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{bv.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{bv.subtitle}</p>
        <p className="mt-3 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-600">{bv.disclaimer}</p>

        <div className="mt-8 space-y-4">
          {rows.map(({ call, program, matches }) => (
            <div key={call.id} className="rounded-xl border border-navy-100 bg-white p-6">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-sm font-bold text-white">
                    {program.logoLetter}
                  </span>
                  <div>
                    <p className="text-xs font-semibold uppercase text-navy-400">{program.shortName}</p>
                    <h2 className="font-bold text-navy-900">{lang === "sv" ? call.title_sv : call.title_en}</h2>
                  </div>
                </div>
                <div className="text-right">
                  <span
                    className={`badge ${
                      call.status === "open" ? "bg-green-100 text-green-800" : "bg-navy-100 text-navy-600"
                    }`}
                  >
                    {bv.columnDeadline}: {call.deadlineMonthsFromNow} {lang === "sv" ? "mån" : "mo"}
                  </span>
                  <div className="mt-2">
                    <Link
                      href={`/eu-databas/${program.id}/${call.id}`}
                      className="text-xs font-semibold text-navy-600 hover:text-navy-900"
                    >
                      {bv.viewCall} →
                    </Link>
                  </div>
                </div>
              </div>

              <div className="mt-4 border-t border-navy-50 pt-4">
                {matches.length === 0 ? (
                  <p className="text-sm text-navy-500">{bv.noMatchingProjects}</p>
                ) : (
                  <>
                    <p className="text-sm font-semibold text-navy-700">{bv.matchingProjectsLabel(matches.length)}</p>
                    <ul className="mt-2 space-y-2">
                      {matches.map(({ entry, match }) => (
                        <li key={entry.id} className="flex items-center justify-between gap-3 text-sm">
                          <Link href={`/projektbank/${entry.id}`} className="text-navy-700 hover:underline">
                            {lang === "sv" ? entry.title_sv : entry.title_en}
                          </Link>
                          <div className="flex items-center gap-3">
                            <span className="font-semibold text-navy-800">{match.score}%</span>
                            <Link
                              href={`/demo?project=${entry.id}&call=${call.id}`}
                              className="rounded-md bg-navy-800 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-navy-700"
                            >
                              {bv.startApplication}
                            </Link>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </>
  );
}

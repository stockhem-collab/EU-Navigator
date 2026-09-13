"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { fundingCalls } from "@/lib/data/fundingCalls";
import { fundedProjects } from "@/lib/data/fundedProjects";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import { computeMatchesForEntry, projectBankEntryToProjectInput } from "@/lib/matching/portfolio";
import { computeSimilarProjects } from "@/lib/matching/similarProjects";
import { fmtSEK } from "@/lib/format";

export default function ProjectBankDetailPage() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const pb = t.projectBank;
  const results = t.demo.results;

  // Imported (CSV) entries only exist in this browser's localStorage, which
  // isn't available during the server render — so we can't decide "not
  // found" until the project-bank hook has actually finished checking the
  // client. Seeded entries render immediately either way; imported ones
  // appear once `hydrated` flips true.
  const { all, hydrated } = useProjectBank();
  const entry = all.find((p) => p.id === params.id);

  if (!entry) {
    if (!hydrated) return null;
    return (
      <>
        <Header />
        <main className="section max-w-3xl">
          <Link href="/projektbank" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
            ← {pb.back}
          </Link>
          <p className="mt-8 text-sm text-navy-500">
            {lang === "sv" ? "Hittade inget projekt med det här id:t." : "No project found with that id."}
          </p>
        </main>
        <Footer />
      </>
    );
  }

  const missing = lang === "sv" ? entry.missingFields_sv : entry.missingFields_en;
  const matches = computeMatchesForEntry(entry, fundingCalls);
  const similar = computeSimilarProjects(projectBankEntryToProjectInput(entry), fundedProjects);

  const recommendationStyle = (rec: (typeof matches)[number]["recommendation"]) => {
    if (rec === "proceed") return "bg-green-100 text-green-800";
    if (rec === "consider") return "bg-gold-100 text-gold-800";
    return "bg-navy-100 text-navy-600";
  };

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <Link href="/projektbank" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          ← {pb.back}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{lang === "sv" ? entry.title_sv : entry.title_en}</h1>
            <p className="mt-1 text-sm text-navy-500">
              {lang === "sv" ? entry.department_sv : entry.department_en} · {pb.detailOwner}: {entry.owner}
            </p>
          </div>
          <StatusBadge status={entry.status} />
        </div>

        <dl className="mt-8 grid gap-6 rounded-xl border border-navy-100 bg-white p-6 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{pb.columnCost}</dt>
            <dd className="mt-1 text-lg font-bold text-navy-900">{fmtSEK(entry.estimatedCostSEK, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{pb.columnPeriod}</dt>
            <dd className="mt-1 text-lg font-bold text-navy-900">
              {entry.periodStart}–{entry.periodEnd}
            </dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">
              {lang === "sv" ? "Tema" : "Theme"}
            </dt>
            <dd className="mt-1 text-lg font-bold text-navy-900">{sectorLabel(entry.sector, lang)}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{pb.columnReadiness}</dt>
            <dd className="mt-1 text-lg font-bold text-gold-600">{entry.aiReadinessPct}%</dd>
          </div>
        </dl>

        <div className="mt-6 rounded-xl border border-navy-100 bg-white p-6">
          <h2 className="text-sm font-semibold uppercase text-navy-400">
            {lang === "sv" ? "Beskrivning" : "Description"}
          </h2>
          <p className="mt-2 text-sm text-navy-700">{lang === "sv" ? entry.description_sv : entry.description_en}</p>
        </div>

        {missing.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-6">
            <h2 className="font-bold text-amber-900">{pb.detailMissingInfoTitle}</h2>
            <p className="mt-1 text-sm text-amber-800">{pb.detailMissingInfoBody}</p>
            <ul className="mt-4 space-y-1.5">
              {missing.map((m) => (
                <li key={m} className="text-sm text-amber-800">
                  ⚠ {m}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6">
          <h2 className="text-lg font-bold text-navy-800">{pb.detailMatchesTitle}</h2>
          {matches.length === 0 ? (
            <p className="mt-2 text-sm text-navy-500">{pb.detailNoMatches}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {matches.map((match) => (
                <div
                  key={match.call.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4"
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-xs font-bold text-white">
                      {match.program.logoLetter}
                    </span>
                    <div>
                      <p className="text-xs font-semibold uppercase text-navy-400">{match.program.shortName}</p>
                      <p className="font-semibold text-navy-800">
                        {lang === "sv" ? match.call.title_sv : match.call.title_en}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`badge ${recommendationStyle(match.recommendation)}`}>{match.score}%</span>
                    <Link
                      href={`/demo?project=${entry.id}&call=${match.call.id}`}
                      className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
                    >
                      {results.startApplication}
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mb-16 mt-8">
          <h2 className="text-lg font-bold text-navy-800">{pb.similarProjectsTitle}</h2>
          <p className="mt-1 text-sm text-navy-500">{pb.similarProjectsIntro}</p>
          {similar.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{pb.similarProjectsNone}</p>
          ) : (
            <div className="mt-4 space-y-3">
              {similar.map(({ project, similarityPct, sharedKeywords }) => (
                <div key={project.id} className="rounded-xl border border-navy-100 bg-white p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-semibold uppercase text-navy-400">
                        {lang === "sv" ? project.theme_sv : project.theme_en}
                      </p>
                      <p className="font-semibold text-navy-800">{project.title}</p>
                    </div>
                    <span className="badge bg-navy-100 text-navy-700">{similarityPct}%</span>
                  </div>
                  {sharedKeywords.length > 0 && (
                    <p className="mt-2 text-xs text-navy-400">
                      {pb.similarProjectsSharedLabel}: {sharedKeywords.join(", ")}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

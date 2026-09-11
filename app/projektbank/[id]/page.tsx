"use client";

import Link from "next/link";
import { useParams, notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { findProjectBankEntry } from "@/lib/data/projectBank";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import { fmtSEK } from "@/lib/format";

export default function ProjectBankDetailPage() {
  const params = useParams<{ id: string }>();
  const { t, lang } = useLanguage();
  const pb = t.projectBank;

  const entry = findProjectBankEntry(params.id);
  if (!entry) return notFound();

  const missing = lang === "sv" ? entry.missingFields_sv : entry.missingFields_en;

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

        <Link
          href="/demo"
          className="mt-8 inline-block rounded-md bg-navy-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700"
        >
          {pb.detailFindFunding}
        </Link>
      </main>
      <Footer />
    </>
  );
}

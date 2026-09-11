"use client";

import { useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { projectBank } from "@/lib/data/projectBank";
import { fundingCalls } from "@/lib/data/fundingCalls";
import { computeBestMatchForEntry } from "@/lib/matching/portfolio";
import { fmtSEK } from "@/lib/format";

export default function ProjectBankPage() {
  const { t, lang } = useLanguage();
  const pb = t.projectBank;

  // Run every project bank entry through the matching engine once, so the
  // portfolio can be sorted by "what matches best" instead of requiring a
  // one-by-one trip through the demo intake form for each project.
  const rows = useMemo(
    () =>
      projectBank
        .map((entry) => ({ entry, match: computeBestMatchForEntry(entry, fundingCalls) }))
        .sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1)),
    []
  );

  const proceedCount = rows.filter((r) => r.match && r.match.recommendation === "proceed").length;
  const avgBest =
    rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + (r.match?.score ?? 0), 0) / rows.length) : 0;

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{pb.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{pb.subtitle}</p>

        <div className="mt-6 grid grid-cols-3 gap-4 sm:max-w-lg">
          <div className="rounded-xl border border-navy-100 bg-white p-4">
            <p className="text-2xl font-extrabold text-navy-900">{rows.length}</p>
            <p className="text-xs text-navy-500">{pb.statTotal}</p>
          </div>
          <div className="rounded-xl border border-navy-100 bg-white p-4">
            <p className="text-2xl font-extrabold text-navy-900">{avgBest}%</p>
            <p className="text-xs text-navy-500">{pb.statAvgMatch}</p>
          </div>
          <div className="rounded-xl border border-navy-100 bg-white p-4">
            <p className="text-2xl font-extrabold text-green-700">{proceedCount}</p>
            <p className="text-xs text-navy-500">{pb.statProceedReady}</p>
          </div>
        </div>

        <div className="mt-6 overflow-x-auto rounded-xl border border-navy-100 bg-white">
          <table className="w-full min-w-[820px] text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase text-navy-400">
              <tr>
                <th className="px-4 py-3">{pb.columnTitle}</th>
                <th className="px-4 py-3">{pb.columnDepartment}</th>
                <th className="px-4 py-3">{pb.columnStatus}</th>
                <th className="px-4 py-3">{pb.columnCost}</th>
                <th className="px-4 py-3">{pb.columnReadiness}</th>
                <th className="px-4 py-3">{pb.columnBestMatch}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {rows.map(({ entry: p, match }) => (
                <tr key={p.id} className="transition hover:bg-navy-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/projektbank/${p.id}`} className="font-semibold text-navy-800 hover:underline">
                      {lang === "sv" ? p.title_sv : p.title_en}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-navy-600">{lang === "sv" ? p.department_sv : p.department_en}</td>
                  <td className="px-4 py-3">
                    <StatusBadge status={p.status} />
                  </td>
                  <td className="px-4 py-3 text-navy-600">{fmtSEK(p.estimatedCostSEK, lang)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-navy-100">
                        <div className="h-1.5 rounded-full bg-gold-500" style={{ width: `${p.aiReadinessPct}%` }} />
                      </div>
                      <span className="text-xs font-semibold text-navy-600">{p.aiReadinessPct}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {match ? (
                      <Link
                        href={`/demo?project=${p.id}&call=${match.call.id}`}
                        className="inline-flex items-center gap-2 hover:underline"
                      >
                        <span
                          className={`badge ${
                            match.recommendation === "proceed"
                              ? "bg-green-100 text-green-800"
                              : match.recommendation === "consider"
                              ? "bg-gold-100 text-gold-800"
                              : "bg-navy-100 text-navy-600"
                          }`}
                        >
                          {match.score}% · {match.program.shortName}
                        </span>
                      </Link>
                    ) : (
                      <span className="text-xs text-navy-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </>
  );
}

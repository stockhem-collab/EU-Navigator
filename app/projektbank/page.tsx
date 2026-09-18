"use client";

import { useMemo } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import CsvImportPanel from "@/components/projectbank/CsvImportPanel";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { fundingCalls } from "@/lib/data/fundingCalls";
import { primaryProjectAssignment, projectRoleLabels } from "@/lib/data/users";
import { computeBestMatchForEntry, computePortfolioEconomics } from "@/lib/matching/portfolio";
import { fmtSEK } from "@/lib/format";

export default function ProjectBankPage() {
  const { t, lang } = useLanguage();
  const pb = t.projectBank;
  const { all: projectBank, imported, addImported, removeImported, clearImported } = useProjectBank();
  const { users } = useUsersDirectory();
  const importedIds = useMemo(() => new Set(imported.map((p) => p.id)), [imported]);

  // Run every project bank entry through the matching engine once, so the
  // portfolio can be sorted by "what matches best" instead of requiring a
  // one-by-one trip through the demo intake form for each project.
  const rows = useMemo(
    () =>
      projectBank
        .map((entry) => ({ entry, match: computeBestMatchForEntry(entry, fundingCalls) }))
        .sort((a, b) => (b.match?.score ?? -1) - (a.match?.score ?? -1)),
    [projectBank]
  );

  const proceedCount = rows.filter((r) => r.match && r.match.recommendation === "proceed").length;
  const avgBest =
    rows.length > 0 ? Math.round(rows.reduce((sum, r) => sum + (r.match?.score ?? 0), 0) / rows.length) : 0;

  const economics = useMemo(() => computePortfolioEconomics(projectBank, fundingCalls), [projectBank]);

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{pb.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{pb.subtitle}</p>

        <div className="mt-6">
          <CsvImportPanel onImport={addImported} existingIds={projectBank.map((p) => p.id)} />
          {imported.length > 0 && (
            <button
              type="button"
              onClick={clearImported}
              className="mt-2 text-xs font-semibold text-navy-400 hover:text-amber-700"
            >
              {pb.clearImported} ({imported.length})
            </button>
          )}
        </div>

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

        <section className="mt-6 rounded-xl bg-navy-800 p-6 text-white">
          <h2 className="font-bold">{pb.economicsTitle}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <p className="text-2xl font-bold text-white">{fmtSEK(economics.totalBudgetSEK, lang)}</p>
              <p className="text-sm text-navy-300">{pb.statPortfolioBudget}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-300">{fmtSEK(economics.totalIdentifiedFundingSEK, lang)}</p>
              <p className="text-sm text-navy-300">{pb.statFundingPotential}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{fmtSEK(economics.totalCoFinancingNeededSEK, lang)}</p>
              <p className="text-sm text-navy-300">{pb.statCoFinancingNeed}</p>
            </div>
          </div>
        </section>

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
                <th className="px-4 py-3" aria-hidden="true" />
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {rows.map(({ entry: p, match }) => (
                <tr key={p.id} className="transition hover:bg-navy-50/50">
                  <td className="px-4 py-3">
                    <Link href={`/projektbank/${p.id}`} className="font-semibold text-navy-800 hover:underline">
                      {lang === "sv" ? p.title_sv : p.title_en}
                    </Link>
                    {(() => {
                      const assignment = primaryProjectAssignment(users, p.id);
                      if (!assignment) return null;
                      return (
                        <p className="mt-0.5 text-xs text-navy-400">
                          {assignment.user.firstName} {assignment.user.lastName} · {projectRoleLabels[assignment.role][lang]}
                          {assignment.othersCount > 0 && ` ${pb.plusOthers(assignment.othersCount)}`}
                        </p>
                      );
                    })()}
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
                  <td className="px-4 py-3 text-right">
                    {importedIds.has(p.id) && (
                      <button
                        type="button"
                        onClick={() => removeImported(p.id)}
                        aria-label={pb.removeImportedRow}
                        title={pb.removeImportedRow}
                        className="text-navy-300 hover:text-amber-700"
                      >
                        ✕
                      </button>
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

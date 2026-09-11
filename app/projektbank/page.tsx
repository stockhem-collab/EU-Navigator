"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import StatusBadge from "@/components/StatusBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { projectBank } from "@/lib/data/projectBank";
import { fmtSEK } from "@/lib/format";

export default function ProjectBankPage() {
  const { t, lang } = useLanguage();
  const pb = t.projectBank;

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{pb.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{pb.subtitle}</p>

        <div className="mt-8 overflow-x-auto rounded-xl border border-navy-100 bg-white">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-navy-100 text-xs uppercase text-navy-400">
              <tr>
                <th className="px-4 py-3">{pb.columnTitle}</th>
                <th className="px-4 py-3">{pb.columnDepartment}</th>
                <th className="px-4 py-3">{pb.columnStatus}</th>
                <th className="px-4 py-3">{pb.columnCost}</th>
                <th className="px-4 py-3">{pb.columnPeriod}</th>
                <th className="px-4 py-3">{pb.columnReadiness}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-navy-50">
              {projectBank.map((p) => (
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
                  <td className="px-4 py-3 text-navy-600">
                    {p.periodStart}–{p.periodEnd}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="h-1.5 w-16 rounded-full bg-navy-100">
                        <div
                          className="h-1.5 rounded-full bg-gold-500"
                          style={{ width: `${p.aiReadinessPct}%` }}
                        />
                      </div>
                      <span className="text-xs font-semibold text-navy-600">{p.aiReadinessPct}%</span>
                    </div>
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

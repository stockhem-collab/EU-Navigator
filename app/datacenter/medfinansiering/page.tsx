"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DatacenterTabs from "@/components/DatacenterTabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtSEK } from "@/lib/format";
import { findProgram } from "@/lib/data/fundingPrograms";
import { cashflow, CashflowAssumptions, DEFAULT_ASSUMPTIONS, FinancingItem } from "@/lib/matching/cofinancing";
import { buildCofinancingDecisionDocx } from "@/lib/export/exportCofinancing";
import { downloadBlob } from "@/lib/export/exportApplication";
import { useFinancingItems } from "@/lib/hooks/useFinancingItems";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { useProjectBank } from "@/lib/hooks/useProjectBank";

const th = "px-3 py-2 text-left text-xs font-semibold uppercase text-navy-400";
const thNum = "px-3 py-2 text-right text-xs font-semibold uppercase text-navy-400";
const td = "px-3 py-2 align-top";
const tdNum = "whitespace-nowrap px-3 py-2 text-right align-top tabular-nums";

const STAGE_STYLE: Record<FinancingItem["stage"], string> = {
  awarded: "bg-green-100 text-green-800",
  pending: "bg-gold-100 text-navy-800",
  draft: "bg-navy-100 text-navy-600",
};

/** A percentage input (0–100) for a 0–1 assumption. */
function PercentInput({ label, value, onChange, testId }: { label: string; value: number; onChange: (v: number) => void; testId?: string }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-semibold text-navy-600">
      {label}
      <input
        type="number"
        min={0}
        max={100}
        step={5}
        value={Math.round(value * 100)}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (Number.isFinite(n)) onChange(Math.min(100, Math.max(0, n)) / 100);
        }}
        data-testid={testId}
        className="w-28 rounded-md border border-navy-200 px-2 py-1.5 text-sm font-normal text-navy-900"
      />
    </label>
  );
}

// Medfinansiering och likviditet: the organisation's own share of its
// grants and pending applications per year, and how much it carries in
// costs before the grant is paid — with the assumptions on the page, and
// a decision brief per project for the committee.
export default function CofinancingPage() {
  const { t, lang } = useLanguage();
  const cf = t.ext.cofinancing;
  const [includeDrafts, setIncludeDrafts] = useState(false);
  const [assumptions, setAssumptions] = useState<CashflowAssumptions>(DEFAULT_ASSUMPTIONS);
  const { items, hydrated } = useFinancingItems(includeDrafts);
  const { all: projects } = useProjectBank();
  const { all: calls } = useFundingCalls();
  const { config } = useOrgConfig();
  const result = useMemo(() => cashflow(items, assumptions), [items, assumptions]);
  const set = (patch: Partial<CashflowAssumptions>) => setAssumptions((a) => ({ ...a, ...patch }));

  const exportBrief = async (item: FinancingItem) => {
    const call = calls.find((c) => c.id === item.callId);
    const blob = await buildCofinancingDecisionDocx({
      item,
      project: item.projectId ? projects.find((p) => p.id === item.projectId) : undefined,
      call,
      program: call ? findProgram(call.programId) : undefined,
      organisationName: config.organisationName ?? "Exempelstad",
      assumptions,
      lang,
    });
    const slug = (lang === "sv" ? item.title_sv : item.title_en).replace(/[^\p{L}\p{N}]+/gu, "-").slice(0, 60);
    downloadBlob(blob, `${lang === "sv" ? "beslutsunderlag" : "decision-brief"}-${slug}.docx`);
  };

  return (
    <>
      <Header />
      <main className="page">
        <DatacenterTabs />
        <h1 className="text-2xl font-bold text-navy-900">{cf.title}</h1>
        <p className="mt-2 max-w-3xl text-sm text-navy-600">{cf.intro}</p>

        <section className="mt-6 rounded-xl border border-navy-100 bg-white p-5" aria-labelledby="cf-assumptions">
          <h2 id="cf-assumptions" className="text-sm font-semibold uppercase text-navy-400">
            {cf.assumptionsTitle}
          </h2>
          <div className="mt-3 flex flex-wrap items-end gap-5">
            <PercentInput label={cf.advanceDirectLabel} value={assumptions.advanceDirect} onChange={(v) => set({ advanceDirect: v })} testId="cf-advance-direct" />
            <PercentInput label={cf.advanceSharedLabel} value={assumptions.advanceShared} onChange={(v) => set({ advanceShared: v })} />
            <label className="flex flex-col gap-1 text-xs font-semibold text-navy-600">
              {cf.lagLabel}
              <select
                value={assumptions.paymentLagYears}
                onChange={(e) => set({ paymentLagYears: Number(e.target.value) })}
                className="w-28 rounded-md border border-navy-200 px-2 py-1.5 text-sm font-normal text-navy-900"
              >
                {[0, 1, 2].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </label>
            <PercentInput label={cf.fxLabel} value={assumptions.fxShock} onChange={(v) => set({ fxShock: v })} />
            <label className="flex items-center gap-2 pb-1.5 text-sm font-semibold text-navy-700">
              <input type="checkbox" checked={includeDrafts} onChange={(e) => setIncludeDrafts(e.target.checked)} />
              {cf.includeDrafts}
            </label>
          </div>
          <p className="mt-3 text-xs text-navy-500">{cf.assumptionsNote}</p>
        </section>

        {hydrated && items.length === 0 ? (
          <p className="mt-8 text-sm text-navy-500">{cf.none}</p>
        ) : (
          <>
            <section className="mt-6 rounded-xl bg-navy-800 p-6 text-white">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
                <div>
                  <p className="text-2xl font-bold text-gold-300" data-testid="cf-own-total">
                    {fmtSEK(result.ownTotalSEK, lang)}
                  </p>
                  <p className="text-sm text-navy-300">{cf.statOwnTotal}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{fmtSEK(result.grantTotalSEK, lang)}</p>
                  <p className="text-sm text-navy-300">{cf.statGrantTotal}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white" data-testid="cf-peak">
                    {fmtSEK(Math.max(0, result.peak?.sek ?? 0), lang)}
                  </p>
                  <p className="text-sm text-navy-300">
                    {cf.statPeak}
                    {result.peak && result.peak.sek > 0 ? ` ${cf.statPeakYear(result.peak.year)}` : ""}
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{result.eurGrantSEK > 0 ? `±${fmtSEK(result.fxEffectSEK, lang)}` : "–"}</p>
                  <p className="text-sm text-navy-300">{result.eurGrantSEK > 0 ? cf.statFx(Math.round(assumptions.fxShock * 100)) : cf.statFxNone}</p>
                </div>
              </div>
            </section>

            <section className="mt-8" aria-labelledby="cf-years">
              <h2 id="cf-years" className="text-lg font-bold text-navy-800">
                {cf.perYearTitle}
              </h2>
              <p className="mt-1 text-sm text-navy-500">{cf.perYearIntro}</p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
                <table className="w-full text-sm" data-testid="cf-years">
                  <thead className="border-b border-navy-100">
                    <tr>
                      <th className={th}>{cf.colYear}</th>
                      <th className={thNum}>{cf.colCost}</th>
                      <th className={thNum}>{cf.colOwn}</th>
                      <th className={thNum}>{cf.colEarned}</th>
                      <th className={thNum}>{cf.colReceived}</th>
                      <th className={thNum}>{cf.colExposure}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.years.map((r) => (
                      <tr key={r.year} className={`border-b border-navy-50 last:border-0 ${result.peak?.year === r.year && r.exposureSEK > 0 ? "bg-gold-50" : ""}`}>
                        <td className={`${td} font-semibold text-navy-800`}>{r.year}</td>
                        <td className={tdNum}>{fmtSEK(r.costSEK, lang)}</td>
                        <td className={`${tdNum} font-semibold text-navy-800`}>{fmtSEK(r.ownSEK, lang)}</td>
                        <td className={tdNum}>{fmtSEK(r.grantEarnedSEK, lang)}</td>
                        <td className={tdNum}>{fmtSEK(r.grantReceivedSEK, lang)}</td>
                        <td className={tdNum}>{fmtSEK(r.exposureSEK, lang)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="mb-16 mt-8" aria-labelledby="cf-items">
              <h2 id="cf-items" className="text-lg font-bold text-navy-800">
                {cf.itemsTitle}
              </h2>
              <p className="mt-1 text-sm text-navy-500">{cf.decisionDocxHint}</p>
              <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
                <table className="w-full text-sm" data-testid="cf-items">
                  <thead className="border-b border-navy-100">
                    <tr>
                      <th className={th}>{cf.colProject}</th>
                      <th className={th}>{cf.colStage}</th>
                      <th className={th}>{cf.colProgram}</th>
                      <th className={th}>{cf.colPeriod}</th>
                      <th className={thNum}>{cf.colTotal}</th>
                      <th className={thNum}>{cf.colGrant}</th>
                      <th className={thNum}>{cf.colOwn}</th>
                      <th className={th}>{cf.colCurrency}</th>
                      <th className={th} />
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item) => (
                      <tr key={item.id} className="border-b border-navy-50 last:border-0">
                        <td className={`${td} font-semibold text-navy-800`}>
                          <Link href={item.href} className="hover:underline">
                            {lang === "sv" ? item.title_sv : item.title_en}
                          </Link>
                        </td>
                        <td className={td}>
                          <span className={`badge ${STAGE_STYLE[item.stage]}`}>{cf.stages[item.stage]}</span>
                        </td>
                        <td className={td}>{(item.programId && findProgram(item.programId)?.shortName) || "–"}</td>
                        <td className={`${td} whitespace-nowrap`}>
                          {item.startYear}–{item.endYear}
                        </td>
                        <td className={tdNum}>{fmtSEK(item.totalCostSEK, lang)}</td>
                        <td className={tdNum}>{fmtSEK(item.grantSEK, lang)}</td>
                        <td className={`${tdNum} font-semibold text-navy-800`}>{fmtSEK(item.ownSEK, lang)}</td>
                        <td className={td}>{item.currency}</td>
                        <td className={td}>
                          <button
                            type="button"
                            onClick={() => exportBrief(item)}
                            className="whitespace-nowrap text-xs font-semibold text-navy-600 hover:text-navy-900"
                          >
                            {cf.decisionDocx}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

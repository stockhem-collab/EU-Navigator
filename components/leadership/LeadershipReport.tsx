"use client";

import Link from "next/link";
import PeerGroupPicker from "@/components/imported/PeerGroupPicker";
import { useEffect, useMemo, useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DatacenterTabs from "@/components/DatacenterTabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtSEK } from "@/lib/format";
import { fmtMoney } from "@/lib/imported/labels";
import { reportState } from "@/lib/data/grants";
import { cashflow } from "@/lib/matching/cofinancing";
import { useApplications } from "@/lib/hooks/useApplications";
import { useFinancingItems } from "@/lib/hooks/useFinancingItems";
import { useGrants } from "@/lib/hooks/useGrants";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useReportingSubmissions } from "@/lib/hooks/useReportingSubmissions";
import type { LeadershipPeer, LeadershipView } from "@/lib/imported/server";

const th = "px-3 py-2 text-left text-xs font-semibold uppercase text-navy-400";
const thNum = "px-3 py-2 text-right text-xs font-semibold uppercase text-navy-400";
const td = "px-3 py-2 align-top";
const tdNum = "whitespace-nowrap px-3 py-2 text-right align-top tabular-nums";

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function Stat({ label, value, testId }: { label: string; value: string | number; testId?: string }) {
  return (
    <div className="rounded-xl border border-navy-100 bg-white p-4 print:break-inside-avoid">
      <p className="text-2xl font-extrabold text-navy-900" data-testid={testId}>
        {value}
      </p>
      <p className="mt-1 text-sm text-navy-500">{label}</p>
    </div>
  );
}

// Ledningsrapport: one page for leadership and the committee — the own
// portfolio (applications, grants, reporting, co-financing) and how the
// municipality compares with the largest municipalities per inhabitant.
// Printable: the browser's print turns it into a PDF.
export default function LeadershipReport({ view }: { view: LeadershipView | null }) {
  const { t, lang } = useLanguage();
  const lr = t.ext.leadership;
  const locale = lang === "sv" ? "sv-SE" : "en-US";
  const fmtInt = (n: number) => Math.round(n).toLocaleString(locale);

  const { all: projects } = useProjectBank();
  const { records } = useApplications();
  const { all: grants } = useGrants();
  const { withSubmissions } = useReportingSubmissions();
  const { items } = useFinancingItems();
  const [today, setToday] = useState<string | null>(null);
  useEffect(() => setToday(new Date().toLocaleDateString(locale)), [locale]);

  const submitted = records.filter((r) => r.status !== "draft");
  const pending = records.filter((r) => r.status === "submitted" || r.status === "under-review");
  const awarded = records.filter((r) => r.status === "awarded");
  const rejected = records.filter((r) => r.status === "rejected");
  const decided = awarded.length + rejected.length;
  const pendingAmount = items.filter((i) => i.stage === "pending").reduce((s, i) => s + i.grantSEK, 0);
  const awardedAmount = grants.reduce((s, g) => s + g.awardedAmountSEK, 0);

  const events = grants.flatMap((g) => withSubmissions(g).reportingEvents);
  const reports = {
    approved: events.filter((e) => e.status === "approved").length,
    submitted: events.filter((e) => e.status === "submitted").length,
    revision: events.filter((e) => e.status === "revision-requested").length,
    overdue: events.filter((e) => e.status === "upcoming" && reportState(e) === "attention").length,
    upcoming: events.filter((e) => e.status === "upcoming" && reportState(e) === "upcoming").length,
  };

  const awardedFlow = useMemo(() => cashflow(items.filter((i) => i.stage === "awarded")), [items]);
  const pendingFlow = useMemo(() => cashflow(items.filter((i) => i.stage === "pending")), [items]);
  const allFlow = useMemo(() => cashflow(items), [items]);

  const peers = useMemo(
    () => [...(view?.peers ?? [])].sort((a, b) => (b.perCapitaSek ?? -1) - (a.perCapitaSek ?? -1)),
    [view]
  );
  const own = peers.find((p) => p.reference) ?? null;
  const hasVinnova = peers.some((p) => p.vinnova);
  const others = peers.filter((p) => !p.reference);
  const ranked = peers.filter((p) => p.perCapitaSek !== null);
  const ownRank = own ? ranked.indexOf(own) + 1 : 0;
  const othersMedian = median(others.flatMap((p) => (p.perCapitaSek !== null ? [p.perCapitaSek] : [])));
  const perCapita = (sek: number, p: LeadershipPeer) => (p.population ? sek / p.population : null);

  return (
    <>
      <div className="print:hidden">
        <Header />
      </div>
      <main className="page">
        <DatacenterTabs />
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{lr.title}</h1>
            <p className="mt-2 max-w-3xl text-sm text-navy-600">{lr.intro}</p>
            {today && <p className="mt-1 text-xs text-navy-400">{lr.generated(today)}</p>}
          </div>
          <button
            type="button"
            onClick={() => window.print()}
            className="shrink-0 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700 print:hidden"
          >
            {lr.print}
          </button>
        </div>

        <section className="mt-8" aria-labelledby="lr-portfolio">
          <h2 id="lr-portfolio" className="text-lg font-bold text-navy-800">
            {lr.portfolioTitle}
          </h2>
          <p className="mt-1 text-sm text-navy-500">
            {lr.portfolioIntro} {lr.exampleDataNote}
          </p>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Stat label={lr.statProjects} value={projects.length} />
            <Stat label={lr.statPortfolioCost} value={fmtSEK(projects.reduce((s, p) => s + p.estimatedCostSEK, 0), lang)} />
            <Stat label={lr.statSubmitted} value={submitted.length} testId="lr-submitted" />
            <Stat label={lr.statPending} value={pending.length} />
            <Stat label={lr.statPendingAmount} value={fmtSEK(pendingAmount, lang)} />
            <Stat label={lr.statAwarded} value={awarded.length} />
            <Stat label={lr.statAwardedAmount} value={fmtSEK(awardedAmount, lang)} testId="lr-awarded-amount" />
            <Stat
              label={lr.statSuccessRate}
              value={decided > 0 ? `${Math.round((awarded.length / decided) * 100)} %` : lr.successRateNone}
            />
          </div>
          {rejected.length > 0 && (
            <p className="mt-2 text-xs text-navy-500">
              {lr.statRejected}: {rejected.length}
            </p>
          )}
        </section>

        <section className="mt-8" aria-labelledby="lr-reporting">
          <h2 id="lr-reporting" className="text-lg font-bold text-navy-800">
            {lr.reportingTitle}
          </h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-5">
            <Stat label={lr.statReportsApproved} value={reports.approved} />
            <Stat label={lr.statReportsSubmitted} value={reports.submitted} />
            <Stat label={lr.statReportsRevision} value={reports.revision} />
            <Stat label={lr.statReportsOverdue} value={reports.overdue} />
            <Stat label={lr.statReportsUpcoming} value={reports.upcoming} />
          </div>
        </section>

        <section className="mt-8" aria-labelledby="lr-cofinancing">
          <h2 id="lr-cofinancing" className="text-lg font-bold text-navy-800">
            {lr.cofinancingTitle}
          </h2>
          <p className="mt-2 text-sm text-navy-700">
            {lr.cofinancingLine(fmtSEK(awardedFlow.ownTotalSEK, lang), fmtSEK(pendingFlow.ownTotalSEK, lang))}{" "}
            {allFlow.peak && allFlow.peak.sek > 0 && lr.cofinancingPeak(fmtSEK(allFlow.peak.sek, lang), allFlow.peak.year)}
          </p>
          <Link href="/datacenter/medfinansiering" className="mt-2 inline-block text-sm font-semibold text-navy-600 hover:text-navy-900 print:hidden">
            {lr.cofinancingLink} →
          </Link>
        </section>

        <section className="mt-10 print:break-before-page" aria-labelledby="lr-peers">
          <h2 id="lr-peers" className="text-lg font-bold text-navy-800">
            {lr.peersTitle}
          </h2>
          {!view || !own ? (
            <p className="mt-2 text-sm text-navy-500">{lr.noPeers}</p>
          ) : (
            <>
              <PeerGroupPicker label={lr.peerGroupLabel} groups={view.peerGroups} active={view.peerGroup} />
              <p className="mt-2 max-w-3xl text-sm text-navy-500">
                {lr.peersIntro(own.name, view.peerGroups.find((g) => g.id === view.peerGroup)?.description ?? "")}
              </p>
              {own.perCapitaSek !== null && (
                <p className="mt-3 rounded-md bg-gold-50 px-3 py-2 text-sm font-semibold text-navy-800" data-testid="lr-rank">
                  {lr.rankLine(own.name, ownRank, ranked.length, `${fmtInt(own.perCapitaSek)} ${lr.perCapitaUnit}`, `${fmtInt(othersMedian)} ${lr.perCapitaUnit}`)}
                </p>
              )}
              <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
                <table className="w-full text-sm" data-testid="lr-peers">
                  <thead className="border-b border-navy-100">
                    <tr>
                      <th className={th}>{lr.colRank}</th>
                      <th className={th}>{lr.colMunicipality}</th>
                      <th className={thNum}>{lr.colPopulation}</th>
                      <th className={thNum}>{lr.colProjects}</th>
                      <th className={thNum}>{lr.colEu}</th>
                      <th className={thNum}>{lr.colPerCapita}</th>
                      <th className={thNum}>{lr.colPeriod1420}</th>
                      <th className={thNum}>{lr.colPeriod2127}</th>
                      {hasVinnova && <th className={thNum}>{lr.colVinnova}</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {peers.map((p) => (
                      <tr key={p.name} className={`border-b border-navy-50 last:border-0 ${p.reference ? "bg-gold-50 font-semibold" : ""}`}>
                        <td className={td}>{p.perCapitaSek !== null ? ranked.indexOf(p) + 1 : "–"}</td>
                        <td className={td}>{p.name}</td>
                        <td className={tdNum}>{p.population ? fmtInt(p.population) : "–"}</td>
                        <td className={tdNum}>{p.projects}</td>
                        <td className={tdNum}>
                          <span title={fmtMoney(p.euContributionEur, "EUR", lang)}>{fmtSEK(p.euContributionSek, lang)}</span>
                        </td>
                        <td className={tdNum}>{p.perCapitaSek !== null ? fmtInt(p.perCapitaSek) : "–"}</td>
                        <td className={tdNum}>
                          {fmtSEK(p.byPeriod["2014-2020"].sek, lang)}
                          <span className="block text-xs font-normal text-navy-400">{lr.colProjects.toLowerCase()}: {p.byPeriod["2014-2020"].projects}</span>
                        </td>
                        <td className={tdNum}>
                          {fmtSEK(p.byPeriod["2021-2027"].sek, lang)}
                          <span className="block text-xs font-normal text-navy-400">{lr.colProjects.toLowerCase()}: {p.byPeriod["2021-2027"].projects}</span>
                        </td>
                        {hasVinnova && (
                          <td className={tdNum}>
                            {p.vinnova ? (
                              <>
                                {fmtSEK(p.vinnova.grantSek, lang)}
                                <span className="block text-xs font-normal text-navy-400">{lr.colProjects.toLowerCase()}: {p.vinnova.projects}</span>
                              </>
                            ) : (
                              "–"
                            )}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-2 text-xs text-navy-500">{lr.populationSource(view.populationYear)}</p>

              {own.population && own.byProgram.length > 0 && (
                <>
                  <h3 className="mt-6 font-bold text-navy-800">{lr.byProgramTitle}</h3>
                  <p className="mt-1 text-sm text-navy-500">{lr.byProgramIntro(own.name)}</p>
                  <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
                    <table className="w-full text-sm" data-testid="lr-by-program">
                      <thead className="border-b border-navy-100">
                        <tr>
                          <th className={th}>{lr.colProgram}</th>
                          <th className={thNum}>{lr.colOwn}</th>
                          <th className={thNum}>{lr.colPeerMedian}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {own.byProgram.map((prog) => {
                          const ownValue = perCapita(prog.sek, own) ?? 0;
                          const peerValues = others.flatMap((p) => {
                            if (!p.population) return [];
                            const match = p.byProgram.find((x) => x.key === prog.key);
                            return [match ? match.sek / p.population : 0];
                          });
                          return (
                            <tr key={prog.key} className="border-b border-navy-50 last:border-0">
                              <td className={`${td} font-semibold text-navy-800`}>{prog.programme}</td>
                              <td className={tdNum}>
                                {fmtInt(ownValue)} {lr.perCapitaUnit}
                              </td>
                              <td className={tdNum}>
                                {fmtInt(median(peerValues))} {lr.perCapitaUnit}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}

              {view.caveats.length > 0 && (
                <>
                  <h3 className="mt-6 text-sm font-semibold uppercase text-navy-400">{lr.caveatsTitle}</h3>
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-xs text-navy-500">
                    {view.caveats.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                </>
              )}
            </>
          )}
        </section>
      </main>
      <div className="print:hidden">
        <Footer />
      </div>
    </>
  );
}

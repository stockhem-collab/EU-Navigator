"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KnowledgeTabs from "@/components/KnowledgeTabs";
import PageHeader from "@/components/PageHeader";
import { useMemo } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCandidateDecisions } from "@/lib/hooks/useCandidateDecisions";
import { candidateAsProject, summariseHistory } from "@/lib/imported/historySummary";
import { fmtSEK } from "@/lib/format";
import { fmtMoney, sourceLabel } from "@/lib/imported/labels";
import type { HistoryCandidateRow, HistoryView } from "@/lib/imported/server";
import SekAmountText from "./SekAmountText";

const th = "px-3 py-2 text-left text-xs font-semibold uppercase text-navy-400";
const td = "px-3 py-2 align-top";
const actionBtn = "rounded-md border px-2 py-1 text-xs font-semibold";

export default function HistoryPage({ history: imported }: { history: HistoryView | null }) {
  const { t, lang } = useLanguage();
  const it = t.imported;
  const { decisions, decide } = useCandidateDecisions(imported?.profile ?? "uppsala");

  // Confirmed possible matches count as the municipality's own projects;
  // rejected ones are set aside in a list of their own.
  const { history, rejected } = useMemo(() => {
    if (!imported) return { history: null, rejected: [] as HistoryCandidateRow[] };
    const confirmed = imported.candidates.filter((c) => decisions[c.id] === "confirmed").map(candidateAsProject);
    const projects = [...imported.projects, ...confirmed].sort((a, b) => (b.startDate ?? "").localeCompare(a.startDate ?? ""));
    return {
      history: {
        ...imported,
        projects,
        candidates: imported.candidates.filter((c) => !decisions[c.id]),
        ...summariseHistory(projects),
      },
      rejected: imported.candidates.filter((c) => decisions[c.id] === "rejected"),
    };
  }, [imported, decisions]);

  return (
    <>
      <Header />
      <main className="page">
        <KnowledgeTabs />
        <PageHeader title={it.historyTitle} subtitle={history ? it.historyIntro(history.municipality.name) : undefined} />
        {!history ? (
          <p className="mt-4 text-sm text-navy-500">{it.historyNone}</p>
        ) : (
          <>
            <p className="mt-4 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-700">
              {it.historyRules(history.rules.sureMatch, history.rules.historyFrom)}
            </p>

            <section className="mt-6 rounded-xl bg-navy-800 p-6 text-white" aria-label={it.historyTitle}>
              <div className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
                <div>
                  <p className="text-2xl font-bold text-gold-300" data-testid="history-project-count">
                    {history.projects.length}
                  </p>
                  <p className="text-navy-300">{it.statProjects}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gold-300" title={fmtMoney(history.totalEur, "EUR", lang)}>
                    {fmtSEK(history.totalSek, lang)}
                  </p>
                  <p className="text-navy-300">{it.statEu}</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-gold-300">{history.byProgram.length}</p>
                  <p className="text-navy-300">{it.statPrograms}</p>
                </div>
              </div>
            </section>

            {history.projects.length === 0 && (
              <p className="mt-4 rounded-md border border-gold-300 bg-gold-50 px-3 py-2 text-sm text-navy-700">
                {it.historyNoProjects(history.municipality.name)}
              </p>
            )}

            <h2 className="mt-8 text-lg font-bold text-navy-800">{it.byProgramTitle}</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-navy-100">
                  <tr>
                    <th className={th}>{it.colProgram}</th>
                    <th className={th}>{it.statProjects}</th>
                    <th className={th}>{it.colEu}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.byProgram.map((p) => (
                    <tr key={p.programId ?? p.programme} className="border-b border-navy-50 last:border-0">
                      <td className={`${td} font-semibold text-navy-800`}>{p.programme}</td>
                      <td className={td}>{p.projects}</td>
                      <td className={td}>
                        <span title={fmtMoney(p.eur, "EUR", lang)}>{fmtSEK(p.sek, lang)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h2 className="mt-8 text-lg font-bold text-navy-800">{it.projectsTitle}</h2>
            <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
              <table className="w-full text-sm" data-testid="history-projects">
                <thead className="border-b border-navy-100">
                  <tr>
                    <th className={th}>{it.colProject}</th>
                    <th className={th}>{it.colProgram}</th>
                    <th className={th}>{it.colPeriod}</th>
                    <th className={th}>{it.colRole}</th>
                    <th className={th}>{it.colEu}</th>
                    <th className={th}>{it.colSource}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.projects.map((p) => (
                    <tr key={p.id} className="border-b border-navy-50 last:border-0">
                      <td className={`${td} font-semibold text-navy-800`}>
                        {p.acronym ? `${p.acronym}: ` : ""}
                        {p.title}
                        <p className="text-xs font-normal text-navy-400">
                          {it.colMatchedOn}: {p.matchedOn}
                        </p>
                        {p.confirmedManually && (
                          <p className="mt-1 flex flex-wrap items-center gap-2 text-xs font-normal">
                            <span className="rounded bg-gold-100 px-1.5 py-0.5 font-semibold text-navy-700">{it.confirmedManually}</span>
                            <button type="button" className="text-navy-500 underline hover:text-navy-900" onClick={() => decide(p.id, null)}>
                              {it.undoDecision}
                            </button>
                          </p>
                        )}
                      </td>
                      <td className={td}>{p.programme}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {p.startDate?.slice(0, 4)}–{p.endDate?.slice(0, 4)}
                      </td>
                      <td className={td}>{p.role ? (it.roles[p.role as keyof typeof it.roles] ?? p.role) : "–"}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        <SekAmountText amount={p.euContribution} />
                      </td>
                      <td className={td}>
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-600 hover:text-navy-900">
                            {sourceLabel(p.source, lang)} ↗
                          </a>
                        ) : (
                          sourceLabel(p.source, lang)
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {history.candidates.length > 0 && (
              <>
                <h2 className="mt-8 text-lg font-bold text-navy-800">{it.candidatesTitle}</h2>
                <p className="mt-1 text-sm text-navy-500">{it.candidatesIntro}</p>
                <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
                  <table className="w-full text-sm" data-testid="history-candidates">
                    <thead className="border-b border-navy-100">
                      <tr>
                        <th className={th}>{it.colProject}</th>
                        <th className={th}>{it.colProgram}</th>
                        <th className={th}>{it.colReason}</th>
                        <th className={th}>{it.colEu}</th>
                        <th className={th}>{it.colSource}</th>
                        <th className={th}>
                          <span className="sr-only">{it.colDecision}</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {history.candidates.map((c) => (
                        <tr key={c.id} className="border-b border-navy-50 last:border-0">
                          <td className={`${td} font-semibold text-navy-800`}>
                            {c.acronym ? `${c.acronym}: ` : ""}
                            {c.title}
                            {c.organisationName && <p className="text-xs font-normal text-navy-400">{c.organisationName}</p>}
                          </td>
                          <td className={td}>{c.programme}</td>
                          <td className={td}>{c.reason}</td>
                          <td className={`${td} whitespace-nowrap`}>
                            <SekAmountText amount={c.euContribution} />
                          </td>
                          <td className={td}>
                            {c.url ? (
                              <a href={c.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-600 hover:text-navy-900">
                                {sourceLabel(c.source, lang)} ↗
                              </a>
                            ) : (
                              sourceLabel(c.source, lang)
                            )}
                          </td>
                          <td className={`${td} whitespace-nowrap`}>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                className={`${actionBtn} border-navy-700 bg-navy-700 text-white hover:bg-navy-900`}
                                aria-label={`${it.confirmMatch}: ${c.acronym ?? c.title}`}
                                onClick={() => decide(c.id, "confirmed")}
                              >
                                {it.confirmMatch}
                              </button>
                              <button
                                type="button"
                                className={`${actionBtn} border-navy-200 text-navy-600 hover:bg-navy-50`}
                                aria-label={`${it.rejectMatch}: ${c.acronym ?? c.title}`}
                                onClick={() => decide(c.id, "rejected")}
                              >
                                {it.rejectMatch}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {rejected.length > 0 && (
              <details className="mt-4 rounded-xl border border-navy-100 bg-white px-4 py-3 text-sm" data-testid="history-rejected">
                <summary className="cursor-pointer font-semibold text-navy-700">{it.rejectedTitle(rejected.length)}</summary>
                <ul className="mt-2 space-y-2">
                  {rejected.map((c) => (
                    <li key={c.id} className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-navy-600">
                        {c.acronym ? `${c.acronym}: ` : ""}
                        {c.title}
                      </span>
                      <button
                        type="button"
                        className="text-xs text-navy-500 underline hover:text-navy-900"
                        aria-label={`${it.undoDecision}: ${c.acronym ?? c.title}`}
                        onClick={() => decide(c.id, null)}
                      >
                        {it.undoDecision}
                      </button>
                    </li>
                  ))}
                </ul>
              </details>
            )}

            {history.vinnova && (
              <section className="mt-8" data-testid="history-vinnova">
                <h2 className="text-lg font-bold text-navy-800">{it.vinnovaTitle}</h2>
                <p className="mt-1 text-sm text-navy-500">
                  {history.vinnova.projects.length > 0
                    ? it.vinnovaIntro(history.municipality.name, history.vinnova.projects.length, fmtSEK(history.vinnova.totalSek, lang))
                    : it.vinnovaNone(history.municipality.name)}
                </p>
                {history.vinnova.projects.length > 0 && (
                  <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
                    <table className="w-full text-sm">
                      <thead className="border-b border-navy-100">
                        <tr>
                          <th className={th}>{it.colProject}</th>
                          <th className={th}>{it.colProgram}</th>
                          <th className={th}>{it.colPeriod}</th>
                          <th className={th}>{it.colGrant}</th>
                          <th className={th}>{it.colSource}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {history.vinnova.projects.map((p) => (
                          <tr key={p.id} className="border-b border-navy-50 last:border-0">
                            <td className={`${td} font-semibold text-navy-800`}>
                              {p.title}
                              <p className="text-xs font-normal text-navy-400">
                                {it.colCoordinator}: {p.coordinator}
                              </p>
                            </td>
                            <td className={td}>{p.programme}</td>
                            <td className={`${td} whitespace-nowrap`}>
                              {p.startDate?.slice(0, 4)}–{p.endDate?.slice(0, 4)}
                            </td>
                            <td className={`${td} whitespace-nowrap`}>{p.grantSek !== null ? fmtSEK(p.grantSek, lang) : "–"}</td>
                            <td className={`${td} whitespace-nowrap`}>
                              {p.url ? (
                                <a href={p.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-600 hover:text-navy-900">
                                  Vinnova {p.diarienummer} ↗
                                </a>
                              ) : (
                                `Vinnova ${p.diarienummer}`
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            )}

            {history.peers.length > 0 && (
              <>
                <h2 className="mt-8 text-lg font-bold text-navy-800">{it.peersTitle}</h2>
                <p className="mt-1 text-sm text-navy-500">{it.peersIntro}</p>
                <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
                  <table className="w-full text-sm" data-testid="history-peers">
                    <thead className="border-b border-navy-100">
                      <tr>
                        <th className={th}>{it.colMunicipality}</th>
                        <th className={th}>{it.statProjects}</th>
                        <th className={th}>{it.colEu}</th>
                        {history.vinnova && <th className={th}>{it.colVinnova}</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {history.peers.map((m) => (
                        <tr key={m.name} className={`border-b border-navy-50 last:border-0 ${m.reference ? "bg-gold-50 font-semibold" : ""}`}>
                          <td className={td}>{m.name}</td>
                          <td className={td}>{m.projects}</td>
                          <td className={td}>
                            <span title={fmtMoney(m.euContributionEur, "EUR", lang)}>{fmtSEK(m.euContributionSek, lang)}</span>
                          </td>
                          {history.vinnova && (
                            <td className={td}>
                              {m.vinnova ? (
                                <>
                                  {fmtSEK(m.vinnova.grantSek, lang)}
                                  <span className="block text-xs font-normal text-navy-400">
                                    {it.statProjects.toLowerCase()}: {m.vinnova.projects}
                                  </span>
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
                {history.peerCaveats.length > 0 && (
                  <ul className="mt-3 list-disc space-y-1 pl-5 text-xs text-navy-500">
                    {history.peerCaveats.map((c) => (
                      <li key={c}>{c}</li>
                    ))}
                  </ul>
                )}
              </>
            )}
          </>
        )}
      </main>
      <Footer />
    </>
  );
}

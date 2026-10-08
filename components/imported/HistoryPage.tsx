"use client";

import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KnowledgeTabs from "@/components/KnowledgeTabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtSEK } from "@/lib/format";
import { fmtMoney, sourceLabel } from "@/lib/imported/labels";
import type { HistoryView } from "@/lib/imported/server";
import SekAmountText from "./SekAmountText";

const th = "px-3 py-2 text-left text-xs font-semibold uppercase text-navy-400";
const td = "px-3 py-2 align-top";

export default function HistoryPage({ history }: { history: HistoryView | null }) {
  const { t, lang } = useLanguage();
  const it = t.imported;

  return (
    <>
      <Header />
      <main className="section">
        <KnowledgeTabs />
        <h1 className="text-2xl font-bold text-navy-900">{it.historyTitle}</h1>
        {!history ? (
          <p className="mt-4 text-sm text-navy-500">{it.historyNone}</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-navy-600">{it.historyIntro(history.municipality.name)}</p>
            <p className="mt-3 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-700">
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
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
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

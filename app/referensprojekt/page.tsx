"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KnowledgeTabs from "@/components/KnowledgeTabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms, findProgram } from "@/lib/data/fundingPrograms";
import { fundedProjects, computeProgramStats } from "@/lib/data/fundedProjects";
import { fmtSEK } from "@/lib/format";
import ImportedReferenceList from "@/components/imported/ImportedReferenceList";
import { IMPORTED_SOURCES, countryName, sourceLabel } from "@/lib/imported/labels";
import type { ReferenceFilterOptions } from "@/lib/imported/types";

/** The first year in an example project's period text ("2023-01-01 till …"). */
function exampleStartYear(periodLabel: string): string | null {
  return periodLabel.match(/\d{4}/)?.[0] ?? null;
}

export default function ReferenceProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ReferenceProjectsInner />
    </Suspense>
  );
}

function ReferenceProjectsInner() {
  const searchParams = useSearchParams();
  const initialProgram = searchParams.get("program") ?? "all";
  const [programFilter, setProgramFilter] = useState(initialProgram);
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState(searchParams.get("source") ?? "all");
  const [countryFilter, setCountryFilter] = useState(searchParams.get("country") ?? "all");
  const [yearFilter, setYearFilter] = useState(searchParams.get("year") ?? "all");
  const [importedOptions, setImportedOptions] = useState<ReferenceFilterOptions | null>(null);
  const { t, lang } = useLanguage();
  const rp = t.referenceProjects;
  const it = t.imported;

  const query = search.trim().toLowerCase();
  // The example projects are all Swedish, so a country filter other than
  // Sweden leaves none of them.
  const showExamples = sourceFilter === "all" || sourceFilter === "example";
  const filtered = useMemo(
    () =>
      (programFilter === "all" ? fundedProjects : fundedProjects.filter((p) => p.programId === programFilter))
        .filter((p) => countryFilter === "all" || countryFilter === "SE")
        .filter((p) => yearFilter === "all" || exampleStartYear(p.periodLabel) === yearFilter)
        .filter((p) =>
          query ? `${p.title} ${p.organisation} ${p.theme_sv} ${p.theme_en}`.toLowerCase().includes(query) : true
        ),
    [programFilter, countryFilter, yearFilter, query]
  );
  const stats = computeProgramStats(filtered);
  // The app's own programmes first, then the source programmes that have
  // no counterpart among them (e.g. older Interreg programmes).
  const extraPrograms = (importedOptions?.programs ?? []).filter((p) => !fundingPrograms.some((fp) => fp.id === p.id));
  const exampleYears = fundedProjects.map((p) => exampleStartYear(p.periodLabel)).filter((y): y is string => !!y);
  const years = [...new Set([...(importedOptions?.years.map(String) ?? []), ...exampleYears])].sort((a, b) => b.localeCompare(a));
  const selectClass =
    "rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";

  return (
    <>
      <Header />
      <main className="section">
        <KnowledgeTabs />
        <h1 className="text-2xl font-bold text-navy-900">{rp.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{rp.subtitle}</p>
        <p className="mt-3 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-700">{rp.disclaimer}</p>

        <Link
          href="/ansokan"
          className="mt-4 inline-block rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400"
        >
          {rp.startApplicationCta}
        </Link>

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={rp.searchPlaceholder}
            className="w-full max-w-xs rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          <select
            aria-label={it.filterProgram}
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className={selectClass}
          >
            <option value="all">{rp.filterAll}</option>
            {fundingPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "sv" ? p.name_sv : p.name}
              </option>
            ))}
            {extraPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
          <select aria-label={it.filterSource} value={sourceFilter} onChange={(e) => setSourceFilter(e.target.value)} className={selectClass}>
            <option value="all">{it.sourceFilterAll}</option>
            <option value="example">{it.sourceExample}</option>
            {IMPORTED_SOURCES.map((s) => (
              <option key={s} value={s}>
                {sourceLabel(s, lang)}
              </option>
            ))}
          </select>
          <select aria-label={it.filterCountry} value={countryFilter} onChange={(e) => setCountryFilter(e.target.value)} className={selectClass}>
            <option value="all">{it.countryFilterAll}</option>
            {(importedOptions?.countries ?? [{ id: "SE", count: 0 }])
              .map((c) => ({ id: c.id, name: countryName(c.id, lang) }))
              .sort((a, b) => a.name.localeCompare(b.name, lang))
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
          <select aria-label={it.filterYear} value={yearFilter} onChange={(e) => setYearFilter(e.target.value)} className={selectClass}>
            <option value="all">{it.yearFilterAll}</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>

        {showExamples && (
        <>
        <h2 className="mt-8 text-lg font-bold text-navy-800">
          {it.exampleTitle} <span className="text-sm font-normal text-navy-500">({it.exampleCount(filtered.length)})</span>
        </h2>
        <section className="mt-4 rounded-xl bg-navy-800 p-6 text-white">
          <h2 className="font-bold">{rp.statsTitle}</h2>
          <p className="mt-1 text-sm text-navy-300">{rp.statsIntro(stats.total)}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
            <div>
              <p className="text-2xl font-bold text-gold-300">{stats.ownerSharePct}%</p>
              <p className="text-navy-300">{rp.statOwnerShare}</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gold-300">
                {stats.avgBudgetSEK !== null ? fmtSEK(stats.avgBudgetSEK, lang) : "–"}
              </p>
              <p className="text-navy-300">{rp.statAvgBudget}</p>
            </div>
            <div className="col-span-2 sm:col-span-2">
              <p className="text-lg font-bold text-gold-300">{(lang === "sv" ? stats.topTheme_sv : stats.topTheme_en) ?? "–"}</p>
              <p className="text-navy-300">{rp.statTopTheme}</p>
            </div>
          </div>
          <p className="mt-4 text-sm text-navy-300">{rp.statCurrentVsLegacy(stats.currentCount, stats.legacyCount)}</p>
        </section>

        {filtered.length === 0 && <p className="mt-8 text-sm text-navy-500">{rp.noProjectsMatch}</p>}

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {filtered.map((project) => {
            const program = findProgram(project.programId);
            return (
              <div key={project.id} className="flex flex-col rounded-xl border border-navy-100 bg-white p-6">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <p className="text-xs font-semibold uppercase text-navy-400">{program?.shortName ?? project.fundName}</p>
                  <div className="flex flex-wrap gap-2">
                    {project.source === "example" && (
                      <span className="badge bg-gold-100 text-navy-700" title={rp.sourceExampleTooltip}>
                        {rp.sourceExampleBadge}
                      </span>
                    )}
                    {project.period === "2014-2020" && (
                      <span className="badge bg-navy-100 text-navy-500">{rp.periodLegacyBadge}</span>
                    )}
                  </div>
                </div>
                <h3 className="mt-1 font-bold text-navy-900">{project.title}</h3>
                <p className="mt-2 whitespace-pre-line text-sm text-navy-600">
                  {lang === "sv" ? project.description_sv : project.description_en ?? project.description_sv}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-navy-50 pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldRole}</dt>
                    <dd className="font-semibold text-navy-800">{project.role === "owner" ? rp.roleOwner : rp.rolePartner}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldPeriod}</dt>
                    <dd className="font-semibold text-navy-800">{project.periodLabel}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldBudget}</dt>
                    <dd className="font-semibold text-navy-800">
                      {project.totalBudgetSEK !== null ? fmtSEK(project.totalBudgetSEK, lang) : rp.noBudgetDisclosed}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldEuFunding}</dt>
                    <dd className="font-semibold text-navy-800">
                      {project.euFundingSEK !== null ? fmtSEK(project.euFundingSEK, lang) : rp.noBudgetDisclosed}
                    </dd>
                  </div>
                </dl>

                {project.indicators && project.indicators.length > 0 && (
                  <div className="mt-4 space-y-2 border-t border-navy-50 pt-4">
                    {project.indicators.map((ind) => (
                      <div key={ind.label_sv} className="flex items-center justify-between text-sm">
                        <span className="text-navy-600">{lang === "sv" ? ind.label_sv : ind.label_en}</span>
                        <span className="font-semibold text-navy-800">
                          {ind.actual.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")}
                          {" / "}
                          {rp.indicatorTargetLabel} {ind.target.toLocaleString(lang === "sv" ? "sv-SE" : "en-US")}{" "}
                          {lang === "sv" ? ind.unit_sv : ind.unit_en}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
        )}

        {sourceFilter !== "example" && (
          <ImportedReferenceList
            filters={{ source: sourceFilter, program: programFilter, country: countryFilter, year: yearFilter, q: search }}
            onOptions={setImportedOptions}
          />
        )}
      </main>
      <Footer />
    </>
  );
}

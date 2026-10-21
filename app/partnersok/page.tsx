"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import KnowledgeTabs from "@/components/KnowledgeTabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms } from "@/lib/data/fundingPrograms";
import { ALL_SECTORS } from "@/lib/imported/themes";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import { countryName, sourceLabel } from "@/lib/imported/labels";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import type { OrganisationType } from "@/lib/integrations/core/types";
import type { PartnerSearchHit, PartnerSearchResponse } from "@/lib/imported/types";
import Pagination, { totalPagesFor } from "@/components/Pagination";
import { pageFromParams, useReplaceQuery } from "@/lib/hooks/useQueryState";

const PAGE_SIZE = 25;

interface Filters {
  q: string;
  type: string;
  country: string;
  program: string;
  sector: string;
  period: string;
  onlyCoordinators: boolean;
  excludeOwn: boolean;
}

function queryString(f: Filters, own: string | null, page: number): string {
  const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
  if (f.q.trim()) params.set("q", f.q.trim());
  for (const key of ["type", "country", "program", "sector", "period"] as const) {
    if (f[key] !== "all") params.set(key, f[key]);
  }
  if (f.onlyCoordinators) params.set("role", "coordinator");
  if (f.excludeOwn && own) params.set("own", own);
  return params.toString();
}

export default function PartnerSearchPage() {
  return (
    <Suspense fallback={null}>
      <PartnerSearchInner />
    </Suspense>
  );
}

// Partnersök: the organisations in the imported EU projects, found by what
// they have done (subject, programme, theme, period) and who they are
// (type, country, whether they have led a project). Searched on the
// server, a page at a time, like the reference projects.
function PartnerSearchInner() {
  const { t, lang } = useLanguage();
  const ps = t.ext.partners;
  const searchParams = useSearchParams();
  const { config } = useOrgConfig();
  const own = config.organisationName;
  const [filters, setFilters] = useState<Filters>({
    q: searchParams.get("q") ?? "",
    type: searchParams.get("type") ?? "all",
    country: searchParams.get("country") ?? "all",
    program: searchParams.get("program") ?? "all",
    sector: searchParams.get("sector") ?? "all",
    period: searchParams.get("period") ?? "all",
    onlyCoordinators: searchParams.get("role") === "coordinator",
    excludeOwn: true,
  });
  const replaceQuery = useReplaceQuery();
  const [result, setResult] = useState<PartnerSearchResponse | null>(null);
  const [hits, setHits] = useState<PartnerSearchHit[]>([]);
  const [page, setPage] = useState(pageFromParams(searchParams));
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const [openOrgs, setOpenOrgs] = useState<string[]>([]);
  const resultsRef = useRef<HTMLDivElement>(null);
  const key = queryString(filters, own, page);
  // Every filter change goes back to page 1.
  const set = (patch: Partial<Filters>) => {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(1);
  };

  // The search and page live in the URL, so a link or a reload opens the
  // same list. Defaults are left out.
  useEffect(() => {
    const value = (v: string) => (v === "all" ? null : v);
    replaceQuery({
      q: filters.q.trim() || null,
      type: value(filters.type),
      country: value(filters.country),
      program: value(filters.program),
      sector: value(filters.sector),
      period: value(filters.period),
      role: filters.onlyCoordinators ? "coordinator" : null,
      sida: page > 1 ? String(page) : null,
    });
  }, [filters, page, replaceQuery]);

  // One page at a time from the server; typing waits for a pause.
  useEffect(() => {
    let cancelled = false;
    setState("loading");
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/partnersok?${key}`);
        if (!res.ok) throw new Error(String(res.status));
        const data: PartnerSearchResponse = await res.json();
        if (cancelled) return;
        setResult(data);
        setHits(data.organisations);
        setState("ready");
        // A page past the end (an old link, or fewer hits than before)
        // goes to the last page there is.
        const last = totalPagesFor(data.total, PAGE_SIZE);
        if (page > last) setPage(last);
      } catch {
        if (!cancelled) setState("error");
      }
    }, 300);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // The query string carries the page and the filters.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const goTo = (next: number) => {
    setPage(next);
    resultsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const typeLabel = (type: string) => (type === "unknown" ? ps.typeUnknown : (ps.types[type as OrganisationType] ?? type));
  const selectClass =
    "rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";
  // The chosen type and country stay in the list even when the other
  // filters leave none of them.
  const typeOptions = result?.options.types ?? [];
  const countryOptions = (result?.options.countries ?? [])
    .map((c) => ({ id: c.id, name: countryName(c.id, lang), count: c.count }))
    .sort((a, b) => a.name.localeCompare(b.name, lang));

  return (
    <>
      <Header />
      <main className="page">
        <KnowledgeTabs />
        <PageHeader title={ps.title} subtitle={ps.intro} />

        <div className="mt-6 flex flex-wrap gap-3">
          <input
            value={filters.q}
            onChange={(e) => set({ q: e.target.value })}
            placeholder={ps.searchPlaceholder}
            aria-label={ps.searchLabel}
            className="w-full max-w-md rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          <select aria-label={ps.typeLabel} value={filters.type} onChange={(e) => set({ type: e.target.value })} className={selectClass}>
            <option value="all">{ps.typeAll}</option>
            {filters.type !== "all" && !typeOptions.some((o) => o.id === filters.type) && (
              <option value={filters.type}>{typeLabel(filters.type)}</option>
            )}
            {typeOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {typeLabel(o.id)} ({o.count})
              </option>
            ))}
          </select>
          <select aria-label={ps.countryLabel} value={filters.country} onChange={(e) => set({ country: e.target.value })} className={selectClass}>
            <option value="all">{ps.countryAll}</option>
            {filters.country !== "all" && !countryOptions.some((o) => o.id === filters.country) && (
              <option value={filters.country}>{countryName(filters.country, lang)}</option>
            )}
            {countryOptions.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name} ({o.count})
              </option>
            ))}
          </select>
          <select aria-label={ps.programLabel} value={filters.program} onChange={(e) => set({ program: e.target.value })} className={selectClass}>
            <option value="all">{ps.programAll}</option>
            {fundingPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "sv" ? p.name_sv : p.name}
              </option>
            ))}
          </select>
          <select aria-label={ps.sectorLabel} value={filters.sector} onChange={(e) => set({ sector: e.target.value })} className={selectClass}>
            <option value="all">{ps.sectorAll}</option>
            {ALL_SECTORS.map((s) => (
              <option key={s} value={s}>
                {sectorLabel(s, lang)}
              </option>
            ))}
          </select>
          <select aria-label={ps.periodLabel} value={filters.period} onChange={(e) => set({ period: e.target.value })} className={selectClass}>
            <option value="all">{ps.periodAll}</option>
            <option value="2021-2027">2021–2027</option>
            <option value="2014-2020">2014–2020</option>
          </select>
        </div>
        <div className="mt-3 flex flex-wrap gap-5 text-sm font-semibold text-navy-700">
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={filters.onlyCoordinators} onChange={(e) => set({ onlyCoordinators: e.target.checked })} />
            {ps.onlyCoordinators}
          </label>
          {own && (
            <label className="flex items-center gap-2">
              <input type="checkbox" checked={filters.excludeOwn} onChange={(e) => set({ excludeOwn: e.target.checked })} />
              {ps.excludeOwn(own)}
            </label>
          )}
        </div>

        <div ref={resultsRef} className="mt-6 scroll-mt-4" aria-live="polite">
          {state === "error" && <p className="text-sm text-red-700">{ps.loadError}</p>}
          {result && (
            <p className="text-sm text-navy-500" data-testid="partner-result-count">
              {ps.resultCount(result.total, result.matchedProjects)}
              {result.total > PAGE_SIZE &&
                ` · ${t.ext.pager.range((page - 1) * PAGE_SIZE + 1, Math.min(page * PAGE_SIZE, result.total), result.total)}`}
            </p>
          )}
          {state === "ready" && result?.total === 0 && <p className="mt-3 text-sm text-navy-500">{ps.none}</p>}
        </div>

        <ul
          className={`mt-3 divide-y divide-navy-50 overflow-hidden rounded-xl border border-navy-100 bg-white ${state === "loading" ? "opacity-60" : ""} ${hits.length === 0 ? "hidden" : ""}`}
          data-testid="partner-results"
        >
          {hits.map((org) => {
            const isOpen = openOrgs.includes(org.organisationId);
            return (
              <li key={org.organisationId} className="px-4 py-3">
                <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate text-sm font-semibold text-navy-900" title={org.name}>
                      {org.name}
                    </h2>
                    <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-navy-500">
                      <span>{countryName(org.country, lang)}</span>
                      {org.type && (
                        <span className="badge bg-navy-50 text-navy-600" title={org.typeFromName ? ps.typeFromNameTooltip : undefined}>
                          {ps.types[org.type]}
                          {org.typeFromName ? " *" : ""}
                        </span>
                      )}
                      {org.latestYear && <span>{ps.latestYear(org.latestYear)}</span>}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-4 text-right text-sm">
                    <div>
                      <p className="font-semibold text-navy-800">{ps.projectCount(org.projectCount)}</p>
                      <p className="text-xs text-navy-500">{ps.roleSummary(org.coordinatorCount, org.partnerCount, org.associatedCount)}</p>
                    </div>
                    <button
                      type="button"
                      aria-expanded={isOpen}
                      onClick={() => setOpenOrgs(isOpen ? openOrgs.filter((id) => id !== org.organisationId) : [...openOrgs, org.organisationId])}
                      className="w-28 text-right text-xs font-semibold text-navy-600 hover:text-navy-900"
                    >
                      {isOpen ? ps.hideProjects : ps.showProjects(org.projects.length)}
                    </button>
                  </div>
                </div>
                {isOpen && <p className="mt-2 text-xs text-navy-500">{org.programmes.map((p) => `${p.label} (${p.count})`).join(" · ")}</p>}
                {isOpen && (
                  <ul className="mt-2 space-y-1.5 border-t border-navy-50 pt-2 text-sm">
                    {org.projects.map((p) => (
                      <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className="text-navy-700">
                          {p.acronym ? `${p.acronym}: ` : ""}
                          {p.title}
                          <span className="ml-2 text-xs text-navy-400">
                            {p.programme}
                            {p.startYear ? `, ${p.startYear}` : ""} · {t.imported.roles[p.role]}
                          </span>
                        </span>
                        {p.url ? (
                          <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-xs font-semibold text-navy-600 hover:text-navy-900">
                            {sourceLabel(p.source, lang)} ↗
                          </a>
                        ) : (
                          <span className="text-xs text-navy-400">{sourceLabel(p.source, lang)}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>

        {state === "loading" && hits.length === 0 && <p className="mt-4 text-sm text-navy-500">{ps.loading}</p>}
        {result && (
          <Pagination page={page} pageSize={PAGE_SIZE} total={result.total} onPageChange={goTo} disabled={state === "loading"} />
        )}
        <p className="mb-16 mt-6 text-xs text-navy-500">{ps.sourceNote}</p>
      </main>
      <Footer />
    </>
  );
}

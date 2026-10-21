"use client";

import { useEffect, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { findProgram } from "@/lib/data/fundingPrograms";
import { countryName, isNationalSource, sourceLabel } from "@/lib/imported/labels";
import type { ReferenceListResponse, ReferenceProjectCard } from "@/lib/imported/types";
import SekAmountText from "./SekAmountText";
import Pagination, { totalPagesFor } from "@/components/Pagination";

export interface ImportedFilters {
  source: string; // "all" or a SourceSystem
  program: string; // "all" or a programme key
  country: string; // "all" or ISO code
  year: string; // "all" or a year
  q: string;
}

export const REFERENCE_PAGE_SIZE = 20;

function queryString(filters: ImportedFilters, page: number): string {
  const params = new URLSearchParams({ page: String(page), pageSize: String(REFERENCE_PAGE_SIZE) });
  if (filters.source !== "all") params.set("source", filters.source);
  if (filters.program !== "all") params.set("program", filters.program);
  if (filters.country !== "all") params.set("country", filters.country);
  if (filters.year !== "all") params.set("year", filters.year);
  if (filters.q.trim()) params.set("q", filters.q.trim());
  return params.toString();
}

/** The imported reference projects, fetched one page at a time from the
 * server with the page's filters. The page number is the parent's (it
 * lives in the URL); a filter change should send it back to 1. Reports the
 * filter options it gets back. */
export default function ImportedReferenceList({
  filters,
  page,
  onPageChange,
  onOptions,
}: {
  filters: ImportedFilters;
  page: number;
  onPageChange: (page: number) => void;
  onOptions?: (options: ReferenceListResponse["options"]) => void;
}) {
  const { t } = useLanguage();
  const it = t.imported;
  const [projects, setProjects] = useState<ReferenceProjectCard[]>([]);
  const [total, setTotal] = useState(0);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  const sectionRef = useRef<HTMLElement>(null);
  const key = queryString(filters, page);

  // The search waits for typing to pause before asking the server.
  useEffect(() => {
    let cancelled = false;
    setState("loading");
    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/referensprojekt?${key}`);
        if (!res.ok) throw new Error(String(res.status));
        const data: ReferenceListResponse = await res.json();
        if (cancelled) return;
        setProjects(data.projects);
        setTotal(data.total);
        setState("ready");
        onOptions?.(data.options);
        // A page past the end (an old link, or fewer hits than before)
        // goes to the last page there is.
        const last = totalPagesFor(data.total, REFERENCE_PAGE_SIZE);
        if (page > last) onPageChange(last);
      } catch {
        if (!cancelled) setState("error");
      }
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // onOptions and onPageChange come from the parent; the query string is the input.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const goTo = (next: number) => {
    onPageChange(next);
    sectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };
  const from = (page - 1) * REFERENCE_PAGE_SIZE + 1;
  const to = Math.min(page * REFERENCE_PAGE_SIZE, total);

  return (
    <section ref={sectionRef} className="mt-10 scroll-mt-4" aria-labelledby="imported-projects-title" data-testid="imported-projects">
      <h2 id="imported-projects-title" className="text-lg font-bold text-navy-800">
        {it.importedTitle}
      </h2>
      <p className="mt-1 text-sm text-navy-500">{it.importedIntro}</p>
      {state === "error" && <p className="mt-4 text-sm text-amber-700">⚠ {it.loadError}</p>}
      {state !== "error" && (
        <p className="mt-3 text-xs font-semibold text-navy-500" aria-live="polite">
          {state === "loading" && projects.length === 0 ? it.loading : total > 0 ? it.showingCount(from, to, total) : null}
        </p>
      )}
      {state === "ready" && total === 0 && <p className="mt-4 text-sm text-navy-500">{it.noImported}</p>}

      <div className={`mt-4 grid gap-5 md:grid-cols-2 ${state === "loading" ? "opacity-60" : ""}`}>
        {projects.map((project) => (
          <ImportedProjectCard key={project.id} project={project} />
        ))}
      </div>

      <Pagination page={page} pageSize={REFERENCE_PAGE_SIZE} total={total} onPageChange={goTo} disabled={state === "loading"} />
    </section>
  );
}

export function ImportedProjectCard({ project, children }: { project: ReferenceProjectCard; children?: React.ReactNode }) {
  const { t, lang } = useLanguage();
  const it = t.imported;
  const rp = t.referenceProjects;
  const program = project.programId ? findProgram(project.programId) : undefined;
  const summary = lang === "en" ? (project.summaryEn ?? project.summary) : project.summary;
  const title = lang === "en" && project.titleEn ? project.titleEn : project.title;
  const period = [project.startDate?.slice(0, 7), project.endDate?.slice(0, 7)].filter(Boolean).join(" – ");

  return (
    <article className="flex flex-col rounded-xl border border-navy-100 bg-white p-6" data-testid="imported-project-card">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="text-xs font-semibold uppercase text-navy-400">{program?.shortName ?? project.programme}</p>
        <div className="flex flex-wrap gap-2">
          <span className="badge bg-navy-100 text-navy-700">{it.sourceBadge(sourceLabel(project.source, lang))}</span>
          {project.period === "2014-2020" && !isNationalSource(project.source) && <span className="badge bg-navy-100 text-navy-500">{rp.periodLegacyBadge}</span>}
        </div>
      </div>
      <h3 className="mt-1 font-bold text-navy-900">
        {project.acronym && project.acronym !== title ? `${project.acronym}: ` : ""}
        {title}
      </h3>
      {summary && <p className="mt-2 text-sm text-navy-600">{summary}</p>}
      {children}
      <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-navy-50 pt-4 text-sm">
        <div>
          <dt className="text-xs text-navy-400">{it.fieldCountry}</dt>
          <dd className="font-semibold text-navy-800">{countryName(project.country, lang)}</dd>
        </div>
        <div>
          <dt className="text-xs text-navy-400">{it.fieldPeriod}</dt>
          <dd className="font-semibold text-navy-800">{period || "–"}</dd>
        </div>
        <div>
          <dt className="text-xs text-navy-400">{it.fieldTotal}</dt>
          <dd className="font-semibold text-navy-800">
            <SekAmountText amount={project.totalBudget} fallback={rp.noBudgetDisclosed} />
          </dd>
        </div>
        <div>
          <dt className="text-xs text-navy-400">{isNationalSource(project.source) ? it.fieldNationalGrant : it.fieldEu}</dt>
          <dd className="font-semibold text-navy-800">
            <SekAmountText amount={project.euContribution} fallback={rp.noBudgetDisclosed} />
          </dd>
        </div>
      </dl>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-xs text-navy-500">
        <span>
          {it.fieldPartners}: {project.partnerCount}
        </span>
        {project.url && (
          <a href={project.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-600 hover:text-navy-900">
            {it.openInSource} ↗
          </a>
        )}
      </div>
    </article>
  );
}

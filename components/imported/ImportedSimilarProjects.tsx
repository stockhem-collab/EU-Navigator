"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { countryName, sourceLabel } from "@/lib/imported/labels";
import type { IdeaInput, SimilarResponse } from "@/lib/imported/types";
import type { ProjectInput } from "@/lib/types";
import { ImportedProjectCard } from "./ImportedReferenceList";

/** Similar projects from the imported data, and the organisations behind
 * them as possible partners. The idea is sent to the server (it exists
 * only in this browser), the search runs there. */
export default function ImportedSimilarProjects({ project }: { project: ProjectInput }) {
  const { t, lang } = useLanguage();
  const it = t.imported;
  const { config } = useOrgConfig();
  const [result, setResult] = useState<SimilarResponse | null>(null);
  const [state, setState] = useState<"loading" | "ready" | "error">("loading");
  // A handful of each up front; the rest on request, so the project page
  // doesn't run to many screens of cards.
  const [allSimilar, setAllSimilar] = useState(false);
  const [allPartners, setAllPartners] = useState(false);

  const idea: IdeaInput = {
    title: project.title,
    description: project.description,
    sector: project.sector,
    secondarySectors: project.secondarySectors ?? [],
    tags: project.tags ?? [],
    ownOrganisation: { name: config.organisationName ?? project.municipality ?? null },
  };
  const body = JSON.stringify(idea);

  useEffect(() => {
    let cancelled = false;
    setState("loading");
    fetch("/api/liknande-projekt", { method: "POST", headers: { "Content-Type": "application/json" }, body })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: SimilarResponse) => {
        if (cancelled) return;
        setResult(data);
        setState("ready");
      })
      .catch(() => !cancelled && setState("error"));
    return () => {
      cancelled = true;
    };
  }, [body]);

  return (
    <>
      <section className="mt-8" aria-labelledby="imported-similar-title" data-testid="imported-similar">
        <h2 id="imported-similar-title" className="text-lg font-bold text-navy-800">
          {it.similarTitle}
        </h2>
        <p className="mt-1 text-sm text-navy-500">{it.similarIntro}</p>
        {state === "loading" && <p className="mt-3 text-sm text-navy-500">{it.loading}</p>}
        {state === "error" && <p className="mt-3 text-sm text-amber-700">⚠ {it.loadError}</p>}
        {state === "ready" && result && (
          <>
            <p className="mt-1 text-xs text-navy-400">{it.similarCompared(result.compared)}</p>
            {result.similar.length === 0 ? (
              <p className="mt-3 text-sm text-navy-500">{it.similarNone}</p>
            ) : (
              <div className="mt-4 grid gap-5 md:grid-cols-2">
                {(allSimilar ? result.similar : result.similar.slice(0, SIMILAR_SHOWN)).map(({ project: p, similarityPct, reasons }) => (
                  <ImportedProjectCard key={p.id} project={p}>
                    <div className="mt-3 rounded-md bg-navy-50 px-3 py-2" data-testid="similarity-reasons">
                      <p className="flex items-center justify-between text-xs font-semibold uppercase text-navy-500">
                        {it.similarWhy}
                        <span className="badge bg-navy-100 text-navy-700">{similarityPct}%</span>
                      </p>
                      <ul className="mt-1 space-y-1 text-xs text-navy-700">
                        {reasons.map((r, i) => (
                          <li key={i}>
                            {r.kind === "theme" ? "◆ " : "✓ "}
                            {lang === "sv" ? r.text_sv : r.text_en}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </ImportedProjectCard>
                ))}
              </div>
            )}
            {result.similar.length > SIMILAR_SHOWN && (
              <ShowMoreButton open={allSimilar} onToggle={() => setAllSimilar(!allSimilar)} label={allSimilar ? it.showFewer : it.showAll(result.similar.length)} />
            )}
          </>
        )}
      </section>

      {state === "ready" && result && (
        <section className="mt-8" aria-labelledby="partners-title" data-testid="partner-suggestions">
          <h2 id="partners-title" className="text-lg font-bold text-navy-800">
            {it.partnersTitle}
          </h2>
          <p className="mt-1 text-sm text-navy-500">{it.partnersIntro}</p>
          {result.partners.length === 0 ? (
            <p className="mt-3 text-sm text-navy-500">{it.partnersNone}</p>
          ) : (
            <div className="mt-3 overflow-x-auto rounded-xl border border-navy-100 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-navy-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-navy-400">{it.colOrganisation}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-navy-400">{it.colRole}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-navy-400">{it.colCountry}</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-navy-400">{it.colProjects}</th>
                  </tr>
                </thead>
                <tbody>
                  {(allPartners ? result.partners : result.partners.slice(0, PARTNERS_SHOWN)).map((p) => (
                    <tr key={p.organisationId} className="border-b border-navy-50 last:border-0">
                      <td className="px-3 py-2 align-top font-semibold text-navy-800">
                        {p.name}
                        <p className="text-xs font-normal text-navy-400">
                          {it.partnerIn}: {p.projects.slice(0, 3).map((x) => x.title).join(" · ")}
                          {p.projects.length > 3 ? " …" : ""}
                        </p>
                      </td>
                      <td className="px-3 py-2 align-top">{it.partnerRoles(p.coordinatorCount, p.partnerCount, p.associatedCount)}</td>
                      <td className="px-3 py-2 align-top">{countryName(p.country, lang)}</td>
                      <td className="px-3 py-2 align-top">
                        {it.partnerProjects(p.projectCount)}
                        <p className="text-xs text-navy-400">
                          {[...new Set(p.projects.map((x) => sourceLabel(x.source, lang)))].join(", ")}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {result.partners.length > PARTNERS_SHOWN && (
            <ShowMoreButton open={allPartners} onToggle={() => setAllPartners(!allPartners)} label={allPartners ? it.showFewer : it.showAll(result.partners.length)} />
          )}
        </section>
      )}
    </>
  );
}

const SIMILAR_SHOWN = 4;
const PARTNERS_SHOWN = 8;

function ShowMoreButton({ open, onToggle, label }: { open: boolean; onToggle: () => void; label: string }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      className="mt-3 w-full rounded-xl border border-dashed border-navy-200 bg-white py-2.5 text-sm font-semibold text-navy-600 transition hover:bg-navy-50"
    >
      {label}
    </button>
  );
}

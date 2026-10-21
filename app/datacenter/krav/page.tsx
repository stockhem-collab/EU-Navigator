"use client";

import { useState } from "react";
import Header from "@/components/Header";
import PageHeader from "@/components/PageHeader";
import Footer from "@/components/Footer";
import DatacenterTabs from "@/components/DatacenterTabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useCallTemplates } from "@/lib/hooks/useCallTemplates";
import { useCallRequirements } from "@/lib/hooks/useCallRequirements";
import { findProgram } from "@/lib/data/fundingPrograms";
import { GROUP_ORDER, ResolvedRequirement, resolveRequirements } from "@/lib/data/applicationRequirements";
import { reportRequirementsKey, resolveReportRequirements } from "@/lib/data/reportRequirements";
import { extractRequirements, requirementFromSuggestion, RequirementSuggestion } from "@/lib/matching/requirementExtraction";
import { FundingCall, Grant, RequirementChanges, RequirementKind } from "@/lib/types";

const input = "w-full rounded-md border border-navy-200 px-2 py-1.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";
const fieldLabel = "flex flex-col gap-1 text-xs font-semibold text-navy-600";
const KINDS: RequirementKind[] = ["annex", "certificate", "declaration", "budget", "eligibility", "form", "submission"];

interface Draft extends Pick<RequirementSuggestion, "title" | "kind" | "why" | "mandatory"> {
  condition: string;
  include: boolean;
}

const emptyDraft = (): Draft => ({ title: "", kind: "annex", why: "", mandatory: true, condition: "", include: true });

// Datacenter › Krav: what each call asks for before an application is
// complete — how many calls have their own requirements on file, the list
// per call with where each requirement comes from, and adding the call's
// own (by hand, or suggested from pasted call text and reviewed) or
// marking one of the form's or programme's as not applying. The same for
// what the call's reports require, under "Rapportering".
export default function RequirementsPage() {
  const { t, lang } = useLanguage();
  const rq = t.req;
  const dc = rq.datacenter;
  const sv = lang === "sv";
  const { all: calls } = useFundingCalls();
  const templates = useCallTemplates();
  const callRequirements = useCallRequirements();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pasted, setPasted] = useState("");
  const [suggestions, setSuggestions] = useState<Draft[] | null>(null);
  const [sourceDocument, setSourceDocument] = useState("");
  const [sourceUrl, setSourceUrl] = useState("");
  const [manual, setManual] = useState<Draft>(emptyDraft());
  const [status, setStatus] = useState<string | null>(null);
  const [scope, setScope] = useState<"application" | "report">("application");
  const rp = rq.report;
  const reporting = scope === "report";
  // The application's changes are stored under the call's id, the
  // reports' under their own key.
  const storeKey = (c: FundingCall) => (reporting ? reportRequirementsKey(c.id) : c.id);
  const csvChanges = (c: FundingCall): RequirementChanges | undefined => (reporting ? c.reportRequirementChanges : c.requirementChanges);
  const formFor = (c: FundingCall) => (reporting ? templates.reportTemplateFor(c) : templates.applicationTemplateFor(c));
  const resolve = (c: FundingCall, changes: RequirementChanges | undefined, datacenter: RequirementChanges | undefined): ResolvedRequirement[] => {
    const call = reporting ? { ...c, reportRequirementChanges: changes } : { ...c, requirementChanges: changes };
    const program = findProgram(c.programId);
    if (!reporting) return resolveRequirements({ call, program, template: formFor(c), datacenter });
    // Every report of a grant from the call, before there is one.
    const grant: Grant = { id: "", title_sv: "", title_en: "", callId: c.id, awardedAmountSEK: 0, commitments: [], reportingEvents: [] };
    return resolveReportRequirements({ grant, call, program, template: formFor(c), datacenter });
  };

  const callTitle = (c: FundingCall) => (sv ? c.title_sv : c.title_en);
  const resolvedFor = (c: FundingCall) => resolve(c, csvChanges(c), callRequirements.all[storeKey(c)]);
  const hasOwn = (c: FundingCall) => (csvChanges(c)?.add?.length ?? 0) > 0 || (callRequirements.all[storeKey(c)]?.add?.length ?? 0) > 0;
  const selected = calls.find((c) => c.id === selectedId);

  const pick = (id: string) => {
    setSelectedId(id);
    setSuggestions(null);
    setPasted("");
    setStatus(null);
    setSourceUrl(calls.find((c) => c.id === id)?.link ?? "");
  };

  const save = (drafts: Draft[]) => {
    if (!selected) return;
    const existing = resolvedFor(selected).map((r) => r.requirement.id);
    const today = new Date().toISOString().slice(0, 10);
    const reqs = drafts
      .filter((d) => d.include && d.title.trim())
      .map((d) => {
        const r = requirementFromSuggestion(
          { title: d.title.trim(), kind: d.kind, why: d.why.trim(), mandatory: d.mandatory, condition: d.condition.trim() || undefined },
          { document: sourceDocument.trim() || dc.sourceDocumentDefault, url: sourceUrl.trim() || undefined },
          today,
          existing
        );
        existing.push(r.id);
        return r;
      });
    if (reqs.length === 0) return;
    callRequirements.add(storeKey(selected), reqs);
    setStatus(dc.saved(reqs.length));
  };

  const covered = calls.filter(hasOwn).length;

  return (
    <>
      <Header />
      <main className="page">
        <DatacenterTabs />
        <PageHeader title={dc.title} subtitle={dc.intro} />

        <div className="mt-6 inline-flex rounded-lg border border-navy-200 bg-white p-0.5 text-sm" role="tablist">
          {(["application", "report"] as const).map((sc) => (
            <button
              key={sc}
              type="button"
              role="tab"
              aria-selected={scope === sc}
              onClick={() => {
                setScope(sc);
                setSuggestions(null);
                setStatus(null);
              }}
              className={`rounded-md px-3 py-1.5 font-semibold ${scope === sc ? "bg-navy-800 text-white" : "text-navy-600 hover:text-navy-900"}`}
              data-testid={`requirements-scope-${sc}`}
            >
              {sc === "application" ? rp.datacenterApplication : rp.datacenterReport}
            </button>
          ))}
        </div>

        <section className="mt-4 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm">
          <p className="text-sm font-semibold text-navy-700" data-testid="requirements-coverage">
            {dc.coverage(covered, calls.length)}
          </p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm" data-testid="requirements-calls">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-navy-400">{dc.columnCall}</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-navy-400">{dc.columnForm}</th>
                  <th className="px-2 py-2 text-right text-xs font-semibold uppercase text-navy-400">{dc.columnCount}</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-navy-400">{dc.columnOwn}</th>
                  <th className="px-2 py-2" />
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => {
                  const form = formFor(c);
                  return (
                    <tr key={c.id} className={`border-b border-navy-50 ${c.id === selectedId ? "bg-navy-50/60" : ""}`} data-testid={`requirements-row-${c.id}`}>
                      <td className="px-2 py-2 text-navy-800">{callTitle(c)}</td>
                      <td className="px-2 py-2 text-navy-600">{form && !form.id.startsWith("call:") ? (sv ? form.title_sv : form.title_en) : dc.noForm}</td>
                      <td className="px-2 py-2 text-right font-semibold text-navy-800">{resolvedFor(c).length}</td>
                      <td className="px-2 py-2">{hasOwn(c) ? "✓" : "–"}</td>
                      <td className="px-2 py-2 text-right">
                        <button type="button" onClick={() => pick(c.id)} className="text-xs font-semibold text-navy-600 underline hover:text-navy-900" aria-label={`${dc.pick}: ${callTitle(c)}`}>
                          {dc.pick}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        {selected && (
          <section className="mt-6 rounded-2xl border border-navy-100 bg-white p-5 shadow-sm" data-testid="requirements-detail">
            <h2 className="text-lg font-semibold text-navy-900">{dc.listTitle(callTitle(selected))}</h2>
            {GROUP_ORDER.map((group) => {
              const all = resolve(
                selected,
                { ...csvChanges(selected), remove: [] },
                { ...callRequirements.all[storeKey(selected)], remove: [] }
              ).filter((r) => GROUP_ORDER.indexOf(group) === GROUP_ORDER.indexOf(groupOfKind(r.requirement.kind)));
              if (all.length === 0) return null;
              const removed = new Set([...(csvChanges(selected)?.remove ?? []), ...(callRequirements.all[storeKey(selected)]?.remove ?? [])]);
              return (
                <div key={group} className="mt-4">
                  <h3 className="text-sm font-bold text-navy-800">{(reporting ? rp.groups : rq.groups)[group]}</h3>
                  <ul className="mt-1 divide-y divide-navy-50 rounded-lg border border-navy-100">
                    {all.map(({ requirement: r, origin }) => {
                      const isRemoved = removed.has(r.id);
                      const removedInCsv = csvChanges(selected)?.remove?.includes(r.id);
                      return (
                        <li key={r.id} className="flex flex-wrap items-start justify-between gap-2 px-3 py-2 text-sm" data-testid={`dc-requirement-${r.id}`}>
                          <div className="min-w-0 flex-1">
                            <p className={`font-semibold ${isRemoved ? "text-navy-400 line-through" : "text-navy-800"}`}>{sv ? r.title_sv : r.title_en}</p>
                            <p className="text-xs text-navy-500">
                              {rq.origins[origin]} · {rq.source(r.source.document, r.source.checkedAt)}
                              {!r.mandatory && ` · ${rq.recommended}`}
                              {isRemoved && ` · ${dc.excluded}`}
                              {r.reports?.length === 1 && ` · ${r.reports[0] === "final" ? rp.appliesFinal : rp.appliesInterim}`}
                            </p>
                          </div>
                          {origin === "datacenter" ? (
                            <button type="button" onClick={() => callRequirements.removeAdded(storeKey(selected), r.id)} className="text-xs font-semibold text-navy-400 hover:text-amber-700">
                              {dc.removeAdded}
                            </button>
                          ) : (
                            origin !== "derived" &&
                            !removedInCsv && (
                              <button
                                type="button"
                                onClick={() => callRequirements.setExcluded(storeKey(selected), r.id, !isRemoved)}
                                className="text-xs font-semibold text-navy-500 hover:text-navy-800"
                              >
                                {isRemoved ? dc.restore : dc.exclude}
                              </button>
                            )
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}

            <div className="mt-6 border-t border-navy-100 pt-4">
              <h3 className="font-semibold text-navy-900">{dc.pasteTitle}</h3>
              <p className="mt-1 text-sm text-navy-600">{dc.pasteHint}</p>
              <textarea
                className={`${input} mt-2`}
                rows={6}
                value={pasted}
                placeholder={dc.pastePlaceholder}
                onChange={(e) => setPasted(e.target.value)}
                data-testid="requirements-paste"
              />
              <div className="mt-2 grid gap-2 sm:grid-cols-2">
                <label className={fieldLabel}>
                  {dc.sourceDocument}
                  <input className={input} value={sourceDocument} placeholder={dc.sourceDocumentDefault} onChange={(e) => setSourceDocument(e.target.value)} />
                </label>
                <label className={fieldLabel}>
                  {dc.sourceUrl}
                  <input className={input} value={sourceUrl} onChange={(e) => setSourceUrl(e.target.value)} />
                </label>
              </div>
              <button
                type="button"
                className="btn-secondary mt-2 text-sm"
                disabled={!pasted.trim()}
                onClick={() =>
                  setSuggestions(extractRequirements(pasted).map((s) => ({ title: s.title, kind: s.kind, why: s.why, mandatory: s.mandatory, condition: s.condition ?? "", include: true })))
                }
                data-testid="requirements-suggest"
              >
                {dc.suggest}
              </button>
              {suggestions && suggestions.length === 0 && <p className="mt-2 text-sm text-amber-700">{dc.noSuggestions}</p>}
              {suggestions && suggestions.length > 0 && (
                <div className="mt-3" data-testid="requirements-suggestions">
                  <p className="text-sm font-semibold text-navy-700">{dc.suggestionsTitle(suggestions.length)}</p>
                  <ul className="mt-2 space-y-3">
                    {suggestions.map((s, i) => (
                      <li key={i} className="rounded-lg border border-navy-100 p-3">
                        <DraftFields
                          draft={s}
                          onChange={(d) => setSuggestions(suggestions.map((x, j) => (j === i ? d : x)))}
                          showInclude
                        />
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    className="mt-3 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700"
                    onClick={() => {
                      save(suggestions);
                      setSuggestions(null);
                      setPasted("");
                    }}
                    data-testid="requirements-save-suggestions"
                  >
                    {dc.save(suggestions.filter((s) => s.include && s.title.trim()).length)}
                  </button>
                </div>
              )}
            </div>

            <div className="mt-6 border-t border-navy-100 pt-4">
              <h3 className="font-semibold text-navy-900">{dc.addTitle}</h3>
              <div className="mt-2 rounded-lg border border-navy-100 p-3">
                <DraftFields draft={manual} onChange={setManual} />
                <button
                  type="button"
                  className="btn-secondary mt-3 text-sm"
                  disabled={!manual.title.trim()}
                  onClick={() => {
                    save([manual]);
                    setManual(emptyDraft());
                  }}
                  data-testid="requirements-add"
                >
                  {rq.addOwnButton}
                </button>
              </div>
            </div>
            {status && (
              <p className="mt-3 text-sm text-green-700" role="status" data-testid="requirements-status">
                {status}
              </p>
            )}
          </section>
        )}
      </main>
      <Footer />
    </>
  );

  function DraftFields({ draft, onChange, showInclude = false }: { draft: Draft; onChange: (d: Draft) => void; showInclude?: boolean }) {
    return (
      <div className="grid gap-2 sm:grid-cols-[1fr_10rem]">
        <label className={fieldLabel}>
          {rq.addOwnTitleLabel}
          <input className={input} value={draft.title} onChange={(e) => onChange({ ...draft, title: e.target.value })} />
        </label>
        <label className={fieldLabel}>
          {rq.addOwnKindLabel}
          <select className={input} value={draft.kind} onChange={(e) => onChange({ ...draft, kind: e.target.value as RequirementKind })}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {rq.kinds[k]}
              </option>
            ))}
          </select>
        </label>
        <label className={`${fieldLabel} sm:col-span-2`}>
          {dc.whyLabel}
          <textarea className={input} rows={2} value={draft.why} onChange={(e) => onChange({ ...draft, why: e.target.value })} />
        </label>
        <label className={fieldLabel}>
          {dc.conditionLabel}
          <input className={input} value={draft.condition} onChange={(e) => onChange({ ...draft, condition: e.target.value })} />
        </label>
        <div className="flex items-end gap-4 pb-1 text-xs text-navy-600">
          <label className="flex items-center gap-1.5">
            <input type="checkbox" checked={draft.mandatory} onChange={(e) => onChange({ ...draft, mandatory: e.target.checked })} />
            {rq.addOwnMandatory}
          </label>
          {showInclude && (
            <label className="flex items-center gap-1.5">
              <input type="checkbox" checked={draft.include} onChange={(e) => onChange({ ...draft, include: e.target.checked })} />
              {dc.include}
            </label>
          )}
        </div>
      </div>
    );
  }
}

function groupOfKind(kind: RequirementKind) {
  return kind === "annex" || kind === "certificate" || kind === "declaration" ? "annexes" : kind;
}

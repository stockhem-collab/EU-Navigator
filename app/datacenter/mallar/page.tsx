"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import DatacenterTabs from "@/components/DatacenterTabs";
import ConfirmButton from "@/components/ConfirmButton";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useCallTemplates, customTemplateFileKey } from "@/lib/hooks/useCallTemplates";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useAttachments } from "@/lib/hooks/useAttachments";
import { outlineFromDocx, TemplateProposal, templateFromProposal, ProposalSection } from "@/lib/export/templateOutline";
import { CallTemplate, FundingCall, Lang } from "@/lib/types";

interface Proposal extends TemplateProposal {
  fileName: string;
  file: File;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

const input = "w-full rounded-md border border-navy-200 px-2 py-1.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";
const fieldLabel = "flex flex-col gap-1 text-xs font-semibold text-navy-600";

// Datacenter › Mallar: the funders' forms in the system, adding one from
// the funder's Word template (read as a proposal, reviewed, saved) and
// choosing per call the form its application and reports follow.
export default function TemplatesPage() {
  const { t, lang } = useLanguage();
  const tl = t.tpl.library;
  const templates = useCallTemplates();
  const { all: calls } = useFundingCalls();
  const { addAttachment } = useAttachments();
  const [proposal, setProposal] = useState<Proposal | null>(null);
  const [status, setStatus] = useState<{ ok: boolean; text: string } | null>(null);
  const [reading, setReading] = useState(false);

  const read = async (file: File) => {
    setStatus(null);
    setReading(true);
    try {
      const outline = await outlineFromDocx(await file.arrayBuffer());
      if (outline.sections.length === 0) {
        setStatus({ ok: false, text: tl.noSections });
        return;
      }
      setProposal({
        fileName: file.name,
        file,
        title: outline.title ?? file.name.replace(/\.docx$/i, ""),
        kind: /report|rapport/i.test(file.name) ? "report" : "application",
        language: outline.language,
        version: "",
        pageLimit: outline.pageLimit ? String(outline.pageLimit) : "",
        sourceUrl: "",
        sections: outline.sections.map((s) => ({ ...s, include: true, includeTables: s.tables.map(() => true) })),
      });
    } catch {
      setStatus({ ok: false, text: tl.readFailed });
    } finally {
      setReading(false);
    }
  };

  const patchSection = (key: string, patch: Partial<ProposalSection>) =>
    setProposal((p) => p && { ...p, sections: p.sections.map((s) => (s.key === key ? { ...s, ...patch } : s)) });

  const save = async () => {
    if (!proposal || !proposal.title.trim()) return;
    const id = `custom-${slug(proposal.title) || "mall"}-${Date.now().toString(36)}`;
    templates.saveTemplate(templateFromProposal(proposal, id));
    const stored = await addAttachment(customTemplateFileKey(id), proposal.file);
    setStatus({ ok: stored !== "too-large", text: stored === "too-large" ? tl.fileTooLarge : tl.saved(proposal.title.trim()) });
    setProposal(null);
  };

  const applicationForms = templates.all.filter((f) => f.kind !== "report");
  const reportForms = templates.all.filter((f) => f.kind === "report");
  const title = (f: CallTemplate) => (lang === "sv" ? f.title_sv : f.title_en);
  const callTitle = (c: FundingCall) => (lang === "sv" ? c.title_sv : c.title_en);
  const standardTitle = (id: string | undefined) => {
    const f = id ? templates.all.find((x) => x.id === id) : undefined;
    return f ? `${tl.standardForm} (${title(f)})` : `${tl.standardForm} (${tl.noForm.toLowerCase()})`;
  };

  return (
    <>
      <Header />
      <main className="page">
        <DatacenterTabs />
        <h1 className="text-2xl font-bold text-navy-900">{tl.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-navy-600">{tl.intro}</p>

        <section className="card mt-6" aria-labelledby="upload-title">
          <h2 id="upload-title" className="text-lg font-semibold text-navy-900">
            {tl.uploadTitle}
          </h2>
          <p className="mt-1 text-sm text-navy-600">{tl.uploadHint}</p>
          <label className="mt-3 inline-flex cursor-pointer items-center gap-2 rounded-md border border-navy-200 px-3 py-1.5 text-sm font-semibold text-navy-700 hover:bg-navy-50">
            {tl.uploadButton}
            <input
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="sr-only"
              data-testid="template-upload"
              onChange={(e) => {
                const file = e.target.files?.[0];
                e.target.value = "";
                if (file) read(file);
              }}
            />
          </label>
          {reading && <p className="mt-2 text-sm text-navy-500">{tl.reading}</p>}
          {status && (
            <p className={`mt-2 text-sm ${status.ok ? "text-green-700" : "text-amber-700"}`} data-testid="template-status" role="status">
              {status.text}
            </p>
          )}

          {proposal && (
            <div className="mt-5 border-t border-navy-100 pt-4" data-testid="template-proposal">
              <h3 className="font-semibold text-navy-900">{tl.proposalTitle(proposal.fileName)}</h3>
              <p className="mt-1 text-sm text-navy-600">{tl.proposalHint}</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <label className={fieldLabel}>
                  {tl.fieldTitle}
                  <input className={input} value={proposal.title} onChange={(e) => setProposal({ ...proposal, title: e.target.value })} data-testid="template-title" />
                </label>
                <label className={fieldLabel}>
                  {tl.fieldKind}
                  <select
                    className={input}
                    value={proposal.kind}
                    onChange={(e) => setProposal({ ...proposal, kind: e.target.value as Proposal["kind"] })}
                    data-testid="template-kind"
                  >
                    <option value="application">{tl.kindApplication}</option>
                    <option value="report">{tl.kindReport}</option>
                  </select>
                </label>
                <label className={fieldLabel}>
                  {tl.fieldLanguage}
                  <select className={input} value={proposal.language} onChange={(e) => setProposal({ ...proposal, language: e.target.value as Lang })}>
                    <option value="sv">Svenska</option>
                    <option value="en">English</option>
                  </select>
                </label>
                <label className={fieldLabel}>
                  {tl.fieldVersion}
                  <input className={input} value={proposal.version} onChange={(e) => setProposal({ ...proposal, version: e.target.value })} />
                </label>
                <label className={fieldLabel}>
                  {tl.fieldPageLimit}
                  <input
                    className={input}
                    type="number"
                    min={0}
                    value={proposal.pageLimit}
                    onChange={(e) => setProposal({ ...proposal, pageLimit: e.target.value })}
                    data-testid="template-page-limit"
                  />
                </label>
                <label className={fieldLabel}>
                  {tl.fieldSource}
                  <input className={input} type="url" value={proposal.sourceUrl} onChange={(e) => setProposal({ ...proposal, sourceUrl: e.target.value })} />
                </label>
              </div>

              <ol className="mt-4 space-y-3">
                {proposal.sections.map((s) => (
                  <li
                    key={s.key}
                    className={`rounded-md border p-3 ${s.include ? "border-navy-200" : "border-navy-100 opacity-60"}`}
                    data-testid="template-section"
                  >
                    <div className="flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs font-semibold text-navy-600">
                        <input type="checkbox" checked={s.include} onChange={(e) => patchSection(s.key, { include: e.target.checked })} />
                        {tl.include}
                      </label>
                      {s.group && <span className="text-xs text-navy-400">{tl.sectionGroup(`${s.group.number} ${s.group.label}`.trim())}</span>}
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-[5rem_1fr_5rem]">
                      <label className={fieldLabel}>
                        {tl.sectionNumber}
                        <input className={input} value={s.number ?? ""} onChange={(e) => patchSection(s.key, { number: e.target.value || undefined })} />
                      </label>
                      <label className={fieldLabel}>
                        {tl.sectionLabel}
                        <input className={input} value={s.label} onChange={(e) => patchSection(s.key, { label: e.target.value })} data-testid="template-section-label" />
                      </label>
                      <label className={fieldLabel}>
                        {tl.sectionPages}
                        <input
                          className={input}
                          type="number"
                          min={0}
                          step={0.5}
                          value={s.indicativePages ?? ""}
                          onChange={(e) => patchSection(s.key, { indicativePages: Number(e.target.value) || undefined })}
                        />
                      </label>
                    </div>
                    <label className={`${fieldLabel} mt-2`}>
                      {tl.sectionInstructions}
                      <textarea
                        className={`${input} font-normal`}
                        rows={3}
                        value={s.instructions}
                        onChange={(e) => patchSection(s.key, { instructions: e.target.value })}
                      />
                    </label>
                    <div className="mt-2 flex flex-wrap items-center gap-4">
                      <label className="flex items-center gap-1.5 text-xs text-navy-600">
                        <input type="checkbox" checked={s.optional} onChange={(e) => patchSection(s.key, { optional: e.target.checked })} />
                        {tl.sectionOptional}
                      </label>
                    </div>
                    {s.tables.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-semibold text-navy-600">{tl.tablesLabel}</p>
                        <ul className="mt-1 space-y-1">
                          {s.tables.map((tb, i) => (
                            <li key={tb.title} className="flex items-start gap-1.5 text-xs text-navy-600">
                              <input
                                type="checkbox"
                                checked={s.includeTables[i]}
                                aria-label={tb.title}
                                onChange={(e) =>
                                  patchSection(s.key, { includeTables: s.includeTables.map((v, j) => (j === i ? e.target.checked : v)) })
                                }
                              />
                              <span>
                                <span className="font-semibold">{tb.title}</span>
                                <span className="text-navy-400"> · {tb.columns.join(" | ")}</span>
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </li>
                ))}
              </ol>
              <div className="mt-4 flex gap-2">
                <button type="button" className="btn-primary" onClick={save} disabled={!proposal.title.trim()} data-testid="template-save">
                  {tl.save}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setProposal(null)}>
                  {tl.cancel}
                </button>
              </div>
            </div>
          )}
        </section>

        <section className="card mt-6" aria-labelledby="list-title">
          <h2 id="list-title" className="text-lg font-semibold text-navy-900">
            {tl.listTitle}
          </h2>
          <ul className="mt-3 divide-y divide-navy-100" data-testid="template-list">
            {templates.all.map((f) => (
              <li key={f.id} className="flex flex-wrap items-center gap-3 py-2 text-sm">
                <span className="min-w-0 flex-1">
                  <span className="font-semibold text-navy-800">{title(f)}</span>
                  <span className="block text-xs text-navy-500">
                    {f.kind === "report" ? tl.kindReport : tl.kindApplication} · {f.version} · {tl.sectionsCount(f.sections.length)}
                    {f.pageLimit ? ` · ${f.pageLimit} ${lang === "sv" ? "sidor" : "pages"}` : ""}
                  </span>
                </span>
                <span className={`badge ${f.custom ? "bg-gold-100 text-navy-800" : "bg-navy-50 text-navy-600"}`}>{f.custom ? tl.added : tl.builtIn}</span>
                {f.custom && (
                  <ConfirmButton
                    label={tl.remove}
                    message={tl.removeConfirm}
                    confirmLabel={tl.remove}
                    cancelLabel={tl.cancel}
                    danger
                    onConfirm={() => templates.removeTemplate(f.id)}
                    className="text-xs font-semibold text-amber-700 hover:text-amber-900"
                  />
                )}
              </li>
            ))}
          </ul>
        </section>

        <section className="card mt-6" aria-labelledby="assign-title">
          <h2 id="assign-title" className="text-lg font-semibold text-navy-900">
            {tl.assignTitle}
          </h2>
          <p className="mt-1 text-sm text-navy-600">{tl.assignHint}</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm" data-testid="template-assignments">
              <thead>
                <tr className="border-b border-navy-100">
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-navy-400">{tl.columnCall}</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-navy-400">{tl.columnApplication}</th>
                  <th className="px-2 py-2 text-left text-xs font-semibold uppercase text-navy-400">{tl.columnReport}</th>
                </tr>
              </thead>
              <tbody>
                {calls.map((c) => {
                  const a = templates.assignments[c.id] ?? {};
                  return (
                    <tr key={c.id} className="border-b border-navy-50 align-top" data-testid={`assign-${c.id}`}>
                      <td className="px-2 py-2 text-navy-800">{callTitle(c)}</td>
                      <td className="px-2 py-2">
                        <select
                          className={input}
                          aria-label={`${tl.columnApplication}: ${callTitle(c)}`}
                          value={a.application ?? ""}
                          onChange={(e) => templates.assign(c.id, "application", e.target.value)}
                        >
                          <option value="">{standardTitle(c.applicationTemplateId)}</option>
                          {applicationForms.map((f) => (
                            <option key={f.id} value={f.id}>
                              {title(f)}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          className={input}
                          aria-label={`${tl.columnReport}: ${callTitle(c)}`}
                          value={a.report ?? ""}
                          onChange={(e) => templates.assign(c.id, "report", e.target.value)}
                        >
                          <option value="">{standardTitle(c.reportTemplateId)}</option>
                          {reportForms.map((f) => (
                            <option key={f.id} value={f.id}>
                              {title(f)}
                            </option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

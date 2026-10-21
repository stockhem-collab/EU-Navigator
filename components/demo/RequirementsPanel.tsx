"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ConfirmButton from "@/components/ConfirmButton";
import { downloadAttachment } from "@/lib/hooks/useAttachments";
import { fmtFileSize, fmtSEK } from "@/lib/format";
import {
  CompletenessSummary,
  EvaluatedRequirement,
  GROUP_ORDER,
  PORTAL_PROGRAMMES,
} from "@/lib/data/applicationRequirements";
import type {
  ApplicationRequirement,
  Attachment,
  CallTemplate,
  FundingCall,
  FundingProgram,
  RequirementKind,
  RequirementState,
  RequirementStatus,
} from "@/lib/types";

interface Props {
  call: FundingCall;
  program: FundingProgram;
  /** The funder's form the application follows, if any. */
  template?: CallTemplate;
  /** The call's page limit (its own, else the form's). */
  pageLimit?: number;
  items: EvaluatedRequirement[];
  summary: CompletenessSummary;
  /** The user's own states (only the ones they set). */
  states: Record<string, RequirementState>;
  onSetState: (id: string, state: Omit<RequirementState, "updatedAt"> | null) => void;
  onAddOwn: (requirement: ApplicationRequirement) => void;
  onRemoveOwn: (id: string) => void;
  /** Files per requirement; undefined = the application isn't saved, so
   * files can't be kept. */
  files?: {
    list: (id: string) => Attachment[];
    add: (id: string, file: File) => Promise<"too-large" | null>;
    remove: (id: string, attachmentId: string) => void;
  };
  /** Opens the application at a section (by key) or its first section. */
  onOpenSection: (key?: string) => void;
  onOpenBudget: () => void;
  onStartWriting: () => void;
  showFirst: boolean;
  onShowFirstChange: (value: boolean) => void;
}

const STATUSES: RequirementStatus[] = ["todo", "in-progress", "done", "not-applicable"];
const OWN_KINDS: RequirementKind[] = ["annex", "certificate", "declaration", "budget", "eligibility", "form", "submission"];
const FILE_KINDS: RequirementKind[] = ["annex", "certificate", "declaration", "budget"];

const STATUS_STYLE: Record<RequirementStatus, string> = {
  todo: "border-navy-200 bg-white text-navy-700",
  "in-progress": "border-gold-300 bg-gold-50 text-gold-800",
  done: "border-green-300 bg-green-50 text-green-800",
  "not-applicable": "border-navy-100 bg-navy-50 text-navy-500",
};

const input = "rounded-md border border-navy-200 px-2 py-1.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";

// The Krav tab: what the call asks for before the application is complete
// — a summary of the call's terms, then every requirement by group with a
// status, why it is asked for and where, who usually provides it, and a
// way to it (the section, the budget, the funder's template, an upload).
export default function RequirementsPanel({
  call,
  program,
  template,
  pageLimit,
  items,
  summary,
  states,
  onSetState,
  onAddOwn,
  onRemoveOwn,
  files,
  onOpenSection,
  onOpenBudget,
  onStartWriting,
  showFirst,
  onShowFirstChange,
}: Props) {
  const { t, lang } = useLanguage();
  const rq = t.req;
  const sv = lang === "sv";
  const locale = sv ? "sv-SE" : "en-GB";
  const [openWhy, setOpenWhy] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<{ id: string; text: string } | null>(null);
  const [ownTitle, setOwnTitle] = useState("");
  const [ownKind, setOwnKind] = useState<RequirementKind>("annex");
  const [ownMandatory, setOwnMandatory] = useState(true);

  const deadline = call.deadlineDate;
  const daysLeft = deadline ? Math.floor((new Date(`${deadline}T23:59:59`).getTime() - Date.now()) / 86_400_000) : undefined;
  const rate = call.coFinancingRate ?? program.typicalCoFinancingRate;
  const submittedIn = template?.submittedIn ?? (PORTAL_PROGRAMMES.includes(call.programId) ? "Funding & Tenders Portal" : undefined);
  const pct = summary.score;

  const addOwn = () => {
    const title = ownTitle.trim();
    if (!title) return;
    onAddOwn({
      id: `own-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
      kind: ownKind,
      title_sv: title,
      title_en: title,
      why_sv: "",
      why_en: "",
      mandatory: ownMandatory,
      source: { document: sv ? "Eget krav" : "Own requirement", checkedAt: new Date().toISOString().slice(0, 10) },
    });
    setOwnTitle("");
  };

  return (
    <div data-testid="requirements-panel">
      <section className="rounded-xl border border-navy-100 bg-white p-5">
        <h2 className="text-lg font-bold text-navy-800">{rq.title}</h2>
        <p className="mt-1 text-sm text-navy-500">{rq.intro}</p>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3" data-testid="requirements-summary">
          {deadline && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryDeadline}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">
                {new Date(`${deadline}T12:00:00`).toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" })}
                {call.closes?.preliminary && " (prel.)"}
                {daysLeft !== undefined && (
                  <span className={`ml-1 text-xs font-normal ${daysLeft < 0 ? "text-navy-400" : daysLeft <= 30 ? "text-amber-700" : "text-navy-500"}`}>
                    · {daysLeft < 0 ? rq.closed : rq.daysLeft(daysLeft)}
                  </span>
                )}
              </dd>
            </div>
          )}
          {submittedIn && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summarySubmittedIn}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">{submittedIn}</dd>
            </div>
          )}
          <div>
            <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryForm}</dt>
            <dd className="mt-0.5 font-semibold text-navy-800">{template ? (sv ? template.title_sv : template.title_en) : rq.summaryNoForm}</dd>
          </div>
          {pageLimit !== undefined && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryPageLimit}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">{rq.summaryPageLimitValue(pageLimit)}</dd>
            </div>
          )}
          {rate !== undefined && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryGrantRate}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">
                {Math.round(rate * 100)} %{rate < 1 && <span className="font-normal text-navy-500"> · {rq.summaryOwnShare(Math.round((1 - rate) * 100))}</span>}
              </dd>
            </div>
          )}
          {call.requiresPartnership && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{rq.summaryPartnership}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">{rq.summaryPartnershipValue(call.minPartnerCountries ?? 2)}</dd>
            </div>
          )}
          {call.maxGrantSEK > 0 && call.grantRangeStated !== false && (
            <div>
              <dt className="text-xs font-semibold uppercase text-navy-400">{t.demo.workspace.requestedGrant}</dt>
              <dd className="mt-0.5 font-semibold text-navy-800">≤ {fmtSEK(call.maxGrantSEK, lang)}</dd>
            </div>
          )}
        </dl>

        <div className="mt-5 border-t border-navy-50 pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <p className="text-sm font-semibold text-navy-700" data-testid="requirements-progress">
              {summary.counted > 0 && summary.done === summary.counted ? rq.allDone : rq.progress(summary.done, summary.counted)}
            </p>
            <p className="text-sm text-navy-500">
              {rq.completenessLabel}: <span className="font-bold text-navy-800">{pct} %</span>
            </p>
          </div>
          <div className="mt-2 h-2 rounded-full bg-navy-100">
            <div className={`h-2 rounded-full transition-all ${pct >= 100 ? "bg-green-600" : "bg-gold-500"}`} style={{ width: `${pct}%` }} />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <label className="flex items-center gap-2 text-xs text-navy-500">
              <input type="checkbox" checked={showFirst} onChange={(e) => onShowFirstChange(e.target.checked)} />
              {rq.showFirstLabel}
            </label>
            <button type="button" onClick={onStartWriting} className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white hover:bg-navy-700">
              {rq.startWriting}
            </button>
          </div>
        </div>
      </section>

      {GROUP_ORDER.map((group) => {
        const inGroup = items.filter((i) => i.group === group);
        if (inGroup.length === 0) return null;
        const counted = inGroup.filter((i) => i.counted);
        return (
          <section key={group} className="mt-6" aria-labelledby={`req-group-${group}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id={`req-group-${group}`} className="font-bold text-navy-800">
                {rq.groups[group]}
              </h3>
              {counted.length > 0 && (
                <span className="text-xs font-semibold text-navy-500">{rq.completenessGroup(counted.filter((i) => i.status === "done").length, counted.length)}</span>
              )}
            </div>
            <ul className="mt-2 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white" data-testid={`requirements-group-${group}`}>
              {inGroup.map((item) => {
                const req = item.requirement;
                const own = states[req.id];
                const list = files?.list(req.id) ?? [];
                const canAuto = !!req.check || !!req.exemptPublicBodies || list.length > 0;
                const value = own ? own.status : canAuto ? "auto" : "todo";
                const title = sv ? req.title_sv : req.title_en;
                const why = sv ? req.why_sv : req.why_en;
                const condition = sv ? req.condition_sv : req.condition_en;
                const detail = sv ? item.detail_sv : item.detail_en;
                const whyOpen = openWhy.includes(req.id);
                const check = req.check;
                return (
                  <li key={req.id} className="px-4 py-3" data-testid={`requirement-${req.id}`} data-status={item.status}>
                    <div className="flex flex-wrap items-start gap-3">
                      <select
                        aria-label={rq.statusLabel(title)}
                        value={value}
                        data-testid={`requirement-status-${req.id}`}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === "auto") onSetState(req.id, null);
                          else onSetState(req.id, { status: v as RequirementStatus, note: own?.note });
                        }}
                        className={`shrink-0 rounded-md border px-2 py-1 text-xs font-semibold ${STATUS_STYLE[item.status]}`}
                      >
                        {canAuto && <option value="auto">{own ? rq.autoReset : `${rq.statuses[item.status]} · ${rq.autoBadge.toLowerCase()}`}</option>}
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {rq.statuses[st]}
                          </option>
                        ))}
                      </select>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${item.status === "not-applicable" ? "text-navy-400 line-through" : "text-navy-800"}`}>{title}</p>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs">
                          <span className="badge bg-navy-50 text-navy-500">{rq.origins[item.origin]}</span>
                          {!req.mandatory && <span className="badge bg-navy-50 text-navy-500">{rq.recommended}</span>}
                          {condition && <span className="badge bg-navy-50 text-navy-600">{rq.condition(condition)}</span>}
                          {req.owner && <span className="badge bg-navy-50 text-navy-600">{rq.ownerLabel(rq.owners[req.owner])}</span>}
                          {req.leadTimeDays !== undefined && item.status !== "done" && item.status !== "not-applicable" && (
                            <span className={`badge ${item.leadTimeWarning ? "bg-amber-100 text-amber-800" : "bg-navy-50 text-navy-600"}`}>
                              {item.leadTimeWarning ? rq.leadTimeUrgent(req.leadTimeDays) : rq.leadTime(req.leadTimeDays)}
                            </span>
                          )}
                          {req.due === "after-close" && <span className="badge bg-gold-100 text-gold-800">{rq.dueAfterClose(req.dueOffsetHours ?? 24)}</span>}
                          {req.due === "before-agreement" && <span className="badge bg-navy-50 text-navy-500">{rq.dueBeforeAgreement}</span>}
                        </div>
                        {detail && (
                          <p className="mt-1 text-xs text-navy-600" data-testid={`requirement-detail-${req.id}`}>
                            {detail}
                          </p>
                        )}
                        {(why || req.source) && (
                          <button
                            type="button"
                            aria-expanded={whyOpen}
                            onClick={() => setOpenWhy(whyOpen ? openWhy.filter((x) => x !== req.id) : [...openWhy, req.id])}
                            className="mt-1 text-xs font-semibold text-navy-500 hover:text-navy-800"
                          >
                            {whyOpen ? t.ext.audit.whyHide : t.ext.audit.whyShow}
                          </button>
                        )}
                        {whyOpen && (
                          <div className="mt-1 space-y-1 text-xs text-navy-600">
                            {why && <p>{why}</p>}
                            <p className="text-navy-400">
                              {rq.source(req.source.document, req.source.checkedAt)}
                              {req.source.url && (
                                <>
                                  {" · "}
                                  <a href={req.source.url} target="_blank" rel="noopener noreferrer" className="font-semibold underline hover:text-navy-800">
                                    {rq.sourceLink}
                                  </a>
                                </>
                              )}
                            </p>
                          </div>
                        )}
                        {item.status === "not-applicable" && own && (
                          <input
                            type="text"
                            aria-label={rq.noteLabel}
                            defaultValue={own.note ?? ""}
                            placeholder={rq.notApplicablePlaceholder}
                            onBlur={(e) => e.target.value !== (own.note ?? "") && onSetState(req.id, { status: own.status, note: e.target.value.trim() })}
                            className={`${input} mt-2 w-full text-xs`}
                          />
                        )}

                        <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                          {(check?.type === "form" || check?.type === "page-limit") && (
                            <button type="button" onClick={() => onOpenSection()} className="font-semibold text-navy-700 underline hover:text-navy-900">
                              {rq.openSection}
                            </button>
                          )}
                          {check?.type === "section" && (
                            <button type="button" onClick={() => onOpenSection(check.key)} className="font-semibold text-navy-700 underline hover:text-navy-900">
                              {rq.openSection}
                            </button>
                          )}
                          {(check?.type === "cost-categories" || check?.type === "budget") && (
                            <button type="button" onClick={onOpenBudget} className="font-semibold text-navy-700 underline hover:text-navy-900">
                              {rq.openBudget}
                            </button>
                          )}
                          {req.link && (
                            <a href={req.link.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-700 underline hover:text-navy-900">
                              {sv ? req.link.label_sv : req.link.label_en}
                            </a>
                          )}
                          {req.id === "generic-call-annexes" && call.link && (
                            <a href={call.link} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-700 underline hover:text-navy-900">
                              {rq.callPage}
                            </a>
                          )}
                          {FILE_KINDS.includes(req.kind) &&
                            (files ? (
                              <label className="cursor-pointer font-semibold text-navy-700 underline hover:text-navy-900">
                                {rq.upload}
                                <input
                                  type="file"
                                  className="sr-only"
                                  data-testid={`requirement-upload-${req.id}`}
                                  onChange={async (e) => {
                                    const file = e.target.files?.[0];
                                    e.target.value = "";
                                    if (!file) return;
                                    const result = await files.add(req.id, file);
                                    setUploadError(result === "too-large" ? { id: req.id, text: rq.uploadTooLarge } : null);
                                  }}
                                />
                              </label>
                            ) : (
                              <span className="text-navy-400">{rq.uploadNotSaved}</span>
                            ))}
                          {item.origin === "own" && (
                            <ConfirmButton
                              label={rq.removeOwn}
                              message={rq.removeOwnConfirm}
                              confirmLabel={t.confirm.yesRemove}
                              cancelLabel={t.confirm.cancel}
                              onConfirm={() => onRemoveOwn(req.id)}
                              danger
                              className="font-medium text-navy-400 hover:text-amber-700"
                            />
                          )}
                        </div>
                        {uploadError?.id === req.id && <p className="mt-1 text-xs text-amber-700">{uploadError.text}</p>}
                        {list.length > 0 && (
                          <ul className="mt-2 space-y-1">
                            {list.map((a) => (
                              <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs text-navy-600">
                                <button type="button" onClick={() => downloadAttachment(a)} className="font-semibold underline hover:text-navy-900">
                                  {a.fileName}
                                </button>
                                <span className="text-navy-400">{fmtFileSize(a.sizeBytes)}</span>
                                <button type="button" onClick={() => files?.remove(req.id, a.id)} className="text-navy-400 hover:text-amber-700">
                                  {rq.removeFile}
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}

      <section className="mt-6 rounded-xl border border-dashed border-navy-200 bg-white p-4">
        <h3 className="font-semibold text-navy-800">{rq.addOwnTitle}</h3>
        <p className="mt-1 text-xs text-navy-500">{rq.addOwnHint}</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs font-semibold text-navy-600">
            {rq.addOwnTitleLabel}
            <input
              type="text"
              value={ownTitle}
              onChange={(e) => setOwnTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addOwn()}
              className={input}
              data-testid="requirement-own-title"
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-semibold text-navy-600">
            {rq.addOwnKindLabel}
            <select value={ownKind} onChange={(e) => setOwnKind(e.target.value as RequirementKind)} className={input}>
              {OWN_KINDS.map((k) => (
                <option key={k} value={k}>
                  {rq.kinds[k]}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-1.5 pb-2 text-xs text-navy-600">
            <input type="checkbox" checked={ownMandatory} onChange={(e) => setOwnMandatory(e.target.checked)} />
            {rq.addOwnMandatory}
          </label>
          <button type="button" onClick={addOwn} disabled={!ownTitle.trim()} className="btn-secondary text-sm disabled:opacity-40">
            {rq.addOwnButton}
          </button>
        </div>
      </section>

      <p className="mb-16 mt-4 text-xs text-navy-500">{rq.callTextWins}</p>
    </div>
  );
}

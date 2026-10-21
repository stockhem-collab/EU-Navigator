"use client";

import { ReactNode, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import ConfirmButton from "@/components/ConfirmButton";
import { downloadAttachment } from "@/lib/hooks/useAttachments";
import { fmtFileSize } from "@/lib/format";
import { EvaluatedRequirement, GROUP_ORDER, RequirementGroup } from "@/lib/data/applicationRequirements";
import type { ApplicationRequirement, Attachment, RequirementKind, RequirementState, RequirementStatus } from "@/lib/types";

export interface RequirementFiles {
  list: (id: string) => Attachment[];
  add: (id: string, file: File) => Promise<"too-large" | null>;
  remove: (id: string, attachmentId: string) => void;
}

interface Props {
  items: EvaluatedRequirement[];
  /** The user's own states (only the ones they set). */
  states: Record<string, RequirementState>;
  onSetState: (id: string, state: Omit<RequirementState, "updatedAt"> | null) => void;
  onAddOwn: (requirement: ApplicationRequirement) => void;
  onRemoveOwn: (id: string) => void;
  /** Files per requirement; undefined = they can't be kept here. */
  files?: RequirementFiles;
  /** Links to where a requirement is met (a section, the budget). */
  actions?: (item: EvaluatedRequirement) => ReactNode;
  /** Badges of the place's own (which report a requirement is for). */
  badges?: (item: EvaluatedRequirement) => ReactNode;
  addOwnHint?: string;
  /** Group headings, when not the application's. */
  groupLabels?: Record<RequirementGroup, string>;
  /** What an automatic status follows, when not the application. */
  autoLabel?: string;
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

// Requirements by group, each with a status, why it is asked for and
// where, who usually provides it and a way to it, and a form for the
// user's own — the list on an application's Krav tab and in the overview
// of a grant's reporting requirements.
export default function RequirementList({ items, states, onSetState, onAddOwn, onRemoveOwn, files, actions, badges, addOwnHint, groupLabels, autoLabel }: Props) {
  const { t, lang } = useLanguage();
  const rq = t.req;
  const sv = lang === "sv";
  const [openWhy, setOpenWhy] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<{ id: string; text: string } | null>(null);
  const [ownTitle, setOwnTitle] = useState("");
  const [ownKind, setOwnKind] = useState<RequirementKind>("annex");
  const [ownMandatory, setOwnMandatory] = useState(true);

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
    <>
      {GROUP_ORDER.map((group) => {
        const inGroup = items.filter((i) => i.group === group);
        if (inGroup.length === 0) return null;
        const counted = inGroup.filter((i) => i.counted);
        return (
          <section key={group} className="mt-6" aria-labelledby={`req-group-${group}`}>
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 id={`req-group-${group}`} className="font-bold text-navy-800">
                {(groupLabels ?? rq.groups)[group]}
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
                        {canAuto && <option value="auto">{own ? rq.autoReset : `${rq.statuses[item.status]} · ${(autoLabel ?? rq.autoBadge).toLowerCase()}`}</option>}
                        {STATUSES.map((st) => (
                          <option key={st} value={st}>
                            {rq.statuses[st]}
                          </option>
                        ))}
                      </select>
                      <div className="min-w-0 flex-1">
                        <p className={`text-sm font-semibold ${item.status === "not-applicable" ? "text-navy-400 line-through" : "text-navy-800"}`}>{title}</p>
                        {/* Where it comes from, who and how long as one quiet line;
                            only what needs attention keeps a coloured badge. */}
                        <div className="mt-0.5 flex flex-wrap items-center gap-x-1.5 gap-y-1 text-xs text-navy-500">
                          <span>
                            {[
                              rq.origins[item.origin],
                              !req.mandatory ? rq.recommended : null,
                              condition ? rq.condition(condition) : null,
                              req.owner ? rq.ownerLabel(rq.owners[req.owner]) : null,
                              req.leadTimeDays !== undefined && !item.leadTimeWarning && item.status !== "done" && item.status !== "not-applicable"
                                ? rq.leadTime(req.leadTimeDays)
                                : null,
                              req.due === "before-agreement" ? rq.dueBeforeAgreement : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </span>
                          {req.leadTimeDays !== undefined && item.leadTimeWarning && item.status !== "done" && item.status !== "not-applicable" && (
                            <span className="badge bg-amber-100 text-amber-800">{rq.leadTimeUrgent(req.leadTimeDays)}</span>
                          )}
                          {req.due === "after-close" && <span className="badge bg-gold-100 text-gold-800">{rq.dueAfterClose(req.dueOffsetHours ?? 24)}</span>}
                          {badges?.(item)}
                          {(why || req.source) && (
                            <button
                              type="button"
                              aria-expanded={whyOpen}
                              onClick={() => setOpenWhy(whyOpen ? openWhy.filter((x) => x !== req.id) : [...openWhy, req.id])}
                              className="font-semibold text-navy-500 hover:text-navy-800"
                            >
                              <span aria-hidden className="mr-1.5 font-normal">·</span>
                              {whyOpen ? t.ext.audit.whyHide : t.ext.audit.whyShow}
                            </button>
                          )}
                        </div>
                        {detail && (
                          <p className="mt-1 text-xs text-navy-600" data-testid={`requirement-detail-${req.id}`}>
                            {detail}
                          </p>
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
                          {actions?.(item)}
                          {req.link && (
                            <a href={req.link.url} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-700 underline hover:text-navy-900">
                              {sv ? req.link.label_sv : req.link.label_en}
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
        <p className="mt-1 text-xs text-navy-500">{addOwnHint ?? rq.addOwnHint}</p>
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

    </>
  );
}

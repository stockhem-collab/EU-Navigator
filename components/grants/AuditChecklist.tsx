"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtSEK } from "@/lib/format";
import { auditCertificateThreshold, auditItemsFor } from "@/lib/data/auditChecklist";
import { useAuditChecklist } from "@/lib/hooks/useAuditChecklist";
import type { FundingCall, FundingProgram, Grant } from "@/lib/types";

/** Revisionsberedskap: the audit-readiness items that apply to this grant,
 * ticked off as they are put in place. */
export default function AuditChecklist({
  grant,
  call,
  program,
}: {
  grant: Grant;
  call: FundingCall | undefined;
  program: FundingProgram | undefined;
}) {
  const { t, lang } = useLanguage();
  const au = t.ext.audit;
  const { done, toggle, hydrated } = useAuditChecklist(grant.id);
  const [open, setOpen] = useState<string[]>([]);
  const ctx = { grant, call, program };
  const items = auditItemsFor(ctx);
  const doneCount = items.filter((i) => done[i.id]).length;
  const threshold = auditCertificateThreshold(ctx);
  const pct = items.length > 0 ? (doneCount / items.length) * 100 : 0;

  return (
    <section id="audit" className="mt-10" aria-labelledby="audit-heading">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="audit-heading" className="text-lg font-bold text-navy-800">
          {au.title}
        </h2>
        {hydrated && (
          <span className="text-sm font-semibold text-navy-600" data-testid="audit-progress">
            {doneCount === items.length ? au.allDone : au.progress(doneCount, items.length)}
          </span>
        )}
      </div>
      <p className="mt-1 text-sm text-navy-500">{au.intro}</p>
      <div className="mt-3 h-2 rounded-full bg-navy-100">
        <div className="h-2 rounded-full bg-green-600 transition-all" style={{ width: `${pct}%` }} />
      </div>
      <ul className="mt-3 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white" data-testid="audit-checklist">
        {items.map((item) => {
          const isOpen = open.includes(item.id);
          const doneAt = done[item.id];
          return (
            <li key={item.id} className="px-4 py-3">
              <div className="flex items-start justify-between gap-3">
                <label className="flex cursor-pointer items-start gap-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={!!doneAt}
                    onChange={() => toggle(item.id)}
                    data-testid={`audit-item-${item.id}`}
                  />
                  <span>
                    <span className={`font-semibold ${doneAt ? "text-navy-400 line-through" : "text-navy-800"}`}>
                      {lang === "sv" ? item.title_sv : item.title_en}
                    </span>
                    {doneAt && (
                      <span className="ml-2 text-xs text-green-700">{au.doneOn(new Date(doneAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-GB"))}</span>
                    )}
                  </span>
                </label>
                <button
                  type="button"
                  aria-expanded={isOpen}
                  onClick={() => setOpen(isOpen ? open.filter((id) => id !== item.id) : [...open, item.id])}
                  className="shrink-0 text-xs font-semibold text-navy-500 hover:text-navy-800"
                >
                  {isOpen ? au.whyHide : au.whyShow}
                </button>
              </div>
              {isOpen && (
                <p className="mt-2 pl-7 text-sm text-navy-600">
                  {lang === "sv" ? item.why_sv : item.why_en}
                  {item.id === "audit-certificate" && threshold !== null && ` ${au.certificateThreshold(fmtSEK(threshold, lang))}`}
                </p>
              )}
            </li>
          );
        })}
      </ul>
      <p className="mt-2 text-xs text-navy-500">{au.disclaimer}</p>
    </section>
  );
}

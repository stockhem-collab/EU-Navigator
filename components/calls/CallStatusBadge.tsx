"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtSEK } from "@/lib/format";
import { fmtMoney, fmtRate } from "@/lib/imported/labels";
import type { CallDate, FundingCall } from "@/lib/types";

/** Öppen / Planerad / Kommande / Förväntad — the call list's own status
 * when the call has one, otherwise open or upcoming. */
export default function CallStatusBadge({ call }: { call: FundingCall }) {
  const { t } = useLanguage();
  const label = call.sourceStatus
    ? t.imported.callStatus[call.sourceStatus]
    : call.status === "open"
      ? t.euDatabase.statusOpen
      : t.euDatabase.statusUpcoming;
  return (
    <span
      className={`badge ${call.status === "open" ? "bg-green-100 text-green-800" : "bg-navy-100 text-navy-600"}`}
      data-testid="call-status"
    >
      {label}
    </span>
  );
}

/** A call date as the source gives it — "2027-04 (prel.)" stays a
 * preliminary month. */
export function CallDateText({ date }: { date: CallDate }) {
  const { t } = useLanguage();
  if (!date.preliminary) return <>{date.date}</>;
  return (
    <span title={t.imported.preliminaryTooltip}>
      {date.date} ({t.imported.preliminary})
    </span>
  );
}

/** "Öppnar 2027-02-09 · Stänger 2027-10-07", for calls that state them. */
export function CallDates({ call, className = "" }: { call: FundingCall; className?: string }) {
  const { t } = useLanguage();
  if (!call.opens && !call.closes) return null;
  return (
    <span className={className} data-testid="call-dates">
      {call.opens && (
        <>
          {t.imported.opens} <CallDateText date={call.opens} />
        </>
      )}
      {call.opens && call.closes && " · "}
      {call.closes && (
        <>
          {t.imported.closes} <CallDateText date={call.closes} />
        </>
      )}
    </span>
  );
}

/** The call's grant range in kronor; the published euro range and the
 * rate in the tooltip. "Ej angivet" when the call states none. */
export function GrantRangeText({ call }: { call: FundingCall }) {
  const { t, lang } = useLanguage();
  if (call.grantRangeStated === false) return <>{t.imported.grantNotStated}</>;
  const text = `${fmtSEK(call.minGrantSEK, lang)}–${fmtSEK(call.maxGrantSEK, lang)}`;
  const o = call.originalGrantRange;
  if (!o) return <>{text}</>;
  const title = t.imported.callAmountTooltip(
    o.min !== null ? fmtMoney(o.min, o.currency, lang) : "0",
    o.max !== null ? fmtMoney(o.max, o.currency, lang) : "–",
    o.rateYear,
    fmtRate(o.rate, lang)
  );
  return (
    <span title={title} className="cursor-help underline decoration-navy-200 decoration-dotted underline-offset-2">
      {text}
    </span>
  );
}

"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Commitment } from "@/lib/types";

// The commitments a grant is followed up against — what the application
// promised, one indicator per row. Used when registering a grant (rows
// suggested from the application's text) and on the grant's own page.
export default function CommitmentsEditor({
  value,
  onChange,
  idPrefix,
}: {
  value: Commitment[];
  onChange: (value: Commitment[]) => void;
  idPrefix: string;
}) {
  const { t, lang } = useLanguage();
  const g = t.grants;
  const set = (i: number, patch: Partial<Commitment>) => onChange(value.map((c, j) => (j === i ? { ...c, ...patch } : c)));
  const inputClass =
    "rounded-md border border-navy-200 bg-white px-2 py-1.5 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";

  return (
    <div className="space-y-2">
      {value.length === 0 && <p className="text-xs text-navy-500">{g.commitmentsNone}</p>}
      {value.map((c, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2" data-testid="commitment-row">
          <label className="sr-only" htmlFor={`${idPrefix}-indicator-${i}`}>
            {g.commitmentIndicatorLabel}
          </label>
          <input
            id={`${idPrefix}-indicator-${i}`}
            value={lang === "sv" ? c.indicator_sv : c.indicator_en}
            onChange={(e) => set(i, { indicator_sv: e.target.value, indicator_en: e.target.value })}
            placeholder={g.commitmentIndicatorLabel}
            className={`${inputClass} min-w-0 flex-1`}
          />
          <label className="sr-only" htmlFor={`${idPrefix}-value-${i}`}>
            {g.commitmentValueLabel}
          </label>
          <input
            id={`${idPrefix}-value-${i}`}
            type="number"
            min={0}
            value={Number.isFinite(c.promisedValue) ? c.promisedValue : ""}
            onChange={(e) => set(i, { promisedValue: e.target.value === "" ? NaN : Number(e.target.value) })}
            placeholder={g.commitmentValueLabel}
            className={`${inputClass} w-24 text-right`}
          />
          <label className="sr-only" htmlFor={`${idPrefix}-unit-${i}`}>
            {g.commitmentUnitLabel}
          </label>
          <input
            id={`${idPrefix}-unit-${i}`}
            value={lang === "sv" ? c.unit_sv : c.unit_en}
            onChange={(e) => set(i, { unit_sv: e.target.value, unit_en: e.target.value })}
            placeholder={g.commitmentUnitLabel}
            className={`${inputClass} w-24`}
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            aria-label={`${g.commitmentRemove}: ${lang === "sv" ? c.indicator_sv : c.indicator_en}`}
            className="text-xs font-semibold text-navy-400 hover:text-amber-700"
          >
            {g.commitmentRemove}
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, { indicator_sv: "", indicator_en: "", promisedValue: NaN, unit_sv: "", unit_en: "" }])}
        className="text-xs font-semibold text-navy-600 hover:text-navy-900"
      >
        + {g.commitmentAdd}
      </button>
    </div>
  );
}

/** Only complete rows count: an indicator and a positive value. */
export function completeCommitments(value: Commitment[]): Commitment[] {
  return value
    .map((c) => ({ ...c, indicator_sv: c.indicator_sv.trim(), indicator_en: (c.indicator_en || c.indicator_sv).trim() }))
    .filter((c) => c.indicator_sv && Number.isFinite(c.promisedValue) && c.promisedValue > 0);
}

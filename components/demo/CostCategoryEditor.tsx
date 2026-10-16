"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { costAmounts, costCode, costTotal } from "@/lib/data/costCategories";
import { CostCategory } from "@/lib/types";

interface Props {
  idPrefix: string;
  categories: CostCategory[];
  values: Record<string, string>;
  onChange: (key: string, value: string) => void;
  /** SEK per EUR, to show the amounts in EUR for a form in euro. */
  eurRate?: number;
  testId?: string;
}

// Amounts per a funder's cost categories (Horizon Europe's A–E, ESF+'s
// kostnadsslag): entered in SEK, flat-rate categories calculated, with the
// total — for an application's budget and a report's costs alike.
export default function CostCategoryEditor({ idPrefix, categories, values, onChange, eurRate, testId }: Props) {
  const { t, lang } = useLanguage();
  const tp = t.tpl;
  const amounts = costAmounts(categories, values);
  const total = costTotal(amounts);
  const kr = (n: number) => (lang === "sv" ? `${n.toLocaleString("sv-SE")} kr` : `SEK ${n.toLocaleString("en-US")}`);
  const eur = (sek: number) =>
    eurRate ? tp.inEur(Math.round(sek / eurRate).toLocaleString(lang === "sv" ? "sv-SE" : "en-US")) : "";

  return (
    <div className="space-y-2" data-testid={testId}>
      {categories.map((c) => {
        const id = `${idPrefix}-${c.key}`;
        const calculated = Boolean(c.flatRate?.percent);
        const note = lang === "sv" ? c.note_sv : c.note_en;
        return (
          <div key={c.key} className="flex flex-wrap items-center gap-3">
            <label htmlFor={id} className="min-w-0 flex-1 text-sm text-navy-700">
              {c.code && <span className="mr-1 font-semibold">{costCode(c)}</span>}
              {lang === "sv" ? c.label_sv : c.label_en}
              {(note || c.flatRate) && (
                <span className="block text-xs text-navy-400">
                  {calculated ? tp.flatRate(c.flatRate!.percent!) : c.flatRate ? tp.flatRateEntered : note}
                </span>
              )}
            </label>
            {calculated ? (
              <output id={id} className="w-36 text-right text-sm font-semibold tabular-nums text-navy-700">
                {kr(amounts[c.key])}
              </output>
            ) : (
              <input
                id={id}
                type="number"
                min={0}
                value={values[c.key] ?? ""}
                onChange={(e) => onChange(c.key, e.target.value)}
                placeholder="0"
                className="w-36 rounded-md border border-navy-200 px-2 py-1.5 text-right text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            )}
            {eurRate && <span className="w-24 text-right text-xs text-navy-400">{eur(amounts[c.key])}</span>}
          </div>
        );
      })}
      <div className="flex flex-wrap items-center gap-3 border-t border-navy-100 pt-2">
        <span className="flex-1 text-sm font-semibold text-navy-800">{tp.costsTotal}</span>
        <span className="w-36 text-right text-sm font-bold tabular-nums text-navy-800" data-testid={testId ? `${testId}-total` : undefined}>
          {kr(total)}
        </span>
        {eurRate && <span className="w-24 text-right text-xs text-navy-400">{eur(total)}</span>}
      </div>
    </div>
  );
}

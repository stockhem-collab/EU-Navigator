// Display helpers for the imported reference data, safe to use in the
// browser (no file access).

import type { Lang } from "@/lib/types";
import type { SourceSystem } from "@/lib/integrations/core/types";

const SOURCE_LABELS: Record<SourceSystem, { sv: string; en: string }> = {
  kohesio: { sv: "Kohesio", en: "Kohesio" },
  "keep-eu": { sv: "Keep.eu", en: "Keep.eu" },
  cordis: { sv: "CORDIS", en: "CORDIS" },
  esf: { sv: "ESF-projektbanken", en: "ESF project bank" },
  fts: { sv: "EU:s transparenssystem (FTS)", en: "EU Financial Transparency System" },
  erasmus: { sv: "Erasmus+", en: "Erasmus+" },
  tillvaxtverket: { sv: "Tillväxtverkets projektbank", en: "Tillväxtverket project bank" },
  vinnova: { sv: "Vinnova", en: "Vinnova" },
};

/** Sources whose amounts are not EU funding (Vinnova: national grants). */
export function isNationalSource(source: SourceSystem): boolean {
  return source === "vinnova";
}

/** Read only for the municipalities' history and comparison, not the
 * reference index. */
export const HISTORY_ONLY_SOURCES: SourceSystem[] = ["fts", "erasmus", "tillvaxtverket"];

/** The sources in the reference index. */
export const IMPORTED_SOURCES = (Object.keys(SOURCE_LABELS) as SourceSystem[]).filter(
  (s) => !HISTORY_ONLY_SOURCES.includes(s),
);

export function sourceLabel(source: SourceSystem, lang: Lang): string {
  return SOURCE_LABELS[source]?.[lang] ?? source;
}

/** "SE" → "Sverige". Falls back to the code. */
export function countryName(code: string | null, lang: Lang): string {
  if (!code) return "–";
  try {
    return new Intl.DisplayNames([lang === "sv" ? "sv-SE" : "en-GB"], { type: "region" }).of(code.toUpperCase()) ?? code;
  } catch {
    return code;
  }
}

/** A whole amount with its currency, e.g. "1 234 567 EUR". */
export function fmtMoney(amount: number, currency: string, lang: Lang): string {
  return `${Math.round(amount).toLocaleString(lang === "sv" ? "sv-SE" : "en-US")} ${currency}`;
}

export function fmtRate(rate: number, lang: Lang): string {
  return rate.toLocaleString(lang === "sv" ? "sv-SE" : "en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
}

"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtSEK } from "@/lib/format";
import { fmtMoney, fmtRate } from "@/lib/imported/labels";
import type { SekAmount } from "@/lib/imported/types";

/** An amount in kronor; the amount the source published (in euro) and the
 * rate used are in the tooltip. */
export default function SekAmountText({ amount, fallback = "–" }: { amount: SekAmount | null; fallback?: string }) {
  const { t, lang } = useLanguage();
  if (!amount) return <>{fallback}</>;
  const title =
    amount.original.currency === "SEK" || amount.rate === undefined || amount.rateYear === undefined
      ? t.imported.amountTooltipSek
      : t.imported.amountTooltipConverted(
          fmtMoney(amount.original.amount, amount.original.currency, lang),
          amount.rateYear,
          fmtRate(amount.rate, lang)
        );
  return (
    <span title={title} className="cursor-help underline decoration-navy-200 decoration-dotted underline-offset-2">
      {fmtSEK(amount.sek, lang)}
    </span>
  );
}

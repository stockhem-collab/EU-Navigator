"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fmtSEK } from "@/lib/format";
import { findProgram } from "@/lib/data/fundingPrograms";
import { sectorLabel } from "@/lib/matching/scoreMatch";
import { fmtMoney } from "@/lib/imported/labels";
import type { AmountStats } from "@/lib/imported/types";
import type { Sector } from "@/lib/types";

/** What has actually been granted per project in each programme and the
 * idea's theme, from the imported data — fetched once for all the match
 * cards on a page. Keyed by programme id. */
export function useAmountBenchmarks(sector: Sector | null | undefined, programIds: string[]): Record<string, AmountStats> {
  const [stats, setStats] = useState<Record<string, AmountStats>>({});
  const key = [...new Set(programIds)].sort().join(",");

  useEffect(() => {
    if (!sector || !key) return;
    let cancelled = false;
    fetch("/api/belopp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sector, programIds: key.split(",") }),
    })
      .then((res) => (res.ok ? res.json() : Promise.reject(res.status)))
      .then((data: { stats: AmountStats[] }) => {
        if (!cancelled) setStats(Object.fromEntries(data.stats.map((s) => [s.programId, s])));
      })
      .catch(() => {
        // No benchmark on the cards; the match itself still shows.
      });
    return () => {
      cancelled = true;
    };
  }, [sector, key]);

  return stats;
}

/** "Beviljat i liknande projekt: 3,4–13,9 mnkr, median 6,7 mnkr", with the
 * basis underneath and the euro figures in the tooltip. */
export default function AmountBenchmark({ stats }: { stats: AmountStats | undefined }) {
  const { t, lang } = useLanguage();
  const it = t.imported;
  if (!stats) return null;
  if (stats.basis === "none") {
    return (
      <p className="text-xs text-navy-400" data-testid="amount-benchmark">
        {it.benchmarkLabel}: {it.benchmarkNone}
      </p>
    );
  }
  const range = `${fmtSEK(stats.low, lang)}–${fmtSEK(stats.high, lang)}`;
  const eurRange = `${fmtMoney(stats.lowEur, "EUR", lang)}–${fmtMoney(stats.highEur, "EUR", lang)}`;
  const programs = stats.programIds.map((id) => findProgram(id)?.shortName ?? id).join(" + ");
  return (
    <div className="text-sm" data-testid="amount-benchmark">
      <p className="text-navy-700">
        <span className="font-semibold">{it.benchmarkLabel}:</span>{" "}
        <span
          title={it.benchmarkTooltip(eurRange, fmtMoney(stats.medianEur, "EUR", lang), stats.spread)}
          className="cursor-help underline decoration-navy-200 decoration-dotted underline-offset-2"
        >
          {it.benchmarkLine(range, fmtSEK(stats.median, lang))}
        </span>
      </p>
      <p className="text-xs text-navy-400">
        {it.benchmarkBasis(stats.count, programs, sectorLabel(stats.sector, lang), stats.basis === "program-theme")}
      </p>
    </div>
  );
}

import { Lang } from "@/lib/types";

export function fmtSEK(n: number, lang: Lang): string {
  const millions = n / 1_000_000;
  const formatted = millions.toLocaleString(lang === "sv" ? "sv-SE" : "en-US", {
    maximumFractionDigits: 1,
  });
  return lang === "sv" ? `${formatted} mnkr` : `SEK ${formatted}M`;
}

export function fmtPct(n: number): string {
  return `${Math.round(n * 100)}%`;
}

export function fmtFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

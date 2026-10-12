"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

/** The page numbers to show: the first, the last and two either side of the
 * current one, with null where pages are left out ("…"). */
export function pageWindow(page: number, totalPages: number): (number | null)[] {
  const shown = new Set([1, totalPages]);
  for (let p = page - 2; p <= page + 2; p++) if (p >= 1 && p <= totalPages) shown.add(p);
  const sorted = [...shown].sort((a, b) => a - b);
  const out: (number | null)[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] === 2) out.push(p - 1);
    else if (i > 0 && p - sorted[i - 1] > 2) out.push(null);
    out.push(p);
  });
  return out;
}

export function totalPagesFor(total: number, pageSize: number): number {
  return Math.max(1, Math.ceil(total / pageSize));
}

/** Numbered page navigation for a long list. Hidden when everything fits
 * on one page. */
export default function Pagination({
  page,
  pageSize,
  total,
  onPageChange,
  disabled,
}: {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
  disabled?: boolean;
}) {
  const { t } = useLanguage();
  const pg = t.ext.pager;
  const totalPages = totalPagesFor(total, pageSize);
  if (totalPages <= 1) return null;

  const button = "min-w-[2.25rem] rounded-md border px-3 py-1.5 text-sm font-semibold transition disabled:opacity-40";
  const idle = "border-navy-200 bg-white text-navy-700 hover:bg-navy-50";
  const current = "border-navy-800 bg-navy-800 text-white";

  return (
    <nav aria-label={pg.label} className="mt-6 flex flex-wrap items-center gap-2" data-testid="pagination">
      <button
        type="button"
        className={`${button} ${idle}`}
        disabled={disabled || page <= 1}
        onClick={() => onPageChange(page - 1)}
      >
        ← {pg.previous}
      </button>
      {pageWindow(page, totalPages).map((p, i) =>
        p === null ? (
          <span key={`gap-${i}`} className="px-1 text-navy-400" aria-hidden="true">
            …
          </span>
        ) : (
          <button
            key={p}
            type="button"
            className={`${button} ${p === page ? current : idle}`}
            aria-label={pg.page(p)}
            aria-current={p === page ? "page" : undefined}
            disabled={disabled && p !== page}
            onClick={() => p !== page && onPageChange(p)}
          >
            {p}
          </button>
        )
      )}
      <button
        type="button"
        className={`${button} ${idle}`}
        disabled={disabled || page >= totalPages}
        onClick={() => onPageChange(page + 1)}
      >
        {pg.next} →
      </button>
    </nav>
  );
}

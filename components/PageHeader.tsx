import { ReactNode } from "react";

// The dark blue band at the top of the main pages (Översikt, Projekt,
// Ansöka, Rapportera, Kunskapsbank, Datacenter): a small label, the page
// title and a line under it, with the page's own actions on the right.
// Actions sit on the dark background, so use headerButtonClass /
// headerSecondaryButtonClass and HeaderToggle for what goes there.
export default function PageHeader({
  eyebrow,
  title,
  subtitle,
  children,
  large = false,
}: {
  eyebrow?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  /** Buttons, links or toggles shown on the right (below on mobile). */
  children?: ReactNode;
  /** Översikt's welcome band is a little taller than the others. */
  large?: boolean;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-800 via-navy-700 to-navy-600 px-6 text-white shadow-sm sm:px-8 ${
        large ? "py-7 sm:py-8" : "py-6"
      }`}
    >
      <div aria-hidden className="pointer-events-none absolute -right-16 -top-20 h-64 w-64 rounded-full bg-white/5" />
      <div aria-hidden className="pointer-events-none absolute -bottom-24 right-24 h-56 w-56 rounded-full bg-gold-400/10" />
      <div className="relative flex flex-wrap items-end justify-between gap-6">
        <div className="min-w-0 max-w-3xl">
          {eyebrow && <p className="text-xs font-semibold uppercase tracking-wider text-gold-300">{eyebrow}</p>}
          <h1 className={`font-bold ${eyebrow ? "mt-2" : ""} ${large ? "text-2xl sm:text-3xl" : "text-2xl"}`}>{title}</h1>
          {subtitle && <div className="mt-2 text-sm text-navy-100">{subtitle}</div>}
        </div>
        {children && <div className="flex flex-col items-start gap-3 sm:items-end">{children}</div>}
      </div>
    </div>
  );
}

export const headerButtonClass =
  "inline-flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-sm font-semibold text-navy-800 shadow-sm transition hover:bg-navy-50";

export const headerSecondaryButtonClass =
  "inline-flex items-center gap-1.5 rounded-lg border border-white/30 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10";

/** The "Visa endast mina och delade projekt" checkbox, styled for the band. */
export function HeaderToggle({ checked, onChange, label }: { checked: boolean; onChange: (checked: boolean) => void; label: string }) {
  return (
    <label className="flex items-center gap-2 text-sm text-navy-100">
      <input type="checkbox" className="accent-gold-400" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      {label}
    </label>
  );
}

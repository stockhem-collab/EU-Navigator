"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";

/** "Visa inaktuella utlysningar (n)" — shown only when a list has calls
 * whose deadline has passed. */
export default function OutdatedCallsToggle({
  count,
  show,
  onChange,
}: {
  count: number;
  show: boolean;
  onChange: (show: boolean) => void;
}) {
  const { t } = useLanguage();
  if (count === 0) return null;
  return (
    <label className="flex shrink-0 items-center gap-2 text-sm font-semibold text-navy-700">
      <input type="checkbox" checked={show} onChange={(e) => onChange(e.target.checked)} data-testid="show-outdated-calls" />
      {t.ext.calls.showOutdated(count)}
    </label>
  );
}

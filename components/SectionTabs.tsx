"use client";

import { useCallback, useEffect, useState } from "react";

// Splits a long detail page (a project, a grant) into a few tabs so only
// one part shows at a time. The active tab follows the address's hash, so
// links to a section (/projekt/pb-4#matches, #tasks-heading, …) open the
// tab that holds it; `anchors` lists those section ids per tab.
export interface SectionTab {
  id: string;
  label: string;
  count?: number;
  anchors?: string[];
}

function tabForHash(tabs: SectionTab[]): string | undefined {
  const hash = decodeURIComponent(window.location.hash.slice(1));
  if (!hash) return undefined;
  return tabs.find((tab) => tab.id === hash || tab.anchors?.includes(hash))?.id;
}

export function useSectionTab(tabs: SectionTab[]): [string, (id: string) => void] {
  const [active, setActive] = useState(tabs[0].id);
  const key = tabs.map((t) => `${t.id}:${(t.anchors ?? []).join(",")}`).join("|");

  useEffect(() => {
    const sync = () => {
      const fromHash = tabForHash(tabs);
      if (fromHash) setActive(fromHash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  const select = useCallback(
    (id: string) => {
      setActive(id);
      // The first tab needs no hash; the others keep theirs on reload.
      const hash = id === tabs[0].id ? "" : `#${id}`;
      window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}${hash}`);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [key]
  );

  return [active, select];
}

export default function SectionTabs({
  tabs,
  active,
  onSelect,
  label,
}: {
  tabs: SectionTab[];
  active: string;
  onSelect: (id: string) => void;
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="mt-8 flex flex-wrap gap-1 border-b border-navy-100">
      {tabs.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            id={`tab-${tab.id}`}
            aria-selected={selected}
            aria-controls={`panel-${tab.id}`}
            onClick={() => onSelect(tab.id)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-semibold transition ${
              selected ? "border-gold-500 text-navy-900" : "border-transparent text-navy-500 hover:text-navy-800"
            }`}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${selected ? "bg-navy-800 text-white" : "bg-navy-100 text-navy-600"}`}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function SectionTabPanel({ id, active, children }: { id: string; active: string; children: React.ReactNode }) {
  if (id !== active) return null;
  return (
    <div role="tabpanel" id={`panel-${id}`} aria-labelledby={`tab-${id}`}>
      {children}
    </div>
  );
}

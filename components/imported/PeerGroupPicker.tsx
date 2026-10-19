"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { PeerGroupOption } from "@/lib/imported/server";

// Chooses the comparison group (?grupp=) on Er EU-historik and the
// Ledningsrapport. The page reads the group on the server, so each choice
// is a link. Hidden in print; the intro names the group shown.
export default function PeerGroupPicker({
  label,
  groups,
  active,
}: {
  label: string;
  groups: PeerGroupOption[];
  active: string | null;
}) {
  const pathname = usePathname();
  if (groups.length < 2) return null;
  return (
    <nav aria-label={label} className="mt-3 flex flex-wrap items-center gap-2 print:hidden" data-testid="peer-groups">
      <span className="mr-1 text-xs font-semibold uppercase text-navy-400">{label}</span>
      {groups.map((g) => {
        const current = g.id === active;
        return (
          <Link
            key={g.id}
            href={`${pathname}?grupp=${g.id}`}
            scroll={false}
            aria-current={current ? "true" : undefined}
            title={g.description}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              current ? "bg-navy-800 text-white" : "border border-navy-200 text-navy-600 hover:bg-navy-50"
            }`}
          >
            {g.label}
          </Link>
        );
      })}
    </nav>
  );
}

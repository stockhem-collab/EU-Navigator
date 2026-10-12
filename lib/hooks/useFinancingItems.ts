"use client";

import { useMemo } from "react";
import { findProgram } from "@/lib/data/fundingPrograms";
import { financingItems, FinancingItem } from "@/lib/matching/cofinancing";
import { readApplicationBudget } from "@/lib/hooks/useApplication";
import { useApplications } from "@/lib/hooks/useApplications";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useGrants } from "@/lib/hooks/useGrants";
import { useProjectBank } from "@/lib/hooks/useProjectBank";

/** The organisation's grants and applications with the funder as
 * financing items (lib/matching/cofinancing.ts), from this browser's
 * data. Empty until everything is read from storage. */
export function useFinancingItems(includeDrafts = false): { items: FinancingItem[]; hydrated: boolean } {
  const { all: projects, hydrated: h1 } = useProjectBank();
  const { all: grants, hydrated: h2 } = useGrants();
  const { records, hydrated: h3 } = useApplications();
  const { all: calls, hydrated: h4 } = useFundingCalls();
  const hydrated = h1 && h2 && h3 && h4;

  const items = useMemo(
    () =>
      hydrated
        ? financingItems({ projects, grants, records, calls, findProgram, readBudget: readApplicationBudget, includeDrafts })
        : [],
    [hydrated, projects, grants, records, calls, includeDrafts]
  );
  return { items, hydrated };
}

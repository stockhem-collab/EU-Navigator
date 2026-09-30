"use client";

import { useCallback } from "react";
import { ProjectInput } from "@/lib/types";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useFundingProfile } from "@/lib/hooks/useFundingProfile";
import { computeMatches } from "@/lib/matching/scoreMatch";
import { computeReadiness } from "@/lib/matching/readiness";
import { projectInputToProjectBankEntry, projectMatchingFieldsPatch } from "@/lib/matching/portfolio";

/** Saves a project described in the project form: updates `existingId`
 * when the form was opened for a saved project, otherwise creates a new
 * one. Returns the project's id. Used by both /projekt/nytt and the
 * form under Ny ansökan (/ansokan). */
export function useSaveProject() {
  const { addImported, updateEntry } = useProjectBank();
  const { all: fundingCalls } = useFundingCalls();
  const { profile: fundingProfile } = useFundingProfile();

  return useCallback(
    (project: ProjectInput, existingId?: string | null): string => {
      if (existingId) {
        updateEntry(existingId, {
          title_sv: project.title,
          title_en: project.title,
          description_sv: project.description,
          description_en: project.description,
          sector: project.sector,
          estimatedCostSEK: project.budgetSEK,
          periodStart: project.startYear,
          periodEnd: project.endYear,
          hasInternationalPartner: project.hasInternationalPartner,
          tags: project.tags,
          ...projectMatchingFieldsPatch(project),
        });
        return existingId;
      }
      // Readiness against the project's best match, like a project saved
      // from the application workspace.
      const best = computeMatches(project, fundingCalls, fundingProfile)[0];
      const readiness = best ? computeReadiness(project, best) : { overall: 0, dimensions: [] };
      const entry = projectInputToProjectBankEntry(project, readiness);
      addImported([entry]);
      return entry.id;
    },
    [addImported, updateEntry, fundingCalls, fundingProfile]
  );
}

"use client";

import { Grant, ReportingEvent } from "@/lib/types";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { reportSectionsFor } from "@/lib/data/reportSections";
import { reportDueDate } from "@/lib/matching/reportingSchedule";
import {
  CompletenessSummary,
  EvaluatedRequirement,
  ResolvedRequirement,
  evaluateRequirements,
  isPublicBody,
  summarizeCompleteness,
} from "@/lib/data/applicationRequirements";
import { reportFacts, reportRequirementsKey, resolveReportRequirements } from "@/lib/data/reportRequirements";
import { documentAttachmentKey, reportRequirementFileKey, requiredDocuments } from "@/lib/data/reportDocuments";
import { ReportDraft } from "@/lib/hooks/useReportingSubmissions";
import { useCallTemplates } from "@/lib/hooks/useCallTemplates";
import { useCallRequirements } from "@/lib/hooks/useCallRequirements";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { useAttachments } from "@/lib/hooks/useAttachments";

export interface ReportRequirements {
  /** Every requirement for the grant's reports, whichever report they're for. */
  all: ResolvedRequirement[];
  /** The report's requirements with their status, and how complete it is —
   * when a report is given. */
  items?: EvaluatedRequirement[];
  summary?: CompletenessSummary;
}

/** What the grant's reports require (the overview on the grant page) and,
 * for one report, how far its requirements have come — read the same way
 * on the overview and on the report itself. */
export function useReportRequirements(grant: Grant, event?: ReportingEvent, draft?: ReportDraft): ReportRequirements {
  const { lang } = useLanguage();
  const templates = useCallTemplates();
  const callRequirements = useCallRequirements();
  const { config: orgConfig } = useOrgConfig();
  const { attachmentsFor } = useAttachments();
  const call = findCall(grant.callId);
  const program = call ? findProgram(call.programId) : undefined;
  const template = templates.reportTemplateFor(call);
  const sources = {
    grant,
    call,
    program,
    template,
    datacenter: call ? callRequirements.all[reportRequirementsKey(call.id)] : undefined,
    own: grant.ownReportRequirements ?? [],
  };
  const all = resolveReportRequirements(sources);
  if (!event || !draft || event.type === "sustainability") return { all };

  const resolved = resolveReportRequirements({ ...sources, reportType: event.type });
  const documents = requiredDocuments(grant, event, lang);
  const facts = reportFacts({
    grant,
    event,
    draft,
    sections: reportSectionsFor(event.type, template),
    categories: template?.costCategories,
    documentsReady: documents.map(
      (name, i) => Boolean(draft.checklist[name]) || attachmentsFor(documentAttachmentKey(grant.id, event.id, i)).length > 0
    ),
  });
  const items = evaluateRequirements(resolved, draft.requirementStates, {
    sections: [],
    costCategoriesFilled: 0,
    costCategoriesTotal: 0,
    budgetStated: false,
    submitted: event.status === "submitted" || event.status === "approved",
    publicBody: isPublicBody(orgConfig.orgType),
    attachments: Object.fromEntries(
      resolved.map((r) => [r.requirement.id, attachmentsFor(reportRequirementFileKey(grant.id, event.id, r.requirement.id)).length])
    ),
    deadlineDate: reportDueDate(event).toISOString().slice(0, 10),
    today: new Date(),
    report: facts,
  });
  return { all, items, summary: summarizeCompleteness(items) };
}

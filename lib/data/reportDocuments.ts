import { findCall } from "./fundingCalls";
import type { Grant, ReportingEvent } from "../types";

/** Attachment storage key of one report, and of one required document. */
export const reportAttachmentKey = (grantId: string, eventId: string) => `report:${grantId}:${eventId}`;
export const documentAttachmentKey = (grantId: string, eventId: string, index: number) =>
  `${reportAttachmentKey(grantId, eventId)}:doc:${index}`;
/** Attachment key of a file uploaded for one requirement of one report. */
export const reportRequirementFileKey = (grantId: string, eventId: string, requirementId: string) =>
  `${reportAttachmentKey(grantId, eventId)}:req:${requirementId}`;

/** The documents the call requires for this kind of report. */
export function requiredDocuments(grant: Grant, event: ReportingEvent, lang: "sv" | "en"): string[] {
  const req = findCall(grant.callId)?.reportingRequirements;
  if (!req || event.type === "sustainability") return [];
  if (event.type === "final") return lang === "sv" ? req.finalReportDocuments_sv : req.finalReportDocuments_en;
  return lang === "sv" ? req.interimDocuments_sv : req.interimDocuments_en;
}

"use client";

import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { nextActionableReport, reportingHealth } from "@/lib/data/grants";
import { Grant } from "@/lib/types";

// Folds an awarded project's reporting state into the same row as its
// Projektbank status, instead of leaving the two only visible on separate
// pages (Projektbank/Mina projekt's own status badge vs. Projekt's
// reporting timeline) — see the full-system review on the Projektbank ↔
// rapportering connection. `project` should already have any local
// submissions overlaid (useReportingSubmissions().withSubmissions), same as
// everywhere else this health/next-report logic is used.
export default function LinkedReportingBadge({ project }: { project: Grant }) {
  const { t } = useLanguage();
  const ap = t.grants;
  const nextReport = nextActionableReport(project);
  const health = reportingHealth(project);
  const style = health === "blocked" ? "bg-amber-100 text-amber-800" : health === "attention" ? "bg-gold-100 text-gold-800" : "bg-navy-100 text-navy-600";

  return (
    <Link href={`/projekt/${project.id}`} className={`badge ${style} hover:underline`}>
      {nextReport
        ? nextReport.status === "revision-requested"
          ? ap.reportStatusRevisionRequested
          : ap.nextReportDue(nextReport.deadlineMonthsFromNow)
        : ap.reportingCompleteLabel}
    </Link>
  );
}

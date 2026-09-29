"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ApplicationStatus } from "@/lib/types";

const STYLES: Record<ApplicationStatus, string> = {
  draft: "bg-navy-100 text-navy-600",
  submitted: "bg-blue-100 text-blue-700",
  "under-review": "bg-blue-100 text-blue-700",
  awarded: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  withdrawn: "bg-navy-50 text-navy-400",
};

export default function ApplicationStatusBadge({ status }: { status: ApplicationStatus }) {
  const { t } = useLanguage();
  return <span className={`badge ${STYLES[status]}`}>{t.applications.statusLabels[status]}</span>;
}

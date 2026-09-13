"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProjectStatus } from "@/lib/types";

const STYLES: Record<ProjectStatus, string> = {
  idea: "bg-navy-100 text-navy-600",
  assessing: "bg-navy-100 text-navy-600",
  "funding-search": "bg-gold-100 text-gold-700",
  application: "bg-blue-100 text-blue-700",
  submitted: "bg-blue-100 text-blue-700",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-700",
  running: "bg-green-100 text-green-800",
  completed: "bg-navy-50 text-navy-400",
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useLanguage();
  return <span className={`badge ${STYLES[status]}`}>{t.projectBank.statusLabels[status]}</span>;
}

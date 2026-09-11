"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProjectStatus } from "@/lib/types";

const STYLES: Record<ProjectStatus, string> = {
  idea: "bg-navy-100 text-navy-600",
  "in-development": "bg-gold-100 text-gold-700",
  applying: "bg-blue-100 text-blue-700",
  awarded: "bg-green-100 text-green-800",
  delivering: "bg-green-100 text-green-800",
  closed: "bg-navy-50 text-navy-400",
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  const { t } = useLanguage();
  return <span className={`badge ${STYLES[status]}`}>{t.projectBank.statusLabels[status]}</span>;
}

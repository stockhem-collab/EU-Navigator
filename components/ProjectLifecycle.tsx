"use client";

import StatusBadge from "@/components/StatusBadge";
import LinkedReportingBadge from "@/components/LinkedReportingBadge";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { isActiveApplication } from "@/lib/matching/applications";
import { ApplicationRecord, Grant, ProjectStatus } from "@/lib/types";

// The project page's answer to "where does this project stand?": its own
// lifecycle status, then its applications, grants and reporting — the
// chain Projekt → Ansökan → Beviljat stöd → Rapporter at a glance, each
// step linking to its section further down.
export default function ProjectLifecycle({
  status,
  applications,
  grants,
}: {
  status: ProjectStatus;
  applications: ApplicationRecord[];
  /** With local report submissions already overlaid. */
  grants: Grant[];
}) {
  const { t } = useLanguage();
  const pb = t.projectBank;
  const active = applications.filter(isActiveApplication).length;
  const awarded = applications.filter((a) => a.status === "awarded").length;
  const closed = applications.filter((a) => a.status === "rejected" || a.status === "withdrawn").length;

  const steps: { key: string; label: string; href?: string; content: React.ReactNode; done: boolean }[] = [
    { key: "project", label: pb.lifecycleProject, content: <StatusBadge status={status} />, done: true },
    {
      key: "applications",
      label: pb.lifecycleApplications,
      href: "#applications-title",
      content: applications.length > 0 ? pb.lifecycleApplicationsSummary(active, closed, awarded) : pb.lifecycleNone,
      done: applications.length > 0,
    },
    {
      key: "grants",
      label: pb.lifecycleGrants,
      href: "#grants-title",
      content: grants.length > 0 ? pb.lifecycleGrantsSummary(grants.length) : pb.lifecycleNone,
      done: grants.length > 0,
    },
    {
      key: "reporting",
      label: pb.lifecycleReporting,
      content:
        grants.length > 0 ? (
          <span className="flex flex-wrap gap-1">
            {grants.map((g) => (
              <LinkedReportingBadge key={g.id} project={g} />
            ))}
          </span>
        ) : (
          pb.lifecycleNone
        ),
      done: grants.length > 0,
    },
  ];

  return (
    <section aria-label={pb.lifecycleTitle} className="mt-6 rounded-xl border border-navy-100 bg-white p-4">
      <p className="text-xs font-semibold uppercase text-navy-400">{pb.lifecycleTitle}</p>
      <ol className="mt-3 grid gap-3 sm:grid-cols-4">
        {steps.map((step, i) => (
          <li key={step.key} className="relative flex gap-3">
            <span
              aria-hidden
              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                step.done ? "bg-navy-800 text-white" : "bg-navy-100 text-navy-400"
              }`}
            >
              {i + 1}
            </span>
            <div className="min-w-0">
              {step.href ? (
                <a href={step.href} className="text-sm font-semibold text-navy-800 hover:underline">
                  {step.label}
                </a>
              ) : (
                <p className="text-sm font-semibold text-navy-800">{step.label}</p>
              )}
              <div className="mt-1 text-xs text-navy-500">{step.content}</div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ApplicationStatusBadge from "@/components/ApplicationStatusBadge";
import FundingOpportunities from "@/components/calls/FundingOpportunities";
import UnreadDot from "@/components/UnreadDot";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useApplications } from "@/lib/hooks/useApplications";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { useUsersDirectory } from "@/lib/hooks/useUsersDirectory";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { callDeadlineMonths } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { CURRENT_USER_ID, isProjectRelevantToUser, orgUnits as seedOrgUnits } from "@/lib/data/users";
import { APPLICATION_STATUS_GROUPS, ApplicationStatusGroup, isActiveApplication } from "@/lib/matching/applications";
import { ApplicationRecord } from "@/lib/types";
import { useOnlyMineAndShared } from "@/lib/hooks/useOnlyMineAndShared";

// The tabs (in progress / decided / all) and, narrower, the four figures
// above them — each figure filters the list to just what it counts.
type Filter = "active" | "decided" | "all" | ApplicationStatusGroup;

function isFilter(value: string | null): value is Filter {
  return value === "active" || value === "decided" || value === "all" || (value !== null && value in APPLICATION_STATUS_GROUPS);
}

// Ansöka: every application across every project, by where it stands, and
// below it the calls worth applying to next (formerly Bevakning).
export default function ApplyPage() {
  return (
    <Suspense fallback={null}>
      <ApplyPageInner />
    </Suspense>
  );
}

function ApplyPageInner() {
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();
  const a = t.apply;
  const at = t.applications;
  const bv = t.bevakning;
  const { records, hydrated } = useApplications();
  const { all: projectBank } = useProjectBank();
  const { all: fundingCalls } = useFundingCalls();
  const { users } = useUsersDirectory();
  const { config: orgConfig } = useOrgConfig();
  const currentUser = users.find((u) => u.id === CURRENT_USER_ID);
  const orgUnitsAll = orgConfig.units ?? seedOrgUnits;
  // ?filter=… (e.g. from Datacenter's application figures) opens the list
  // filtered that way.
  const initialFilter = searchParams.get("filter");
  const [filter, setFilter] = useState<Filter>(isFilter(initialFilter) ? initialFilter : "active");
  const [onlyMineAndShared, setOnlyMineAndShared] = useOnlyMineAndShared();

  // Only applications whose project and call still exist.
  const rows = records
    .map((record) => {
      const entry = projectBank.find((p) => p.id === record.projectId);
      const call = fundingCalls.find((c) => c.id === record.callId);
      const program = call ? findProgram(call.programId) : undefined;
      return entry && call && program ? { record, entry, call, program } : null;
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .filter((r) => !onlyMineAndShared || isProjectRelevantToUser(r.entry, currentUser, orgUnitsAll));

  // Hitta finansiering matches the same set of projects.
  const matchedProjects = useMemo(
    () => (onlyMineAndShared ? projectBank.filter((p) => isProjectRelevantToUser(p, currentUser, orgUnitsAll)) : projectBank),
    [onlyMineAndShared, projectBank, currentUser, orgUnitsAll]
  );

  const count = (pred: (r: ApplicationRecord) => boolean) => rows.filter((r) => pred(r.record)).length;
  const inGroup = (group: ApplicationStatusGroup) => (r: ApplicationRecord) => APPLICATION_STATUS_GROUPS[group].includes(r.status);
  const stats: { key: ApplicationStatusGroup; label: string; value: number }[] = [
    { key: "draft", label: a.statActive, value: count(inGroup("draft")) },
    { key: "withFunder", label: a.statWithFunder, value: count(inGroup("withFunder")) },
    { key: "awarded", label: a.statAwarded, value: count(inGroup("awarded")) },
    { key: "closed", label: a.statClosed, value: count(inGroup("closed")) },
  ];

  // In progress: soonest deadline first. Decided / all: most recently
  // touched first.
  const visible = rows
    .filter((r) =>
      filter === "all"
        ? true
        : filter === "active"
        ? isActiveApplication(r.record)
        : filter === "decided"
        ? !isActiveApplication(r.record)
        : inGroup(filter)(r.record)
    )
    .sort((x, y) =>
      filter === "active"
        ? callDeadlineMonths(x.call) - callDeadlineMonths(y.call)
        : x.record.updatedAt < y.record.updatedAt
        ? 1
        : -1
    );

  const filters: { key: Filter; label: string }[] = [
    { key: "active", label: a.filterActive },
    { key: "decided", label: a.filterDecided },
    { key: "all", label: a.filterAll },
  ];

  return (
    <>
      <Header />
      <main className="section">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{a.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{a.subtitle}</p>
          </div>
          <Link
            href="/ansokan"
            className="shrink-0 rounded-md bg-gold-500 px-4 py-2 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400"
          >
            + {t.nav.demo}
          </Link>
        </div>

        {/* Applies to the whole page — the applications and the projects
            matched under Hitta finansiering — and is remembered across
            Översikt, Projekt, Ansöka and Rapportera. */}
        <label className="mt-4 flex items-center gap-2 text-sm font-semibold text-navy-700">
          <input type="checkbox" checked={onlyMineAndShared} onChange={(e) => setOnlyMineAndShared(e.target.checked)} />
          {t.grants.onlyMineAndSharedToggle}
        </label>

        <section id="applications" className="mt-8" aria-labelledby="applications-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="applications-heading" className="text-lg font-bold text-navy-800">
              {a.myApplicationsTitle}
            </h2>
          </div>

          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {stats.map((st) => {
              const active = filter === st.key;
              return (
                <button
                  key={st.key}
                  type="button"
                  aria-pressed={active}
                  // A second click goes back to the default list.
                  onClick={() => setFilter(active ? "active" : st.key)}
                  className={`rounded-xl border p-4 text-left transition ${
                    active ? "border-navy-800 bg-navy-800 text-white" : "border-navy-100 bg-white hover:border-navy-300 hover:shadow-sm"
                  }`}
                >
                  <p className={`text-2xl font-extrabold ${active ? "text-white" : "text-navy-900"}`}>{hydrated ? st.value : "…"}</p>
                  <p className={`text-xs ${active ? "text-navy-200" : "text-navy-500"}`}>{st.label}</p>
                </button>
              );
            })}
          </div>

          <div role="tablist" aria-label={a.myApplicationsTitle} className="mt-4 flex gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  filter === f.key ? "bg-navy-800 text-white" : "border border-navy-200 text-navy-600 hover:bg-navy-50"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {hydrated && visible.length === 0 ? (
            <div className="mt-4 rounded-xl border border-dashed border-navy-200 p-6 text-center">
              <p className="text-sm font-semibold text-navy-700">{a.noApplications}</p>
              <p className="mt-1 text-sm text-navy-500">{a.noApplicationsHint}</p>
            </div>
          ) : (
            <ul className="mt-4 space-y-2">
              {visible.map(({ record, entry, call, program }) => {
                const months = callDeadlineMonths(call);
                const href = `/ansokan?project=${entry.id}&call=${call.id}&application=${encodeURIComponent(record.id)}`;
                return (
                  <li
                    key={record.id}
                    className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-navy-100 bg-white p-4"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-xs font-bold text-white">
                        {program.logoLetter}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-center gap-2 text-xs font-semibold uppercase text-navy-400">
                          <Link href={`/projekt/${entry.id}`} className="hover:underline">
                            {lang === "sv" ? entry.title_sv : entry.title_en}
                          </Link>
                          <UnreadDot entityKey={`application:${record.id}`} />
                        </p>
                        <p className="font-semibold text-navy-800">{lang === "sv" ? call.title_sv : call.title_en}</p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-navy-400">
                          <ApplicationStatusBadge status={record.status} />
                          {isActiveApplication(record) && (
                            <span className={months <= 1 ? "font-semibold text-amber-700" : ""}>{bv.deadlineInMonths(months)}</span>
                          )}
                          <span>{at.updatedAt(new Date(record.updatedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-US"))}</span>
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      {record.status === "awarded" && !record.awardedProjectId && (
                        <Link
                          href={`/projekt/${entry.id}#applications-title`}
                          className="rounded-md bg-green-700 px-3 py-1.5 text-sm font-semibold text-white hover:bg-green-800"
                        >
                          {a.registerGrant}
                        </Link>
                      )}
                      {record.awardedProjectId && (
                        <Link href={`/stod/${record.awardedProjectId}`} className="text-sm font-semibold text-navy-700 hover:underline">
                          {at.viewAwardedLink}
                        </Link>
                      )}
                      <Link
                        href={href}
                        className="rounded-md bg-navy-800 px-3 py-1.5 text-sm font-semibold text-white transition hover:bg-navy-700"
                      >
                        {isActiveApplication(record) ? at.resume : at.open}
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section className="mb-16 mt-12 border-t border-navy-100 pt-8" aria-labelledby="find-funding-heading">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 id="find-funding-heading" className="text-lg font-bold text-navy-800">
              {a.findFundingTitle}
            </h2>
            <Link href="/eu-databas" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
              {a.browseEuDatabase}
            </Link>
          </div>
          <div className="mt-2">
            <FundingOpportunities projects={matchedProjects} />
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

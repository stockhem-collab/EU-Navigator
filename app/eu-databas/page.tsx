"use client";

import { callDeadlineMonths } from "@/lib/data/fundingCalls";
import CallStatusBadge, { CallDates, GrantRangeText } from "@/components/calls/CallStatusBadge";
import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import KnowledgeTabs from "@/components/KnowledgeTabs";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms } from "@/lib/data/fundingPrograms";
import { callThemes, findFundTheme, fundThemeLabel, fundThemes, isFundTheme } from "@/lib/data/fundThemes";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { fmtSEK } from "@/lib/format";
import { FundingCall, FundingProgram, FundTheme } from "@/lib/types";

// useSearchParams needs a Suspense boundary for the static build.
export default function EuDatabasePage() {
  return (
    <Suspense fallback={null}>
      <EuDatabaseInner />
    </Suspense>
  );
}

const byStatus = (a: FundingProgram, b: FundingProgram) =>
  a.status === b.status ? 0 : a.status === "active" ? -1 : 1;

function EuDatabaseInner() {
  const { t, lang } = useLanguage();
  const db = t.euDatabase;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { all: fundingCalls } = useFundingCalls();
  const [search, setSearch] = useState("");
  // The theme lives in the URL (?tema=…) so a themed view can be shared.
  const temaParam = searchParams.get("tema");
  const theme: FundTheme | null = isFundTheme(temaParam) ? temaParam : null;

  const selectTheme = (next: FundTheme | null) => {
    router.replace(next ? `/eu-databas?tema=${next}` : "/eu-databas", { scroll: false });
  };

  const query = search.trim().toLowerCase();
  // Grouped the way eufonder.se groups them: a fund shows under a theme
  // when it finances that theme itself or one of its calls does, and then
  // only with the calls that fit the theme.
  const callsFor = (program: FundingProgram): FundingCall[] =>
    fundingCalls.filter((c) => c.programId === program.id && (!theme || callThemes(c).includes(theme)));
  const filteredPrograms = fundingPrograms.filter(
    (p) =>
      (query ? `${p.name_sv} ${p.name} ${p.description_sv} ${p.description_en}`.toLowerCase().includes(query) : true) &&
      (!theme || p.themes.includes(theme) || callsFor(p).length > 0)
  );

  const renderCard = (program: FundingProgram) => {
    const calls = callsFor(program);
    const docCount = calls.reduce((sum, c) => sum + c.documents.length, 0);
    // A programme with exactly one call has nothing to choose
    // between, so the programme-level page is a pointless extra
    // click — link straight to that call and show its deadline
    // and grant size right here instead of making someone click
    // through just to see them. A programme with several calls
    // still needs that page as a real selection step.
    const singleCall = calls.length === 1 ? calls[0] : null;
    return (
      <Link
        key={program.id}
        href={singleCall ? `/eu-databas/${program.id}/${singleCall.id}` : `/eu-databas/${program.id}`}
        data-testid={`program-card-${program.id}`}
        className={`rounded-xl border bg-white p-6 transition hover:border-navy-300 hover:shadow-sm ${
          program.status === "legacy" ? "border-navy-100 opacity-70" : "border-navy-100"
        }`}
      >
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-sm font-bold text-white">
            {program.logoLetter}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-bold text-navy-900">{lang === "sv" ? program.name_sv : program.name}</h2>
              {program.status === "legacy" && <span className="badge bg-navy-100 text-navy-500">{db.closedProgrammeBadge}</span>}
              {singleCall && (
                <CallStatusBadge call={singleCall} />
              )}
            </div>
            <p className="mt-1 text-sm text-navy-600">{lang === "sv" ? program.description_sv : program.description_en}</p>
            {!theme && program.themes.length > 0 && (
              <p className="mt-2 text-xs text-navy-500">
                <span className="font-semibold">{db.themesLabel}:</span>{" "}
                {program.themes.map((th) => fundThemeLabel(th, lang)).join(", ")}
              </p>
            )}
          </div>
        </div>
        {singleCall ? (
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-1 text-xs font-semibold text-navy-400">
            <span>{db.deadlineIn(callDeadlineMonths(singleCall))}</span>
            <CallDates call={singleCall} />
            <span>
              {db.grantRangeLabel}: <GrantRangeText call={singleCall} />
            </span>
            <span>{db.documentsCount(docCount)}</span>
          </div>
        ) : (
          <div className="mt-4 flex gap-4 text-xs font-semibold text-navy-400">
            <span>{db.callsCount(calls.length)}</span>
            <span>{db.documentsCount(docCount)}</span>
          </div>
        )}
      </Link>
    );
  };

  const chipClass = (active: boolean) =>
    `rounded-full px-3 py-1.5 text-xs font-semibold transition ${
      active ? "bg-navy-800 text-white" : "border border-navy-200 text-navy-600 hover:bg-navy-50"
    }`;

  const themeInfo = theme ? findFundTheme(theme) : null;
  const shared = filteredPrograms.filter((p) => p.management === "shared").sort(byStatus);
  const direct = filteredPrograms.filter((p) => p.management === "direct").sort(byStatus);

  return (
    <>
      <Header />
      <main className="section">
        <KnowledgeTabs />
        <h1 className="text-2xl font-bold text-navy-900">{db.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{db.subtitle}</p>

        <div role="group" aria-label={db.themeFilterLabel} className="mt-6 flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-semibold uppercase text-navy-400">{db.themeFilterLabel}</span>
          <button type="button" aria-pressed={!theme} onClick={() => selectTheme(null)} className={chipClass(!theme)}>
            {db.allThemes}
          </button>
          {fundThemes.map((th) => (
            <button
              key={th.id}
              type="button"
              aria-pressed={theme === th.id}
              onClick={() => selectTheme(th.id)}
              className={chipClass(theme === th.id)}
            >
              {lang === "sv" ? th.label_sv : th.label_en}
            </button>
          ))}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={db.searchProgramsPlaceholder}
          className="mt-6 w-full max-w-sm rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        />

        {filteredPrograms.length === 0 && <p className="mt-6 text-sm text-navy-500">{db.noProgramsMatch}</p>}

        {themeInfo ? (
          <>
            <div className="mt-8">
              <h2 className="text-xl font-bold text-navy-900">{lang === "sv" ? themeInfo.label_sv : themeInfo.label_en}</h2>
              <p className="mt-1 text-sm text-navy-600">
                {lang === "sv" ? themeInfo.description_sv : themeInfo.description_en}
              </p>
            </div>
            {shared.length > 0 && (
              <section className="mt-6">
                <h3 className="text-lg font-bold text-navy-900">
                  {db.sharedFundsTitle(lang === "sv" ? themeInfo.label_sv : themeInfo.label_en)}
                </h3>
                <p className="mt-1 text-xs text-navy-500">{db.sharedFundsHint}</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">{shared.map(renderCard)}</div>
              </section>
            )}
            {direct.length > 0 && (
              <section className="mt-10">
                <h3 className="text-lg font-bold text-navy-900">{db.directFundsTitle}</h3>
                <p className="mt-1 text-xs text-navy-500">{db.directFundsHint}</p>
                <div className="mt-4 grid gap-5 sm:grid-cols-2">{direct.map(renderCard)}</div>
              </section>
            )}
          </>
        ) : (
          <div className="mt-8 grid gap-5 sm:grid-cols-2">{[...filteredPrograms].sort(byStatus).map(renderCard)}</div>
        )}
      </main>
      <Footer />
    </>
  );
}

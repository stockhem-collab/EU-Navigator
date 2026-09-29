"use client";

import { useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MatchResult } from "@/lib/types";
import { fmtSEK } from "@/lib/format";

interface Props {
  matches: MatchResult[];
  onSelect: (match: MatchResult) => void;
  onBack: () => void;
}

export default function MatchResults({ matches, onSelect, onBack }: Props) {
  const { t } = useLanguage();
  const results = t.demo.results;
  const [showLowRelevance, setShowLowRelevance] = useState(false);

  // The scoring engine already classifies every match into proceed/consider
  // ("recommendation" !== "low") vs. genuinely low relevance — reusing that
  // instead of a second, separate cutoff keeps this split consistent with
  // what the badge on each card already says. As the call catalogue grows
  // (imports, new programmes), this keeps the primary list from becoming an
  // undifferentiated wall of results dominated by poor fits.
  const recommended = matches.filter((m) => m.recommendation !== "low");
  const lowRelevance = matches.filter((m) => m.recommendation === "low");

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{results.title}</h1>
          <p className="mt-1 text-sm text-navy-600">{results.subtitle(matches.length)}</p>
        </div>
        <button onClick={onBack} className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          ← {results.back}
        </button>
      </div>

      {recommended.length > 0 ? (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase text-navy-400">{results.recommendedSectionTitle}</h2>
          <div className="mt-3 space-y-5">
            {recommended.map((match) => (
              <MatchCard key={match.call.id} match={match} onSelect={onSelect} />
            ))}
          </div>
        </div>
      ) : (
        lowRelevance.length > 0 && (
          <p className="mt-8 rounded-md bg-navy-50 px-4 py-3 text-sm text-navy-600">{results.noRecommendedMatches}</p>
        )
      )}

      {lowRelevance.length > 0 && (recommended.length === 0 || showLowRelevance) && (
        <div className="mt-8">
          {recommended.length > 0 && (
            <h2 className="text-sm font-semibold uppercase text-navy-400">{results.lowRelevanceSectionTitle(lowRelevance.length)}</h2>
          )}
          <div className="mt-3 space-y-5">
            {lowRelevance.map((match) => (
              <MatchCard key={match.call.id} match={match} onSelect={onSelect} />
            ))}
          </div>
        </div>
      )}

      {lowRelevance.length > 0 && recommended.length > 0 && (
        <button
          type="button"
          onClick={() => setShowLowRelevance((v) => !v)}
          className="mt-6 text-sm font-semibold text-navy-600 hover:text-navy-900"
        >
          {showLowRelevance ? results.hideLowRelevanceButton : results.showLowRelevanceButton(lowRelevance.length)}
        </button>
      )}
    </div>
  );
}

function MatchCard({ match, onSelect }: { match: MatchResult; onSelect: (match: MatchResult) => void }) {
  const { t, lang } = useLanguage();
  const results = t.demo.results;

  // Opens the call's own EU-databas page in a new tab: the match results
  // live only in the demo page's React state, so navigating away in the same
  // tab would throw away the user's just-computed matches.
  const callHref = `/eu-databas/${match.call.programId}/${match.call.id}`;

  const recommendationLabel = (rec: MatchResult["recommendation"]) => {
    if (rec === "proceed") return results.recommendationProceed;
    if (rec === "consider") return results.recommendationConsider;
    return results.recommendationLow;
  };

  const recommendationStyle = (rec: MatchResult["recommendation"]) => {
    if (rec === "proceed") return "bg-green-100 text-green-800";
    if (rec === "consider") return "bg-gold-100 text-gold-800";
    return "bg-navy-100 text-navy-600";
  };

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-sm font-bold text-white">
            {match.program.logoLetter}
          </span>
          <div>
            <p className="text-xs font-semibold uppercase text-navy-400">{match.program.shortName}</p>
            <h2 className="font-bold text-navy-900">
              <Link
                href={callHref}
                target="_blank"
                rel="noopener noreferrer"
                title={results.viewCallDetailsHint}
                className="hover:underline"
              >
                {lang === "sv" ? match.call.title_sv : match.call.title_en}
              </Link>
            </h2>
            <Link
              href={callHref}
              target="_blank"
              rel="noopener noreferrer"
              title={results.viewCallDetailsHint}
              className="mt-1 inline-block text-sm font-semibold text-navy-600 hover:text-navy-900"
            >
              {results.viewCallDetails} ↗<span className="sr-only"> ({results.viewCallDetailsHint})</span>
            </Link>
          </div>
        </div>
        <div className="text-right">
          <p className="text-2xl font-extrabold text-navy-900">
            {match.score}% <span className="text-sm font-normal text-navy-500">{results.matchLabel}</span>
          </p>
          <p aria-hidden className="mt-1 text-gold-500">
            {"★".repeat(match.stars)}
            <span className="text-navy-200">{"★".repeat(5 - match.stars)}</span>
          </p>
        </div>
      </div>

      <ul className="mt-4 space-y-1.5 border-t border-navy-50 pt-4">
        {match.rationale.map((line, i) => (
          <li
            key={i}
            className={`text-sm ${
              line.type === "warning" ? "text-amber-700" : line.type === "positive" ? "text-green-700" : "text-navy-500"
            }`}
          >
            {line.type === "positive" ? "✓ " : line.type === "warning" ? "⚠ " : "· "}
            {lang === "sv" ? line.text_sv : line.text_en}
          </li>
        ))}
      </ul>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-navy-50 pt-4">
        <div className="flex items-center gap-6 text-sm">
          <span className={`badge ${recommendationStyle(match.recommendation)}`}>{recommendationLabel(match.recommendation)}</span>
          <span className="text-navy-500">
            {results.estFundingLabel}: {fmtSEK(match.estimatedFundingSEK[0], lang)}–{fmtSEK(match.estimatedFundingSEK[1], lang)}
          </span>
        </div>
        <button
          onClick={() => onSelect(match)}
          className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
        >
          {results.startApplication}
        </button>
      </div>
    </div>
  );
}

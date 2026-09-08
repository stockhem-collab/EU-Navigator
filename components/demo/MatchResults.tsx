"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MatchResult } from "@/lib/types";

function fmtSEK(n: number, lang: "sv" | "en"): string {
  const millions = n / 1_000_000;
  const formatted = millions.toLocaleString(lang === "sv" ? "sv-SE" : "en-US", {
    maximumFractionDigits: 1,
  });
  return lang === "sv" ? `${formatted} mnkr` : `SEK ${formatted}M`;
}

interface Props {
  matches: MatchResult[];
  onSelect: (match: MatchResult) => void;
  onBack: () => void;
}

export default function MatchResults({ matches, onSelect, onBack }: Props) {
  const { t, lang } = useLanguage();
  const results = t.demo.results;

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

      <div className="mt-8 space-y-5">
        {matches.map((match) => (
          <div key={match.program.id} className="rounded-xl border border-navy-100 bg-white p-6 shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-navy-700 text-sm font-bold text-white">
                  {match.program.logoLetter}
                </span>
                <div>
                  <h2 className="font-bold text-navy-900">
                    {lang === "sv" ? match.program.name_sv : match.program.name}
                  </h2>
                  <p className="mt-1 max-w-md text-sm text-navy-600">
                    {lang === "sv" ? match.program.description_sv : match.program.description_en}
                  </p>
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
                    line.type === "warning"
                      ? "text-amber-700"
                      : line.type === "positive"
                      ? "text-green-700"
                      : "text-navy-500"
                  }`}
                >
                  {line.type === "positive" ? "✓ " : line.type === "warning" ? "⚠ " : "· "}
                  {lang === "sv" ? line.text_sv : line.text_en}
                </li>
              ))}
            </ul>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-4 border-t border-navy-50 pt-4">
              <div className="flex items-center gap-6 text-sm">
                <span
                  className={`badge ${recommendationStyle(match.recommendation)}`}
                >
                  {recommendationLabel(match.recommendation)}
                </span>
                <span className="text-navy-500">
                  {results.estFundingLabel}: {fmtSEK(match.estimatedFundingSEK[0], lang)}–
                  {fmtSEK(match.estimatedFundingSEK[1], lang)}
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
        ))}
      </div>
    </div>
  );
}

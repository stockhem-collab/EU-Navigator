"use client";

import { useEffect } from "react";

// Deliberately self-contained (no useLanguage/translations dictionary, no
// other app imports beyond Tailwind classes) — an error boundary is exactly
// the place where depending on more app machinery is a liability: if
// something upstream of this route is what broke, the boundary itself
// should still render. Bilingual by just showing both languages at once
// rather than relying on LanguageContext.
export default function RouteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-white px-6 text-center">
      <p className="text-xs font-semibold uppercase tracking-wide text-navy-400">EU Navigator</p>
      <h1 className="text-2xl font-bold text-navy-900">Något gick fel / Something went wrong</h1>
      <p className="max-w-md text-sm text-navy-600">
        Ett oväntat fel inträffade i den här vyn. Prova att försöka igen eller gå till startsidan.
        <br />
        An unexpected error occurred in this view. Try again, or go to the homepage.
      </p>
      <div className="flex gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
        >
          Försök igen / Try again
        </button>
        <a
          href="/"
          className="rounded-md border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-600 transition hover:bg-navy-50"
        >
          Startsida / Homepage
        </a>
      </div>
    </div>
  );
}

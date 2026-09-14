"use client";

import { useEffect } from "react";

// Only fires if the root layout itself throws (very rare — e.g. a broken
// provider). Per Next.js, global-error.js replaces the entire root layout
// when active, so it must render its own <html>/<body>; it can't rely on
// anything layout.tsx would normally provide (fonts, LanguageProvider, …).
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    // eslint-disable-next-line no-console
    console.error(error);
  }, [error]);

  return (
    <html lang="sv">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            display: "flex",
            minHeight: "100vh",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: "0 24px",
            textAlign: "center",
          }}
        >
          <p style={{ fontSize: 12, fontWeight: 600, textTransform: "uppercase", color: "#94a3b8", margin: 0 }}>
            EU Navigator
          </p>
          <h1 style={{ fontSize: 22, fontWeight: 700, color: "#0f172a", margin: 0 }}>
            Något gick fel / Something went wrong
          </h1>
          <p style={{ maxWidth: 420, fontSize: 14, color: "#475569" }}>
            Applikationen kunde inte laddas. Prova att ladda om sidan.
            <br />
            The application failed to load. Try reloading the page.
          </p>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              borderRadius: 6,
              background: "#1e293b",
              color: "white",
              border: "none",
              padding: "8px 16px",
              fontSize: 14,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Försök igen / Try again
          </button>
        </div>
      </body>
    </html>
  );
}

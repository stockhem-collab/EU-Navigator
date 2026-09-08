# EU Navigator

A bilingual (Swedish/English) demo web app for **EU Navigator** — a concept
for a municipal SaaS that matches a public-sector organisation's planned
projects against EU funding programmes, explains the match, and walks the
project through an AI-assisted application.

- `/` — the pitch/marketing page: problem, the six-step workflow
  (Plan → Find → Match → Apply → Deliver → Report), personas, and pricing tiers.
- `/demo` — the interactive walkthrough: describe a project → get scored,
  explained matches against a seeded set of EU programmes (LIFE, ERDF, ESF+,
  Interreg, Horizon Europe, Digital Europe, CEF, Erasmus+) → open an
  AI-assisted "application workspace" with a generated project logic and
  reviewer checklist.

No login, no backend, no database — everything runs client-side. The
matching "AI" is a transparent, deterministic scoring function
(`lib/matching/scoreMatch.ts`) rather than a live LLM call, so the demo is
fast, free to run, and always reproducible. Swap in a real Claude API call
or the live EU Funding & Tenders Portal API later without changing the UI.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS. Fully static —
`next build` produces a static export-able site with no server runtime
requirements.

## Run locally

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Deploy to get a live URL (for embedding in APV App)

The fastest path to a public URL is Vercel (built by the makers of
Next.js, free tier is enough for a demo):

1. Push this repository to GitHub (already done if you're reading this from
   the repo).
2. Go to https://vercel.com/new and "Import" this GitHub repository.
3. Leave all settings at their defaults (Vercel auto-detects Next.js) and
   click **Deploy**.
4. After ~1 minute you'll get a URL like `https://eu-navigator-xxxx.vercel.app`.
   Paste that URL into APV App.

Every subsequent push to this branch (or your default branch, once merged)
will automatically redeploy the same URL.

### Alternative: Netlify

Same idea — "Import from Git", framework preset "Next.js", default build
command (`npm run build`) and publish directory are auto-detected.

## Known limitation

`npm audit` flags a couple of Next.js/PostCSS advisories that are only
fully resolved in Next 16, which would require a larger migration. Since
this app has no authentication, no server actions, and no user data, the
practical exposure is low for a demo — but worth revisiting before this
becomes anything more than a pitch/demo site.

## Project structure

```
app/                 Routes (/ and /demo)
components/          UI components (landing sections, demo flow, shared header/footer)
lib/i18n/            Swedish/English translation dictionary + language context
lib/data/            Seed data for EU funding programmes
lib/matching/        Scoring engine + AI-workspace content generator
```

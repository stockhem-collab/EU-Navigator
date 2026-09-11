# EU Navigator

A bilingual (Swedish/English) demo web app for **EU Navigator** — a concept
for a municipal SaaS covering the full external-funding lifecycle:
project idea → matching → fund-specific analysis → application → quality
assurance → decision → delivery → reporting → feedback into future
projects. The core idea: the AI never reasons about "EU grants" in
general — it always works in the context of one specific call and its
documentation.

## The six modules

- **Projektbank** (`/projektbank`) — the municipality's own project ideas,
  needs and planned investments, each with an AI-readiness score and a
  list of what's missing for optimal matching.
- **EU-databas** (`/eu-databas`) — a three-level structure: **Programme**
  (permanent info: purpose, priorities) → **Call/utlysning** (deadline,
  budget, evaluation criteria) → **Documents** (the actual AI context
  package: call text, guide, forms, criteria, budget instructions, FAQ,
  reporting instructions, templates — each flagged when it needs an
  update).
- **Matchningsmotor** — scores a project against every call (not just
  every programme), with a transparent rationale, a gap analysis
  (strengths / gaps + "how to raise the match from X% → Y%"), and an
  Application Readiness Score breakdown.
- **Ansökningsstudio** (inside `/demo`) — once a call is chosen, the AI is
  locked to that call's evaluation criteria. Includes an "Application
  Coach" that scores the project description on Relevance/Impact/Evidence
  and suggests concrete additions, plus a dual-compliance check against
  the organisation's own internal process (`Organisationens regelverk`).
- **Beviljade referensprojekt / "Lär av vinnarna"** (`/referensprojekt`) —
  **real data**: Stockholms stads actual register of 74 EU-funded projects
  2014-2027 (fund, budget, EU share, role, theme), with aggregated
  statistics (share led as project owner, average budget, most common
  theme), reachable standalone or from any call page.
- **Projekt & rapportering** (`/projekt`) — awarded projects, where
  commitments made in the application (indicators, targets) are tracked
  against reported outturn, with an AI comment on any deviation.
- **Datacenter** (`/datacenter`) — the admin/knowledge-hub view: exactly
  what data the AI has access to (project ideas, programmes, calls, open
  calls, reference projects, documents) and what needs attention
  (documents needing an update, projects with incomplete information).

The homepage's three entry points route into this same system depending
on where the user is in the chain: *"Jag har ett projekt"* → `/demo`,
*"Jag har hittat en utlysning"* → `/eu-databas`, *"Jag har fått
finansiering"* → `/projekt`.

## What's real data vs. illustrative example data

- **Real**: `lib/data/referenceProjects.ts` (74 of Stockholms stads actual
  awarded EU projects, 2014-2027, extracted from the city's own "Projekt
  med beviljade medel" documentation), `lib/data/fundingPrograms.ts` (the
  real EU funds/programmes the city tracks and has been awarded from), and
  `lib/data/orgProcess.ts` (the city's real four-phase EU-project process —
  Idea → Application → Delivery → Closure — including its own document
  list per phase, from the city's EU-project handbook).
- **One example, not a system default**: the internal role breakdown
  attached to each `orgProcess` phase (Verksamhet / Stadsledningskontoret /
  Serviceförvaltningen) is Stockholm's own specific internal organisation.
  It's shown labelled as one example of how a municipality *could* divide
  responsibility — every organisation would configure its own equivalent
  (or none) in a real deployment. See `OrgProcessPanel`'s disclaimer text.
- **Still illustrative**: `lib/data/projectBank.ts` (a municipality's own
  in-progress project ideas — inherently invented for a demo, since real
  ones are usually confidential), `lib/data/awardedProjects.ts` (the
  commitments-vs-actuals reporting example), and the specific open
  `FundingCall` deadlines/criteria in `lib/data/fundingCalls.ts` (real
  calls change constantly; wiring this to the live EU Funding & Tenders
  Portal API is the natural next step there).

No login, no backend, no database — everything runs client-side. The
matching, gap analysis, readiness score and Application Coach are all
transparent, deterministic functions (`lib/matching/`) rather than live
LLM calls, so the demo is fast, free to run, and always reproducible.
Swap in real Claude API calls — scoped to a specific call's actual
documents — later without changing the UI.

## Stack

Next.js 14 (App Router) + TypeScript + Tailwind CSS.

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
app/                        Routes: /, /demo, /projektbank(+[id]),
                             /eu-databas(+[programId]+[callId]),
                             /referensprojekt, /projekt(+[id]), /datacenter
components/                 UI components (landing sections, demo flow,
                             shared header/footer/status badge)
lib/i18n/                   Swedish/English translation dictionary + language context
lib/types.ts                Shared data model (Programme/Call/Document,
                             ProjectBankEntry, ReferenceProject,
                             AwardedProject, OrgProcessPhase, matching types)
lib/data/                   Seed data — real programmes (22) and awarded
                             reference projects (74), the real org process,
                             plus illustrative calls/documents, project
                             bank and awarded-project reporting example
lib/matching/                Scoring engine, gap analysis, readiness score,
                             application coach, workspace content generator
```

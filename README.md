# EU Navigator

A bilingual (Swedish/English) demo web app for **EU Navigator** — a concept
for a municipal SaaS covering the full external-funding lifecycle:
project idea → matching → fund-specific analysis → application → quality
assurance → decision → delivery → reporting → feedback into future
projects. The core idea: the AI never reasons about "EU grants" in
general — it always works in the context of one specific call and its
documentation.

## How the app is organised

One main tab per purpose, following the chain *project → application →
grant → reports*:

- **Översikt** (`/oversikt`) — what needs doing now: applications in
  progress, reports needing action or coming up, open tasks and unread
  notifications, across all projects.
- **Projekt** (`/projekt`, `/projekt/[id]`) — the organisation's projects
  (ideas, needs, planned investments), each with a lifecycle status (idea
  → being scoped → searching for funding → funded → running → completed).
  The project page is the hub: the project's path at a glance, its
  applications, its grants and their reporting, and matching calls.
- **Ansöka** (`/ansok`) — every application across projects by where it
  stands (draft, with the funder, decided), plus *Hitta finansiering*:
  calls matched against the portfolio and the calls the user watches. The
  application workspace itself is `/ansokan`.
- **Rapportera** (`/rapportera`) — every report on every grant: needing
  action (returned or overdue), upcoming, done. A grant
  ("beviljat stöd", `/stod/[id]`) is the funding decision on an awarded
  application, with its own reporting; a project can have several.
- **Kunskapsbank** — EU-databas and Referensprojekt (below).
- **Datacenter** (`/datacenter`) — the portfolio view for leadership
  (economics, projects and applications per status, total awarded) and
  the admin/knowledge-hub view of the data the AI works from.
- **Aviseringar** — the bell at the top right. Derived from the data
  (deadlines within the reminder window, reports returned or overdue,
  calls that fit a project, awarded applications whose grant isn't
  registered yet, tasks due) and from what people do (status changes,
  grants registered, projects shared, calls imported). Per-user settings
  under Inställningar → Aviseringar & bevakningar: per category in the
  app and by e-mail (off / immediately / daily / weekly), only my projects
  or all, and how far ahead to remind. E-mail choices are stored but not
  sent in the demo. See `lib/notifications.ts`.

The demo starts with three example applications (`lib/data/applications.ts`):
the awarded applications behind the two example grants, and one with the
funder. Confirmations (remove, reset, register a grant) are asked in the
page itself (`components/ConfirmButton.tsx`), never with the browser's
blocking `window.confirm`.

Old addresses (`/demo`, `/projektbank`, `/bevakning`, grants under
`/projekt/ap-…`) redirect to the new ones (`next.config.mjs`).

## The modules behind it

- **EU-databas** (`/eu-databas`) — a three-level structure: **Programme**
  (permanent info: purpose, priorities) → **Call/utlysning** (deadline,
  budget, evaluation criteria) → **Documents** (the actual AI context
  package: call text, guide, forms, criteria, budget instructions, FAQ,
  reporting instructions, templates — each flagged when it needs an
  update).
- **Matchningsmotor** — scores a project against every call (not just
  every programme), with a transparent rationale, a gap analysis
  (strengths / gaps + "how to raise the match from X% → Y%"), and an
  Application Readiness Score breakdown. The score itself is weighted by
  that call's own real `evaluationCriteria` (e.g. Relevance 30 / Impact 30 /
  Quality 20 / Implementation 20 points) rather than one fixed formula
  applied to every call — see the comment on `criteriaWeights` in
  `lib/matching/scoreMatch.ts`. Beyond thematic fit it checks eligibility
  (applicant type from the organisation profile, the call's programme
  area), the type of activity the call funds, target group, the requested
  grant (not the total budget) against the grant range, partnership reach
  in number of countries, and project start against the expected funding
  decision. A call the organisation isn't eligible for is capped at a low
  score however well it fits thematically.
- **Ansökningsstudio** (`/ansokan`) — once a call is chosen, the AI is
  locked to that call's evaluation criteria. The assessment (application
  readiness, "Application Coach" on Relevance/Impact/Evidence, reviewer
  notes) reads the application's own text — the project description plus
  every section the user has written or edited, not untouched AI
  suggestions — and is recomputed as the user types, showing the change
  since the application was opened, what each section contributes, and
  which section each remaining action belongs in. The project page shows
  the same readiness measure for the project against its best match.
  Includes a dual-compliance check against the organisation's own
  internal process (`Organisationens regelverk`).
- **Beviljade referensprojekt / "Lär av vinnarna"** (`/referensprojekt`) —
  **real data**: an anonymised municipality's actual register of 74
  EU-funded projects 2014-2027 (fund, budget, EU share, role, theme), with aggregated
  statistics (share led as project owner, average budget, most common
  theme), reachable standalone or from any call page.
- **Beviljat stöd & rapportering** (`/stod/[id]`) — grants, where
  commitments made in the application (indicators, targets) are tracked
  against reported outturn, with an AI comment on any deviation.
- **Datacenter** (`/datacenter`) — the admin/knowledge-hub view: exactly
  what data the AI has access to (project ideas, programmes, calls, open
  calls, reference projects, documents) and what needs attention
  (documents needing an update, projects with incomplete information).

The homepage's three entry points route into this same system depending
on where the user is in the chain: *"Jag har ett projekt"* → `/ansokan`,
*"Jag har hittat en utlysning"* → `/eu-databas`, *"Jag har fått
finansiering"* → `/rapportera`.

## What's real data vs. illustrative example data

- **Real, source anonymised**: `lib/data/fundedProjects.ts` (74 of a real
  municipality's actual awarded EU projects, 2014-2027, extracted from its
  own "Projekt med beviljade medel" documentation — organisation names,
  contact emails and source links replaced with a fictional "Exempelstad"
  so the source municipality isn't identifiable), and `lib/data/fundingPrograms.ts`
  (the real EU funds/programmes that municipality tracks and has been
  awarded from).
- **Still illustrative**: `lib/data/projectBank.ts` (a municipality's own
  in-progress project ideas — inherently invented for a demo, since real
  ones are usually confidential), `lib/data/grants.ts` (the
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

## Testing

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # next lint
npm run test:unit   # matching/scoring/CSV-import logic, no browser needed
npm run test:e2e    # Playwright, drives the real app in Chromium
npm test            # both test projects together
```

`npm run test:e2e` needs Chromium installed once via `npx playwright
install chromium` (or `--with-deps chromium` on a fresh Linux machine/CI
runner). The GitHub Actions workflow in `.github/workflows/ci.yml` runs all
of the above — lint, typecheck, build, unit tests, then e2e tests — on every
push and pull request.

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
app/                        Routes: /, /oversikt, /projekt(+[id]), /ansok,
                             /ansokan (workspace), /rapportera, /stod/[id],
                             /eu-databas(+[programId]+[callId]),
                             /referensprojekt, /datacenter, /installningar
components/                 UI components (landing sections, demo flow,
                             shared header/footer/status badge)
lib/i18n/                   Swedish/English translation dictionary + language context
lib/types.ts                Shared data model (Programme/Call/Document,
                             ProjectBankEntry, ApplicationRecord, Grant,
                             FundedProject, matching types)
lib/data/                   Seed data — real programmes (22) and awarded
                             reference projects (74), plus illustrative
                             calls/documents, project bank and
                             grant reporting example
lib/matching/                Scoring engine, gap analysis, readiness score,
                             application coach, workspace content generator
tests/unit/                  Logic-only tests (no browser) for the matching/
                             readiness/CSV-import engines
tests/e2e/                   Playwright tests driving the real app
```

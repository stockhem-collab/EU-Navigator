# EU Navigator — target data model (v2)

This supersedes the first draft of this document. It folds in a second,
more detailed proposal — closer to what a backend engineer would actually
build — covering the full chain **idea → match → application → award →
delivery → reporting**, not just the funding-database half. The two designs
mostly agree; where they didn't, the decision and the reasoning are called
out explicitly under "Design decisions" (§7) rather than silently picked.

## 0. Guiding structure

```
EU_PROGRAM
   │
   ├── FUND (optional sub-programme level)
   │        │
   │        └── CALL
   │              │
   │              ├── CALL_REQUIREMENT (eligibility)
   │              ├── EVALUATION_CRITERION
   │              ├── APPLICATION_REQUIREMENT_DEFINITION
   │              └── REPORTING_REQUIREMENT_DEFINITION
   │
   └── FUNDED_PROJECT ── PROJECT_PARTNER ── ORGANISATION
                              │
                              ▼
                        FUNDED_PROJECT_RESULT

        CUSTOMER ── CUSTOMER_PROJECT ── PROJECT_TAG
                          │        │
                          │        ├──► MATCH ◄────────── CALL
                          │        └──► SIMILAR_PROJECT ◄─ FUNDED_PROJECT
                          ▼
                     APPLICATION ── APPLICATION_SECTION
                          │
                          ▼ (once awarded)
              PROJECT_DELIVERABLE · PROJECT_INDICATOR · REPORT
```

`Call` is the hub, but the point of the model is that it hangs together end
to end: a call connects both backward (which past `FundedProject`s were
awarded under it, or under its programme) and forward (which `Application`s
are currently targeting it), and a `CustomerProject`'s journey through
`Match → Application → award → delivery → reporting` is one continuous
thread, not five disconnected tables.

Two data classes, as before:

- **Reference data** (shared, read-mostly, synced from external sources):
  `Program`, `Fund`, `Call` + its four requirement/criterion children,
  `FundedProject`, `Organisation`, `ProjectPartner`, `FundedProjectResult`.
- **Tenant data** (per-customer, read/write, the actual product):
  `Customer`, `CustomerProject`, `ProjectTag`, `Match`, `SimilarProject`,
  `Application`, `ApplicationSection`, `ProjectDeliverable`,
  `ProjectIndicator`, `Report`.

Plus three cross-cutting layers: `Document` (attachable to almost anything),
`KnowledgeChunk` (RAG index), and a raw-ingestion layer (§6).

---

## 1. Reference data

### 1.1 `Program`

| Field | Type | Notes |
|---|---|---|
| `id` | PK | e.g. `life` |
| `name`, `description` | text | Source language as published (usually EN); see §7.1 on bilingual fields. |
| `programme_period` | `"2021-2027" \| "2014-2020"` | |
| `managing_authority` | string | e.g. "CINEA", "Tillväxtverket", "ESF-rådet". |
| `management_type` | `"direct" \| "shared" \| "indirect"` | New vs. v1 — the application process differs sharply by type, worth branching UI/logic on. |
| `total_budget_eur` | number, nullable | |
| `geographic_scope`, `sectors`, `keywords`, `typical_co_financing_rate`, `typical_duration_years` | as v1 | Kept — this is our own matching taxonomy, orthogonal to source metadata. |
| `target_groups` | string[] | Structured (municipality/region/university/company/NGO/agency), not free text. |
| `source_system`, `external_id`, `source_url`, `last_synced_at` | as v1 | |

### 1.2 `Fund` (sub-programme) — optional level

Not every programme has this (Erasmus+ mostly doesn't; LIFE and Interreg do).
`Call.fund_id` is **nullable** — populate it only where the source data
actually exposes a sub-programme, don't force a placeholder.

`id`, `program_id`, `name`, `description`, `policy_area`, `objectives`,
`eligible_geographies`, `eligible_applicants`, `co_financing_default`.

### 1.3 `Call`

| Field | Type | Notes |
|---|---|---|
| `id` | PK | |
| `program_id`, `fund_id` (nullable) | FK | |
| `external_call_id` | string, nullable | The source's own ID. |
| `title`, `short_description` (AI-generated), `full_description` (verbatim from source) | text | Three separate fields on purpose — our own summary must never silently overwrite the source text. |
| `status` | `"upcoming" \| "open" \| "closed"` | |
| `opening_date`, `deadline` | date | **Absolute dates**, not v1's relative `deadlineMonthsFromNow` — that only worked for a seeded demo. |
| `budget_total`, `currency`, `grant_min`, `grant_max`, `co_financing_rate` | number/enum | |
| `project_duration_min`, `project_duration_max` | months | |
| `themes` | string[] (structured taxonomy) | Not free text — reuses the existing `Sector`-style enum plus an extensible tag list. |
| `target_groups` | string[] | Structured, same taxonomy as `Program.target_groups`. |

### 1.4 `CallRequirement` (eligibility)

| Field | Type | Notes |
|---|---|---|
| `id`, `call_id` | | |
| `requirement_type` | `"applicant" \| "geography" \| "consortium" \| "finance" \| "project_duration" \| "activity" \| "state_aid" \| "organisation_type"` | |
| `description` | text | Human-readable, shown as-is. |
| `mandatory` | boolean | |
| `min_partners`, `min_countries`, `applicant_types[]`, `min_budget`, `max_budget` | typed columns, all nullable | **Hybrid approach** (see §7.2): the common, genuinely structured checks get real columns so the matching engine can query them directly, instead of everything living inside one opaque rule blob. |
| `machine_rule` | JSON, nullable | Escape hatch for the long tail of requirements that don't fit the typed columns above — e.g. a one-off "at least one partner must be from an outermost region." Kept deliberately rare. |
| `source_reference` | string | Where in the call text this came from, for audit/trust. |

### 1.5 `EvaluationCriterion`

`id`, `call_id`, `name`, `description`, `weight`, `max_score`, `min_score`,
`source_reference` — unchanged from the proposal; this already maps 1:1 onto
today's `EvaluationCriterion` in `lib/types.ts`, just normalised into its own
table instead of an embedded array once a real DB exists.

### 1.6 `ApplicationRequirementDefinition`

`id`, `call_id`, `section`, `question`, `instructions`, `max_characters`,
`mandatory`, `attachment_required`, `template_document_id` (FK → `Document`).
One row per question a real application form asks — this is what lets the
system reconstruct the actual application structure instead of only
generating a generic project-logic table.

### 1.7 `ReportingRequirementDefinition`

`id`, `program_id` (nullable), `call_id` (nullable), `requirement_type`,
`description`, `frequency`, `deadline_rule`, `evidence_required`,
`template_document_id`. This is the *definition* of an obligation (e.g.
"progress report every 6 months"); the *instance* of an actual submitted
report against it is `Report` (§2.6) — keeping these separate was one of the
sharper points in the newer proposal and is worth preserving: a definition
belongs to the programme/call (reference data), an instance belongs to one
customer's `Application` (tenant data).

### 1.8 `FundedProject`

Supersedes v1's merge of `ReferenceProject`+`AwardedProject`; same idea, now
with the AI-enrichment columns and full field set from the proposal:

`id`, `external_project_id`, `call_id` (nullable — often unknown for older
records), `program_id`, `title`, `acronym`, `description`, `objectives`,
`activities`, `expected_results`, `actual_results`, `start_date`, `end_date`,
`total_budget`, `eu_contribution`, `co_financing_rate`, `status`
(`signed`/`ongoing`/`closed`/`terminated`), `country`, `source_system`,
`source_url`, plus AI-enriched columns `ai_summary`, `ai_topics[]`,
`ai_project_type`, `ai_target_groups[]`, `ai_methods[]`, and an
`embedding_ref` pointing at the vector store (see §6 on why the vector
itself doesn't live in this row).

### 1.9 `Organisation`

Pure reference data now — **not** shared with tenant data (see §7.3 for why
this differs from v1's `kind` flag): `id`, `name`, `organisation_type`
(`municipality`/`region`/`university`/`sme`/`large-enterprise`/`ngo`/
`national-authority`/`research-institute`), `country`, `region` (NUTS),
`city`, `vat_number`, `pic_number`, `website`, `source_system`,
`external_id`.

### 1.10 `ProjectPartner`

`funded_project_id`, `organisation_id`, `role`
(`coordinator`/`partner`/`associated-partner`), `eu_contribution`, `country`.
Answers "which Swedish municipalities got LIFE funding" / "which
universities co-apply with municipalities on climate adaptation" — and is
the basis for a future partner-search feature.

### 1.11 `FundedProjectResult`

`id`, `funded_project_id`, `type` (`deliverable`/`publication`/`patent`/
`demonstrator`/`other`), `title`, `date`, `url`. (Named distinctly from the
tenant-side `ProjectDeliverable` in §2.7, which is forward-looking/planned
rather than historical.)

---

## 2. Tenant data

### 2.1 `Customer`

`id`, `name`, `organisation_number`, `country`, `municipality`,
`customer_type`, `created_at`. The actual account/tenant — e.g. "Kalmar
kommun". This replaces the `tenantId` scattered across v1's tables with one
real entity.

### 2.2 `CustomerProject`

`id`, `customer_id`, `title`, `description`, `problem`, `purpose`,
`objectives`, `target_groups`, `planned_activities`, `expected_results`,
`estimated_budget`, `planned_start`, `planned_end`, `geographic_scope`,
`project_owner`, `department` (plain string — see §7.3, deliberately **not**
a full `Organisation` row), `sector`, `has_international_partner`, `status`:

`IDEA → ASSESSING → FUNDING_SEARCH → APPLICATION → SUBMITTED → APPROVED →
REJECTED → RUNNING → COMPLETED` (supersedes v1's narrower `ProjectStatus`
enum with the real portfolio lifecycle a coordinator actually thinks in).

`share_as_reference_on_award: boolean` (default `false`) — kept from the
first draft and worth restating prominently: **this is the mechanism that
keeps a customer's real project from ever becoming reference data (visible
to other tenants) without their explicit opt-in.** It's the direct
continuation of the anonymisation requirement this whole demo was built
under — as EU Navigator moves from one seeded example municipality to many
real customers, this flag is what stops that guarantee from quietly eroding.

### 2.3 `ProjectTag`

`id`, `customer_project_id`, `tag`, `confidence`, `source` (`ai`/`manual`).
AI-derived structured tags (e.g. "Climate", "Public buildings", "Solar
energy") feeding the matching engine — separate from `sector`, which stays
a single primary classification.

### 2.4 `Match`

`id`, `customer_project_id`, `call_id`, `overall_score`, `eligibility_score`,
`semantic_score`, `strategic_score`, `financial_score`, `timing_score`,
`match_explanation`, `risks[]`, `missing_information[]`, `recommendations[]`,
`model_version`, `created_at`, plus **`inputs_hash`** — a hash of everything
the score was computed from (the call's current requirement/criterion rows +
the customer project's fields). Persisting the match (not recomputing on
every page view) was a good call in the proposal; `inputs_hash` is the piece
needed to make that safe — without it, a call's deadline or requirements
changing after the fact leaves a stale, silently-wrong score on screen. A
background job re-scores any `Match` whose `inputs_hash` no longer matches.

### 2.5 `SimilarProject`

`id`, `customer_project_id`, `funded_project_id`, `similarity_score`,
`similarity_reason`, `model_version`, `computed_at`. Materialises the top-N
"liknande beviljade projekt" results so the UI has something stable and
explainable to render, rather than querying the vector index live on every
visit — the vector index (§6) is the *mechanism*, this table is the
*product surface*, and both are needed.

### 2.6 `Application`

`id`, `customer_project_id`, `call_id`, `status`
(`draft`/`submitted`/`under-review`/`awarded`/`rejected`/`withdrawn`),
`deadline` (snapshotted from the call at creation — an application shouldn't
silently move if the call is later corrected), `responsible_user`,
`readiness_score_at_submission`, `created_at`, `submitted_at`,
`resulting_funded_project_id` (nullable — set once awarded and, if
`share_as_reference_on_award` is true, materialised as a new
`FundedProject`).

### 2.7 `ApplicationSection`

`id`, `application_id`, `application_requirement_id` (FK → the call's own
`ApplicationRequirementDefinition`), `title`, `question`, `ai_draft`,
`user_final` (nullable = "using the AI draft as-is"), `max_characters`,
`status`, `ai_quality_score`. This is exactly today's editable
project-logic drafting in `ApplicationWorkspace` (currently thrown away on
refresh), made durable and broken down per actual application question
instead of one flat set of rows — the more realistic shape once real call
data includes real application forms.

### 2.8 `ProjectDeliverable`

`id`, `application_id`, `name`, `description`, `due_date`, `responsible`,
`status`, `evidence_required`, `evidence_document_id`.

### 2.9 `ProjectIndicator`

`id`, `application_id`, `indicator_name`, `unit`, `baseline`, `target`,
`actual`, `reporting_frequency`.

### 2.10 `Report`

`id`, `application_id`, `reporting_requirement_id` (FK →
`ReportingRequirementDefinition`), `report_type`, `period_start`,
`period_end`, `deadline`, `status`, `submitted_at`, `document_id`.

---

## 3. Cross-cutting

### 3.1 `Document`

`id`, `entity_type` (`program`/`fund`/`call`/`funded_project`/
`customer_project`/`application`/`report`), `entity_id`, `document_type`,
`title`, `url`, `file_ref`, `language`, `version`, `published_at`,
`source_system`. Polymorphic on purpose (§7.4) so a call guide, a Grant
Agreement template, and a submitted final report all live in one place
instead of five near-identical per-relation tables.

### 3.2 `KnowledgeChunk` (RAG)

`id`, `document_id` (nullable), `entity_type`, `entity_id`, `text`,
`embedding_ref`, `metadata`. Chunked EU documents + project descriptions,
retrieved by the AI layer for grounded answers ("vilka kostnader är
stödberättigade?", "krävs internationella partners?") instead of relying on
general model knowledge.

---

## 4. Raw / normalised / enriched layering

Adopted from the newer proposal as a firm architectural rule, not just a
suggestion:

1. **Raw** — `RawIngestionRecord`: `id`, `source_system`,
   `source_entity_type`, `external_id`, `raw_payload` (JSON, verbatim),
   `retrieved_at`, `processed_at`. Every sync job writes here first, before
   any normalisation. This is what lets you always trace a value in
   `FundedProject` back to exactly what the source returned on exactly what
   date — essential once discrepancies or source-side corrections show up.
2. **Normalised** — the domain tables in §1–§3.
3. **AI-enriched** — either extra columns on the normalised row (`ai_summary`,
   `ai_topics`, classification — cheap to read, fine to denormalise) or a
   separate index (`embedding_ref` → vector store, `KnowledgeChunk` → RAG
   store) for anything that isn't a small scalar/array.

---

## 5. Admin/observability view (illustrative)

A future admin screen, once this is a real backend:

**Database**

| Object | Count |
|---|---|
| EU programmes | 47 |
| Funds/sub-programmes | 126 |
| Calls | 8,241 |
| — open now | 684 |
| Funded projects | 186,420 |
| Organisations | 91,340 |
| Documents | 37,550 |

**Data sources**

| Source | Last synced | Status |
|---|---|---|
| Funding & Tenders Portal | today 04:00 | 🟢 |
| CORDIS | today 03:20 | 🟢 |
| Keep.eu | yesterday | 🟢 |
| ESF-rådet | 12 Sep | 🟢 |
| Tillväxtverket | 12 Sep | 🟢 |

Drilling from there into e.g. "Funded projects → Sweden → Municipality →
Digitalisation" is a straightforward filtered query once `ProjectPartner` +
`Organisation` + `FundedProject` + `ProjectTag`-equivalent classification
exist — no new entity needed for it.

---

## 6. MVP phasing

Matches the product narrative *Hitta pengarna → Bedöm möjligheten → Skriv
ansökan → Genomför projektet → Rapportera till EU*, and the newer proposal's
own MVP cut, which is the right one:

| Phase | Ships | Entities |
|---|---|---|
| **1 — Hitta pengarna & bedöm möjligheten** | Programme + call browsing, eligibility/requirement display, funded-project reference library, portfolio + matching | `Program`, `Call`, `CallRequirement`, `FundedProject`, `Organisation`, `Customer`, `CustomerProject`, `Match`, `Document`. `EvaluationCriterion` can stay embedded JSON on `Call` a while longer — it already is in the current prototype. `RawIngestionRecord` is infrastructure that exists from day one of Phase 1, the moment any sync job runs, even though it's invisible to users. |
| **2 — Skriv ansökan** | Real application drafting per question, similar-projects | `ApplicationRequirementDefinition`, `Application`, `ApplicationSection`, `SimilarProject`, `ProjectTag`, `Fund` (only if a Phase-2 programme actually needs the extra level), `ProjectPartner` + `FundedProjectResult` (to power "liknande projekt" with real substance). |
| **3 — Genomför & rapportera** | Post-award delivery and compliance | `ReportingRequirementDefinition`, `ProjectDeliverable`, `ProjectIndicator`, `Report`, `KnowledgeChunk`/RAG. |

---

## 7. Design decisions (where the two proposals diverged)

**7.1 Bilingual fields.** EU Navigator's UI is bilingual SV/EN, but that
doesn't mean every column needs a `_sv`/`_en` pair. Reference-data text that
comes from an EU source (call descriptions, programme text) should be stored
**as published** — usually English, sometimes already multilingual via the
Funding & Tenders Portal — in a single field; translating it ourselves would
both be a lot of work and risk drifting from the authoritative text. Only
content **we author** — AI-generated short descriptions, our own theme
labels, UI copy, a customer's own project text — needs a real `_sv`/`_en`
pair (or a small `translation` table keyed by field+locale, if this grows
past a handful of authored fields). The tables above only spell out `_sv`/
`_en` explicitly where that distinction already matters today (e.g.
`FundedProject.description`, which is our own editorial summary, not source
text).

**7.2 `machine_rule` as hybrid, not one big blob.** A single free-form rule
field for every eligibility check risks becoming something only a human can
read back out. `CallRequirement` gets typed columns for the handful of
checks that recur constantly (`min_partners`, `min_countries`,
`applicant_types`, budget bounds) so the matching engine can query them
directly and cheaply, and `machine_rule` (JSON) stays a genuine escape hatch
for the rare one-off condition — not the default path.

**7.3 `Customer`/`Organisation` split, not one table with a `kind` flag.**
The first draft of this document tried to make one `Organisation` table do
double duty (reference-data orgs and the tenant's own org/departments) with
a `kind` discriminator. The newer proposal's plain split — `Customer` for
the tenant, a plain `department` string on `CustomerProject` — is simpler
and avoids ever mixing a real customer's identity into the same rows queried
for "which municipalities got LIFE funding." Adopted; `Organisation` in this
document is reference-only.

**7.4 `Document`'s polymorphic FK.** `entity_type`+`entity_id` instead of a
real foreign key is a known, deliberate trade-off (no DB-enforced
referential integrity on that pair) in exchange for one table instead of six
near-identical `document_program`/`document_call`/… join tables. Worth
revisiting only if the backend's DB layer makes polymorphic associations
unusually painful (e.g. some ORMs handle this poorly) — otherwise it's the
right default here given how many entity types need attachable documents.

**7.5 `Fund` stays optional.** Not forcing every programme through a
sub-programme level avoids a placeholder row for the many programmes (e.g.
Erasmus+) that don't have one.

---

## 8. Migration map

| Today (`lib/types.ts` / `lib/data/*`) | Becomes |
|---|---|
| `FundingProgram` | `Program` (+ `management_type`, `target_groups`) |
| `FundingCall`, embedded `FundingDocument[]`, `EvaluationCriterion[]` | `Call` (absolute dates) + `EvaluationCriterion` table + `Document` rows (`entity_type = "call"`) |
| — (didn't exist) | `CallRequirement`, `ApplicationRequirementDefinition`, `ReportingRequirementDefinition` — currently implicit in `eligibleApplicants_sv/en` free text and nowhere for reporting; this is genuinely new structure, not a rename. |
| `ProjectBankEntry` | `CustomerProject` (`department_sv/en` free text → single `department` string once bilingual UI does its own lookup of the customer's own locale preference, not a stored translation) |
| `ReferenceProject` + `AwardedProject` + `Commitment` | `FundedProject` (+ `ProjectPartner`, `FundedProjectResult`); `Commitment` splits into `ProjectIndicator` (ongoing tracking) + `Report` (the periodic submission) |
| `OrgProcessPhase.roleExample` + `useOrgConfig` overrides | Unchanged in shape — this is internal org-process configuration, not part of the funding/application data model, and stays a `Customer`-scoped settings blob rather than becoming its own set of entities. |
| Client-only `draftLogic` state in `ApplicationWorkspace` | `Application` + `ApplicationSection` |
| `computeMatchesForEntry`/`computeBestMatchForEntry` (recomputed every render) | `Match`, persisted, invalidated via `inputs_hash` |

## 9. External source field mapping

| Our field | Funding & Tenders Portal | CORDIS | Keep.eu | Tillväxtverket/ESF-rådet |
|---|---|---|---|---|
| `Program.external_id` | `frameworkProgramme` | `programmeId` | `programmeCode` | fund code |
| `Call.external_call_id` | `identifier` (Call), `topic` | — | `callId` | diarienummer |
| `CallRequirement` | Eligibility conditions text/structured fields | — | Partnership rules | Stödvillkor |
| `EvaluationCriterion` | Award criteria | Evaluation section | — | Bedömningskriterier |
| `FundedProject.external_project_id` | Grant Agreement number | `id` (project) | `projectId` | diarienummer |
| `Organisation.pic_number` | `organisation.pic` | organisation PIC | `partner.id` | — (rarely has one) |
| `ProjectPartner.role` | `role` (coordinator/participant) | `activityType` | `partner.role` | — |
| `FundedProjectResult` | Results & Deliverables area | `results`, `publications`, `patents` | — | — |

This table is the starting checklist for whoever writes the ETL adapters —
each column is "what to read from that source to fill this field."

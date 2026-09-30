"use client";

import { useMemo, useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ActivityType, ApplicantType, PartnerLevel, ProjectInput, Sector, SwedishRegion } from "@/lib/types";
import { suggestTags } from "@/lib/matching/tagSuggestions";
import { applicantTypeFromText } from "@/lib/matching/callExtraction";
import { useTags } from "@/lib/hooks/useTags";
import { useOrgConfig } from "@/lib/hooks/useOrgConfig";
import { ALL_APPLICANT_TYPES, applicantTypeLabel } from "@/lib/data/fundingCalls";
import {
  ALL_ACTIVITY_TYPES,
  ALL_PARTNER_LEVELS,
  ALL_REGIONS,
  ALL_TARGET_GROUPS,
  activityTypeLabel,
  partnerLevelLabel,
  regionLabel,
  targetGroupLabel,
} from "@/lib/data/matchingVocabulary";
import TagPicker from "@/components/TagPicker";

const SECTORS: Sector[] = [
  "energy",
  "climate",
  "digital",
  "social",
  "mobility",
  "education",
  "health",
  "research",
];

const DEFAULT_PROJECT: ProjectInput = {
  title: "",
  description: "",
  sector: "energy",
  budgetSEK: 50_000_000,
  startYear: new Date().getFullYear() + 1,
  endYear: new Date().getFullYear() + 3,
  municipality: "",
  hasInternationalPartner: false,
};

const EXAMPLE_TITLE_SV = "Energieffektivisering av 14 skolor";
const EXAMPLE_DESCRIPTION_SV =
  "Vi behöver energieffektivisera 14 skolor 2027–2029. Investeringen omfattar solceller, styrsystem, ventilation och energilagring för att minska energiförbrukning och klimatpåverkan.";
const EXAMPLE_TITLE_EN = "Energy efficiency upgrade of 14 schools";
const EXAMPLE_DESCRIPTION_EN =
  "We need to upgrade the energy efficiency of 14 schools in 2027–2029. The investment covers solar panels, control systems, ventilation and energy storage to reduce energy use and climate impact.";

const EXAMPLE_COMMON = {
  sector: "energy",
  secondarySectors: ["climate"],
  activityType: "investment",
  budgetSEK: 120_000_000,
  startYear: 2027,
  endYear: 2029,
  region: "vastra-gotaland",
  hasInternationalPartner: false,
  partnerLevel: "none",
} satisfies Partial<ProjectInput>;

const EXAMPLE_SV: ProjectInput = {
  ...EXAMPLE_COMMON,
  title: EXAMPLE_TITLE_SV,
  description: EXAMPLE_DESCRIPTION_SV,
  municipality: "Exempelstad kommun",
  tags: suggestTags(`${EXAMPLE_TITLE_SV} ${EXAMPLE_DESCRIPTION_SV}`),
};

const EXAMPLE_EN: ProjectInput = {
  ...EXAMPLE_COMMON,
  title: EXAMPLE_TITLE_EN,
  description: EXAMPLE_DESCRIPTION_EN,
  municipality: "Example City Municipality",
  tags: suggestTags(`${EXAMPLE_TITLE_EN} ${EXAMPLE_DESCRIPTION_EN}`),
};

const inputClass =
  "mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";

// The seeded example organisation is a municipality, so that's the
// fallback when the organisation profile doesn't say otherwise.
const DEFAULT_APPLICANT_TYPE: ApplicantType = "municipality";

interface Props {
  onSubmit: (project: ProjectInput) => void;
  initialProject?: ProjectInput;
  /** What was already typed here before navigating forward and then back
   * (e.g. "← Tillbaka" from the match results) — restores it so going back
   * to tweak something doesn't mean starting the form over from scratch.
   * Unlike initialProject, this never shows the "prefilled from Projektbanken"
   * banner, since it isn't from a saved project. */
  draftProject?: ProjectInput;
  /** Saves the project under Projekt without going on to the matches — a
   * new project is created, a prefilled one (initialProject) updated. */
  onSave?: (project: ProjectInput) => void;
}

export default function ProjectForm({ onSubmit, initialProject, draftProject, onSave }: Props) {
  const { t, lang } = useLanguage();
  const [project, setProject] = useState<ProjectInput>(initialProject ?? draftProject ?? DEFAULT_PROJECT);
  const intake = t.demo.intake;
  const { all: allTags, addCustomTag } = useTags();
  const { config: orgConfig } = useOrgConfig();

  const formRef = useRef<HTMLFormElement>(null);
  const fillExample = () => setProject(lang === "sv" ? EXAMPLE_SV : EXAMPLE_EN);

  const suggestedTags = useMemo(
    () => suggestTags(`${project.title} ${project.description}`),
    [project.title, project.description]
  );
  const pendingSuggestedTags = suggestedTags.filter((id) => !(project.tags ?? []).includes(id));

  // Only a value the user picked here is stored on the project; until then
  // the select shows (and submit uses) the organisation profile's type, so
  // it stays in sync with the profile rather than freezing on first render.
  const profileApplicantType = orgConfig.orgType ? applicantTypeFromText(orgConfig.orgType) : undefined;
  const applicantType = project.applicantType ?? profileApplicantType ?? DEFAULT_APPLICANT_TYPE;
  const applicantTypeIsFromProfile = !project.applicantType && Boolean(profileApplicantType);

  const partnerLevel: PartnerLevel = project.partnerLevel ?? (project.hasInternationalPartner ? "international" : "none");
  const requestedGrantTooHigh =
    project.requestedGrantSEK !== undefined && project.requestedGrantSEK > project.budgetSEK;

  const toggleIn = <T,>(list: T[] | undefined, value: T): T[] =>
    (list ?? []).includes(value) ? (list ?? []).filter((v) => v !== value) : [...(list ?? []), value];

  return (
    <div className="mx-auto max-w-2xl">
      {initialProject && (
        <p className="mb-4 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-600">{intake.prefilledFromBank}</p>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{initialProject ? intake.titleExisting : intake.title}</h1>
          <p className="mt-2 text-sm text-navy-600">{intake.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={fillExample}
          className="shrink-0 rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50"
        >
          {intake.fillExample}
        </button>
      </div>

      <form
        ref={formRef}
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          if (requestedGrantTooHigh) return;
          onSubmit({ ...project, applicantType });
        }}
      >
        <div>
          <label htmlFor="intake-title" className="block text-sm font-semibold text-navy-800">{intake.fieldTitle}</label>
          <input
            id="intake-title"
            required
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            placeholder={intake.fieldTitlePlaceholder}
            className={inputClass}
          />
        </div>

        <div>
          <label htmlFor="intake-description" className="block text-sm font-semibold text-navy-800">{intake.fieldDescription}</label>
          <textarea
            id="intake-description"
            required
            rows={4}
            value={project.description}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
            placeholder={intake.fieldDescriptionPlaceholder}
            className={inputClass}
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="intake-sector" className="block text-sm font-semibold text-navy-800">{intake.fieldSector}</label>
            <select
              id="intake-sector"
              value={project.sector}
              onChange={(e) => {
                const sector = e.target.value as Sector;
                setProject({
                  ...project,
                  sector,
                  secondarySectors: (project.secondarySectors ?? []).filter((s) => s !== sector),
                });
              }}
              className={inputClass}
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {intake.sectors[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="intake-activity" className="block text-sm font-semibold text-navy-800">{intake.fieldActivityType}</label>
            <select
              id="intake-activity"
              value={project.activityType ?? ""}
              onChange={(e) =>
                setProject({ ...project, activityType: (e.target.value || undefined) as ActivityType | undefined })
              }
              className={inputClass}
            >
              <option value="">{intake.activityTypePlaceholder}</option>
              {ALL_ACTIVITY_TYPES.map((a) => (
                <option key={a} value={a}>
                  {activityTypeLabel(a, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="-mt-4 text-xs text-navy-500">{intake.activityTypeHint}</p>

        <fieldset>
          <legend className="block text-sm font-semibold text-navy-800">{intake.fieldSecondarySectors}</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {SECTORS.filter((s) => s !== project.sector).map((s) => (
              <Chip
                key={s}
                label={intake.sectors[s]}
                checked={(project.secondarySectors ?? []).includes(s)}
                onChange={() => setProject({ ...project, secondarySectors: toggleIn(project.secondarySectors, s) })}
              />
            ))}
          </div>
        </fieldset>

        <fieldset>
          <legend className="block text-sm font-semibold text-navy-800">{intake.fieldTargetGroups}</legend>
          <p className="mt-1 text-xs text-navy-500">{intake.targetGroupsHint}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALL_TARGET_GROUPS.map((g) => (
              <Chip
                key={g}
                label={targetGroupLabel(g, lang)}
                checked={(project.targetGroups ?? []).includes(g)}
                onChange={() => setProject({ ...project, targetGroups: toggleIn(project.targetGroups, g) })}
              />
            ))}
          </div>
        </fieldset>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="intake-budget" className="block text-sm font-semibold text-navy-800">{intake.fieldBudget}</label>
            <input
              id="intake-budget"
              type="number"
              min={0}
              step={100000}
              required
              value={project.budgetSEK}
              onChange={(e) => setProject({ ...project, budgetSEK: Number(e.target.value) })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="intake-grant" className="block text-sm font-semibold text-navy-800">{intake.fieldRequestedGrant}</label>
            <input
              id="intake-grant"
              type="number"
              min={0}
              step={100000}
              value={project.requestedGrantSEK ?? ""}
              onChange={(e) =>
                setProject({ ...project, requestedGrantSEK: e.target.value === "" ? undefined : Number(e.target.value) })
              }
              aria-invalid={requestedGrantTooHigh}
              aria-describedby="intake-grant-hint"
              className={inputClass}
            />
            <p id="intake-grant-hint" className={`mt-1 text-xs ${requestedGrantTooHigh ? "text-amber-700" : "text-navy-500"}`}>
              {requestedGrantTooHigh ? intake.requestedGrantOverBudget : intake.requestedGrantHint}
            </p>
          </div>

          <div>
            <label htmlFor="intake-start" className="block text-sm font-semibold text-navy-800">{intake.fieldStartYear}</label>
            <input
              id="intake-start"
              type="number"
              required
              value={project.startYear}
              onChange={(e) => setProject({ ...project, startYear: Number(e.target.value) })}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="intake-end" className="block text-sm font-semibold text-navy-800">{intake.fieldEndYear}</label>
            <input
              id="intake-end"
              type="number"
              required
              value={project.endYear}
              onChange={(e) => setProject({ ...project, endYear: Number(e.target.value) })}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-800">{intake.fieldTags}</label>
          <div className="mt-1">
            <TagPicker
              tags={allTags}
              selected={project.tags ?? []}
              onChange={(tags) => setProject({ ...project, tags })}
              suggested={suggestedTags}
              lang={lang}
              labels={{
                hint: intake.tagsHint,
                suggestedLabel: intake.tagsSuggestedLabel,
                addAllLabel: intake.tagsAddAllLabel,
                addNewPlaceholder: intake.tagsAddNewPlaceholder,
                addNewButton: intake.tagsAddNewButton,
              }}
              onAddTag={addCustomTag}
            />
          </div>
          {(project.tags ?? []).length === 0 && pendingSuggestedTags.length > 0 && (
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-md bg-gold-50 px-3 py-2 text-xs text-gold-800">
              <span>{intake.tagsNudge(pendingSuggestedTags.length)}</span>
              <button
                type="button"
                onClick={() => setProject({ ...project, tags: [...(project.tags ?? []), ...pendingSuggestedTags] })}
                className="rounded-md border border-gold-300 bg-white px-2 py-1 font-semibold hover:bg-gold-100"
              >
                {intake.tagsNudgeButton}
              </button>
            </div>
          )}
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label htmlFor="intake-municipality" className="block text-sm font-semibold text-navy-800">{intake.fieldMunicipality}</label>
            <input
              id="intake-municipality"
              required
              value={project.municipality}
              onChange={(e) => setProject({ ...project, municipality: e.target.value })}
              placeholder={intake.fieldMunicipalityPlaceholder}
              className={inputClass}
            />
          </div>

          <div>
            <label htmlFor="intake-region" className="block text-sm font-semibold text-navy-800">{intake.fieldRegion}</label>
            <select
              id="intake-region"
              value={project.region ?? ""}
              onChange={(e) => setProject({ ...project, region: (e.target.value || undefined) as SwedishRegion | undefined })}
              className={inputClass}
            >
              <option value="">{intake.regionPlaceholder}</option>
              {ALL_REGIONS.map((r) => (
                <option key={r} value={r}>
                  {regionLabel(r)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="intake-applicant" className="block text-sm font-semibold text-navy-800">{intake.fieldApplicantType}</label>
            <select
              id="intake-applicant"
              value={applicantType}
              onChange={(e) => setProject({ ...project, applicantType: e.target.value as ApplicantType })}
              aria-describedby="intake-applicant-hint"
              className={inputClass}
            >
              {ALL_APPLICANT_TYPES.map((a) => (
                <option key={a} value={a}>
                  {applicantTypeLabel(a, lang)}
                </option>
              ))}
            </select>
            <p id="intake-applicant-hint" className="mt-1 text-xs text-navy-500">
              {applicantTypeIsFromProfile ? intake.applicantTypeFromProfile : intake.applicantTypeDefault}
            </p>
          </div>

          <div>
            <label htmlFor="intake-partnership" className="block text-sm font-semibold text-navy-800">{intake.fieldPartnership}</label>
            <select
              id="intake-partnership"
              value={partnerLevel}
              onChange={(e) => {
                const level = e.target.value as PartnerLevel;
                setProject({
                  ...project,
                  partnerLevel: level,
                  hasInternationalPartner: level === "international" || level === "consortium",
                });
              }}
              className={inputClass}
            >
              {ALL_PARTNER_LEVELS.map((l) => (
                <option key={l} value={l}>
                  {partnerLevelLabel(l, lang)}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="submit"
            className="flex-1 rounded-md bg-navy-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700"
          >
            {intake.submit}
          </button>
          {onSave && (
            <button
              type="button"
              aria-describedby="intake-save-hint"
              onClick={() => {
                // Same required fields as finding funding.
                if (!formRef.current?.reportValidity() || requestedGrantTooHigh) return;
                onSave({ ...project, applicantType });
              }}
              className="rounded-md border border-navy-300 bg-white px-6 py-3 text-sm font-semibold text-navy-800 transition hover:bg-navy-50"
            >
              {intake.saveProject}
            </button>
          )}
        </div>
        {onSave && (
          <p id="intake-save-hint" className="-mt-3 text-xs text-navy-500">
            {intake.saveProjectHint}
          </p>
        )}
      </form>
    </div>
  );
}

function Chip({ label, checked, onChange }: { label: string; checked: boolean; onChange: () => void }) {
  return (
    <label
      className={`cursor-pointer rounded-full border px-3 py-1 text-xs font-semibold transition has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-navy-500 ${
        checked ? "border-navy-700 bg-navy-700 text-white" : "border-navy-200 text-navy-600 hover:bg-navy-50"
      }`}
    >
      <input type="checkbox" className="sr-only" checked={checked} onChange={onChange} />
      {label}
    </label>
  );
}

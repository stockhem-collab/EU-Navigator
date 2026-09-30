"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ActivityType, ApplicantType, PartnerLevel, ProjectBankEntry, Sector, SwedishRegion, TargetGroup } from "@/lib/types";
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

export type MatchingFieldsValue = Pick<
  ProjectBankEntry,
  | "applicantType"
  | "activityType"
  | "secondarySectors"
  | "targetGroups"
  | "region"
  | "partnerLevel"
  | "requestedGrantSEK"
  | "hasInternationalPartner"
>;

const SECTORS: Sector[] = ["energy", "climate", "digital", "social", "mobility", "education", "health", "research"];

const inputClass =
  "mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500";

// The matching fields of the intake form (type of work, other sectors,
// target groups, county, applicant type, partnership, requested grant), for
// editing a saved project — so it's described on the same terms as a new
// one. `sector` is the project's main sector, left out of "other sectors".
export default function ProjectMatchingFields({
  value,
  sector,
  onChange,
}: {
  value: MatchingFieldsValue;
  sector: Sector;
  onChange: (value: MatchingFieldsValue) => void;
}) {
  const { t, lang } = useLanguage();
  const intake = t.demo.intake;
  const set = (patch: Partial<MatchingFieldsValue>) => onChange({ ...value, ...patch });
  const toggle = <T,>(list: T[] | undefined, item: T): T[] =>
    (list ?? []).includes(item) ? (list ?? []).filter((v) => v !== item) : [...(list ?? []), item];
  const partnerLevel: PartnerLevel = value.partnerLevel ?? (value.hasInternationalPartner ? "international" : "none");

  return (
    <>
      <div>
        <label htmlFor="edit-activity" className="block text-sm font-semibold text-navy-700">
          {intake.fieldActivityType}
        </label>
        <select
          id="edit-activity"
          value={value.activityType ?? ""}
          onChange={(e) => set({ activityType: (e.target.value || undefined) as ActivityType | undefined })}
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
      <div>
        <label htmlFor="edit-grant" className="block text-sm font-semibold text-navy-700">
          {intake.fieldRequestedGrant}
        </label>
        <input
          id="edit-grant"
          type="number"
          min={0}
          step={100000}
          value={value.requestedGrantSEK ?? ""}
          onChange={(e) => set({ requestedGrantSEK: e.target.value === "" ? undefined : Number(e.target.value) })}
          className={inputClass}
        />
      </div>
      <fieldset className="sm:col-span-2">
        <legend className="block text-sm font-semibold text-navy-700">{intake.fieldSecondarySectors}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {SECTORS.filter((s) => s !== sector).map((s) => (
            <Chip
              key={s}
              label={intake.sectors[s]}
              checked={(value.secondarySectors ?? []).includes(s)}
              onChange={() => set({ secondarySectors: toggle(value.secondarySectors, s) })}
            />
          ))}
        </div>
      </fieldset>
      <fieldset className="sm:col-span-2">
        <legend className="block text-sm font-semibold text-navy-700">{intake.fieldTargetGroups}</legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {ALL_TARGET_GROUPS.map((g) => (
            <Chip
              key={g}
              label={targetGroupLabel(g, lang)}
              checked={(value.targetGroups ?? []).includes(g)}
              onChange={() => set({ targetGroups: toggle(value.targetGroups, g) as TargetGroup[] })}
            />
          ))}
        </div>
      </fieldset>
      <div>
        <label htmlFor="edit-region" className="block text-sm font-semibold text-navy-700">
          {intake.fieldRegion}
        </label>
        <select
          id="edit-region"
          value={value.region ?? ""}
          onChange={(e) => set({ region: (e.target.value || undefined) as SwedishRegion | undefined })}
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
        <label htmlFor="edit-applicant" className="block text-sm font-semibold text-navy-700">
          {intake.fieldApplicantType}
        </label>
        <select
          id="edit-applicant"
          value={value.applicantType ?? ""}
          onChange={(e) => set({ applicantType: (e.target.value || undefined) as ApplicantType | undefined })}
          className={inputClass}
        >
          <option value="">—</option>
          {ALL_APPLICANT_TYPES.map((a) => (
            <option key={a} value={a}>
              {applicantTypeLabel(a, lang)}
            </option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor="edit-partnership" className="block text-sm font-semibold text-navy-700">
          {intake.fieldPartnership}
        </label>
        <select
          id="edit-partnership"
          value={partnerLevel}
          onChange={(e) => {
            const level = e.target.value as PartnerLevel;
            set({ partnerLevel: level, hasInternationalPartner: level === "international" || level === "consortium" });
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
    </>
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

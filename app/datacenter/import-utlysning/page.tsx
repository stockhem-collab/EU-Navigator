"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms, findProgram } from "@/lib/data/fundingPrograms";
import { fundingCalls, applicantTypeLabel, ALL_APPLICANT_TYPES, monthsUntilDate } from "@/lib/data/fundingCalls";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { extractCallDraft, slugifyCallId, ExtractionConfidence } from "@/lib/matching/callExtraction";
import { suggestTags } from "@/lib/matching/tagSuggestions";
import { useTags } from "@/lib/hooks/useTags";
import TagPicker from "@/components/TagPicker";
import {
  ALL_ACTIVITY_TYPES,
  ALL_REGIONS,
  ALL_TARGET_GROUPS,
  activityTypeLabel,
  regionLabel,
  targetGroupLabel,
} from "@/lib/data/matchingVocabulary";
import {
  ActivityType,
  ApplicantType,
  EvaluationCriterion,
  FundingCall,
  ReportingPeriodicity,
  SwedishRegion,
  TargetGroup,
} from "@/lib/types";

interface FormState {
  programId: string;
  titleSv: string;
  titleEn: string;
  status: "open" | "upcoming";
  deadlineDate: string; // YYYY-MM-DD
  budgetTotalSEK: number;
  minGrantSEK: number;
  maxGrantSEK: number;
  requiresPartnership: boolean;
  eligibleSv: string;
  eligibleEn: string;
  applicantTypes: ApplicantType[];
  activityTypes: ActivityType[];
  targetGroups: TargetGroup[];
  eligibleRegions: SwedishRegion[];
  minPartnerCountries: number;
  /** Percent as typed; "" = the programme's typical rate. */
  coFinancingPct: string;
  evaluationCriteria: EvaluationCriterion[];
  prioritiesSv: string;
  prioritiesEn: string;
  tags: string[];
  periodicity: ReportingPeriodicity;
  interimReportsRequired: number;
  auditThreshold: string;
}

function isoDateMonthsFromNow(months: number): string {
  const d = new Date();
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

const EMPTY_FORM: FormState = {
  programId: "",
  titleSv: "",
  titleEn: "",
  status: "open",
  deadlineDate: "",
  budgetTotalSEK: 0,
  minGrantSEK: 0,
  maxGrantSEK: 0,
  requiresPartnership: false,
  eligibleSv: "",
  eligibleEn: "",
  applicantTypes: [],
  activityTypes: [],
  targetGroups: [],
  eligibleRegions: [],
  minPartnerCountries: 2,
  coFinancingPct: "",
  evaluationCriteria: [],
  prioritiesSv: "",
  prioritiesEn: "",
  tags: [],
  periodicity: "annual",
  interimReportsRequired: 2,
  auditThreshold: "",
};

type ConfidenceKey =
  | "budget"
  | "grantRange"
  | "partnership"
  | "applicantTypes"
  | "priorities"
  | "tags"
  | "periodicity"
  | "audit"
  | "deadline"
  | "coFinancing"
  | "minPartnerCountries"
  | "activityTypes"
  | "targetGroups"
  | "regions"
  | "criteria";
type ConfidenceMap = Partial<Record<ConfidenceKey, ExtractionConfidence>>;

export default function ImportUtlysningPage() {
  const { t, lang } = useLanguage();
  const ci = t.callImport;
  const { imported, addImportedCall, removeImportedCall, hydrated } = useFundingCalls();
  const { all: allTags, addCustomTag } = useTags();

  const [rawText, setRawText] = useState("");
  // The default deadline is computed on the client only (this page renders
  // nothing until hydrated), so "today" can't differ from the server's.
  const [form, setForm] = useState<FormState>(() => ({ ...EMPTY_FORM, deadlineDate: isoDateMonthsFromNow(6) }));
  const [confidence, setConfidence] = useState<ConfidenceMap>({});
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    const draft = extractCallDraft(rawText);
    // Tags aren't part of extractCallDraft's regex-based fields above — they
    // come from the fixed vocabulary (lib/data/tags.ts) via the same
    // deterministic keyword dictionary the application studio uses to
    // suggest tags from a project's description (lib/matching/
    // tagSuggestions.ts), applied here to the pasted call text instead.
    const suggestedTags = suggestTags(rawText);
    setForm((prev) => ({
      ...prev,
      budgetTotalSEK: draft.budgetTotalSEK.value,
      minGrantSEK: draft.minGrantSEK.value,
      maxGrantSEK: draft.maxGrantSEK.value,
      requiresPartnership: draft.requiresPartnership.value,
      applicantTypes: draft.applicantTypes.value,
      activityTypes: draft.activityTypes.value,
      targetGroups: draft.targetGroups.value,
      eligibleRegions: draft.eligibleRegions.value,
      minPartnerCountries: draft.minPartnerCountries.value ?? prev.minPartnerCountries,
      deadlineDate: draft.deadlineDate.value ?? prev.deadlineDate,
      coFinancingPct: draft.coFinancingRate.value !== null ? String(Math.round(draft.coFinancingRate.value * 100)) : prev.coFinancingPct,
      // The extractor can only read the Swedish text; the English names
      // start empty (falling back to Swedish on save) rather than looking
      // translated when they aren't.
      evaluationCriteria: draft.evaluationCriteria.value.map((c) => ({ ...c, name_en: "" })),
      prioritiesSv: draft.priorities_sv.value.join("\n"),
      tags: suggestedTags,
      periodicity: draft.periodicity.value,
      auditThreshold: draft.requiresAuditAboveSEK.value !== null ? String(draft.requiresAuditAboveSEK.value) : "",
    }));
    setConfidence({
      budget: draft.budgetTotalSEK.confidence,
      grantRange: draft.minGrantSEK.confidence,
      partnership: draft.requiresPartnership.confidence,
      applicantTypes: draft.applicantTypes.confidence,
      priorities: draft.priorities_sv.confidence,
      tags: suggestedTags.length > 0 ? "detected" : "default",
      periodicity: draft.periodicity.confidence,
      audit: draft.requiresAuditAboveSEK.confidence,
      deadline: draft.deadlineDate.confidence,
      coFinancing: draft.coFinancingRate.confidence,
      minPartnerCountries: draft.minPartnerCountries.confidence,
      activityTypes: draft.activityTypes.confidence,
      targetGroups: draft.targetGroups.confidence,
      regions: draft.eligibleRegions.confidence,
      criteria: draft.evaluationCriteria.confidence,
    });
  };

  // Recomputed live from the pasted text (not just at parse time) so a tag
  // removed from the selection, or a manual edit to the pasted text,
  // still offers it back as a one-click suggestion rather than requiring
  // a full re-parse.
  const liveSuggestedTags = useMemo(() => suggestTags(rawText), [rawText]);

  const toggleApplicantType = (type: ApplicantType) =>
    setForm((prev) => ({
      ...prev,
      applicantTypes: prev.applicantTypes.includes(type)
        ? prev.applicantTypes.filter((t2) => t2 !== type)
        : [...prev.applicantTypes, type],
    }));

  const toggleListField = <K extends "activityTypes" | "targetGroups" | "eligibleRegions">(
    field: K,
    value: FormState[K][number]
  ) =>
    setForm((prev) => {
      const list = prev[field] as FormState[K][number][];
      return {
        ...prev,
        [field]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value],
      };
    });

  const setCriterion = (index: number, patch: Partial<EvaluationCriterion>) =>
    setForm((prev) => ({
      ...prev,
      evaluationCriteria: prev.evaluationCriteria.map((c, i) => (i === index ? { ...c, ...patch } : c)),
    }));

  const selectedProgram = form.programId ? findProgram(form.programId) : undefined;
  const coFinancingRate = form.coFinancingPct.trim() ? Number(form.coFinancingPct) / 100 : undefined;
  const validCriteria = form.evaluationCriteria
    .map((c) => ({ ...c, name_sv: c.name_sv.trim(), name_en: c.name_en.trim() || c.name_sv.trim() }))
    .filter((c) => c.name_sv && c.maxPoints > 0);
  const deadlineMonths = form.deadlineDate ? monthsUntilDate(form.deadlineDate) : null;
  const deadlinePassed = deadlineMonths !== null && deadlineMonths < 0;

  // Everything lib/matching/scoreMatch.ts reads from a call that this form
  // can leave empty — listed before saving so a reviewer sees what the
  // match will have to treat as unknown. Target groups, programme area and
  // funding rate are deliberately not here: empty is a valid answer for
  // them (not people-focused / all of Sweden / the programme's rate).
  const missingForMatching = [
    form.applicantTypes.length === 0 && ci.missingApplicantTypes,
    form.activityTypes.length === 0 && ci.missingActivityTypes,
    validCriteria.length === 0 && ci.missingCriteria,
    form.tags.length === 0 && ci.missingTags,
    (form.minGrantSEK <= 0 || form.maxGrantSEK <= 0) && ci.missingGrantRange,
    !form.deadlineDate && ci.missingDeadline,
  ].filter((m): m is string => Boolean(m));

  const handleSave = () => {
    if (!form.programId || !form.titleSv.trim() || !form.titleEn.trim()) {
      setError(ci.requiredFieldsError);
      return;
    }
    setError(null);

    const existingIds = [...fundingCalls.map((c) => c.id), ...imported.map((c) => c.id)];
    const id = slugifyCallId(form.titleSv, existingIds);
    const priorities_sv = form.prioritiesSv.split("\n").map((l) => l.trim()).filter(Boolean);
    const priorities_en = form.prioritiesEn.split("\n").map((l) => l.trim()).filter(Boolean);

    const call: FundingCall = {
      id,
      programId: form.programId,
      title_sv: form.titleSv.trim(),
      title_en: form.titleEn.trim(),
      status: form.status,
      deadlineDate: deadlineMonths !== null ? form.deadlineDate : undefined,
      // Kept for code that only knows the relative form; everything that
      // shows or scores a deadline reads callDeadlineMonths() instead.
      deadlineMonthsFromNow: deadlineMonths ?? 6,
      budgetTotalSEK: form.budgetTotalSEK,
      minGrantSEK: form.minGrantSEK,
      maxGrantSEK: form.maxGrantSEK,
      requiresPartnership: form.requiresPartnership,
      eligibleApplicants_sv: form.eligibleSv.trim(),
      eligibleApplicants_en: form.eligibleEn.trim(),
      applicantTypes: form.applicantTypes.length > 0 ? form.applicantTypes : undefined,
      activityTypes: form.activityTypes.length > 0 ? form.activityTypes : undefined,
      targetGroups: form.targetGroups.length > 0 ? form.targetGroups : undefined,
      eligibleRegions: form.eligibleRegions.length > 0 ? form.eligibleRegions : undefined,
      minPartnerCountries: form.requiresPartnership ? form.minPartnerCountries : undefined,
      coFinancingRate: coFinancingRate !== undefined && coFinancingRate > 0 && coFinancingRate <= 1 ? coFinancingRate : undefined,
      priorities_sv,
      // Swedish stands in until an English version is entered.
      priorities_en: priorities_en.length > 0 ? priorities_en : priorities_sv,
      extraKeywords: [],
      tags: form.tags,
      evaluationCriteria: validCriteria,
      documents: [],
      reportingRequirements: {
        periodicity: form.periodicity,
        interimReportsRequired: form.interimReportsRequired,
        requiresAuditAboveSEK: form.auditThreshold.trim() ? Number(form.auditThreshold) : null,
        interimDocuments_sv: [],
        interimDocuments_en: [],
        finalReportDocuments_sv: [],
        finalReportDocuments_en: [],
      },
      extractionSource: "assisted-import",
      importedAt: new Date().toISOString(),
    };

    addImportedCall(call);
    setForm({ ...EMPTY_FORM, deadlineDate: isoDateMonthsFromNow(6) });
    setConfidence({});
    setRawText("");
  };

  const badge = (key: keyof ConfidenceMap) => {
    const c = confidence[key];
    if (!c) return null;
    return (
      <span className={`badge ${c === "detected" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>
        {c === "detected" ? ci.detectedBadge : ci.defaultBadge}
      </span>
    );
  };

  if (!hydrated) return null;

  return (
    <>
      <Header />
      <main className="section max-w-3xl">
        <Link href="/datacenter" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          ← {ci.back}
        </Link>

        <h1 className="mt-4 text-2xl font-bold text-navy-900">{ci.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{ci.subtitle}</p>

        <div className="mt-8 rounded-xl border border-navy-100 bg-white p-6">
          <label className="block text-sm font-semibold text-navy-800">{ci.pasteLabel}</label>
          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={ci.pastePlaceholder}
            className="mt-2 w-full rounded-md border border-navy-200 px-3 py-2 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          <button
            type="button"
            onClick={handleParse}
            disabled={!rawText.trim()}
            className="mt-3 rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {ci.parseButton}
          </button>
          {Object.keys(confidence).length > 0 && <p className="mt-3 text-xs text-amber-700">{ci.parsedNote}</p>}
        </div>

        <div className="mt-6 space-y-5 rounded-xl border border-navy-100 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldProgram}</label>
              <select
                value={form.programId}
                onChange={(e) => setForm({ ...form, programId: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                <option value="">—</option>
                {fundingPrograms.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === "sv" ? p.name_sv : p.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldStatus}</label>
              <select
                value={form.status}
                onChange={(e) => setForm({ ...form, status: e.target.value as "open" | "upcoming" })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                <option value="open">{ci.statusOpen}</option>
                <option value="upcoming">{ci.statusUpcoming}</option>
              </select>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="import-deadline" className="block text-sm font-semibold text-navy-700">{ci.fieldDeadline}</label>
                {badge("deadline")}
              </div>
              <input
                id="import-deadline"
                type="date"
                value={form.deadlineDate}
                onChange={(e) => setForm({ ...form, deadlineDate: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <p className={`mt-0.5 text-xs ${deadlinePassed ? "text-amber-700" : "text-navy-400"}`}>
                {deadlinePassed ? ci.deadlinePassed : ci.fieldDeadlineHint}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="import-cofinancing" className="block text-sm font-semibold text-navy-700">{ci.fieldCoFinancing}</label>
                {badge("coFinancing")}
              </div>
              <input
                id="import-cofinancing"
                type="number"
                min={1}
                max={100}
                value={form.coFinancingPct}
                onChange={(e) => setForm({ ...form, coFinancingPct: e.target.value })}
                placeholder={selectedProgram ? String(Math.round(selectedProgram.typicalCoFinancingRate * 100)) : ""}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <p className="mt-0.5 text-xs text-navy-400">
                {ci.fieldCoFinancingHint(selectedProgram ? Math.round(selectedProgram.typicalCoFinancingRate * 100) : null)}
              </p>
            </div>
            <div>
              <label htmlFor="import-title-sv" className="block text-sm font-semibold text-navy-700">{ci.fieldTitleSv}</label>
              <input
                id="import-title-sv"
                value={form.titleSv}
                onChange={(e) => setForm({ ...form, titleSv: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label htmlFor="import-title-en" className="block text-sm font-semibold text-navy-700">{ci.fieldTitleEn}</label>
              <input
                id="import-title-en"
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <label htmlFor="import-budget" className="block text-sm font-semibold text-navy-700">{ci.fieldBudget}</label>
              {badge("budget")}
            </div>
            <input
              id="import-budget"
              type="number"
              value={form.budgetTotalSEK}
              onChange={(e) => setForm({ ...form, budgetTotalSEK: Number(e.target.value) })}
              className="mt-1 w-full max-w-xs rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <label htmlFor="import-min-grant" className="block text-sm font-semibold text-navy-700">{ci.fieldMinGrant}</label>
                {badge("grantRange")}
              </div>
              <input
                id="import-min-grant"
                type="number"
                value={form.minGrantSEK}
                onChange={(e) => setForm({ ...form, minGrantSEK: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label htmlFor="import-max-grant" className="block text-sm font-semibold text-navy-700">{ci.fieldMaxGrant}</label>
              <input
                id="import-max-grant"
                type="number"
                value={form.maxGrantSEK}
                onChange={(e) => setForm({ ...form, maxGrantSEK: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm font-semibold text-navy-700">
            <input
              type="checkbox"
              checked={form.requiresPartnership}
              onChange={(e) => setForm({ ...form, requiresPartnership: e.target.checked })}
            />
            {ci.fieldPartnership}
            {badge("partnership")}
          </label>
          {form.requiresPartnership && (
            <div className="max-w-xs">
              <div className="flex items-center gap-2">
                <label htmlFor="import-min-countries" className="block text-sm font-semibold text-navy-700">
                  {ci.fieldMinPartnerCountries}
                </label>
                {badge("minPartnerCountries")}
              </div>
              <input
                id="import-min-countries"
                type="number"
                min={2}
                max={10}
                value={form.minPartnerCountries}
                onChange={(e) => setForm({ ...form, minPartnerCountries: Math.max(2, Number(e.target.value)) })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldEligibleSv}</label>
              <textarea
                rows={2}
                value={form.eligibleSv}
                onChange={(e) => setForm({ ...form, eligibleSv: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldEligibleEn}</label>
              <textarea
                rows={2}
                value={form.eligibleEn}
                onChange={(e) => setForm({ ...form, eligibleEn: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldApplicantTypes}</label>
              {badge("applicantTypes")}
            </div>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {ALL_APPLICANT_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm text-navy-700">
                  <input type="checkbox" checked={form.applicantTypes.includes(type)} onChange={() => toggleApplicantType(type)} />
                  {applicantTypeLabel(type, lang)}
                </label>
              ))}
            </div>
          </div>

          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-semibold text-navy-700">
              {ci.fieldActivityTypes}
              {badge("activityTypes")}
            </legend>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {ALL_ACTIVITY_TYPES.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm text-navy-700">
                  <input
                    type="checkbox"
                    checked={form.activityTypes.includes(type)}
                    onChange={() => toggleListField("activityTypes", type)}
                  />
                  {activityTypeLabel(type, lang)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-semibold text-navy-700">
              {ci.fieldTargetGroups}
              {badge("targetGroups")}
            </legend>
            <p className="mt-0.5 text-xs text-navy-400">{ci.fieldTargetGroupsHint}</p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {ALL_TARGET_GROUPS.map((group) => (
                <label key={group} className="flex items-center gap-2 text-sm text-navy-700">
                  <input
                    type="checkbox"
                    checked={form.targetGroups.includes(group)}
                    onChange={() => toggleListField("targetGroups", group)}
                  />
                  {targetGroupLabel(group, lang)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-semibold text-navy-700">
              {ci.fieldEligibleRegions}
              {badge("regions")}
            </legend>
            <p className="mt-0.5 text-xs text-navy-400">{ci.fieldEligibleRegionsHint}</p>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
              {ALL_REGIONS.map((region) => (
                <label key={region} className="flex items-center gap-2 text-sm text-navy-700">
                  <input
                    type="checkbox"
                    checked={form.eligibleRegions.includes(region)}
                    onChange={() => toggleListField("eligibleRegions", region)}
                  />
                  {regionLabel(region)}
                </label>
              ))}
            </div>
          </fieldset>

          <fieldset>
            <legend className="flex items-center gap-2 text-sm font-semibold text-navy-700">
              {ci.fieldCriteria}
              {badge("criteria")}
            </legend>
            <p className="mt-0.5 text-xs text-navy-400">{ci.fieldCriteriaHint}</p>
            <ul className="mt-2 space-y-2">
              {form.evaluationCriteria.map((criterion, i) => (
                <li key={i} className="flex items-center gap-2">
                  <input
                    aria-label={ci.criterionNamePlaceholder}
                    value={criterion.name_sv}
                    onChange={(e) => setCriterion(i, { name_sv: e.target.value })}
                    placeholder={ci.criterionNamePlaceholder}
                    className="w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                  <input
                    aria-label={ci.criterionNameEnPlaceholder}
                    value={criterion.name_en}
                    onChange={(e) => setCriterion(i, { name_en: e.target.value })}
                    placeholder={ci.criterionNameEnPlaceholder}
                    className="w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                  <input
                    aria-label={ci.criterionPointsLabel}
                    type="number"
                    min={0}
                    value={criterion.maxPoints}
                    onChange={(e) => setCriterion(i, { maxPoints: Number(e.target.value) })}
                    className="w-24 shrink-0 rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setForm((prev) => ({ ...prev, evaluationCriteria: prev.evaluationCriteria.filter((_, j) => j !== i) }))
                    }
                    aria-label={ci.removeCriterion}
                    className="shrink-0 rounded-md px-2 py-1 text-sm text-navy-400 hover:bg-navy-50 hover:text-navy-700"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  evaluationCriteria: [...prev.evaluationCriteria, { name_sv: "", name_en: "", maxPoints: 20 }],
                }))
              }
              className="mt-2 text-sm font-semibold text-navy-600 hover:text-navy-900"
            >
              + {ci.addCriterion}
            </button>
          </fieldset>

          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldPriorities}</label>
              {badge("priorities")}
            </div>
            <p className="mt-0.5 text-xs text-navy-400">{ci.fieldPrioritiesHint}</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <textarea
                aria-label={ci.fieldPrioritiesSv}
                rows={4}
                value={form.prioritiesSv}
                onChange={(e) => setForm({ ...form, prioritiesSv: e.target.value })}
                placeholder={ci.fieldPrioritiesSv}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <textarea
                aria-label={ci.fieldPrioritiesEn}
                rows={4}
                value={form.prioritiesEn}
                onChange={(e) => setForm({ ...form, prioritiesEn: e.target.value })}
                placeholder={ci.fieldPrioritiesEn}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldTags}</label>
              {badge("tags")}
            </div>
            <div className="mt-1">
              <TagPicker
                tags={allTags}
                selected={form.tags}
                onChange={(tags) => setForm({ ...form, tags })}
                suggested={liveSuggestedTags}
                lang={lang}
                labels={{
                  hint: t.demo.intake.tagsHint,
                  suggestedLabel: t.demo.intake.tagsSuggestedLabel,
                  addAllLabel: t.demo.intake.tagsAddAllLabel,
                  addNewPlaceholder: t.demo.intake.tagsAddNewPlaceholder,
                  addNewButton: t.demo.intake.tagsAddNewButton,
                }}
                onAddTag={addCustomTag}
              />
            </div>
            {form.tags.length === 0 && <p className="mt-2 text-xs text-amber-700">{ci.noTagsWarning}</p>}
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <label className="block text-sm font-semibold text-navy-700">{ci.fieldPeriodicity}</label>
                {badge("periodicity")}
              </div>
              <select
                value={form.periodicity}
                onChange={(e) => setForm({ ...form, periodicity: e.target.value as ReportingPeriodicity })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              >
                <option value="quarterly">{t.awardedProjects.periodicityQuarterly}</option>
                <option value="biannual">{t.awardedProjects.periodicityBiannual}</option>
                <option value="annual">{t.awardedProjects.periodicityAnnual}</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldInterimReports}</label>
              <input
                type="number"
                min={0}
                value={form.interimReportsRequired}
                onChange={(e) => setForm({ ...form, interimReportsRequired: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <label className="block text-sm font-semibold text-navy-700">{ci.fieldAuditThreshold}</label>
                {badge("audit")}
              </div>
              <input
                type="number"
                value={form.auditThreshold}
                onChange={(e) => setForm({ ...form, auditThreshold: e.target.value })}
                placeholder={ci.noAuditThreshold}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          </div>

          <div
            className={`rounded-md px-4 py-3 text-sm ${missingForMatching.length > 0 ? "bg-amber-50 text-amber-800" : "bg-green-50 text-green-800"}`}
          >
            <p className="font-semibold">{ci.completenessTitle}</p>
            {missingForMatching.length > 0 ? (
              <>
                <p className="mt-1">{ci.completenessIntro}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5">
                  {missingForMatching.map((m) => (
                    <li key={m}>{m}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="mt-1">{ci.completenessAllGood}</p>
            )}
          </div>

          {error && <p className="text-sm text-red-700">{error}</p>}

          <button
            type="button"
            onClick={handleSave}
            className="rounded-md bg-gold-500 px-5 py-2.5 text-sm font-semibold text-navy-900 shadow-sm transition hover:bg-gold-400"
          >
            {ci.saveButton}
          </button>
        </div>

        <div className="mb-16 mt-8">
          <h2 className="text-lg font-bold text-navy-800">{ci.importedListTitle}</h2>
          {imported.length === 0 ? (
            <p className="mt-2 text-sm text-navy-500">{ci.noImportedCalls}</p>
          ) : (
            <ul className="mt-3 divide-y divide-navy-50 rounded-xl border border-navy-100 bg-white">
              {imported.map((call) => (
                <li key={call.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                  <div>
                    <Link
                      href={`/eu-databas/${call.programId}/${call.id}`}
                      className="font-semibold text-navy-800 hover:underline"
                    >
                      {lang === "sv" ? call.title_sv : call.title_en}
                    </Link>
                    <p className="text-xs text-navy-400">
                      {ci.provenanceAssisted}
                      {call.importedAt && ` · ${ci.importedAtLabel(new Date(call.importedAt).toLocaleDateString(lang === "sv" ? "sv-SE" : "en-US"))}`}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const title = lang === "sv" ? call.title_sv : call.title_en;
                      if (window.confirm(ci.confirmRemoveImportedCall(title))) removeImportedCall(call.id);
                    }}
                    className="text-xs font-semibold text-navy-400 hover:text-red-600"
                  >
                    {ci.removeButton}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}

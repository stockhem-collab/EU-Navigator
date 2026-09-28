"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms } from "@/lib/data/fundingPrograms";
import { fundingCalls, applicantTypeLabel, ALL_APPLICANT_TYPES } from "@/lib/data/fundingCalls";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { extractCallDraft, slugifyCallId, ExtractionConfidence } from "@/lib/matching/callExtraction";
import { ApplicantType, FundingCall, ReportingPeriodicity } from "@/lib/types";

interface FormState {
  programId: string;
  titleSv: string;
  titleEn: string;
  status: "open" | "upcoming";
  deadlineMonthsFromNow: number;
  budgetTotalSEK: number;
  minGrantSEK: number;
  maxGrantSEK: number;
  requiresPartnership: boolean;
  eligibleSv: string;
  eligibleEn: string;
  applicantTypes: ApplicantType[];
  prioritiesSv: string;
  periodicity: ReportingPeriodicity;
  interimReportsRequired: number;
  auditThreshold: string;
}

const EMPTY_FORM: FormState = {
  programId: "",
  titleSv: "",
  titleEn: "",
  status: "open",
  deadlineMonthsFromNow: 6,
  budgetTotalSEK: 0,
  minGrantSEK: 0,
  maxGrantSEK: 0,
  requiresPartnership: false,
  eligibleSv: "",
  eligibleEn: "",
  applicantTypes: [],
  prioritiesSv: "",
  periodicity: "annual",
  interimReportsRequired: 2,
  auditThreshold: "",
};

type ConfidenceMap = Partial<Record<"budget" | "grantRange" | "partnership" | "applicantTypes" | "priorities" | "periodicity" | "audit", ExtractionConfidence>>;

export default function ImportUtlysningPage() {
  const { t, lang } = useLanguage();
  const ci = t.callImport;
  const { imported, addImportedCall, removeImportedCall, hydrated } = useFundingCalls();

  const [rawText, setRawText] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [confidence, setConfidence] = useState<ConfidenceMap>({});
  const [error, setError] = useState<string | null>(null);

  const handleParse = () => {
    const draft = extractCallDraft(rawText);
    setForm((prev) => ({
      ...prev,
      budgetTotalSEK: draft.budgetTotalSEK.value,
      minGrantSEK: draft.minGrantSEK.value,
      maxGrantSEK: draft.maxGrantSEK.value,
      requiresPartnership: draft.requiresPartnership.value,
      applicantTypes: draft.applicantTypes.value,
      prioritiesSv: draft.priorities_sv.value.join("\n"),
      periodicity: draft.periodicity.value,
      auditThreshold: draft.requiresAuditAboveSEK.value !== null ? String(draft.requiresAuditAboveSEK.value) : "",
    }));
    setConfidence({
      budget: draft.budgetTotalSEK.confidence,
      grantRange: draft.minGrantSEK.confidence,
      partnership: draft.requiresPartnership.confidence,
      applicantTypes: draft.applicantTypes.confidence,
      priorities: draft.priorities_sv.confidence,
      periodicity: draft.periodicity.confidence,
      audit: draft.requiresAuditAboveSEK.confidence,
    });
  };

  const toggleApplicantType = (type: ApplicantType) =>
    setForm((prev) => ({
      ...prev,
      applicantTypes: prev.applicantTypes.includes(type)
        ? prev.applicantTypes.filter((t2) => t2 !== type)
        : [...prev.applicantTypes, type],
    }));

  const handleSave = () => {
    if (!form.programId || !form.titleSv.trim() || !form.titleEn.trim()) {
      setError(ci.requiredFieldsError);
      return;
    }
    setError(null);

    const existingIds = [...fundingCalls.map((c) => c.id), ...imported.map((c) => c.id)];
    const id = slugifyCallId(form.titleSv, existingIds);
    const priorities_sv = form.prioritiesSv.split("\n").map((l) => l.trim()).filter(Boolean);

    const call: FundingCall = {
      id,
      programId: form.programId,
      title_sv: form.titleSv.trim(),
      title_en: form.titleEn.trim(),
      status: form.status,
      deadlineMonthsFromNow: form.deadlineMonthsFromNow,
      budgetTotalSEK: form.budgetTotalSEK,
      minGrantSEK: form.minGrantSEK,
      maxGrantSEK: form.maxGrantSEK,
      requiresPartnership: form.requiresPartnership,
      eligibleApplicants_sv: form.eligibleSv.trim(),
      eligibleApplicants_en: form.eligibleEn.trim(),
      applicantTypes: form.applicantTypes.length > 0 ? form.applicantTypes : undefined,
      priorities_sv,
      priorities_en: priorities_sv,
      extraKeywords: [],
      evaluationCriteria: [],
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
    setForm(EMPTY_FORM);
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
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldDeadline}</label>
              <input
                type="number"
                value={form.deadlineMonthsFromNow}
                onChange={(e) => setForm({ ...form, deadlineMonthsFromNow: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <p className="mt-0.5 text-xs text-navy-400">{ci.fieldDeadlineHint}</p>
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldTitleSv}</label>
              <input
                value={form.titleSv}
                onChange={(e) => setForm({ ...form, titleSv: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldTitleEn}</label>
              <input
                value={form.titleEn}
                onChange={(e) => setForm({ ...form, titleEn: e.target.value })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldBudget}</label>
              {badge("budget")}
            </div>
            <input
              type="number"
              value={form.budgetTotalSEK}
              onChange={(e) => setForm({ ...form, budgetTotalSEK: Number(e.target.value) })}
              className="mt-1 w-full max-w-xs rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <div className="flex items-center gap-2">
                <label className="block text-sm font-semibold text-navy-700">{ci.fieldMinGrant}</label>
                {badge("grantRange")}
              </div>
              <input
                type="number"
                value={form.minGrantSEK}
                onChange={(e) => setForm({ ...form, minGrantSEK: Number(e.target.value) })}
                className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldMaxGrant}</label>
              <input
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

          <div>
            <div className="flex items-center gap-2">
              <label className="block text-sm font-semibold text-navy-700">{ci.fieldPriorities}</label>
              {badge("priorities")}
            </div>
            <p className="mt-0.5 text-xs text-navy-400">{ci.fieldPrioritiesHint}</p>
            <textarea
              rows={4}
              value={form.prioritiesSv}
              onChange={(e) => setForm({ ...form, prioritiesSv: e.target.value })}
              className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
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

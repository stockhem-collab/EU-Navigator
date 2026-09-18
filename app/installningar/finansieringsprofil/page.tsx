"use client";

import { useState } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useFundingProfile, ProjectSize, GeoInterest, CoFinancingCap } from "@/lib/hooks/useFundingProfile";

export default function FundingProfileSettingsPage() {
  const { t } = useLanguage();
  const fp = t.fundingProfileSettings;
  const {
    profile,
    hydrated,
    addFocusArea,
    removeFocusArea,
    setProjectSize,
    toggleGeo,
    setCanPartner,
    setCanLead,
    setCoFinancingCap,
    resetAll,
  } = useFundingProfile();
  const [newTag, setNewTag] = useState("");

  if (!hydrated) return null;

  const sizeOptions: { key: ProjectSize; label: string }[] = [
    { key: "lt1m", label: fp.sizeLt1m },
    { key: "1-10m", label: fp.size1to10 },
    { key: "10-50m", label: fp.size10to50 },
    { key: "gt50m", label: fp.sizeGt50 },
  ];

  const geoOptions: { key: GeoInterest; label: string }[] = [
    { key: "sweden", label: fp.geoSweden },
    { key: "nordic", label: fp.geoNordic },
    { key: "baltic", label: fp.geoBaltic },
    { key: "eu", label: fp.geoEu },
  ];

  const coFinancingOptions: { key: CoFinancingCap; label: string }[] = [
    { key: "upTo10", label: fp.coFinancing10 },
    { key: "upTo30", label: fp.coFinancing30 },
    { key: "upTo50", label: fp.coFinancing50 },
    { key: "over50", label: fp.coFinancingOver50 },
  ];

  return (
    <>
      <Header />
      <main className="section max-w-2xl">
        <Link href="/installningar" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          {fp.back}
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-navy-900">{fp.title}</h1>
            <p className="mt-2 text-sm text-navy-600">{fp.subtitle}</p>
          </div>
          <button
            type="button"
            onClick={resetAll}
            className="shrink-0 rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50"
          >
            {fp.resetAll}
          </button>
        </div>

        <div className="mb-16 mt-8 space-y-6 rounded-xl border border-navy-100 bg-white p-6">
          <div>
            <label className="block text-sm font-semibold text-navy-800">{fp.focusAreasLabel}</label>
            <div className="mt-2 flex flex-wrap gap-2">
              {profile.focusAreas.map((tag) => (
                <span
                  key={tag}
                  className="flex items-center gap-1.5 rounded-full bg-navy-100 px-3 py-1 text-xs font-semibold text-navy-700"
                >
                  {tag}
                  <button type="button" onClick={() => removeFocusArea(tag)} className="text-navy-400 hover:text-red-600">
                    ✕
                  </button>
                </span>
              ))}
            </div>
            <div className="mt-2 flex gap-2">
              <input
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addFocusArea(newTag);
                    setNewTag("");
                  }
                }}
                placeholder={fp.focusAreasPlaceholder}
                className="w-56 rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
              />
              <button
                type="button"
                onClick={() => {
                  addFocusArea(newTag);
                  setNewTag("");
                }}
                className="rounded-md border border-navy-200 px-3 py-2 text-xs font-semibold text-navy-600 hover:bg-navy-50"
              >
                {fp.addTag}
              </button>
            </div>
          </div>

          <div className="border-t border-navy-50 pt-5">
            <label className="block text-sm font-semibold text-navy-800">{fp.projectSizeLabel}</label>
            <div className="mt-2 space-y-1.5">
              {sizeOptions.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 text-sm text-navy-700">
                  <input type="radio" name="projectSize" checked={profile.projectSize === opt.key} onChange={() => setProjectSize(opt.key)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-navy-50 pt-5">
            <label className="block text-sm font-semibold text-navy-800">{fp.geoLabel}</label>
            <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
              {geoOptions.map((opt) => (
                <label key={opt.key} className="flex items-center gap-2 text-sm text-navy-700">
                  <input type="checkbox" checked={profile.geoInterest.includes(opt.key)} onChange={() => toggleGeo(opt.key)} />
                  {opt.label}
                </label>
              ))}
            </div>
          </div>

          <div className="border-t border-navy-50 pt-5 space-y-2">
            <label className="flex items-center gap-2 text-sm font-semibold text-navy-800">
              <input type="checkbox" checked={profile.canPartner} onChange={(e) => setCanPartner(e.target.checked)} />
              {fp.partnerLabel}
            </label>
            <label className="flex items-center gap-2 text-sm font-semibold text-navy-800">
              <input type="checkbox" checked={profile.canLead} onChange={(e) => setCanLead(e.target.checked)} />
              {fp.leadLabel}
            </label>
          </div>

          <div className="border-t border-navy-50 pt-5">
            <label className="block text-sm font-semibold text-navy-800">{fp.coFinancingLabel}</label>
            <select
              value={profile.coFinancingCap}
              onChange={(e) => setCoFinancingCap(e.target.value as CoFinancingCap)}
              className="mt-2 w-full max-w-xs rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            >
              {coFinancingOptions.map((opt) => (
                <option key={opt.key} value={opt.key}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-navy-400">{fp.savedIndicator}</p>
        </div>
      </main>
      <Footer />
    </>
  );
}

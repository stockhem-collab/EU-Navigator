"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProjectInput, Sector } from "@/lib/types";

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

const EXAMPLE_SV: ProjectInput = {
  title: "Energieffektivisering av 14 skolor",
  description:
    "Vi behöver energieffektivisera 14 skolor 2027–2029. Investeringen omfattar solceller, styrsystem, ventilation och energilagring för att minska energiförbrukning och klimatpåverkan.",
  sector: "energy",
  budgetSEK: 120_000_000,
  startYear: 2027,
  endYear: 2029,
  municipality: "Exempelstad kommun",
  hasInternationalPartner: false,
};

const EXAMPLE_EN: ProjectInput = {
  title: "Energy efficiency upgrade of 14 schools",
  description:
    "We need to upgrade the energy efficiency of 14 schools in 2027–2029. The investment covers solar panels, control systems, ventilation and energy storage to reduce energy use and climate impact.",
  sector: "energy",
  budgetSEK: 120_000_000,
  startYear: 2027,
  endYear: 2029,
  municipality: "Example City Municipality",
  hasInternationalPartner: false,
};

interface Props {
  onSubmit: (project: ProjectInput) => void;
  initialProject?: ProjectInput;
}

export default function ProjectForm({ onSubmit, initialProject }: Props) {
  const { t, lang } = useLanguage();
  const [project, setProject] = useState<ProjectInput>(initialProject ?? DEFAULT_PROJECT);
  const intake = t.demo.intake;

  const fillExample = () => setProject(lang === "sv" ? EXAMPLE_SV : EXAMPLE_EN);

  return (
    <div className="mx-auto max-w-2xl">
      {initialProject && (
        <p className="mb-4 rounded-md bg-navy-50 px-3 py-2 text-xs text-navy-600">{intake.prefilledFromBank}</p>
      )}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">{intake.title}</h1>
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
        className="mt-8 space-y-6"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit(project);
        }}
      >
        <div>
          <label className="block text-sm font-semibold text-navy-800">{intake.fieldTitle}</label>
          <input
            required
            value={project.title}
            onChange={(e) => setProject({ ...project, title: e.target.value })}
            placeholder={intake.fieldTitlePlaceholder}
            className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-800">{intake.fieldDescription}</label>
          <textarea
            required
            rows={4}
            value={project.description}
            onChange={(e) => setProject({ ...project, description: e.target.value })}
            placeholder={intake.fieldDescriptionPlaceholder}
            className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-semibold text-navy-800">{intake.fieldSector}</label>
            <select
              value={project.sector}
              onChange={(e) => setProject({ ...project, sector: e.target.value as Sector })}
              className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            >
              {SECTORS.map((s) => (
                <option key={s} value={s}>
                  {intake.sectors[s]}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-800">{intake.fieldBudget}</label>
            <input
              type="number"
              min={0}
              step={100000}
              required
              value={project.budgetSEK}
              onChange={(e) => setProject({ ...project, budgetSEK: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-800">{intake.fieldStartYear}</label>
            <input
              type="number"
              required
              value={project.startYear}
              onChange={(e) => setProject({ ...project, startYear: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-navy-800">{intake.fieldEndYear}</label>
            <input
              type="number"
              required
              value={project.endYear}
              onChange={(e) => setProject({ ...project, endYear: Number(e.target.value) })}
              className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-navy-800">{intake.fieldMunicipality}</label>
          <input
            required
            value={project.municipality}
            onChange={(e) => setProject({ ...project, municipality: e.target.value })}
            placeholder={intake.fieldMunicipalityPlaceholder}
            className="mt-1 w-full rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>

        <label className="flex items-center gap-3 text-sm text-navy-700">
          <input
            type="checkbox"
            checked={project.hasInternationalPartner}
            onChange={(e) => setProject({ ...project, hasInternationalPartner: e.target.checked })}
            className="h-4 w-4 rounded border-navy-300 text-navy-700 focus:ring-navy-500"
          />
          {intake.fieldPartnership}
        </label>

        <button
          type="submit"
          className="w-full rounded-md bg-navy-800 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-navy-700"
        >
          {intake.submit}
        </button>
      </form>
    </div>
  );
}

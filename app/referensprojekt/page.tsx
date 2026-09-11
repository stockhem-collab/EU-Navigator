"use client";

import { Suspense, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { fundingPrograms, findProgram } from "@/lib/data/fundingPrograms";
import { referenceProjects, computeSuccessPatterns } from "@/lib/data/referenceProjects";
import { fmtSEK, fmtPct } from "@/lib/format";

export default function ReferenceProjectsPage() {
  return (
    <Suspense fallback={null}>
      <ReferenceProjectsInner />
    </Suspense>
  );
}

function ReferenceProjectsInner() {
  const searchParams = useSearchParams();
  const initialProgram = searchParams.get("program") ?? "all";
  const [programFilter, setProgramFilter] = useState(initialProgram);
  const { t, lang } = useLanguage();
  const rp = t.referenceProjects;

  const filtered = useMemo(
    () => (programFilter === "all" ? referenceProjects : referenceProjects.filter((p) => p.programId === programFilter)),
    [programFilter]
  );
  const patterns = computeSuccessPatterns(filtered);

  return (
    <>
      <Header />
      <main className="section">
        <h1 className="text-2xl font-bold text-navy-900">{rp.title}</h1>
        <p className="mt-2 text-sm text-navy-600">{rp.subtitle}</p>
        <p className="mt-3 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-800">{rp.disclaimer}</p>

        <div className="mt-6">
          <select
            value={programFilter}
            onChange={(e) => setProgramFilter(e.target.value)}
            className="rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            <option value="all">{rp.filterAll}</option>
            {fundingPrograms.map((p) => (
              <option key={p.id} value={p.id}>
                {lang === "sv" ? p.name_sv : p.name}
              </option>
            ))}
          </select>
        </div>

        <section className="mt-6 rounded-xl bg-navy-800 p-6 text-white">
          <h2 className="font-bold">{rp.patternsTitle}</h2>
          <p className="mt-1 text-sm text-navy-300">{rp.patternsIntro(patterns.total)}</p>
          <div className="mt-4 grid grid-cols-2 gap-4 text-sm sm:grid-cols-5">
            <Stat value={patterns.quantifiedImpactPct} label={rp.patternQuantified} />
            <Stat value={patterns.scalabilityPct} label={rp.patternScalability} />
            <Stat value={patterns.multiOrgPct} label={rp.patternMultiOrg} />
            <Stat value={patterns.goalAlignmentPct} label={rp.patternGoalAlignment} />
            <Stat value={patterns.pilotDemoPct} label={rp.patternPilot} />
          </div>
          <div className="mt-6 rounded-lg bg-white/5 p-4">
            <p className="text-sm font-semibold text-gold-300">{rp.whatItMeansTitle}</p>
            <p className="mt-1 text-sm text-navy-200">{rp.whatItMeansBody}</p>
          </div>
        </section>

        <div className="mt-8 grid gap-5 md:grid-cols-2">
          {filtered.map((project) => {
            const program = findProgram(project.programId);
            return (
              <div key={project.id} className="rounded-xl border border-navy-100 bg-white p-6">
                <p className="text-xs font-semibold uppercase text-navy-400">{program?.shortName}</p>
                <h3 className="mt-1 font-bold text-navy-900">
                  {lang === "sv" ? project.area_sv : project.area_en}
                </h3>
                <p className="mt-2 text-sm text-navy-600">
                  {lang === "sv" ? project.problem_sv : project.problem_en}
                </p>
                <p className="mt-2 text-sm text-navy-700">
                  <span className="font-semibold">{lang === "sv" ? "Mål: " : "Goal: "}</span>
                  {lang === "sv" ? project.goal_sv : project.goal_en}
                </p>

                <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-navy-50 pt-4 text-sm">
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldOrganisation}</dt>
                    <dd className="font-semibold text-navy-800">{project.organisation}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldBudget}</dt>
                    <dd className="font-semibold text-navy-800">{fmtSEK(project.budgetSEK, lang)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldFundingRate}</dt>
                    <dd className="font-semibold text-navy-800">{fmtPct(project.fundingRate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs text-navy-400">{rp.fieldPartners}</dt>
                    <dd className="font-semibold text-navy-800">{project.partners.length}</dd>
                  </div>
                </dl>

                <div className="mt-4">
                  <p className="text-xs text-navy-400">{rp.fieldIndicators}</p>
                  <p className="mt-1 text-sm text-navy-700">
                    {(lang === "sv" ? project.indicators_sv : project.indicators_en).join(" · ")}
                  </p>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-navy-400">{rp.fieldInnovation}</p>
                  <p className="mt-1 text-sm text-navy-700">
                    {lang === "sv" ? project.innovationLevel_sv : project.innovationLevel_en}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <div>
      <p className="text-2xl font-bold text-gold-300">{value}%</p>
      <p className="text-navy-300">{label}</p>
    </div>
  );
}

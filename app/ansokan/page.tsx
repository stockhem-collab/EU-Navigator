"use client";

import { Suspense, useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectForm from "@/components/demo/ProjectForm";
import MatchResults from "@/components/demo/MatchResults";
import ApplicationWorkspace from "@/components/demo/ApplicationWorkspace";
import { findCall } from "@/lib/data/fundingCalls";
import { useFundingCalls } from "@/lib/hooks/useFundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { findProjectBankEntry } from "@/lib/data/projectBank";
import { findAnyProjectBankEntry } from "@/lib/hooks/useProjectBank";
import { computeMatches, scoreMatch } from "@/lib/matching/scoreMatch";
import { projectBankEntryToProjectInput } from "@/lib/matching/portfolio";
import { useFundingProfile } from "@/lib/hooks/useFundingProfile";
import { useProjectBank } from "@/lib/hooks/useProjectBank";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { MatchResult, ProjectInput } from "@/lib/types";

type Step =
  // `project` here is only ever a restored in-progress draft (from going
  // "← Tillbaka" on the match results below) — never a saved/prefilled one,
  // which stays separate as ProjectForm's own initialProject prop.
  | { name: "intake"; project?: ProjectInput }
  | { name: "results"; project: ProjectInput; matches: MatchResult[] }
  | { name: "workspace"; project: ProjectInput; match: MatchResult };

export default function DemoPage() {
  return (
    <Suspense fallback={null}>
      <DemoPageInner />
    </Suspense>
  );
}

function DemoPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const preselectedCallId = searchParams.get("call");
  const preselectedProjectId = searchParams.get("project");
  const requestedApplicationId = searchParams.get("application");
  const { profile: fundingProfile, hydrated: profileHydrated } = useFundingProfile();
  const { all: fundingCalls, hydrated: callsHydrated } = useFundingCalls();

  // Starts as whatever the URL said, but can also become persisted mid-session
  // — see the workspace's "save as a new project" flow below — without a
  // page navigation or losing the in-progress draft.
  const [customerProjectId, setCustomerProjectId] = useState<string | null>(preselectedProjectId);

  // Coming here with both ?project= and ?call= — e.g. "Fortsätt" on a saved
  // project's match, or the Översikt "Pågående ansökningar" quick-entry
  // list — means the user already knows exactly which application they
  // want and is trying to get straight back into it. Skipping the intake
  // form (which would otherwise re-show pre-filled fields the user must
  // re-submit) and landing directly in the workspace is what makes that
  // "quick" rather than one extra click for no reason.
  //
  // This lazy initializer only ever sees the seed catalogues (findCall,
  // findProjectBankEntry — never the imported-calls hook or
  // findAnyProjectBankEntry's localStorage fallback): it runs once on the
  // very first render, on both the server and the client, and localStorage
  // only exists on the client — branching this initial state on it would
  // make the two environments compute different output for the exact same
  // input, which is a hydration mismatch. Seed data is identical in both
  // places, so it's safe here.
  const [step, setStep] = useState<Step>(() => {
    if (preselectedProjectId && preselectedCallId) {
      const entry = findProjectBankEntry(preselectedProjectId);
      const call = findCall(preselectedCallId);
      const program = call ? findProgram(call.programId) : undefined;
      if (entry && call && program) {
        const project = projectBankEntryToProjectInput(entry);
        return { name: "workspace", project, match: scoreMatch(project, call, program, fundingProfile) };
      }
    }
    return { name: "intake" };
  });

  // Once mounted, the deep link is resolved again against what this
  // browser actually has: the project as saved (edits to a seeded project
  // live in localStorage overrides, which the seed-only guess above can't
  // see), imported calls, and the organisation's own funding profile.
  // Without this, the workspace would score and assess a project the user
  // has since edited — or not open at all for an imported call.
  const [storedProject, setStoredProject] = useState<ProjectInput | undefined>(undefined);
  const [resolved, setResolved] = useState(false);
  useEffect(() => {
    if (resolved || !profileHydrated || !callsHydrated) return;
    setResolved(true);
    if (!preselectedProjectId) return;
    const entry = findAnyProjectBankEntry(preselectedProjectId);
    if (!entry) return;
    const project = projectBankEntryToProjectInput(entry);
    setStoredProject(project);
    if (!preselectedCallId) return;
    const call = fundingCalls.find((c) => c.id === preselectedCallId);
    const program = call ? findProgram(call.programId) : undefined;
    if (call && program) {
      setStep({ name: "workspace", project, match: scoreMatch(project, call, program, fundingProfile) });
    }
  }, [resolved, profileHydrated, callsHydrated, preselectedProjectId, preselectedCallId, step, fundingCalls, fundingProfile]);

  // Same seed-only restriction as the lazy initializer above on the first
  // render; the saved version replaces it once read (ProjectForm is keyed
  // on it below, so its fields pick the saved values up).
  const seedProject = preselectedProjectId
    ? (() => {
        const entry = findProjectBankEntry(preselectedProjectId);
        return entry ? projectBankEntryToProjectInput(entry) : undefined;
      })()
    : undefined;
  const initialProject = storedProject ?? seedProject;

  // Reached with both ?project= and ?call= — from a project page, Ansöka,
  // Översikt or a notification — "back" means back to where the user came
  // from, not to a match list they never saw.
  const deepLinked = Boolean(preselectedProjectId && preselectedCallId);
  const leaveWorkspace = () => {
    if (window.history.length > 1) router.back();
    else router.push(customerProjectId ? `/projekt/${customerProjectId}` : "/ansok");
  };

  return (
    <>
      <Header />
      <main className="section min-h-[70vh]">
        {step.name === "intake" && (
          <>
          {!preselectedProjectId && !step.project && <ExistingProjectPicker />}
          <ProjectForm
            key={storedProject ? "stored" : "seed"}
            initialProject={initialProject}
            draftProject={step.project}
            onSubmit={(project) => {
              // Coming from a specific call in the EU database ("Hjälp mig
              // söka") locks the AI straight into that call's context on the
              // very first submission, skipping the general results list —
              // but only then. `step.project` is only set here when this
              // intake was reached via "Ändra projekt" (the results step's
              // back button) — i.e. the user already saw the matching step
              // once and deliberately went back to edit the description. In
              // that case they get the results step again, recomputed
              // against the edited project, rather than being silently
              // funnelled back into the one originally preselected call.
              const preselectedCall =
                !step.project && preselectedCallId ? fundingCalls.find((c) => c.id === preselectedCallId) : undefined;
              const preselectedProgram = preselectedCall ? findProgram(preselectedCall.programId) : undefined;

              if (preselectedCall && preselectedProgram) {
                const match = scoreMatch(project, preselectedCall, preselectedProgram, fundingProfile);
                setStep({ name: "workspace", project, match });
                return;
              }

              const matches = computeMatches(project, fundingCalls, fundingProfile);
              setStep({ name: "results", project, matches });
            }}
          />
          </>
        )}

        {step.name === "results" && (
          <MatchResults
            matches={step.matches}
            onBack={() => setStep({ name: "intake", project: step.project })}
            onSelect={(match) => setStep({ name: "workspace", project: step.project, match })}
          />
        )}

        {step.name === "workspace" && (
          <ApplicationWorkspace
            project={step.project}
            match={step.match}
            customerProjectId={customerProjectId}
            applicationId={requestedApplicationId}
            onSavedAsProject={(newId) => {
              setCustomerProjectId(newId);
              // Keeps the URL resumable after a refresh, without remounting
              // the workspace (which would lose the in-memory draft) —
              // replace only updates history, it doesn't reset component state.
              router.replace(`/ansokan?project=${newId}&call=${step.match.call.id}`, { scroll: false });
            }}
            backLabel={deepLinked ? "back" : "matches"}
            onBack={() =>
              deepLinked
                ? leaveWorkspace()
                : setStep({
                name: "results",
                project: step.project,
                matches: computeMatches(step.project, fundingCalls, fundingProfile),
              })
            }
          />
        )}
      </main>
      <Footer />
    </>
  );
}

// "Ny ansökan" always starts by describing a project — which, for a project
// that's already in the system, would create a duplicate. This offers the
// existing one instead: its page lists the calls it matches, each with its
// own "Starta ansökan".
function ExistingProjectPicker() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const intake = t.demo.intake;
  const { all: projects, hydrated } = useProjectBank();
  const [selected, setSelected] = useState("");
  if (!hydrated || projects.length === 0) return null;
  return (
    <div className="mx-auto mb-8 max-w-2xl rounded-xl border border-navy-100 bg-white p-4">
      <p className="text-sm font-semibold text-navy-800">{intake.existingProjectTitle}</p>
      <p className="mt-1 text-xs text-navy-500">{intake.existingProjectHint}</p>
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <label htmlFor="existing-project" className="sr-only">
          {intake.existingProjectTitle}
        </label>
        <select
          id="existing-project"
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="min-w-0 flex-1 rounded-md border border-navy-200 px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
        >
          <option value="">{intake.existingProjectPlaceholder}</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {lang === "sv" ? p.title_sv : p.title_en}
            </option>
          ))}
        </select>
        <button
          type="button"
          disabled={!selected}
          onClick={() => router.push(`/projekt/${selected}#matches`)}
          className="rounded-md bg-navy-800 px-3 py-2 text-sm font-semibold text-white hover:bg-navy-700 disabled:cursor-not-allowed disabled:bg-navy-200"
        >
          {intake.existingProjectGo}
        </button>
      </div>
    </div>
  );
}

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
  const { profile: fundingProfile } = useFundingProfile();
  const { all: fundingCalls } = useFundingCalls();

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

  // Upgrades the guess above once mounted, for a project that only exists
  // in this browser's localStorage — imported via CSV, or saved from an
  // ad-hoc draft via the workspace's "Spara som nytt projekt" button (see
  // ApplicationWorkspace's onSavedAsProject) — which the seed-only lookup
  // above can't see without risking the hydration mismatch it exists to
  // avoid. Runs once; picks up the deep link a beat later rather than never.
  useEffect(() => {
    if (step.name !== "intake" || !preselectedProjectId || !preselectedCallId) return;
    const entry = findAnyProjectBankEntry(preselectedProjectId);
    const call = findCall(preselectedCallId);
    const program = call ? findProgram(call.programId) : undefined;
    if (entry && call && program) {
      const project = projectBankEntryToProjectInput(entry);
      setStep({ name: "workspace", project, match: scoreMatch(project, call, program, fundingProfile) });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Same seed-only restriction as the lazy initializer above, and for the
  // same reason: this recomputes on every render, so unlike a lazy
  // initializer it would keep disagreeing with the server-rendered markup
  // on every render, not just the first, if it looked at localStorage.
  const initialProject = preselectedProjectId
    ? (() => {
        const entry = findProjectBankEntry(preselectedProjectId);
        return entry ? projectBankEntryToProjectInput(entry) : undefined;
      })()
    : undefined;

  return (
    <>
      <Header />
      <main className="section min-h-[70vh]">
        {step.name === "intake" && (
          <ProjectForm
            initialProject={initialProject}
            draftProject={step.project}
            onSubmit={(project) => {
              // Coming from a specific call in the EU database ("Hjälp mig
              // söka") locks the AI straight into that call's context,
              // skipping the general results list.
              const preselectedCall = preselectedCallId ? fundingCalls.find((c) => c.id === preselectedCallId) : undefined;
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
            onSavedAsProject={(newId) => {
              setCustomerProjectId(newId);
              // Keeps the URL resumable after a refresh, without remounting
              // the workspace (which would lose the in-memory draft) —
              // replace only updates history, it doesn't reset component state.
              router.replace(`/demo?project=${newId}&call=${step.match.call.id}`, { scroll: false });
            }}
            onBack={() =>
              setStep({
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

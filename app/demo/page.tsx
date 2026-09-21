"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectForm from "@/components/demo/ProjectForm";
import MatchResults from "@/components/demo/MatchResults";
import ApplicationWorkspace from "@/components/demo/ApplicationWorkspace";
import { fundingCalls, findCall } from "@/lib/data/fundingCalls";
import { findProgram } from "@/lib/data/fundingPrograms";
import { findAnyProjectBankEntry } from "@/lib/hooks/useProjectBank";
import { computeMatches, scoreMatch } from "@/lib/matching/scoreMatch";
import { projectBankEntryToProjectInput } from "@/lib/matching/portfolio";
import { useFundingProfile } from "@/lib/hooks/useFundingProfile";
import { MatchResult, ProjectInput } from "@/lib/types";

type Step =
  | { name: "intake" }
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
  const searchParams = useSearchParams();
  const preselectedCallId = searchParams.get("call");
  const preselectedProjectId = searchParams.get("project");
  const { profile: fundingProfile } = useFundingProfile();

  // Coming here with both ?project= and ?call= — e.g. "Fortsätt" on a saved
  // project's match, or the Översikt "Pågående ansökningar" quick-entry
  // list — means the user already knows exactly which application they
  // want and is trying to get straight back into it. Skipping the intake
  // form (which would otherwise re-show pre-filled fields the user must
  // re-submit) and landing directly in the workspace is what makes that
  // "quick" rather than one extra click for no reason.
  const [step, setStep] = useState<Step>(() => {
    if (preselectedProjectId && preselectedCallId) {
      const entry = findAnyProjectBankEntry(preselectedProjectId);
      const call = findCall(preselectedCallId);
      const program = call ? findProgram(call.programId) : undefined;
      if (entry && call && program) {
        const project = projectBankEntryToProjectInput(entry);
        return { name: "workspace", project, match: scoreMatch(project, call, program, fundingProfile) };
      }
    }
    return { name: "intake" };
  });

  const initialProject = preselectedProjectId
    ? (() => {
        const entry = findAnyProjectBankEntry(preselectedProjectId);
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
            onSubmit={(project) => {
              // Coming from a specific call in the EU database ("Hjälp mig
              // söka") locks the AI straight into that call's context,
              // skipping the general results list.
              const preselectedCall = preselectedCallId ? findCall(preselectedCallId) : undefined;
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
            onBack={() => setStep({ name: "intake" })}
            onSelect={(match) => setStep({ name: "workspace", project: step.project, match })}
          />
        )}

        {step.name === "workspace" && (
          <ApplicationWorkspace
            project={step.project}
            match={step.match}
            customerProjectId={preselectedProjectId}
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

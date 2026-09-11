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
import { computeMatches, scoreMatch } from "@/lib/matching/scoreMatch";
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
  const [step, setStep] = useState<Step>({ name: "intake" });

  return (
    <>
      <Header />
      <main className="section min-h-[70vh]">
        {step.name === "intake" && (
          <ProjectForm
            onSubmit={(project) => {
              // Coming from a specific call in the EU database ("Hjälp mig
              // söka") locks the AI straight into that call's context,
              // skipping the general results list.
              const preselectedCall = preselectedCallId ? findCall(preselectedCallId) : undefined;
              const preselectedProgram = preselectedCall ? findProgram(preselectedCall.programId) : undefined;

              if (preselectedCall && preselectedProgram) {
                const match = scoreMatch(project, preselectedCall, preselectedProgram);
                setStep({ name: "workspace", project, match });
                return;
              }

              const matches = computeMatches(project, fundingCalls);
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
            onBack={() =>
              setStep({
                name: "results",
                project: step.project,
                matches: computeMatches(step.project, fundingCalls),
              })
            }
          />
        )}
      </main>
      <Footer />
    </>
  );
}

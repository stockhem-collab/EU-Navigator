"use client";

import { useState } from "react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectForm from "@/components/demo/ProjectForm";
import MatchResults from "@/components/demo/MatchResults";
import ApplicationWorkspace from "@/components/demo/ApplicationWorkspace";
import { fundingPrograms } from "@/lib/data/fundingPrograms";
import { computeMatches } from "@/lib/matching/scoreMatch";
import { MatchResult, ProjectInput } from "@/lib/types";

type Step =
  | { name: "intake" }
  | { name: "results"; project: ProjectInput; matches: MatchResult[] }
  | { name: "workspace"; project: ProjectInput; match: MatchResult };

export default function DemoPage() {
  const [step, setStep] = useState<Step>({ name: "intake" });

  return (
    <>
      <Header />
      <main className="section min-h-[70vh]">
        {step.name === "intake" && (
          <ProjectForm
            onSubmit={(project) => {
              const matches = computeMatches(project, fundingPrograms);
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
                matches: computeMatches(step.project, fundingPrograms),
              })
            }
          />
        )}
      </main>
      <Footer />
    </>
  );
}

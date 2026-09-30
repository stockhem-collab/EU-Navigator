"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import ProjectForm from "@/components/demo/ProjectForm";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { useSaveProject } from "@/lib/hooks/useSaveProject";

// "+ Nytt projekt" under Projekt: the same form as Ny ansökan's first step,
// but here saving the project is the point — finding funding comes second.
// Either way the project lands on its own page, which lists the calls it
// matches ("#matches" scrolls straight to them).
export default function NewProjectPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const pb = t.projectBank;
  const save = useSaveProject();

  return (
    <>
      <Header />
      <main className="section min-h-[70vh]">
        <div className="mx-auto mb-6 max-w-2xl">
          <Link href="/projekt" className="text-sm font-semibold text-navy-600 hover:text-navy-900">
            ← {pb.back}
          </Link>
        </div>
        <ProjectForm
          heading={{ title: pb.newProjectTitle, subtitle: pb.newProjectSubtitle }}
          submitLabel={t.demo.intake.saveProject}
          onSubmit={(project) => router.push(`/projekt/${save(project)}`)}
          secondary={{
            label: pb.saveAndFindFunding,
            onClick: (project) => router.push(`/projekt/${save(project)}#matches`),
          }}
        />
      </main>
      <Footer />
    </>
  );
}

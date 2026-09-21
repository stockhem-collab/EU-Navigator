import type { Paragraph as ParagraphType } from "docx";
import { Lang, MatchResult, ProjectInput } from "@/lib/types";
import { ProjectLogicRow } from "@/lib/matching/generateWorkspace";
import { fmtSEK } from "@/lib/format";

// Exports the application as a real .docx file, structured around the
// call's own applicationTemplate when it has one (see lib/types.ts) — so
// the export genuinely follows "the template that applies to this specific
// call" rather than one fixed layout for every call. When a call has no
// defined template, this falls back to the generic project-logic sections
// and says so plainly *inside the exported document* — the file travels
// without the app's UI around it, so that caveat has to travel with it.

function resolvedText(row: ProjectLogicRow, sectionDrafts: Record<string, string>, lang: Lang): string {
  const aiText = lang === "sv" ? row.content_sv : row.content_en;
  return sectionDrafts[row.label_sv] ?? aiText;
}

export async function buildApplicationDocx(
  project: ProjectInput,
  match: MatchResult,
  logic: ProjectLogicRow[],
  sectionDrafts: Record<string, string>,
  lang: Lang
): Promise<Blob> {
  // Loaded on demand rather than statically imported — docx is a sizable
  // library only ever needed once a user actually clicks "export", so this
  // keeps it out of the Ansökningsstudio's normal page bundle.
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
  const { call, program } = match;
  const callTitle = lang === "sv" ? call.title_sv : call.title_en;
  const usesCallTemplate = Boolean(call.applicationTemplate && call.applicationTemplate.length > 0);

  const children: ParagraphType[] = [
    new Paragraph({ text: project.title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: `${program.shortName} — ${callTitle}`, italics: true })],
    }),
    new Paragraph({
      children: [
        new TextRun({
          text: usesCallTemplate
            ? lang === "sv"
              ? `Strukturerad enligt ${callTitle}s eget ansökningsformulär.`
              : `Structured according to ${callTitle}'s own application form.`
            : lang === "sv"
            ? "Generisk projektlogik — utlysningen har ingen fördefinierad ansökningsstruktur i systemet ännu, se den fullständiga utlysningstexten för det officiella formuläret."
            : "Generic project logic — this call has no predefined application structure in the system yet; see the full call text for the official form.",
          italics: true,
          color: "5B8BBB",
          size: 18,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];

  for (const row of logic) {
    const label = lang === "sv" ? row.label_sv : row.label_en;
    children.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_1 }));
    children.push(new Paragraph({ text: resolvedText(row, sectionDrafts, lang) }));
    children.push(new Paragraph({ text: "" }));
  }

  const estEu = (match.estimatedFundingSEK[0] + match.estimatedFundingSEK[1]) / 2;
  const coFinancing = Math.max(0, project.budgetSEK - estEu);
  children.push(new Paragraph({ text: lang === "sv" ? "Budget" : "Budget", heading: HeadingLevel.HEADING_1 }));
  children.push(
    new Paragraph({ text: `${lang === "sv" ? "Total budget" : "Total budget"}: ${fmtSEK(project.budgetSEK, lang)}` })
  );
  children.push(
    new Paragraph({
      text: `${lang === "sv" ? "Uppskattat EU-bidrag" : "Estimated EU contribution"}: ${fmtSEK(estEu, lang)}`,
    })
  );
  children.push(
    new Paragraph({
      text: `${lang === "sv" ? "Uppskattad medfinansiering" : "Estimated co-financing"}: ${fmtSEK(coFinancing, lang)}`,
    })
  );

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

/** Triggers a browser download of the built .docx — same Blob + `<a
 * download>` pattern already used for the Projektbank CSV template. */
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

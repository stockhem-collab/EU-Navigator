import type { Paragraph as ParagraphType } from "docx";
import { AwardedProject, FundingCall, FundingProgram, Lang, ReportingEvent } from "@/lib/types";
import { fmtSEK } from "@/lib/format";
import { cumulativeSpentThrough } from "@/lib/data/awardedProjects";

// Exports one reporting event as a real .docx draft — the same
// dynamically-imported docx pattern as exportApplication.ts, for the same
// reason: a person drafting an actual submission to the funder shouldn't
// have to retype outturn data the system already has, even though this
// demo stops short of an actual submission integration.

export async function buildReportDocx(
  project: AwardedProject,
  event: ReportingEvent,
  call: FundingCall | undefined,
  program: FundingProgram | undefined,
  lang: Lang
): Promise<Blob> {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");

  const title = lang === "sv" ? project.title_sv : project.title_en;
  const periodLabel = lang === "sv" ? event.periodLabel_sv : event.periodLabel_en;
  const callTitle = call ? (lang === "sv" ? call.title_sv : call.title_en) : "";

  const children: ParagraphType[] = [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [new TextRun({ text: `${program?.shortName ?? ""} — ${callTitle}`.trim(), italics: true })],
    }),
    new Paragraph({ text: periodLabel, heading: HeadingLevel.HEADING_1 }),
    new Paragraph({
      children: [
        new TextRun({
          text:
            lang === "sv"
              ? "Utkast genererat från systemets registrerade utfall — ersätter inte en faktisk inlämning till finansiären."
              : "Draft generated from the system's recorded outturn — does not replace an actual submission to the funder.",
          italics: true,
          color: "5B8BBB",
          size: 18,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
    new Paragraph({
      text: lang === "sv" ? "Beviljat belopp" : "Awarded amount",
      heading: HeadingLevel.HEADING_2,
    }),
    new Paragraph({ text: fmtSEK(project.awardedAmountSEK, lang) }),
    new Paragraph({ text: "" }),
  ];

  if (event.financials) {
    const cumulative = cumulativeSpentThrough(project, event.id);
    children.push(
      new Paragraph({ text: lang === "sv" ? "Ekonomisk redovisning" : "Financial summary", heading: HeadingLevel.HEADING_2 }),
      new Paragraph({
        text:
          (lang === "sv" ? "Förbrukat denna period" : "Spent this period") +
          `: ${fmtSEK(event.financials.spentThisPeriodSEK, lang)} — ` +
          (lang === "sv" ? "Totalt förbrukat hittills" : "Total spent to date") +
          `: ${fmtSEK(cumulative, lang)}`,
      }),
      new Paragraph({ text: "" })
    );
  }

  children.push(
    new Paragraph({ text: lang === "sv" ? "Utfall per indikator" : "Outturn per indicator", heading: HeadingLevel.HEADING_1 })
  );

  for (const commitment of project.commitments) {
    const outcome = event.outcomes.find((o) => o.indicator_sv === commitment.indicator_sv);
    const label = lang === "sv" ? commitment.indicator_sv : commitment.indicator_en;
    const unit = lang === "sv" ? commitment.unit_sv : commitment.unit_en;
    const fmt = (v: number) => v.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");
    children.push(new Paragraph({ text: label, heading: HeadingLevel.HEADING_2 }));
    children.push(
      new Paragraph({
        text:
          (lang === "sv" ? "Utlovat" : "Promised") +
          `: ${fmt(commitment.promisedValue)} ${unit} — ` +
          (lang === "sv" ? "Rapporterat" : "Reported") +
          `: ${outcome ? `${fmt(outcome.value)} ${unit}` : lang === "sv" ? "ej ifyllt" : "not filled in"}`,
      })
    );
  }

  children.push(new Paragraph({ text: "" }));
  children.push(new Paragraph({ text: lang === "sv" ? "Kommentar" : "Note", heading: HeadingLevel.HEADING_1 }));
  children.push(new Paragraph({ text: (lang === "sv" ? event.note_sv : event.note_en) || "" }));

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBlob(doc);
}

import type { Paragraph as ParagraphType, Table as TableType } from "docx";
import { Grant, FundingCall, FundingProgram, Lang, ReportingEvent } from "@/lib/types";
import { fmtSEK } from "@/lib/format";
import { cumulativeSpentThrough, expectedShareAt, isDeviation } from "@/lib/data/grants";
import { reportSectionsFor } from "@/lib/data/reportSections";
import { formatReportDue } from "@/lib/matching/reportingSchedule";

// Exports a report — or every report of a grant — as a real .docx, the
// same dynamically-imported docx pattern as exportApplication.ts. The
// document follows the report's structure: its text sections, the
// indicators against the commitments, the finances, and the required
// documents, so it can be finished or reviewed in Word. Available from
// the start, not only once something is reported: an empty section is
// marked as such rather than left out.

/** What's been written for one report — its draft, or what was submitted. */
export interface ReportContent {
  sections: Record<string, string>;
  deviations: Record<string, string>;
  /** Required document -> ready (ticked, or with an attachment). */
  documents: { name: string; ready: boolean; files: string[] }[];
  otherAttachments: string[];
  ownerName?: string;
}

type Docx = typeof import("docx");
type Block = ParagraphType | TableType;

const t = (lang: Lang, sv: string, en: string) => (lang === "sv" ? sv : en);

function table(docx: Docx, header: string[], rows: string[][]): TableType {
  const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType } = docx;
  const cell = (text: string, bold = false) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h) => cell(h, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
    ],
  });
}

function statusText(event: ReportingEvent, lang: Lang): string {
  switch (event.status) {
    case "approved":
      return t(lang, "Godkänd", "Approved");
    case "submitted":
      return t(lang, "Inlämnad", "Submitted");
    case "revision-requested":
      return t(lang, "Komplettering begärd", "Revision requested");
    default:
      return t(lang, "Ej inlämnad", "Not submitted");
  }
}

function reportTypeText(event: ReportingEvent, lang: Lang): string {
  return event.type === "final"
    ? t(lang, "Slutrapport", "Final report")
    : event.type === "sustainability"
    ? t(lang, "Hållbarhetsuppföljning", "Sustainability follow-up")
    : t(lang, "Delrapport", "Progress report");
}

/** One report's content, as blocks — shared by the single-report and the
 * whole-grant export. */
function reportBlocks(docx: Docx, grant: Grant, event: ReportingEvent, content: ReportContent, lang: Lang, headingLevel: 1 | 2): Block[] {
  const { HeadingLevel, Paragraph, TextRun } = docx;
  const h = (text: string, level: 1 | 2 | 3) =>
    new Paragraph({
      text,
      heading: level === 1 ? HeadingLevel.HEADING_1 : level === 2 ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_3,
    });
  const sub = (headingLevel + 1) as 2 | 3;
  const fmt = (v: number) => v.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");
  const empty = () =>
    new Paragraph({ children: [new TextRun({ text: t(lang, "[Ej ifyllt]", "[Not filled in]"), italics: true, color: "8A94A6" })] });
  const text = (value: string) =>
    value
      .split(/\n+/)
      .filter((line) => line.trim())
      .map((line) => new Paragraph({ text: line }));

  const blocks: Block[] = [
    h(lang === "sv" ? event.periodLabel_sv : event.periodLabel_en, headingLevel),
    table(docx, [t(lang, "Uppgift", "Item"), t(lang, "Värde", "Value")], [
      [t(lang, "Typ", "Type"), reportTypeText(event, lang)],
      [t(lang, "Förfaller", "Due"), formatReportDue(event, lang)],
      [t(lang, "Status", "Status"), statusText(event, lang)],
      [t(lang, "Ansvarig", "Responsible"), content.ownerName ?? "—"],
    ]),
  ];

  const share = expectedShareAt(grant, event.id);
  for (const section of reportSectionsFor(event.type)) {
    blocks.push(h(lang === "sv" ? section.label_sv : section.label_en, sub));
    const value = content.sections[section.key]?.trim();
    blocks.push(...(value ? text(value) : [empty()]));

    // The indicators go with the results; their deviations with the
    // deviations section.
    if (section.key === "results" && grant.commitments.length > 0) {
      blocks.push(h(t(lang, "Indikatorer", "Indicators"), (sub + 1 > 3 ? 3 : sub + 1) as 3));
      blocks.push(
        table(
          docx,
          [
            t(lang, "Indikator", "Indicator"),
            t(lang, "Utlovat", "Promised"),
            t(lang, "Förväntat vid denna rapport", "Expected by this report"),
            t(lang, "Rapporterat", "Reported"),
          ],
          grant.commitments.map((c) => {
            const unit = lang === "sv" ? c.unit_sv : c.unit_en;
            const outcome = event.outcomes.find((o) => o.indicator_sv === c.indicator_sv);
            return [
              lang === "sv" ? c.indicator_sv : c.indicator_en,
              `${fmt(c.promisedValue)} ${unit}`,
              `${fmt(Math.round(c.promisedValue * share * 10) / 10)} ${unit}`,
              outcome ? `${fmt(outcome.value)} ${unit}` : "—",
            ];
          })
        )
      );
    }
    if (section.key === "deviations") {
      const explained = grant.commitments.filter((c) => {
        const outcome = event.outcomes.find((o) => o.indicator_sv === c.indicator_sv);
        return (outcome && isDeviation(outcome.value, c.promisedValue, share)) || content.deviations[c.indicator_sv]?.trim();
      });
      for (const c of explained) {
        blocks.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${lang === "sv" ? c.indicator_sv : c.indicator_en}: `, bold: true }),
              new TextRun({ text: content.deviations[c.indicator_sv]?.trim() || t(lang, "[Förklaring saknas]", "[Explanation missing]") }),
            ],
          })
        );
      }
    }
  }

  // Finances.
  blocks.push(h(t(lang, "Ekonomi", "Finances"), sub));
  const cumulative = cumulativeSpentThrough(grant, event.id);
  const rows: string[][] = [[t(lang, "Beviljat EU-bidrag", "Awarded EU grant"), fmtSEK(grant.awardedAmountSEK, lang)]];
  if (grant.plannedBudget) {
    rows.push([t(lang, "Total projektbudget", "Total project budget"), fmtSEK(grant.plannedBudget.totalBudgetSEK, lang)]);
    rows.push([t(lang, "Planerad egen medfinansiering", "Planned own co-financing"), fmtSEK(grant.plannedBudget.ownFinancingSEK, lang)]);
  }
  rows.push([
    t(lang, "Upparbetat denna period", "Spent this period"),
    event.financials ? fmtSEK(event.financials.spentThisPeriodSEK, lang) : "—",
  ]);
  rows.push([t(lang, "Upparbetat totalt", "Spent to date"), fmtSEK(cumulative, lang)]);
  blocks.push(table(docx, [t(lang, "Post", "Item"), t(lang, "Belopp", "Amount")], rows));

  // Documents.
  if (content.documents.length > 0 || content.otherAttachments.length > 0) {
    blocks.push(h(t(lang, "Underlag och bilagor", "Documents and attachments"), sub));
    if (content.documents.length > 0) {
      blocks.push(
        table(
          docx,
          [t(lang, "Underlag", "Document"), t(lang, "Klart", "Ready"), t(lang, "Bifogade filer", "Attached files")],
          content.documents.map((d) => [d.name, d.ready ? "✓" : "—", d.files.join(", ") || "—"])
        )
      );
    }
    if (content.otherAttachments.length > 0) {
      blocks.push(new Paragraph({ text: `${t(lang, "Övriga bilagor", "Other attachments")}: ${content.otherAttachments.join(", ")}` }));
    }
  }
  return blocks;
}

function cover(docx: Docx, grant: Grant, call: FundingCall | undefined, program: FundingProgram | undefined, subtitle: string, lang: Lang): Block[] {
  const { HeadingLevel, Paragraph, TextRun } = docx;
  const title = lang === "sv" ? grant.title_sv : grant.title_en;
  const callTitle = call ? (lang === "sv" ? call.title_sv : call.title_en) : "";
  return [
    new Paragraph({ text: title, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `${program?.shortName ?? ""} — ${callTitle}`.trim(), italics: true })] }),
    new Paragraph({ text: subtitle }),
    new Paragraph({
      children: [
        new TextRun({
          text: t(
            lang,
            `Exporterad ${new Date().toLocaleDateString("sv-SE")} från EU Navigator — ett utkast, ersätter inte en faktisk inlämning till finansiären.`,
            `Exported ${new Date().toLocaleDateString("en-GB")} from EU Navigator — a draft, not an actual submission to the funder.`
          ),
          italics: true,
          color: "5B8BBB",
          size: 18,
        }),
      ],
    }),
    new Paragraph({ text: "" }),
  ];
}

export async function buildReportDocx(
  grant: Grant,
  event: ReportingEvent,
  call: FundingCall | undefined,
  program: FundingProgram | undefined,
  content: ReportContent,
  lang: Lang
): Promise<Blob> {
  const docx = await import("docx");
  const children = [
    ...cover(docx, grant, call, program, reportTypeText(event, lang), lang),
    ...reportBlocks(docx, grant, event, content, lang, 1),
  ];
  return docx.Packer.toBlob(new docx.Document({ sections: [{ children }] }));
}

/** The whole grant: an overview (amount, commitments, the reporting plan)
 * and then every report, each starting on a new page. */
export async function buildGrantDocx(
  grant: Grant,
  call: FundingCall | undefined,
  program: FundingProgram | undefined,
  contentFor: (event: ReportingEvent) => ReportContent,
  lang: Lang
): Promise<Blob> {
  const docx = await import("docx");
  const { HeadingLevel, Paragraph } = docx;
  const fmt = (v: number) => v.toLocaleString(lang === "sv" ? "sv-SE" : "en-US");
  const overview: Block[] = [
    ...cover(docx, grant, call, program, t(lang, "Beviljat stöd och rapportering", "Grant and reporting"), lang),
    new Paragraph({ text: t(lang, "Översikt", "Overview"), heading: HeadingLevel.HEADING_1 }),
    table(docx, [t(lang, "Uppgift", "Item"), t(lang, "Värde", "Value")], [
      [t(lang, "Beviljat EU-bidrag", "Awarded EU grant"), fmtSEK(grant.awardedAmountSEK, lang)],
      ...(grant.plannedBudget
        ? [
            [t(lang, "Total projektbudget", "Total project budget"), fmtSEK(grant.plannedBudget.totalBudgetSEK, lang)],
            [t(lang, "Planerad egen medfinansiering", "Planned own co-financing"), fmtSEK(grant.plannedBudget.ownFinancingSEK, lang)],
          ]
        : []),
    ]),
  ];
  if (grant.commitments.length > 0) {
    overview.push(new Paragraph({ text: t(lang, "Åtaganden", "Commitments"), heading: HeadingLevel.HEADING_2 }));
    overview.push(
      table(
        docx,
        [t(lang, "Indikator", "Indicator"), t(lang, "Utlovat", "Promised")],
        grant.commitments.map((c) => [lang === "sv" ? c.indicator_sv : c.indicator_en, `${fmt(c.promisedValue)} ${lang === "sv" ? c.unit_sv : c.unit_en}`])
      )
    );
  }
  overview.push(new Paragraph({ text: t(lang, "Rapporteringsplan", "Reporting plan"), heading: HeadingLevel.HEADING_2 }));
  overview.push(
    table(
      docx,
      [t(lang, "Rapport", "Report"), t(lang, "Förfaller", "Due"), t(lang, "Status", "Status")],
      grant.reportingEvents.map((e) => [lang === "sv" ? e.periodLabel_sv : e.periodLabel_en, formatReportDue(e, lang), statusText(e, lang)])
    )
  );

  const sections = [
    { children: overview },
    ...grant.reportingEvents.map((event) => ({ children: reportBlocks(docx, grant, event, contentFor(event), lang, 1) })),
  ];
  return docx.Packer.toBlob(new docx.Document({ sections }));
}

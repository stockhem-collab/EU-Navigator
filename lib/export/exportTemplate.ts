import type { Paragraph as ParagraphType, Table as TableType } from "docx";
import { ApplicationTemplateSection, CallTemplate, FundingCall, Lang, TemplateTable } from "@/lib/types";
import { fmtSEK } from "@/lib/format";
import { ResolvedApplicationBudget } from "@/lib/matching/applicationBudget";
import { FillOptions, FillSection, FillTable } from "@/lib/export/fillDocx";

// Exports an application the way its funder's form takes it in (see
// CallTemplate.format):
// - "docx": a Word document laid out as the funder's template — numbered
//   headings, the form's tables, its font, page size and margins — to be
//   finished in Word and uploaded as PDF. When the user has uploaded the
//   funder's own template, it is filled in instead (fillDocx.ts).
// - "web-form": a document to paste from, field by field in the form's
//   order, with each field's character count (and limit, when known).

/** One section of the application as it reads now. */
export interface TemplateSectionContent {
  section: ApplicationTemplateSection;
  text: string;
}

export interface TemplateExportInput {
  template: CallTemplate;
  call: FundingCall;
  projectTitle: string;
  /** The applying organisation, for the list of participants. */
  organisationName: string;
  sections: TemplateSectionContent[];
  tables: Record<string, string[][]>;
  budget: ResolvedApplicationBudget;
  /** The language the user works in — used where the form has none. */
  lang: Lang;
}

type Docx = typeof import("docx");
type Block = ParagraphType | TableType;

const pick = (lang: Lang, sv: string, en: string) => (lang === "sv" ? sv : en);

/** The call's identifier as the funder writes it, e.g. the Horizon Europe
 * topic code in the call's name. */
export function callIdentifier(call: FundingCall): string {
  const topic = /\(([A-Z][A-Z0-9-]{6,})\)/;
  return call.title_sv.match(topic)?.[1] ?? call.title_en.match(topic)?.[1] ?? call.id.toUpperCase();
}

/** The call's name without its identifier. */
function callName(call: FundingCall, lang: Lang): string {
  return pick(lang, call.title_sv, call.title_en).replace(/\s*\([A-Z][A-Z0-9-]{6,}\)\s*$/, "");
}

/** A table's rows with the empty ones left out. */
export function filledRows(rows: string[][] | undefined): string[][] {
  return (rows ?? []).filter((row) => row.some((cell) => cell.trim()));
}

/** Whether an optional section is left out: nothing written and no rows. */
function isLeftOut(content: TemplateSectionContent, tables: Record<string, string[][]>): boolean {
  if (content.section.required !== false) return false;
  return !content.text.trim() && (content.section.tables ?? []).every((t) => filledRows(tables[t.key]).length === 0);
}

// Roughly what fits on a page of the funder's layout (11 pt Times New
// Roman, single spacing, A4 with 15 mm margins): about 650 words of body
// text, or 25 table rows. An estimate only — figures and tables with long
// cells take more.
const WORDS_PER_PAGE = 650;
const TABLE_ROWS_PER_PAGE = 25;

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/** Estimated pages for a section: its text, its tables' rows and its
 * heading. */
export function estimatePages(text: string, tableRows: number): number {
  return wordCount(text) / WORDS_PER_PAGE + (tableRows + 2) / TABLE_ROWS_PER_PAGE;
}

/** What to fill in a funder's .docx: the headings, the tables and — for a
 * template the app knows (CallTemplate.funderFile) — the title, the list
 * of participants and what to leave out. */
export function fillInstructions(input: TemplateExportInput): {
  sections: FillSection[];
  tables: FillTable[];
  options: FillOptions;
} {
  const lang = input.template.language ?? input.lang;
  const file = input.template.funderFile;
  const sections: FillSection[] = [];
  const tables: FillTable[] = [];
  const remove: FillSection[] = [];
  if (input.template.participantsList && file?.participantsTitle) {
    tables.push({ title: file.participantsTitle, rows: [[pick(lang, "1 (Koordinator)", "1 (Coordinator)"), input.organisationName, ""]] });
  }
  for (const content of input.sections) {
    const s = content.section;
    const heading = { number: s.number, heading: pick(lang, s.label_sv, s.label_en), text: content.text };
    if (isLeftOut(content, input.tables)) {
      remove.push(heading);
      continue;
    }
    sections.push(heading);
    for (const table of s.tables ?? []) {
      // The title's own label ("Table 3.1a"), without its description.
      const title = table.docx?.title ?? pick(lang, table.title_sv, table.title_en).split(":")[0];
      tables.push({
        title,
        rows: filledRows(input.tables[table.key]),
        columns: lang === "sv" ? table.columns_sv : table.columns_en,
        mode: table.docx?.mode,
      });
    }
  }
  return {
    sections,
    tables,
    options: {
      startsAt: file?.startsAt,
      paragraphs: file?.titleParagraph ? [{ text: file.titleParagraph, value: input.projectTitle }] : [],
      remove,
    },
  };
}

/** The template's placeholders and their values, e.g. "[insert call
 * identifier]" in the page header. */
export function fillPlaceholders(input: TemplateExportInput): Record<string, string> {
  return {
    "[insert call identifier]": callIdentifier(input.call),
    "[insert call name]": callName(input.call, "en"),
    ...(input.template.pageLimit ? { "[Page limit]": String(input.template.pageLimit) } : {}),
  };
}

function textParagraphs(docx: Docx, text: string): ParagraphType[] {
  const { Paragraph } = docx;
  return text.split(/\r?\n/).map((line) => new Paragraph({ text: line, spacing: { after: 80 } }));
}

function tableBlock(docx: Docx, table: TemplateTable, rows: string[][], lang: Lang): TableType {
  const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType } = docx;
  const columns = lang === "sv" ? table.columns_sv : table.columns_en;
  const cell = (text: string, bold = false) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] });
  const body = rows.length > 0 ? rows : [columns.map(() => "")];
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: columns.map((c) => cell(c, true)) }),
      ...body.map((r) => new TableRow({ children: columns.map((_, i) => cell(r[i] ?? "")) })),
    ],
  });
}

/** A new Word document laid out as the funder's template. */
export async function buildTemplateDocx(input: TemplateExportInput): Promise<Blob> {
  const docx = await import("docx");
  const { Document, Header, HeadingLevel, Packer, Paragraph, TextRun, AlignmentType } = docx;
  const { template, call } = input;
  const lang = template.language ?? input.lang;
  const blocks: Block[] = [];

  blocks.push(new Paragraph({ text: input.projectTitle, heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }));
  if (template.participantsList) {
    blocks.push(new Paragraph({ text: pick(lang, "Deltagare", "List of participants"), heading: HeadingLevel.HEADING_2 }));
    blocks.push(
      tableBlock(
        docx,
        {
          key: "participants",
          title_sv: "",
          title_en: "",
          columns_sv: ["Deltagare nr", "Organisation", "Land"],
          columns_en: ["Participant No.", "Participant organisation name", "Country"],
        },
        [[pick(lang, "1 (Koordinator)", "1 (Coordinator)"), input.organisationName, pick(lang, "Sverige", "Sweden")]],
        lang
      )
    );
  }

  let group = "";
  for (const content of input.sections) {
    if (isLeftOut(content, input.tables)) continue;
    const s = content.section;
    if (s.group && s.group.number !== group) {
      group = s.group.number;
      blocks.push(new Paragraph({ text: `${s.group.number}. ${pick(lang, s.group.label_sv, s.group.label_en)}`, heading: HeadingLevel.HEADING_1 }));
    }
    const label = pick(lang, s.label_sv, s.label_en);
    blocks.push(new Paragraph({ text: s.number ? `${s.number} ${label}` : label, heading: s.group ? HeadingLevel.HEADING_2 : HeadingLevel.HEADING_1 }));
    if (content.text.trim()) blocks.push(...textParagraphs(docx, content.text));
    for (const table of s.tables ?? []) {
      blocks.push(new Paragraph({ children: [new TextRun({ text: pick(lang, table.title_sv, table.title_en), bold: true })], spacing: { before: 200 } }));
      blocks.push(tableBlock(docx, table, filledRows(input.tables[table.key]), lang));
    }
  }

  const doc = new Document({
    creator: "EU Navigator",
    title: input.projectTitle,
    description: `${pick(lang, template.title_sv, template.title_en)} ${template.version}`,
    styles: { default: { document: { run: { font: "Times New Roman", size: 22 } } } },
    sections: [
      {
        properties: {
          // A4 with 15 mm margins (in twentieths of a point).
          page: { size: { width: 11906, height: 16838 }, margin: { top: 851, bottom: 851, left: 851, right: 851 } },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({ children: [new TextRun({ text: `Call: ${callIdentifier(call)} — ${callName(call, lang)}`, size: 16 })] }),
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [new TextRun({ text: `${pick(lang, template.title_sv, template.title_en)}: ${template.version}`, size: 16 })],
              }),
            ],
          }),
        },
        children: blocks,
      },
    ],
  });
  return Packer.toBlob(doc);
}

/** A document to paste into a web form from, field by field. */
export async function buildWebFormDocx(input: TemplateExportInput): Promise<Blob> {
  const docx = await import("docx");
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = docx;
  const { template, budget } = input;
  const lang = template.language ?? input.lang;
  const where = template.submittedIn ?? pick(lang, "ansökningsformuläret", "the application form");
  const blocks: Block[] = [
    new Paragraph({ text: input.projectTitle, heading: HeadingLevel.TITLE }),
    new Paragraph({ children: [new TextRun({ text: `${pick(lang, template.title_sv, template.title_en)} — ${pick(lang, input.call.title_sv, input.call.title_en)}`, italics: true })] }),
    new Paragraph({
      children: [
        new TextRun({
          text: pick(
            lang,
            `Underlag att klistra in i ${where}, fält för fält. Teckenantalet räknar mellanslag.`,
            `Text to paste into ${where}, field by field. Character counts include spaces.`
          ),
          italics: true,
          color: "5B8BBB",
          size: 18,
        }),
      ],
    }),
  ];
  for (const content of input.sections) {
    const s = content.section;
    const label = pick(lang, s.label_sv, s.label_en);
    blocks.push(new Paragraph({ text: s.number ? `${s.number}. ${label}` : label, heading: HeadingLevel.HEADING_2 }));
    const chars = content.text.length;
    const count = s.maxChars
      ? pick(lang, `${chars.toLocaleString("sv-SE")} av högst ${s.maxChars.toLocaleString("sv-SE")} tecken`, `${chars.toLocaleString("en-US")} of at most ${s.maxChars.toLocaleString("en-US")} characters`)
      : pick(lang, `${chars.toLocaleString("sv-SE")} tecken`, `${chars.toLocaleString("en-US")} characters`);
    const over = s.maxChars !== undefined && chars > s.maxChars;
    const criterion = s.criterion_sv ? ` · ${pick(lang, "Bedöms under", "Assessed under")} ${pick(lang, s.criterion_sv, s.criterion_en ?? s.criterion_sv)}` : "";
    blocks.push(
      new Paragraph({
        children: [
          new TextRun({ text: `${count}${over ? pick(lang, " – för långt", " – too long") : ""}${criterion}`, size: 16, color: over ? "B91C1C" : "6B7280" }),
        ],
      })
    );
    blocks.push(...(content.text.trim() ? textParagraphs(docx, content.text) : [new Paragraph({ children: [new TextRun({ text: pick(lang, "[Inte ifyllt]", "[Not filled in]"), italics: true })] })]));
    for (const table of s.tables ?? []) {
      blocks.push(new Paragraph({ children: [new TextRun({ text: pick(lang, table.title_sv, table.title_en), bold: true })] }));
      blocks.push(tableBlock(docx, table, filledRows(input.tables[table.key]), lang));
    }
  }
  const line = (sv: string, en: string, amount: number) => new Paragraph({ text: `${pick(lang, sv, en)}: ${fmtSEK(amount, lang)}` });
  blocks.push(new Paragraph({ text: pick(lang, "Budget", "Budget"), heading: HeadingLevel.HEADING_2 }));
  blocks.push(line("Total budget", "Total budget", budget.totalBudgetSEK));
  blocks.push(line("Stödberättigad budget", "Eligible budget", budget.eligibleBudgetSEK));
  blocks.push(
    budget.requestedIsEstimate
      ? line("Beräknat stöd", "Estimated grant", budget.requestedGrantSEK)
      : line("Sökt belopp", "Requested grant", budget.requestedGrantSEK)
  );
  blocks.push(line("Egen medfinansiering", "Own co-financing", budget.ownFinancingSEK));

  const doc = new Document({
    creator: "EU Navigator",
    title: input.projectTitle,
    description: `${pick(lang, template.title_sv, template.title_en)} ${template.version}`,
    sections: [{ children: blocks }],
  });
  return Packer.toBlob(doc);
}

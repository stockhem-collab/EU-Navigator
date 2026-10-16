// Reads the structure out of a funder's Word template (.docx) — its
// headings, the instructions under them, its tables and page limits — as a
// proposal for a form (CallTemplate) that is reviewed in Datacenter
// (Mallar) before it's saved. A proposal, not a definitive reading: Word
// files differ, so every section can be renamed, edited or left out.
//
// Headings are paragraphs in a heading style (Heading 1–4, Rubrik 1–4, or
// with an outline level) and short numbered paragraphs ("1.1 Objectives
// [e.g. 4 pages]"). The paragraphs after a heading are its instructions,
// except the template's stand-in text ("Insert text here"). A table is
// "Table 3.1a: …" (or "Tabell …") followed by a table, whose first row
// gives the columns. The sections are the headings with no headings under
// them; the heading above a section is its group. Table-of-
// contents lines are skipped, and a heading that comes back (the funder's
// instruction pages first, the structure to submit after) is read once,
// with the instructions of both.
//
// String-based like fillDocx.ts, so it runs in the browser and the tests.

import { children, inner, isTocLine, textOf } from "./fillDocx";
import type { ApplicationTemplateSection, CallTemplate, Lang } from "@/lib/types";

export interface OutlineTable {
  title: string;
  columns: string[];
}

export interface OutlineSection {
  key: string;
  number?: string;
  label: string;
  /** 1 for a main heading, 2 for its subheadings, … */
  level: number;
  group?: { number: string; label: string };
  instructions: string;
  indicativePages?: number;
  /** The heading says the section is optional. */
  optional: boolean;
  tables: OutlineTable[];
}

export interface TemplateOutline {
  /** The document's title paragraph, when it has one. */
  title?: string;
  /** A page limit the document states for itself. */
  pageLimit?: number;
  /** The language the template seems to be written in. */
  language: Lang;
  sections: OutlineSection[];
}

const NUMBERED = /^(\d+(?:\.\d+)*)\.?\s+(\S.*)$/;
const TABLE_TITLE = /^(?:table|tabell)\s+[\dA-Za-z.]+\s*[:.–-]?/i;
const MAX_INSTRUCTIONS = 3000;

function pageCount(text: string): number | undefined {
  const m = text.match(/(\d+(?:[.,]\d+)?)\s*(?:pages?|sidor|sida)\b/i);
  return m ? Number(m[1].replace(",", ".")) : undefined;
}

function isPlaceholder(text: string): boolean {
  return /^(?:insert|enter|add) (?:here )?(?:your )?text\b|^(?:skriv|fyll i) (?:din |er )?text här/i.test(text.trim());
}

/** The heading level of a paragraph style (styles.xml names it). */
function styleLevels(stylesXml: string): Map<string, number> {
  const out = new Map<string, number>();
  for (const m of stylesXml.matchAll(/<w:style\b[^>]*w:styleId="([^"]+)"[^>]*>([\s\S]*?)<\/w:style>/g)) {
    const name = m[2].match(/<w:name w:val="([^"]+)"/)?.[1] ?? "";
    const byName = name.match(/^(?:heading|rubrik|überschrift|titre)\s*(\d)$/i);
    const outline = m[2].match(/<w:outlineLvl w:val="(\d)"/);
    if (byName) out.set(m[1], Number(byName[1]));
    else if (outline) out.set(m[1], Number(outline[1]) + 1);
  }
  return out;
}

function headingLevel(pXml: string, text: string, levels: Map<string, number>): number | null {
  const style = pXml.match(/<w:pStyle w:val="([^"]+)"/)?.[1];
  const outline = pXml.match(/<w:pPr>[\s\S]*?<w:outlineLvl w:val="(\d)"/);
  const fromStyle = style ? levels.get(style) ?? style.match(/^(?:Heading|Rubrik)(\d)$/i)?.[1] : undefined;
  if (fromStyle) return Number(fromStyle);
  if (outline && Number(outline[1]) < 9) return Number(outline[1]) + 1;
  // A short numbered paragraph that doesn't read as a sentence.
  const numbered = text.match(NUMBERED);
  const isDate = /^\d{1,2}\s+\p{L}+\s+\d{4}$/u.test(text);
  if (numbered && !isDate && text.length <= 120 && !/[.:;]$/.test(numbered[2].replace(/\s*[[(].*$/, "")) && /^\p{Lu}/u.test(numbered[2])) {
    return numbered[1].split(".").length;
  }
  return null;
}

function guessLanguage(text: string): Lang {
  const words = text.toLowerCase().match(/\p{L}+/gu) ?? [];
  const en = words.filter((w) => ["the", "and", "of", "your", "project", "please", "describe", "with"].includes(w)).length;
  const sv = words.filter((w) => ["och", "att", "som", "för", "med", "ni", "projektet", "beskriv"].includes(w)).length;
  return sv > en ? "sv" : "en";
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** "Table 3.1a: List of work packages" → "table 3.1a". */
const tableId = (title: string) => (title.match(/^(?:table|tabell)\s+\d+(?:\.\d+)*[a-z]?/i)?.[0] ?? title).toLowerCase();

interface Heading {
  number?: string;
  label: string;
  level: number;
  instructions: string[];
  tables: OutlineTable[];
  pages?: number;
  optional: boolean;
}

/** The outline of a template's document.xml (and styles.xml, for the
 * names of its heading styles). */
export function outlineFromXml(documentXml: string, stylesXml = ""): TemplateOutline {
  const levels = styleLevels(stylesXml);
  const bodyStart = documentXml.indexOf("<w:body");
  if (bodyStart < 0) throw new Error("Ogiltig Word-fil: dokumentet saknar innehåll");
  const bodyEnd = documentXml.lastIndexOf("</w:body>");
  const body = children(documentXml, documentXml.indexOf(">", bodyStart) + 1, bodyEnd);

  const headings: Heading[] = [];
  let title: string | undefined;
  let pageLimit: number | undefined;
  let pendingTable: string | undefined;
  let allText = "";

  for (const el of body) {
    const xml = documentXml.slice(el.start, el.end);
    if (el.name === "w:tbl") {
      const current = headings[headings.length - 1];
      const firstRow = inner(documentXml, el).find((c) => c.name === "w:tr");
      const columns = firstRow
        ? inner(documentXml, firstRow)
            .filter((c) => c.name === "w:tc")
            .map((c) => textOf(documentXml.slice(c.start, c.end)).replace(/\s+/g, " ").trim())
            .filter(Boolean)
        : [];
      // Only tables the template names: layout tables (a cover page, a
      // participants list without a title) are not asked-for tables.
      if (current && pendingTable && columns.length > 0) {
        // "Table 3.1a" belongs to 3.1 wherever the template puts it ("Table
        // 1" is only a count).
        const ref = pendingTable.match(/^(?:table|tabell)\s+(\d+(?:\.\d+)+)/i)?.[1];
        let owner = current;
        for (let n = ref; n; n = n.includes(".") ? n.slice(0, n.lastIndexOf(".")) : "") {
          const match = [...headings].reverse().find((h) => h.number === n);
          if (match) {
            owner = match;
            break;
          }
        }
        const id = tableId(pendingTable);
        if (!owner.tables.some((t) => tableId(t.title) === id)) owner.tables.push({ title: pendingTable, columns });
      }
      pendingTable = undefined;
      continue;
    }
    if (el.name !== "w:p" || isTocLine(xml)) continue;
    const text = textOf(xml).replace(/\s+/g, " ").trim();
    if (!text) continue;
    allText += ` ${text}`;
    if (!title && /<w:pStyle w:val="(?:Title|Rubrik)"/i.test(xml)) {
      title = text;
      continue;
    }
    const docLimit = text.match(
      /(?:maximum(?: of)?|max\.?|limit(?:ed)? (?:to|of)|(?:no |not be )?longer than|högst|maximalt|inte (?:vara )?längre än)\s*(\d+)\s*(?:A4[- ]?\s*)?(?:pages|sidor)/i
    );
    if (docLimit && !pageLimit) pageLimit = Number(docLimit[1]);

    const level = headingLevel(xml, text, levels);
    if (level !== null) {
      const numbered = text.match(NUMBERED);
      const label = (numbered ? numbered[2] : text).replace(/\s*\[[^\]]*\]\s*$/, "").replace(/\s*\((?:optional|frivillig)[^)]*\)\s*$/i, "").trim();
      const number = numbered?.[1];
      const same = headings.findIndex((h) => h.number === number && h.label.toLowerCase() === label.toLowerCase());
      const heading: Heading = {
        number,
        label,
        level,
        instructions: [],
        tables: [],
        pages: pageCount(text.match(/\[[^\]]*\]/)?.[0] ?? ""),
        optional: /optional|frivillig|valfri/i.test(text),
      };
      if (same >= 0) {
        // Read once: the later place, with the earlier instructions.
        const [earlier] = headings.splice(same, 1);
        heading.instructions = earlier.instructions;
        heading.tables = earlier.tables;
        heading.pages ??= earlier.pages;
        heading.optional ||= earlier.optional;
      }
      headings.push(heading);
      pendingTable = undefined;
      continue;
    }
    if (TABLE_TITLE.test(text)) {
      pendingTable = text.replace(/\s*instructions?,? please remove.*$/i, "").trim();
      continue;
    }
    const current = headings[headings.length - 1];
    if (current && !isPlaceholder(text)) {
      const length = current.instructions.join("\n").length;
      if (length + text.length <= MAX_INSTRUCTIONS && !current.instructions.includes(text)) current.instructions.push(text);
    }
  }

  // Leaves are sections.
  const used = new Set<string>();
  const sections: OutlineSection[] = [];
  headings.forEach((h, i) => {
    const next = headings[i + 1];
    if (next && next.level > h.level) return;
    // The nearest heading above it is its group.
    let group: OutlineSection["group"];
    for (let j = i - 1; j >= 0 && h.level > 1; j--) {
      if (headings[j].level < h.level) {
        group = { number: headings[j].number ?? "", label: headings[j].label };
        break;
      }
    }
    let key = `custom-${h.number ? `${h.number.replace(/\./g, "-")}-` : ""}${slug(h.label)}` || `custom-${i}`;
    while (used.has(key)) key = `${key}-2`;
    used.add(key);
    sections.push({
      key,
      ...(h.number ? { number: h.number } : {}),
      label: h.label,
      level: h.level,
      ...(group ? { group } : {}),
      instructions: h.instructions.join("\n"),
      ...(h.pages ? { indicativePages: h.pages } : {}),
      optional: h.optional,
      tables: h.tables,
    });
  });

  return { ...(title ? { title } : {}), ...(pageLimit ? { pageLimit } : {}), language: guessLanguage(allText), sections };
}

/** The outline of a .docx file. */
export async function outlineFromDocx(data: ArrayBuffer | Uint8Array): Promise<TemplateOutline> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(data);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("Filen är inte ett Word-dokument (.docx)");
  const styles = (await zip.file("word/styles.xml")?.async("string")) ?? "";
  return outlineFromXml(await documentFile.async("string"), styles);
}

export interface ProposalSection extends OutlineSection {
  include: boolean;
  /** Per table: whether it's included. */
  includeTables: boolean[];
}

/** An outline as reviewed in Datacenter (Mallar). */
export interface TemplateProposal {
  title: string;
  kind: "application" | "report";
  language: Lang;
  version: string;
  pageLimit: string;
  sourceUrl: string;
  sections: ProposalSection[];
}

/** The reviewed proposal as a form. Headings and instructions are the
 * template's own words, in both languages. */
export function templateFromProposal(p: TemplateProposal, id: string): CallTemplate {
  const sections: ApplicationTemplateSection[] = p.sections
    .filter((s) => s.include && s.label.trim())
    .map((s) => ({
      key: s.key,
      label_sv: s.label.trim(),
      label_en: s.label.trim(),
      instructions_sv: s.instructions.trim(),
      instructions_en: s.instructions.trim(),
      ...(s.number ? { number: s.number } : {}),
      ...(s.group ? { group: { number: s.group.number, label_sv: s.group.label, label_en: s.group.label } } : {}),
      ...(s.indicativePages ? { indicativePages: s.indicativePages } : {}),
      ...(s.optional ? { required: false } : {}),
      ...(s.tables.some((_, i) => s.includeTables[i])
        ? {
            tables: s.tables
              .filter((_, i) => s.includeTables[i])
              .map((t, i) => ({
                key: `${s.key}-t${i + 1}`,
                title_sv: t.title,
                title_en: t.title,
                columns_sv: t.columns,
                columns_en: t.columns,
                // A one-column table is a form for one row (e.g. a work
                // package description), repeated per row.
                ...(t.columns.length === 1 ? { docx: { mode: "repeat" as const } } : {}),
              })),
          }
        : {}),
    }));
  const pageLimit = Number(p.pageLimit);
  return {
    id,
    kind: p.kind,
    format: "docx",
    language: p.language,
    title_sv: p.title.trim(),
    title_en: p.title.trim(),
    version: p.version.trim() || "—",
    ...(p.sourceUrl.trim() ? { sourceUrl: p.sourceUrl.trim() } : {}),
    ...(pageLimit > 0 ? { pageLimit } : {}),
    custom: true,
    sections,
  };
}

// Fills in a funder's own Word template (.docx) — e.g. Horizon Europe's
// Part B downloaded from the submission system — with the application's
// text, instead of building a new document. Everything else in the file
// (styles, headers, logos, the funder's tables) is kept as it is.
//
// How: the document body is read as XML and walked element by element. A
// section's text goes in right after the paragraph that is its heading in
// the template ("1.1 Objectives and ambition [e.g. 4 pages]"); a table's
// rows are added to the first table after its title paragraph ("Table
// 3.1a: List of work packages"). When a heading appears more than once —
// the funder's instruction pages first, the structure to submit last — the
// last one is used; table-of-contents lines are skipped. Headings that
// aren't found are reported back rather than guessed at.
//
// String-based on purpose: it runs the same in the browser and in Node
// (the unit tests), with no XML library.

export interface FillSection {
  /** The section's number in the template, e.g. "1.1". */
  number?: string;
  /** The heading text after the number, as the template words it. */
  heading: string;
  text: string;
}

export interface FillTable {
  /** The start of the table's title paragraph, e.g. "Table 3.1a". */
  title: string;
  rows: string[][];
}

export interface FillResult {
  /** Headings and table titles that were filled in. */
  filled: string[];
  /** Headings and table titles that weren't found in the template. */
  missing: string[];
}

interface Element {
  start: number;
  end: number;
  name: string;
}

/** The end (exclusive) of the element whose opening tag starts at `start`. */
function elementEnd(xml: string, start: number, name: string): number {
  const tag = new RegExp(`<\\/?${name}(?=[\\s>/])[^>]*>`, "g");
  tag.lastIndex = start;
  let depth = 0;
  for (let m = tag.exec(xml); m; m = tag.exec(xml)) {
    if (depth === 0 && m[0].endsWith("/>")) return m.index + m[0].length;
    if (m[0].startsWith("</")) depth--;
    else if (!m[0].endsWith("/>")) depth++;
    if (depth === 0) return m.index + m[0].length;
  }
  throw new Error(`Ogiltig Word-fil: <${name}> avslutas aldrig`);
}

/** The child elements of the XML between `from` and `to`. */
function children(xml: string, from: number, to: number): Element[] {
  const out: Element[] = [];
  const open = /<([A-Za-z0-9]+:[A-Za-z0-9]+)(?=[\s>/])/g;
  open.lastIndex = from;
  for (let m = open.exec(xml); m && m.index < to; m = open.exec(xml)) {
    const end = elementEnd(xml, m.index, m[1]);
    out.push({ start: m.index, end, name: m[1] });
    open.lastIndex = end;
  }
  return out;
}

function decode(text: string): string {
  return text
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

function escapeXml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function textOf(fragment: string): string {
  return [...fragment.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => decode(m[1])).join("");
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

function isTocLine(fragment: string): boolean {
  return /<w:pStyle w:val="(?:TOC|Innehll|Contents)/i.test(fragment);
}

/** Whether a paragraph is the heading "<number> <heading>" (the number may
 * end in a dot, the heading may be followed by "[e.g. 4 pages]"). */
function isHeading(paragraphText: string, section: FillSection): boolean {
  const text = normalize(paragraphText);
  const heading = normalize(section.heading);
  if (!section.number) return text === heading || text.startsWith(`${heading} [`);
  const m = text.match(/^(\d+(?:\.\d+)*)\.?\s+(.*)$/);
  return Boolean(m && m[1] === section.number.replace(/\.$/, "") && m[2].startsWith(heading));
}

function paragraphsXml(text: string, pPr = "", rPr = ""): string {
  return text
    .split(/\r?\n/)
    .map((line) => `<w:p>${pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`)
    .join("");
}

/** A new table row shaped like `template`: same cells and cell properties,
 * with `cells` as plain (not bold) text. */
function rowLike(xml: string, template: Element, cells: string[]): string {
  const rowXml = xml.slice(template.start, template.end);
  const openTag = rowXml.match(/^<w:tr(?:\s[^>]*)?>/)![0];
  const rowParts = children(rowXml, openTag.length, rowXml.length);
  const trPr = rowParts.find((c) => c.name === "w:trPr");
  const tcs = rowParts.filter((c) => c.name === "w:tc");
  const newCells = tcs.map((tc, i) => {
    const tcXml = rowXml.slice(tc.start, tc.end);
    const tcPr = tcXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/)?.[0] ?? "";
    const pPr = tcXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? "";
    const rPr = (tcXml.match(/<w:rPr>[\s\S]*?<\/w:rPr>/)?.[0] ?? "").replace(/<w:b(?:\s[^>]*)?\/>|<w:bCs(?:\s[^>]*)?\/>/g, "");
    // Extra values beyond the template's cells go in its last cell.
    const value = i === tcs.length - 1 ? cells.slice(i).filter(Boolean).join(" – ") : cells[i] ?? "";
    return `<w:tc>${tcPr}${paragraphsXml(value, pPr, rPr)}</w:tc>`;
  });
  const trPrXml = trPr ? rowXml.slice(trPr.start, trPr.end).replace(/<w:tblHeader(?:\s[^>]*)?\/>/g, "") : "";
  return `${openTag}${trPrXml}${newCells.join("")}</w:tr>`;
}

/** Adds `rows` to the table element `tbl`: empty rows after the header are
 * replaced, new rows copy the last row's look (or the header's, unbolded). */
function fillTableXml(xml: string, tbl: Element, rows: string[][]): string {
  const tblXml = xml.slice(tbl.start, tbl.end);
  const openTag = tblXml.match(/^<w:tbl(?:\s[^>]*)?>/)![0];
  const trs = children(tblXml, openTag.length, tblXml.length - "</w:tbl>".length).filter((c) => c.name === "w:tr");
  if (trs.length === 0) return xml;
  const kept = trs.filter((tr, i) => i === 0 || textOf(tblXml.slice(tr.start, tr.end)).trim() !== "");
  const template = kept.length > 1 ? kept[kept.length - 1] : kept[0];
  const keptXml = kept.map((tr) => tblXml.slice(tr.start, tr.end)).join("");
  const before = tblXml.slice(0, trs[0].start);
  const after = tblXml.slice(trs[trs.length - 1].end);
  const added = rows.map((cells) => rowLike(tblXml, template, cells)).join("");
  return xml.slice(0, tbl.start) + before + keptXml + added + after + xml.slice(tbl.end);
}

/** Fills the body of word/document.xml. */
export function fillDocumentXml(xml: string, sections: FillSection[], tables: FillTable[]): FillResult & { xml: string } {
  const bodyOpen = xml.indexOf("<w:body>");
  const bodyClose = xml.lastIndexOf("</w:body>");
  if (bodyOpen < 0 || bodyClose < 0) throw new Error("Ogiltig Word-fil: dokumentet saknar innehåll");
  const filled: string[] = [];
  const missing: string[] = [];
  // Insertions are collected first and applied from the end, so earlier
  // positions stay valid.
  const edits: { at: number; end: number; replace: (current: string) => string; label: string }[] = [];
  const elements = children(xml, bodyOpen + "<w:body>".length, bodyClose);
  const texts = elements.map((el) => (el.name === "w:tbl" ? "" : textOf(xml.slice(el.start, el.end))));
  const candidate = (i: number) => elements[i].name !== "w:tbl" && !isTocLine(xml.slice(elements[i].start, elements[i].end));

  for (const section of sections) {
    const label = section.number ? `${section.number} ${section.heading}` : section.heading;
    let index = -1;
    elements.forEach((_, i) => {
      if (candidate(i) && isHeading(texts[i], section)) index = i;
    });
    if (index < 0) {
      missing.push(label);
      continue;
    }
    if (!section.text.trim()) continue;
    const at = elements[index].end;
    edits.push({ at, end: at, replace: () => paragraphsXml(section.text), label });
  }

  for (const table of tables) {
    const title = normalize(table.title);
    let index = -1;
    elements.forEach((_, i) => {
      if (candidate(i) && normalize(texts[i]).startsWith(title)) index = i;
    });
    const tblIndex = index < 0 ? -1 : elements.findIndex((el, i) => i > index && i <= index + 3 && el.name === "w:tbl");
    if (tblIndex < 0) {
      missing.push(table.title);
      continue;
    }
    const rows = table.rows.filter((r) => r.some((c) => c.trim()));
    if (rows.length === 0) continue;
    const tbl = elements[tblIndex];
    edits.push({
      at: tbl.start,
      end: tbl.end,
      replace: (current) => fillTableXml(current, { start: 0, end: current.length, name: "w:tbl" }, rows),
      label: table.title,
    });
  }

  let out = xml;
  // From the end; at the same position a replacement goes before an insertion.
  for (const edit of [...edits].sort((a, b) => b.at - a.at || b.end - b.at - (a.end - a.at))) {
    out = out.slice(0, edit.at) + edit.replace(out.slice(edit.at, edit.end)) + out.slice(edit.end);
    filled.push(edit.label);
  }
  filled.reverse();
  return { xml: out, filled, missing };
}

/** Replaces literal placeholders (e.g. "[insert call identifier]") in the
 * text runs of any part of the document — the body, headers and footers. */
export function replacePlaceholders(xml: string, values: Record<string, string>): string {
  let out = xml;
  for (const [placeholder, value] of Object.entries(values)) {
    out = out.split(escapeXml(placeholder)).join(escapeXml(value));
  }
  return out;
}

/** Fills a funder's .docx and returns the new file's bytes, with what was
 * and wasn't found. */
export async function fillFunderDocx(
  data: ArrayBuffer | Uint8Array,
  sections: FillSection[],
  tables: FillTable[],
  placeholders: Record<string, string> = {}
): Promise<FillResult & { bytes: Uint8Array }> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(data);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("Filen är inte ett Word-dokument (.docx)");
  const result = fillDocumentXml(await documentFile.async("string"), sections, tables);
  zip.file("word/document.xml", replacePlaceholders(result.xml, placeholders));
  for (const name of Object.keys(zip.files)) {
    if (!/^word\/(header|footer)\d*\.xml$/.test(name)) continue;
    zip.file(name, replacePlaceholders(await zip.file(name)!.async("string"), placeholders));
  }
  const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return { bytes, filled: result.filled, missing: result.missing };
}

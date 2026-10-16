// Fills in a funder's own Word template (.docx) — e.g. Horizon Europe's
// Part B from the Funding & Tenders Portal — with the application's text,
// instead of building a new document. Everything else in the file (styles,
// headers, logos, the funder's tables) is kept as it is.
//
// How: the document body is read as XML and walked element by element. A
// section's text goes in right after the paragraph that is its heading in
// the template ("1.1 Objectives and ambition [e.g. 4 pages]"), in place of
// the template's "Insert here text for your proposal" line when it has one.
// A table's rows go into the table(s) after its title paragraph ("Table
// 3.1a: List of work packages"), the way the template lays that table out
// (see FillTableMode). When a heading appears more than once — the
// funder's instruction pages first, the structure to submit last — the last
// one is used; table-of-contents lines are skipped. Headings that aren't
// found are reported back rather than guessed at.
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

/** How a table's rows go into the template:
 * - "rows": one table row per row, in the table's empty rows (default).
 * - "repeat": the tables after the title are a form for one row (Part B's
 *   3.1b work package description) and are repeated for each row.
 * - "combine": the tables after the title are one form filled once, each
 *   column's values together (Part B's 2.3 impact canvas).
 * - "matrix": a participants × work packages table (Part B's 3.1f), from
 *   rows of participant, "WP1: 6, WP2: 12" and total. */
export type FillTableMode = "rows" | "repeat" | "combine" | "matrix";

export interface FillTable {
  /** The start of the table's title paragraph, e.g. "Table 3.1a". */
  title: string;
  rows: string[][];
  /** The column names as the template's labels word them — needed for
   * "repeat" and "combine", where values are placed by label. */
  columns?: string[];
  mode?: FillTableMode;
}

export interface FillOptions {
  /** Removes everything before the last paragraph starting with this
   * text — e.g. the instruction pages before the structure to submit. */
  startsAt?: string;
  /** Paragraphs replaced by a value, e.g. "Title of the Proposal". */
  paragraphs?: { text: string; value: string }[];
  /** Optional sections left out of the application: removed from their
   * heading to the next numbered heading. */
  remove?: FillSection[];
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

/** The children of the element `el` of `xml` (inside its opening tag). */
function inner(xml: string, el: Element): Element[] {
  const openEnd = xml.indexOf(">", el.start) + 1;
  return children(xml, openEnd, el.end);
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

/** A fragment's text; tabs and line breaks read as spaces ("1.1<tab>Objectives"). */
function textOf(fragment: string): string {
  return [...fragment.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|<w:(?:tab|br|cr)(?:\s[^>]*)?\/>/g)]
    .map((m) => (m[1] === undefined ? " " : decode(m[1])))
    .join("");
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’`´]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/\s+/g, " ")
    .trim();
}

/** A heading without what follows it in brackets: "[e.g. 4 pages]",
 * "(OPTIONAL – Please remove this section if not used)". */
function headingCore(text: string): string {
  return normalize(text).replace(/\s*[[(].*$/, "");
}

function isTocLine(fragment: string): boolean {
  return /<w:pStyle w:val="(?:TOC|Innehll|Contents)/i.test(fragment);
}

/** The template's stand-in for the applicant's text. */
function isPlaceholder(text: string): boolean {
  return /^insert (?:here )?(?:your )?text\b/.test(normalize(text));
}

const NUMBERED = /^(\d+(?:\.\d+)*)\.?\s*(.*)$/;

/** Whether a paragraph is the heading "<number> <heading>" (the number may
 * end in a dot, the heading may be followed by "[e.g. 4 pages]"). */
function isHeading(paragraphText: string, section: FillSection): boolean {
  const heading = headingCore(section.heading);
  if (!heading) return false;
  if (!section.number) return headingCore(paragraphText) === heading;
  const m = normalize(paragraphText).match(NUMBERED);
  return Boolean(m && m[1] === section.number.replace(/\.$/, "") && headingCore(m[2]).startsWith(heading));
}

/** A paragraph's properties without a section break, which must stay on
 * the paragraph it belongs to. */
function paragraphProps(fragment: string): string {
  return (fragment.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? "").replace(/<w:sectPr[\s\S]*?<\/w:sectPr>/, "");
}

/** The first run's properties, unbolded unless `keepBold`. */
function runProps(fragment: string, keepBold = false): string {
  const rPr = fragment.match(/<w:r(?:\s[^>]*)?>\s*(<w:rPr>[\s\S]*?<\/w:rPr>)/)?.[1] ?? "";
  return keepBold ? rPr : rPr.replace(/<w:b(?:\s[^>]*)?\/>|<w:bCs(?:\s[^>]*)?\/>/g, "");
}

function paragraphsXml(text: string, pPr = "", rPr = "", lastPPr = pPr): string {
  const lines = text.split(/\r?\n/);
  return lines
    .map((line, i) => `<w:p>${i === lines.length - 1 ? lastPPr : pPr}<w:r>${rPr}<w:t xml:space="preserve">${escapeXml(line)}</w:t></w:r></w:p>`)
    .join("");
}

/** A cell like `tcXml` (same properties and look) holding `value`. */
function cellLike(tcXml: string, value: string, width?: number, keepBold = false): string {
  let tcPr = tcXml.match(/<w:tcPr>[\s\S]*?<\/w:tcPr>/)?.[0] ?? "";
  if (width !== undefined) tcPr = tcPr.replace(/<w:tcW\b[^>]*\/>/, `<w:tcW w:w="${width}" w:type="dxa"/>`);
  return `<w:tc>${tcPr}${paragraphsXml(value, paragraphProps(tcXml), runProps(tcXml, keepBold))}</w:tc>`;
}

function rowParts(rowXml: string): { openTag: string; trPr: string; cells: string[] } {
  const openTag = rowXml.match(/^<w:tr(?:\s[^>]*)?>/)![0];
  const parts = children(rowXml, openTag.length, rowXml.length);
  const trPr = parts.find((c) => c.name === "w:trPr");
  return {
    openTag,
    trPr: trPr ? rowXml.slice(trPr.start, trPr.end).replace(/<w:tblHeader(?:\s[^>]*)?\/>/g, "") : "",
    cells: parts.filter((c) => c.name === "w:tc").map((c) => rowXml.slice(c.start, c.end)),
  };
}

/** A new table row shaped like `rowXml`: same cells and cell properties,
 * with `cells` as plain (not bold) text. */
function rowLike(rowXml: string, cells: string[]): string {
  const { openTag, trPr, cells: tcs } = rowParts(rowXml);
  const newCells = tcs.map((tc, i) =>
    // Extra values beyond the template's cells go in its last cell.
    cellLike(tc, i === tcs.length - 1 ? cells.slice(i).filter(Boolean).join(" – ") : cells[i] ?? "")
  );
  return `${openTag}${trPr}${newCells.join("")}</w:tr>`;
}

interface TableXml {
  before: string;
  rows: string[];
  after: string;
}

function splitTable(tblXml: string): TableXml {
  const openTag = tblXml.match(/^<w:tbl(?:\s[^>]*)?>/)![0];
  const trs = children(tblXml, openTag.length, tblXml.length - "</w:tbl>".length).filter((c) => c.name === "w:tr");
  if (trs.length === 0) return { before: tblXml, rows: [], after: "" };
  return {
    before: tblXml.slice(0, trs[0].start),
    rows: trs.map((tr) => tblXml.slice(tr.start, tr.end)),
    after: tblXml.slice(trs[trs.length - 1].end),
  };
}

const cellTexts = (rowXml: string) => rowParts(rowXml).cells.map((c) => textOf(c).trim());

/** "rows": fills the table's empty rows after the header in order — a row
 * counts as empty when all but its first cell are (the first may hold a
 * label like "1 (Coordinator)") — and adds rows like the last one filled.
 * Unused rows with nothing in them are removed. */
function fillRows(tblXml: string, rows: string[][]): string {
  const table = splitTable(tblXml);
  if (table.rows.length === 0) return tblXml;
  const [header, ...data] = table.rows;
  const out = [header];
  let next = 0;
  let last = header;
  for (const row of data) {
    const texts = cellTexts(row);
    const open = texts.slice(1).every((t) => !t || isPlaceholder(t));
    if (open && next < rows.length) {
      out.push(rowLike(row, rows[next++]));
      last = row;
    } else if (!texts.every((t) => !t)) {
      out.push(row);
    }
  }
  while (next < rows.length) out.push(rowLike(last, rows[next++]));
  return table.before + out.join("") + table.after;
}

function isLabel(cellText: string, column: string): boolean {
  const label = normalize(cellText).replace(/[\s:*]+$/, "");
  const col = normalize(column).replace(/[\s:*]+$/, "");
  return Boolean(col) && (label === col || label.startsWith(`${col} `) || label.startsWith(`${col}(`) || label.startsWith(`${col}:`));
}

/** Puts `value` in a cell: in place of its placeholder paragraphs, or in
 * place of everything when the cell is empty, or after what it holds. */
function cellWith(tcXml: string, value: string): string {
  const openTag = tcXml.match(/^<w:tc(?:\s[^>]*)?>/)![0];
  const parts = children(tcXml, openTag.length, tcXml.length - "</w:tc>".length);
  const tcPr = parts.find((p) => p.name === "w:tcPr");
  const paragraphs = parts.filter((p) => p.name === "w:p");
  const pXml = (p: Element) => tcXml.slice(p.start, p.end);
  const placeholders = paragraphs.filter((p) => isPlaceholder(textOf(pXml(p))));
  const style = placeholders[0] ?? paragraphs[paragraphs.length - 1];
  const filled = style ? paragraphsXml(value, paragraphProps(pXml(style)), runProps(pXml(style))) : paragraphsXml(value);
  const head = openTag + (tcPr ? tcXml.slice(tcPr.start, tcPr.end) : "");
  if (placeholders.length > 0 || !textOf(tcXml).trim()) {
    const keep = parts.filter((p) => p !== tcPr && (p.name !== "w:p" || (placeholders.length > 0 && !placeholders.includes(p))));
    const at = placeholders.length > 0 ? keep.findIndex((p) => p.start > placeholders[0].start) : keep.length;
    const kept = keep.map((p) => tcXml.slice(p.start, p.end));
    kept.splice(at < 0 ? kept.length : at, 0, filled);
    return `${head}${kept.join("")}</w:tc>`;
  }
  return tcXml.slice(0, tcXml.length - "</w:tc>".length) + filled + "</w:tc>";
}

/** Fills a form made of tables (`blockXml`): each column's value goes in
 * the cell its label points to — the empty cell beside the label, else the
 * cell under it, else the label's own cell. */
function fillSlots(blockXml: string, columns: string[], values: string[]): string {
  const cells: { el: Element; text: string; table: number; row: number; col: number }[] = [];
  const grid: Element[][][] = [];
  children(blockXml, 0, blockXml.length)
    .filter((el) => el.name === "w:tbl")
    .forEach((tbl, t) => {
      grid[t] = inner(blockXml, tbl)
        .filter((el) => el.name === "w:tr")
        .map((tr, r) =>
          inner(blockXml, tr)
            .filter((el) => el.name === "w:tc")
            .map((tc, c) => {
              cells.push({ el: tc, text: textOf(blockXml.slice(tc.start, tc.end)), table: t, row: r, col: c });
              return tc;
            })
        );
    });
  const isEmpty = (el: Element) => !textOf(blockXml.slice(el.start, el.end)).trim();
  const hasPlaceholder = (el: Element) =>
    (blockXml.slice(el.start, el.end).match(/<w:p[\s>][\s\S]*?<\/w:p>/g) ?? []).some((p) => isPlaceholder(textOf(p)));
  const edits = new Map<number, { el: Element; value: string }>();
  columns.forEach((column, j) => {
    const value = (values[j] ?? "").trim();
    const label = cells.find((c) => isLabel(c.text, column));
    if (!value || !label) return;
    const beside = grid[label.table][label.row][label.col + 1];
    const below = grid[label.table][label.row + 1]?.[label.col];
    const target =
      beside && isEmpty(beside) ? beside : below && (isEmpty(below) || hasPlaceholder(below)) ? below : label.el;
    if (!edits.has(target.start)) edits.set(target.start, { el: target, value });
  });
  let out = blockXml;
  for (const { el, value } of [...edits.values()].sort((a, b) => b.el.start - a.el.start)) {
    out = out.slice(0, el.start) + cellWith(out.slice(el.start, el.end), value) + out.slice(el.end);
  }
  return out;
}

function formatNumber(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

/** "WP1: 6, AP2: 12,5" → [["WP1", 6], ["WP2", 12.5]]. */
function workPackageEfforts(text: string): [string, number][] {
  return [...text.matchAll(/([A-Za-zÅÄÖåäö]*\s?\d+[a-z]?)\s*[:=]\s*(\d+(?:[.,]\d+)?)/g)].map((m) => [
    m[1].replace(/\s+/g, "").replace(/^AP/i, "WP").toUpperCase(),
    Number(m[2].replace(",", ".")),
  ]);
}

/** "matrix": a header row (blank, WP columns, total), participant rows and
 * a total row — rebuilt with one column per work package named in the rows. */
function fillMatrix(tblXml: string, rows: string[][]): string | null {
  const efforts = rows.map((r) => workPackageEfforts(r[1] ?? ""));
  const wps = [...new Set(efforts.flat().map(([wp]) => wp))];
  const table = splitTable(tblXml);
  if (wps.length === 0 || table.rows.length < 2) return null;
  const header = rowParts(table.rows[0]);
  if (header.cells.length < 3) return null;
  const totalRow = table.rows.length > 2 && /total/i.test(cellTexts(table.rows[table.rows.length - 1])[0] ?? "") ? table.rows[table.rows.length - 1] : undefined;
  const participantRow = rowParts(table.rows[1]);

  // The WP columns share the template's WP columns' width.
  const gridCols = [...tblXml.matchAll(/<w:gridCol w:w="(\d+)"\/>/g)].map((m) => Number(m[1]));
  const wpWidth = gridCols.length === header.cells.length ? Math.floor(gridCols.slice(1, -1).reduce((a, b) => a + b, 0) / wps.length) : undefined;
  const sums = wps.map(() => 0);
  const build = (parts: ReturnType<typeof rowParts>, first: string, wpValues: string[], total: string, keepFirst = false) =>
    `${parts.openTag}${parts.trPr}${keepFirst ? parts.cells[0] : cellLike(parts.cells[0], first)}${wpValues
      .map((v) => cellLike(parts.cells[1], v, wpWidth))
      .join("")}${cellLike(parts.cells[parts.cells.length - 1], total)}</w:tr>`;

  const headerXml = `${header.openTag}${header.trPr}${header.cells[0]}${wps.map((wp) => cellLike(header.cells[1], wp, wpWidth, true)).join("")}${header.cells[header.cells.length - 1]}</w:tr>`;
  const bodyXml = rows.map((row, i) => {
    const byWp = new Map(efforts[i]);
    const sum = efforts[i].reduce((a, [, n]) => a + n, 0);
    wps.forEach((wp, k) => (sums[k] += byWp.get(wp) ?? 0));
    const values = wps.map((wp) => (byWp.has(wp) ? formatNumber(byWp.get(wp)!) : ""));
    return build(participantRow, row[0] ?? "", values, row[2]?.trim() || formatNumber(sum));
  });
  const totalXml = totalRow
    ? build(rowParts(totalRow), "", sums.map(formatNumber), formatNumber(sums.reduce((a, b) => a + b, 0)), true)
    : "";
  let before = table.before;
  if (wpWidth !== undefined) {
    const cols = [gridCols[0], ...wps.map(() => wpWidth), gridCols[gridCols.length - 1]];
    before = before.replace(/<w:tblGrid>[\s\S]*?<\/w:tblGrid>/, `<w:tblGrid>${cols.map((w) => `<w:gridCol w:w="${w}"/>`).join("")}</w:tblGrid>`);
  }
  return before + headerXml + bodyXml.join("") + totalXml + table.after;
}

/** Fills the body of word/document.xml. */
export function fillDocumentXml(
  xml: string,
  sections: FillSection[],
  tables: FillTable[],
  options: FillOptions = {}
): FillResult & { xml: string } {
  const bodyOpen = xml.indexOf("<w:body>");
  const bodyClose = xml.lastIndexOf("</w:body>");
  if (bodyOpen < 0 || bodyClose < 0) throw new Error("Ogiltig Word-fil: dokumentet saknar innehåll");
  const filled: string[] = [];
  const missing: string[] = [];
  // Edits are collected first and applied from the end, so earlier
  // positions stay valid. They never overlap.
  const edits: { at: number; end: number; replace: (current: string) => string; label?: string }[] = [];
  const elements = children(xml, bodyOpen + "<w:body>".length, bodyClose);
  const texts = elements.map((el) => (el.name === "w:p" ? textOf(xml.slice(el.start, el.end)) : ""));
  const elXml = (i: number) => xml.slice(elements[i].start, elements[i].end);

  let first = 0;
  const candidate = (i: number) => i >= first && elements[i].name === "w:p" && !isTocLine(elXml(i));
  const lastWhere = (test: (i: number) => boolean) => {
    for (let i = elements.length - 1; i >= first; i--) if (candidate(i) && test(i)) return i;
    return -1;
  };

  if (options.startsAt) {
    const start = normalize(options.startsAt);
    const i = lastWhere((k) => normalize(texts[k]).startsWith(start));
    if (i > 0) {
      edits.push({ at: elements[0].start, end: elements[i].start, replace: () => "" });
      first = i;
    }
  }

  for (const p of options.paragraphs ?? []) {
    const i = p.value.trim() ? lastWhere((k) => normalize(texts[k]) === normalize(p.text)) : -1;
    if (i < 0) continue;
    const pXml = elXml(i);
    const pPr = pXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? "";
    edits.push({ at: elements[i].start, end: elements[i].end, replace: () => paragraphsXml(p.value, paragraphProps(pXml), runProps(pXml, true), pPr) });
  }

  for (const section of options.remove ?? []) {
    const i = lastWhere((k) => isHeading(texts[k], section));
    if (i < 0) continue;
    let end = i + 1;
    while (end < elements.length && !(candidate(end) && /^\d+(?:\.\d+)*\.?\s*\p{L}/u.test(normalize(texts[end])))) end++;
    if (end >= elements.length) continue;
    edits.push({ at: elements[i].start, end: elements[end].start, replace: () => "" });
  }

  for (const section of sections) {
    const label = section.number ? `${section.number} ${section.heading}` : section.heading;
    const index = lastWhere((i) => isHeading(texts[i], section));
    if (index < 0) {
      missing.push(label);
      continue;
    }
    if (!section.text.trim()) continue;
    // The template's "Insert here text for your proposal", when it has one
    // (after any empty paragraphs), is replaced — in its look, and keeping
    // a section break it may carry on its last line.
    let next = index + 1;
    while (next < elements.length && elements[next].name === "w:p" && !texts[next].trim() && next < index + 3) next++;
    const nextXml = next < elements.length && elements[next].name === "w:p" ? elXml(next) : "";
    if (nextXml && isPlaceholder(texts[next])) {
      const pPr = nextXml.match(/<w:pPr>[\s\S]*?<\/w:pPr>/)?.[0] ?? "";
      edits.push({
        at: elements[next].start,
        end: elements[next].end,
        replace: () => paragraphsXml(section.text, paragraphProps(nextXml), runProps(nextXml), pPr),
        label,
      });
    } else {
      // Otherwise right after the heading, in its font but not bold.
      const at = elements[index].end;
      edits.push({ at, end: at, replace: () => paragraphsXml(section.text, "", runProps(elXml(index))), label });
    }
  }

  for (const table of tables) {
    const title = normalize(table.title);
    const index = lastWhere((i) => normalize(texts[i]).startsWith(title));
    const tblIndex = index < 0 ? -1 : elements.findIndex((el, i) => i > index && i <= index + 3 && el.name === "w:tbl");
    if (tblIndex < 0) {
      missing.push(table.title);
      continue;
    }
    const rows = table.rows.filter((r) => r.some((c) => c.trim()));
    if (rows.length === 0) continue;
    const mode = table.mode ?? "rows";
    // The tables that follow the title, with only empty paragraphs between.
    let blockEnd = tblIndex;
    for (let i = tblIndex + 1; i < elements.length; i++) {
      if (elements[i].name === "w:tbl") blockEnd = i;
      else if (elements[i].name !== "w:p" || texts[i].trim() || elXml(i).includes("<w:sectPr")) break;
    }
    const tbl = elements[tblIndex];
    const columns = table.columns ?? [];
    if (mode === "repeat" || mode === "combine") {
      const end = elements[blockEnd].end;
      edits.push({
        at: tbl.start,
        end,
        replace: (block) =>
          mode === "combine"
            ? fillSlots(block, columns, columns.map((_, j) => rows.map((r) => r[j] ?? "").filter((v) => v.trim()).join("\n")))
            : rows.map((row) => fillSlots(block, columns, row)).join("<w:p/>"),
        label: table.title,
      });
      continue;
    }
    edits.push({
      at: tbl.start,
      end: tbl.end,
      replace: (current) => (mode === "matrix" ? fillMatrix(current, rows) : null) ?? fillRows(current, rows),
      label: table.title,
    });
  }

  let out = xml;
  // From the end; at the same position a replacement goes before an insertion.
  for (const edit of [...edits].sort((a, b) => b.at - a.at || b.end - b.at - (a.end - a.at))) {
    out = out.slice(0, edit.at) + edit.replace(out.slice(edit.at, edit.end)) + out.slice(edit.end);
    if (edit.label) filled.push(edit.label);
  }
  filled.reverse();
  return { xml: out, filled, missing };
}

function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** Replaces placeholders (e.g. "[insert call identifier]") in the text of
 * any part of the document — the body, headers and footers — also when the
 * template spreads one over several runs or spaces its brackets
 * ("[ insert call identifier ]"). */
export function replacePlaceholders(xml: string, values: Record<string, string>): string {
  const patterns = Object.entries(values).map(([placeholder, value]) => ({
    re: new RegExp(
      escapeRegex(placeholder.trim())
        .replace(/^\\\[/, "\\[\\s*")
        .replace(/\\\]$/, "\\s*\\]")
        .replace(/\s+/g, "\\s+"),
      "gi"
    ),
    value,
  }));
  return xml.replace(/<w:p[\s>][\s\S]*?<\/w:p>/g, (paragraph) => {
    const nodes = [...paragraph.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)];
    if (nodes.length === 0) return paragraph;
    const parts = nodes.map((n) => decode(n[1]));
    const full = parts.join("");
    const matches = patterns.flatMap(({ re, value }) => [...full.matchAll(re)].map((m) => ({ start: m.index!, end: m.index! + m[0].length, value })));
    if (matches.length === 0) return paragraph;
    // Each match is written into the run where it starts; the rest of it is
    // taken out of the runs it spans.
    const offsets: number[] = [];
    parts.forEach((p, i) => offsets.push(i === 0 ? 0 : offsets[i - 1] + parts[i - 1].length));
    const nodeAt = (pos: number) => {
      let i = parts.length - 1;
      while (i > 0 && (offsets[i] > pos || parts[i].length === 0)) i--;
      return i;
    };
    const next = [...parts];
    for (const m of matches.sort((a, b) => b.start - a.start)) {
      const s = nodeAt(m.start);
      const e = nodeAt(m.end - 1);
      const tail = parts[e].slice(m.end - offsets[e]);
      for (let k = s + 1; k <= e; k++) next[k] = k === e ? tail : "";
      next[s] = next[s].slice(0, m.start - offsets[s]) + m.value + (s === e ? next[s].slice(m.end - offsets[s]) : "");
    }
    let k = 0;
    return paragraph.replace(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g, () => `<w:t xml:space="preserve">${escapeXml(next[k++])}</w:t>`);
  });
}

/** Fills a funder's .docx and returns the new file's bytes, with what was
 * and wasn't found. */
export async function fillFunderDocx(
  data: ArrayBuffer | Uint8Array,
  sections: FillSection[],
  tables: FillTable[],
  placeholders: Record<string, string> = {},
  options: FillOptions = {}
): Promise<FillResult & { bytes: Uint8Array }> {
  const { default: JSZip } = await import("jszip");
  const zip = await JSZip.loadAsync(data);
  const documentFile = zip.file("word/document.xml");
  if (!documentFile) throw new Error("Filen är inte ett Word-dokument (.docx)");
  const result = fillDocumentXml(await documentFile.async("string"), sections, tables, options);
  zip.file("word/document.xml", replacePlaceholders(result.xml, placeholders));
  for (const name of Object.keys(zip.files)) {
    if (!/^word\/(header|footer)\d*\.xml$/.test(name)) continue;
    zip.file(name, replacePlaceholders(await zip.file(name)!.async("string"), placeholders));
  }
  const bytes = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  return { bytes, filled: result.filled, missing: result.missing };
}

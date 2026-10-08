// npm run import:keep-eu — data/raw/keep_eu_project_search_results.xlsx
// (sheets "Search results, projects" and "Search results, partners")
// → lib/data/generated/keep-eu.json
import ExcelJS from "exceljs";
import { rawFile } from "../../lib/integrations/core/files";
import { KeepRow, transformKeepEu } from "../../lib/integrations/keep-eu/transform";
import { finish, main } from "./run";

const PROJECT_SHEET = "Search results, projects";
const PARTNER_SHEET = "Search results, partners";

/** Plain value of a cell: rich text, hyperlinks and formulas flattened. */
function cellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined || value instanceof Date) return value ?? null;
  if (typeof value !== "object") return value;
  if ("richText" in value) return value.richText.map((r) => r.text).join("");
  if ("text" in value) return value.text;
  if ("result" in value) return value.result ?? null;
  return null;
}

function sheetRows(workbook: ExcelJS.Workbook, name: string): KeepRow[] {
  const sheet = workbook.getWorksheet(name);
  if (!sheet) throw new Error(`Sheet "${name}" missing in keep.eu export`);
  const header: string[] = [];
  sheet.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
    header[col] = String(cellValue(cell.value) ?? "").trim();
  });
  const rows: KeepRow[] = [];
  for (let r = 2; r <= sheet.rowCount; r++) {
    const row = sheet.getRow(r);
    if (!row.hasValues) continue;
    const record: KeepRow = {};
    header.forEach((h, col) => {
      if (h) record[h] = cellValue(row.getCell(col).value);
    });
    rows.push(record);
  }
  return rows;
}

main(async () => {
  const file = rawFile("keep_eu_project_search_results.xlsx");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const projects = sheetRows(workbook, PROJECT_SHEET);
  const partners = sheetRows(workbook, PARTNER_SHEET);
  const result = transformKeepEu(projects, partners);
  finish("keep-eu", [file], { [PROJECT_SHEET]: projects.length, [PARTNER_SHEET]: partners.length }, result);
});

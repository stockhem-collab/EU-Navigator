// npm run import:fts — data/raw/fts/<år>_FTS_dataset_en.xlsx (the EU
// Financial Transparency System's yearly datasets) → lib/data/generated/fts.json.
// The files are large (about 120 000 rows a year), so they are streamed and
// only Swedish rows are kept before the transform.
import path from "node:path";
import ExcelJS from "exceljs";
import { rawFiles } from "../../lib/integrations/core/files";
import { FTS_COL, FtsRow, transformFts } from "../../lib/integrations/fts/transform";
import { finish, main } from "./run";

/** Plain value of a cell: rich text, hyperlinks and formulas flattened. */
function cellValue(value: ExcelJS.CellValue): unknown {
  if (value === null || value === undefined || value instanceof Date) return value ?? null;
  if (typeof value !== "object") return value;
  if ("richText" in value) return value.richText.map((r) => r.text).join("");
  if ("text" in value) return value.text;
  if ("result" in value) return value.result ?? null;
  return null;
}

async function swedishRows(file: string): Promise<{ rows: FtsRow[]; read: number }> {
  const reader = new ExcelJS.stream.xlsx.WorkbookReader(file, { sharedStrings: "cache", worksheets: "emit" });
  const rows: FtsRow[] = [];
  let read = 0;
  for await (const sheet of reader) {
    let header: string[] | null = null;
    let countryCol = -1;
    for await (const row of sheet) {
      const values = row.values as ExcelJS.CellValue[];
      if (!header) {
        header = values.map((v) => String(cellValue(v) ?? "").trim());
        countryCol = header.indexOf(FTS_COL.country);
        if (countryCol < 0) throw new Error(`${path.basename(file)}: column "${FTS_COL.country}" missing`);
        continue;
      }
      read++;
      if (cellValue(values[countryCol]) !== "Sweden") continue;
      const record: FtsRow = {};
      header.forEach((h, col) => {
        if (h) record[h] = cellValue(values[col]);
      });
      rows.push(record);
    }
    break;
  }
  return { rows, read };
}

main(async () => {
  const files = rawFiles(/^\d{4}_FTS_dataset_en\.xlsx$/, "fts");
  const rows: FtsRow[] = [];
  const rowsRead: Record<string, number> = {};
  for (const file of files) {
    const { rows: swedish, read } = await swedishRows(file);
    rowsRead[path.basename(file)] = read;
    rows.push(...swedish);
  }
  const result = transformFts(rows);
  result.skipped["stödmottagare utanför Sverige"] = Object.values(rowsRead).reduce((s, n) => s + n, 0) - rows.length;
  finish("fts", files, rowsRead, result);
});

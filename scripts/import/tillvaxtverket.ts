// npm run import:tillvaxtverket — data/raw/tillvaxtverket/projektbanken_eu_2021-2027_*.xlsx
// (Tillväxtverket's projektbank, projektbank.tillvaxtverket.se, tab
// "EU-program 2021-2027", "Ladda ner excel") → lib/data/generated/tillvaxtverket.json.
// Reads the Kohesio 2021–2027 export too, to leave out projects Kohesio
// already has.
import path from "node:path";
import ExcelJS from "exceljs";
import { latestRawFile, rawFile, readCsv } from "../../lib/integrations/core/files";
import {
  kohesioCaseIds,
  swedishHeader,
  TillvaxtverketRow,
  transformTillvaxtverket,
} from "../../lib/integrations/tillvaxtverket/transform";
import { finish, main } from "./run";

main(async () => {
  const file = latestRawFile(/^projektbanken_eu_2021-2027_.*\.xlsx$/, "tillvaxtverket");
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.readFile(file);
  const sheet = workbook.worksheets[0];
  let header: string[] = [];
  const rows: TillvaxtverketRow[] = [];
  sheet.eachRow((row, n) => {
    const values = (row.values as ExcelJS.CellValue[]).slice(1);
    if (n === 1) {
      header = values.map((v) => swedishHeader(String(v ?? "")));
      return;
    }
    rows.push(Object.fromEntries(header.map((h, i) => [h, values[i] ?? null])));
  });
  const kohesioFile = rawFile("kohesio_SE_pp21-27.csv");
  const inKohesio = kohesioCaseIds(readCsv(kohesioFile, ",").map((r) => r.Operation_Local_Identifier));
  const result = transformTillvaxtverket(rows, inKohesio);
  finish("tillvaxtverket", [file, kohesioFile], { [path.basename(file)]: rows.length }, result);
});

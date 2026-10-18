// npm run import:esf — data/raw/esf_projektbanken_*.csv → lib/data/generated/esf.json
// Reads every export (the whole country, and older exports for one
// municipality); a diarienummer in more than one file is read once, from the
// newest export. Reads the Kohesio exports too, to leave out projects Kohesio
// already has.
import fs from "node:fs";
import path from "node:path";
import { rawFiles, readCsv } from "../../lib/integrations/core/files";
import { transformEsf } from "../../lib/integrations/esf/transform";
import { readKohesio } from "./kohesio";
import { finish, main } from "./run";

/** The export date in the file name, e.g. "2026-10-17"; files without one
 * count by their modification time. */
function exportDate(file: string): string {
  return path.basename(file).match(/(\d{4}-\d{2}-\d{2})\.csv$/)?.[1] ?? fs.statSync(file).mtime.toISOString().slice(0, 10);
}

main(() => {
  const files = rawFiles(/^esf_projektbanken_.*\.csv$/).sort((a, b) => exportDate(b).localeCompare(exportDate(a)));
  const perFile = files.map((file) => ({ file, rows: readCsv(file, ";") }));
  const kohesio = readKohesio();
  const result = transformEsf(perFile.flatMap((f) => f.rows), kohesio.result);
  finish(
    "esf",
    [...files, ...kohesio.files],
    Object.fromEntries(perFile.map((f) => [path.basename(f.file), f.rows.length])),
    result,
    { kohesioMatches: result.matches },
  );
});

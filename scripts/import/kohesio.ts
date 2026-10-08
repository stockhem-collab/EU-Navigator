// npm run import:kohesio — data/raw/kohesio_SE_pp*.csv → lib/data/generated/kohesio.json
import path from "node:path";
import { rawFile, readCsv } from "../../lib/integrations/core/files";
import { transformKohesio } from "../../lib/integrations/kohesio/transform";
import { finish, main } from "./run";

export const KOHESIO_FILES = ["kohesio_SE_pp14-20.csv", "kohesio_SE_pp21-27.csv"];

export function readKohesio() {
  const files = KOHESIO_FILES.map(rawFile);
  const rowsRead: Record<string, number> = {};
  const rows = files.flatMap((file) => {
    const fileRows = readCsv(file, ",");
    rowsRead[path.basename(file)] = fileRows.length;
    return fileRows;
  });
  return { files, rowsRead, result: transformKohesio(rows) };
}

if (require.main === module) {
  main(() => {
    const { files, rowsRead, result } = readKohesio();
    finish("kohesio", files, rowsRead, result);
  });
}

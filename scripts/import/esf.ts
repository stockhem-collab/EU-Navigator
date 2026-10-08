// npm run import:esf — data/raw/esf_projektbanken_*.csv → lib/data/generated/esf.json
// Reads the Kohesio exports too, to leave out projects Kohesio already has.
import path from "node:path";
import { latestRawFile, readCsv } from "../../lib/integrations/core/files";
import { transformEsf } from "../../lib/integrations/esf/transform";
import { readKohesio } from "./kohesio";
import { finish, main } from "./run";

main(() => {
  const file = latestRawFile(/^esf_projektbanken_.*\.csv$/);
  const rows = readCsv(file, ";");
  const kohesio = readKohesio();
  const result = transformEsf(rows, kohesio.result);
  finish(
    "esf",
    [file, ...kohesio.files],
    { [path.basename(file)]: rows.length },
    result,
    { kohesioMatches: result.matches },
  );
});

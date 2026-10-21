// npm run import:vinnova — data/raw/vinnova_projekt_*.json and
// vinnova_program_*.json → lib/data/generated/vinnova.json.
// npm run fetch:vinnova downloads both files from Vinnova's open API first
// (data.vinnova.se, public domain; the project list is ~80 MB and takes a
// few minutes).
import fs from "node:fs";
import path from "node:path";
import { latestRawFile, RAW_DIR } from "../../lib/integrations/core/files";
import { transformVinnova, VinnovaProgram, VinnovaProject } from "../../lib/integrations/vinnova/transform";
import { finish, main } from "./run";

const API = "https://data.vinnova.se/api";

async function download(kind: "projekt" | "program"): Promise<string> {
  // "Changed on or after" this date, i.e. everything.
  const res = await fetch(`${API}/${kind}/2000-01-01`);
  if (!res.ok) throw new Error(`${API}/${kind}: HTTP ${res.status}`);
  const body = await res.text();
  JSON.parse(body); // fail before writing a broken file
  fs.mkdirSync(RAW_DIR, { recursive: true });
  const file = path.join(RAW_DIR, `vinnova_${kind}_${new Date().toISOString().slice(0, 10)}.json`);
  fs.writeFileSync(file, body);
  console.log(`hämtad ${path.relative(process.cwd(), file)} (${(body.length / 1_000_000).toFixed(1)} MB)`);
  return file;
}

main(async () => {
  if (process.argv.includes("--fetch")) {
    await download("program");
    await download("projekt");
  }
  const projectFile = latestRawFile(/^vinnova_projekt_.*\.json$/);
  const programFile = latestRawFile(/^vinnova_program_.*\.json$/);
  const rows = JSON.parse(fs.readFileSync(projectFile, "utf8")) as VinnovaProject[];
  const programs = JSON.parse(fs.readFileSync(programFile, "utf8")) as VinnovaProgram[];
  const result = transformVinnova(rows, programs);
  finish(
    "vinnova",
    [projectFile, programFile],
    { [path.basename(projectFile)]: rows.length, [path.basename(programFile)]: programs.length },
    result,
  );
});

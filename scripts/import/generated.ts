// Reads the datasets the import scripts wrote to lib/data/generated/.
import fs from "node:fs";
import path from "node:path";
import { GENERATED_DIR, ROOT } from "../../lib/integrations/core/files";
import { GeneratedDataset, SourceSystem } from "../../lib/integrations/core/types";

export const SOURCES: SourceSystem[] = ["kohesio", "esf", "keep-eu", "cordis"];

export function readGenerated(): GeneratedDataset[] {
  return SOURCES.map((source) => {
    const file = path.join(GENERATED_DIR, `${source}.json`);
    if (!fs.existsSync(file)) {
      throw new Error(`Missing ${path.relative(ROOT, file)}. Run npm run import:all first.`);
    }
    return JSON.parse(fs.readFileSync(file, "utf8")) as GeneratedDataset;
  });
}

export function writeGenerated(name: string, data: unknown): string {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const file = path.join(GENERATED_DIR, name);
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + "\n");
  return path.relative(ROOT, file);
}

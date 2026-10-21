// npm run import:calls — data/utlysningar.csv (+ each call's own
// requirements in data/utlysningskrav.csv) → lib/data/callList.json, the
// real calls the app shows and matches next to its seed calls. Small and
// committed; rerun after editing the CSV (a unit test checks the two agree).
import fs from "node:fs";
import path from "node:path";
import { readCsv, readEurSekRates, ROOT } from "../../lib/integrations/core/files";
import { callsFromList } from "../../lib/integrations/calls/callList";
import { suggestTags } from "../../lib/matching/tagSuggestions";
import { tagIdFor } from "../../lib/data/tags";
import { themesFromCsvTema } from "../../lib/data/fundThemes";
import { main } from "./run";

export const CALL_LIST_CSV = path.join(ROOT, "data", "utlysningar.csv");
export const CALL_REQUIREMENTS_CSV = path.join(ROOT, "data", "utlysningskrav.csv");
export const CALL_LIST_JSON = path.join(ROOT, "lib", "data", "callList.json");

export function readCallList(now?: Date) {
  return callsFromList(readCsv(CALL_LIST_CSV, ","), {
    rates: readEurSekRates(),
    suggestTags,
    tagIdFor,
    themesFromTema: themesFromCsvTema,
    requirements: readCsv(CALL_REQUIREMENTS_CSV, ","),
    now,
  });
}

if (require.main === module) {
  main(() => {
    const calls = readCallList();
    fs.writeFileSync(CALL_LIST_JSON, JSON.stringify(calls, null, 2) + "\n");
    const count = (s: string) => calls.filter((c) => c.sourceStatus === s).length;
    console.log(`\n[utlysningar]`);
    console.log(`  läst fil     data/utlysningar.csv, data/utlysningskrav.csv`);
    console.log(`  egna krav    ${calls.filter((c) => c.requirementChanges).length} utlysningar`);
    console.log(`  rapportkrav  ${calls.filter((c) => c.reportRequirementChanges).length} utlysningar`);
    console.log(`  utlysningar  ${calls.length} (öppna ${count("open")}, planerade ${count("planned")}, kommande ${count("upcoming")}, förväntade ${count("expected")})`);
    console.log(`  skriven fil  ${path.relative(ROOT, CALL_LIST_JSON)}`);
  });
}

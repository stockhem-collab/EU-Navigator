// npm run import:erasmus — data/raw/erasmus/ErasmusPlus_*_Projects_Overview_*.csv
// (the Erasmus+ project lists, exported per key action and call year from
// erasmus-plus.ec.europa.eu/projects) and data/raw/skolverket/skolverket_*.json
// → lib/data/generated/erasmus.json.
// npm run fetch:skolverket downloads Skolverket's school-unit register first
// (api.skolverket.se, open data, a few hundred requests).
// The CSVs are large (60–110 MB each, all of Europe), so they are streamed
// and only rows with a Swedish participant are kept.
import fs from "node:fs";
import path from "node:path";
import Papa from "papaparse";
import { latestRawFile, RAW_DIR, rawFiles } from "../../lib/integrations/core/files";
import { MunicipalRegister, SkolverketRegister } from "../../lib/integrations/erasmus/municipal";
import { ErasmusRow, participants, transformErasmus } from "../../lib/integrations/erasmus/transform";
import { finish, main } from "./run";

const SKOLVERKET = "https://api.skolverket.se/skolenhetsregistret/v2";

async function getJson(url: string): Promise<any> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetch(url, { headers: { accept: "application/json" } });
      if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (attempt >= 3) throw err;
    }
  }
}

async function fetchSkolverket(): Promise<void> {
  const units = (await getJson(`${SKOLVERKET}/school-units`)).data.attributes as { schoolUnitCode: string; name: string }[];
  const organisers = (await getJson(`${SKOLVERKET}/organizers`)).data.attributes as {
    organizationNumber: string;
    organizerType: string;
  }[];
  const municipal = organisers.filter((o) => o.organizerType === "KOMMUN");
  const municipalities: SkolverketRegister["municipalities"] = [];
  // A few at a time, to be kind to the API.
  for (let i = 0; i < municipal.length; i += 6) {
    const batch = await Promise.all(
      municipal.slice(i, i + 6).map((o) => getJson(`${SKOLVERKET}/organizers/${o.organizationNumber}`)),
    );
    for (const { data } of batch) {
      const m = data.attributes.municipalities?.[0];
      if (!m) continue;
      municipalities.push({
        orgNumber: data.organizationNumber,
        municipalityCode: m.municipalityCode,
        name: m.displayName,
        unitCodes: (data.relationships?.schoolunit?.data ?? []).map((u: { schoolUnitCode: string }) => u.schoolUnitCode),
      });
    }
  }
  const register: SkolverketRegister = {
    fetchedAt: new Date().toISOString(),
    units: units.map((u) => ({ code: u.schoolUnitCode, name: u.name })),
    municipalities,
  };
  const dir = path.join(RAW_DIR, "skolverket");
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `skolverket_${register.fetchedAt.slice(0, 10)}.json`);
  fs.writeFileSync(file, JSON.stringify(register));
  console.log(`hämtad ${path.relative(process.cwd(), file)} (${units.length} skolenheter, ${municipalities.length} kommuner)`);
}

function swedishRows(file: string): Promise<{ rows: ErasmusRow[]; read: number }> {
  return new Promise((resolve, reject) => {
    const rows: ErasmusRow[] = [];
    let read = 0;
    Papa.parse<ErasmusRow>(fs.createReadStream(file, "utf8"), {
      header: true,
      skipEmptyLines: true,
      transformHeader: (h) => h.replace(/^﻿/, "").trim(),
      step: (result) => {
        read++;
        const row = result.data;
        if (!participants(row).some((o) => o.country === "SE")) return;
        delete row["Project Summary"];
        rows.push(row);
      },
      complete: () => resolve({ rows, read }),
      error: reject,
    });
  });
}

main(async () => {
  if (process.argv.includes("--fetch")) await fetchSkolverket();
  const registerFile = latestRawFile(/^skolverket_.*\.json$/, "skolverket");
  const register = new MunicipalRegister(JSON.parse(fs.readFileSync(registerFile, "utf8")) as SkolverketRegister);
  const files = rawFiles(/^ErasmusPlus_.*_Projects_Overview_.*\.csv$/, "erasmus");
  const rows: ErasmusRow[] = [];
  const rowsRead: Record<string, number> = {};
  for (const file of files) {
    const { rows: swedish, read } = await swedishRows(file);
    rowsRead[path.basename(file)] = read;
    rows.push(...swedish);
  }
  const result = transformErasmus(rows, register);
  result.skipped["ingen svensk deltagare"] =
    (result.skipped["ingen svensk deltagare"] ?? 0) + Object.values(rowsRead).reduce((s, n) => s + n, 0) - rows.length;
  finish("erasmus", [...files, registerFile], rowsRead, result);
});

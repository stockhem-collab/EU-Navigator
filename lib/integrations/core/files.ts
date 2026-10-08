// File input and output for the import scripts (Node only): raw files in
// data/raw/, CSV (also inside zips), and the generated JSON in
// lib/data/generated/.

import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { parseCsv } from "./csv";
import { parseEurSekRates, EurSekRates } from "./currency";
import { GeneratedDataset, ImportFileInfo, ImportReport } from "./types";

export const ROOT = path.resolve(__dirname, "../../..");
export const RAW_DIR = path.join(ROOT, "data", "raw");
export const GENERATED_DIR = path.join(ROOT, "lib", "data", "generated");

export function rawFile(name: string): string {
  const file = path.join(RAW_DIR, name);
  if (!fs.existsSync(file)) {
    throw new Error(`Missing ${path.relative(ROOT, file)}. Put the source export in data/raw/.`);
  }
  return file;
}

/** Newest file in data/raw/ matching a pattern, e.g. esf_projektbanken_*.csv. */
export function latestRawFile(pattern: RegExp): string {
  const matches = fs.existsSync(RAW_DIR)
    ? fs.readdirSync(RAW_DIR).filter((f) => pattern.test(f)).sort()
    : [];
  if (matches.length === 0) throw new Error(`No file in data/raw/ matches ${pattern}`);
  return path.join(RAW_DIR, matches[matches.length - 1]);
}

export function fileInfo(file: string): ImportFileInfo {
  return { name: path.relative(ROOT, file), bytes: fs.statSync(file).size };
}

export { parseCsv };

export function readCsv(file: string, delimiter: "," | ";"): Record<string, string>[] {
  return parseCsv(fs.readFileSync(file, "utf8"), delimiter);
}

/** Reads one entry out of a zip archive without extracting it to disk.
 * Supports stored and deflated entries (all CORDIS exports use these). */
export function readZipEntry(zipFile: string, entryName: string): Buffer {
  const buf = fs.readFileSync(zipFile);
  // End of central directory record: last 22+ bytes, signature 0x06054b50.
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error(`${zipFile} is not a zip file`);
  const entries = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let n = 0; n < entries; n++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error(`Corrupt zip directory in ${zipFile}`);
    const method = buf.readUInt16LE(p + 10);
    const compressedSize = buf.readUInt32LE(p + 20);
    const nameLength = buf.readUInt16LE(p + 28);
    const extraLength = buf.readUInt16LE(p + 30);
    const commentLength = buf.readUInt16LE(p + 32);
    const localOffset = buf.readUInt32LE(p + 42);
    const name = buf.toString("utf8", p + 46, p + 46 + nameLength);
    if (name === entryName || name.endsWith(`/${entryName}`)) {
      const localNameLength = buf.readUInt16LE(localOffset + 26);
      const localExtraLength = buf.readUInt16LE(localOffset + 28);
      const start = localOffset + 30 + localNameLength + localExtraLength;
      const data = buf.subarray(start, start + compressedSize);
      if (method === 0) return Buffer.from(data);
      if (method === 8) return zlib.inflateRawSync(data);
      throw new Error(`Unsupported zip compression ${method} for ${name}`);
    }
    p += 46 + nameLength + extraLength + commentLength;
  }
  throw new Error(`${entryName} not found in ${zipFile}`);
}

export function readEurSekRates(): EurSekRates {
  return parseEurSekRates(fs.readFileSync(path.join(ROOT, "data", "vaxelkurs.csv"), "utf8"));
}

/** Writes lib/data/generated/<source>.json and returns its file info. */
export function writeDataset(dataset: GeneratedDataset): ImportFileInfo {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
  const file = path.join(GENERATED_DIR, `${dataset.source}.json`);
  fs.writeFileSync(file, JSON.stringify(dataset) + "\n");
  return fileInfo(file);
}

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024).toFixed(1)} kB`;
}

export function printReport(report: ImportReport): void {
  const lines = [`\n[${report.source}]`];
  for (const f of report.inputFiles) lines.push(`  läst fil     ${f.name} (${formatBytes(f.bytes)})`);
  for (const [k, v] of Object.entries(report.rowsRead)) lines.push(`  rader lästa  ${k}: ${v}`);
  const w = report.written;
  lines.push(`  skrivna      projekt ${w.projects}, organisationer ${w.organisations}, partnerrader ${w.partners}`);
  const skipped = Object.entries(report.skipped).filter(([, v]) => v > 0);
  if (skipped.length === 0) lines.push("  överhoppade  0");
  for (const [k, v] of skipped) lines.push(`  överhoppade  ${k}: ${v}`);
  lines.push(`  skriven fil  ${report.outputFile.name} (${formatBytes(report.outputFile.bytes)})`);
  console.log(lines.join("\n"));
}

import { test, expect } from "@playwright/test";
import { parseProjectsCsv } from "../../lib/matching/projectIntake";

// Regression coverage for two bugs found in review:
// 1. parseNumber corrupting decimal/thousands-separated budgets by
//    stripping every non-digit character.
// 2. Re-importing the same CSV generating colliding ids because the
//    dedup set was scoped to a single parse call.

test.describe("parseProjectsCsv", () => {
  test("imports a basic row with sane defaults", () => {
    const csv = `Titel,Förvaltning,Ägare,Budget,Startår,Slutår,Sektor,Beskrivning\nSolceller på skolor,Fastighet,Anna Andersson,45000000,2028,2030,Energi,En beskrivning av projektet.`;
    const { entries, errors } = parseProjectsCsv(csv);
    expect(errors).toEqual([]);
    expect(entries).toHaveLength(1);
    expect(entries[0].estimatedCostSEK).toBe(45000000);
    expect(entries[0].sector).toBe("energy");
    expect(entries[0].periodStart).toBe(2028);
    expect(entries[0].periodEnd).toBe(2030);
  });

  test("parses a Swedish-style decimal budget correctly, not 100x too large", () => {
    const csv = `Titel,Budget\nTestprojekt,"45 000 000,50 kr"`;
    const { entries } = parseProjectsCsv(csv);
    // The naive "strip every non-digit" parser used to turn this into
    // 4500000050 (≈4.5 billion) by deleting the decimal comma along with
    // the thousands spaces and currency text.
    expect(entries[0].estimatedCostSEK).toBeGreaterThan(44_999_000);
    expect(entries[0].estimatedCostSEK).toBeLessThan(45_001_000);
  });

  test("parses a plain thousands-dot budget correctly (e.g. 450.000)", () => {
    const csv = `Titel,Budget\nTestprojekt,450.000`;
    const { entries } = parseProjectsCsv(csv);
    expect(entries[0].estimatedCostSEK).toBe(450000);
  });

  test("skips rows without a title but keeps parsing the rest", () => {
    const csv = `Titel,Budget\n,1000\nRiktigt projekt,2000`;
    const { entries, errors } = parseProjectsCsv(csv);
    expect(entries).toHaveLength(1);
    expect(entries[0].title_sv).toBe("Riktigt projekt");
    expect(errors.some((e) => e.includes("saknar titel"))).toBe(true);
  });

  test("generates unique ids within a single import even for duplicate titles", () => {
    const csv = `Titel,Budget\nSamma namn,1000\nSamma namn,2000`;
    const { entries } = parseProjectsCsv(csv);
    expect(entries).toHaveLength(2);
    expect(entries[0].id).not.toBe(entries[1].id);
  });

  test("re-importing the same CSV does not collide with previously imported ids", () => {
    const csv = `Titel,Budget\nSolceller på skolor,1000`;
    const first = parseProjectsCsv(csv);
    expect(first.entries).toHaveLength(1);

    // Simulate the real flow: the second import is told about every id
    // already in the project bank (this is what useProjectBank/
    // CsvImportPanel now pass through).
    const existingIds = first.entries.map((e) => e.id);
    const second = parseProjectsCsv(csv, existingIds);
    expect(second.entries).toHaveLength(1);
    expect(second.entries[0].id).not.toBe(first.entries[0].id);
  });
});

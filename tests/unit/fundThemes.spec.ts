import { test, expect } from "@playwright/test";
import { ALL_FUND_THEMES, callThemes, themesFromCsvTema } from "../../lib/data/fundThemes";
import { fundingPrograms } from "../../lib/data/fundingPrograms";
import { findCall } from "../../lib/data/fundingCalls";

test.describe("fund themes (eufonder.se grouping)", () => {
  test("has the 13 eufonder.se themes and every programme belongs to at least one", () => {
    expect(ALL_FUND_THEMES).toHaveLength(13);
    for (const program of fundingPrograms) {
      expect(program.themes.length, program.id).toBeGreaterThan(0);
      for (const theme of program.themes) expect(ALL_FUND_THEMES).toContain(theme);
    }
  });

  test("a call inherits its programme's themes unless it sets its own", () => {
    // LIFE's call sets no themes of its own.
    expect(callThemes(findCall("life-2027-climate-schools")!)).toEqual(["miljo-klimat"]);
    // CEF finances four themes, but its charging call is only about transport.
    expect(callThemes(findCall("cef-2028-charging-infra")!)).toEqual(["transport-resande"]);
  });

  test("maps the utlysningar.csv Tema column, leaving unknown values to the programme", () => {
    expect(themesFromCsvTema("Klimat och miljö")).toEqual(["miljo-klimat"]);
    expect(themesFromCsvTema(" Mobilitet och transport ")).toEqual(["transport-resande"]);
    expect(themesFromCsvTema("Något annat")).toBeUndefined();
  });
});

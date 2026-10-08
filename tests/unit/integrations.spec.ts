import { test, expect } from "@playwright/test";
import { parseCsv, parseCsvRecords } from "../../lib/integrations/core/csv";
import { convert, parseEurSekRates } from "../../lib/integrations/core/currency";
import {
  clean,
  normaliseCountry,
  normaliseOrganisationNumber,
  parseAmount,
  parseDate,
  parseRate,
  stripHtml,
} from "../../lib/integrations/core/values";
import { cordisOrganisationType, cordisRole, isCitiesMission, transformCordis } from "../../lib/integrations/cordis/transform";
import { transformEsf } from "../../lib/integrations/esf/transform";
import { keepRole, transformKeepEu } from "../../lib/integrations/keep-eu/transform";
import { diarienummerFromLocalId, transformKohesio } from "../../lib/integrations/kohesio/transform";

// Import transforms for Kohesio, keep.eu, CORDIS and ESF-rådet's
// projektbank (scripts/import/): the value parsing they share, and each
// source's mapping of dates, empty values, amounts and roles.

test.describe("values", () => {
  test("empty markers become null", () => {
    for (const v of ["", "  ", "N.a.", "n/a", "NA", "None", null, undefined]) {
      expect(clean(v)).toBeNull();
    }
    expect(clean("  Uppsala kommun ")).toBe("Uppsala kommun");
  });

  test("dates in every source format", () => {
    expect(parseDate("16/03/2020")).toBe("2020-03-16");
    expect(parseDate("2024-04-01 00:00:00")).toBe("2024-04-01");
    expect(parseDate("2023-03-31")).toBe("2023-03-31");
    expect(parseDate(new Date(Date.UTC(2027, 2, 31)))).toBe("2027-03-31");
    expect(parseDate("")).toBeNull();
    expect(parseDate("31/02/2020")).toBeNull();
    expect(parseDate("soon")).toBeNull();
  });

  test("amounts with spaces, decimal comma or decimal point", () => {
    expect(parseAmount("75 354 267")).toBe(75354267);
    expect(parseAmount("9791713")).toBe(9791713);
    expect(parseAmount("2073781,25")).toBe(2073781.25);
    expect(parseAmount("56868.983")).toBe(56868.983);
    expect(parseAmount("1.234.567,5")).toBe(1234567.5);
    expect(parseAmount(1879493.6)).toBe(1879493.6);
    expect(parseAmount("75 354 267")).toBe(75354267);
    expect(parseAmount("")).toBeNull();
    expect(parseAmount("N.a.")).toBeNull();
    expect(parseAmount("abc")).toBeNull();
  });

  test("rates as percent or fraction", () => {
    expect(parseRate("40%")).toBe(0.4);
    expect(parseRate("50.0")).toBe(0.5);
    expect(parseRate(0.8)).toBe(0.8);
    expect(parseRate("")).toBeNull();
  });

  test("organisationsnummer, VAT and country codes", () => {
    expect(normaliseOrganisationNumber("212000-3005")).toBe("2120003005");
    expect(normaliseOrganisationNumber("SE212000300501")).toBe("2120003005");
    expect(normaliseOrganisationNumber("162120003005")).toBe("2120003005");
    expect(normaliseOrganisationNumber("GB744495211")).toBeNull();
    expect(normaliseOrganisationNumber("EFI")).toBeNull();
    expect(normaliseCountry("UK")).toBe("GB");
    expect(normaliseCountry("EL")).toBe("GR");
    expect(normaliseCountry("Sverige")).toBe("SE");
  });

  test("HTML summaries become plain text", () => {
    expect(stripHtml('"<p>Projekt ISA &#8211; Insatser</p><p>för unga &amp; vuxna</p>"')).toBe(
      "Projekt ISA – Insatser\nför unga & vuxna",
    );
  });

  test("currency conversion uses the year's EUR/SEK rate", () => {
    const rates = parseEurSekRates("År,EUR/SEK,Källa\n2023,11.4765,x\n2024,11.4322,x\n");
    expect(convert({ amount: 1000, currency: "EUR" }, "SEK", 2023, rates)).toEqual({ amount: 11477, currency: "SEK" });
    expect(convert({ amount: 11432, currency: "SEK" }, "EUR", 2024, rates)).toEqual({ amount: 1000, currency: "EUR" });
    // Falls back to the nearest year in the table.
    expect(convert({ amount: 1000, currency: "EUR" }, "SEK", 2030, rates).amount).toBe(11432);
  });
});

test.describe("csv", () => {
  test("semicolon CSV with BOM, quotes and line breaks", () => {
    const rows = parseCsv('﻿"a";"b"\r\n"1;2";"rad\nett"\r\n"x";""\r\n', ";");
    expect(rows).toEqual([
      { a: "1;2", b: "rad\nett" },
      { a: "x", b: "" },
    ]);
  });

  test("tolerates CORDIS fields that open with a doubled quote", () => {
    const [, row] = parseCsvRecords('"id";"objective";"rcn"\n"1";""The action ""X"" works"";"9"\n', ";");
    expect(row).toEqual(["1", 'The action ""X"" works""', "9"]);
  });
});

test.describe("kohesio", () => {
  const row = {
    Operation_Unique_Identifier: "https://linkedopendata.eu/entity/Q7361953",
    Operation_Local_Identifier: "2021SE05SFPR001_23-017-S01",
    Operation_Name_English: "Gottsunda",
    Operation_Name_Programme_Language: "Gottsunda växer",
    Country: "Sweden",
    Operation_Start_Date: "04/09/2023",
    Operation_End_Date: "",
    Cofinancing_Rate: "40.0",
    Total_Eligible_Expenditure_amount: "337478.4",
    Total_Eligible_Expenditure_Currency: "EUR",
    Project_EU_Budget: "134991.36",
    Beneficiary_Unique_Identifier: "https://linkedopendata.eu/entity/Q2757713",
    Beneficiary_Name: "Uppsala kommun",
    Beneficiary_Local_Identifier: "2120003005",
    Fund_Code: "ESF+",
    Programme_Name: "ESF+",
    Programming_Period: "2021-2027",
  };

  test("maps one row to a project with its beneficiary as coordinator", () => {
    const { projects, organisations, partners } = transformKohesio([row]);
    expect(projects[0]).toMatchObject({
      id: "kohesio:Q7361953",
      title: "Gottsunda växer",
      programId: "esf",
      startDate: "2023-09-04",
      endDate: null,
      totalBudget: { amount: 337478.4, currency: "EUR" },
      euContribution: { amount: 134991.36, currency: "EUR" },
      coFinancingRate: 0.4,
      country: "SE",
      externalIds: { diarienummer: "23-017-S01" },
    });
    expect(organisations[0]).toMatchObject({
      id: "kohesio:Q2757713",
      organisationNumber: "2120003005",
      organisationType: null,
    });
    expect(partners[0]).toMatchObject({ role: "coordinator", sourceRole: "beneficiary" });
  });

  test("keeps every beneficiary name under its own source id", () => {
    const other = {
      ...row,
      Operation_Unique_Identifier: "Q1",
      Beneficiary_Unique_Identifier: "Q2",
      Beneficiary_Name: "Äldreförvaltningen, Uppsala kommun",
    };
    const { organisations } = transformKohesio([row, other]);
    expect(organisations.map((o) => o.name)).toEqual(["Uppsala kommun", "Äldreförvaltningen, Uppsala kommun"]);
    expect(organisations.every((o) => o.organisationNumber === "2120003005")).toBe(true);
  });

  test("diarienummer only from ESF+ style local ids", () => {
    expect(diarienummerFromLocalId("2021SE05SFPR001_22-002-S01")).toBe("22-002-S01");
    expect(diarienummerFromLocalId("2020/00114")).toBeNull();
  });
});

test.describe("keep.eu", () => {
  const project = {
    Period: "2014-2020",
    Programme: "2014 - 2020 INTERREG VB North Sea",
    "Project acronym": "COBEN",
    "Project name in English": "Community Benefits",
    "Project start": new Date(Date.UTC(2019, 0, 1)),
    "Project end": "N.a.",
    "Project's total budget / expenditure": 2349367.02,
    "Project's EU funding": 1879493.6,
    "Union co-financing rate": "80%",
  };
  const partner = (name: string, country: string, lead: string, pic: string | null = null) => ({
    Programme: project.Programme,
    "Project acronym": "COBEN",
    "Organisation in English": name,
    "Lead partner": lead,
    "Country code": country,
    "Participant Identification Code": pic,
    "Type of Organisation": "Local public authority",
    "ERDF contribution (2014-2020 only)": "119846",
  });

  test("lead partner is coordinator, the rest partners; country is the coordinator's", () => {
    const { projects, partners, organisations } = transformKeepEu(
      [project],
      [partner("University of Oldenburg", "DE", "Yes"), partner("Uppsala Municipality", "SE", "No", "951881080")],
    );
    expect(projects[0]).toMatchObject({ country: "DE", startDate: "2019-01-01", endDate: null, coFinancingRate: 0.8 });
    expect(partners.map((p) => p.role)).toEqual(["coordinator", "partner"]);
    expect(partners[1].euContribution).toEqual({ amount: 119846, currency: "EUR" });
    expect(organisations[1]).toMatchObject({ picNumber: "951881080", organisationType: "municipality" });
    expect(keepRole("No")).toBe("partner");
  });

  test("skips projects before 2014 and without a Swedish partner", () => {
    const result = transformKeepEu(
      [{ ...project, Period: "2007-2013" }, { ...project, "Project acronym": "X" }],
      [partner("A", "SE", "Yes"), { ...partner("B", "DK", "Yes"), "Project acronym": "X" }],
    );
    expect(result.projects).toHaveLength(0);
    expect(result.skipped["period före 2014"]).toBe(1);
    expect(result.skipped["ingen svensk partner"]).toBe(1);
  });
});

test.describe("cordis", () => {
  const project = (id: string, topics = "HORIZON-CL5-2021-D2-01-11") => ({
    id,
    acronym: `P${id}`,
    status: "SIGNED",
    title: "Title",
    startDate: "2022-09-01",
    endDate: "2025-08-31",
    totalCost: "2073781,25",
    ecMaxContribution: "1000000",
    topics,
    objective: '"Text ""quoted"""',
    legalBasis: "HORIZON.2.5",
    fundingScheme: "HORIZON-RIA",
  });
  const org = (projectID: string, pic: string, country: string, role: string, extra = {}) => ({
    projectID,
    organisationID: pic,
    name: `Org ${pic}`,
    country,
    role,
    activityType: "PUB",
    SME: "false",
    vatNumber: "",
    ecContribution: "299250.5",
    totalCost: "299250,5",
    ...extra,
  });

  test("selects Swedish and climate-neutral-cities projects and maps roles", () => {
    const { projects, partners, organisations } = transformCordis(
      "HORIZON",
      [project("1"), project("2"), project("3", "HORIZON-MISS-2021-CIT-02-01")],
      [
        org("1", "999905974", "UK", "coordinator", { activityType: "HES" }),
        org("1", "951881080", "SE", "associatedPartner", { vatNumber: "SE212000300501" }),
        org("2", "999905974", "UK", "coordinator"),
        org("3", "912743326", "EL", "coordinator", { activityType: "PRC", SME: "true" }),
        org("3", "912743327", "ES", "thirdParty"),
      ],
    );
    expect(projects.map((p) => p.id)).toEqual(["cordis:1", "cordis:3"]);
    expect(projects[0]).toMatchObject({
      country: "GB",
      status: "signed",
      totalBudget: { amount: 2073781.25, currency: "EUR" },
      description: 'Text "quoted"',
      period: "2021-2027",
    });
    expect(projects[1].tags).toContain("eu-mission:climate-neutral-smart-cities");
    expect(partners.map((p) => p.role)).toEqual(["coordinator", "associated-partner", "coordinator", "partner"]);
    const uppsala = organisations.find((o) => o.picNumber === "951881080");
    expect(uppsala).toMatchObject({ organisationNumber: "2120003005", organisationType: null, sourceOrganisationType: "PUB" });
    expect(organisations.find((o) => o.picNumber === "999905974")?.organisationType).toBe("university");
    expect(organisations.find((o) => o.picNumber === "912743326")?.organisationType).toBe("sme");
  });

  test("role and type tables", () => {
    expect(cordisRole("participant")).toBe("partner");
    expect(cordisRole("internationalPartner")).toBe("partner");
    expect(cordisRole("associatedPartner")).toBe("associated-partner");
    expect(cordisRole("")).toBeNull();
    expect(cordisOrganisationType("REC", "false")).toBe("research-institute");
    expect(cordisOrganisationType("PRC", "false")).toBe("large-enterprise");
    expect(cordisOrganisationType("OTH", "true")).toBeNull();
    expect(isCitiesMission("HORIZON-MISS-2023-CLIMA-CITIES-01-01")).toBe(true);
    expect(isCitiesMission("HORIZON-MISS-2025-06-CIT-CANCER-01")).toBe(true);
    expect(isCitiesMission("HORIZON-MISS-2022-CLIMA-01-01")).toBe(false);
  });
});

test.describe("esf", () => {
  const esfRow = (dnr: string, name: string, start: string) => ({
    "Diarienummer / Operation ID": dnr,
    "Stödmottagare / Beneficiary": "UPPSALA KOMMUN",
    "Projektägare organisationsnummer / Beneficiary ID": "2120003005",
    "Projektägare ort / Beneficiary city": "UPPSALA",
    "Stödmottagarens land / Beneficiary country": "Sverige",
    "Namn på insatsen / Operation Name": name,
    "Total projektbudget / Total budget SEK": "4 973 906",
    "Unionens medfinansieringsgrad / Union co-financing rate": "90%",
    "EU-stöd i SEK / EU contribution SEK": "",
    "Sammanfattning / Summary": "<p>Text</p>",
    "Startdatum / Start date": start,
    "Slutdatum / End date": "2028-03-31",
    "EU-fond / EU fund": "ESF+",
    "Program CCI / Program CCI": "2021SE05SFPR",
  });
  const kohesio = transformKohesio([
    {
      Operation_Unique_Identifier: "Q1",
      Operation_Local_Identifier: "2021SE05SFPR001_23-017-S01",
      Operation_Name_Programme_Language: "Gottsunda",
      Country: "Sweden",
      Operation_Start_Date: "04/09/2023",
      Total_Eligible_Expenditure_Currency: "EUR",
      Beneficiary_Unique_Identifier: "Q9",
      Beneficiary_Name: "Uppsala kommun",
      Beneficiary_Local_Identifier: "2120003005",
    },
    {
      Operation_Unique_Identifier: "Q2",
      Operation_Local_Identifier: "",
      Operation_Name_Programme_Language: "Fast Care",
      Country: "Sweden",
      Operation_Start_Date: "02/10/2023",
      Total_Eligible_Expenditure_Currency: "EUR",
      Beneficiary_Unique_Identifier: "Q9",
      Beneficiary_Name: "Uppsala kommun",
      Beneficiary_Local_Identifier: "2120003005",
    },
  ]);

  test("merges into Kohesio by diarienummer, then by orgnr + name + start", () => {
    const result = transformEsf(
      [
        esfRow("23-017-S01", "Gottsunda", "2023-09-04"),
        esfRow("23-043-S39", "Fast care", "2023-10-02"),
        esfRow("25-031-S02", "Allaktivitetshus", "2026-09-04"),
      ],
      kohesio,
    );
    expect(result.matches).toEqual([
      { diarienummer: "23-017-S01", kohesioProjectId: "kohesio:Q1", matchedOn: "diarienummer" },
      { diarienummer: "23-043-S39", kohesioProjectId: "kohesio:Q2", matchedOn: "organisationsnummer+namn+startdatum" },
    ]);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]).toMatchObject({
      id: "esf:25-031-S02",
      totalBudget: { amount: 4973906, currency: "SEK" },
      euContribution: null,
      coFinancingRate: 0.9,
      country: "SE",
      description: "Text",
      period: "2021-2027",
    });
    expect(result.partners[0]).toMatchObject({ role: "coordinator", organisationId: "esf:orgnr-2120003005" });
  });
});

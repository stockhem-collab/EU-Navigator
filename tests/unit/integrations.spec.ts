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
import { ftsProgramme, transformFts } from "../../lib/integrations/fts/transform";
import { MunicipalRegister, SkolverketRegister } from "../../lib/integrations/erasmus/municipal";
import { ErasmusRow, transformErasmus } from "../../lib/integrations/erasmus/transform";
import { keepRole, transformKeepEu } from "../../lib/integrations/keep-eu/transform";
import { diarienummerFromLocalId, transformKohesio } from "../../lib/integrations/kohesio/transform";
import { transformVinnova, VinnovaProject } from "../../lib/integrations/vinnova/transform";
import { findVinnovaProjects } from "../../lib/integrations/municipality/vinnova";
import { lidingoMatch, uppsalaMatch } from "../../lib/data/municipalities";
import type { GeneratedDataset } from "../../lib/integrations/core/types";

// Import transforms for Kohesio, keep.eu, CORDIS, ESF-rådet's
// projektbank, the EU Financial Transparency System and Vinnova (scripts/import/): the value parsing they share, and each
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

test.describe("fts", () => {
  const ftsRow = (over: Record<string, unknown>) => ({
    Year: 2022,
    "Reference of the Legal Commitment (LC)": "SI2.123456",
    "Name of beneficiary": "MALMO KOMMUN*CITY OF MALMO",
    "VAT number of beneficiary": "SE212000112401",
    Coordinator: "Yes",
    City: "MALMO",
    "Beneficiary country": "Sweden",
    "Beneficiary’s contracted amount (EUR)": 1000,
    "Project ID": "N/A - Not applicable",
    "Project Acronym": "N/A - Not applicable",
    "Subject of grant or contract": "LIFE20 CCA/SE/001234 - COASTAL ADAPTATION",
    "Responsible department": "CINEA - European Climate, Infrastructure and Environment Executive Agency",
    "Programme name": "2.0.4 - Fisheries governance, international agreements and integrated maritime policy",
    "Project start date": new Date(Date.UTC(2022, 8, 1)),
    "Project end date": new Date(Date.UTC(2026, 7, 31)),
    "Type of contract*": "Action Grant",
    ...over,
  });

  test("one project per legal commitment; a beneficiary's budget lines are summed", () => {
    const result = transformFts([
      ftsRow({}),
      ftsRow({ "Beneficiary’s contracted amount (EUR)": 500, Year: 2023 }),
      ftsRow({ "Name of beneficiary": "HELSINGBORGS KOMMUN*HELSINGBORGS STAD", "VAT number of beneficiary": "SE212000115701", Coordinator: "No", "Beneficiary’s contracted amount (EUR)": 200 }),
    ]);
    expect(result.projects).toHaveLength(1);
    expect(result.projects[0]).toMatchObject({
      id: "fts:SI2.123456",
      sourceSystem: "fts",
      programId: "life",
      period: "2021-2027",
      acronym: null,
      startDate: "2022-09-01",
      euContribution: { amount: 1700, currency: "EUR" },
    });
    expect(result.partners).toHaveLength(2);
    expect(result.partners[0]).toMatchObject({ role: "coordinator", euContribution: { amount: 1500, currency: "EUR" } });
    expect(result.partners[1]).toMatchObject({ role: "partner" });
    const malmo = result.organisations.find((o) => o.name === "MALMO KOMMUN")!;
    expect(malmo).toMatchObject({ vatNumber: "SE212000112401", organisationNumber: "2120001124" });
  });

  test("leaves out Horizon, procurement and beneficiaries outside Sweden", () => {
    const result = transformFts([
      ftsRow({ "Programme name": "1.0.11 - Horizon Europe" }),
      ftsRow({ "Type of contract*": "Advisory: Studies" }),
      ftsRow({ "Beneficiary country": "Denmark" }),
    ]);
    expect(result.projects).toHaveLength(0);
    expect(result.skipped).toEqual({
      "Horisont/Euratom (finns i CORDIS)": 1,
      "inte ett projektbidrag (upphandling, pris, ersättning)": 1,
      "stödmottagare utanför Sverige": 1,
    });
  });

  test("leaves out Erasmus+, which comes from the Erasmus+ project lists", () => {
    const result = transformFts([ftsRow({ "Programme name": "2.2.32 - Erasmus+" })]);
    expect(result.projects).toHaveLength(0);
    expect(result.skipped).toEqual({ "Erasmus+ (finns i Erasmus+-projektlistorna)": 1 });
  });

  test("programme from the budget heading and the subject", () => {
    expect(ftsProgramme("1.0.221 - Connecting Europe Facility (CEF) - Transport", "2019-SE-TM-0001")).toEqual({ programId: "cef", programmeName: "Connecting Europe Facility (CEF)" });
    expect(ftsProgramme("1.1.83 - Information and Communications Technology (ICT)", "WIFI4EU INITIATIVE FOR THE FINANCING")).toEqual({ programId: null, programmeName: "WiFi4EU" });
    expect(ftsProgramme("3.0.SPEC - Actions financed under the prerogatives of the Commission", "STO/ GÖTEBORGS STAD - EUROPÉ DIRECT INFORMATION CENTRE, 2019 GRANT").programmeName).toBe("Europe Direct");
    expect(ftsProgramme("2.2.352 - Rights and Values", "TOWN TWINNING").programId).toBe("cerv");
    expect(ftsProgramme("3.0.7 - Culture and audiovisual media", "NETWORKS OF TWINNED TOWNS : SUSTAINABLE AGEING")).toEqual({ programId: null, programmeName: "Europa för medborgarna" });
    expect(ftsProgramme("1.1.82 - Transport", "BALTIC LINK").programId).toBe("cef");
  });
});

test.describe("erasmus", () => {
  const register = new MunicipalRegister({
    fetchedAt: "2026-10-19T00:00:00Z",
    units: [
      { code: "1", name: "Lundellska skolan" },
      { code: "2", name: "Katedralskolan" },
      { code: "3", name: "Katedralskolan 1" },
      { code: "4", name: "Dragonskolan GY1" },
      { code: "5", name: "Kunskapsskolan Uppsala" },
      { code: "6", name: "Habo skola" },
    ],
    municipalities: [
      { orgNumber: "2120003005", municipalityCode: "0380", name: "Uppsala", unitCodes: ["1", "2"] },
      { orgNumber: "2120000449", municipalityCode: "0580", name: "Linköping", unitCodes: ["3"] },
      { orgNumber: "2120002763", municipalityCode: "2480", name: "Umeå", unitCodes: ["4"] },
      { orgNumber: "2120001850", municipalityCode: "0643", name: "Habo", unitCodes: ["6"] },
      { orgNumber: "2120000209", municipalityCode: "0305", name: "Håbo", unitCodes: [] },
      { orgNumber: "2120001215", municipalityCode: "1480", name: "Göteborg", unitCodes: [] },
    ],
  } satisfies SkolverketRegister);
  const school = "School/Institute/Educational centre – General education (secondary level)";
  const match = (name: string, address = "", type = school) => register.match({ name, type, address })?.municipality ?? null;

  test("municipality from its name, also in English and without accents", () => {
    expect(match("Uppsala kommun Fritid", "", "Local Public body")).toBe("Uppsala");
    expect(match("City of Gothenburg", "", "Other")).toBe("Göteborg");
    expect(match("UMEA KOMMUN", "", "")).toBe("Umeå");
    expect(match("Habo Kommun", "", "")).toBe("Habo");
    expect(match("Håbo kommun", "", "")).toBe("Håbo");
    expect(match("Region Uppsala", "", "Regional Public body")).toBeNull();
    expect(match("Uppsala kommuns bostadsbolag AB", "", "Other")).toBeNull();
  });

  test("schools through Skolverket's register, checked against the address town", () => {
    expect(match("Lundellska skolan", "Kungsgatan 1, 753 21, Uppsala")).toBe("Uppsala");
    expect(match("Lundellska skolan")).toBe("Uppsala");
    expect(match("Katedralskolan", "Platengatan 20, 582 20, LINKÖPING")).toBe("Linköping");
    expect(match("Katedralskolan Uppsala", "Skolgatan 2, 753 75, Uppsala")).toBe("Uppsala");
    expect(match("Katedralskolan")).toBeNull();
    expect(match("Dragonskolan", "Dragongatan 1, 903 22, Umeå")).toBe("Umeå");
    expect(match("Lundellska skolan", "Storgatan 1, 582 20, Linköping")).toBeNull();
    expect(match("Kunskapsskolan Uppsala", "Gatan 1, 753 20, Uppsala")).toBeNull();
    expect(match("Lundellska skolan", "", "Small and medium sized enterprise")).toBeNull();
  });

  const row = (over: Partial<ErasmusRow>): ErasmusRow => ({
    "Key Action": "Learning Mobility of Individuals",
    "Action Type": "School education staff mobility",
    "Call year": "2019",
    "Project Identifier": "2019-1-SE01-KA101-060000",
    "Project Title": "Teachers abroad",
    "Project Status": "finalized",
    "EU Grant award in euros (This amount represents the grant awarded after the selection stage and is indicative.)": "25000.00",
    "Results Platform Project Card": "https://erasmus-plus.ec.europa.eu/projects/search/details/2019-1-SE01-KA101-060000",
    "Coordinating organisation name": "Lundellska skolan",
    "Coordinating organisation type": school,
    "Coordinator's address": "Kungsgatan 1, 753 21, Uppsala",
    "Coordinator's country": "SE",
    "Partner 1 name": "Liceo Roma",
    "Partner 1 organisation type": school,
    "Partner 1 address": "Via 1, 00100, Roma",
    "Partner 1 country": "IT",
    "Partner 2 name": "",
    "Partner 2 organisation type": "",
    "Partner 2 address": "",
    "Partner 2 country": "",
    ...over,
  });

  test("Swedish participants only; the grant goes on the coordinator", () => {
    const result = transformErasmus(
      [
        row({}),
        row({
          "Project Identifier": "2022-1-IT02-KA220-SCH-000001",
          "Call year": "2022",
          "Coordinating organisation name": "Liceo Roma",
          "Coordinator's address": "Via 1, 00100, Roma",
          "Coordinator's country": "IT",
          "Partner 1 name": "Uppsala kommun",
          "Partner 1 organisation type": "Local Public body",
          "Partner 1 address": "Stationsgatan 12, 753 75, Uppsala",
          "Partner 1 country": "SE",
        }),
      ],
      register,
    );
    expect(result.projects.map((p) => p.id)).toEqual(["erasmus:2019-1-SE01-KA101-060000", "erasmus:2022-1-IT02-KA220-SCH-000001"]);
    expect(result.projects[0]).toMatchObject({
      sourceSystem: "erasmus",
      programId: "erasmus",
      period: "2014-2020",
      startDate: "2019-01-01",
      status: "closed",
      euContribution: { amount: 25000, currency: "EUR" },
    });
    expect(result.partners).toHaveLength(2);
    expect(result.partners[0]).toMatchObject({ role: "coordinator", euContribution: { amount: 25000, currency: "EUR" } });
    expect(result.partners[1]).toMatchObject({ role: "partner", euContribution: null });
    const lundellska = result.organisations.find((o) => o.name === "Lundellska skolan")!;
    expect(lundellska).toMatchObject({ city: "Uppsala", organisationNumber: "2120003005" });
    expect(lundellska.organisationNumberSource).toContain("Skolverket");
  });

  test("leaves out accreditations, projects without Swedes and repeats", () => {
    const result = transformErasmus(
      [
        row({ "Action Type": "Erasmus accreditation in school education" }),
        row({ "Coordinator's country": "NO" }),
        row({}),
        row({}),
      ],
      register,
    );
    expect(result.projects).toHaveLength(1);
    expect(result.skipped).toEqual({
      "ackreditering (inget bidrag)": 1,
      "ingen svensk deltagare": 1,
      "samma projekt i flera filer": 1,
    });
  });
});

test.describe("vinnova", () => {
  const row = (over: Partial<VinnovaProject>): VinnovaProject => ({
    Diarienummer: "2024-01000",
    Ärenderubrik: "Rätt till insyn ",
    ÄrenderubrikEngelska: "x",
    DiarienummerProgram: "2023-00001",
    MalSvenska: "Ett verktyg som maskerar allmänna handlingar.",
    ResultatSvenska: "",
    MalEngelska: "",
    ResultatEngelska: "",
    Projektreferat: "planerat",
    BeviljatBidrag: 1960540,
    ProjektStart: "2024-06-03T00:00:00",
    ProjektSlut: "2025-11-30T00:00:00",
    KoordinatorOrg: "Lidingö kommun",
    KoordinatorArb: "Lidingö stad",
    Status: "Avslutat",
    ...over,
  });
  const programs = [{ Diarienummer: "2023-00001", Titel: "Innovationer i offentlig sektor" }];

  test("one project per diarienummer, the coordinator as its only organisation, the grant in kronor", () => {
    const result = transformVinnova(
      [
        row({}),
        row({ Diarienummer: "2024-00708", Ärenderubrik: "Framtidens mobilitet", KoordinatorOrg: "LIDINGÖ KOMMUN", BeviljatBidrag: 700000, Status: "Beslutat" }),
        row({ Diarienummer: "2010-01996", ProjektStart: "2010-12-01T00:00:00", ProjektSlut: "2011-06-30T00:00:00" }),
        row({}),
      ],
      programs,
    );
    expect(result.skipped).toEqual({ "slutade före 2014": 1, dubblett: 1 });
    expect(result.projects).toHaveLength(2);
    const p = result.projects[0];
    expect(p).toMatchObject({
      id: "vinnova:2024-01000",
      sourceSystem: "vinnova",
      programId: null,
      programmeName: "Vinnova – Innovationer i offentlig sektor",
      period: "2021-2027",
      title: "Rätt till insyn",
      titleEn: null,
      startDate: "2024-06-03",
      endDate: "2025-11-30",
      euContribution: { amount: 1960540, currency: "SEK" },
      status: "closed",
      country: "SE",
    });
    expect(result.projects[1].status).toBe("ongoing");
    // Same organisation whatever the case.
    expect(result.organisations).toHaveLength(1);
    expect(result.organisations[0].organisationType).toBeNull();
    expect(result.partners.map((pp) => [pp.role, pp.sourceName])).toEqual([
      ["coordinator", "Lidingö kommun (Lidingö stad)"],
      ["coordinator", "LIDINGÖ KOMMUN (Lidingö stad)"],
    ]);
  });

  test("a municipality's projects are those it coordinated under its exact name", () => {
    const result = transformVinnova(
      [
        row({}),
        row({ Diarienummer: "2022-03264", KoordinatorOrg: "Uppsala kommun Arenor & Fastigheter AB" }),
        row({ Diarienummer: "2022-01163", KoordinatorOrg: "Uppsala Kommun" }),
        row({ Diarienummer: "2023-00002", KoordinatorOrg: "Gaia Arkitektur AB" }),
      ],
      programs,
    );
    const ds: GeneratedDataset = { source: "vinnova", generatedAt: "", ...result };
    expect(findVinnovaProjects(ds, lidingoMatch).map((p) => p.diarienummer)).toEqual(["2024-01000"]);
    expect(findVinnovaProjects(ds, uppsalaMatch).map((p) => p.diarienummer)).toEqual(["2022-01163"]);
    expect(findVinnovaProjects(undefined, uppsalaMatch)).toEqual([]);
  });
});

// Municipalities whose EU-funded projects are looked up in the generated
// source data (scripts/import/uppsala-history.ts and peers.ts). A project is
// a sure hit only on organisationsnummer, momsnummer or PIC; names only make
// a project a candidate for manual review (lib/integrations/municipality).
//
// Each demo municipality's registry numbers are read from its preset
// (orgPresets.ts), never copied.
// Peer identifiers come from the generated source data (checked 2026-10-08):
// organisationsnummer from Kohesio's Beneficiary_Local_Identifier, PIC from
// CORDIS organization.csv or keep.eu partners, and only where that same
// record also carries the municipality's organisationsnummer. Kommunkod, län
// and NUTS 3 follow SCB's municipality list and Eurostat's NUTS 2021.

import type { DemoProfileId } from "./demoProfiles";
import { lidingoPreset, uppsalaPreset } from "./orgPresets";

export interface MunicipalityIdentity {
  name: string;
  /** "212000-3005" style. */
  orgNumber: string;
  vatNumber: string | null;
  /** The municipality's own PIC; null when no source record ties one to the
   * organisationsnummer. */
  pic: string | null;
  /** Where the PIC was read, for the reports. */
  picSource: string | null;
  /** Units with their own PIC, counted as the municipality. */
  unitPics: { name: string; pic: string }[];
  kommunkod: string;
  lan: string;
  /** NUTS 3 code. */
  nuts: string;
  /** Name written as the municipality, in any spelling the sources use.
   * Matched as whole words; any of these plus a municipal word ("kommun",
   * "stad", "förvaltningen", "City of" …) makes an organisation a candidate. */
  placeNames: string[];
  /** Exact organisation names seen in the sources (compared without case
   * or punctuation). Always candidates, never sure hits. */
  nameVariants: string[];
}

export interface CompanyGroup {
  name: string;
  orgNumber: string;
  /** Subsidiaries by name. Organisationsnummer not filled in: not checked
   * against Bolagsverket. */
  subsidiaries: string[];
}

export interface MunicipalityMatchConfig extends MunicipalityIdentity {
  /** Other organisations sharing the place name that must never be counted
   * as the municipality, by name pattern (case-insensitive). */
  excluded: { name: string; pattern: RegExp }[];
  /** Municipal companies: listed as candidates, counted only on request. */
  companies: CompanyGroup | null;
}

/** Organisations that share a city's name in every municipality's data. */
export const COMMON_EXCLUSIONS: { name: string; pattern: RegExp }[] = [
  { name: "Universitet och högskolor", pattern: /universitet|university|högskola|hogskola/i },
  { name: "Regioner och landsting", pattern: /\bregion|landsting|county council/i },
  { name: "Länsstyrelser", pattern: /länsstyrelse|lansstyrelse|county administrative board/i },
  { name: "Kommunalförbund och samordningsförbund", pattern: /kommunalförbund|kommunalforbund|samordningsförbund/i },
  { name: "Stadsmissioner och kyrkor", pattern: /stadsmission|kyrk/i },
];

export const uppsalaMatch: MunicipalityMatchConfig = {
  name: uppsalaPreset.organisationName,
  orgNumber: uppsalaPreset.orgNumber,
  vatNumber: uppsalaPreset.vatNumber,
  pic: uppsalaPreset.pic,
  picSource: "Uppsala kommuns lista från EU Funding & Tenders Portal (orgPresets.ts)",
  unitPics: uppsalaPreset.units,
  kommunkod: "0380",
  lan: "Uppsala län",
  nuts: "SE121",
  placeNames: ["Uppsala"],
  nameVariants: [
    "Uppsala kommun",
    "UPPSALA KOMMUN",
    "Uppsala Municipality",
    "Municipality of Uppsala",
    "City of Uppsala",
    "Äldreförvaltningen, Uppsala kommun",
  ],
  excluded: [
    { name: "Uppsala universitet", pattern: /uppsala univ/i },
    { name: "Region Uppsala", pattern: /region uppsala|uppsala läns landsting/i },
    { name: "SLU", pattern: /\bSLU\b|lantbruksuniversitet|agricultural sciences/i },
    { name: "Länsstyrelsen i Uppsala län", pattern: /länsstyrelsen i uppsala/i },
    ...COMMON_EXCLUSIONS,
  ],
  companies: {
    name: "Uppsala Stadshus AB",
    orgNumber: "556500-0642",
    subsidiaries: [
      "Uppsalahem",
      "Uppsala Vatten och Avfall",
      "Uppsala Parkerings",
      "Uppsala kommun Skolfastigheter",
      "Uppsala kommun Sport- och rekreationsfastigheter",
      "Uppsala Konsert & Kongress",
      "Uppsala Stadsteater",
      "Fyrishov",
    ],
  },
};

function peer(
  identity: Omit<MunicipalityIdentity, "vatNumber" | "unitPics" | "nameVariants"> &
    Partial<Pick<MunicipalityIdentity, "nameVariants">>,
): MunicipalityMatchConfig {
  const digits = identity.orgNumber.replace("-", "");
  return {
    vatNumber: `SE${digits}01`,
    unitPics: [],
    nameVariants: [],
    excluded: COMMON_EXCLUSIONS,
    companies: null,
    ...identity,
  };
}

/** Uppsala's comparison group: the ten largest municipalities. */
export const peerMunicipalities: MunicipalityMatchConfig[] = [
  peer({
    name: "Stockholms stad",
    orgNumber: "212000-0142",
    pic: "996559183",
    picSource: "CORDIS organization.csv (STOCKHOLMS STAD, VAT SE212000014201)",
    kommunkod: "0180",
    lan: "Stockholms län",
    nuts: "SE110",
    placeNames: ["Stockholm", "Stockholms"],
  }),
  peer({
    name: "Göteborgs stad",
    orgNumber: "212000-1355",
    pic: "997186676",
    picSource: "CORDIS organization.csv (GOTEBORGS KOMMUN, VAT SE212000135501)",
    kommunkod: "1480",
    lan: "Västra Götalands län",
    nuts: "SE232",
    placeNames: ["Göteborg", "Göteborgs", "Goteborg", "Goteborgs", "Gothenburg"],
  }),
  peer({
    name: "Malmö stad",
    orgNumber: "212000-1124",
    pic: "993964045",
    picSource: "CORDIS organization.csv (MALMO KOMMUN, VAT SE212000112401)",
    kommunkod: "1280",
    lan: "Skåne län",
    nuts: "SE224",
    placeNames: ["Malmö", "Malmo"],
  }),
  peer({
    name: "Linköpings kommun",
    orgNumber: "212000-0449",
    pic: null,
    picSource: null,
    kommunkod: "0580",
    lan: "Östergötlands län",
    nuts: "SE123",
    placeNames: ["Linköping", "Linköpings", "Linkoping", "Linkopings"],
  }),
  peer({
    name: "Västerås stad",
    orgNumber: "212000-2080",
    pic: "968814952",
    picSource: "keep.eu partners (Västerås municipality, organisationsnummer 2120002080)",
    kommunkod: "1980",
    lan: "Västmanlands län",
    nuts: "SE125",
    placeNames: ["Västerås", "Vasteras"],
  }),
  peer({
    name: "Örebro kommun",
    orgNumber: "212000-1967",
    pic: null,
    picSource: null,
    kommunkod: "1880",
    lan: "Örebro län",
    nuts: "SE124",
    placeNames: ["Örebro", "Orebro"],
  }),
  peer({
    name: "Helsingborgs stad",
    orgNumber: "212000-1157",
    pic: "934666102",
    picSource: "CORDIS organization.csv (HELSINGBORGS KOMMUN, VAT SE212000115701)",
    kommunkod: "1283",
    lan: "Skåne län",
    nuts: "SE224",
    placeNames: ["Helsingborg", "Helsingborgs"],
  }),
  peer({
    name: "Jönköpings kommun",
    orgNumber: "212000-0530",
    // CORDIS has JONKOPINGS KOMMUN under PIC 914376030 but without an
    // organisationsnummer or VAT number, so it is not used for sure hits.
    pic: null,
    picSource: null,
    kommunkod: "0680",
    lan: "Jönköpings län",
    nuts: "SE211",
    placeNames: ["Jönköping", "Jönköpings", "Jonkoping", "Jonkopings"],
  }),
  peer({
    name: "Norrköpings kommun",
    orgNumber: "212000-0456",
    pic: null,
    picSource: null,
    kommunkod: "0581",
    lan: "Östergötlands län",
    nuts: "SE123",
    placeNames: ["Norrköping", "Norrköpings", "Norrkoping", "Norrkopings"],
  }),
  peer({
    name: "Umeå kommun",
    orgNumber: "212000-2627",
    pic: "999651446",
    picSource: "CORDIS organization.csv (UMEA KOMMUN, VAT SE212000262701)",
    kommunkod: "2480",
    lan: "Västerbottens län",
    nuts: "SE331",
    placeNames: ["Umeå", "Umea"],
  }),
];

export const lidingoMatch: MunicipalityMatchConfig = {
  name: lidingoPreset.organisationName,
  orgNumber: lidingoPreset.orgNumber,
  vatNumber: lidingoPreset.vatNumber,
  pic: lidingoPreset.pic || null,
  picSource: null,
  unitPics: lidingoPreset.units,
  kommunkod: "0186",
  lan: "Stockholms län",
  nuts: "SE110",
  placeNames: ["Lidingö", "Lidingo"],
  nameVariants: ["Lidingö stad", "Lidingö kommun", "LIDINGÖ KOMMUN", "City of Lidingö", "City of Lidingo", "Lidingö Municipality"],
  excluded: COMMON_EXCLUSIONS,
  companies: null,
};

/** Lidingö's comparison group: neighbouring municipalities in Stockholm
 * county of similar character, plus the three in the county with the most
 * EU projects of their own in the sources (Södertälje, Järfälla, Botkyrka),
 * since the neighbours have next to none. Organisationsnummer checked in
 * VIES 2026-10-16; no source record ties a PIC to them. */
export const lidingoPeers: MunicipalityMatchConfig[] = [
  { name: "Danderyds kommun", orgNumber: "212000-0126", kommunkod: "0162", placeNames: ["Danderyd", "Danderyds"] },
  { name: "Täby kommun", orgNumber: "212000-0118", kommunkod: "0160", placeNames: ["Täby", "Taby"] },
  { name: "Nacka kommun", orgNumber: "212000-0167", kommunkod: "0182", placeNames: ["Nacka"] },
  { name: "Solna stad", orgNumber: "212000-0183", kommunkod: "0184", placeNames: ["Solna"] },
  { name: "Sollentuna kommun", orgNumber: "212000-0134", kommunkod: "0163", placeNames: ["Sollentuna"] },
  { name: "Österåkers kommun", orgNumber: "212000-2890", kommunkod: "0117", placeNames: ["Österåker", "Österåkers", "Osteraker"] },
  { name: "Södertälje kommun", orgNumber: "212000-0159", kommunkod: "0181", placeNames: ["Södertälje", "Sodertalje"] },
  { name: "Järfälla kommun", orgNumber: "212000-0043", kommunkod: "0123", placeNames: ["Järfälla", "Jarfalla"] },
  { name: "Botkyrka kommun", orgNumber: "212000-2882", kommunkod: "0127", placeNames: ["Botkyrka"] },
].map((m) => peer({ ...m, pic: null, picSource: null, lan: "Stockholms län", nuts: "SE110" }));

export interface MunicipalityProfile {
  match: MunicipalityMatchConfig;
  peers: MunicipalityMatchConfig[];
  /** The municipality's own list of EU projects to reconcile against
   * (data/…csv), or null when there is none yet. */
  checklist: string | null;
  /** Shown with the comparison; what the figures can't tell. */
  peerCaveats: string[];
}

export const municipalityProfiles: Record<DemoProfileId, MunicipalityProfile> = {
  uppsala: {
    match: uppsalaMatch,
    peers: peerMunicipalities,
    checklist: "data/kontrollista.csv",
    peerCaveats: [
      "ESF+ 2021–2027 kommer från ESF-rådets projektbank för hela landet och från Kohesio. Socialfonden 2014–2020 kommer bara från Kohesio, där förvaltningar ofta står utan organisationsnummer och därför blir kandidater som inte räknas.",
      "Kohesio och ESF-rådets projektbank anger bara projektägaren; projekt där kommunen är samverkanspart syns inte.",
      "Program som kommissionen själv förvaltar (LIFE, CEF, Digital Europe, Creative Europe, CERV, Europe Direct, WiFi4EU) kommer från EU:s Financial Transparency System, matchade på momsnummer.",
      "Erasmus+ kommer från EU:s projektlistor, som saknar organisationsnummer. Kommunen känns igen på namnet (\"Uppsala kommun Fritid\") eller på att skolan är en av kommunens egna enligt Skolverkets skolenhetsregister. Bidraget räknas bara där kommunen är koordinator och är då hela projektets bidrag; som partner räknas projektet men inget belopp. Friskolor, kommunalförbund och kommunala bolag räknas inte.",
      "Linköping, Örebro, Jönköping och Norrköping har ingen PIC som källorna knyter till organisationsnumret; CORDIS-träffar för dem kräver momsnummer.",
    ],
  },
  lidingo: {
    match: lidingoMatch,
    peers: lidingoPeers,
    checklist: null,
    peerCaveats: [
      "ESF+ 2021–2027 kommer från ESF-rådets projektbank för hela landet och från Kohesio. Socialfonden 2014–2020 kommer bara från Kohesio, där förvaltningar utan organisationsnummer blir kandidater som inte räknas.",
      "Kohesio och ESF-rådets projektbank anger bara projektägaren; projekt där kommunen är samverkanspart syns inte.",
      "Program som kommissionen själv förvaltar (LIFE, CEF, Digital Europe, Creative Europe, CERV, Europe Direct, WiFi4EU) kommer från EU:s Financial Transparency System, matchade på momsnummer.",
      "Erasmus+ kommer från EU:s projektlistor, som saknar organisationsnummer. Kommunen känns igen på namnet (\"Uppsala kommun Fritid\") eller på att skolan är en av kommunens egna enligt Skolverkets skolenhetsregister. Bidraget räknas bara där kommunen är koordinator och är då hela projektets bidrag; som partner räknas projektet men inget belopp. Friskolor, kommunalförbund och kommunala bolag räknas inte.",
      "Ingen av kommunerna har en PIC som källorna knyter till organisationsnumret; CORDIS-träffar kräver momsnummer.",
    ],
  },
};

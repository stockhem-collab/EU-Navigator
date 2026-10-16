// Real registry details for organisations we demo for, applied from the
// organisation settings page in one click instead of typed in by hand.
// Sources (checked 2026-10-07):
// - orgNumber, vatNumber: uppsala.se "Fakturor och rekvisitioner"; the VAT
//   number is also valid in the EU VIES register (name "UPPSALA KOMMUN").
// - PIC numbers: Uppsala kommun's own list from the EU Funding & Tenders
//   Portal. 951881080 is the municipality as a whole; the units below have
//   their own PICs.

export interface OrgPresetUnit {
  name: string;
  pic: string;
}

export interface OrgPreset {
  organisationName: string;
  orgNumber: string;
  vatNumber: string;
  orgType: string;
  country: string;
  website: string;
  pic: string;
  /** Units with their own PIC, placed directly under the organisation. */
  units: OrgPresetUnit[];
}

export const uppsalaPreset: OrgPreset = {
  organisationName: "Uppsala kommun",
  orgNumber: "212000-3005",
  vatNumber: "SE212000300501",
  orgType: "Kommun",
  country: "Sverige",
  website: "https://www.uppsala.se",
  pic: "951881080",
  units: [
    { name: "Ringmurens förskola", pic: "871495046" },
    { name: "Stordammen F-9", pic: "883524307" },
    { name: "Uppsala kulturskola", pic: "900828137" },
    { name: "Uppsala kommun Fritid", pic: "928710205" },
  ],
};

// Lidingö stad (checked 2026-10-16): organisationsnummer and VAT number in
// the EU VIES register (name "LIDINGÖ KOMMUN"). Unit PICs from Andreas
// (Funding & Tenders Portal, 2026-10-16). The city's own PIC is not known
// yet; none of the sources ties one to the organisationsnummer.
export const lidingoPreset: OrgPreset = {
  organisationName: "Lidingö stad",
  orgNumber: "212000-0191",
  vatNumber: "SE212000019101",
  orgType: "Kommun",
  country: "Sverige",
  website: "https://www.lidingo.se",
  pic: "",
  units: [
    { name: "Omsorgs- och socialförvaltningen", pic: "937902313" },
    { name: "Källängens skola", pic: "943033710" },
    { name: "Högsätra F-6", pic: "944116424" },
  ],
};

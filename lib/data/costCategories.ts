import type { CostCategory } from "../types";

// The cost categories funders budget and report in. Amounts are kept in SEK
// throughout the app; a form in EUR shows them converted.

/** Horizon Europe's cost categories (Model Grant Agreement, art. 6 and
 * annex 2; the financial statement and the detailed budget table use the
 * same). Indirect costs are a flat 25 % of the eligible direct costs except
 * subcontracting (and financial support to third parties). */
export const HE_COST_CATEGORIES: CostCategory[] = [
  {
    key: "he-a",
    code: "A",
    label_sv: "Personalkostnader",
    label_en: "Personnel costs",
    note_sv: "Anställda, personer med direktavtal och utlånad personal; timmar × timkostnad.",
    note_en: "Employees, natural persons under direct contract and seconded persons; hours × hourly rate.",
  },
  {
    key: "he-b",
    code: "B",
    label_sv: "Underleverantörer",
    label_en: "Subcontracting costs",
    note_sv: "Uppgifter i projektet som köps av någon annan; inte kärnuppgifter.",
    note_en: "Action tasks carried out by a subcontractor; not core tasks.",
  },
  {
    key: "he-c1",
    code: "C.1",
    label_sv: "Resor och traktamenten",
    label_en: "Travel and subsistence",
  },
  {
    key: "he-c2",
    code: "C.2",
    label_sv: "Utrustning",
    label_en: "Equipment",
    note_sv: "Avskrivning under projekttiden, eller hela kostnaden om fundern tillåter.",
    note_en: "Depreciation over the action's duration, or full cost where allowed.",
  },
  {
    key: "he-c3",
    code: "C.3",
    label_sv: "Andra varor, arbeten och tjänster",
    label_en: "Other goods, works and services",
    note_sv: "T.ex. förbrukningsmaterial, spridning, översättning, revisionsintyg.",
    note_en: "E.g. consumables, dissemination, translation, certificate on the financial statements.",
  },
  {
    key: "he-d",
    code: "D",
    label_sv: "Övriga kostnadsslag",
    label_en: "Other cost categories",
    note_sv: "T.ex. internt fakturerade varor och tjänster.",
    note_en: "E.g. internally invoiced goods and services.",
  },
  {
    key: "he-e",
    code: "E",
    label_sv: "Indirekta kostnader (25 %)",
    label_en: "Indirect costs (25 %)",
    note_sv: "25 % av de direkta kostnaderna utom underleverantörer.",
    note_en: "25 % of the eligible direct costs except subcontracting.",
    flatRate: { percent: 25, of: ["he-a", "he-c1", "he-c2", "he-c3", "he-d"] },
  },
];

/** ESF+'s kostnadsslag in Projektrummet+ (Svenska ESF-rådet, Projektekonomi
 * – beviljade projekt). Personnel is reported with unit costs from the
 * time reports; the indirect costs are the flat rate the decision states. */
export const ESF_COST_CATEGORIES: CostCategory[] = [
  {
    key: "esf-personal",
    label_sv: "Personal",
    label_en: "Personnel",
    note_sv: "Enhetskostnad × redovisade timmar i Tidrapport ESF+.",
    note_en: "Unit cost × hours reported in Tidrapport ESF+.",
  },
  {
    key: "esf-resor",
    label_sv: "Resor och logi",
    label_en: "Travel and accommodation",
    note_sv: "Särredovisas i bokföringen, med deltagare och syfte.",
    note_en: "Kept separately in the accounts, with participants and purpose.",
  },
  {
    key: "esf-utrustning",
    label_sv: "Utrustning, materiel och deltagarlokaler",
    label_en: "Equipment, materials and premises for participants",
  },
  {
    key: "esf-externa",
    label_sv: "Externa tjänster",
    label_en: "External services",
    note_sv: "Bifoga hur leverantören valdes.",
    note_en: "Attach how the supplier was chosen.",
  },
  {
    key: "esf-indirekta",
    label_sv: "Indirekta kostnader (schablon)",
    label_en: "Indirect costs (flat rate)",
    note_sv: "Den schablon som beslutet anger, räknad på personalkostnaderna.",
    note_en: "The flat rate the decision states, on the personnel costs.",
    flatRate: { of: ["esf-personal"] },
  },
];

/** A cost category's amount: entered, or — for a flat rate with a known
 * percentage — calculated from the categories it is a rate of. */
export function costAmounts(categories: CostCategory[], entered: Record<string, number | string | undefined>): Record<string, number> {
  const num = (v: number | string | undefined) => {
    const n = typeof v === "number" ? v : Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  };
  const out: Record<string, number> = {};
  for (const c of categories) if (!c.flatRate?.percent) out[c.key] = num(entered[c.key]);
  for (const c of categories) {
    if (!c.flatRate?.percent) continue;
    const base = c.flatRate.of.reduce((sum, k) => sum + (out[k] ?? 0), 0);
    out[c.key] = Math.round((base * c.flatRate.percent) / 100);
  }
  return out;
}

export function costTotal(amounts: Record<string, number>): number {
  return Object.values(amounts).reduce((a, b) => a + b, 0);
}

/** A category's code as the funder writes it before the label: "A.", "C.1". */
export const costCode = (c: CostCategory) => (c.code ? (c.code.includes(".") ? c.code : `${c.code}.`) : "");

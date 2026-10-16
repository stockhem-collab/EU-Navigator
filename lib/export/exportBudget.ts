import type { Workbook, Worksheet } from "exceljs";
import { CallTemplate, CostCategory, Lang } from "@/lib/types";
import { costAmounts, costCode } from "@/lib/data/costCategories";

// An application's budget per the funder's cost categories as an Excel
// workbook, laid out the way the form asks for it, with formulas: flat
// rates (Horizon Europe's 25 % indirect costs) and totals are calculated in
// the sheet, and the euro column follows the rate in its own cell — so the
// file can be worked on in Excel and stays right. Not the funder's own
// file: Horizon Europe's detailed budget table sits behind EU Login (and
// moves into the portal's online forms), ESF+ budgets are filled in in
// Projektrummet+. The amounts are in SEK, as everywhere in the app.
//
// Sheets: "Budget" (the categories, total, EUR and the eligible budget the
// application states); for Horizon Europe "Per deltagare" (the
// participants of tables 3.1a/3.1f, the applicant holding the amounts to
// start with) and "Per arbetspaket" (personnel costs spread over the work
// packages by their person-months); for ESF+ "Per år" (the budget spread
// evenly over the project's years).

export interface BudgetExportInput {
  template: CallTemplate;
  projectTitle: string;
  organisationName: string;
  callTitle: string;
  /** As typed per cost category (CostCategory.key -> SEK). */
  costs: Record<string, string>;
  /** SEK per euro, for a form in euro. */
  eurRate?: number;
  /** The eligible budget the application states, to check against. */
  eligibleBudgetSEK?: number;
  /** The application's tables (TemplateTable.key -> rows). */
  tables: Record<string, string[][]>;
  startYear?: number;
  endYear?: number;
  lang: Lang;
}

const t = (lang: Lang, sv: string, en: string) => (lang === "sv" ? sv : en);
const SEK = '#,##0 "kr"';
const EUR = '#,##0 "€"';
const col = (n: number) => String.fromCharCode(64 + n); // 1 -> A (≤ 26 columns)

function label(c: CostCategory, lang: Lang): string {
  return `${c.code ? `${costCode(c)} ` : ""}${lang === "sv" ? c.label_sv : c.label_en}`;
}

function header(ws: Worksheet, values: string[]) {
  const row = ws.addRow(values);
  row.font = { bold: true };
  row.eachCell((cell) => {
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8EEF6" } };
  });
}

/** The flat-rate formula of a category, over the cells of the categories
 * it's a share of (cellOf maps a category key to its cell). */
function flatRateFormula(c: CostCategory, cellOf: (key: string) => string | undefined): string | undefined {
  if (!c.flatRate?.percent) return undefined;
  const cells = c.flatRate.of.map(cellOf).filter(Boolean);
  return cells.length > 0 ? `ROUND(${c.flatRate.percent / 100}*(${cells.join("+")}),0)` : "0";
}

function budgetSheet(wb: Workbook, input: BudgetExportInput, categories: CostCategory[]): Map<string, number> {
  const { lang, eurRate } = input;
  const ws = wb.addWorksheet("Budget");
  ws.columns = [{ width: 52 }, { width: 18 }, { width: 16 }, { width: 40 }];
  ws.addRow([input.projectTitle]).font = { bold: true, size: 14 };
  ws.addRow([`${input.organisationName} · ${input.callTitle}`]);
  ws.addRow([`${t(lang, "Mall", "Form")}: ${lang === "sv" ? input.template.title_sv : input.template.title_en} (${input.template.version})`]);
  const rateRow = eurRate ? ws.addRow([t(lang, "Växelkurs (kr per euro)", "Exchange rate (SEK per euro)"), eurRate]) : undefined;
  ws.addRow([]);
  header(ws, [t(lang, "Kostnadsslag", "Cost category"), "SEK", ...(eurRate ? ["EUR"] : []), t(lang, "Kommentar", "Note")]);

  const amounts = costAmounts(categories, input.costs);
  const first = ws.rowCount + 1;
  const rowOf = new Map(categories.map((c, i) => [c.key, first + i]));
  const rateCell = rateRow ? `$B$${rateRow.number}` : undefined;
  for (const c of categories) {
    const r = rowOf.get(c.key)!;
    const formula = flatRateFormula(c, (key) => (rowOf.has(key) ? `B${rowOf.get(key)}` : undefined));
    const note = c.flatRate?.percent
      ? t(lang, `${c.flatRate.percent} % schablon, räknas ut`, `${c.flatRate.percent} % flat rate, calculated`)
      : (lang === "sv" ? c.note_sv : c.note_en) ?? "";
    const row = ws.addRow([
      label(c, lang),
      formula ? { formula, result: amounts[c.key] } : amounts[c.key],
      ...(rateCell ? [{ formula: `ROUND(B${r}/${rateCell},0)`, result: Math.round(amounts[c.key] / eurRate!) }] : []),
      note,
    ]);
    row.getCell(2).numFmt = SEK;
    if (rateCell) row.getCell(3).numFmt = EUR;
  }
  const last = ws.rowCount;
  const total = categories.reduce((sum, c) => sum + amounts[c.key], 0);
  const totalRow = ws.addRow([
    t(lang, "Summa", "Total"),
    { formula: `SUM(B${first}:B${last})`, result: total },
    ...(rateCell ? [{ formula: `SUM(C${first}:C${last})`, result: Math.round(total / eurRate!) }] : []),
  ]);
  totalRow.font = { bold: true };
  totalRow.getCell(2).numFmt = SEK;
  if (rateCell) totalRow.getCell(3).numFmt = EUR;

  if (input.eligibleBudgetSEK) {
    ws.addRow([]);
    const eligible = ws.addRow([t(lang, "Stödberättigande budget i ansökan", "Eligible budget in the application"), input.eligibleBudgetSEK]);
    eligible.getCell(2).numFmt = SEK;
    const diff = ws.addRow([
      t(lang, "Skillnad", "Difference"),
      { formula: `B${totalRow.number}-B${eligible.number}`, result: total - input.eligibleBudgetSEK },
    ]);
    diff.getCell(2).numFmt = SEK;
  }
  return rowOf;
}

/** Participants of Part B's tables 3.1f and 3.1a, the applicant first. */
function participants(input: BudgetExportInput): string[] {
  const names = [
    input.organisationName,
    ...(input.tables["he-3.1f"] ?? []).map((r) => r[0]?.trim() ?? ""),
    ...(input.tables["he-3.1a"] ?? []).map((r) => r[3]?.trim() ?? ""),
  ].filter(Boolean);
  const seen = new Set<string>();
  return names.filter((n) => {
    const k = n.toLowerCase().replace(/^\d+\s*[-.:)]?\s*/, "").replace(/\s*\(.*\)$/, "");
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

function perParticipantSheet(wb: Workbook, input: BudgetExportInput, categories: CostCategory[], rowOf: Map<string, number>) {
  const { lang } = input;
  const ws = wb.addWorksheet(t(lang, "Per deltagare", "Per participant"));
  ws.columns = [{ width: 32 }, ...categories.map(() => ({ width: 14 })), { width: 16 }];
  ws.addRow([
    t(
      lang,
      "Fördela budgeten på deltagarna. Den sökande organisationen har hela beloppet tills det fördelas; schablonen (E) räknas per deltagare.",
      "Split the budget over the participants. The applicant holds the whole amount until it is split; the flat rate (E) is calculated per participant."
    ),
  ]);
  header(ws, [t(lang, "Deltagare", "Participant"), ...categories.map((c) => c.code ?? label(c, lang)), t(lang, "Summa", "Total")]);
  const amounts = costAmounts(categories, input.costs);
  const people = participants(input);
  const first = ws.rowCount + 1;
  people.forEach((name, p) => {
    const r = first + p;
    const colOf = (key: string) => {
      const i = categories.findIndex((c) => c.key === key);
      return i >= 0 ? `${col(i + 2)}${r}` : undefined;
    };
    const row = ws.addRow([
      p === 0 ? `1 (${t(lang, "Koordinator", "Coordinator")}) ${name}` : `${p + 1} ${name}`,
      ...categories.map((c) => {
        const formula = flatRateFormula(c, colOf);
        if (formula) return { formula, result: p === 0 ? amounts[c.key] : 0 };
        return p === 0 ? amounts[c.key] : 0;
      }),
      { formula: `SUM(B${r}:${col(categories.length + 1)}${r})`, result: p === 0 ? categories.reduce((s, c) => s + amounts[c.key], 0) : 0 },
    ]);
    row.eachCell((cell, n) => {
      if (n > 1) cell.numFmt = SEK;
    });
  });
  const last = ws.rowCount;
  const sumRow = ws.addRow([
    t(lang, "Summa", "Total"),
    ...categories.map((c, i) => ({ formula: `SUM(${col(i + 2)}${first}:${col(i + 2)}${last})`, result: amounts[c.key] })),
    { formula: `SUM(${col(categories.length + 2)}${first}:${col(categories.length + 2)}${last})`, result: categories.reduce((s, c) => s + amounts[c.key], 0) },
  ]);
  sumRow.font = { bold: true };
  const check = ws.addRow([
    t(lang, "Skillnad mot fliken Budget", "Difference from the Budget sheet"),
    ...categories.map((c, i) => ({ formula: `${col(i + 2)}${sumRow.number}-Budget!B${rowOf.get(c.key)}`, result: 0 })),
  ]);
  [sumRow, check].forEach((row) =>
    row.eachCell((cell, n) => {
      if (n > 1) cell.numFmt = SEK;
    })
  );
}

function perWorkPackageSheet(wb: Workbook, input: BudgetExportInput, categories: CostCategory[], rowOf: Map<string, number>) {
  const { lang } = input;
  const packages = (input.tables["he-3.1a"] ?? []).filter((r) => r.some((c) => c.trim()));
  const personnel = categories.find((c) => c.code === "A");
  if (packages.length === 0 || !personnel) return;
  const ws = wb.addWorksheet(t(lang, "Per arbetspaket", "Per work package"));
  ws.columns = [{ width: 10 }, { width: 40 }, { width: 16 }, { width: 22 }];
  ws.addRow([
    t(lang, "Personalkostnaderna (A) fördelade efter arbetspaketens personmånader i tabell 3.1a.", "Personnel costs (A) split by the work packages' person-months in table 3.1a."),
  ]);
  header(ws, [t(lang, "Nr", "No."), t(lang, "Arbetspaket", "Work package"), t(lang, "Personmånader", "Person-months"), t(lang, "Personalkostnad", "Personnel costs")]);
  const first = ws.rowCount + 1;
  const last = first + packages.length - 1;
  const months = packages.map((r) => Number((r[4] ?? "").replace(",", ".")) || 0);
  const totalMonths = months.reduce((a, b) => a + b, 0);
  const amount = costAmounts(categories, input.costs)[personnel.key];
  packages.forEach((r, i) => {
    const row = ws.addRow([
      r[0] ?? "",
      r[1] ?? "",
      months[i],
      {
        formula: `IF(SUM($C$${first}:$C$${last})=0,0,ROUND(Budget!$B$${rowOf.get(personnel.key)}*C${first + i}/SUM($C$${first}:$C$${last}),0))`,
        result: totalMonths ? Math.round((amount * months[i]) / totalMonths) : 0,
      },
    ]);
    row.getCell(4).numFmt = SEK;
  });
  const sum = ws.addRow([
    "",
    t(lang, "Summa", "Total"),
    { formula: `SUM(C${first}:C${last})`, result: totalMonths },
    { formula: `SUM(D${first}:D${last})`, result: totalMonths ? amount : 0 },
  ]);
  sum.font = { bold: true };
  sum.getCell(4).numFmt = SEK;
}

function perYearSheet(wb: Workbook, input: BudgetExportInput, categories: CostCategory[], rowOf: Map<string, number>) {
  const { lang } = input;
  const start = input.startYear ?? new Date().getFullYear();
  const end = Math.max(start, input.endYear ?? start + 2);
  const years = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const ws = wb.addWorksheet(t(lang, "Per år", "Per year"));
  ws.columns = [{ width: 44 }, ...years.map(() => ({ width: 14 })), { width: 16 }];
  ws.addRow([t(lang, "Budgeten jämnt fördelad på projektets år, ändra fördelningen vid behov.", "The budget spread evenly over the project's years; change the split as needed.")]);
  header(ws, [t(lang, "Kostnadsslag", "Cost category"), ...years.map(String), t(lang, "Summa", "Total")]);
  const amounts = costAmounts(categories, input.costs);
  const first = ws.rowCount + 1;
  categories.forEach((c, i) => {
    const r = first + i;
    const row = ws.addRow([
      label(c, lang),
      ...years.map(() => ({ formula: `ROUND(Budget!$B$${rowOf.get(c.key)}/${years.length},0)`, result: Math.round(amounts[c.key] / years.length) })),
      { formula: `SUM(B${r}:${col(years.length + 1)}${r})`, result: Math.round(amounts[c.key] / years.length) * years.length },
    ]);
    row.eachCell((cell, n) => {
      if (n > 1) cell.numFmt = SEK;
    });
  });
  const last = ws.rowCount;
  const sum = ws.addRow([
    t(lang, "Summa", "Total"),
    ...years.map((_, y) => ({ formula: `SUM(${col(y + 2)}${first}:${col(y + 2)}${last})` })),
    { formula: `SUM(${col(years.length + 2)}${first}:${col(years.length + 2)}${last})` },
  ]);
  sum.font = { bold: true };
  sum.eachCell((cell, n) => {
    if (n > 1) cell.numFmt = SEK;
  });
}

/** The workbook as bytes (.xlsx). */
export async function buildBudgetXlsx(input: BudgetExportInput): Promise<Uint8Array> {
  const categories = input.template.costCategories ?? [];
  const ExcelJS = (await import("exceljs")).default ?? (await import("exceljs"));
  const wb = new ExcelJS.Workbook();
  wb.creator = "EU Navigator";
  const rowOf = budgetSheet(wb, input, categories);
  if (categories.some((c) => c.key.startsWith("he-"))) {
    perParticipantSheet(wb, input, categories, rowOf);
    perWorkPackageSheet(wb, input, categories, rowOf);
  } else {
    perYearSheet(wb, input, categories, rowOf);
  }
  return new Uint8Array(await wb.xlsx.writeBuffer());
}

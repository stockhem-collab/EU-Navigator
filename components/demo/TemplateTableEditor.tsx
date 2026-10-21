"use client";

import { useLanguage } from "@/lib/i18n/LanguageContext";
import { TemplateTable } from "@/lib/types";

interface Props {
  table: TemplateTable;
  rows: string[][];
  onChange: (rows: string[][]) => void;
}

// One of a funder form's tables (e.g. Horizon Europe's 3.1a list of work
// packages), filled in row by row. Each row is edited as a small form —
// one field per column — since the columns are too many and too wide for
// a spreadsheet-style grid on a phone.
export default function TemplateTableEditor({ table, rows, onChange }: Props) {
  const { t, lang } = useLanguage();
  const tp = t.tpl;
  const columns = lang === "sv" ? table.columns_sv : table.columns_en;
  const title = lang === "sv" ? table.title_sv : table.title_en;
  const note = lang === "sv" ? table.note_sv : table.note_en;

  const setCell = (rowIndex: number, col: number, value: string) =>
    onChange(rows.map((row, i) => (i === rowIndex ? columns.map((_, c) => (c === col ? value : row[c] ?? "")) : row)));

  const addRow = () => onChange([...rows, columns.map(() => "")]);

  // An empty table is one line — its name and a way to start it — so a
  // section with many tables (Horizon Europe's 3.1a–h) stays readable.
  if (rows.length === 0) {
    return (
      <div
        className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-dashed border-navy-200 px-3 py-2"
        data-testid={`template-table-${table.key}`}
      >
        <p className="text-sm text-navy-700" title={note}>
          {title} <span className="text-xs text-navy-400">· {tp.noRows}</span>
        </p>
        <button type="button" onClick={addRow} className="text-sm font-semibold text-navy-600 hover:text-navy-900">
          {tp.addRow}
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 rounded-lg border border-navy-100 bg-navy-50/40 p-3" data-testid={`template-table-${table.key}`}>
      <p className="text-sm font-semibold text-navy-700">{title}</p>
      {note && <p className="mt-0.5 text-xs text-navy-500">{note}</p>}
      <div className="mt-2 space-y-3">
        {rows.map((row, rowIndex) => (
          <fieldset key={rowIndex} className="rounded-md border border-navy-100 bg-white p-3">
            <div className="flex items-center justify-between gap-2">
              <legend className="text-xs font-semibold uppercase text-navy-400">{tp.rowLabel(rowIndex + 1)}</legend>
              <button
                type="button"
                onClick={() => onChange(rows.filter((_, i) => i !== rowIndex))}
                aria-label={`${tp.removeRow}: ${title}, ${tp.rowLabel(rowIndex + 1)}`}
                className="text-xs font-medium text-navy-400 hover:text-navy-700"
              >
                {tp.removeRow}
              </button>
            </div>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {columns.map((column, col) => {
                const id = `${table.key}-${rowIndex}-${col}`;
                const long = column.length > 40 || /beskriv|descri|mål|objective|åtgärd|measure|motiver|justif/i.test(column);
                return (
                  <div key={col} className={long ? "sm:col-span-2" : undefined}>
                    <label htmlFor={id} className="block text-xs font-medium text-navy-600">
                      {column}
                    </label>
                    {long ? (
                      <textarea
                        id={id}
                        rows={2}
                        value={row[col] ?? ""}
                        onChange={(e) => setCell(rowIndex, col, e.target.value)}
                        className="mt-1 w-full rounded-md border border-navy-200 px-2 py-1 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                      />
                    ) : (
                      <input
                        id={id}
                        value={row[col] ?? ""}
                        onChange={(e) => setCell(rowIndex, col, e.target.value)}
                        className="mt-1 w-full rounded-md border border-navy-200 px-2 py-1 text-sm text-navy-700 focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </fieldset>
        ))}
      </div>
      <button
        type="button"
        onClick={addRow}
        className="mt-2 text-sm font-semibold text-navy-600 hover:text-navy-900"
      >
        {tp.addRow}
      </button>
    </div>
  );
}

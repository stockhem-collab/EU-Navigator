// Tolerant CSV parser. The CORDIS exports contain fields that start with a
// doubled quote (`;""The proposed action … ""Support …"" …"";`), which
// strict parsers such as papaparse reject. This follows Python's csv module
// in its default, non-strict mode: a quote inside a quoted field that is
// not followed by a delimiter, line break or second quote ends the quoted
// part and the rest of the field is read literally.

export function parseCsvRecords(text: string, delimiter: string): string[][] {
  const records: string[][] = [];
  let record: string[] = [];
  let field = "";
  let i = text.charCodeAt(0) === 0xfeff ? 1 : 0;
  const n = text.length;
  // 0 = start of field, 1 = unquoted field, 2 = quoted field
  let state = 0;

  const endField = () => {
    record.push(field);
    field = "";
    state = 0;
  };
  const endRecord = () => {
    endField();
    if (!(record.length === 1 && record[0] === "")) records.push(record);
    record = [];
  };

  while (i < n) {
    const c = text[i];
    if (state === 2) {
      if (c === '"') {
        const next = text[i + 1];
        if (next === '"') {
          field += '"';
          i += 2;
          continue;
        }
        i++;
        if (next === undefined) break;
        if (next === delimiter || next === "\n" || next === "\r") {
          state = 1; // the delimiter/newline is handled below
          continue;
        }
        state = 1; // stray quote: keep reading literally, quote dropped
        continue;
      }
      field += c;
      i++;
      continue;
    }
    if (c === delimiter) {
      endField();
      i++;
      continue;
    }
    if (c === "\n" || c === "\r") {
      endRecord();
      i += c === "\r" && text[i + 1] === "\n" ? 2 : 1;
      continue;
    }
    if (state === 0 && c === '"') {
      state = 2;
      i++;
      continue;
    }
    field += c;
    state = 1;
    i++;
  }
  if (field !== "" || record.length > 0) endRecord();
  return records;
}

/** Records keyed by the header row. Short rows get empty strings. */
export function parseCsv(text: string, delimiter: "," | ";"): Record<string, string>[] {
  const [header, ...rows] = parseCsvRecords(text, delimiter);
  if (!header) return [];
  return rows.map((values) => {
    const record: Record<string, string> = {};
    header.forEach((h, idx) => {
      record[h] = values[idx] ?? "";
    });
    return record;
  });
}

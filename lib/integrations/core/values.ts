// Value parsing shared by every source: empty markers, dates, amounts,
// rates, identifiers and HTML summaries.

const EMPTY_MARKERS = new Set(["", "n.a.", "n/a", "na", "none", "null", "-", "nan"]);

/** Trimmed text, or null for blanks and the sources' "not available" markers. */
export function clean(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  if (value instanceof Date) return value.toISOString();
  const text = String(value).replace(/ /g, " ").trim();
  return EMPTY_MARKERS.has(text.toLowerCase()) ? null : text;
}

function iso(y: number, m: number, d: number): string | null {
  const date = new Date(Date.UTC(y, m - 1, d));
  if (date.getUTCFullYear() !== y || date.getUTCMonth() !== m - 1 || date.getUTCDate() !== d) {
    return null;
  }
  return `${String(y).padStart(4, "0")}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

/** YYYY-MM-DD from "2024-04-01", "2024-04-01 00:00:00", "16/03/2020" or a
 * spreadsheet Date; null when empty or not a real date. */
export function parseDate(value: unknown): string | null {
  if (value instanceof Date) {
    return isNaN(value.getTime())
      ? null
      : iso(value.getUTCFullYear(), value.getUTCMonth() + 1, value.getUTCDate());
  }
  const text = clean(value);
  if (!text) return null;
  let m = text.match(/^(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T].*)?$/);
  if (m) return iso(+m[1], +m[2], +m[3]);
  m = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (m) return iso(+m[3], +m[2], +m[1]);
  return null;
}

/** A number from "75 354 267", "2073781,25", "56868.983", 1879493.6 or
 * "EUR 1 020 086.57"; null when empty or unparseable. None of the sources
 * use "," or "." as a thousands separator (ESF uses spaces), so a single
 * "," or "." is the decimal mark; with both, the last one is. */
export function parseAmount(value: unknown): number | null {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const text = clean(value);
  if (!text) return null;
  let s = text.replace(/[\s  ]/g, "").replace(/^(SEK|EUR|kr)/i, "").replace(/(SEK|EUR|kr)$/i, "");
  const lastComma = s.lastIndexOf(",");
  const lastDot = s.lastIndexOf(".");
  if (lastComma >= 0 && lastDot >= 0) {
    const decimal = lastComma > lastDot ? "," : ".";
    const thousands = decimal === "," ? "." : ",";
    s = s.split(thousands).join("").replace(decimal, ".");
  } else if (lastComma >= 0) {
    s = s.replace(",", ".");
  }
  if (!/^-?\d+(\.\d+)?$/.test(s)) return null;
  return Number(s);
}

/** A 0–1 rate from "40%", "40.0" (percent) or 0.4. */
export function parseRate(value: unknown): number | null {
  const n = parseAmount(typeof value === "string" ? value.replace("%", "") : value);
  if (n === null) return null;
  const rate = n > 1 ? n / 100 : n;
  return rate >= 0 && rate <= 1 ? Math.round(rate * 10000) / 10000 : null;
}

/** Swedish organisationsnummer as 10 digits, from "212000-3005",
 * "2120003005", "16212000-3005" or a Swedish VAT number "SE212000300501". */
export function normaliseOrganisationNumber(value: unknown): string | null {
  const text = clean(value);
  if (!text) return null;
  const isVat = /^SE/i.test(text);
  let digits = text.replace(/^SE/i, "").replace(/[\s-]/g, "");
  if (!/^\d+$/.test(digits)) return null;
  // VAT: "SE" + organisationsnummer + "01".
  if (isVat) digits = digits.length === 12 && digits.endsWith("01") ? digits.slice(0, 10) : "";
  if (digits.length === 12 && digits.startsWith("16")) digits = digits.slice(2);
  return digits.length === 10 ? digits : null;
}

/** A PIC is a 9-digit number. */
export function normalisePic(value: unknown): string | null {
  const text = clean(value);
  return text && /^\d{9}$/.test(text) ? text : null;
}

const COUNTRY_FIXES: Record<string, string> = { UK: "GB", EL: "GR" };
const COUNTRY_NAMES: Record<string, string> = { sverige: "SE", sweden: "SE" };

/** ISO alpha-2. CORDIS and keep.eu use the EU's UK/EL codes. */
export function normaliseCountry(value: unknown): string | null {
  const text = clean(value);
  if (!text) return null;
  const named = COUNTRY_NAMES[text.toLowerCase()];
  if (named) return named;
  const code = text.toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return null;
  return COUNTRY_FIXES[code] ?? code;
}

const ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  aring: "å",
  auml: "ä",
  ouml: "ö",
  Aring: "Å",
  Auml: "Ä",
  Ouml: "Ö",
};

/** Plain text from an HTML summary (ESF): tags removed, entities decoded,
 * paragraphs kept as blank lines. */
export function stripHtml(value: unknown): string | null {
  const text = clean(value);
  if (!text) return null;
  const plain = text
    .replace(/^"+|"+$/g, "")
    .replace(/<\s*(br|\/p|\/li|\/h\d)\s*\/?>/gi, "\n")
    .replace(/<[^>]*>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (all, name) => ENTITIES[name] ?? all)
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  return plain || null;
}

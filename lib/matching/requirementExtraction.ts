import type { ApplicationRequirement, RequirementKind } from "@/lib/types";

// A rule-based reading of pasted call text for what an application must
// include — the annexes, certificates and declarations a call lists. Like
// the call import (callExtraction.ts) it only proposes: every suggestion is
// reviewed in Datacenter › Krav before it is saved, and the call's text
// always wins.

export interface RequirementSuggestion {
  title: string;
  kind: RequirementKind;
  why: string;
  condition?: string;
  mandatory: boolean;
  /** The line the suggestion was read from. */
  line: string;
}

const KEYWORDS =
  /bilag|bifoga|intyg|försäkran|underskri|undertecknad|blankett|policy|cv\b|verksamhetsberättelse|protokoll|annex|attach|certificate|declaration|signed|letter of (support|commitment)|list of previous|tidigare projekt|budget table|budgettabell|mandatory|obligatorisk/i;
// A line describing the line before it ("Denna bilaga är obligatorisk för…").
const DESCRIBES_PREVIOUS =
  /^(denna|dessa|den|this|these)\s+(bilaga|bilagor|blankett|annex|annexes|document)\b|^(obligatorisk|mandatory)\b|^[\wåäöÅÄÖ-]+\s+(är|is)\s+(obligatorisk|mandatory)/i;
// A heading that only introduces the list ("Bilagor som ska bifogas…").
const LIST_HEADING = /^(följande\s+|the following\s+)?(obligatoriska\s+|mandatory\s+)?(bilagor|annexes)\b/i;
const BULLET = /^\s*[-–—−•▪·*○]\s*(?=\S)/;
const MANDATORY = /obligatorisk|ska\b|skall\b|måste|krävs|mandatory|must|required/i;
const RECOMMENDED = /rekommender|frivillig|kan bifogas|optional|recommended|may be/i;

function kindOf(text: string): RequirementKind {
  if (/budget/i.test(text)) return "budget";
  if (/intyg|certifi|verifiering|behörig/i.test(text)) return "certificate";
  if (/försäkran|deklaration|declaration|bekräftelse|confirmation|declaration on honour/i.test(text)) return "declaration";
  return "annex";
}

function conditionOf(text: string): string | undefined {
  const m =
    text.match(/\(([^)]*(?:exempt|undant)[^)]*)\)/i) ??
    text.match(/obligatorisk[a]? för ([^.;]+)/i) ??
    text.match(/\b(?:gäller|endast) (?:för )?([^.;]+)/i) ??
    text.match(/\b(om [^.;]{4,80})/i) ??
    text.match(/mandatory (?:only )?for ([^.;]+)/i) ??
    text.match(/\b(if [^.;]{4,80})/i);
  if (!m) return undefined;
  const c = m[1].trim();
  return /^(samtliga|alla) (sökande|stödsökande)|^all applicants/i.test(c) ? undefined : c;
}

function cleanLine(line: string): string {
  return line
    .trim()
    .replace(BULLET, "")
    .replace(/^\(?[a-z0-9]{1,2}[.)]\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleOf(text: string): string {
  const head = text.split(/\s[–—-]\s|:\s|\s\(/)[0].trim();
  const title = head.length >= 4 ? head : text;
  return title.length > 90 ? `${title.slice(0, 87).trimEnd()}…` : title.charAt(0).toUpperCase() + title.slice(1);
}

/** The requirements a call text seems to list, in the text's order. */
export function extractRequirements(text: string): RequirementSuggestion[] {
  // Text pasted from a PDF wraps mid-sentence: a line that starts in lower
  // case, or inside an unclosed parenthesis, and isn't a bullet continues
  // the one before.
  const raw = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const joined: string[] = [];
  for (const line of raw) {
    const trimmed = line.trim();
    const previous = joined[joined.length - 1];
    const unclosed = previous !== undefined && (previous.match(/\(/g) ?? []).length > (previous.match(/\)/g) ?? []).length;
    if (previous !== undefined && !BULLET.test(line) && (unclosed || /^[a-zåäö(]/.test(trimmed))) joined[joined.length - 1] += ` ${trimmed}`;
    else joined.push(line);
  }
  const lines = joined.map(cleanLine).filter((l) => l.length > 2);
  const out: RequirementSuggestion[] = [];
  const titles = new Set<string>();
  const push = (s: RequirementSuggestion) => {
    const key = s.title.toLowerCase();
    if (titles.has(key)) return;
    titles.add(key);
    out.push(s);
  };

  lines.forEach((line, i) => {
    if (DESCRIBES_PREVIOUS.test(line)) {
      const previous = lines[i - 1];
      const last = out[out.length - 1];
      if (last && last.line === previous) {
        last.why = line;
        last.condition = conditionOf(line) ?? last.condition;
        last.mandatory = !RECOMMENDED.test(line) && (MANDATORY.test(line) || last.mandatory);
      } else if (previous && previous.length <= 90 && !DESCRIBES_PREVIOUS.test(previous)) {
        // A short heading line ("Inköpspolicy") described by this one.
        push({
          title: titleOf(previous),
          kind: kindOf(`${previous} ${line}`),
          why: line,
          condition: conditionOf(line),
          mandatory: !RECOMMENDED.test(line),
          line: previous,
        });
      }
      return;
    }
    if (!KEYWORDS.test(line) || line.length > 700 || LIST_HEADING.test(line)) return;
    // Headings that only introduce a list ("Följande bilagor ska bifogas:").
    if (/:\s*$/.test(line) && /följande|following|bilagor som|annexes and supporting/i.test(line)) return;
    push({
      title: titleOf(line),
      kind: kindOf(line),
      why: line,
      condition: conditionOf(line),
      mandatory: !RECOMMENDED.test(line) && MANDATORY.test(line),
      line,
    });
  });
  return out;
}

function slug(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 40);
}

/** A reviewed suggestion as a requirement of the call. */
export function requirementFromSuggestion(
  s: Pick<RequirementSuggestion, "title" | "kind" | "why" | "condition" | "mandatory">,
  source: { document: string; url?: string },
  checkedAt: string,
  existingIds: string[] = []
): ApplicationRequirement {
  let id = `dc-${slug(s.title) || "krav"}`;
  while (existingIds.includes(id)) id = `${id}-2`;
  return {
    id,
    kind: s.kind,
    title_sv: s.title,
    title_en: s.title,
    why_sv: s.why,
    why_en: s.why,
    mandatory: s.mandatory,
    ...(s.condition ? { condition_sv: s.condition, condition_en: s.condition } : {}),
    source: { document: source.document, ...(source.url ? { url: source.url } : {}), checkedAt },
  };
}

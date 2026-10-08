// npm run history:uppsala — Uppsala kommun's projects in lib/data/generated/
// → lib/data/generated/uppsala-history.json, reconciled with
// data/kontrollista.csv → docs/demo/uppsala-avstamning.md.
// Run npm run import:all first.

import fs from "node:fs";
import path from "node:path";
import { readCsv, readEurSekRates, ROOT } from "../../lib/integrations/core/files";
import { Money } from "../../lib/integrations/core/types";
import {
  findMunicipalityProjects,
  HISTORY_FROM,
  HistoryProject,
} from "../../lib/integrations/municipality/match";
import {
  CandidateEntry,
  parseChecklist,
  reconcile,
  Reconciliation,
} from "../../lib/integrations/municipality/reconcile";
import { uppsalaMatch } from "../../lib/data/municipalities";
import { readGenerated, SOURCES, writeGenerated } from "./generated";
import { main } from "./run";

const CHECKLIST = "data/kontrollista.csv";
const REPORT = "docs/demo/uppsala-avstamning.md";

const SOURCE_LABEL: Record<string, string> = {
  kohesio: "Kohesio",
  esf: "ESF-rådets projektbank",
  "keep-eu": "keep.eu",
  cordis: "CORDIS",
};

function money(m: Money | null): string {
  if (!m) return "–";
  return `${m.amount.toLocaleString("sv-SE", { maximumFractionDigits: 0 })} ${m.currency}`;
}

function period(p: { startDate: string | null; endDate: string | null }): string {
  return `${p.startDate ?? "?"} – ${p.endDate ?? "?"}`;
}

function cell(text: string | null | undefined): string {
  return (text ?? "").replace(/\|/g, "\\|").replace(/\s+/g, " ").trim();
}

function link(title: string, url: string | null): string {
  return url ? `[${cell(title)}](${url})` : cell(title);
}

function projectLine(p: HistoryProject): string {
  return `| ${link(p.title, p.sourceUrl)} | ${SOURCE_LABEL[p.sourceSystem]} | ${cell(p.programmeName)} | ${period(p)} | ${p.partners.map((x) => x.sourceRole).join(", ")} | ${money(p.euContribution)} | ${p.matchedOn} ${p.matchedValue} |`;
}

function candidateLine(c: CandidateEntry): string {
  const k = c.candidate;
  const listed = c.row ? `ja, rad ${c.row.row} "${cell(c.row.name)}" (${c.linkedBy})` : "nej";
  return `| ${link(k.title, k.sourceUrl)} | ${SOURCE_LABEL[k.sourceSystem]} | ${cell(k.organisationName)} | ${k.reason} | ${period(k)} | ${money(k.euContribution)} | ${listed} |`;
}

function markdown(r: Reconciliation, generatedAt: string): string {
  const amountDeviations = r.both.filter((b) => b.amount.status === "avviker").length;
  const out: string[] = [
    "# Uppsala kommun – avstämning mot kontrollistan",
    "",
    `Genererad ${generatedAt.slice(0, 10)} av \`npm run history:uppsala\` från \`lib/data/generated/\` (${SOURCES.map((s) => SOURCE_LABEL[s]).join(", ")}) och \`${CHECKLIST}\`. Ändra inte för hand; kör skriptet igen.`,
    "",
    "Säker träff kräver Uppsala kommuns PIC (kommunen eller en av de fyra enheterna), momsnummer eller organisationsnummer hos en partner i projektet. Namnlika träffar är kandidater för manuell granskning och räknas inte. Uppsala universitet, Region Uppsala, SLU och Länsstyrelsen i Uppsala län räknas aldrig. Uppsala Stadshus AB och dotterbolagen listas bara som kandidater. Projekt som slutade före 2014 visas inte i historiken.",
    "",
    "## Sammanfattning",
    "",
    `- Finns i båda: ${r.both.length} (varav ${amountDeviations} med beloppsavvikelse)`,
    `- Bara i källorna: ${r.sourcesOnly.length}`,
    `- Bara i kontrollistan: ${r.checklistOnly.length}`,
    `- Osäkra kandidater: ${r.candidates.length} (varav ${r.candidates.filter((c) => c.row).length} som kontrollistan tar upp)`,
    `- Förväntas inte i källorna ("Ingen"): ${r.notExpected.length}`,
    `- Före 2014, visas inte i historiken: ${r.before2014.length}`,
    "",
    "## 1. Finns i båda",
    "",
    "| Kontrollistan | Källa | Kopplat via | Säker träff | Belopp | Datum |",
    "|---|---|---|---|---|---|",
    ...r.both.map(
      (b) =>
        `| ${cell(b.row.name)} | ${link(b.project.title, b.project.sourceUrl)} (${SOURCE_LABEL[b.project.sourceSystem]}) | ${b.linkedBy} | ${b.project.matchedOn} ${b.project.matchedValue} | **${b.amount.status}**: ${cell(b.amount.detail)} | ${b.dateDiff ? cell(b.dateDiff) : "lika"} |`,
    ),
    "",
    "## 2. Bara i källorna",
    "",
    "Säkra träffar som kontrollistan saknar.",
    "",
    "| Projekt | Källa | Program | Period | Roll | Kommunens EU-bidrag | Säker träff |",
    "|---|---|---|---|---|---|---|",
    ...r.sourcesOnly.map(projectLine),
    "",
    "## 3. Bara i kontrollistan",
    "",
    "| Rad | Projekt | Förväntas i | Vad källorna visar |",
    "|---|---|---|---|",
    ...r.checklistOnly.map(
      (c) => `| ${c.row.row} | ${cell(c.row.name)} | ${cell(c.row.expectedIn)} | ${cell(c.finding)} |`,
    ),
    "",
    "## 4. Osäkra kandidater",
    "",
    "Namnlika träffar och projekt som bara kopplas via kontrollistans diarienummer. Ingen av dem räknas i historiken förrän någon bekräftat dem.",
    "",
    "| Projekt | Källa | Organisation i källan | Varför kandidat | Period | EU-bidrag | I kontrollistan |",
    "|---|---|---|---|---|---|---|",
    ...r.candidates.map(candidateLine),
    "",
    "## Redovisas separat",
    "",
    "### Förväntas inte i någon källa (\"Ingen\")",
    "",
    "| Rad | Projekt | Program | Förväntas i källa | Belopp |",
    "|---|---|---|---|---|",
    ...r.notExpected.map(
      (row) =>
        `| ${row.row} | ${cell(row.name)} | ${cell(row.programme)} | ${cell(row.expectedIn)} | ${row.amount !== null ? `${row.amount.toLocaleString("sv-SE")} ${row.currency ?? ""}` : "–"} |`,
    ),
    "",
    `### Slutade före ${HISTORY_FROM.slice(0, 4)} (visas inte i historiken)`,
    "",
    "| Rad | Projekt | Program | Period |",
    "|---|---|---|---|",
    ...r.before2014.map((row) => `| ${row.row} | ${cell(row.name)} | ${cell(row.programme)} | ${cell(row.period)} |`),
    "",
  ];
  return out.join("\n");
}

main(() => {
  const datasets = readGenerated();
  const rates = readEurSekRates();
  const result = findMunicipalityProjects(datasets, uppsalaMatch, rates);
  const rows = parseChecklist(readCsv(path.join(ROOT, CHECKLIST), ","));
  const rec = reconcile(
    result,
    rows,
    datasets,
    rates,
    uppsalaMatch.excluded.map((e) => e.pattern),
  );
  const generatedAt = new Date().toISOString();

  const json = writeGenerated("uppsala-history.json", {
    generatedAt,
    municipality: {
      name: uppsalaMatch.name,
      orgNumber: uppsalaMatch.orgNumber,
      vatNumber: uppsalaMatch.vatNumber,
      pic: uppsalaMatch.pic,
      unitPics: uppsalaMatch.unitPics,
      kommunkod: uppsalaMatch.kommunkod,
      lan: uppsalaMatch.lan,
      nuts: uppsalaMatch.nuts,
    },
    rules: {
      sureMatch: "PIC (kommunen eller enhet), momsnummer eller organisationsnummer hos en partner",
      candidates: "namnlika organisationer, projekttitlar som nämner kommunen, kommunala bolag, diarienummer ur kontrollistan; räknas inte",
      excluded: uppsalaMatch.excluded.map((e) => e.name),
      historyFrom: HISTORY_FROM,
      euContributionEur: "kommunens egen andel, SEK omräknat med årssnittskurs för startåret (data/vaxelkurs.csv)",
    },
    projects: result.projects.map((p) => ({
      ...p,
      checklistRow: rec.both.find((b) => b.project.id === p.id)?.row.row ?? null,
    })),
    candidates: rec.candidates.map((c) => ({
      ...c.candidate,
      checklistRow: c.row?.row ?? null,
    })),
    excludedOrganisations: result.excludedOrganisations,
    before2014: result.before2014.map((p) => ({ id: p.id, title: p.title, endDate: p.endDate })),
  });

  fs.mkdirSync(path.join(ROOT, path.dirname(REPORT)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, REPORT), markdown(rec, generatedAt));

  console.log(`\n[uppsala-history]`);
  console.log(`  säkra träffar    ${result.projects.length} (före 2014 bortlämnade: ${result.before2014.length})`);
  console.log(`  kandidater       ${rec.candidates.length}`);
  console.log(`  finns i båda     ${rec.both.length}`);
  console.log(`  bara i källorna  ${rec.sourcesOnly.length}`);
  console.log(`  bara i listan    ${rec.checklistOnly.length}`);
  console.log(`  "Ingen"          ${rec.notExpected.length}, före 2014: ${rec.before2014.length}`);
  console.log(`  skriven fil      ${json}`);
  console.log(`  skriven fil      ${REPORT}`);
});

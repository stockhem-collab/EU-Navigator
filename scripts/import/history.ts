// npm run history:<profile> (or history:all) — a demo municipality's EU
// history and its comparison group (lib/data/municipalities.ts,
// municipalityProfiles) from lib/data/generated/:
// - <profile>-history.json: the municipality's own projects, reconciled with
//   its checklist when it has one → docs/demo/<profile>-avstamning.md
// - <profile>-peers.json: projects per programme for the municipality and its
//   comparison group.
// Sure hits on PIC, momsnummer or organisationsnummer only; name matches are
// candidates and never counted. Vinnova projects (national funding, matched
// on the coordinator's exact name since Vinnova gives no organisationsnummer)
// are listed apart and kept out of the EU figures. Run npm run import:all
// first.

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
import {
  COMMON_EXCLUSIONS,
  MunicipalityMatchConfig,
  MunicipalityProfile,
  municipalityProfiles,
} from "../../lib/data/municipalities";
import { DemoProfileId, isDemoProfileId } from "../../lib/data/demoProfiles";
import { GeneratedDataset } from "../../lib/integrations/core/types";
import { findVinnovaProjects, VinnovaProject, vinnovaTotals } from "../../lib/integrations/municipality/vinnova";
import { EU_SOURCES, readGenerated, writeGenerated } from "./generated";
import { peersFile } from "./peers";
import { main } from "./run";

const SOURCE_LABEL: Record<string, string> = {
  kohesio: "Kohesio",
  esf: "ESF-rådets projektbank",
  "keep-eu": "keep.eu",
  cordis: "CORDIS",
  fts: "EU:s Financial Transparency System",
  vinnova: "Vinnova",
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

function vinnovaLine(p: VinnovaProject): string {
  return `| ${link(p.title, p.sourceUrl)} | ${p.diarienummer} | ${cell(p.programmeName)} | ${period(p)} | ${cell(p.coordinator)} | ${money(p.grant)} |`;
}

function candidateLine(c: CandidateEntry): string {
  const k = c.candidate;
  const listed = c.row ? `ja, rad ${c.row.row} "${cell(c.row.name)}" (${c.linkedBy})` : "nej";
  return `| ${link(k.title, k.sourceUrl)} | ${SOURCE_LABEL[k.sourceSystem]} | ${cell(k.organisationName)} | ${k.reason} | ${period(k)} | ${money(k.euContribution)} | ${listed} |`;
}

function listing(names: string[]): string {
  return names.length <= 1 ? names.join("") : `${names.slice(0, -1).join(", ")} och ${names[names.length - 1]}`;
}

function rulesText(m: MunicipalityMatchConfig): string {
  const count = ["", "den enda", "de två", "de tre", "de fyra", "de fem", "de sex"][m.unitPics.length] ?? `de ${m.unitPics.length}`;
  const pics = m.pic
    ? m.unitPics.length > 0
      ? `PIC (kommunen eller en av ${count} enheterna), `
      : "PIC, "
    : m.unitPics.length > 0
      ? `enheters PIC (${m.unitPics.map((u) => u.name).join(", ")}), `
      : "";
  const own = m.excluded.filter((e) => !COMMON_EXCLUSIONS.includes(e)).map((e) => e.name);
  const common = "universitet, regioner, länsstyrelser, kommunalförbund och kyrkor";
  return [
    `Säker träff kräver ${m.name}s ${pics}momsnummer eller organisationsnummer hos en partner i projektet.`,
    "Namnlika träffar är kandidater för manuell granskning och räknas inte.",
    own.length > 0
      ? `${listing(own)} räknas aldrig, inte heller andra ${common}.`
      : `${common[0].toUpperCase()}${common.slice(1)} räknas aldrig.`,
    m.companies ? `${m.companies.name} och dotterbolagen listas bara som kandidater.` : "",
    "Projekt som slutade före 2014 visas inte i historiken.",
  ]
    .filter(Boolean)
    .join(" ");
}

function markdown(
  id: DemoProfileId,
  m: MunicipalityMatchConfig,
  checklist: string | null,
  r: Reconciliation,
  vinnova: VinnovaProject[],
  generatedAt: string,
): string {
  const amountDeviations = r.both.filter((b) => b.amount.status === "avviker").length;
  const out: string[] = [
    checklist ? `# ${m.name} – avstämning mot kontrollistan` : `# ${m.name} – EU-projekt i källorna`,
    "",
    `Genererad ${generatedAt.slice(0, 10)} av \`npm run history:${id}\` från \`lib/data/generated/\` (${EU_SOURCES.map((s) => SOURCE_LABEL[s]).join(", ")} och Vinnova)${checklist ? ` och \`${checklist}\`` : ""}. Ändra inte för hand; kör skriptet igen.`,
    "",
    rulesText(m),
    "",
    ...(checklist
      ? []
      : [
          "Kommunen har ingen kontrollista i repot ännu, så alla säkra träffar står under \"Bara i källorna\". Lägg kommunens egen projektlista i `data/` och ange den i `municipalityProfiles` för att stämma av.",
          "",
        ]),
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
    "## Vinnova (nationell finansiering)",
    "",
    `Projekt där ${m.name} är koordinator enligt Vinnovas öppna data (data.vinnova.se). Vinnova anger inget organisationsnummer, så träffen bygger på att koordinatorns namn är exakt kommunens; kommunala bolag räknas inte. Bidragen är nationella och ingår inte i EU-siffrorna ovan.`,
    "",
    `${vinnova.length} projekt, ${money(vinnova.length ? { amount: vinnovaTotals(vinnova).grantSek, currency: "SEK" } : null)} i beviljat bidrag.`,
    "",
    "| Projekt | Diarienummer | Program | Period | Koordinator | Beviljat bidrag |",
    "|---|---|---|---|---|---|",
    ...vinnova.map(vinnovaLine),
    "",
  ];
  return out.join("\n");
}

function runProfile(id: DemoProfileId, profile: MunicipalityProfile, all: GeneratedDataset[]) {
  const { match, checklist } = profile;
  const rates = readEurSekRates();
  const datasets = all.filter((ds) => EU_SOURCES.includes(ds.source));
  const result = findMunicipalityProjects(datasets, match, rates);
  const vinnova = findVinnovaProjects(all.find((ds) => ds.source === "vinnova"), match);
  const rows = checklist ? parseChecklist(readCsv(path.join(ROOT, checklist), ",")) : [];
  const rec = reconcile(
    result,
    rows,
    datasets,
    rates,
    match.excluded.map((e) => e.pattern),
  );
  const generatedAt = new Date().toISOString();
  const report = `docs/demo/${id}-avstamning.md`;

  const json = writeGenerated(`${id}-history.json`, {
    generatedAt,
    municipality: {
      name: match.name,
      orgNumber: match.orgNumber,
      vatNumber: match.vatNumber,
      pic: match.pic,
      unitPics: match.unitPics,
      kommunkod: match.kommunkod,
      lan: match.lan,
      nuts: match.nuts,
    },
    rules: {
      sureMatch: "PIC (kommunen eller enhet), momsnummer eller organisationsnummer hos en partner",
      candidates: checklist
        ? "namnlika organisationer, projekttitlar som nämner kommunen, kommunala bolag, diarienummer ur kontrollistan; räknas inte"
        : "namnlika organisationer, projekttitlar som nämner kommunen, kommunala bolag; räknas inte",
      excluded: match.excluded.map((e) => e.name),
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
    vinnova: {
      rule: "koordinatorns namn är exakt kommunens (Vinnova anger inget organisationsnummer); nationella bidrag, ingår inte i EU-siffrorna",
      projects: vinnova,
    },
  });

  fs.mkdirSync(path.join(ROOT, path.dirname(report)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, report), markdown(id, match, checklist, rec, vinnova, generatedAt));

  const peers = peersFile(profile, all, rates);
  const peersJson = writeGenerated(`${id}-peers.json`, peers);

  console.log(`\n[history:${id}]`);
  console.log(`  säkra träffar    ${result.projects.length} (före 2014 bortlämnade: ${result.before2014.length})`);
  console.log(`  kandidater       ${rec.candidates.length}`);
  console.log(`  Vinnova          ${vinnova.length} (${vinnovaTotals(vinnova).grantSek.toLocaleString("sv-SE")} kr)`);
  if (checklist) {
    console.log(`  finns i båda     ${rec.both.length}`);
    console.log(`  bara i källorna  ${rec.sourcesOnly.length}`);
    console.log(`  bara i listan    ${rec.checklistOnly.length}`);
    console.log(`  "Ingen"          ${rec.notExpected.length}, före 2014: ${rec.before2014.length}`);
  }
  console.log(`  jämförelse`);
  for (const m of peers.municipalities) {
    console.log(
      `    ${m.name.padEnd(20)} projekt ${String(m.projects).padStart(3)}  EU-bidrag ${m.euContributionEur.toLocaleString("sv-SE").padStart(12)} EUR  kandidater ${String(m.candidates.length).padStart(3)}  Vinnova ${String(m.vinnova.projects).padStart(3)}`,
    );
  }
  console.log(`  skriven fil      ${json}`);
  console.log(`  skriven fil      ${peersJson}`);
  console.log(`  skriven fil      ${report}`);
}

main(() => {
  const arg = process.argv[2];
  const ids = arg === "all" ? (Object.keys(municipalityProfiles) as DemoProfileId[]) : [arg];
  if (!ids.every(isDemoProfileId)) {
    throw new Error(`Usage: tsx scripts/import/history.ts <${Object.keys(municipalityProfiles).join("|")}|all>`);
  }
  const datasets = readGenerated();
  for (const id of ids as DemoProfileId[]) runProfile(id, municipalityProfiles[id], datasets);
});

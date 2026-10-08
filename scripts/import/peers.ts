// npm run history:peers — projects per programme for Uppsala and the ten
// comparable municipalities in lib/data/municipalities.ts →
// lib/data/generated/peers.json. Same rules as uppsala-history: sure hits
// on PIC, momsnummer or organisationsnummer only; name matches are listed as
// candidates and not counted. Run npm run import:all first.

import { readEurSekRates } from "../../lib/integrations/core/files";
import { convert } from "../../lib/integrations/core/currency";
import {
  findMunicipalityProjects,
  HISTORY_FROM,
  HistoryProject,
} from "../../lib/integrations/municipality/match";
import { findProgram } from "../../lib/data/fundingPrograms";
import {
  MunicipalityMatchConfig,
  peerMunicipalities,
  uppsalaMatch,
} from "../../lib/data/municipalities";
import { readGenerated, SOURCES, writeGenerated } from "./generated";
import { main } from "./run";

interface ProgramTotal {
  programId: string | null;
  programme: string;
  projects: number;
  euContributionEur: number;
  euContributionSek: number;
  byPeriod: Record<string, { projects: number; euContributionEur: number }>;
}

function programKey(p: HistoryProject): { key: string; label: string } {
  if (p.programId) return { key: p.programId, label: findProgram(p.programId)?.name ?? p.programId };
  return { key: `källa:${p.programmeName}`, label: p.programmeName };
}

function totals(projects: HistoryProject[], rates: ReturnType<typeof readEurSekRates>) {
  const byProgram = new Map<string, ProgramTotal>();
  let eur = 0;
  let sek = 0;
  for (const p of projects) {
    const { key, label } = programKey(p);
    const year = Number((p.startDate ?? "2020").slice(0, 4));
    const pEur = p.euContribution ? convert(p.euContribution, "EUR", year, rates).amount : 0;
    const pSek = p.euContribution ? convert(p.euContribution, "SEK", year, rates).amount : 0;
    const t = byProgram.get(key) ?? {
      programId: p.programId,
      programme: label,
      projects: 0,
      euContributionEur: 0,
      euContributionSek: 0,
      byPeriod: {},
    };
    t.projects++;
    t.euContributionEur += pEur;
    t.euContributionSek += pSek;
    const period = p.period ?? "okänd";
    const bp = (t.byPeriod[period] ??= { projects: 0, euContributionEur: 0 });
    bp.projects++;
    bp.euContributionEur += pEur;
    byProgram.set(key, t);
    eur += pEur;
    sek += pSek;
  }
  const round = (n: number) => Math.round(n);
  return {
    projects: projects.length,
    euContributionEur: round(eur),
    euContributionSek: round(sek),
    byProgram: [...byProgram.values()]
      .map((t) => ({
        ...t,
        euContributionEur: round(t.euContributionEur),
        euContributionSek: round(t.euContributionSek),
        byPeriod: Object.fromEntries(
          Object.entries(t.byPeriod).map(([k, v]) => [k, { ...v, euContributionEur: round(v.euContributionEur) }]),
        ),
      }))
      .sort((a, b) => b.euContributionEur - a.euContributionEur),
  };
}

main(() => {
  const datasets = readGenerated();
  const rates = readEurSekRates();
  const run = (config: MunicipalityMatchConfig, reference: boolean) => {
    const result = findMunicipalityProjects(datasets, config, rates);
    return {
      name: config.name,
      reference,
      orgNumber: config.orgNumber,
      vatNumber: config.vatNumber,
      pic: config.pic,
      picSource: config.picSource,
      kommunkod: config.kommunkod,
      lan: config.lan,
      nuts: config.nuts,
      ...totals(result.projects, rates),
      matchedOn: result.projects.reduce<Record<string, number>>((acc, p) => {
        acc[p.matchedOn] = (acc[p.matchedOn] ?? 0) + 1;
        return acc;
      }, {}),
      projectIds: result.projects.map((p) => p.id),
      candidates: result.candidates.map((c) => ({
        projectId: c.projectId,
        title: c.title,
        organisationName: c.organisationName,
        reason: c.reason,
        period: c.period,
        euContribution: c.euContribution,
      })),
    };
  };

  const municipalities = [run(uppsalaMatch, true), ...peerMunicipalities.map((m) => run(m, false))];
  const file = writeGenerated("peers.json", {
    generatedAt: new Date().toISOString(),
    sources: SOURCES,
    rules: {
      sureMatch: "PIC, momsnummer eller organisationsnummer hos en partner i projektet",
      candidates: "namnlika organisationer och projekttitlar; listas men räknas inte",
      historyFrom: HISTORY_FROM,
      amount:
        "Kommunens eget beviljade EU-bidrag: Kohesio och ESF-rådets projektbank anger hela projektets EU-bidrag (en stödmottagare), keep.eu och CORDIS kommunens partnerandel. Omräknat EUR/SEK med årssnittskurs för startåret (data/vaxelkurs.csv).",
      caveats: [
        "ESF-rådets projektbank-exporten (data/raw/esf_projektbanken_*.csv) gäller bara Uppsala. För övriga kommuner kommer ESF+-projekten bara från Kohesio, som kan sakna nyligen beviljade projekt.",
        "Kohesio har ingen PIC; där räknas bara stödmottagare med kommunens organisationsnummer. Förvaltningar som står utan organisationsnummer blir kandidater.",
        "Linköping, Örebro, Jönköping och Norrköping har ingen PIC som källorna knyter till organisationsnumret; CORDIS-träffar för dem kräver momsnummer.",
      ],
    },
    municipalities,
  });

  console.log(`\n[peers]`);
  for (const m of municipalities) {
    console.log(
      `  ${m.name.padEnd(20)} projekt ${String(m.projects).padStart(3)}  EU-bidrag ${m.euContributionEur.toLocaleString("sv-SE").padStart(12)} EUR  kandidater ${m.candidates.length}`,
    );
  }
  console.log(`  skriven fil  ${file}`);
});

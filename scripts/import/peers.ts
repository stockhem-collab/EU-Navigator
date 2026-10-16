// Projects per programme for a demo municipality and its comparison group
// (lib/data/municipalities.ts) → lib/data/generated/<profile>-peers.json,
// written by scripts/import/history.ts. Same rules as the history: sure hits
// on PIC, momsnummer or organisationsnummer only; name matches are listed as
// candidates and not counted. Vinnova projects (national funding) are counted
// apart, per municipality, and never added to the EU figures.

import { readEurSekRates } from "../../lib/integrations/core/files";
import { convert } from "../../lib/integrations/core/currency";
import {
  findMunicipalityProjects,
  HISTORY_FROM,
  HistoryProject,
} from "../../lib/integrations/municipality/match";
import { findProgram } from "../../lib/data/fundingPrograms";
import { MunicipalityMatchConfig, MunicipalityProfile } from "../../lib/data/municipalities";
import { GeneratedDataset } from "../../lib/integrations/core/types";
import { findVinnovaProjects, vinnovaTotals } from "../../lib/integrations/municipality/vinnova";
import { EU_SOURCES } from "./generated";

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

export function peersFile(
  profile: MunicipalityProfile,
  all: GeneratedDataset[],
  rates: ReturnType<typeof readEurSekRates>,
) {
  const datasets = all.filter((ds) => EU_SOURCES.includes(ds.source));
  const vinnovaData = all.find((ds) => ds.source === "vinnova");
  const run = (config: MunicipalityMatchConfig, reference: boolean) => {
    const result = findMunicipalityProjects(datasets, config, rates);
    const vinnova = findVinnovaProjects(vinnovaData, config);
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
      vinnova: { ...vinnovaTotals(vinnova), projectIds: vinnova.map((p) => p.id) },
    };
  };

  return {
    generatedAt: new Date().toISOString(),
    sources: EU_SOURCES,
    nationalSources: vinnovaData ? ["vinnova"] : [],
    rules: {
      sureMatch: "PIC, momsnummer eller organisationsnummer hos en partner i projektet",
      candidates: "namnlika organisationer och projekttitlar; listas men räknas inte",
      historyFrom: HISTORY_FROM,
      amount:
        "Kommunens eget beviljade EU-bidrag: Kohesio och ESF-rådets projektbank anger hela projektets EU-bidrag (en stödmottagare), keep.eu och CORDIS kommunens partnerandel. Omräknat EUR/SEK med årssnittskurs för startåret (data/vaxelkurs.csv).",
      vinnova:
        "Vinnovaprojekt där kommunen är koordinator, på exakt namn (Vinnova anger inget organisationsnummer). Nationella bidrag i kronor, redovisas för sig.",
      caveats: profile.peerCaveats,
    },
    municipalities: [run(profile.match, true), ...profile.peers.map((m) => run(m, false))],
  };
}

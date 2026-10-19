// npm run build:reference-index — lib/data/generated/*.json →
// data/app/referensdata.json.gz, the slimmed-down copy of the imported data
// the app reads on the server (lib/imported/server.ts). Only the fields the
// app shows or matches on, descriptions shortened, organisations only as
// far as they take part in a project. Committed to the repo so a deploy or
// CI run has the data without data/raw/.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { GENERATED_DIR, ROOT } from "../../lib/integrations/core/files";
import type { IndexOrganisation, IndexPartner, IndexProject, ReferenceIndex, ReferenceProfiles } from "../../lib/imported/types";
import { municipalityProfiles } from "../../lib/data/municipalities";
import { readGenerated } from "./generated";
import { main } from "./run";

export const INDEX_FILE = path.join(ROOT, "data", "app", "referensdata.json.gz");
/** The demo municipalities' history and comparison, in a file of their own. */
export const PROFILES_FILE = path.join(ROOT, "data", "app", "kommunhistorik.json.gz");
const SUMMARY_CHARS = 450;
/** Vinnova has twice as many projects as the EU sources together; a shorter
 * summary keeps the index, and the server's first search, from doubling. */
const VINNOVA_SUMMARY_CHARS = 200;

function shorten(text: string | null | undefined, max = SUMMARY_CHARS): string | null {
  if (!text) return null;
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 40))} …`;
}

function readJson(name: string): unknown {
  const file = path.join(GENERATED_DIR, name);
  if (!fs.existsSync(file)) throw new Error(`Missing lib/data/generated/${name}. Run npm run history:all first.`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

export function buildReferenceIndex(): ReferenceIndex {
  // FTS feeds only the municipalities' history and comparison: its titles
  // are budget commitments, not project descriptions to search.
  const datasets = readGenerated().filter((ds) => ds.source !== "fts");
  const projects: IndexProject[] = [];
  const organisations: IndexOrganisation[] = [];
  const partners: IndexPartner[] = [];
  const projectIndex = new Map<string, number>();
  const orgIndex = new Map<string, number>();

  for (const ds of datasets) {
    for (const p of ds.projects) {
      // The English description is kept separately only when the source
      // also has one in another language (Kohesio, ESF). Vinnova has both
      // too, but its 20 000 projects would make the index a third larger;
      // its English title is kept.
      const hasOwnLanguage = p.sourceSystem === "kohesio" || p.sourceSystem === "esf";
      projectIndex.set(p.id, projects.length);
      projects.push({
        id: p.id,
        source: p.sourceSystem,
        programId: p.programId,
        programme: p.programmeName,
        period: p.period,
        title: p.title,
        titleEn: p.titleEn && p.titleEn !== p.title ? p.titleEn : null,
        acronym: p.acronym ?? null,
        summary: shorten(p.description, p.sourceSystem === "vinnova" ? VINNOVA_SUMMARY_CHARS : SUMMARY_CHARS),
        summaryEn: hasOwnLanguage ? shorten(p.descriptionEn) : null,
        startDate: p.startDate,
        endDate: p.endDate,
        eu: p.euContribution,
        total: p.totalBudget,
        country: p.country,
        url: p.sourceUrl,
        tags: p.tags && p.tags.length > 0 ? p.tags : undefined,
        category: p.interventionCategory ?? null,
      });
    }
    const orgsById = new Map(ds.organisations.map((o) => [o.id, o]));
    for (const link of ds.partners) {
      const pi = projectIndex.get(link.fundedProjectId);
      const org = orgsById.get(link.organisationId);
      if (pi === undefined || !org) continue;
      let oi = orgIndex.get(org.id);
      if (oi === undefined) {
        oi = organisations.length;
        orgIndex.set(org.id, oi);
        organisations.push({ id: org.id, name: org.name, type: org.organisationType, country: link.country ?? org.country });
      }
      partners.push([pi, oi, link.role]);
    }
  }

  return {
    generatedAt: new Date().toISOString(),
    sources: datasets.map((ds) => ({ source: ds.source, generatedAt: ds.generatedAt, projects: ds.projects.length })),
    projects,
    organisations,
    partners,
  };
}

export function buildProfiles(): ReferenceProfiles {
  return {
    generatedAt: new Date().toISOString(),
    profiles: Object.fromEntries(
      Object.keys(municipalityProfiles).map((id) => [
        id,
        { history: readJson(`${id}-history.json`), peers: readJson(`${id}-peers.json`) },
      ]),
    ),
  };
}

if (require.main === module) {
  main(() => {
    const index = buildReferenceIndex();
    const json = JSON.stringify(index);
    fs.mkdirSync(path.dirname(INDEX_FILE), { recursive: true });
    fs.writeFileSync(INDEX_FILE, zlib.gzipSync(json, { level: 9 }));
    const profilesJson = JSON.stringify(buildProfiles());
    fs.writeFileSync(PROFILES_FILE, zlib.gzipSync(profilesJson, { level: 9 }));
    const mb = (n: number) => `${(n / 1_000_000).toFixed(1)} MB`;
    console.log(`\n[referensindex]`);
    console.log(`  projekt        ${index.projects.length}`);
    console.log(`  organisationer ${index.organisations.length}`);
    console.log(`  partnerrader   ${index.partners.length}`);
    console.log(`  skriven fil    ${path.relative(ROOT, INDEX_FILE)} (${mb(fs.statSync(INDEX_FILE).size)}, okomprimerat ${mb(json.length)})`);
    console.log(`  skriven fil    ${path.relative(ROOT, PROFILES_FILE)} (${mb(fs.statSync(PROFILES_FILE).size)})`);
  });
}

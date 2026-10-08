// npm run import:cordis — CSVs read straight out of
// data/raw/cordis-h2020projects-csv.zip and cordis-HORIZONprojects-csv.zip
// → lib/data/generated/cordis.json
import { OrganisationRegistry, TransformResult } from "../../lib/integrations/core/build";
import { parseCsv, rawFile, readZipEntry } from "../../lib/integrations/core/files";
import { Framework, transformCordis } from "../../lib/integrations/cordis/transform";
import { finish, main } from "./run";

const ZIPS: [Framework, string][] = [
  ["H2020", "cordis-h2020projects-csv.zip"],
  ["HORIZON", "cordis-HORIZONprojects-csv.zip"],
];

main(() => {
  const organisations = new OrganisationRegistry();
  const rowsRead: Record<string, number> = {};
  const files: string[] = [];
  const combined: TransformResult = { projects: [], organisations: [], partners: [], skipped: {} };
  for (const [framework, name] of ZIPS) {
    const zip = rawFile(name);
    files.push(zip);
    const projects = parseCsv(readZipEntry(zip, "project.csv").toString("utf8"), ";");
    const orgs = parseCsv(readZipEntry(zip, "organization.csv").toString("utf8"), ";");
    rowsRead[`${name}/project.csv`] = projects.length;
    rowsRead[`${name}/organization.csv`] = orgs.length;
    const result = transformCordis(framework, projects, orgs, organisations);
    combined.projects.push(...result.projects);
    combined.partners.push(...result.partners);
    for (const [k, v] of Object.entries(result.skipped)) {
      const key = `${framework}: ${k}`;
      combined.skipped[key] = (combined.skipped[key] ?? 0) + v;
    }
  }
  combined.organisations = organisations.values();
  finish("cordis", files, rowsRead, combined);
});

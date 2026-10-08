// Shared tail of every import script: write the dataset and print the
// per-source report (rows read, written, skipped, file sizes).

import { TransformResult } from "../../lib/integrations/core/build";
import { fileInfo, printReport, writeDataset } from "../../lib/integrations/core/files";
import { ImportReport, SourceSystem } from "../../lib/integrations/core/types";

export function finish(
  source: SourceSystem,
  inputFiles: string[],
  rowsRead: Record<string, number>,
  result: TransformResult,
  extra?: Record<string, unknown>,
): ImportReport {
  const outputFile = writeDataset({
    source,
    generatedAt: new Date().toISOString(),
    projects: result.projects,
    organisations: result.organisations,
    partners: result.partners,
    ...(extra ? { extra } : {}),
  });
  const report: ImportReport = {
    source,
    inputFiles: inputFiles.map(fileInfo),
    rowsRead,
    written: {
      projects: result.projects.length,
      organisations: result.organisations.length,
      partners: result.partners.length,
    },
    skipped: result.skipped,
    outputFile,
  };
  printReport(report);
  return report;
}

export function main(run: () => Promise<unknown> | unknown): void {
  Promise.resolve()
    .then(run)
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exit(1);
    });
}

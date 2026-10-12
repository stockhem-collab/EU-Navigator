import type { Paragraph as ParagraphType, Table as TableType } from "docx";
import { FundingCall, FundingProgram, Lang, ProjectBankEntry } from "@/lib/types";
import { fmtSEK } from "@/lib/format";
import { advanceShare, CashflowAssumptions, FinancingItem, itemCashflow } from "@/lib/matching/cofinancing";

// A decision brief on co-financing ("beslutsunderlag") for one project's
// application or grant, as a .docx the EU coordinator finishes for the
// committee: proposed decision, the application's key figures, own
// financing and liquidity per year, and the risks. Same dynamically
// imported docx pattern as exportReport.ts. The figures come from the
// application's budget and the page's assumptions; the brief says so.

type Docx = typeof import("docx");
type Block = ParagraphType | TableType;

const t = (lang: Lang, sv: string, en: string) => (lang === "sv" ? sv : en);

function table(docx: Docx, header: string[], rows: string[][]): TableType {
  const { Table, TableRow, TableCell, Paragraph, TextRun, WidthType } = docx;
  const cell = (text: string, bold = false) =>
    new TableCell({ children: [new Paragraph({ children: [new TextRun({ text, bold })] })] });
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({ tableHeader: true, children: header.map((h) => cell(h, true)) }),
      ...rows.map((r) => new TableRow({ children: r.map((c) => cell(c)) })),
    ],
  });
}

export interface DecisionBriefInput {
  item: FinancingItem;
  project: ProjectBankEntry | undefined;
  call: FundingCall | undefined;
  program: FundingProgram | undefined;
  organisationName: string;
  assumptions: CashflowAssumptions;
  lang: Lang;
}

export async function buildCofinancingDecisionDocx(input: DecisionBriefInput): Promise<Blob> {
  const { item, project, call, program, organisationName: org, assumptions, lang } = input;
  const docx = await import("docx");
  const { HeadingLevel, Paragraph, TextRun } = docx;
  const h = (text: string, level: 1 | 2) => new Paragraph({ text, heading: level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2 });
  const p = (text: string) => new Paragraph({ text });
  const kr = (n: number) => fmtSEK(n, lang);
  const pct = (x: number) => `${Math.round(x * 100)} %`;

  const title = lang === "sv" ? item.title_sv : item.title_en;
  const callTitle = call ? (lang === "sv" ? call.title_sv : call.title_en) : "";
  const programName = program ? (lang === "sv" ? program.name_sv : program.name) : "";
  const rows = itemCashflow(item, assumptions);
  const peak = rows.reduce((best, r) => (r.exposureSEK > best.exposureSEK ? r : best), rows[0]);
  const fundingShare = item.totalCostSEK > 0 ? item.grantSEK / item.totalCostSEK : 0;
  const period = `${item.startYear}–${item.endYear}`;
  const ownPerYear = rows.filter((r) => r.ownSEK > 0);

  const blocks: Block[] = [
    new Paragraph({ text: t(lang, `Beslutsunderlag: medfinansiering av ${title}`, `Decision brief: co-financing of ${title}`), heading: HeadingLevel.TITLE }),
    new Paragraph({
      children: [
        new TextRun({
          text: t(
            lang,
            `Utkast exporterat ${new Date().toLocaleDateString("sv-SE")} från EU Navigator. Beloppen bygger på ansökans budget och antagandena i underlaget; kontrollera mot ansökan och bidragsavtalet innan beslut.`,
            `Draft exported ${new Date().toLocaleDateString("en-GB")} from EU Navigator. The amounts follow the application's budget and the brief's assumptions; check against the application and the grant agreement before deciding.`
          ),
          italics: true,
          color: "5B8BBB",
          size: 18,
        }),
      ],
    }),
    p(""),

    h(t(lang, "Förslag till beslut", "Proposed decision"), 1),
    p(
      item.stage === "awarded"
        ? t(
            lang,
            `Att ${org} medfinansierar projektet ${title} med högst ${kr(item.ownSEK)} under åren ${period}, fördelat enligt tabellen nedan.`,
            `That ${org} co-finances the project ${title} with at most ${kr(item.ownSEK)} over ${period}, divided as in the table below.`
          )
        : t(
            lang,
            `Att ${org} ansöker om ${kr(item.grantSEK)} från ${programName || "programmet"} för projektet ${title}, och vid beviljat bidrag medfinansierar projektet med högst ${kr(item.ownSEK)} under åren ${period}, fördelat enligt tabellen nedan.`,
            `That ${org} applies for ${kr(item.grantSEK)} from ${programName || "the programme"} for the project ${title} and, if awarded, co-finances it with at most ${kr(item.ownSEK)} over ${period}, divided as in the table below.`
          )
    ),

    h(t(lang, "Sammanfattning", "Summary"), 1),
    table(docx, [t(lang, "Uppgift", "Item"), t(lang, "Värde", "Value")], [
      [t(lang, "Program", "Programme"), programName || "–"],
      [t(lang, "Utlysning", "Call"), callTitle || "–"],
      ...(call?.deadlineDate ? [[t(lang, "Sista ansökningsdag", "Deadline"), call.deadlineDate]] : []),
      [t(lang, "Projektperiod", "Project period"), period],
      [t(lang, "Total budget", "Total budget"), kr(item.totalCostSEK)],
      [item.stage === "awarded" ? t(lang, "Beviljat bidrag", "Grant awarded") : t(lang, "Sökt bidrag", "Grant applied for"), kr(item.grantSEK)],
      [t(lang, "Bidragets andel av budgeten", "Grant share of the budget"), pct(fundingShare)],
      [t(lang, "Egen medfinansiering", "Own co-financing"), kr(item.ownSEK)],
      [t(lang, "Bidraget betalas i", "Grant paid in"), item.currency === "EUR" ? "EUR" : "SEK"],
    ]),
  ];

  const description = project ? (lang === "sv" ? project.description_sv : project.description_en) : "";
  if (description.trim()) {
    blocks.push(h(t(lang, "Bakgrund", "Background"), 1));
    for (const para of description.split(/\n+/).filter((x) => x.trim())) blocks.push(p(para));
  }

  blocks.push(h(t(lang, "Ekonomiska konsekvenser", "Financial consequences"), 1));
  blocks.push(
    table(
      docx,
      [
        t(lang, "År", "Year"),
        t(lang, "Kostnad", "Cost"),
        t(lang, "Egen medfinansiering", "Own co-financing"),
        t(lang, "Utbetalt bidrag", "Grant received"),
        t(lang, "Utlagt vid årets slut", "Paid out at year end"),
      ],
      rows.map((r) => [String(r.year), kr(r.costSEK), kr(r.ownSEK), kr(r.grantReceivedSEK), kr(r.exposureSEK)])
    )
  );
  blocks.push(
    p(
      t(
        lang,
        `Medfinansieringen behöver rymmas i budgeten för ${ownPerYear.map((r) => r.year).join(", ")}. Egen insats i form av personaltid räknas med i beloppet.`,
        `The co-financing has to fit in the budget for ${ownPerYear.map((r) => r.year).join(", ")}. Own contribution in staff time is included in the amount.`
      )
    )
  );

  blocks.push(h(t(lang, "Likviditet och risker", "Liquidity and risks"), 1));
  blocks.push(
    p(
      t(
        lang,
        `Bidraget antas betalas ut med ${pct(advanceShare(item, assumptions))} i förskott och resten ${assumptions.paymentLagYears} år efter att kostnaderna har upparbetats. ${org} ligger därmed som mest ute med ${kr(Math.max(0, peak?.exposureSEK ?? 0))} (vid utgången av ${peak?.year ?? item.endYear}).`,
        `The grant is assumed to be paid with ${pct(advanceShare(item, assumptions))} in advance and the rest ${assumptions.paymentLagYears} year(s) after the costs are incurred. ${org} is therefore at most ${kr(Math.max(0, peak?.exposureSEK ?? 0))} out of pocket (end of ${peak?.year ?? item.endYear}).`
      )
    )
  );
  if (item.currency === "EUR") {
    blocks.push(
      p(
        t(
          lang,
          `Bidraget betalas i euro. En kursändring på ${pct(assumptions.fxShock)} motsvarar ${kr(item.grantSEK * assumptions.fxShock)}.`,
          `The grant is paid in euro. An exchange-rate change of ${pct(assumptions.fxShock)} corresponds to ${kr(item.grantSEK * assumptions.fxShock)}.`
        )
      )
    );
  }
  blocks.push(
    p(
      t(
        lang,
        "Kostnader som underkänns vid kontroll eller revision betalas av organisationen. Risken minskar med tidredovisning, upphandling enligt LOU och sparade underlag från start.",
        "Costs rejected at a check or audit are paid by the organisation. The risk is reduced by time records, public procurement and records kept from the start."
      )
    )
  );

  return docx.Packer.toBlob(new docx.Document({ sections: [{ children: blocks }] }));
}

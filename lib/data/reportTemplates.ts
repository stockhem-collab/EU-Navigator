import type { CallTemplate } from "../types";
import { ESF_COST_CATEGORIES, HE_COST_CATEGORIES } from "./costCategories";
import { ESF_REPORT_REQUIREMENTS, HE_REPORT_REQUIREMENTS } from "./reportRequirements";

// The funders' report forms, shared by every call that uses them, like the
// application forms in callTemplates.ts. A call points to one through the
// call list's Rapportmall column (FundingCall.reportTemplateId); the grant's
// reports (/stod/[id]) then follow its sections, show what the application
// promised beside them, declare costs per the form's cost categories and
// export the way the funder takes the report in.

/** Horizon Europe's periodic report, Part B (the technical report), used
 * for every periodic report and the final one. Part A (deliverables,
 * milestones, publications, indicators) and the financial statements are
 * filled in directly in the portal. */
const HE_PERIODIC_REPORT: CallTemplate = {
  id: "he-periodic-report",
  kind: "report",
  requirements: HE_REPORT_REQUIREMENTS,
  format: "docx",
  language: "en",
  title_sv: "Horisont Europa – periodisk rapport, Part B (teknisk rapport)",
  title_en: "Horizon Europe – periodic report, Part B (technical report)",
  version: "V1.1 – 01.05.2023",
  sourceUrl: "https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/common/temp-form/report/periodic-report_horizon-euratom_en.pdf",
  submittedIn: "Funding & Tenders Portal",
  currency: "EUR",
  costCategories: HE_COST_CATEGORIES,
  formatting_sv: "Ingen sidgräns per arbetspaket, men rapporten ska vara kortfattad. Upprepa inte det som redan står i Part A.",
  formatting_en: "No page limit per work package, but the report should be concise. Don't repeat what is already in Part A.",
  note_sv:
    "Part B laddas ner från portalens sida för den tekniska rapporten och laddas upp som PDF. Part A och de ekonomiska rapporterna (financial statements) fylls i direkt i portalen; kostnaderna här är underlag för dem.",
  note_en:
    "Part B is downloaded from the portal's Technical Report screen and uploaded as PDF. Part A and the financial statements are filled in directly in the portal; the costs here are the basis for them.",
  sections: [
    {
      key: "he-r-1.1",
      number: "1.1",
      group: { number: "1", label_sv: "Genomfört arbete och lägesöversikt", label_en: "Explanation of the work carried out and overview of the progress" },
      label_sv: "Mål",
      label_en: "Objectives",
      fromApplication: ["he-1.1"],
      instructions_sv: [
        "Lista projektets specifika mål enligt avsnitt 1.1 i projektbeskrivningen (DoA) och sammanfatta hur långt ni kommit mot vart och ett.",
        "Lyft fram viktiga aktiviteter, med tydliga och mätbara uppgifter. Redovisa mål som inte nåtts fullt ut eller ligger efter tidplanen.",
      ].join("\n"),
      instructions_en: [
        "List the specific objectives of the project as described in section 1.1 of the DoA and give a short summary of progress towards each of them.",
        "Highlight significant activities, with clear and measurable details. Report on objectives not fully achieved or not on schedule.",
      ].join("\n"),
    },
    {
      key: "he-r-1.2",
      number: "1.2",
      group: { number: "1", label_sv: "Genomfört arbete och lägesöversikt", label_en: "Explanation of the work carried out and overview of the progress" },
      label_sv: "Genomfört arbete per arbetspaket",
      label_en: "Explanation of the work carried out per WP",
      fromApplication: ["he-3.1"],
      instructions_sv: "Beskriv per arbetspaket vad som gjorts under perioden och vad varje stödmottagare och anknuten enhet har bidragit med.",
      instructions_en: "Explain the work carried out in each work package during the reporting period, giving details of the work carried out by each beneficiary/affiliated entity involved.",
      tables: [
        {
          key: "he-r-1.2-wp",
          title_sv: "Arbetspaket under perioden",
          title_en: "Work carried out per work package",
          columns_sv: ["Arbetspaket", "Titel", "Genomfört arbete (per stödmottagare)"],
          columns_en: ["Work package", "Title", "Work carried out (per beneficiary)"],
          note_sv: "Exporteras som underrubrikerna 1.2.1, 1.2.2 … i Part B.",
          note_en: "Exported as the subheadings 1.2.1, 1.2.2 … of Part B.",
          fromApplicationTable: { key: "he-3.1a", columns: [0, 1] },
          docx: { mode: "repeat" },
        },
      ],
    },
    {
      key: "he-r-1.3",
      number: "1.3",
      group: { number: "1", label_sv: "Genomfört arbete och lägesöversikt", label_en: "Explanation of the work carried out and overview of the progress" },
      label_sv: "Effekt",
      label_en: "Impact",
      fromApplication: ["he-2.1"],
      instructions_sv: [
        "Beskriv hur projektet hittills har bidragit till den vetenskapliga effekten och till ekonomiska, samhälleliga eller industriella effekter.",
        "Redovisa ändringar mot de förväntade effekterna i projektbeskrivningen och vad de betyder för projektet. Ange vid behov utgångsvärden, jämförelser och antaganden.",
      ].join("\n"),
      instructions_en: [
        "Describe the progress of the project so far towards delivering scientific impact, and impact in the scientific, economic, societal or industrial fields as applicable.",
        "Report on changes to the expected impacts presented in your DoA and their effects on the project. Where necessary, give baselines, benchmarks and assumptions.",
      ].join("\n"),
    },
    {
      key: "he-r-1.4",
      number: "1.4",
      group: { number: "1", label_sv: "Genomfört arbete och lägesöversikt", label_en: "Explanation of the work carried out and overview of the progress" },
      label_sv: "Uppdaterad plan för spridning och nyttiggörande",
      label_en: "Update of the plan for exploitation and dissemination of results",
      required: false,
      fromApplication: ["he-2.2"],
      instructions_sv: "Ändringar i planen för spridning och nyttiggörande av resultaten, om några.",
      instructions_en: "Any updates to the plan for exploitation and dissemination of results, with details (if applicable).",
    },
    {
      key: "he-r-2",
      number: "2",
      label_sv: "Uppföljning av rekommendationer från tidigare granskningar",
      label_en: "Follow-up of recommendations and comments from previous review(s)",
      required: false,
      instructions_sv: "Om och hur varje rekommendation från tidigare granskningar eller projekthandläggaren har hanterats.",
      instructions_en: "Explain if and how each recommendation from previous reviews and/or the Project Officer's assessment has been addressed (if applicable).",
      tables: [
        {
          key: "he-r-2-recommendations",
          title_sv: "Rekommendationer",
          title_en: "Recommendations",
          columns_sv: ["Rekommendation", "Hur den har hanterats"],
          columns_en: ["Recommendation", "How it has been addressed"],
        },
      ],
    },
    {
      key: "he-r-3",
      number: "3",
      label_sv: "Nyttiggörande främst i icke-associerade tredjeländer",
      label_en: "Exploitation primarily in non-associated third countries",
      required: false,
      instructions_sv: "Motivera varför nyttiggörandet ändå ligger i EU:s intresse (om tillämpligt).",
      instructions_en: "Justify how this exploitation is still in the interest of the EU (if applicable).",
    },
    {
      key: "he-r-4",
      number: "4",
      label_sv: "Öppen vetenskap",
      label_en: "Open science",
      fromApplication: ["he-1.2"],
      instructions_sv: [
        "Beskriv hur forskningen delats tidigt och öppet (t.ex. förregistrering, preprints, crowdsourcing).",
        "Beskriv vad som säkerställer att resultaten går att återskapa med samma data och metoder.",
      ].join("\n"),
      instructions_en: [
        "Describe the open science practices related to early and open sharing of research (e.g. pre-registration, registered reports, pre-prints or crowd-sourcing).",
        "Describe the concrete measures that ensure the reproducibility of the results obtained during the action.",
      ].join("\n"),
    },
    {
      key: "he-r-5.1",
      number: "5.1",
      group: { number: "5", label_sv: "Avvikelser från bilaga 1 och 2", label_en: "Deviations from Annex 1 and Annex 2 (if applicable)" },
      label_sv: "Uppgifter och mål",
      label_en: "Tasks/objectives",
      required: false,
      instructions_sv:
        "Förklara uppgifter som inte genomförts fullt ut och kritiska mål som inte nåtts eller ligger efter tidplanen, varför, följderna för andra uppgifter, resurser och planering, och vilka åtgärder ni föreslår.",
      instructions_en:
        "Explain the reasons for deviations from the DoA, their consequences and the proposed corrective actions: tasks not fully implemented, critical objectives not fully achieved or not on schedule, and the impact on other tasks, the available resources and the planning.",
    },
    {
      key: "he-r-5.2",
      number: "5.2",
      group: { number: "5", label_sv: "Avvikelser från bilaga 1 och 2", label_en: "Deviations from Annex 1 and Annex 2 (if applicable)" },
      label_sv: "Resursanvändning",
      label_en: "Use of resources",
      required: false,
      instructions_sv: [
        "Förklara skillnader mellan faktisk och planerad resursanvändning, särskilt personmånader per arbetspaket, och eventuella omfördelningar mellan kostnadsslag. Gäller inte klumpsummeprojekt.",
        "Oförutsedda underleverantörer: uppgifterna, varför de behövdes, att leverantören valts för bästa värde utan intressekonflikt, namn och belopp.",
        "Oförutsedda bidrag i natura från tredje part: vem, vilka resurser och varför de behövdes.",
      ].join("\n"),
      instructions_en: [
        "Explain deviations between actual and planned use of resources in Annex 1, especially person-months per work package, and any transfers between cost categories. Not applicable to lump sums.",
        "Unforeseen subcontracting: the tasks, why it was needed, confirmation that the subcontractor was selected for best value for money without conflict of interest, name and amount.",
        "Unforeseen use of in-kind contributions: the third party, the resources made available and why they were needed.",
      ].join("\n"),
      tables: [
        {
          key: "he-r-5.2.1",
          title_sv: "5.2.1 Oförutsedda underleverantörer",
          title_en: "5.2.1 Unforeseen subcontracting",
          columns_sv: ["Underleverantör", "Uppgifter", "Varför det behövdes", "Hur leverantören valdes", "Belopp (EUR)"],
          columns_en: ["Subcontractor", "Tasks performed", "Why it was needed", "How the subcontractor was selected", "Amount (EUR)"],
        },
        {
          key: "he-r-5.2.2",
          title_sv: "5.2.2 Oförutsedda bidrag i natura",
          title_en: "5.2.2 Unforeseen use of in-kind contributions",
          columns_sv: ["Tredje part", "Resurser (mot betalning eller kostnadsfritt)", "Varför de behövdes"],
          columns_en: ["Third party", "Resources made available (against payment or free of charge)", "Why they were needed"],
        },
      ],
    },
  ],
};

/** ESF+'s quarterly report (kvartalsrapport) and final report
 * (slutrapport), written in Projektrummet+. ESF-rådet's general conditions
 * (allmänna beslutsvillkor, nr 11, 9.1 and 3.1) require a quarterly report
 * every three months and a final report with the last payment application;
 * costs are declared per kostnadsslag in the payment application. */
const ESF_REPORT: CallTemplate = {
  id: "esf-rapport",
  kind: "report",
  requirements: ESF_REPORT_REQUIREMENTS,
  format: "web-form",
  language: "sv",
  title_sv: "ESF+ – kvartalsrapport och slutrapport i Projektrummet+",
  title_en: "ESF+ – quarterly report and final report in Projektrummet+",
  version: "Allmänna beslutsvillkor nr 11",
  sourceUrl: "https://www.esf.se/att-driva-projekt/handledning-i-projektekonomi/",
  submittedIn: "Projektrummet+",
  currency: "SEK",
  costCategories: ESF_COST_CATEGORIES,
  note_sv:
    "Kvartalsrapporten lämnas var tredje månad och slutrapporten med den sista ansökan om utbetalning. Frågorna i Projektrummet+ är inte publika; avsnitten här bygger på beslutsvillkoren och urvalskriterierna, så stäm av mot formuläret. Kostnaderna redovisas per kostnadsslag i ansökan om utbetalning.",
  note_en:
    "The quarterly report is due every three months and the final report with the last payment application. The questions in Projektrummet+ aren't public; the sections here follow the decision conditions and the selection criteria, so check them against the form. Costs are declared per cost category in the payment application.",
  sections: [
    {
      key: "esf-r-summary",
      number: "1",
      label_sv: "Sammanfattning av projektet",
      label_en: "Summary of the project",
      reportTypes: ["final"],
      instructions_sv: "Vad projektet gjorde, för vem och vad det ledde till, i några stycken.",
      instructions_en: "What the project did, for whom and what it led to, in a few paragraphs.",
    },
    {
      key: "esf-r-activities",
      number: "2",
      label_sv: "Genomförda aktiviteter",
      label_en: "Activities carried out",
      fromApplication: ["esf-methods"],
      instructions_sv: "Vad som gjorts under perioden jämfört med aktivitets- och tidplanen i beslutet.",
      instructions_en: "What was done during the period compared with the activity plan and timetable in the decision.",
    },
    {
      key: "esf-r-participants",
      number: "3",
      label_sv: "Deltagare",
      label_en: "Participants",
      instructions_sv:
        "Antal individer som deltagit under perioden, uppdelat på kvinnor och män, och antal unika deltagare sedan projektstart. Deltagaruppgifterna rapporteras också till SCB enligt ESF-rådets anvisningar.",
      instructions_en:
        "The number of individuals who took part during the period, split by women and men, and the number of unique participants since the project started. Participant data is also reported to Statistics Sweden as ESF-rådet instructs.",
      tables: [
        {
          key: "esf-r-participants-count",
          title_sv: "Deltagare",
          title_en: "Participants",
          columns_sv: ["Kvinnor under perioden", "Män under perioden", "Unika deltagare sedan start"],
          columns_en: ["Women during the period", "Men during the period", "Unique participants since the start"],
        },
      ],
    },
    {
      key: "esf-r-results",
      number: "4",
      label_sv: "Resultat i förhållande till målen",
      label_en: "Results against the objectives",
      fromApplication: ["esf-goals", "esf-expected-results"],
      instructions_sv: "Hur projektet ligger till mot målen och de förväntade resultaten i ansökan, med siffror där det går.",
      instructions_en: "How the project stands against the objectives and expected results in the application, with figures where possible.",
    },
    {
      key: "esf-r-deviations",
      number: "5",
      label_sv: "Avvikelser från beslut och plan",
      label_en: "Deviations from the decision and plan",
      instructions_sv: "Förseningar, ändrade aktiviteter, målgrupp eller budget, och vad ni gör åt dem. Större ändringar kräver en ansökan om ändring.",
      instructions_en: "Delays, changed activities, target group or budget, and what you're doing about them. Major changes require an application for change.",
    },
    {
      key: "esf-r-horizontal",
      number: "6",
      label_sv: "Jämställdhet, tillgänglighet och icke-diskriminering",
      label_en: "Gender equality, accessibility and non-discrimination",
      fromApplication: ["esf-problem"],
      instructions_sv: "Hur projektet har arbetat med de utmaningar som problemanalysen pekade ut.",
      instructions_en: "How the project has worked with the challenges the problem analysis identified.",
    },
    {
      key: "esf-r-next",
      number: "7",
      label_sv: "Plan för nästa kvartal",
      label_en: "Plan for the next quarter",
      reportTypes: ["interim"],
      instructions_sv: "Vad som ska göras fram till nästa kvartalsrapport.",
      instructions_en: "What will be done until the next quarterly report.",
    },
    {
      key: "esf-r-lessons",
      number: "7",
      label_sv: "Lärdomar och spridning",
      label_en: "Lessons learnt and dissemination",
      reportTypes: ["final"],
      instructions_sv: "Vad ni har lärt er, vad som fungerade och inte, och hur lärdomarna har spridits. Bifoga utvärderingen om projektet har haft en.",
      instructions_en: "What you have learnt, what worked and what didn't, and how the lessons have been shared. Attach the evaluation if the project had one.",
    },
    {
      key: "esf-r-ownership",
      number: "8",
      label_sv: "Hur resultaten tas till vara",
      label_en: "How the results are taken forward",
      reportTypes: ["final"],
      fromApplication: ["esf-anchoring"],
      instructions_sv: "Vem som äger och förvaltar resultaten efter projektet, och vad som implementeras i ordinarie verksamhet.",
      instructions_en: "Who owns and maintains the results after the project, and what is implemented in regular operations.",
    },
  ],
};

export const reportTemplates: CallTemplate[] = [HE_PERIODIC_REPORT, ESF_REPORT];

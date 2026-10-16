import type { CallTemplate, FundingCall } from "../types";

// The funders' application forms, shared by every call that uses them — a
// form follows the programme and type of action, not the single call. A
// call from the call list points to one through its Ansökningsmall column
// (FundingCall.applicationTemplateId); the Ansökningsstudio then shows the
// form's sections, instructions, limits and tables, and exports the
// application the way the funder takes it in (see lib/export/).
//
// Read from the funders' own documents; the source files are kept in the
// project's shared folder under mallar/. A call-specific form downloaded in
// the funder's submission system may differ slightly — the funder's text
// for the call always wins.

const HE_RIA_IA: CallTemplate = {
  id: "he-ria-ia-part-b",
  format: "docx",
  language: "en",
  title_sv: "Horisont Europa RIA/IA – Part B (teknisk beskrivning)",
  title_en: "Horizon Europe RIA/IA – Part B (technical description)",
  version: "V5.1 – 22.01.2026",
  sourceUrl: "https://ec.europa.eu/info/funding-tenders/opportunities/docs/2021-2027/horizon/temp-form/af/af_he-ria-ia_en.pdf",
  submittedIn: "Funding & Tenders Portal",
  pageLimit: 40,
  pageLimitAlternative: { pages: 45, when_sv: "ämnen med klumpsumma", when_en: "lump-sum topics" },
  formatting_sv: "Titel, deltagarlista och avsnitt 1–3 räknas, inklusive tabeller och figurer. Times New Roman minst 11 pt, enkelt radavstånd, A4, marginaler minst 15 mm.",
  formatting_en: "Title, list of participants and sections 1–3 count, including tables and figures. Times New Roman at least 11 pt, single line spacing, A4, margins at least 15 mm.",
  participantsList: true,
  note_sv: "Part A (deltagare, budgettabell, etik) fylls i som webbformulär i portalen och ingår inte här.",
  note_en: "Part A (participants, budget table, ethics) is filled in as web forms in the portal and isn't part of this.",
  evaluationCriteria: [
    { name_sv: "Excellens", name_en: "Excellence", maxPoints: 5 },
    { name_sv: "Effekt", name_en: "Impact", maxPoints: 5 },
    { name_sv: "Kvalitet och effektivitet i genomförandet", name_en: "Quality and efficiency of the implementation", maxPoints: 5 },
  ],
  sections: [
    {
      key: "he-1.1",
      number: "1.1",
      group: { number: "1", label_sv: "Excellens", label_en: "Excellence" },
      label_sv: "Mål och ambition",
      label_en: "Objectives and ambition",
      criterion_sv: "Excellens",
      criterion_en: "Excellence",
      indicativePages: 4,
      instructions_sv: [
        "Beskriv målen kort. Varför är de relevanta för ämnet i arbetsprogrammet? Är de mätbara, verifierbara och realistiska?",
        "Beskriv hur projektet går bortom kunskapsläget (state of the art) och hur ambitiöst det är: nya begrepp, produkter, tjänster eller affärs- och organisationsmodeller.",
        "Placera arbetet på skalan från idé till tillämpning; ange TRL vid start och slut där det är relevant.",
      ].join("\n"),
      instructions_en: [
        "Briefly describe the objectives of your proposed work. Why are they pertinent to the work programme topic? Are they measurable and verifiable? Are they realistically achievable?",
        "Describe how your project goes beyond the state of the art, and the extent the proposed work is ambitious (novel concepts and approaches, new products, services or business and organisational models).",
        "Describe where the proposed work is positioned in terms of R&I maturity; where applicable, indicate the Technology Readiness Level at the start and by the end of the project.",
      ].join("\n"),
    },
    {
      key: "he-1.2",
      number: "1.2",
      group: { number: "1", label_sv: "Excellens", label_en: "Excellence" },
      label_sv: "Metod",
      label_en: "Methodology",
      criterion_sv: "Excellens",
      criterion_en: "Excellence",
      indicativePages: 14,
      instructions_sv: [
        "Övergripande metod, begrepp, modeller och antaganden, utmaningar och hur de hanteras (ca 10 sidor, löptext; uppgifter och arbetspaket beskrivs i 3.1).",
        "Nationella eller internationella FoI-aktiviteter vars resultat används i projektet (ca 1 sida).",
        "Hur olika discipliner integreras, eller varför det inte behövs (ca ½ sida).",
        "Samhällsvetenskapens och humanioras roll, när arbetsprogrammet kräver det (ca ½ sida).",
        "Genusdimensionen i forskningens innehåll, eller motivering om den inte är relevant (ca 1 sida). Obligatoriskt om inte ämnet undantar det.",
        "Öppen vetenskap som del av metoden, eller motivering (ca 1 sida). En datahanteringsplan (DMP) är en leverans senast månad 6.",
      ].join("\n"),
      instructions_en: [
        "Describe and explain the overall methodology, including the concepts, models and assumptions; refer to important challenges and how you intend to overcome them (e.g. 10 pages, narrative; tasks and work packages go under 'Implementation').",
        "Describe any national or international R&I activities whose results will feed into the project, and how (e.g. 1 page).",
        "Explain how expertise and methods from different disciplines will be integrated, or justify why not (e.g. 1/2 page).",
        "Where the work programme asks for it, show the role of social sciences and humanities (e.g. 1/2 page).",
        "Describe how the gender dimension is taken into account in the R&I content, or justify why it is not relevant (e.g. 1 page). Mandatory unless the topic exempts it.",
        "Describe how appropriate open science practices are implemented as part of the methodology, or justify (e.g. 1 page). A data management plan (DMP) is a deliverable by month 6.",
      ].join("\n"),
    },
    {
      key: "he-2.1",
      number: "2.1",
      group: { number: "2", label_sv: "Effekt", label_en: "Impact" },
      label_sv: "Projektets väg till effekt",
      label_en: "Project's pathways towards impact",
      criterion_sv: "Effekt",
      criterion_en: "Impact",
      indicativePages: 3,
      instructions_sv: [
        "Projektresultatens unika bidrag till (1) ämnets förväntade resultat och (2) destinationens bredare effekter på längre sikt. Kvantifiera där det går och ange konkreta målgrupper.",
        "Förutsättningar och hinder utanför projektet (annan forskning, regelverk, marknad, användarbeteende) och hur de möts. Genomföranderisker hör till 3.1.",
      ].join("\n"),
      instructions_en: [
        "Describe the unique contribution your project results would make towards (1) the outcomes specified in this topic, and (2) the wider impacts specified in the respective destination. Provide quantified estimates where possible and state the target groups that would benefit.",
        "Describe any requirements and potential barriers arising from factors beyond the scope and duration of the project (other R&I work, regulatory environment, markets, user behaviour), and any mitigating measures. Project-management risks go under 'Implementation'.",
      ].join("\n"),
    },
    {
      key: "he-2.2",
      number: "2.2",
      group: { number: "2", label_sv: "Effekt", label_en: "Impact" },
      label_sv: "Åtgärder för största effekt – spridning, nyttiggörande och kommunikation",
      label_en: "Measures to maximise impact - Dissemination, exploitation and communication",
      criterion_sv: "Effekt",
      criterion_en: "Impact",
      indicativePages: 3,
      instructions_sv: [
        "Första versionen av planen för spridning, nyttiggörande och kommunikation: åtgärder och målgrupper. Planen är ett formellt krav om inte ämnet säger annat.",
        "Kommunikation: budskap, verktyg och kanaler per målgrupp under hela projektet.",
        "Konkreta åtgärder under och efter projektet; för innovationsprojekt vägen till kommersialisering; återkoppling till politiken.",
        "Strategi för immateriella rättigheter och hur de stöder nyttiggörandet.",
      ].join("\n"),
      instructions_en: [
        "Provide a first version of your 'plan for the dissemination and exploitation including communication activities': the measures and the target groups addressed. The plan is an admissibility condition unless the topic states otherwise.",
        "Communication measures: main messages, tools and channels for each target group, throughout the project.",
        "Concrete actions during and after the project; for innovation actions, a plausible path to commercialisation; possible feedback to policy.",
        "Outline your strategy for the management of intellectual property and how it supports exploitation.",
      ].join("\n"),
    },
    {
      key: "he-2.3",
      number: "2.3",
      group: { number: "2", label_sv: "Effekt", label_en: "Impact" },
      label_sv: "Sammanfattning (frivillig)",
      label_en: "Summary (optional)",
      criterion_sv: "Effekt",
      criterion_en: "Impact",
      required: false,
      instructions_sv: "Översikt över effektavsnittet i tabellen nedan. Lämna tomt om avsnittet inte används, så tas det bort ur exporten.",
      instructions_en: "Summarise the key elements of the impact section in the canvas below. Leave it empty if not used and it is left out of the export.",
      tables: [
        {
          key: "he-2.3-canvas",
          title_sv: "Effektöversikt",
          title_en: "Key elements of the impact section",
          columns_sv: ["Särskilda behov", "Förväntade resultat", "Spridning, nyttiggörande, kommunikation", "Målgrupper", "Resultat (outcomes)", "Effekter (impacts)"],
          columns_en: ["Specific needs", "Expected results", "D & E & C measures", "Target groups", "Outcomes", "Impacts"],
        },
      ],
    },
    {
      key: "he-3.1",
      number: "3.1",
      group: { number: "3", label_sv: "Kvalitet och effektivitet i genomförandet", label_en: "Quality and efficiency of the implementation" },
      label_sv: "Arbetsplan och resurser",
      label_en: "Work plan and resources",
      criterion_sv: "Kvalitet och effektivitet i genomförandet",
      criterion_en: "Quality and efficiency of the implementation",
      indicativePages: 12,
      instructions_sv: [
        "Kort om arbetsplanens upplägg, tidplan (Gantt) och hur delarna hänger ihop (Pert). Bifoga diagrammen i Word efter exporten.",
        "Fyll i tabellerna 3.1a–3.1h nedan med ren text. Ha ett arbetspaket för projektledning och synliggör datahantering, spridning och kommunikation.",
        "Uppgifterna måste stämma med budgettabellen i Part A och personmånaderna i arbetspaketen. Indikativt 12 sidor (17 för ämnen med klumpsumma) inklusive tabeller.",
      ].join("\n"),
      instructions_en: [
        "Brief presentation of the overall structure of the work plan; timing of the work packages (Gantt chart or similar); how the components inter-relate (Pert chart or similar).",
        "Detailed work description in tables 3.1a–3.1h, in plain text. Include a work package on project management and give visibility to data management, dissemination and exploitation, and communication.",
        "Make sure the information matches the budget table in Part A and the person-months in the work package descriptions. E.g. 12 pages (17 for lump-sum topics) including tables.",
      ].join("\n"),
      tables: [
        {
          key: "he-3.1a",
          title_sv: "Tabell 3.1a: Arbetspaket",
          title_en: "Table 3.1a: List of work packages",
          columns_sv: ["Nr", "Arbetspaket", "Ansvarig deltagare nr", "Ansvarig deltagare (kortnamn)", "Personmånader", "Startmånad", "Slutmånad"],
          columns_en: ["Work package No", "Work package title", "Lead participant No", "Lead participant short name", "Person-months", "Start month", "End month"],
        },
        {
          key: "he-3.1b",
          title_sv: "Tabell 3.1b: Beskrivning av arbetspaket",
          title_en: "Table 3.1b: Work package description",
          columns_sv: ["Nr", "Arbetspaket", "Mål", "Arbetsbeskrivning (uppgifter, ansvarig, deltagarnas roller, kvantifierad insats)"],
          columns_en: ["Work package number", "Work package title", "Objectives", "Description of work"],
          note_sv: "En rad per arbetspaket.",
          note_en: "One row per work package.",
        },
        {
          key: "he-3.1c",
          title_sv: "Tabell 3.1c: Leveranser",
          title_en: "Table 3.1c: List of deliverables",
          columns_sv: ["Nr (AP.nr)", "Leverans", "Arbetspaket", "Ansvarig (kortnamn)", "Typ", "Spridningsnivå", "Månad"],
          columns_en: ["Deliverable No", "Deliverable name", "Work package No", "Lead participant short name", "Type", "Dissemination level", "Delivery date (in months)"],
          note_sv: "Typ: R, DEM, DEC, DATA, DMP, ETHICS, SECURITY eller OTHER. Spridningsnivå: PU eller SEN. DMP och spridningsplan ska vara leveranser inom sex månader.",
          note_en: "Type: R, DEM, DEC, DATA, DMP, ETHICS, SECURITY or OTHER. Dissemination level: PU or SEN. The DMP and the dissemination and exploitation plan must be deliverables within the first 6 months.",
        },
        {
          key: "he-3.1d",
          title_sv: "Tabell 3.1d: Milstolpar",
          title_en: "Table 3.1d: List of milestones",
          columns_sv: ["Nr", "Milstolpe", "Arbetspaket", "Månad", "Hur det verifieras"],
          columns_en: ["Milestone number", "Milestone name", "Related work package(s)", "Due date (in month)", "Means of verification"],
        },
        {
          key: "he-3.1e",
          title_sv: "Tabell 3.1e: Kritiska risker i genomförandet",
          title_en: "Table 3.1e: Critical risks for implementation",
          columns_sv: ["Risk (sannolikhet och allvar: låg/medel/hög)", "Arbetspaket", "Åtgärder"],
          columns_en: ["Description of risk (likelihood and severity: Low/Medium/High)", "Work package(s) involved", "Proposed risk-mitigation measures"],
        },
        {
          key: "he-3.1f",
          title_sv: "Tabell 3.1f: Personmånader",
          title_en: "Table 3.1f: Summary of staff effort",
          columns_sv: ["Deltagare (nr/kortnamn)", "Personmånader per arbetspaket", "Totalt"],
          columns_en: ["Participant Number/Short Name", "Person-months per work package", "Total Person-Months per Participant"],
          note_sv: "Ange personmånader per arbetspaket, t.ex. \"AP1: 6, AP2: 12\".",
          note_en: "List the person-months per work package, e.g. \"WP1: 6, WP2: 12\".",
        },
        {
          key: "he-3.1g",
          title_sv: "Tabell 3.1g: Underleverantörer",
          title_en: "Table 3.1g: 'Subcontracting costs' items",
          columns_sv: ["Deltagare", "Kostnad (€)", "Uppgifter och motivering"],
          columns_en: ["Participant Number/Short Name", "Cost (€)", "Description of tasks and justification"],
          note_sv: "Kärnuppgifter i projektet ska inte läggas på underleverantörer.",
          note_en: "Core tasks of the project should not be subcontracted.",
        },
        {
          key: "he-3.1h",
          title_sv: "Tabell 3.1h: Inköp av utrustning",
          title_en: "Table 3.1h: 'Purchase costs' items (major equipment costs)",
          columns_sv: ["Deltagare", "Kostnad (€)", "Motivering"],
          columns_en: ["Participant Number/Short Name", "Cost (€)", "Justification"],
          note_sv: "Bara när utrustningen överstiger 15 % av deltagarens personalkostnader.",
          note_en: "Only where equipment costs exceed 15% of the participant's personnel costs.",
        },
      ],
    },
    {
      key: "he-3.2",
      number: "3.2",
      group: { number: "3", label_sv: "Kvalitet och effektivitet i genomförandet", label_en: "Quality and efficiency of the implementation" },
      label_sv: "Deltagarnas och konsortiets kapacitet",
      label_en: "Capacity of participants and consortium as a whole",
      criterion_sv: "Kvalitet och effektivitet i genomförandet",
      criterion_en: "Quality and efficiency of the implementation",
      indicativePages: 3,
      instructions_sv: [
        "Beskriv konsortiet och hur det motsvarar målen och samlar nödvändig kompetens, även samhällsvetenskap, öppen vetenskap och genus där det behövs. Ta med anknutna enheter och associerade partner.",
        "Tillgång till kritisk infrastruktur, hur parterna kompletterar varandra och varje parts roll och resurser.",
        "Näringslivets medverkan för nyttiggörande, om relevant, och motivering för deltagare som inte automatiskt har rätt till EU-finansiering.",
        "Upprepa inte deltagarbeskrivningarna från Part A.",
      ].join("\n"),
      instructions_en: [
        "Describe the consortium. How does it match the project's objectives and bring together the necessary disciplinary and inter-disciplinary knowledge, including social sciences and humanities, open science and gender expertise as appropriate? Include affiliated entities and associated partners.",
        "Show how the partners will have access to critical infrastructure, how the members complement one another, and that each has a valid role and adequate resources.",
        "If applicable, describe the industrial/commercial involvement to ensure exploitation, and justify the participation of entities not automatically eligible for EU funding.",
        "The individual participants are described in Part A; there is no need to repeat that here.",
      ].join("\n"),
    },
  ],
};

const ESF_PLUS: CallTemplate = {
  id: "esf-ansokan-om-stod",
  format: "web-form",
  language: "sv",
  title_sv: "ESF+ – Ansökan om stöd i Projektrummet+",
  title_en: "ESF+ – Application for support in Projektrummet+",
  version: "Urvalskriterier enligt utlysning 26-024 (2026-08-18)",
  sourceUrl: "https://www.esf.se/soka-stod/sok-stod-steg-for-steg/",
  submittedIn: "Projektrummet+",
  note_sv:
    "Ansökan skrivs direkt i Projektrummet+. Avsnitten följer ESF+:s fem urvalskriterier, som ansökan bedöms mot; formulärets exakta fält och teckengränser står i Projektrummet+ och finns inte i systemet än. Utlysningens egna krav (förväntade resultat, bilagor) gäller utöver detta.",
  note_en:
    "The application is written directly in Projektrummet+. The sections follow ESF+'s five selection criteria, which the application is assessed against; the form's exact fields and character limits are in Projektrummet+ and not in the system yet. The call's own requirements (expected results, attachments) apply on top of this.",
  sections: [
    {
      key: "esf-problem",
      number: "1",
      label_sv: "Problemanalys",
      label_en: "Problem analysis",
      criterion_sv: "Urvalskriterium 1",
      criterion_en: "Selection criterion 1",
      instructions_sv: [
        "Definiera vilket problem projektet vill lösa, utifrån målgruppens och aktörernas behov.",
        "Analysera problemets orsaker och konsekvenser.",
        "Identifiera utmaningar utifrån jämställdhet, tillgänglighet och icke-diskriminering.",
        "Analysera vilka aktörer som behöver delta för att lösa problemet.",
      ].join("\n"),
      instructions_en: [
        "Define the problem the project wants to solve, based on the needs of the target group and the actors.",
        "Analyse the causes and consequences of the problem.",
        "Identify challenges in terms of gender equality, accessibility and non-discrimination.",
        "Analyse which actors need to take part to solve the problem.",
      ].join("\n"),
    },
    {
      key: "esf-goals",
      number: "2",
      label_sv: "Projektmål",
      label_en: "Project objectives",
      criterion_sv: "Urvalskriterium 2",
      criterion_en: "Selection criterion 2",
      instructions_sv: [
        "Målen ska ligga i linje med utlysningens mål och svara mot det definierade problemet.",
        "Målen ska vara uppföljningsbara, och utvärderingsbara när utlysningen kräver projektutvärdering.",
        "Målen ska utgå från de identifierade utmaningarna kring jämställdhet, tillgänglighet och icke-diskriminering.",
      ].join("\n"),
      instructions_en: [
        "The objectives must be in line with the call's objectives and respond to the defined problem.",
        "The objectives must be possible to follow up, and to evaluate when the call requires a project evaluation.",
        "The objectives must build on the identified challenges in gender equality, accessibility and non-discrimination.",
      ].join("\n"),
    },
    {
      key: "esf-expected-results",
      number: "3",
      label_sv: "Förväntade resultat",
      label_en: "Expected results",
      criterion_sv: "Utlysningens krav",
      criterion_en: "The call's requirements",
      instructions_sv: "Beskriv vilka av utlysningens förväntade resultat som är aktuella för projektet, utifrån problemanalysen.",
      instructions_en: "Describe which of the call's expected results apply to the project, based on the problem analysis.",
    },
    {
      key: "esf-methods",
      number: "4",
      label_sv: "Metoder och tillvägagångssätt",
      label_en: "Methods and approaches",
      criterion_sv: "Urvalskriterium 3",
      criterion_en: "Selection criterion 3",
      instructions_sv: [
        "Beskriv de metoder och tillvägagångssätt projektet ska tillämpa eller utveckla, och hur de hänger ihop med problemanalysen och målen.",
        "Motivera valet med forskning, omvärldsbevakning eller tidigare erfarenheter av metoden.",
        "Beskriv hur metoderna förhåller sig till jämställdhet, tillgänglighet och icke-diskriminering.",
      ].join("\n"),
      instructions_en: [
        "Describe the methods and approaches the project will apply or develop, and how they relate to the problem analysis and objectives.",
        "Justify the choice with research, environmental scanning or earlier experience of the method.",
        "Describe how the methods relate to gender equality, accessibility and non-discrimination.",
      ].join("\n"),
    },
    {
      key: "esf-organisation",
      number: "5",
      label_sv: "Projektorganisation, kapacitet och budget",
      label_en: "Project organisation, capacity and budget",
      criterion_sv: "Urvalskriterium 4",
      criterion_en: "Selection criterion 4",
      instructions_sv: [
        "Beskriv funktionerna i projektorganisationen (hos projektägaren, deltagande aktörer och det som köps in) och vilka kompetenser som krävs.",
        "Visa att budgeten är relevant och kostnadseffektiv i förhållande till problemet och målen.",
        "Visa att ni har ekonomisk och administrativ kapacitet att genomföra projektet.",
      ].join("\n"),
      instructions_en: [
        "Describe the functions in the project organisation (at the project owner, participating actors and purchased resources) and the competences required.",
        "Show that the budget is relevant and cost-effective in relation to the problem and objectives.",
        "Show that you have the financial and administrative capacity to carry out the project.",
      ].join("\n"),
    },
    {
      key: "esf-anchoring",
      number: "6",
      label_sv: "Förankring, ägarskap och tillvaratagande av resultat",
      label_en: "Anchoring, ownership and use of results",
      criterion_sv: "Urvalskriterium 5",
      criterion_en: "Selection criterion 5",
      instructions_sv: [
        "Visa att projektet är förankrat hos projektägaren och deltagande aktörer, med säkrat ägarskap och utpekade mottagare av resultaten.",
        "Beskriv projektets styrgrupp.",
        "Beskriv strategin för hur resultat och lärdomar tas till vara under och efter projektet.",
      ].join("\n"),
      instructions_en: [
        "Show that the project is anchored with the project owner and participating actors, with secured ownership and named recipients of the results.",
        "Describe the project's steering group.",
        "Describe the strategy for how results and lessons learnt are used during and after the project.",
      ].join("\n"),
    },
  ],
};

export const callTemplates: CallTemplate[] = [HE_RIA_IA, ESF_PLUS];

export function findCallTemplate(id: string | undefined): CallTemplate | undefined {
  return id ? callTemplates.find((t) => t.id === id) : undefined;
}

/** The form a call's applications follow: the call's own sections when it
 * has them, else the shared template it points to. Undefined = no form on
 * file, and the workspace falls back to its generic project logic. */
export function applicationTemplateFor(call: FundingCall): CallTemplate | undefined {
  if (call.applicationTemplate && call.applicationTemplate.length > 0) {
    return {
      id: `call:${call.id}`,
      format: "docx",
      title_sv: call.title_sv,
      title_en: call.title_en,
      version: "",
      sections: call.applicationTemplate,
    };
  }
  return findCallTemplate(call.applicationTemplateId);
}

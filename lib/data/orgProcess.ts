import { OrgProcessPhase } from "@/lib/types";

// REAL DATA: en verklig kommuns process för EU-finansierade projekt,
// extraherad från stadens "EU-projekthandbok" (stödmaterial och
// utbildningsmaterial för interna medarbetare).
//
// The four-phase structure and the internal role breakdown per phase
// (Verksamhet / Stadsledningskontoret / Serviceförvaltningen) are real and
// specific to that example organisation's own setup. They are attached here as
// ONE EXAMPLE of how a municipality can divide internal responsibility for
// an EU project — not a system default. Another organisation would have its
// own equivalents (or none at all) for these central support functions; see
// `roleExample.organisationName` and surface a clear "example" label in the
// UI rather than presenting this as how every municipality works.
export const orgProcessPhases: OrgProcessPhase[] = [
  {
    key: "idea",
    title_sv: "Idé",
    title_en: "Idea",
    desc_sv:
      "Vad du kan söka finansiering för regleras genom olika utlysningar, som beskriver vilka typer av insatser och inom vilket område finansiering är möjlig. EU-finansiering ska alltid vara väl förankrad i verksamhetens ledning och ligga i linje med stadens politiska prioriteringar. Efter att en projektidé tagits fram undersöks om det finns extern finansiering för just den idén.",
    desc_en:
      "What you can apply for is governed by individual calls, which describe what kinds of activities and which areas are eligible for funding. EU funding should always be well anchored in the department's management and aligned with the city's political priorities. Once a project idea has been developed, the next step is to check whether external funding exists for it.",
    documents: [
      { title_sv: "Nyckelaspekter vid projektutveckling", title_en: "Key aspects of project development" },
      { title_sv: "Samverkan EU-finansiering", title_en: "Collaboration for EU funding" },
      { title_sv: "Stödmall för projektidé", title_en: "Support template for a project idea" },
      { title_sv: "Viktiga begrepp inom EU-finansiering", title_en: "Key terms in EU funding" },
    ],
    roleExample: {
      organisationName: "Exempelstad",
      responsibilities: [
        {
          role_sv: "Verksamhet",
          role_en: "Operating department",
          tasks_sv: [
            "Identifiera behov.",
            "Konkretisera projektidé utefter behov.",
            "Bedöma om det finns behov av extern finansiering för att genomföra projektet.",
            "Identifiera målgrupp och samverkanspartners.",
            "Identifiera finansieringskälla.",
          ],
          tasks_en: [
            "Identify the need.",
            "Turn the need into a concrete project idea.",
            "Assess whether external funding is needed to carry out the project.",
            "Identify the target group and potential partners.",
            "Identify a funding source.",
          ],
        },
        {
          role_sv: "Stadsledningskontoret (internationella enheten)",
          role_en: "City Executive Office (international unit)",
          tasks_sv: ["Grundläggande rådgivning och stöd kring hur EU-finansiering kan användas.", "Stöd att hitta partners."],
          tasks_en: ["Basic advice and support on how EU funding can be used.", "Support in finding partners."],
        },
        {
          role_sv: "Serviceförvaltningen",
          role_en: "Service Administration (shared finance function)",
          tasks_sv: ["Upprätta en översiktlig budget för projektet."],
          tasks_en: ["Draw up an overview budget for the project."],
        },
      ],
    },
    done: true,
  },
  {
    key: "application",
    title_sv: "Ansökan",
    title_en: "Application",
    desc_sv:
      "Hittar du en utlysning som passar verksamhetens behov är det viktigt att noga läsa igenom vilka krav den specifika utlysningen har — alla utlysningar skiljer sig åt. Efter besked om beviljad ansökan behöver verksamheten ha kontakter med finansieringskällan samt ordna med en välfungerande projektorganisation, och säkerställa de strukturer, resurser och personal som behövs för att genomföra projektet. Ansökan utvärderas alltid, och du måste vara beredd att komplettera med begärda juridiska och administrativa uppgifter.",
    desc_en:
      "Once you find a call that matches the department's needs, it's important to read its specific requirements carefully — every call differs. After notification of an approved application, the department needs to establish contact with the funder, put a well-functioning project organisation in place, and ensure the structures, resources and staff needed to carry out the project. Applications are always evaluated, and you must be prepared to supplement the application with requested legal and administrative information.",
    documents: [
      { title_sv: "Efter besked om EU-finansiering", title_en: "After notification of EU funding" },
      { title_sv: "Om Grant Agreement", title_en: "About the Grant Agreement" },
    ],
    roleExample: {
      organisationName: "Exempelstad",
      responsibilities: [
        {
          role_sv: "Verksamhet",
          role_en: "Operating department",
          tasks_sv: [
            "Bestäm projektorganisation (t.ex. styrgrupp, administratörer, kommunikatörer). Finns behov av extern kompetens?",
            "Definiera mål, delmål och aktiviteter. Se över hur projektet ska utvärderas.",
            "Etablera kontakt med partners.",
            "Skriv ansökan.",
          ],
          tasks_en: [
            "Decide on the project organisation (e.g. steering group, administrators, communicators). Is external expertise needed?",
            "Define goals, sub-goals and activities. Consider how the project will be evaluated.",
            "Establish contact with partners.",
            "Write the application.",
          ],
        },
        {
          role_sv: "Stadsledningskontoret (internationella enheten)",
          role_en: "City Executive Office (international unit)",
          tasks_sv: [
            "Kontakt mot nationella kontaktkontor och förvaltande myndigheter.",
            "Övergripande hjälp att kvalitetssäkra ansökan.",
            "Stöd att analysera beslut och eventuell hjälp vid kontraktering.",
          ],
          tasks_en: [
            "Liaison with national contact points and managing authorities.",
            "General help quality-assuring the application.",
            "Support analysing the decision and, where relevant, help with contracting.",
          ],
        },
        {
          role_sv: "Serviceförvaltningen",
          role_en: "Service Administration (shared finance function)",
          tasks_sv: [
            "Bistå med ekonomisk planering.",
            "Bistå med mallar och struktur för ekonomisk budgetering och uppföljning.",
          ],
          tasks_en: [
            "Assist with financial planning.",
            "Provide templates and structure for financial budgeting and follow-up.",
          ],
        },
      ],
    },
    done: true,
  },
  {
    key: "delivery",
    title_sv: "Projektgenomförande",
    title_en: "Delivery",
    desc_sv:
      "Under projektgenomförandet ska verksamheten genomföra de aktiviteter som utlovats i ansökan. Läs noga igenom beslutet för att se vilka krav som gäller — verksamheten ansvarar för att följa gällande lagar och regelverk. Det är viktigt att kontinuerligt arbeta med uppföljning, stämma av målsättningar och revidera dem vid behov. Finansieringskällan genomför kontroller under och efter projektet, så rapportera kontinuerligt hur det går. Planera kommunikationsverksamheter redan vid projektstart.",
    desc_en:
      "During delivery, the department carries out the activities committed to in the application. Read the decision carefully to see which requirements apply — the department is responsible for complying with applicable laws and regulations. It's important to continuously follow up, check progress against goals and revise them if needed. The funder carries out checks during and after the project, so report progress continuously. Plan communication activities from the very start of the project.",
    documents: [
      { title_sv: "Aktivitetsplan – Planera din kommunikation", title_en: "Activity plan – planning your communication" },
      { title_sv: "Fyra saker att tänka på när du kommunicerar EU-projekt", title_en: "Four things to consider when communicating an EU project" },
    ],
    roleExample: {
      organisationName: "Exempelstad",
      responsibilities: [
        {
          role_sv: "Verksamhet",
          role_en: "Operating department",
          tasks_sv: [
            "Planera, genomför och följ upp projektets aktiviteter.",
            "Kommunicera om projektet och dess resultat.",
            "Samla in och kontrollera underlag till kostnader och eventuella intäkter som ska redovisas.",
            "Rapportera till finansiär.",
          ],
          tasks_en: [
            "Plan, carry out and follow up the project's activities.",
            "Communicate about the project and its results.",
            "Gather and check supporting documentation for costs and any income to be reported.",
            "Report to the funder.",
          ],
        },
        {
          role_sv: "Stadsledningskontoret (internationella enheten)",
          role_en: "City Executive Office (international unit)",
          tasks_sv: [
            "Interna erfarenhetsutbyten.",
            "Stöd vid eventuella frågor.",
            "Stöd att kommunicera projektet på stadens externa webb.",
          ],
          tasks_en: [
            "Internal experience-sharing between projects.",
            "Support with any questions.",
            "Support communicating the project on the city's external website.",
          ],
        },
        {
          role_sv: "Serviceförvaltningen",
          role_en: "Service Administration (shared finance function)",
          tasks_sv: [
            "Budgetuppföljning.",
            "Bistå med information när finansieringskällan ställer krav på ekonomisk redovisning.",
            "Kontroll och administration gällande betalning från förvaltande myndighet.",
          ],
          tasks_en: [
            "Budget follow-up.",
            "Provide guidance when the funder sets requirements for financial reporting.",
            "Control and administration of payments from the managing authority.",
          ],
        },
      ],
    },
    done: false,
  },
  {
    key: "closure",
    title_sv: "Projektavslut",
    title_en: "Closure",
    desc_sv:
      "Det är centralt att i förväg se över hur projektet ska följas upp. Systematisk utvärdering är viktig både för att följa upp målsättningarna och för att lärdomar och resultat ska integreras i den ordinarie verksamheten. Det finns krav på dokumentation och arkivering efter projektavslut — generellt längre gallringsfrister än för övriga handlingar i offentlig verksamhet, eftersom handlingar som upprättas inom EU-projekt ska finnas tillgängliga vid revision i upp till 10 år. Om inget annat anges förblir projektets resultat bidragsmottagarens egendom, men finansieringskällan har rätt att kommunicera resultaten.",
    desc_en:
      "It's essential to plan in advance how the project will be followed up. Systematic evaluation matters both for tracking goals and for integrating lessons and results into regular operations. There are documentation and archiving requirements after project closure — generally longer retention periods than for other public-sector records, since records produced within an EU project must remain available for audit for up to 10 years. Unless stated otherwise, project results remain the grant recipient's property, though the funder has the right to communicate the results.",
    documents: [
      { title_sv: "Att hantera handlingar vid EU-projekt", title_en: "Handling records in EU projects" },
      { title_sv: "Gallringsbeslut om handlingar vid EU-projekt", title_en: "Retention/disposal decision for EU-project records" },
    ],
    roleExample: {
      organisationName: "Exempelstad",
      responsibilities: [
        {
          role_sv: "Verksamhet",
          role_en: "Operating department",
          tasks_sv: [
            "Skriva slutrapportering.",
            "Kontrollera att samtliga kostnader har bokförts och betalats.",
            "Säkerställa att dokumentation finns tillgänglig för arkivering och eventuell revision.",
          ],
          tasks_en: [
            "Write the final report.",
            "Verify that all costs have been booked and paid.",
            "Ensure documentation is available for archiving and any audit.",
          ],
        },
        {
          role_sv: "Stadsledningskontoret (internationella enheten)",
          role_en: "City Executive Office (international unit)",
          tasks_sv: [
            "Stöd inför eventuella framtida projektansökningar.",
            "Stöd att kommunicera projektet på stadens externa webb.",
            "Beredskap att svara på frågor.",
          ],
          tasks_en: [
            "Support for any future project applications.",
            "Support communicating the project on the city's external website.",
            "Readiness to answer questions.",
          ],
        },
        {
          role_sv: "Serviceförvaltningen",
          role_en: "Service Administration (shared finance function)",
          tasks_sv: [
            "Säkerställa att alla fakturor och övrig ekonomisk dokumentation kommer in och redovisas.",
            "Bistå med ekonomiskt innehåll i projektets slutrapport.",
            "Överlämna projektets ekonomiska underlag till projektadministratör för arkivering.",
            "Bistå vid revision.",
          ],
          tasks_en: [
            "Ensure all invoices and other financial documentation are submitted and accounted for.",
            "Contribute the financial content of the project's final report.",
            "Hand over the project's financial records to the project administrator for archiving.",
            "Assist with audits.",
          ],
        },
      ],
    },
    done: false,
  },
];

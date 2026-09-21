import { FundingCall } from "@/lib/types";

// Level 2 (utlysning) + embedded level 3 (dokument). This is the AI's
// actual "context package" per call — everything scoring, the application
// coach and reporting are meant to be grounded in. Illustrative demo data.
export const fundingCalls: FundingCall[] = [
  {
    id: "life-2027-climate-schools",
    programId: "life",
    title_sv: "LIFE – Klimatåtgärder i offentliga byggnader 2027",
    title_en: "LIFE – Climate action in public buildings 2027",
    status: "open",
    deadlineMonthsFromNow: 3,
    budgetTotalSEK: 900_000_000,
    minGrantSEK: 15_000_000,
    maxGrantSEK: 400_000_000,
    requiresPartnership: false,
    eligibleApplicants_sv: "Kommuner, regioner, kommunala bolag och offentliga myndigheter inom EU.",
    eligibleApplicants_en: "Municipalities, regions, municipal companies and public authorities within the EU.",
    priorities_sv: [
      "Mätbar minskning av energianvändning och utsläpp",
      "Skalbarhet och spridning till andra offentliga organisationer",
      "Innovativ teknik eller arbetssätt",
    ],
    priorities_en: [
      "Measurable reduction in energy use and emissions",
      "Scalability and replication to other public organisations",
      "Innovative technology or ways of working",
    ],
    extraKeywords: ["skolor", "byggnader", "renovering", "schools", "buildings", "renovation"],
    evaluationCriteria: [
      { name_sv: "Relevans", name_en: "Relevance", maxPoints: 30 },
      { name_sv: "Effekt (Impact)", name_en: "Impact", maxPoints: 30 },
      { name_sv: "Kvalitet", name_en: "Quality", maxPoints: 20 },
      { name_sv: "Genomförande", name_en: "Implementation", maxPoints: 20 },
    ],
    documents: [
      { id: "d1", type: "call", title_sv: "Utlysningstext", title_en: "Call document", updatedAt: "2026-06-02", needsUpdate: false },
      { id: "d2", type: "guide", title_sv: "Programguide", title_en: "Programme guide", updatedAt: "2026-01-15", needsUpdate: false },
      { id: "d3", type: "form", title_sv: "Ansökningsformulär", title_en: "Application form", updatedAt: "2026-06-02", needsUpdate: false },
      { id: "d4", type: "criteria", title_sv: "Bedömningskriterier", title_en: "Evaluation criteria", updatedAt: "2026-06-02", needsUpdate: false },
      { id: "d5", type: "budget", title_sv: "Budgetinstruktioner", title_en: "Budget instructions", updatedAt: "2025-11-20", needsUpdate: true },
      { id: "d6", type: "faq", title_sv: "Vanliga frågor", title_en: "FAQ", updatedAt: "2026-08-01", needsUpdate: false },
      { id: "d7", type: "reporting", title_sv: "Rapporteringsanvisningar", title_en: "Reporting instructions", updatedAt: "2025-09-10", needsUpdate: true },
      { id: "d8", type: "template", title_sv: "Mall: projektlogik", title_en: "Template: project logic", updatedAt: "2026-01-15", needsUpdate: false },
    ],
  },
  {
    id: "erdf-2027-digital-cities",
    programId: "erdf",
    title_sv: "Regionalfonden – Smarta och hållbara städer 2027",
    title_en: "ERDF – Smart and sustainable cities 2027",
    status: "open",
    deadlineMonthsFromNow: 5,
    budgetTotalSEK: 400_000_000,
    minGrantSEK: 5_000_000,
    maxGrantSEK: 200_000_000,
    requiresPartnership: false,
    eligibleApplicants_sv: "Svenska kommuner, regioner och kommunala bolag.",
    eligibleApplicants_en: "Swedish municipalities, regions and municipal companies.",
    priorities_sv: [
      "Digitalisering av offentlig service",
      "Hållbar mobilitet och stadsutveckling",
      "Regional konkurrenskraft",
    ],
    priorities_en: [
      "Digitalisation of public services",
      "Sustainable mobility and urban development",
      "Regional competitiveness",
    ],
    extraKeywords: ["smart city", "medborgarservice", "citizen service"],
    evaluationCriteria: [
      { name_sv: "Regional relevans", name_en: "Regional relevance", maxPoints: 25 },
      { name_sv: "Effekt", name_en: "Impact", maxPoints: 25 },
      { name_sv: "Genomförbarhet", name_en: "Feasibility", maxPoints: 25 },
      { name_sv: "Kostnadseffektivitet", name_en: "Cost-effectiveness", maxPoints: 25 },
    ],
    documents: [
      { id: "d1", type: "call", title_sv: "Utlysningstext", title_en: "Call document", updatedAt: "2026-04-10", needsUpdate: false },
      { id: "d2", type: "guide", title_sv: "Programguide", title_en: "Programme guide", updatedAt: "2025-10-01", needsUpdate: true },
      { id: "d3", type: "form", title_sv: "Ansökningsformulär", title_en: "Application form", updatedAt: "2026-04-10", needsUpdate: false },
      { id: "d4", type: "criteria", title_sv: "Bedömningskriterier", title_en: "Evaluation criteria", updatedAt: "2026-04-10", needsUpdate: false },
      { id: "d5", type: "faq", title_sv: "Vanliga frågor", title_en: "FAQ", updatedAt: "2026-07-15", needsUpdate: false },
      { id: "d6", type: "reporting", title_sv: "Rapporteringsanvisningar", title_en: "Reporting instructions", updatedAt: "2026-04-10", needsUpdate: false },
    ],
  },
  {
    id: "esf-2027-care-skills",
    programId: "esf",
    title_sv: "ESF+ – Kompetenslyft inom vård och omsorg 2027",
    title_en: "ESF+ – Upskilling in health and social care 2027",
    status: "open",
    deadlineMonthsFromNow: 2,
    budgetTotalSEK: 150_000_000,
    minGrantSEK: 2_000_000,
    maxGrantSEK: 60_000_000,
    requiresPartnership: false,
    eligibleApplicants_sv: "Kommuner, regioner och utbildningsanordnare i Sverige.",
    eligibleApplicants_en: "Municipalities, regions and training providers in Sweden.",
    priorities_sv: ["Kompetensförsörjning inom välfärden", "Social inkludering", "Jämställd arbetsmarknad"],
    priorities_en: ["Skills supply in welfare services", "Social inclusion", "Gender-equal labour market"],
    extraKeywords: ["kompetenslyft", "upskilling"],
    evaluationCriteria: [
      { name_sv: "Behovsanalys", name_en: "Needs analysis", maxPoints: 20 },
      { name_sv: "Effekt för målgruppen", name_en: "Impact on target group", maxPoints: 35 },
      { name_sv: "Genomförandeplan", name_en: "Implementation plan", maxPoints: 25 },
      { name_sv: "Hållbarhet efter projektslut", name_en: "Sustainability after project end", maxPoints: 20 },
    ],
    documents: [
      { id: "d1", type: "call", title_sv: "Utlysningstext", title_en: "Call document", updatedAt: "2026-07-01", needsUpdate: false },
      { id: "d2", type: "form", title_sv: "Ansökningsformulär", title_en: "Application form", updatedAt: "2026-07-01", needsUpdate: false },
      { id: "d3", type: "criteria", title_sv: "Bedömningskriterier", title_en: "Evaluation criteria", updatedAt: "2026-07-01", needsUpdate: false },
      { id: "d4", type: "reporting", title_sv: "Rapporteringsanvisningar", title_en: "Reporting instructions", updatedAt: "2024-12-01", needsUpdate: true },
    ],
  },
  {
    id: "interreg-2027-nordic-climate",
    programId: "interreg-baltic-sea",
    title_sv: "Interreg – Nordiskt klimatsamarbete 2027",
    title_en: "Interreg – Nordic climate cooperation 2027",
    status: "upcoming",
    deadlineMonthsFromNow: 6,
    budgetTotalSEK: 200_000_000,
    minGrantSEK: 3_000_000,
    maxGrantSEK: 80_000_000,
    requiresPartnership: true,
    eligibleApplicants_sv: "Kommuner och regioner i minst två nordiska/baltiska länder gemensamt.",
    eligibleApplicants_en: "Municipalities and regions in at least two Nordic/Baltic countries jointly.",
    priorities_sv: ["Gränsöverskridande klimatlösningar", "Gemensam kunskapsuppbyggnad"],
    priorities_en: ["Cross-border climate solutions", "Joint knowledge-building"],
    extraKeywords: ["norden", "nordic"],
    evaluationCriteria: [
      { name_sv: "Partnerskapets kvalitet", name_en: "Partnership quality", maxPoints: 25 },
      { name_sv: "Gränsöverskridande mervärde", name_en: "Cross-border added value", maxPoints: 30 },
      { name_sv: "Effekt", name_en: "Impact", maxPoints: 25 },
      { name_sv: "Genomförande", name_en: "Implementation", maxPoints: 20 },
    ],
    documents: [
      { id: "d1", type: "call", title_sv: "Utlysningstext (utkast)", title_en: "Call document (draft)", updatedAt: "2026-08-20", needsUpdate: false },
      { id: "d2", type: "guide", title_sv: "Programguide", title_en: "Programme guide", updatedAt: "2025-05-01", needsUpdate: true },
      { id: "d3", type: "faq", title_sv: "Vanliga frågor", title_en: "FAQ", updatedAt: "2025-05-01", needsUpdate: true },
    ],
  },
  {
    id: "horizon-2027-ai-public-sector",
    programId: "horizon",
    title_sv: "Horizon Europe – AI för offentlig sektor 2027",
    title_en: "Horizon Europe – AI for the public sector 2027",
    status: "open",
    deadlineMonthsFromNow: 4,
    budgetTotalSEK: 600_000_000,
    minGrantSEK: 20_000_000,
    maxGrantSEK: 500_000_000,
    requiresPartnership: true,
    eligibleApplicants_sv: "Konsortier med minst tre organisationer från tre olika EU-länder.",
    eligibleApplicants_en: "Consortia of at least three organisations from three different EU countries.",
    priorities_sv: ["Hög innovationsgrad (TRL 5-7)", "Pilottestning i verklig miljö", "Konsortiets kompetensbredd"],
    priorities_en: ["High innovation level (TRL 5-7)", "Piloting in a real-world setting", "Breadth of consortium expertise"],
    extraKeywords: ["trl", "handläggning"],
    evaluationCriteria: [
      { name_sv: "Excellens", name_en: "Excellence", maxPoints: 35 },
      { name_sv: "Effekt", name_en: "Impact", maxPoints: 35 },
      { name_sv: "Kvalitet och effektivitet i genomförandet", name_en: "Quality and efficiency of implementation", maxPoints: 30 },
    ],
    // Real: Horizon Europe's standard application form (Part B, Research &
    // Innovation Actions) has used exactly this three-part structure since
    // Horizon 2020 — see the Funding & Tenders Portal's "Standard
    // application form" template. Mirrors evaluationCriteria above one-to-
    // one, since each is literally the section that criterion judges.
    applicationTemplate: [
      {
        key: "excellence",
        label_sv: "Excellens",
        label_en: "Excellence",
        instructions_sv:
          "Beskriv projektets mål, dess ambition i förhållande till nuvarande kunskapsläge (state of the art), och den vetenskapliga eller tekniska metodens vetenskapliga soliditet.",
        instructions_en:
          "Describe the project's objectives, its ambition relative to the state of the art, and the soundness of the proposed scientific or technical methodology.",
      },
      {
        key: "impact",
        label_sv: "Effekt",
        label_en: "Impact",
        instructions_sv:
          "Beskriv de förväntade effekterna kopplade till utlysningens angivna förväntade resultat, samt hur projektets resultat ska spridas, nyttiggöras och kommuniceras.",
        instructions_en:
          "Describe the expected outcomes aligned with the call's stated expected results, and how the project's results will be disseminated, exploited and communicated.",
      },
      {
        key: "implementation",
        label_sv: "Kvalitet och effektivitet i genomförandet",
        label_en: "Quality and efficiency of implementation",
        instructions_sv:
          "Beskriv arbetsplan och arbetspaket, fördelning av resurser, konsortiets samlade kapacitet, samt hantering av risker i genomförandet.",
        instructions_en:
          "Describe the work plan and work packages, allocation of resources, the consortium's combined capacity, and risk management in implementation.",
      },
    ],
    documents: [
      { id: "d1", type: "call", title_sv: "Utlysningstext", title_en: "Call document", updatedAt: "2026-05-11", needsUpdate: false },
      { id: "d2", type: "guide", title_sv: "Programguide", title_en: "Programme guide", updatedAt: "2026-05-11", needsUpdate: false },
      { id: "d3", type: "criteria", title_sv: "Bedömningskriterier", title_en: "Evaluation criteria", updatedAt: "2026-05-11", needsUpdate: false },
      { id: "d4", type: "template", title_sv: "Mall: konsortieavtal", title_en: "Template: consortium agreement", updatedAt: "2025-02-01", needsUpdate: true },
      { id: "d5", type: "agreement", title_sv: "Bidragsavtal (mall)", title_en: "Grant agreement (template)", updatedAt: "2026-05-11", needsUpdate: false },
    ],
  },
  {
    id: "digital-europe-2027-ai-services",
    programId: "digital-europe",
    title_sv: "Digital Europe – AI-baserad medborgarservice 2027",
    title_en: "Digital Europe – AI-based citizen services 2027",
    status: "open",
    deadlineMonthsFromNow: 3,
    budgetTotalSEK: 250_000_000,
    minGrantSEK: 4_000_000,
    maxGrantSEK: 100_000_000,
    requiresPartnership: false,
    eligibleApplicants_sv: "Offentliga myndigheter och kommuner inom EU/EES.",
    eligibleApplicants_en: "Public authorities and municipalities within the EU/EEA.",
    priorities_sv: ["Effektivare medborgarservice", "Ansvarsfull AI-användning", "Interoperabilitet"],
    priorities_en: ["More efficient citizen services", "Responsible use of AI", "Interoperability"],
    extraKeywords: ["kontaktcenter", "chatbot"],
    evaluationCriteria: [
      { name_sv: "Digital mognad och behov", name_en: "Digital maturity and need", maxPoints: 25 },
      { name_sv: "Effekt för medborgare", name_en: "Impact for citizens", maxPoints: 35 },
      { name_sv: "Teknisk genomförbarhet", name_en: "Technical feasibility", maxPoints: 25 },
      { name_sv: "Etik och datasäkerhet", name_en: "Ethics and data security", maxPoints: 15 },
    ],
    documents: [
      { id: "d1", type: "call", title_sv: "Utlysningstext", title_en: "Call document", updatedAt: "2026-06-18", needsUpdate: false },
      { id: "d2", type: "form", title_sv: "Ansökningsformulär", title_en: "Application form", updatedAt: "2026-06-18", needsUpdate: false },
      { id: "d3", type: "criteria", title_sv: "Bedömningskriterier", title_en: "Evaluation criteria", updatedAt: "2026-06-18", needsUpdate: false },
      { id: "d4", type: "faq", title_sv: "Vanliga frågor", title_en: "FAQ", updatedAt: "2026-06-18", needsUpdate: false },
    ],
  },
  {
    id: "cef-2028-charging-infra",
    programId: "cef",
    title_sv: "CEF – Laddinfrastruktur och energinät 2028",
    title_en: "CEF – Charging infrastructure and energy grids 2028",
    status: "upcoming",
    deadlineMonthsFromNow: 7,
    budgetTotalSEK: 500_000_000,
    minGrantSEK: 10_000_000,
    maxGrantSEK: 300_000_000,
    requiresPartnership: false,
    eligibleApplicants_sv: "Kommuner, regioner och infrastrukturbolag inom EU.",
    eligibleApplicants_en: "Municipalities, regions and infrastructure companies within the EU.",
    priorities_sv: ["Gränsöverskridande energi-/transportnät", "Kapacitetsökning"],
    priorities_en: ["Cross-border energy/transport networks", "Capacity increase"],
    extraKeywords: [],
    evaluationCriteria: [
      { name_sv: "EU-mervärde", name_en: "EU added value", maxPoints: 30 },
      { name_sv: "Mognadsgrad", name_en: "Maturity", maxPoints: 30 },
      { name_sv: "Kostnadseffektivitet", name_en: "Cost-effectiveness", maxPoints: 40 },
    ],
    documents: [
      { id: "d1", type: "call", title_sv: "Utlysningstext (preliminär)", title_en: "Call document (preliminary)", updatedAt: "2026-08-01", needsUpdate: false },
      { id: "d2", type: "guide", title_sv: "Programguide", title_en: "Programme guide", updatedAt: "2025-03-01", needsUpdate: true },
    ],
  },
  {
    id: "erasmus-2027-school-cooperation",
    programId: "erasmus",
    title_sv: "Erasmus+ – Samarbetsprojekt inom skolan 2027",
    title_en: "Erasmus+ – School cooperation partnerships 2027",
    status: "open",
    deadlineMonthsFromNow: 2,
    budgetTotalSEK: 60_000_000,
    minGrantSEK: 500_000,
    maxGrantSEK: 15_000_000,
    requiresPartnership: true,
    eligibleApplicants_sv: "Skolor och kommunala utbildningsförvaltningar inom EU.",
    eligibleApplicants_en: "Schools and municipal education departments within the EU.",
    priorities_sv: ["Personalutbyte och kompetensutveckling", "Digital kompetens i skolan"],
    priorities_en: ["Staff exchange and professional development", "Digital competence in schools"],
    extraKeywords: [],
    evaluationCriteria: [
      { name_sv: "Relevans", name_en: "Relevance", maxPoints: 30 },
      { name_sv: "Kvalitet i utformning", name_en: "Quality of design", maxPoints: 40 },
      { name_sv: "Effekt och spridning", name_en: "Impact and dissemination", maxPoints: 30 },
    ],
    documents: [
      { id: "d1", type: "call", title_sv: "Utlysningstext", title_en: "Call document", updatedAt: "2026-07-20", needsUpdate: false },
      { id: "d2", type: "form", title_sv: "Ansökningsformulär", title_en: "Application form", updatedAt: "2026-07-20", needsUpdate: false },
      { id: "d3", type: "faq", title_sv: "Vanliga frågor", title_en: "FAQ", updatedAt: "2026-07-20", needsUpdate: false },
    ],
  },
];

export function findCall(id: string): FundingCall | undefined {
  return fundingCalls.find((c) => c.id === id);
}

export function callsForProgram(programId: string): FundingCall[] {
  return fundingCalls.filter((c) => c.programId === programId);
}

export function allDocuments() {
  return fundingCalls.flatMap((c) => c.documents.map((d) => ({ ...d, callId: c.id })));
}

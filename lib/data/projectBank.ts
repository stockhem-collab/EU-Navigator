import { ProjectBankEntry } from "@/lib/types";

// The municipality's own project ideas / planned investments. Seeded demo
// data — in a real deployment this comes from the organisation's investment
// plan, operational plan, climate plan etc.
export const projectBank: ProjectBankEntry[] = [
  {
    id: "pb-1",
    title_sv: "Energieffektivisering kommunala skolor",
    title_en: "Energy efficiency upgrade of municipal schools",
    department_sv: "Fastighet",
    department_en: "Property & Facilities",
    owner: "Anna Andersson",
    status: "idea",
    estimatedCostSEK: 35_000_000,
    periodStart: 2027,
    periodEnd: 2029,
    sector: "energy",
    description_sv:
      "Installation av ny styrteknik, solceller och ventilation i 14 kommunala skolor för att minska energianvändningen.",
    description_en:
      "Installation of new control technology, solar panels and ventilation in 14 municipal schools to reduce energy use.",
    hasInternationalPartner: false,
    aiReadinessPct: 74,
    missingFields_sv: [
      "Förväntad energibesparing (MWh/år eller %)",
      "Målgrupp och antal berörda elever/anställda",
      "Beskrivning av innovationshöjd",
      "Möjlighet till internationellt partnerskap",
    ],
    missingFields_en: [
      "Expected energy savings (MWh/year or %)",
      "Target group and number of affected students/staff",
      "Description of the level of innovation",
      "Potential for an international partnership",
    ],
  },
  {
    id: "pb-2",
    title_sv: "AI-baserad medborgarservice",
    title_en: "AI-based citizen service",
    department_sv: "Digitalisering",
    department_en: "Digitalisation",
    owner: "Karim Haddad",
    status: "in-development",
    estimatedCostSEK: 18_000_000,
    periodStart: 2027,
    periodEnd: 2028,
    sector: "digital",
    description_sv:
      "Ett AI-baserat kontaktcenter som besvarar medborgarfrågor dygnet runt och avlastar handläggare inom socialtjänst och bygglov.",
    description_en:
      "An AI-based contact centre that answers citizen questions around the clock and reduces the workload for caseworkers in social services and building permits.",
    hasInternationalPartner: false,
    aiReadinessPct: 61,
    missingFields_sv: ["Kvantifierad tidsbesparing för handläggare", "Plan för dataskydd och etikprövning"],
    missingFields_en: ["Quantified time savings for caseworkers", "Data protection and ethics review plan"],
  },
  {
    id: "pb-3",
    title_sv: "Kompetenslyft äldreomsorg",
    title_en: "Skills upgrade in elderly care",
    department_sv: "Socialförvaltningen",
    department_en: "Social Services",
    owner: "Maria Lindqvist",
    status: "idea",
    estimatedCostSEK: 25_000_000,
    periodStart: 2027,
    periodEnd: 2029,
    sector: "social",
    description_sv:
      "Utbildningsinsats för undersköterskor och vårdbiträden i digitala verktyg och nya arbetssätt inom äldreomsorgen.",
    description_en:
      "A training initiative for care assistants and nursing aides in digital tools and new ways of working in elderly care.",
    hasInternationalPartner: false,
    aiReadinessPct: 68,
    missingFields_sv: ["Antal deltagare per år", "Uppföljningsplan efter utbildning"],
    missingFields_en: ["Number of participants per year", "Follow-up plan after training"],
  },
  {
    id: "pb-4",
    title_sv: "Cykelinfrastruktur city",
    title_en: "City cycling infrastructure",
    department_sv: "Stadsbyggnad",
    department_en: "Urban Planning",
    owner: "Johan Berg",
    status: "idea",
    estimatedCostSEK: 70_000_000,
    periodStart: 2028,
    periodEnd: 2030,
    sector: "mobility",
    description_sv:
      "Utbyggnad av sammanhängande cykelvägnät i centrala staden, inklusive säkra korsningar och cykelparkeringar.",
    description_en:
      "Expansion of a connected cycling network in the city centre, including safe crossings and bike parking.",
    hasInternationalPartner: false,
    aiReadinessPct: 55,
    missingFields_sv: ["Beräknad minskning av biltrafik", "Koppling till klimatmål", "Budget per delsträcka"],
    missingFields_en: ["Estimated reduction in car traffic", "Link to climate goals", "Budget per section"],
  },
  {
    id: "pb-5",
    title_sv: "Nordiskt klimatsamarbete – dagvattenhantering",
    title_en: "Nordic climate cooperation – stormwater management",
    department_sv: "VA-avdelningen",
    department_en: "Water & Sewage",
    owner: "Elin Svensson",
    status: "in-development",
    estimatedCostSEK: 42_000_000,
    periodStart: 2027,
    periodEnd: 2030,
    sector: "climate",
    description_sv:
      "Gemensamt nordiskt projekt för klimatanpassad dagvattenhantering, i samarbete med en norsk och en dansk kommun.",
    description_en:
      "A joint Nordic project for climate-adapted stormwater management, in cooperation with a Norwegian and a Danish municipality.",
    hasInternationalPartner: true,
    aiReadinessPct: 88,
    missingFields_sv: ["Fördelning av budget mellan partners"],
    missingFields_en: ["Budget split between partners"],
  },
  {
    id: "pb-6",
    title_sv: "Digital vuxenutbildning",
    title_en: "Digital adult education",
    department_sv: "Utbildningsförvaltningen",
    department_en: "Education Department",
    owner: "Peter Nilsson",
    status: "idea",
    estimatedCostSEK: 9_000_000,
    periodStart: 2027,
    periodEnd: 2028,
    sector: "education",
    description_sv:
      "Utveckling av digitala kurser för vuxenutbildning i samarbete med skolor i två andra EU-länder.",
    description_en:
      "Development of digital courses for adult education in cooperation with schools in two other EU countries.",
    hasInternationalPartner: true,
    aiReadinessPct: 79,
    missingFields_sv: ["Antal deltagande skolor", "Plan för utvärdering"],
    missingFields_en: ["Number of participating schools", "Evaluation plan"],
  },
];

export function findProjectBankEntry(id: string): ProjectBankEntry | undefined {
  return projectBank.find((p) => p.id === id);
}

import { FundingProgram } from "@/lib/types";

// Level 1: programme/fund — permanent, slow-changing information (purpose,
// priorities, typical support levels).
//
// REAL DATA: this list reflects the EU funds and programmes an example
// municipality tracks and has been awarded from, per that municipality's own
// "Utlysningar för EU-finansieringar" overview and its full record of
// awarded projects 2014-2027. Descriptions for the funds the municipality
// itself curates (AMIF, Erasmus+, European Urban Initiative, ERDF, ESF+,
// Havs-fiskeri- och vattenbruksprogrammet, Horisont Europa) are adapted from
// that material; the rest are concise general descriptions of real, named EU
// programmes that appear in the register. `status: "legacy"` marks
// programmes from the closed 2014-2020 period.
export const fundingPrograms: FundingProgram[] = [
  {
    id: "amif",
    name: "Asylum, Migration and Integration Fund (AMIF)",
    name_sv: "Asyl-, migrations- och integrationsfonden (AMIF)",
    shortName: "AMIF",
    logoLetter: "A",
    description_sv:
      "Bidrar till en effektiv hantering av migrationsströmmar samt till att stärka och utveckla den gemensamma asyl- och invandringspolitiken. Målgruppen är tredjelandsmedborgare.",
    description_en:
      "Contributes to the effective management of migration flows and to strengthening the common asylum and immigration policy. Targets third-country nationals.",
    sectors: ["social"],
    keywords: ["migration", "asyl", "integration", "nyanlända", "migration", "asylum", "integration"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.75,
    typicalDurationYears: [1, 3],
    status: "active",
  },
  {
    id: "erasmus",
    name: "Erasmus+",
    name_sv: "Erasmus+",
    shortName: "Erasmus+",
    logoLetter: "E",
    description_sv:
      "Möjliggör för verksamheter inom utbildnings- och ungdomsområdet att samarbeta med internationella partners, bland annat genom Erasmus+ mobilitet och Erasmus+ partnerskap.",
    description_en:
      "Enables organisations in education and youth work to cooperate with international partners, including through Erasmus+ mobility and Erasmus+ partnerships.",
    sectors: ["education"],
    keywords: ["utbildning", "skola", "ungdom", "personalutbyte", "kompetens", "education", "school", "youth", "training"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.8,
    typicalDurationYears: [1, 3],
    status: "active",
  },
  {
    id: "eui",
    name: "European Urban Initiative",
    name_sv: "European Urban Initiative (EUI)",
    shortName: "EUI",
    logoLetter: "U",
    description_sv:
      "Finansierar innovativa lösningar inom kategorierna \"Gröna städer\" och \"Hållbar turism\", för att ge städer möjlighet att testa nya lösningar i verklig skala tillsammans med olika intressenter.",
    description_en:
      "Funds innovative solutions in the categories \"Green cities\" and \"Sustainable tourism\", giving cities the chance to test new solutions at real scale together with different stakeholders.",
    sectors: ["climate", "mobility"],
    keywords: ["gröna städer", "hållbar turism", "innovation", "stadsutveckling", "green cities", "sustainable tourism"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.8,
    typicalDurationYears: [2, 3],
    status: "active",
  },
  {
    id: "erdf",
    name: "European Regional Development Fund",
    name_sv: "Europeiska regionala utvecklingsfonden (ERUF)",
    shortName: "ERDF",
    logoLetter: "R",
    description_sv:
      "Bidrar till investeringar i regional tillväxt och sysselsättning. Den övergripande målsättningen för regionens program är hållbar urban utveckling som stärker tillväxt och utveckling i regionens urbana miljöer.",
    description_en:
      "Supports investment in regional growth and employment. The overarching goal of the region's programme is sustainable urban development that strengthens growth in the region's urban environments.",
    sectors: ["digital", "mobility", "energy", "climate"],
    keywords: ["regional utveckling", "innovation", "infrastruktur", "digitalisering", "cirkulär ekonomi", "digital", "innovation", "infrastructure"],
    geographicScope: "sweden",
    typicalCoFinancingRate: 0.4,
    typicalDurationYears: [1, 3],
    status: "active",
  },
  {
    id: "esf",
    name: "European Social Fund+",
    name_sv: "Europeiska socialfonden+ (ESF+)",
    shortName: "ESF+",
    logoLetter: "S",
    description_sv:
      "Ska bidra till kompetensförsörjning, ökade övergångar till arbete och sysselsättning för unga, samt minska ekonomiska skillnader och olikheter i levnadsstandard mellan EU:s länder.",
    description_en:
      "Aims to support skills supply, increased transitions into work and employment for young people, and to reduce economic disparities between EU countries.",
    sectors: ["social", "education", "health"],
    keywords: ["kompetensutveckling", "arbetsmarknad", "inkludering", "socialtjänst", "kompetens", "skills", "employment", "social"],
    geographicScope: "sweden",
    typicalCoFinancingRate: 0.5,
    typicalDurationYears: [1, 3],
    status: "active",
  },
  {
    id: "havs-fiskeri",
    name: "Maritime, Fisheries and Aquaculture Programme",
    name_sv: "Havs-, fiskeri- och vattenbruksprogrammet",
    shortName: "Havs- och fiskeriprogrammet",
    logoLetter: "H",
    description_sv:
      "Skapar mervärden för samhället och stimulerar utveckling mot mer ekonomiskt, socialt och miljömässigt hållbara samt konkurrenskraftiga företag inom fiske, vattenbruk och beredning. Bidrar även till biologisk mångfald och hållbar havsförvaltning.",
    description_en:
      "Creates societal value and stimulates more economically, socially and environmentally sustainable and competitive businesses in fisheries, aquaculture and processing. Also contributes to biodiversity and sustainable ocean management.",
    sectors: ["climate"],
    keywords: ["hav", "fiske", "vattenbruk", "marin miljö", "marine", "fisheries"],
    geographicScope: "sweden",
    typicalCoFinancingRate: 0.5,
    typicalDurationYears: [1, 3],
    status: "active",
  },
  {
    id: "horizon",
    name: "Horizon Europe",
    name_sv: "Horisont Europa",
    shortName: "Horizon Europe",
    logoLetter: "H",
    description_sv:
      "EU:s program för forskning, innovation och utveckling inom bland annat hälsa, kultur och inkluderande samhällen, säkerhet, digitalisering, klimat, energi och mobilitet samt bioekonomi. Ställer krav på internationell samverkan, nära samverkan med akademin och hög innovationsnivå.",
    description_en:
      "The EU's programme for research, innovation and development in areas including health, culture and inclusive societies, security, digitalisation, climate, energy and mobility, and bioeconomy. Requires international cooperation, close ties with academia, and a high level of innovation.",
    sectors: ["research", "digital", "climate", "energy"],
    keywords: ["forskning", "innovation", "konsortium", "trl", "pilot", "research", "innovation", "consortium", "pilot"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.7,
    typicalDurationYears: [3, 4],
    status: "active",
  },
  {
    id: "horizon2020",
    name: "Horizon 2020",
    name_sv: "Horisont 2020",
    shortName: "Horizon 2020",
    logoLetter: "H",
    description_sv:
      "Föregångaren till Horisont Europa. EU:s forsknings- och innovationsprogram för perioden 2014–2020.",
    description_en:
      "The predecessor to Horizon Europe. The EU's research and innovation programme for 2014-2020.",
    sectors: ["research", "climate", "mobility"],
    keywords: ["forskning", "innovation", "research", "innovation"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.8,
    typicalDurationYears: [2, 4],
    status: "legacy",
  },
  {
    id: "interreg-baltic-sea",
    name: "Interreg Baltic Sea Region",
    name_sv: "Interreg Baltic Sea Region",
    shortName: "Interreg Baltic Sea",
    logoLetter: "I",
    description_sv:
      "Ger aktörer runt Östersjön möjlighet att samarbeta, lära av varandra och utarbeta gemensamma lösningar för urbana och miljömässiga utmaningar.",
    description_en:
      "Enables actors around the Baltic Sea to cooperate, learn from each other and develop joint solutions to urban and environmental challenges.",
    sectors: ["climate", "mobility"],
    keywords: ["östersjön", "gränsöverskridande", "samarbete", "baltic", "cross-border"],
    geographicScope: "cross-border-region",
    typicalCoFinancingRate: 0.65,
    typicalDurationYears: [2, 3],
    status: "active",
  },
  {
    id: "interreg-central-baltic",
    name: "Interreg Central Baltic",
    name_sv: "Interreg Central Baltic",
    shortName: "Interreg Central Baltic",
    logoLetter: "I",
    description_sv:
      "Ger aktörer från länderna kring centrala Östersjön möjlighet att samarbeta för att lära av varandra och utarbeta gemensamma lösningar för urbana utmaningar.",
    description_en:
      "Enables actors from countries around the Central Baltic Sea to cooperate, learn from each other and develop joint solutions to urban challenges.",
    sectors: ["climate", "mobility"],
    keywords: ["östersjön", "gränsöverskridande", "samarbete", "baltic", "cross-border"],
    geographicScope: "cross-border-region",
    typicalCoFinancingRate: 0.6,
    typicalDurationYears: [2, 3],
    status: "active",
  },
  {
    id: "interreg-north-sea",
    name: "Interreg North Sea",
    name_sv: "Interreg North Sea",
    shortName: "Interreg North Sea",
    logoLetter: "I",
    description_sv:
      "Samarbetsprogram för länder runt Nordsjön, med fokus på klimatanpassning, hållbar resursanvändning och innovation i gränsöverskridande partnerskap.",
    description_en:
      "Cooperation programme for countries around the North Sea, focused on climate adaptation, sustainable resource use and innovation in cross-border partnerships.",
    sectors: ["climate", "mobility"],
    keywords: ["nordsjön", "gränsöverskridande", "samarbete", "cross-border"],
    geographicScope: "cross-border-region",
    typicalCoFinancingRate: 0.6,
    typicalDurationYears: [2, 4],
    status: "active",
  },
  {
    id: "interreg-europe",
    name: "Interreg Europe",
    name_sv: "Interreg Europe",
    shortName: "Interreg Europe",
    logoLetter: "I",
    description_sv:
      "Stödjer interregionalt samarbete och erfarenhetsutbyte mellan regioner i hela EU, för att förbättra genomförandet av regional utvecklingspolitik.",
    description_en:
      "Supports interregional cooperation and experience-sharing between regions across the EU, to improve the delivery of regional development policy.",
    sectors: ["climate", "mobility", "digital"],
    keywords: ["interregionalt", "erfarenhetsutbyte", "policy", "cooperation"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.8,
    typicalDurationYears: [3, 4],
    status: "active",
  },
  {
    id: "digital-europe",
    name: "Digital Europe Programme",
    name_sv: "Digital Europe-programmet",
    shortName: "Digital Europe",
    logoLetter: "D",
    description_sv:
      "Stödjer digital omställning i offentlig sektor: AI, cybersäkerhet, avancerad digital kompetens och digitala tjänster till medborgare.",
    description_en:
      "Supports digital transformation in the public sector: AI, cybersecurity, advanced digital skills and digital services to citizens.",
    sectors: ["digital"],
    keywords: ["ai", "digitalisering", "digital", "cybersäkerhet", "automation"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.5,
    typicalDurationYears: [1, 3],
    status: "active",
  },
  {
    id: "cef",
    name: "Connecting Europe Facility",
    name_sv: "Fonden för ett sammanlänkat Europa (CEF)",
    shortName: "CEF",
    logoLetter: "C",
    description_sv:
      "Finansierar transport-, energi- och digital infrastruktur med gränsöverskridande betydelse, till exempel laddinfrastruktur och energinät.",
    description_en:
      "Funds transport, energy and digital infrastructure with cross-border relevance, such as charging infrastructure and energy networks.",
    sectors: ["energy", "mobility", "digital"],
    keywords: ["infrastruktur", "laddstolpar", "energinät", "infrastructure", "charging", "grid"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.3,
    typicalDurationYears: [2, 4],
    status: "active",
  },
  {
    id: "life",
    name: "LIFE Programme",
    name_sv: "LIFE-programmet",
    shortName: "LIFE",
    logoLetter: "L",
    description_sv:
      "EU:s finansieringsinstrument för miljö- och klimatåtgärder. Stödjer projekt inom energieffektivisering, naturvård, cirkulär ekonomi och klimatanpassning.",
    description_en:
      "The EU's funding instrument for environmental and climate action. Supports projects in energy efficiency, nature conservation, circular economy and climate adaptation.",
    sectors: ["energy", "climate"],
    keywords: ["energi", "energieffektivisering", "klimat", "hållbarhet", "energy", "climate"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.6,
    typicalDurationYears: [2, 4],
    status: "active",
  },
  {
    id: "kreativa-europa",
    name: "Creative Europe",
    name_sv: "Kreativa Europa",
    shortName: "Kreativa Europa",
    logoLetter: "K",
    description_sv:
      "Stödjer projekt inom kultur, audiovisuella medier och kreativa sektorer, inklusive internationellt samarbete mellan kulturaktörer.",
    description_en:
      "Supports projects in culture, audiovisual media and the creative sectors, including international cooperation between cultural actors.",
    sectors: ["education", "social"],
    keywords: ["kultur", "konst", "kreativitet", "culture", "art", "creative"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.6,
    typicalDurationYears: [1, 3],
    status: "active",
  },
  {
    id: "urbact",
    name: "URBACT",
    name_sv: "URBACT",
    shortName: "URBACT",
    logoLetter: "U",
    description_sv:
      "Europeiskt program för hållbar stadsutveckling genom erfarenhetsutbyte och nätverkande mellan städer.",
    description_en:
      "European programme for sustainable urban development through experience-sharing and networking between cities.",
    sectors: ["climate", "mobility", "social"],
    keywords: ["stadsutveckling", "nätverk", "erfarenhetsutbyte", "urban development", "networking"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.8,
    typicalDurationYears: [2, 3],
    status: "active",
  },
  {
    id: "landsbygdsprogrammet",
    name: "Rural Development Programme",
    name_sv: "Landsbygdsprogrammet",
    shortName: "Landsbygdsprogrammet",
    logoLetter: "L",
    description_sv:
      "Nationellt program, delvis EU-finansierat via jordbruksfonden för landsbygdsutveckling, som stödjer landsbygdsutveckling, gröna näringar och besöksnäring.",
    description_en:
      "National programme, partly EU-funded via the fund for rural development, supporting rural development, green industries and tourism.",
    sectors: ["climate", "mobility"],
    keywords: ["landsbygd", "besöksnäring", "rural", "tourism"],
    geographicScope: "sweden",
    typicalCoFinancingRate: 0.5,
    typicalDurationYears: [1, 3],
    status: "active",
  },
  {
    id: "fp7",
    name: "Seventh Framework Programme",
    name_sv: "Sjunde ramprogrammet (FP7)",
    shortName: "FP7",
    logoLetter: "F",
    description_sv: "EU:s forskningsramprogram för perioden 2007–2013, föregångare till Horisont 2020.",
    description_en: "The EU's research framework programme for 2007-2013, predecessor to Horizon 2020.",
    sectors: ["research", "climate"],
    keywords: ["forskning", "research"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.75,
    typicalDurationYears: [2, 4],
    status: "legacy",
  },
  {
    id: "iee",
    name: "Intelligent Energy Europe",
    name_sv: "Intelligent Energi Europa (IEE)",
    shortName: "IEE",
    logoLetter: "I",
    description_sv: "Historiskt EU-program (2003–2013) som stödde initiativ inom energieffektivisering och förnybar energi.",
    description_en: "A historical EU programme (2003-2013) supporting initiatives in energy efficiency and renewable energy.",
    sectors: ["energy"],
    keywords: ["energi", "förnybar energi", "energy", "renewable"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.75,
    typicalDurationYears: [2, 3],
    status: "legacy",
  },
  {
    id: "jpi-urban-europe",
    name: "JPI Urban Europe",
    name_sv: "JPI Urban Europe",
    shortName: "JPI Urban Europe",
    logoLetter: "J",
    description_sv:
      "Gemensamt programinitiativ (Joint Programming Initiative) mellan europeiska länder och forskningsfinansiärer med fokus på hållbar stadsutveckling, samfinansierat nationellt (i Sverige bland annat av Energimyndigheten).",
    description_en:
      "A Joint Programming Initiative between European countries and research funders focused on sustainable urban development, co-funded nationally (in Sweden partly via the Swedish Energy Agency).",
    sectors: ["energy", "climate", "mobility"],
    keywords: ["stadsutveckling", "forskning", "urban development", "research"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.5,
    typicalDurationYears: [2, 3],
    status: "active",
  },
  {
    id: "driving-urban-transitions",
    name: "Driving Urban Transitions Partnership",
    name_sv: "Driving Urban Transitions Partnership (DUT)",
    shortName: "DUT",
    logoLetter: "D",
    description_sv:
      "Europeiskt partnerskap inom Horisont Europa för klimatneutral och hållbar stadsutveckling, samfinansierat nationellt (i Sverige av Formas).",
    description_en:
      "A European partnership under Horizon Europe for climate-neutral and sustainable urban transitions, co-funded nationally (in Sweden by Formas).",
    sectors: ["climate", "energy", "mobility"],
    keywords: ["stadsomställning", "klimatneutral", "urban transition", "climate-neutral"],
    geographicScope: "eu-wide",
    typicalCoFinancingRate: 0.5,
    typicalDurationYears: [2, 3],
    status: "active",
  },
];

export function findProgram(id: string): FundingProgram | undefined {
  return fundingPrograms.find((p) => p.id === id);
}

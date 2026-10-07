import { FundingCall, FundTheme, Lang } from "@/lib/types";
import { findProgram } from "@/lib/data/fundingPrograms";

// The 13 themes eufonder.se's "Hitta EU-finansiering"
// (https://eufonder.se/eufonder/hittaeufinansiering.6109.html) groups EU
// funding by, in the order the site lists them. Each fund's themes live on
// the fund itself (FundingProgram.themes); a call inherits them unless it
// sets its own (see callThemes).
export interface FundThemeInfo {
  id: FundTheme;
  label_sv: string;
  label_en: string;
  description_sv: string;
  description_en: string;
}

export const fundThemes: FundThemeInfo[] = [
  {
    id: "digitalisering",
    label_sv: "Digitalisering",
    label_en: "Digitalisation",
    description_sv:
      "EU vill främja digitaliseringen för ekonomisk tillväxt, effektivitet, innovation, inkludering, miljöhänsyn och cybersäkerhet.",
    description_en:
      "The EU promotes digitalisation for economic growth, efficiency, innovation, inclusion, environmental care and cybersecurity.",
  },
  {
    id: "forskning-innovation",
    label_sv: "Forskning och innovation",
    label_en: "Research and innovation",
    description_sv: "Projekt som tar fram ny kunskap och nya lösningar och för ut dem i praktiken.",
    description_en: "Projects that create new knowledge and solutions and put them into practice.",
  },
  {
    id: "industri",
    label_sv: "Industri",
    label_en: "Industry",
    description_sv: "Projekt som stärker industrins konkurrenskraft och dess omställning till en miljövänligare ekonomi.",
    description_en: "Projects that strengthen industry's competitiveness and its transition to a greener economy.",
  },
  {
    id: "kompetens-entreprenorskap",
    label_sv: "Kompetens och entreprenörskap",
    label_en: "Skills and entrepreneurship",
    description_sv: "Projekt som höjer kompetensen hos människor och företag och främjar entreprenörskap.",
    description_en: "Projects that raise the skills of people and businesses and promote entrepreneurship.",
  },
  {
    id: "landsbygd-hav-fiske",
    label_sv: "Landsbygd, hav, fiske och vattenbruk",
    label_en: "Rural areas, sea, fisheries and aquaculture",
    description_sv: "Stöd till landsbygdens utveckling, jordbruk, fiske, vattenbruk och en hållbar förvaltning av haven.",
    description_en: "Support for rural development, agriculture, fisheries, aquaculture and sustainable ocean management.",
  },
  {
    id: "migration-integration",
    label_sv: "Migration och integration",
    label_en: "Migration and integration",
    description_sv: "Projekt som bidrar till en hållbar migration och till att nyanlända kommer in i samhället och arbetslivet.",
    description_en: "Projects that support sustainable migration and help newcomers into society and working life.",
  },
  {
    id: "miljo-klimat",
    label_sv: "Miljö och klimat",
    label_en: "Environment and climate",
    description_sv: "Projekt som minskar klimatpåverkan, anpassar samhället till ett förändrat klimat och skyddar naturen.",
    description_en: "Projects that cut climate impact, adapt society to a changing climate and protect nature.",
  },
  {
    id: "risker-kriser",
    label_sv: "Risker och kriser",
    label_en: "Risks and crises",
    description_sv: "Projekt inom krishantering och samhällsskydd som gör samhället bättre rustat för risker och kriser.",
    description_en: "Crisis management and civil protection projects that make society better prepared for risks and crises.",
  },
  {
    id: "samarbete-lander",
    label_sv: "Samarbete mellan länder",
    label_en: "Cooperation between countries",
    description_sv: "Projekt där städer, regioner och organisationer i olika länder arbetar tillsammans över nationsgränserna.",
    description_en: "Projects where cities, regions and organisations in different countries work together across borders.",
  },
  {
    id: "social-inkludering",
    label_sv: "Social inkludering",
    label_en: "Social inclusion",
    description_sv: "Projekt som bekämpar fattigdom och gör det lättare för alla att delta i samhället och arbetslivet.",
    description_en: "Projects that fight poverty and make it easier for everyone to take part in society and working life.",
  },
  {
    id: "sakerhet-granskontroll",
    label_sv: "Säkerhet och gränskontroll",
    label_en: "Security and border control",
    description_sv: "Projekt som stärker den inre säkerheten, gränsförvaltningen och viseringspolitiken i EU.",
    description_en: "Projects that strengthen internal security, border management and visa policy in the EU.",
  },
  {
    id: "transport-resande",
    label_sv: "Transport och resande",
    label_en: "Transport and travel",
    description_sv:
      "Hållbara transporter, utvecklad infrastruktur och effektivt resande som länkar samman Sverige med resten av Skandinavien och Europa.",
    description_en:
      "Sustainable transport, developed infrastructure and efficient travel linking Sweden with the rest of Scandinavia and Europe.",
  },
  {
    id: "turism",
    label_sv: "Turism",
    label_en: "Tourism",
    description_sv: "Projekt som utvecklar besöksnäringen och gör platser mer attraktiva att besöka.",
    description_en: "Projects that develop the visitor economy and make places more attractive to visit.",
  },
];

export const ALL_FUND_THEMES = fundThemes.map((t) => t.id);

export function isFundTheme(value: string | null | undefined): value is FundTheme {
  return !!value && (ALL_FUND_THEMES as string[]).includes(value);
}

export function findFundTheme(id: FundTheme): FundThemeInfo {
  return fundThemes.find((t) => t.id === id)!;
}

export function fundThemeLabel(id: FundTheme, lang: Lang): string {
  const theme = findFundTheme(id);
  return lang === "sv" ? theme.label_sv : theme.label_en;
}

/** A call's themes: its own when set, otherwise its programme's. */
export function callThemes(call: FundingCall): FundTheme[] {
  return call.themes ?? findProgram(call.programId)?.themes ?? [];
}

// The free-text "Tema" column in data/utlysningar.csv uses its own
// vocabulary; this maps it onto the eufonder.se themes for an import.
const CSV_TEMA_TO_THEMES: Record<string, FundTheme[]> = {
  "klimat och miljö": ["miljo-klimat"],
  energi: ["miljo-klimat"],
  "mobilitet och transport": ["transport-resande"],
  utbildning: ["kompetens-entreprenorskap"],
  "social omsorg": ["social-inkludering"],
  hälsa: ["risker-kriser"],
};

/** The eufonder.se themes for a "Tema" value from data/utlysningar.csv, or
 * undefined when it isn't one we know (so the call inherits its
 * programme's themes instead). */
export function themesFromCsvTema(tema: string): FundTheme[] | undefined {
  return CSV_TEMA_TO_THEMES[tema.trim().toLowerCase()];
}

// Texts for the views built on the imported reference data (Kohesio,
// Keep.eu, CORDIS, ESF-projektbanken) and the calls from
// data/utlysningar.csv. Kept apart from translations.ts only for size;
// reached the same way, as t.imported.

export interface ImportedTexts {
  sourceBadge: (source: string) => string;
  sourceFilterAll: string;
  sourceExample: string;
  programFilterAll: string;
  countryFilterAll: string;
  yearFilterAll: string;
  filterSource: string;
  filterProgram: string;
  filterCountry: string;
  filterYear: string;
  exampleTitle: string;
  exampleCount: (n: number) => string;
  importedTitle: string;
  importedIntro: string;
  showingCount: (shown: number, total: number) => string;
  loadMore: string;
  loading: string;
  loadError: string;
  noImported: string;
  fieldCountry: string;
  fieldPeriod: string;
  fieldTotal: string;
  fieldEu: string;
  fieldNationalGrant: string;
  fieldPartners: string;
  fieldThemes: string;
  openInSource: string;
  amountTooltipConverted: (original: string, year: number, rate: string) => string;
  amountTooltipSek: string;
  similarTitle: string;
  similarIntro: string;
  similarNone: string;
  showAll: (n: number) => string;
  showFewer: string;
  similarCompared: (n: number) => string;
  similarWhy: string;
  partnersTitle: string;
  partnersIntro: string;
  partnersNone: string;
  partnerRoles: (coordinator: number, partner: number, associated: number) => string;
  partnerProjects: (n: number) => string;
  partnerIn: string;
  colOrganisation: string;
  colRole: string;
  colCountry: string;
  colProjects: string;
  benchmarkLabel: string;
  benchmarkLine: (range: string, median: string) => string;
  benchmarkBasis: (count: number, programs: string, theme: string, themed: boolean) => string;
  benchmarkNone: string;
  benchmarkTooltip: (range: string, median: string, spread: "p10-p90" | "min-max") => string;
  historyTab: string;
  historyTitle: string;
  historyIntro: (name: string) => string;
  historyNoProjects: (name: string) => string;
  historyRules: (sure: string, from: string) => string;
  historyNone: string;
  statProjects: string;
  statEu: string;
  statPrograms: string;
  byProgramTitle: string;
  projectsTitle: string;
  colProject: string;
  colProgram: string;
  colPeriod: string;
  colEu: string;
  colSource: string;
  colMatchedOn: string;
  roles: { coordinator: string; partner: string; "associated-partner": string };
  candidatesTitle: string;
  candidatesIntro: string;
  colReason: string;
  colDecision: string;
  confirmMatch: string;
  rejectMatch: string;
  undoDecision: string;
  confirmedManually: string;
  rejectedTitle: (count: number) => string;
  peersTitle: string;
  peersIntro: (group: string) => string;
  peerGroupLabel: string;
  colMunicipality: string;
  vinnovaTitle: string;
  vinnovaIntro: (name: string, count: number, total: string) => string;
  vinnovaNone: (name: string) => string;
  colCoordinator: string;
  colGrant: string;
  colVinnova: string;
  callStatus: { open: string; planned: string; upcoming: string; expected: string };
  opens: string;
  closes: string;
  preliminary: string;
  preliminaryTooltip: string;
  grantNotStated: string;
  callAmountTooltip: (min: string, max: string, year: number, rate: string) => string;
  upcomingMatchNote: (opens: string) => string;
  callSourceLink: string;
  callComment: string;
  callFromList: string;
}

export const importedSv: ImportedTexts = {
  sourceBadge: (source) => `Källa: ${source}`,
  sourceFilterAll: "Alla källor",
  sourceExample: "Exempel",
  programFilterAll: "Alla program",
  countryFilterAll: "Alla länder",
  yearFilterAll: "Alla år",
  filterSource: "Källa",
  filterProgram: "Program",
  filterCountry: "Land",
  filterYear: "Startår",
  exampleTitle: "Exempelprojekt",
  exampleCount: (n) => `${n} exempelprojekt`,
  importedTitle: "Projekt ur EU:s projektdatabaser",
  importedIntro:
    "Beviljade projekt ur Kohesio, Keep.eu, CORDIS och ESF-rådets projektbank. Belopp i kronor, omräknade från euro med årsmedelkursen för projektets startår – håll muspekaren över beloppet för originalbeloppet.",
  showingCount: (shown, total) => `Visar ${shown} av ${total.toLocaleString("sv-SE")} projekt`,
  loadMore: "Visa fler",
  loading: "Hämtar…",
  loadError: "Kunde inte hämta projekten. Försök igen.",
  noImported: "Inga projekt matchar filtret.",
  fieldCountry: "Land (koordinator)",
  fieldPeriod: "Projektperiod",
  fieldTotal: "Total budget",
  fieldEu: "EU-bidrag",
  fieldNationalGrant: "Bidrag från Vinnova",
  fieldPartners: "Organisationer",
  fieldThemes: "Tema",
  openInSource: "Visa i källan",
  amountTooltipConverted: (original, year, rate) => `Originalbelopp: ${original}. Omräknat med årsmedelkursen ${year} (${rate} kr/euro).`,
  amountTooltipSek: "Källan anger beloppet i kronor.",
  similarTitle: "Liknande projekt i EU:s projektdatabaser",
  similarIntro:
    "Hittade med en översättningstabell från appens teman till källornas egna koder (Kohesios interventionskategorier, CORDIS-ämnen och Keep.eu-teman) och en svensk-engelsk ordlista, så att svenska idéer hittar engelska projekt. Ingen AI.",
  showAll: (n: number) => `Visa alla ${n}`,
  showFewer: "Visa färre",
  similarNone: "Inga liknande projekt i den importerade datan. Lägg till fler ord i beskrivningen eller fler taggar.",
  similarCompared: (n) => `Jämfört med ${n.toLocaleString("sv-SE")} importerade projekt.`,
  similarWhy: "Varför liknande",
  partnersTitle: "Möjliga partners",
  partnersIntro: "Organisationer som varit med i de mest liknande projekten, med roll, land och antal projekt.",
  partnersNone: "Inga partners hittades i de liknande projekten.",
  partnerRoles: (c, p, a) =>
    [c > 0 && `koordinator i ${c}`, p > 0 && `partner i ${p}`, a > 0 && `associerad i ${a}`].filter(Boolean).join(", ").replace(/^./, (s) => s.toUpperCase()),
  partnerProjects: (n) => `${n} projekt`,
  partnerIn: "Med i",
  colOrganisation: "Organisation",
  colRole: "Roll",
  colCountry: "Land",
  colProjects: "Liknande projekt",
  benchmarkLabel: "Beviljat i liknande projekt",
  benchmarkLine: (range, median) => `${range}, median ${median}`,
  benchmarkBasis: (count, programs, theme, themed) =>
    themed ? `${count} projekt i ${programs} med temat ${theme}` : `${count} projekt i ${programs} (för få med temat ${theme})`,
  benchmarkNone: "Inget underlag: den importerade datan har inga beviljade projekt i programmet.",
  benchmarkTooltip: (range, median, spread) =>
    `I euro: ${range}, median ${median}. ${spread === "p10-p90" ? "Spannet visar de mittersta 80 procenten (10:e–90:e percentilen)." : "Spannet visar minsta och största belopp."} EU-bidrag per projekt.`,
  historyTab: "Er EU-historik",
  historyTitle: "Er EU-historik",
  historyIntro: (name) => `${name}s EU-finansierade projekt sedan 2014, hittade i Kohesio, Keep.eu, CORDIS, ESF-rådets och Tillväxtverkets projektbanker, EU:s Financial Transparency System och Erasmus+ projektlistor.`,
  historyNoProjects: (name) =>
    `Källorna visar inga projekt sedan 2014 där ${name} är stödmottagare eller partner med sitt organisationsnummer, momsnummer, PIC eller kommunens namn. Projekt där kommunen deltar under ett annat namn eller som partner i Kohesio syns inte här; jämförelsen nedan visar vad andra kommuner har fått.`,
  historyRules: (sure, from) => `Säkra träffar: ${sure}. Projekt som slutade före ${from} räknas inte.`,
  historyNone: "Ingen historik är importerad.",
  statProjects: "Projekt",
  statEu: "EU-bidrag till kommunen",
  statPrograms: "Program",
  byProgramTitle: "Per program",
  projectsTitle: "Projekten",
  colProject: "Projekt",
  colProgram: "Program",
  colPeriod: "Period",
  colEu: "EU-bidrag",
  colSource: "Källa",
  colMatchedOn: "Hittat via",
  roles: { coordinator: "Koordinator", partner: "Partner", "associated-partner": "Associerad partner" },
  candidatesTitle: "Möjliga träffar, inte bekräftade",
  candidatesIntro:
    "Namnlika organisationer och projekttitlar som nämner kommunen. De räknas inte in i summorna ovan förrän de är bekräftade. Bekräfta eller avfärda dem här; valet sparas i den här webbläsaren.",
  colReason: "Varför",
  colDecision: "Bekräfta eller avfärda",
  confirmMatch: "Bekräfta",
  rejectMatch: "Avfärda",
  undoDecision: "Ångra",
  confirmedManually: "Bekräftad manuellt",
  rejectedTitle: (count) => `Avfärdade träffar (${count})`,
  peersTitle: "Jämfört med andra kommuner",
  peersIntro: (group) => `Samma sökning för jämförelsegruppen. ${group} EU-bidraget är kommunens egen andel.`,
  peerGroupLabel: "Jämför med",
  vinnovaTitle: "Nationell innovationsfinansiering (Vinnova)",
  vinnovaIntro: (name, count, total) =>
    `${name} har varit koordinator i ${count} Vinnovaprojekt sedan 2014, med ${total} i beviljat bidrag. Vinnova anger inget organisationsnummer, så träffen bygger på att koordinatorns namn är exakt kommunens. Bidragen är nationella och ingår inte i EU-siffrorna ovan.`,
  vinnovaNone: (name) => `${name} har inte varit koordinator i något Vinnovaprojekt sedan 2014 enligt Vinnovas öppna data.`,
  colCoordinator: "Koordinator",
  colGrant: "Beviljat bidrag",
  colVinnova: "Vinnova (nationellt)",
  colMunicipality: "Kommun",
  callStatus: { open: "Öppen", planned: "Planerad", upcoming: "Kommande", expected: "Förväntad" },
  opens: "Öppnar",
  closes: "Stänger",
  preliminary: "prel.",
  preliminaryTooltip: "Preliminärt datum",
  grantNotStated: "Ej angivet",
  callAmountTooltip: (min, max, year, rate) => `Originalbelopp: ${min}–${max}. Omräknat med årsmedelkursen ${year} (${rate} kr/euro).`,
  upcomingMatchNote: (opens) => `Kommande utlysning – öppnar ${opens}`,
  callSourceLink: "Utlysningen hos finansiären",
  callComment: "Kommentar",
  callFromList: "Från utlysningslistan",
};

export const importedEn: ImportedTexts = {
  sourceBadge: (source) => `Source: ${source}`,
  sourceFilterAll: "All sources",
  sourceExample: "Example",
  programFilterAll: "All programmes",
  countryFilterAll: "All countries",
  yearFilterAll: "All years",
  filterSource: "Source",
  filterProgram: "Programme",
  filterCountry: "Country",
  filterYear: "Start year",
  exampleTitle: "Example projects",
  exampleCount: (n) => `${n} example projects`,
  importedTitle: "Projects from the EU project databases",
  importedIntro:
    "Funded projects from Kohesio, Keep.eu, CORDIS and the ESF Council's project bank. Amounts in SEK, converted from euro at the yearly average rate of the project's start year — hover over an amount for the original.",
  showingCount: (shown, total) => `Showing ${shown} of ${total.toLocaleString("en-US")} projects`,
  loadMore: "Show more",
  loading: "Loading…",
  loadError: "Could not load the projects. Try again.",
  noImported: "No projects match the filter.",
  fieldCountry: "Country (coordinator)",
  fieldPeriod: "Project period",
  fieldTotal: "Total budget",
  fieldEu: "EU contribution",
  fieldNationalGrant: "Vinnova grant",
  fieldPartners: "Organisations",
  fieldThemes: "Theme",
  openInSource: "View in source",
  amountTooltipConverted: (original, year, rate) => `Original amount: ${original}. Converted at the ${year} yearly average (SEK ${rate}/EUR).`,
  amountTooltipSek: "The source states the amount in SEK.",
  similarTitle: "Similar projects in the EU project databases",
  similarIntro:
    "Found with a translation table from the app's themes to the sources' own codes (Kohesio's categories of intervention, CORDIS topics and Keep.eu themes) and a Swedish–English word list, so Swedish ideas find English projects. No AI.",
  showAll: (n: number) => `Show all ${n}`,
  showFewer: "Show fewer",
  similarNone: "No similar projects in the imported data. Add more words to the description or more tags.",
  similarCompared: (n) => `Compared with ${n.toLocaleString("en-US")} imported projects.`,
  similarWhy: "Why similar",
  partnersTitle: "Possible partners",
  partnersIntro: "Organisations that took part in the most similar projects, with role, country and number of projects.",
  partnersNone: "No partners found in the similar projects.",
  partnerRoles: (c, p, a) =>
    [c > 0 && `coordinator in ${c}`, p > 0 && `partner in ${p}`, a > 0 && `associated in ${a}`].filter(Boolean).join(", ").replace(/^./, (s) => s.toUpperCase()),
  partnerProjects: (n) => `${n} ${n === 1 ? "project" : "projects"}`,
  partnerIn: "In",
  colOrganisation: "Organisation",
  colRole: "Role",
  colCountry: "Country",
  colProjects: "Similar projects",
  benchmarkLabel: "Granted in similar projects",
  benchmarkLine: (range, median) => `${range}, median ${median}`,
  benchmarkBasis: (count, programs, theme, themed) =>
    themed ? `${count} projects in ${programs} on the theme ${theme}` : `${count} projects in ${programs} (too few on the theme ${theme})`,
  benchmarkNone: "No basis: the imported data has no funded projects in this programme.",
  benchmarkTooltip: (range, median, spread) =>
    `In euro: ${range}, median ${median}. ${spread === "p10-p90" ? "The span shows the middle 80 per cent (10th–90th percentile)." : "The span shows the smallest and largest amount."} EU contribution per project.`,
  historyTab: "Your EU history",
  historyTitle: "Your EU history",
  historyIntro: (name) => `${name}'s EU-funded projects since 2014, found in Kohesio, Keep.eu, CORDIS, the ESF Council's and Tillväxtverket's project banks, the EU Financial Transparency System and the Erasmus+ project lists.`,
  historyNoProjects: (name) =>
    `The sources show no projects since 2014 where ${name} is beneficiary or partner under its organisation number, VAT number, PIC or the municipality's name. Projects where the municipality takes part under another name, or as a partner in Kohesio, don't show here; the comparison below shows what other municipalities received.`,
  historyRules: (sure, from) => `Sure matches: ${sure}. Projects that ended before ${from} are not counted.`,
  historyNone: "No history has been imported.",
  statProjects: "Projects",
  statEu: "EU contribution to the municipality",
  statPrograms: "Programmes",
  byProgramTitle: "By programme",
  projectsTitle: "The projects",
  colProject: "Project",
  colProgram: "Programme",
  colPeriod: "Period",
  colEu: "EU contribution",
  colSource: "Source",
  colMatchedOn: "Found via",
  roles: { coordinator: "Coordinator", partner: "Partner", "associated-partner": "Associated partner" },
  candidatesTitle: "Possible matches, not confirmed",
  candidatesIntro:
    "Organisations with similar names and project titles naming the municipality. Not counted in the totals above until confirmed. Confirm or reject them here; the choice is saved in this browser.",
  colReason: "Why",
  colDecision: "Confirm or reject",
  confirmMatch: "Confirm",
  rejectMatch: "Reject",
  undoDecision: "Undo",
  confirmedManually: "Confirmed manually",
  rejectedTitle: (count) => `Rejected matches (${count})`,
  peersTitle: "Compared with other municipalities",
  peersIntro: (group) => `The same search for the comparison group. ${group} The EU contribution is the municipality's own share.`,
  peerGroupLabel: "Compare with",
  vinnovaTitle: "National innovation funding (Vinnova)",
  vinnovaIntro: (name, count, total) =>
    `${name} has coordinated ${count} Vinnova ${count === 1 ? "project" : "projects"} since 2014, with ${total} in grants. Vinnova gives no organisation number, so a project is matched when the coordinator's name is exactly the municipality's. The grants are national and not part of the EU figures above.`,
  vinnovaNone: (name) => `${name} has not coordinated any Vinnova project since 2014 according to Vinnova's open data.`,
  colCoordinator: "Coordinator",
  colGrant: "Grant",
  colVinnova: "Vinnova (national)",
  colMunicipality: "Municipality",
  callStatus: { open: "Open", planned: "Planned", upcoming: "Upcoming", expected: "Expected" },
  opens: "Opens",
  closes: "Closes",
  preliminary: "prelim.",
  preliminaryTooltip: "Preliminary date",
  grantNotStated: "Not stated",
  callAmountTooltip: (min, max, year, rate) => `Original amount: ${min}–${max}. Converted at the ${year} yearly average (SEK ${rate}/EUR).`,
  upcomingMatchNote: (opens) => `Upcoming call — opens ${opens}`,
  callSourceLink: "The call at the funder",
  callComment: "Comment",
  callFromList: "From the call list",
};

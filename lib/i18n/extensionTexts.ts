// Texts for the partner search, the leadership report, co-financing and
// liquidity, audit readiness and the show/hide of outdated calls. Kept
// apart from translations.ts only for size; reached as t.ext.

import type { OrganisationType } from "@/lib/integrations/core/types";

export interface ExtensionTexts {
  calls: {
    showOutdated: (n: number) => string;
    closedStatus: string;
    outdatedHidden: (n: number) => string;
  };
  partners: {
    tab: string;
    title: string;
    intro: string;
    searchPlaceholder: string;
    searchLabel: string;
    typeLabel: string;
    typeAll: string;
    typeUnknown: string;
    types: Record<OrganisationType, string>;
    typeFromNameTooltip: string;
    countryLabel: string;
    countryAll: string;
    programLabel: string;
    programAll: string;
    sectorLabel: string;
    sectorAll: string;
    periodLabel: string;
    periodAll: string;
    onlyCoordinators: string;
    excludeOwn: (name: string) => string;
    resultCount: (organisations: number, projects: number) => string;
    none: string;
    loading: string;
    loadError: string;
    loadMore: string;
    roleSummary: (coordinator: number, partner: number, associated: number) => string;
    projectCount: (n: number) => string;
    latestYear: (year: number) => string;
    showProjects: (n: number) => string;
    hideProjects: string;
    sourceNote: string;
    moreInPartnerSearch: string;
  };
  datacenterTabs: {
    label: string;
    overview: string;
    leadership: string;
    cofinancing: string;
  };
  leadership: {
    title: string;
    intro: string;
    print: string;
    generated: (date: string) => string;
    portfolioTitle: string;
    portfolioIntro: string;
    statProjects: string;
    statPortfolioCost: string;
    statSubmitted: string;
    statPending: string;
    statPendingAmount: string;
    statAwarded: string;
    statAwardedAmount: string;
    statRejected: string;
    statSuccessRate: string;
    successRateNone: string;
    reportingTitle: string;
    statReportsApproved: string;
    statReportsSubmitted: string;
    statReportsRevision: string;
    statReportsOverdue: string;
    statReportsUpcoming: string;
    cofinancingTitle: string;
    cofinancingLine: (awarded: string, pending: string) => string;
    cofinancingPeak: (sek: string, year: number) => string;
    cofinancingLink: string;
    peersTitle: string;
    peersIntro: (name: string) => string;
    colMunicipality: string;
    colPopulation: string;
    colProjects: string;
    colEu: string;
    colPerCapita: string;
    colPeriod1420: string;
    colPeriod2127: string;
    colRank: string;
    rankLine: (name: string, rank: number, of: number, perCapita: string, median: string) => string;
    perCapitaUnit: string;
    populationSource: (year: number) => string;
    byProgramTitle: string;
    byProgramIntro: (name: string) => string;
    colProgram: string;
    colOwn: string;
    colPeerMedian: string;
    noPeers: string;
    caveatsTitle: string;
    exampleDataNote: string;
  };
  cofinancing: {
    title: string;
    intro: string;
    assumptionsTitle: string;
    advanceDirectLabel: string;
    advanceSharedLabel: string;
    lagLabel: string;
    fxLabel: string;
    includeDrafts: string;
    assumptionsNote: string;
    statOwnTotal: string;
    statGrantTotal: string;
    statPeak: string;
    statPeakYear: (year: number) => string;
    statFx: (pct: number) => string;
    statFxNone: string;
    perYearTitle: string;
    perYearIntro: string;
    colYear: string;
    colCost: string;
    colOwn: string;
    colEarned: string;
    colReceived: string;
    colExposure: string;
    itemsTitle: string;
    colProject: string;
    colStage: string;
    colProgram: string;
    colPeriod: string;
    colTotal: string;
    colGrant: string;
    colCurrency: string;
    stages: { awarded: string; pending: string; draft: string };
    decisionDocx: string;
    decisionDocxHint: string;
    none: string;
  };
  audit: {
    title: string;
    intro: string;
    progress: (done: number, total: number) => string;
    allDone: string;
    whyShow: string;
    whyHide: string;
    doneOn: (date: string) => string;
    certificateThreshold: (amount: string) => string;
    disclaimer: string;
  };
}

export const extensionSv: ExtensionTexts = {
  calls: {
    showOutdated: (n) => `Visa inaktuella utlysningar (${n})`,
    closedStatus: "Stängd",
    outdatedHidden: (n) => `${n} ${n === 1 ? "utlysning har" : "utlysningar har"} redan stängt och är dolda.`,
  },
  partners: {
    tab: "Partnersök",
    title: "Partnersök",
    intro:
      "Hitta organisationer som har drivit eller deltagit i EU-projekt inom ett tema, ett program eller ett land. Underlaget är de importerade projekten från Kohesio, Keep.eu, CORDIS och ESF-rådets projektbank.",
    searchPlaceholder: "Sök på ämne eller organisation, t.ex. klimatanpassning eller Tampere",
    searchLabel: "Sök",
    typeLabel: "Typ av organisation",
    typeAll: "Alla typer",
    typeUnknown: "Typ okänd",
    types: {
      municipality: "Kommun eller stad",
      region: "Region",
      university: "Lärosäte",
      sme: "Litet eller medelstort företag",
      "large-enterprise": "Stort företag",
      ngo: "Ideell organisation",
      "national-authority": "Statlig myndighet",
      "research-institute": "Forskningsinstitut",
    },
    typeFromNameTooltip: "Källan anger ingen typ; typen är läst ur namnet.",
    countryLabel: "Land",
    countryAll: "Alla länder",
    programLabel: "Program",
    programAll: "Alla program",
    sectorLabel: "Tema",
    sectorAll: "Alla teman",
    periodLabel: "Programperiod",
    periodAll: "Båda perioderna",
    onlyCoordinators: "Bara de som har lett ett projekt",
    excludeOwn: (name) => `Utan ${name}`,
    resultCount: (o, p) => `${o.toLocaleString("sv-SE")} organisationer i ${p.toLocaleString("sv-SE")} projekt`,
    none: "Inga organisationer matchar sökningen.",
    loading: "Söker …",
    loadError: "Partnersöket kunde inte hämtas.",
    loadMore: "Visa fler",
    roleSummary: (c, p, a) =>
      [c > 0 && `koordinator i ${c}`, p > 0 && `partner i ${p}`, a > 0 && `associerad i ${a}`]
        .filter(Boolean)
        .join(", ")
        .replace(/^./, (s) => s.toUpperCase()),
    projectCount: (n) => `${n} projekt`,
    latestYear: (y) => `senast ${y}`,
    showProjects: (n) => `Visa ${n === 1 ? "projektet" : "projekten"}`,
    hideProjects: "Dölj projekten",
    sourceNote:
      "Kontaktuppgifter finns i källan för varje projekt. Organisationernas namn står som källan skriver dem, så samma organisation kan förekomma under flera namn.",
    moreInPartnerSearch: "Sök fler partners i partnersöket",
  },
  datacenterTabs: {
    label: "Datacenter",
    overview: "Översikt",
    leadership: "Ledningsrapport",
    cofinancing: "Medfinansiering",
  },
  leadership: {
    title: "Ledningsrapport",
    intro: "Läget för organisationens externa finansiering och hur kommunen står sig mot de största kommunerna, samlat för ledning och nämnd.",
    print: "Skriv ut eller spara som PDF",
    generated: (d) => `Sammanställd ${d}`,
    portfolioTitle: "Egen portfölj",
    portfolioIntro: "Projekt, ansökningar och beviljat stöd som är registrerade i EU Navigator.",
    statProjects: "Projekt i portföljen",
    statPortfolioCost: "Projektens beräknade kostnad",
    statSubmitted: "Inskickade ansökningar",
    statPending: "Hos finansiären",
    statPendingAmount: "Sökt bidrag hos finansiären",
    statAwarded: "Beviljade ansökningar",
    statAwardedAmount: "Beviljat bidrag",
    statRejected: "Avslag",
    statSuccessRate: "Beviljandegrad",
    successRateNone: "Inga beslut än",
    reportingTitle: "Rapportering",
    statReportsApproved: "Godkända rapporter",
    statReportsSubmitted: "Inlämnade, väntar på beslut",
    statReportsRevision: "Komplettering begärd",
    statReportsOverdue: "Försenade",
    statReportsUpcoming: "Kommande",
    cofinancingTitle: "Egen medfinansiering",
    cofinancingLine: (a, p) => `${a} för beviljade projekt och ${p} för ansökningar hos finansiären.`,
    cofinancingPeak: (sek, year) => `Kommunen ligger som mest ute med ${sek} i väntan på utbetalningar (${year}).`,
    cofinancingLink: "Se medfinansiering och likviditet per år",
    peersTitle: "Jämförelse med de största kommunerna",
    peersIntro: (name) =>
      `EU-bidrag till ${name} och de tio största kommunerna sedan 2014, i säkra träffar på organisationsnummer, momsnummer eller PIC. Per invånare gör kommuner av olika storlek jämförbara.`,
    colMunicipality: "Kommun",
    colPopulation: "Invånare",
    colProjects: "Projekt",
    colEu: "EU-bidrag",
    colPerCapita: "Kr per invånare",
    colPeriod1420: "2014–2020",
    colPeriod2127: "2021–2027",
    colRank: "Plats",
    rankLine: (name, rank, of, perCapita, median) =>
      `${name} har plats ${rank} av ${of} räknat i EU-bidrag per invånare: ${perCapita} mot medianen ${median}.`,
    perCapitaUnit: "kr/inv",
    populationSource: (y) => `Folkmängd den 31 december ${y} enligt SCB.`,
    byProgramTitle: "Per program",
    byProgramIntro: (name) => `${name}s EU-bidrag per program jämfört med medianen för de övriga kommunerna, per invånare.`,
    colProgram: "Program",
    colOwn: "Egen kommun",
    colPeerMedian: "Median övriga",
    noPeers: "Ingen kommunjämförelse är importerad.",
    caveatsTitle: "Att tänka på",
    exampleDataNote: "Portföljen bygger på det som finns i den här webbläsaren, inklusive exempeldata.",
  },
  cofinancing: {
    title: "Medfinansiering och likviditet",
    intro:
      "Vad organisationen själv betalar per år för beviljade projekt och ansökningar hos finansiären, och hur mycket den ligger ute med innan EU-bidraget betalas ut.",
    assumptionsTitle: "Antaganden",
    advanceDirectLabel: "Förskott, direktförvaltade program (%)",
    advanceSharedLabel: "Förskott, strukturfonder och Interreg (%)",
    lagLabel: "Utbetalning efter (år)",
    fxLabel: "Kursändring för valutarisk (%)",
    includeDrafts: "Ta med utkast",
    assumptionsNote:
      "Kostnader, egen insats och bidrag fördelas jämnt över projektets år. Förskottet betalas första året och resten efter att det har upparbetats. En ansökan per projekt räknas, den senast ändrade. Kontrollera mot respektive bidragsavtal.",
    statOwnTotal: "Egen medfinansiering totalt",
    statGrantTotal: "EU-bidrag totalt",
    statPeak: "Som mest utlagt i väntan på bidrag",
    statPeakYear: (y) => `vid utgången av ${y}`,
    statFx: (pct) => `Påverkan av ${pct} % kursändring på bidrag i euro`,
    statFxNone: "Inga bidrag betalas i euro",
    perYearTitle: "Per år",
    perYearIntro: "Utlagt = upparbetat bidrag som ännu inte är utbetalt, vid årets slut.",
    colYear: "År",
    colCost: "Kostnad",
    colOwn: "Egen medfinansiering",
    colEarned: "Upparbetat bidrag",
    colReceived: "Utbetalt bidrag",
    colExposure: "Utlagt",
    itemsTitle: "Projekt och ansökningar",
    colProject: "Projekt",
    colStage: "Läge",
    colProgram: "Program",
    colPeriod: "Period",
    colTotal: "Budget",
    colGrant: "Bidrag",
    colCurrency: "Valuta",
    stages: { awarded: "Beviljat", pending: "Hos finansiären", draft: "Utkast" },
    decisionDocx: "Beslutsunderlag (Word)",
    decisionDocxHint: "Underlag till nämnden om medfinansiering, med budget, egen insats per år och likviditet.",
    none: "Inga beviljade projekt eller ansökningar hos finansiären.",
  },
  audit: {
    title: "Revisionsberedskap",
    intro: "Det revisorn och finansiärens kontroll brukar fråga efter. Bocka av när det är på plats, så är underlagen klara innan rapporterna.",
    progress: (d, n) => `${d} av ${n} klara`,
    allDone: "Allt är på plats.",
    whyShow: "Varför",
    whyHide: "Dölj",
    doneOn: (d) => `klart ${d}`,
    certificateThreshold: (a) => `Gränsen för revisionsintyg i utlysningen: ${a}.`,
    disclaimer: "Listan är ett stöd, inte finansiärens regler. Bidragsavtalet och programmets anvisningar gäller.",
  },
};

export const extensionEn: ExtensionTexts = {
  calls: {
    showOutdated: (n) => `Show outdated calls (${n})`,
    closedStatus: "Closed",
    outdatedHidden: (n) => `${n} ${n === 1 ? "call has" : "calls have"} already closed and ${n === 1 ? "is" : "are"} hidden.`,
  },
  partners: {
    tab: "Partner search",
    title: "Partner search",
    intro:
      "Find organisations that have led or taken part in EU projects on a theme, in a programme or in a country. Based on the imported projects from Kohesio, Keep.eu, CORDIS and the ESF project bank.",
    searchPlaceholder: "Search a subject or organisation, e.g. climate adaptation or Tampere",
    searchLabel: "Search",
    typeLabel: "Type of organisation",
    typeAll: "All types",
    typeUnknown: "Type unknown",
    types: {
      municipality: "Municipality or city",
      region: "Region",
      university: "University",
      sme: "Small or medium-sized enterprise",
      "large-enterprise": "Large enterprise",
      ngo: "Non-profit organisation",
      "national-authority": "National authority",
      "research-institute": "Research institute",
    },
    typeFromNameTooltip: "The source gives no type; it is read from the name.",
    countryLabel: "Country",
    countryAll: "All countries",
    programLabel: "Programme",
    programAll: "All programmes",
    sectorLabel: "Theme",
    sectorAll: "All themes",
    periodLabel: "Programme period",
    periodAll: "Both periods",
    onlyCoordinators: "Only those who have led a project",
    excludeOwn: (name) => `Without ${name}`,
    resultCount: (o, p) => `${o.toLocaleString("en-US")} organisations in ${p.toLocaleString("en-US")} projects`,
    none: "No organisations match the search.",
    loading: "Searching …",
    loadError: "The partner search could not be loaded.",
    loadMore: "Show more",
    roleSummary: (c, p, a) =>
      [c > 0 && `coordinator in ${c}`, p > 0 && `partner in ${p}`, a > 0 && `associated in ${a}`]
        .filter(Boolean)
        .join(", ")
        .replace(/^./, (s) => s.toUpperCase()),
    projectCount: (n) => `${n} ${n === 1 ? "project" : "projects"}`,
    latestYear: (y) => `latest ${y}`,
    showProjects: (n) => `Show ${n === 1 ? "the project" : "the projects"}`,
    hideProjects: "Hide the projects",
    sourceNote:
      "Contact details are in each project's source. Organisation names are as the source writes them, so one organisation can appear under several names.",
    moreInPartnerSearch: "Find more partners in the partner search",
  },
  datacenterTabs: {
    label: "Data centre",
    overview: "Overview",
    leadership: "Leadership report",
    cofinancing: "Co-financing",
  },
  leadership: {
    title: "Leadership report",
    intro: "Where the organisation's external funding stands, and how the municipality compares with the largest municipalities, for leadership and the committee.",
    print: "Print or save as PDF",
    generated: (d) => `Compiled ${d}`,
    portfolioTitle: "Own portfolio",
    portfolioIntro: "Projects, applications and grants registered in EU Navigator.",
    statProjects: "Projects in the portfolio",
    statPortfolioCost: "Projects' estimated cost",
    statSubmitted: "Applications submitted",
    statPending: "With the funder",
    statPendingAmount: "Grant applied for, with the funder",
    statAwarded: "Applications awarded",
    statAwardedAmount: "Grants awarded",
    statRejected: "Rejected",
    statSuccessRate: "Success rate",
    successRateNone: "No decisions yet",
    reportingTitle: "Reporting",
    statReportsApproved: "Reports approved",
    statReportsSubmitted: "Submitted, awaiting decision",
    statReportsRevision: "Revision requested",
    statReportsOverdue: "Overdue",
    statReportsUpcoming: "Upcoming",
    cofinancingTitle: "Own co-financing",
    cofinancingLine: (a, p) => `${a} for awarded projects and ${p} for applications with the funder.`,
    cofinancingPeak: (sek, year) => `At most, the municipality has ${sek} paid out while waiting for payments (${year}).`,
    cofinancingLink: "See co-financing and liquidity per year",
    peersTitle: "Compared with the largest municipalities",
    peersIntro: (name) =>
      `EU grants to ${name} and the ten largest municipalities since 2014, counting sure matches on registration number, VAT number or PIC. Per inhabitant makes municipalities of different size comparable.`,
    colMunicipality: "Municipality",
    colPopulation: "Inhabitants",
    colProjects: "Projects",
    colEu: "EU grants",
    colPerCapita: "SEK per inhabitant",
    colPeriod1420: "2014–2020",
    colPeriod2127: "2021–2027",
    colRank: "Rank",
    rankLine: (name, rank, of, perCapita, median) =>
      `${name} ranks ${rank} of ${of} in EU grants per inhabitant: ${perCapita} against a median of ${median}.`,
    perCapitaUnit: "SEK/inh",
    populationSource: (y) => `Population on 31 December ${y} according to Statistics Sweden (SCB).`,
    byProgramTitle: "Per programme",
    byProgramIntro: (name) => `${name}'s EU grants per programme against the median of the other municipalities, per inhabitant.`,
    colProgram: "Programme",
    colOwn: "Own municipality",
    colPeerMedian: "Median of others",
    noPeers: "No municipality comparison has been imported.",
    caveatsTitle: "Keep in mind",
    exampleDataNote: "The portfolio is what is stored in this browser, example data included.",
  },
  cofinancing: {
    title: "Co-financing and liquidity",
    intro:
      "What the organisation pays itself each year for awarded projects and applications with the funder, and how much it has paid out before the EU grant arrives.",
    assumptionsTitle: "Assumptions",
    advanceDirectLabel: "Advance, direct-managed programmes (%)",
    advanceSharedLabel: "Advance, structural funds and Interreg (%)",
    lagLabel: "Paid after (years)",
    fxLabel: "Exchange-rate change for currency risk (%)",
    includeDrafts: "Include drafts",
    assumptionsNote:
      "Costs, own financing and the grant are spread evenly over the project's years. The advance is paid the first year and the rest once it has been earned. One application per project counts, the most recently changed. Check against each grant agreement.",
    statOwnTotal: "Own co-financing in total",
    statGrantTotal: "EU grants in total",
    statPeak: "Most paid out while waiting for the grant",
    statPeakYear: (y) => `at the end of ${y}`,
    statFx: (pct) => `Effect of a ${pct}% exchange-rate change on grants in euro`,
    statFxNone: "No grants are paid in euro",
    perYearTitle: "Per year",
    perYearIntro: "Paid out = grant earned but not yet received, at the end of the year.",
    colYear: "Year",
    colCost: "Cost",
    colOwn: "Own co-financing",
    colEarned: "Grant earned",
    colReceived: "Grant received",
    colExposure: "Paid out",
    itemsTitle: "Projects and applications",
    colProject: "Project",
    colStage: "Stage",
    colProgram: "Programme",
    colPeriod: "Period",
    colTotal: "Budget",
    colGrant: "Grant",
    colCurrency: "Currency",
    stages: { awarded: "Awarded", pending: "With the funder", draft: "Draft" },
    decisionDocx: "Decision brief (Word)",
    decisionDocxHint: "A brief for the committee on co-financing, with budget, own financing per year and liquidity.",
    none: "No awarded projects or applications with the funder.",
  },
  audit: {
    title: "Audit readiness",
    intro: "What auditors and the funder's controls usually ask for. Tick each item when it is in place, so the records are ready before the reports.",
    progress: (d, n) => `${d} of ${n} done`,
    allDone: "Everything is in place.",
    whyShow: "Why",
    whyHide: "Hide",
    doneOn: (d) => `done ${d}`,
    certificateThreshold: (a) => `The call's threshold for an audit certificate: ${a}.`,
    disclaimer: "The list is guidance, not the funder's rules. The grant agreement and the programme's instructions apply.",
  },
};

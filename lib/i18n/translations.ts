import { Lang } from "@/lib/types";

export interface TranslationTree {
  nav: {
    home: string;
    workflow: string;
    personas: string;
    pricing: string;
    demo: string;
    projectBank: string;
    euDatabase: string;
    referenceProjects: string;
    myProjects: string;
    datacenter: string;
  };
  home: {
    entryTitle: string;
    entrySubtitle: string;
    entry1Title: string;
    entry1Desc: string;
    entry1Cta: string;
    entry2Title: string;
    entry2Desc: string;
    entry2Cta: string;
    entry3Title: string;
    entry3Desc: string;
    entry3Cta: string;
  };
  hero: {
    eyebrow: string;
    title: string;
    subtitle: string;
    ctaPrimary: string;
    ctaSecondary: string;
    stat1Label: string;
    stat1Value: string;
    stat2Label: string;
    stat2Value: string;
    stat3Label: string;
    stat3Value: string;
  };
  problem: {
    title: string;
    body: string;
    before: { label: string; steps: string[] };
    after: { label: string; steps: string[] };
  };
  workflow: {
    title: string;
    subtitle: string;
    steps: { title: string; desc: string }[];
  };
  radar: {
    title: string;
    body: string;
    example: string;
  };
  personas: {
    title: string;
    subtitle: string;
    items: { role: string; need: string }[];
  };
  pricing: {
    title: string;
    tiers: { name: string; price: string; desc: string; highlighted?: boolean }[];
  };
  cta: {
    title: string;
    subtitle: string;
    button: string;
  };
  footer: {
    disclaimer: string;
    rights: string;
  };
  demo: {
    intake: {
      title: string;
      subtitle: string;
      fieldTitle: string;
      fieldTitlePlaceholder: string;
      fieldDescription: string;
      fieldDescriptionPlaceholder: string;
      fieldSector: string;
      fieldBudget: string;
      fieldStartYear: string;
      fieldEndYear: string;
      fieldMunicipality: string;
      fieldMunicipalityPlaceholder: string;
      fieldPartnership: string;
      submit: string;
      sectors: Record<
        "energy" | "climate" | "digital" | "social" | "mobility" | "education" | "health" | "research",
        string
      >;
    };
    results: {
      title: string;
      subtitle: (n: number) => string;
      matchLabel: string;
      deadlineLabel: string;
      estFundingLabel: string;
      recommendationProceed: string;
      recommendationConsider: string;
      recommendationLow: string;
      startApplication: string;
      back: string;
      monthsSuffix: string;
    };
    workspace: {
      back: string;
      title: string;
      logicTitle: string;
      reviewerTitle: string;
      reviewerSubtitle: string;
      budgetTitle: string;
      totalBudget: string;
      estEuShare: string;
      coFinancing: string;
      nextStepsTitle: string;
      nextSteps: string[];
    };
    gapAnalysis: {
      title: string;
      strengthsTitle: string;
      gapsTitle: string;
      uplift: (from: number, to: number) => string;
      noGaps: string;
    };
    readiness: {
      title: string;
      disclaimer: string;
      overallLabel: string;
      recommendedActions: string;
    };
    coach: {
      title: string;
      subtitle: string;
      relevance: string;
      impact: string;
      evidence: string;
      suggestionLabel: string;
    };
  };
  projectBank: {
    title: string;
    subtitle: string;
    columnTitle: string;
    columnDepartment: string;
    columnStatus: string;
    columnCost: string;
    columnPeriod: string;
    columnReadiness: string;
    statusLabels: Record<
      "idea" | "in-development" | "applying" | "awarded" | "delivering" | "closed",
      string
    >;
    detailOwner: string;
    detailMissingInfoTitle: string;
    detailMissingInfoBody: string;
    detailFindFunding: string;
    back: string;
  };
  euDatabase: {
    title: string;
    subtitle: string;
    programsBack: string;
    callsCount: (n: number) => string;
    documentsCount: (n: number) => string;
    statusOpen: string;
    statusUpcoming: string;
    deadlineIn: (months: number) => string;
    budgetLabel: string;
    grantRangeLabel: string;
    eligibleApplicantsTitle: string;
    prioritiesTitle: string;
    evaluationCriteriaTitle: string;
    documentsTitle: string;
    documentNeedsUpdate: string;
    documentUpdated: (date: string) => string;
    learnFromWinnersButton: string;
    helpMeApplyButton: string;
    backToProgram: string;
    backToPrograms: string;
  };
  referenceProjects: {
    title: string;
    subtitle: string;
    disclaimer: string;
    filterAll: string;
    patternsTitle: string;
    patternsIntro: (n: number) => string;
    patternQuantified: string;
    patternScalability: string;
    patternMultiOrg: string;
    patternGoalAlignment: string;
    patternPilot: string;
    whatItMeansTitle: string;
    whatItMeansBody: string;
    fieldOrganisation: string;
    fieldBudget: string;
    fieldFundingRate: string;
    fieldPartners: string;
    fieldIndicators: string;
    fieldInnovation: string;
  };
  datacenter: {
    title: string;
    subtitle: string;
    statProjectIdeas: string;
    statActiveProjects: string;
    statPrograms: string;
    statCalls: string;
    statOpenCalls: string;
    statUpcomingCalls: string;
    statReferenceProjects: string;
    statDocuments: string;
    statDocumentsNeedUpdate: string;
    statLastSync: string;
    documentsNeedingUpdateTitle: string;
    incompleteProjectsTitle: string;
    incompleteProjectsBody: string;
  };
  awardedProjects: {
    title: string;
    subtitle: string;
    nextReportDue: (months: number) => string;
    awardedAmount: string;
    commitmentsTitle: string;
    promised: string;
    reported: string;
    back: string;
  };
  orgProcess: {
    title: string;
    subtitle: string;
    dualComplianceTitle: string;
    dualComplianceReady: string;
    dualComplianceBlocked: string;
  };
}

export const translations: Record<Lang, TranslationTree> = {
  sv: {
    nav: {
      home: "Hem",
      workflow: "Så fungerar det",
      personas: "För vem",
      pricing: "Prismodell",
      demo: "Prova demo",
      projectBank: "Projektbank",
      euDatabase: "EU-databas",
      referenceProjects: "Beviljade projekt",
      myProjects: "Mina projekt",
      datacenter: "Datacenter",
    },
    home: {
      entryTitle: "Var är ni just nu?",
      entrySubtitle: "Tre ingångar in i samma system — beroende på var i kedjan ni befinner er.",
      entry1Title: "Jag har ett projekt",
      entry1Desc: "Beskriv projektet och låt AI:n hitta relevanta EU-utlysningar.",
      entry1Cta: "Hitta finansiering",
      entry2Title: "Jag har hittat en utlysning",
      entry2Desc: "Bläddra i EU-databasen och låt systemet bygga rätt ansökningsprocess.",
      entry2Cta: "Hjälp mig söka",
      entry3Title: "Jag har fått finansiering",
      entry3Desc: "Hantera projektplan, ekonomi, indikatorer och rapportering på ett ställe.",
      entry3Cta: "Hantera projekt",
    },
    hero: {
      eyebrow: "Kommunens operativsystem för extern finansiering",
      title: "Från kommunens behov till finansierat projekt",
      subtitle:
        "EU Navigator kopplar samman kommunens investeringsplaner med EU:s finansieringsmöjligheter — automatiskt, kontinuerligt och med AI-driven matchning och ansökningsstöd.",
      ctaPrimary: "Prova demo",
      ctaSecondary: "Så fungerar det",
      stat1Label: "Identifierad finansieringspotential",
      stat1Value: "186 mnkr",
      stat2Label: "Nya möjligheter senaste 30 dagarna",
      stat2Value: "7",
      stat3Label: "Bevakade EU-program",
      stat3Value: "8+",
    },
    problem: {
      title: "Problemet är inte brist på pengar — det är brist på överblick",
      body:
        "EU:s finansieringsmöjligheter är utspridda över Funding & Tenders Portal, nationella portaler och programspecifika webbplatser. De flesta kommuner saknar ett sätt att systematiskt matcha sina egna planer mot de möjligheter som faktiskt finns.",
      before: {
        label: "Idag",
        steps: [
          "Idé uppstår i en förvaltning",
          "Någon googlar eller frågar EU-samordnaren",
          "Utlysning hittas – kanske",
          "Manuell bedömning och Excel-mall",
          "Ansökan skrivs från grunden",
          "Uppföljning sköts i Teams och mejl",
        ],
      },
      after: {
        label: "Med EU Navigator",
        steps: [
          "Kommunen beskriver vad den vill göra",
          "AI matchar mot relevanta EU-program",
          "Matchning rankas och förklaras",
          "AI-stödd ansökan med inbyggd granskning",
          "Beviljat projekt blir projektplan automatiskt",
          "Rapportering förbereds löpande",
        ],
      },
    },
    workflow: {
      title: "Sex steg, en sammanhållen kedja",
      subtitle: "Planera → Hitta → Matcha → Ansök → Genomför → Rapportera",
      steps: [
        {
          title: "1. Planera",
          desc: "Kommunen matar in sin investerings-, verksamhets- eller klimatplan. AI läser materialet och identifierar potentiellt finansieringsbara initiativ.",
        },
        {
          title: "2. Hitta",
          desc: "Systemet bevakar kontinuerligt utlysningar från Regionalfonden, ESF+, Interreg, LIFE, Horizon Europe, Digital Europe, CEF, Erasmus+ och fler.",
        },
        {
          title: "3. Matcha",
          desc: "AI jämför projektet mot varje utlysning utifrån behörighet, syfte, geografi, storlek, partnerskapskrav och mer — och ger en transparent poäng med motivering.",
        },
        {
          title: "4. Ansök",
          desc: "En AI-copilot bygger projektlogik och utkast till ansökan, och agerar samtidigt granskare som flaggar luckor innan inlämning.",
        },
        {
          title: "5. Genomför",
          desc: "Beviljade projekt blir automatiskt en projektplan med budget, aktiviteter, milstolpar och ansvariga.",
        },
        {
          title: "6. Rapportera",
          desc: "Systemet samlar löpande underlag och genererar ett första utkast till rapportering, med tydlig lista över vad som saknas.",
        },
      ],
    },
    radar: {
      title: "EU Funding Radar",
      body:
        "Kommunen behöver inte ens söka aktivt. Systemet känner till era strategier, budget och projektportfölj — och meddelar er proaktivt när en ny utlysning matchar.",
      example: "4 nya finansieringsmöjligheter hittade denna vecka",
    },
    personas: {
      title: "Byggt för hela organisationen",
      subtitle: "Samma system, olika vyer beroende på roll.",
      items: [
        {
          role: "Ekonomi- och kommundirektör",
          need: "Vill se den totala finansieringspotentialen i portföljen — inte enskilda ansökningar.",
        },
        {
          role: "EU-/finansieringssamordnare",
          need: "Systemets superuser. Ser alla matchningar, fördelar dem till rätt förvaltning och driver ansökningar framåt.",
        },
        {
          role: "Verksamhetsutvecklare",
          need: "Beskriver sitt projekt i vanligt språk och får relevanta finansieringsförslag — utan att behöva kunna EU-program.",
        },
        {
          role: "Projektcontroller",
          need: "Behöver budget, stödberättigade kostnader, medfinansieringskrav och rapporteringsdeadlines på ett ställe.",
        },
      ],
    },
    pricing: {
      title: "En kommunal SaaS, inte betalt per ansökan",
      tiers: [
        {
          name: "Basic",
          price: "100–200 tkr/år",
          desc: "Bevakning av utlysningar + AI-matchning mot kommunens projektportfölj.",
        },
        {
          name: "Professional",
          price: "250–500 tkr/år",
          desc: "Basic + AI-stödd ansökan, projektportfölj och samarbetsyta mellan förvaltningar.",
          highlighted: true,
        },
        {
          name: "Enterprise",
          price: "500 tkr–1+ mnkr/år",
          desc: "Hela kommunkoncernen: projektstyrning, rapportering och integrationer mot ekonomisystem.",
        },
      ],
    },
    cta: {
      title: "Se hur er nästa investering kan bli EU-finansierad",
      subtitle: "Prova demot med ett eget exempelprojekt — ingen inloggning krävs.",
      button: "Starta demo",
    },
    footer: {
      disclaimer:
        "Demo med illustrativa exempeldata. Matchning baseras på en transparent poängmodell, inte live-data från EU:s system. Se EU:s Funding & Tenders Portal för aktuella utlysningar.",
      rights: "EU Navigator — koncept och demo.",
    },
    demo: {
      intake: {
        title: "Beskriv ert projekt",
        subtitle: "Fyll i så mycket ni kan — AI-matchningen blir bättre ju mer konkret beskrivningen är.",
        fieldTitle: "Projektnamn",
        fieldTitlePlaceholder: "T.ex. Energieffektivisering av 14 skolor",
        fieldDescription: "Beskrivning",
        fieldDescriptionPlaceholder:
          "Beskriv vad ni vill genomföra, varför, och vilka aktiviteter som ingår (t.ex. solceller, styrsystem, ventilation, energilagring)...",
        fieldSector: "Huvudsakligt område",
        fieldBudget: "Uppskattad budget (kr)",
        fieldStartYear: "Startår",
        fieldEndYear: "Slutår",
        fieldMunicipality: "Kommun/organisation",
        fieldMunicipalityPlaceholder: "T.ex. Exempelstad kommun",
        fieldPartnership: "Vi har (eller kan skaffa) en internationell partnerorganisation",
        submit: "Hitta finansieringsmöjligheter",
        sectors: {
          energy: "Energi",
          climate: "Klimat & miljö",
          digital: "Digitalisering",
          social: "Social omsorg",
          mobility: "Mobilitet & infrastruktur",
          education: "Utbildning",
          health: "Hälsa",
          research: "Forskning & innovation",
        },
      },
      results: {
        title: "Finansieringsmöjligheter hittade",
        subtitle: (n: number) => `${n} EU-program analyserade mot ert projekt`,
        matchLabel: "matchning",
        deadlineLabel: "Nästa deadline",
        estFundingLabel: "Uppskattad EU-finansiering",
        recommendationProceed: "GÅ VIDARE",
        recommendationConsider: "ÖVERVÄG",
        recommendationLow: "LÅG PRIORITET",
        startApplication: "Starta ansökan",
        back: "Ändra projekt",
        monthsSuffix: "månader",
      },
      workspace: {
        back: "Tillbaka till matchningar",
        title: "AI-stödd ansökningsyta",
        logicTitle: "Projektlogik",
        reviewerTitle: "AI-granskning",
        reviewerSubtitle: "Kontrollpunkter innan ansökan lämnas in",
        budgetTitle: "Budget & medfinansiering",
        totalBudget: "Total projektbudget",
        estEuShare: "Uppskattat EU-bidrag",
        coFinancing: "Kommunal medfinansiering (uppskattad)",
        nextStepsTitle: "Nästa steg",
        nextSteps: [
          "Åtgärda punkterna som AI-granskningen flaggat",
          "Bekräfta partnerskap/konsortium vid behov",
          "Komplettera indikatorer med mätbara utgångsvärden",
          "Skicka ansökan för intern attest",
        ],
      },
      gapAnalysis: {
        title: "Gap-analys",
        strengthsTitle: "Styrkor",
        gapsTitle: "Gap",
        uplift: (from, to) => `Så höjer du matchningen från ${from} % → ${to} %`,
        noGaps: "Inga tydliga gap identifierade — ansökan ser stark ut ur matchningsperspektiv.",
      },
      readiness: {
        title: "Application Readiness",
        disclaimer:
          "Detta är inte en förutsägelse om EU:s beslut, utan AI:ns bedömning av hur väl ansökan möter dokumenterade krav och bedömningskriterier.",
        overallLabel: "Total poäng",
        recommendedActions: "Rekommenderade åtgärder före inlämning",
      },
      coach: {
        title: "Application Coach",
        subtitle: "AI-granskning av projektbeskrivningen mot just denna utlysnings krav",
        relevance: "Relevans",
        impact: "Impact",
        evidence: "Evidence",
        suggestionLabel: "Föreslagen komplettering",
      },
    },
    projectBank: {
      title: "Projektbank",
      subtitle: "Alla registrerade projektidéer, behov och planerade investeringar.",
      columnTitle: "Projekt",
      columnDepartment: "Förvaltning",
      columnStatus: "Status",
      columnCost: "Uppskattad kostnad",
      columnPeriod: "Period",
      columnReadiness: "AI-beredskap",
      statusLabels: {
        idea: "Idé",
        "in-development": "Under utveckling",
        applying: "Ansökan pågår",
        awarded: "Beviljat",
        delivering: "Genomförs",
        closed: "Avslutat",
      },
      detailOwner: "Projektägare",
      detailMissingInfoTitle: "Information som saknas för optimal EU-matchning",
      detailMissingInfoBody:
        "Projektinformationen är inte tillräcklig för optimal EU-matchning. Komplettera enligt nedan innan en specifik utlysning väljs.",
      detailFindFunding: "Hitta finansiering för detta projekt",
      back: "Tillbaka till projektbanken",
    },
    euDatabase: {
      title: "EU-databas",
      subtitle: "Program, fonder, utlysningar och de dokument AI:n faktiskt arbetar utifrån.",
      programsBack: "Alla program",
      callsCount: (n) => `${n} utlysningar`,
      documentsCount: (n) => `${n} dokument`,
      statusOpen: "Öppen",
      statusUpcoming: "Kommande",
      deadlineIn: (m) => `Deadline om ${m} månader`,
      budgetLabel: "Utlysningens totala budget",
      grantRangeLabel: "Bidragsstorlek",
      eligibleApplicantsTitle: "Behöriga sökande",
      prioritiesTitle: "Prioriteringar",
      evaluationCriteriaTitle: "Bedömningskriterier",
      documentsTitle: "Dokument (AI-kontextpaket)",
      documentNeedsUpdate: "Behöver uppdateras",
      documentUpdated: (date) => `Uppdaterad ${date}`,
      learnFromWinnersButton: "Lär av tidigare beviljade projekt",
      helpMeApplyButton: "Hjälp mig söka",
      backToProgram: "Tillbaka till programmet",
      backToPrograms: "Tillbaka till EU-databasen",
    },
    referenceProjects: {
      title: "Beviljade referensprojekt",
      subtitle: "Vad har faktiskt fått finansiering tidigare — och varför?",
      disclaimer:
        "Illustrativ exempeldata. Den skarpa versionen byggs från organisationens egna beviljade projekt när dessa dokument har lagts in.",
      filterAll: "Alla program",
      patternsTitle: "Gemensamma framgångsmönster",
      patternsIntro: (n) => `${n} relevanta beviljade projekt analyserade`,
      patternQuantified: "hade kvantifierade effekter",
      patternScalability: "beskrev skalbarhet",
      patternMultiOrg: "hade flera organisationer involverade",
      patternGoalAlignment: "kopplade projektmålen direkt till programmets mål",
      patternPilot: "innehöll demonstrations-/pilotmoment",
      whatItMeansTitle: "Vad betyder detta för ditt projekt?",
      whatItMeansBody:
        "Överväg att lägga till kvantifierade mål, en strategi för skalbarhet/spridning och — där relevant — fler samarbetsparter, eftersom detta återkommer i de flesta beviljade projekt inom detta program.",
      fieldOrganisation: "Organisation",
      fieldBudget: "Budget",
      fieldFundingRate: "Finansieringsgrad",
      fieldPartners: "Partners",
      fieldIndicators: "Indikatorer",
      fieldInnovation: "Innovationshöjd",
    },
    datacenter: {
      title: "Datacenter",
      subtitle: "Vad AI:n faktiskt har tillgång till — och vad som behöver kompletteras.",
      statProjectIdeas: "Projektidéer",
      statActiveProjects: "Aktiva projekt",
      statPrograms: "EU-program",
      statCalls: "Utlysningar",
      statOpenCalls: "Öppna utlysningar",
      statUpcomingCalls: "Kommande utlysningar",
      statReferenceProjects: "Beviljade referensprojekt",
      statDocuments: "Fond-/utlysningsdokument",
      statDocumentsNeedUpdate: "Dokument som behöver uppdateras",
      statLastSync: "Senaste datasynk",
      documentsNeedingUpdateTitle: "Dokument som behöver uppdateras",
      incompleteProjectsTitle: "Projekt med ofullständig information",
      incompleteProjectsBody:
        "Dessa projekt i projektbanken saknar information som krävs för en tillförlitlig EU-matchning.",
    },
    awardedProjects: {
      title: "Mina projekt",
      subtitle: "Beviljade projekt — genomförande och rapportering.",
      nextReportDue: (m) => `Nästa rapportering om ${m} månader`,
      awardedAmount: "Beviljat belopp",
      commitmentsTitle: "Åtaganden från ansökan vs. utfall",
      promised: "Utlovat",
      reported: "Rapporterat",
      back: "Tillbaka till mina projekt",
    },
    orgProcess: {
      title: "Organisationens regelverk",
      subtitle: "Kommunens interna process löper parallellt med EU:s externa krav.",
      dualComplianceTitle: "Dubbel kravbild",
      dualComplianceReady: "Ansökan är redo ur både EU-utlysningens och kommunens interna processperspektiv.",
      dualComplianceBlocked:
        "Ansökan är redo ur EU-utlysningens perspektiv, men enligt kommunens interna projektprocess saknas ett eller flera steg.",
    },
  },
  en: {
    nav: {
      home: "Home",
      workflow: "How it works",
      personas: "Who it's for",
      pricing: "Pricing",
      demo: "Try the demo",
      projectBank: "Project bank",
      euDatabase: "EU database",
      referenceProjects: "Awarded projects",
      myProjects: "My projects",
      datacenter: "Datacenter",
    },
    home: {
      entryTitle: "Where are you right now?",
      entrySubtitle: "Three entry points into the same system — depending on where you are in the chain.",
      entry1Title: "I have a project",
      entry1Desc: "Describe the project and let AI find relevant EU calls.",
      entry1Cta: "Find funding",
      entry2Title: "I found a call",
      entry2Desc: "Browse the EU database and let the system build the right application process.",
      entry2Cta: "Help me apply",
      entry3Title: "I received funding",
      entry3Desc: "Manage the project plan, finances, indicators and reporting in one place.",
      entry3Cta: "Manage project",
    },
    hero: {
      eyebrow: "The operating system for external funding",
      title: "From municipal need to funded project",
      subtitle:
        "EU Navigator connects a municipality's investment plans with EU funding opportunities — automatically, continuously, with AI-driven matching and application support.",
      ctaPrimary: "Try the demo",
      ctaSecondary: "How it works",
      stat1Label: "Identified funding potential",
      stat1Value: "SEK 186M",
      stat2Label: "New matches in the last 30 days",
      stat2Value: "7",
      stat3Label: "EU programmes monitored",
      stat3Value: "8+",
    },
    problem: {
      title: "The problem isn't a lack of money — it's a lack of overview",
      body:
        "EU funding is scattered across the Funding & Tenders Portal, national portals and programme-specific websites. Most municipalities have no systematic way to match their own plans against what's actually available.",
      before: {
        label: "Today",
        steps: [
          "An idea comes up in a department",
          "Someone googles it or asks the EU coordinator",
          "A call is found — maybe",
          "Manual assessment in a spreadsheet",
          "Application written from scratch",
          "Follow-up handled in Teams and email",
        ],
      },
      after: {
        label: "With EU Navigator",
        steps: [
          "The municipality describes what it wants to do",
          "AI matches it against relevant EU programmes",
          "Matches are ranked and explained",
          "AI-assisted application with built-in review",
          "An awarded project becomes a project plan automatically",
          "Reporting is prepared continuously",
        ],
      },
    },
    workflow: {
      title: "Six steps, one connected chain",
      subtitle: "Plan → Find → Match → Apply → Deliver → Report",
      steps: [
        {
          title: "1. Plan",
          desc: "The municipality feeds in its investment, operational or climate plan. AI reads the material and identifies initiatives that could plausibly be funded.",
        },
        {
          title: "2. Find",
          desc: "The system continuously monitors calls from the Regional Development Fund, ESF+, Interreg, LIFE, Horizon Europe, Digital Europe, CEF, Erasmus+ and more.",
        },
        {
          title: "3. Match",
          desc: "AI compares the project against each call on eligibility, purpose, geography, size, partnership requirements and more — with a transparent, explained score.",
        },
        {
          title: "4. Apply",
          desc: "An AI copilot builds the project logic and drafts the application, while also acting as a reviewer that flags gaps before submission.",
        },
        {
          title: "5. Deliver",
          desc: "An awarded project automatically becomes a project plan with budget, activities, milestones and owners.",
        },
        {
          title: "6. Report",
          desc: "The system continuously gathers supporting material and generates a first reporting draft, with a clear list of what's missing.",
        },
      ],
    },
    radar: {
      title: "EU Funding Radar",
      body:
        "The municipality doesn't even need to search actively. The system already knows your strategies, budget and project portfolio — and proactively tells you when a new call matches.",
      example: "4 new funding opportunities found this week",
    },
    personas: {
      title: "Built for the whole organisation",
      subtitle: "Same system, different views depending on role.",
      items: [
        {
          role: "CFO / municipal director",
          need: "Wants to see the total funding potential across the portfolio — not individual applications.",
        },
        {
          role: "EU / funding coordinator",
          need: "The system's superuser. Sees every match, routes it to the right department, and drives applications forward.",
        },
        {
          role: "Service / operations developer",
          need: "Describes their project in plain language and gets relevant funding suggestions — no EU programme knowledge required.",
        },
        {
          role: "Project controller",
          need: "Needs budget, eligible costs, co-financing requirements and reporting deadlines in one place.",
        },
      ],
    },
    pricing: {
      title: "A municipal SaaS, not paid per application",
      tiers: [
        {
          name: "Basic",
          price: "SEK 100–200k / year",
          desc: "Monitoring of calls + AI matching against the municipality's project portfolio.",
        },
        {
          name: "Professional",
          price: "SEK 250–500k / year",
          desc: "Basic + AI-assisted applications, project portfolio and cross-department collaboration space.",
          highlighted: true,
        },
        {
          name: "Enterprise",
          price: "SEK 500k–1M+ / year",
          desc: "The whole municipal group: project governance, reporting and integrations with financial systems.",
        },
      ],
    },
    cta: {
      title: "See how your next investment could become EU-funded",
      subtitle: "Try the demo with your own example project — no login required.",
      button: "Start the demo",
    },
    footer: {
      disclaimer:
        "Demo with illustrative example data. Matching is based on a transparent scoring model, not live data from EU systems. See the EU's Funding & Tenders Portal for current calls.",
      rights: "EU Navigator — concept and demo.",
    },
    demo: {
      intake: {
        title: "Describe your project",
        subtitle: "Fill in as much as you can — the more concrete the description, the better the AI matching.",
        fieldTitle: "Project name",
        fieldTitlePlaceholder: "E.g. Energy efficiency upgrade of 14 schools",
        fieldDescription: "Description",
        fieldDescriptionPlaceholder:
          "Describe what you want to do, why, and which activities are included (e.g. solar panels, control systems, ventilation, energy storage)...",
        fieldSector: "Primary area",
        fieldBudget: "Estimated budget (SEK)",
        fieldStartYear: "Start year",
        fieldEndYear: "End year",
        fieldMunicipality: "Municipality / organisation",
        fieldMunicipalityPlaceholder: "E.g. Example City Municipality",
        fieldPartnership: "We have (or can secure) an international partner organisation",
        submit: "Find funding opportunities",
        sectors: {
          energy: "Energy",
          climate: "Climate & environment",
          digital: "Digitalisation",
          social: "Social care",
          mobility: "Mobility & infrastructure",
          education: "Education",
          health: "Health",
          research: "Research & innovation",
        },
      },
      results: {
        title: "Funding opportunities found",
        subtitle: (n: number) => `${n} EU programmes analysed against your project`,
        matchLabel: "match",
        deadlineLabel: "Next deadline",
        estFundingLabel: "Estimated EU funding",
        recommendationProceed: "PROCEED",
        recommendationConsider: "CONSIDER",
        recommendationLow: "LOW PRIORITY",
        startApplication: "Start application",
        back: "Edit project",
        monthsSuffix: "months",
      },
      workspace: {
        back: "Back to matches",
        title: "AI-assisted application workspace",
        logicTitle: "Project logic",
        reviewerTitle: "AI review",
        reviewerSubtitle: "Checkpoints before submitting the application",
        budgetTitle: "Budget & co-financing",
        totalBudget: "Total project budget",
        estEuShare: "Estimated EU contribution",
        coFinancing: "Municipal co-financing (estimated)",
        nextStepsTitle: "Next steps",
        nextSteps: [
          "Address the points flagged by the AI review",
          "Confirm partnership/consortium if required",
          "Add measurable baselines to indicators",
          "Send the application for internal sign-off",
        ],
      },
      gapAnalysis: {
        title: "Gap analysis",
        strengthsTitle: "Strengths",
        gapsTitle: "Gaps",
        uplift: (from, to) => `How to raise the match from ${from}% → ${to}%`,
        noGaps: "No clear gaps identified — the application looks strong from a matching perspective.",
      },
      readiness: {
        title: "Application Readiness",
        disclaimer:
          "This is not a prediction of the EU's decision, but the AI's assessment of how well the application meets documented requirements and evaluation criteria.",
        overallLabel: "Overall score",
        recommendedActions: "Recommended actions before submission",
      },
      coach: {
        title: "Application Coach",
        subtitle: "AI review of the project description against this specific call's requirements",
        relevance: "Relevance",
        impact: "Impact",
        evidence: "Evidence",
        suggestionLabel: "Suggested addition",
      },
    },
    projectBank: {
      title: "Project bank",
      subtitle: "All registered project ideas, needs and planned investments.",
      columnTitle: "Project",
      columnDepartment: "Department",
      columnStatus: "Status",
      columnCost: "Estimated cost",
      columnPeriod: "Period",
      columnReadiness: "AI readiness",
      statusLabels: {
        idea: "Idea",
        "in-development": "In development",
        applying: "Applying",
        awarded: "Awarded",
        delivering: "Delivering",
        closed: "Closed",
      },
      detailOwner: "Project owner",
      detailMissingInfoTitle: "Information missing for optimal EU matching",
      detailMissingInfoBody:
        "The project information isn't sufficient for optimal EU matching. Complete it as below before selecting a specific call.",
      detailFindFunding: "Find funding for this project",
      back: "Back to the project bank",
    },
    euDatabase: {
      title: "EU database",
      subtitle: "Programmes, funds, calls, and the documents the AI actually works from.",
      programsBack: "All programmes",
      callsCount: (n) => `${n} calls`,
      documentsCount: (n) => `${n} documents`,
      statusOpen: "Open",
      statusUpcoming: "Upcoming",
      deadlineIn: (m) => `Deadline in ${m} months`,
      budgetLabel: "Call's total budget",
      grantRangeLabel: "Grant size",
      eligibleApplicantsTitle: "Eligible applicants",
      prioritiesTitle: "Priorities",
      evaluationCriteriaTitle: "Evaluation criteria",
      documentsTitle: "Documents (AI context package)",
      documentNeedsUpdate: "Needs update",
      documentUpdated: (date) => `Updated ${date}`,
      learnFromWinnersButton: "Learn from previously awarded projects",
      helpMeApplyButton: "Help me apply",
      backToProgram: "Back to the programme",
      backToPrograms: "Back to the EU database",
    },
    referenceProjects: {
      title: "Awarded reference projects",
      subtitle: "What has actually been funded before — and why?",
      disclaimer:
        "Illustrative example data. The production version is built from the organisation's own awarded projects once those documents are added.",
      filterAll: "All programmes",
      patternsTitle: "Common success patterns",
      patternsIntro: (n) => `${n} relevant awarded projects analysed`,
      patternQuantified: "had quantified effects",
      patternScalability: "described scalability",
      patternMultiOrg: "involved multiple organisations",
      patternGoalAlignment: "linked project goals directly to programme goals",
      patternPilot: "included a demonstration/pilot element",
      whatItMeansTitle: "What does this mean for your project?",
      whatItMeansBody:
        "Consider adding quantified targets, a scalability/replication strategy and — where relevant — more partner organisations, since these recur across most awarded projects in this programme.",
      fieldOrganisation: "Organisation",
      fieldBudget: "Budget",
      fieldFundingRate: "Funding rate",
      fieldPartners: "Partners",
      fieldIndicators: "Indicators",
      fieldInnovation: "Innovation level",
    },
    datacenter: {
      title: "Datacenter",
      subtitle: "What the AI actually has access to — and what needs completing.",
      statProjectIdeas: "Project ideas",
      statActiveProjects: "Active projects",
      statPrograms: "EU programmes",
      statCalls: "Calls",
      statOpenCalls: "Open calls",
      statUpcomingCalls: "Upcoming calls",
      statReferenceProjects: "Awarded reference projects",
      statDocuments: "Fund/call documents",
      statDocumentsNeedUpdate: "Documents needing an update",
      statLastSync: "Last data sync",
      documentsNeedingUpdateTitle: "Documents needing an update",
      incompleteProjectsTitle: "Projects with incomplete information",
      incompleteProjectsBody: "These project-bank entries are missing information required for reliable EU matching.",
    },
    awardedProjects: {
      title: "My projects",
      subtitle: "Awarded projects — delivery and reporting.",
      nextReportDue: (m) => `Next report due in ${m} months`,
      awardedAmount: "Awarded amount",
      commitmentsTitle: "Application commitments vs. outturn",
      promised: "Promised",
      reported: "Reported",
      back: "Back to my projects",
    },
    orgProcess: {
      title: "Organisation's internal process",
      subtitle: "The municipality's internal process runs alongside the EU's external requirements.",
      dualComplianceTitle: "Dual compliance",
      dualComplianceReady: "The application is ready from both the EU call's and the municipality's internal process perspective.",
      dualComplianceBlocked:
        "The application is ready from the EU call's perspective, but one or more steps are missing according to the municipality's internal project process.",
    },
  },
};

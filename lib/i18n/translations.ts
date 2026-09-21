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
    overview: string;
    monitoring: string;
    settings: string;
    menu: string;
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
      fillExample: string;
      prefilledFromBank: string;
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
      logicHint: string;
      resetField: string;
      reviewerTitle: string;
      reviewerSubtitle: string;
      budgetTitle: string;
      totalBudget: string;
      estEuShare: string;
      coFinancing: string;
      nextStepsTitle: string;
      nextSteps: string[];
      tabApplication: string;
      tabAssessment: string;
      tabProcess: string;
      topPriorityLabel: string;
      topPriorityNone: string;
      draftSavedNote: string;
      draftNotSavedNote: string;
      templateSourceNote: (callTitle: string) => string;
      templateGenericNote: string;
      exportButton: string;
      versionsTitle: string;
      versionsHint: string;
      versionNamePlaceholder: string;
      versionQuickDraft: string;
      versionQuickFinal: string;
      saveVersionButton: string;
      noVersions: string;
      restoreVersionButton: string;
      deleteVersionButton: string;
      versionSavedAt: (date: string) => string;
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
    columnBestMatch: string;
    statTotal: string;
    statAvgMatch: string;
    statProceedReady: string;
    statusLabels: Record<
      "idea" | "assessing" | "funding-search" | "application" | "submitted" | "approved" | "rejected" | "running" | "completed",
      string
    >;
    detailOwner: string;
    editButton: string;
    editCancel: string;
    editSave: string;
    editSavedIndicator: string;
    editFieldTitle: string;
    editFieldPartnership: string;
    plusOthers: (n: number) => string;
    assignedRolesTitle: string;
    noAssignedRoles: string;
    detailNotFound: string;
    detailThemeLabel: string;
    detailDescriptionLabel: string;
    detailMissingInfoTitle: string;
    detailMissingInfoBody: string;
    detailFindFunding: string;
    detailMatchesTitle: string;
    detailNoMatches: string;
    similarProjectsTitle: string;
    similarProjectsIntro: string;
    similarProjectsNone: string;
    similarProjectsSharedLabel: string;
    back: string;
    importButton: string;
    downloadTemplate: string;
    importHint: string;
    clearImported: string;
    removeImportedRow: string;
    economicsTitle: string;
    statPortfolioBudget: string;
    statFundingPotential: string;
    statCoFinancingNeed: string;
  };
  euDatabase: {
    title: string;
    subtitle: string;
    programsBack: string;
    callsCount: (n: number) => string;
    documentsCount: (n: number) => string;
    deadlineLabel: string;
    statusOpen: string;
    statusUpcoming: string;
    closedProgrammeBadge: string;
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
    patternTitle: string;
    patternIntro: string;
    patternNone: string;
    helpMeApplyButton: string;
    backToProgram: string;
    backToPrograms: string;
    noCallsForProgram: string;
  };
  referenceProjects: {
    title: string;
    subtitle: string;
    disclaimer: string;
    filterAll: string;
    statsTitle: string;
    statsIntro: (n: number) => string;
    statOwnerShare: string;
    statAvgBudget: string;
    statTopTheme: string;
    statCurrentVsLegacy: (current: number, legacy: number) => string;
    fieldOrganisation: string;
    fieldFund: string;
    fieldPeriod: string;
    fieldRole: string;
    fieldBudget: string;
    fieldEuFunding: string;
    roleOwner: string;
    rolePartner: string;
    periodLegacyBadge: string;
    noBudgetDisclosed: string;
    indicatorTargetLabel: string;
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
    viewCallLink: string;
    fieldsMissing: (n: number) => string;
    openLink: string;
  };
  awardedProjects: {
    title: string;
    subtitle: string;
    nextReportDue: (months: number) => string;
    nextReportDueLabel: string;
    awardedAmount: string;
    commitmentsTitle: string;
    promised: string;
    reported: string;
    back: string;
    statusFilterAll: string;
    noProjectsForStatus: string;
    reportingSectionTitle: string;
    reportingSectionSubtitle: string;
  };
  orgProcess: {
    title: string;
    subtitle: string;
    dualComplianceTitle: string;
    dualComplianceReady: string;
    dualComplianceBlocked: string;
    exampleDisclaimer: (orgName: string) => string;
    documentsLabel: string;
    rolesLabel: string;
    customiseLabel: string;
    customisedLabel: string;
  };
  bevakning: {
    title: string;
    subtitle: string;
    disclaimer: string;
    columnCall: string;
    columnDeadline: string;
    deadlineInMonths: (n: number) => string;
    matchingProjectsLabel: (n: number) => string;
    noMatchingProjects: string;
    viewCall: string;
    startApplication: string;
    watchedBadge: string;
    onlyWatchedToggle: string;
    noWatchedCalls: string;
    watchCallButton: string;
    watchingCallButton: string;
  };
  orgSettings: {
    title: string;
    subtitle: string;
    back: string;
    orgNameLabel: string;
    orgNamePlaceholder: string;
    registryTitle: string;
    orgNumberLabel: string;
    orgTypeLabel: string;
    countryLabel: string;
    websiteLabel: string;
    picLabel: string;
    contactNameLabel: string;
    contactEmailLabel: string;
    structureTitle: string;
    structureHint: string;
    addUnitPlaceholder: string;
    addUnitButton: string;
    removeUnitLabel: string;
    confirmRemoveUnit: (name: string) => string;
    confirmRemoveUnitCascade: (name: string, count: number) => string;
    rolesProcessTitle: string;
    rolesProcessHint: string;
    rolesSectionTitle: string;
    rolesSectionHint: string;
    roleNamePlaceholder: (defaultName: string) => string;
    tasksHint: string;
    resetAll: string;
    savedIndicator: string;
  };
  settingsHub: {
    title: string;
    subtitle: string;
    cardProfileTitle: string;
    cardProfileDesc: string;
    cardOrgTitle: string;
    cardOrgDesc: string;
    cardUsersTitle: string;
    cardUsersDesc: (count: number, admins: number) => string;
    cardWatchTitle: string;
    cardWatchDesc: string;
    cardFundingProfileTitle: string;
    cardFundingProfileDesc: string;
    securityTitle: string;
    integrationsTitle: string;
    dataTitle: string;
    comingSoon: string;
  };
  profileSettings: {
    title: string;
    subtitle: string;
    back: string;
    firstName: string;
    lastName: string;
    email: string;
    emailVerified: string;
    ssoManaged: string;
    phone: string;
    jobTitle: string;
    unit: string;
    wholeOrgUnitLabel: (name: string) => string;
    save: string;
    savedIndicator: string;
    notFound: string;
  };
  usersSettings: {
    title: string;
    subtitle: string;
    back: string;
    searchPlaceholder: string;
    roleFilterAll: string;
    invite: string;
    columnUser: string;
    columnUnit: string;
    columnRole: string;
    columnStatus: string;
    statusActive: string;
    statusInvited: string;
    inviteTitle: string;
    inviteFirstName: string;
    inviteLastName: string;
    inviteEmail: string;
    inviteUnit: string;
    inviteRole: string;
    inviteSubmit: string;
    inviteCancel: string;
    remove: string;
    confirmRemove: (name: string) => string;
    thatsYou: string;
    wholeOrgUnitLabel: (name: string) => string;
    detailBack: string;
    detailOrgRole: string;
    detailProjectRoles: string;
    addProjectRole: string;
    projectRolePlaceholder: string;
    removeRole: string;
    noProjectRoles: string;
    permissionMatrixTitle: string;
    permView: string;
    permEdit: string;
    permSubmit: string;
    permApprove: string;
    permManageUsers: string;
  };
  watchSettings: {
    title: string;
    subtitle: string;
    back: string;
    sectorsTitle: string;
    programsTitle: string;
    notifyTitle: string;
    notifyNewCallOrg: string;
    notifyCallProject: string;
    notifyHighRelevance: string;
    notifyDeadline: string;
    notifyComment: string;
    notifyReportingDeadline: string;
    digestTitle: string;
    digestInstant: string;
    digestDaily: string;
    digestWeekly: string;
    savedIndicator: string;
    resetAll: string;
    watchedCallsTitle: string;
    watchedCallsHint: string;
    noWatchedCalls: string;
    removeWatchedCall: string;
  };
  fundingProfileSettings: {
    title: string;
    subtitle: string;
    back: string;
    focusAreasLabel: string;
    focusAreasPlaceholder: string;
    addTag: string;
    projectSizeLabel: string;
    sizeLt1m: string;
    size1to10: string;
    size10to50: string;
    sizeGt50: string;
    geoLabel: string;
    geoSweden: string;
    geoNordic: string;
    geoBaltic: string;
    geoEu: string;
    partnerLabel: string;
    leadLabel: string;
    coFinancingLabel: string;
    coFinancing10: string;
    coFinancing30: string;
    coFinancing50: string;
    coFinancingOver50: string;
    savedIndicator: string;
    resetAll: string;
  };
  oversikt: {
    title: string;
    subtitle: string;
    roleLabel: string;
    roleLedning: string;
    roleLedningDesc: string;
    roleSamordnare: string;
    roleSamordnareDesc: string;
    roleVerksamhet: string;
    roleVerksamhetDesc: string;
    sectionTopMatches: string;
    sectionStatusBreakdown: string;
    sectionUpcomingDeadlines: string;
    sectionDocumentsNeedingUpdate: string;
    sectionYourProjects: string;
    departmentFilterLabel: string;
    allDepartments: string;
    noDocumentsNeedingUpdate: string;
    noProjectsInDepartment: string;
    fieldsMissingForBestMatch: (n: number) => string;
    describeNewProject: string;
    viewAllInPortfolio: string;
    viewAllInBevakning: string;
    ongoingApplicationsTitle: string;
    ongoingApplicationsHint: string;
    ongoingApplicationsNone: string;
    ongoingApplicationsResume: string;
    ongoingApplicationsUpdatedAt: (date: string) => string;
    ongoingApplicationsVersions: (n: number) => string;
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
      referenceProjects: "Referensprojekt",
      myProjects: "Mina projekt",
      datacenter: "Datacenter",
      overview: "Översikt",
      monitoring: "Bevakning",
      settings: "Inställningar",
      menu: "Meny",
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
        fillExample: "Fyll i exempel",
        prefilledFromBank: "Förifyllt från projektbanken — granska och komplettera innan ni fortsätter.",
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
        logicHint: "AI-genererat förslag — redigera direkt i fälten nedan.",
        resetField: "Återställ AI-förslag",
        reviewerTitle: "AI-granskning",
        reviewerSubtitle: "Kontrollpunkter innan ansökan lämnas in",
        budgetTitle: "Budget & medfinansiering",
        totalBudget: "Total projektbudget",
        estEuShare: "Uppskattat EU-bidrag",
        coFinancing: "Kommunal medfinansiering (uppskattad)",
        nextStepsTitle: "Nästa steg",
        tabApplication: "Ansökan",
        tabAssessment: "Bedömning",
        tabProcess: "Process & granskning",
        topPriorityLabel: "Viktigast att åtgärda",
        topPriorityNone: "Inga akuta åtgärder — ansökan ser stark ut.",
        draftSavedNote: "Utkastet sparas automatiskt i din webbläsare.",
        draftNotSavedNote: "Spara projektet i projektbanken för att utkastet ska sparas mellan besök.",
        templateSourceNote: (callTitle) => `Strukturerad enligt ${callTitle}s eget ansökningsformulär.`,
        templateGenericNote:
          "Generisk projektlogik — den här utlysningen har ingen fördefinierad ansökningsstruktur i systemet ännu.",
        exportButton: "Exportera ansökan (.docx)",
        versionsTitle: "Versioner",
        versionsHint: "Spara namngivna versioner av ansökan, t.ex. ett utkast och en slutgiltig version.",
        versionNamePlaceholder: "Versionsnamn",
        versionQuickDraft: "Utkast",
        versionQuickFinal: "Slutgiltig version",
        saveVersionButton: "Spara version",
        noVersions: "Inga sparade versioner än.",
        restoreVersionButton: "Återställ till denna version",
        deleteVersionButton: "Ta bort",
        versionSavedAt: (date) => `Sparad ${date}`,
        nextSteps: [
          "Åtgärda punkterna som AI-granskningen flaggat",
          "Bekräfta partnerskap/konsortium vid behov",
          "Komplettera indikatorer med mätbara utgångsvärden",
          "Beskriv hur projektet arbetar med horisontella principer (jämställdhet, tillgänglighet, hållbarhet)",
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
      columnBestMatch: "Bästa matchning",
      statTotal: "Projekt i portföljen",
      statAvgMatch: "Genomsnittlig bästa matchning",
      statProceedReady: "Redo att gå vidare",
      statusLabels: {
        idea: "Idé",
        assessing: "Under bedömning",
        "funding-search": "Söker finansiering",
        application: "Ansökan pågår",
        submitted: "Inlämnad",
        approved: "Beviljat",
        rejected: "Avslag",
        running: "Genomförs",
        completed: "Avslutat",
      },
      detailOwner: "Projektägare",
      editButton: "✎ Redigera",
      editCancel: "Avbryt",
      editSave: "Spara ändringar",
      editSavedIndicator: "Sparat i din webbläsare",
      editFieldTitle: "Projektnamn",
      editFieldPartnership: "Vi har (eller kan skaffa) en internationell partnerorganisation",
      plusOthers: (n) => `+${n} till`,
      assignedRolesTitle: "Tilldelade roller",
      noAssignedRoles: "Ingen har tilldelats en roll för detta projekt ännu.",
      detailNotFound: "Hittade inget projekt med det här id:t.",
      detailThemeLabel: "Tema",
      detailDescriptionLabel: "Beskrivning",
      detailMissingInfoTitle: "Information som saknas för optimal EU-matchning",
      detailMissingInfoBody:
        "Projektinformationen är inte tillräcklig för optimal EU-matchning. Komplettera enligt nedan innan en specifik utlysning väljs.",
      detailMatchesTitle: "Matchningar mot öppna och kommande utlysningar",
      detailNoMatches: "Inga utlysningar att matcha mot just nu.",
      similarProjectsTitle: "Liknande beviljade projekt",
      similarProjectsIntro:
        "Baserat på projektbeskrivningen — jämfört med tidigare beviljade EU-projekt (se förbehåll under Referensprojekt).",
      similarProjectsNone: "Inga tillräckligt lika beviljade projekt hittades än — komplettera beskrivningen för fler träffar.",
      similarProjectsSharedLabel: "Gemensamma begrepp",
      detailFindFunding: "Hitta finansiering för detta projekt",
      back: "Tillbaka till projektbanken",
      importButton: "Importera projekt (CSV)",
      downloadTemplate: "Ladda ner mall",
      importHint:
        "Kolumner: Titel, Förvaltning, Ägare, Budget, Startår, Slutår, Sektor, Beskrivning, Internationell partner. Sparas i din webbläsare (ingen delning mellan användare i den här demon).",
      clearImported: "Rensa importerade projekt",
      removeImportedRow: "Ta bort importerat projekt",
      economicsTitle: "Portföljekonomi",
      statPortfolioBudget: "Total portföljbudget",
      statFundingPotential: "Identifierad EU-finansieringspotential",
      statCoFinancingNeed: "Uppskattat medfinansieringsbehov",
    },
    euDatabase: {
      title: "EU-databas",
      subtitle: "Program, fonder, utlysningar och de dokument AI:n faktiskt arbetar utifrån.",
      programsBack: "Alla program",
      callsCount: (n) => `${n} utlysningar`,
      documentsCount: (n) => `${n} dokument`,
      deadlineLabel: "Deadline",
      statusOpen: "Öppen",
      closedProgrammeBadge: "Avslutat program",
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
      patternTitle: "Vad brukar beviljas inom detta program?",
      patternIntro: "Återkommande begrepp i tidigare beviljade projekt inom programmet — inte en garanti, men en fingervisning om vad utlysningarna faktiskt brukar finansiera.",
      patternNone: "För få beviljade projekt inom programmet för att se ett tydligt mönster ännu.",
      helpMeApplyButton: "Hjälp mig söka",
      backToProgram: "Tillbaka till programmet",
      backToPrograms: "Tillbaka till EU-databasen",
      noCallsForProgram: "Inga aktuella utlysningar inom detta program just nu.",
    },
    referenceProjects: {
      title: "Beviljade referensprojekt",
      subtitle: "Vad har faktiskt fått finansiering tidigare — och varför?",
      disclaimer:
        "Verklig data: en anonymiserad kommuns faktiska register över EU-finansierade projekt 2014–2027, hämtat ur kommunens egen dokumentation (organisationsnamn ersatta med \"Exempelstad\"). Inte alla projekt har publicerat en fullständig budgetsiffra.",
      filterAll: "Alla program",
      statsTitle: "Statistik för valt program",
      statsIntro: (n) => `${n} beviljade projekt`,
      statOwnerShare: "Kommunen var projektägare i",
      statAvgBudget: "Genomsnittlig projektbudget",
      statTopTheme: "Vanligaste tema",
      statCurrentVsLegacy: (current, legacy) => `${current} pågående/aktuella (2021–2027), ${legacy} avslutade (2014–2020)`,
      fieldOrganisation: "Organisation",
      fieldFund: "Fond/program",
      fieldPeriod: "Projektperiod",
      fieldRole: "Kommunens roll",
      fieldBudget: "Total budget",
      fieldEuFunding: "Varav EU-finansiering",
      roleOwner: "Projektägare",
      rolePartner: "Projektpartner",
      periodLegacyBadge: "Avslutat 2014–2020",
      noBudgetDisclosed: "Ej redovisad",
      indicatorTargetLabel: "mål",
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
      viewCallLink: "Visa utlysning →",
      fieldsMissing: (n) => `${n} fält saknas`,
      openLink: "Öppna →",
    },
    awardedProjects: {
      title: "Mina projekt",
      subtitle: "Alla dina projekt oavsett status — och rapportering på det som beviljats.",
      nextReportDue: (m) => `Nästa rapportering om ${m} månader`,
      nextReportDueLabel: "Nästa rapportering",
      awardedAmount: "Beviljat belopp",
      commitmentsTitle: "Åtaganden från ansökan vs. utfall",
      promised: "Utlovat",
      reported: "Rapporterat",
      back: "Tillbaka till mina projekt",
      statusFilterAll: "Alla",
      noProjectsForStatus: "Inga projekt med denna status.",
      reportingSectionTitle: "Rapportering på beviljade projekt",
      reportingSectionSubtitle: "Åtaganden från ansökan följs upp mot rapporterat utfall.",
    },
    orgProcess: {
      title: "Organisationens regelverk",
      subtitle: "Kommunens interna process löper parallellt med EU:s externa krav.",
      dualComplianceTitle: "Dubbel kravbild",
      dualComplianceReady: "Ansökan är redo ur både EU-utlysningens och kommunens interna processperspektiv.",
      dualComplianceBlocked:
        "Ansökan är redo ur EU-utlysningens perspektiv, men enligt kommunens interna projektprocess saknas ett eller flera steg.",
      exampleDisclaimer: (orgName) =>
        `Exempel: så här fördelar ${orgName} internt ansvar i detta steg. Varje organisation konfigurerar sin egen process — det här är inte en standard i systemet.`,
      documentsLabel: "Stödmaterial för detta steg",
      rolesLabel: "Roller och ansvar",
      customiseLabel: "Anpassa för er organisation",
      customisedLabel: "Anpassat för er organisation",
    },
    bevakning: {
      title: "Bevakning",
      subtitle: "Kommande deadlines, och vilka projekt i portföljen som passar bäst.",
      disclaimer:
        "I en skarp version skulle detta skickas som ett återkommande veckobrev till EU-samordnaren. Här visas samma information direkt i gränssnittet.",
      columnCall: "Utlysning",
      columnDeadline: "Deadline",
      deadlineInMonths: (n) => `Deadline: ${n} mån`,
      matchingProjectsLabel: (n) => `${n} matchande projekt i portföljen`,
      noMatchingProjects: "Inga projekt i portföljen matchar denna utlysning ännu.",
      viewCall: "Visa utlysning",
      startApplication: "Starta ansökan",
      watchedBadge: "★ Bevakad",
      onlyWatchedToggle: "Visa endast mina bevakningar",
      noWatchedCalls: "Inga bevakade utlysningar. Klicka \"Bevaka\" på en utlysning, eller justera dina bevakningar under Inställningar → Bevakningar.",
      watchCallButton: "☆ Bevaka",
      watchingCallButton: "★ Bevakas",
    },
    orgSettings: {
      title: "Organisation",
      subtitle: "Organisationens grunduppgifter, enheter och EU-processens roller.",
      back: "← Tillbaka till Inställningar",
      orgNameLabel: "Organisationens namn",
      orgNamePlaceholder: "T.ex. Exempelstad kommun",
      registryTitle: "Grunduppgifter",
      orgNumberLabel: "Organisationsnummer",
      orgTypeLabel: "Organisationsform",
      countryLabel: "Land",
      websiteLabel: "Webbplats",
      picLabel: "PIC-nummer (EU Funding & Tenders Portal)",
      contactNameLabel: "Huvudkontakt",
      contactEmailLabel: "Huvudkontaktens e-post",
      structureTitle: "Organisationsstruktur",
      structureHint: "Enheter/förvaltningar. Används för att koppla användare till rätt del av organisationen.",
      addUnitPlaceholder: "Namn på ny enhet",
      addUnitButton: "+ Lägg till enhet",
      removeUnitLabel: "Ta bort",
      confirmRemoveUnit: (name) => `Ta bort enheten "${name}"?`,
      confirmRemoveUnitCascade: (name, count) =>
        `Ta bort enheten "${name}"? Detta tar även bort ${count} underliggande ${count === 1 ? "enhet" : "enheter"}.`,
      rolesProcessTitle: "Roller och ansvar i EU-processen",
      rolesProcessHint:
        "De interna rollerna som delar ansvaret för ett EU-projekt genom dess faser (idé → ansökan → genomförande → avslut).",
      rolesSectionTitle: "Roller",
      rolesSectionHint:
        "Benämningarna nedan är ett exempel. Döp om rollerna till dem som används i er organisation — namnet uppdateras överallt de visas.",
      roleNamePlaceholder: (defaultName) => `T.ex. ${defaultName}`,
      tasksHint: "En uppgift per rad.",
      resetAll: "Återställ allt till exempeldata",
      savedIndicator: "Sparat i din webbläsare",
    },
    settingsHub: {
      title: "Inställningar",
      subtitle: "Hantera din profil, organisation och systeminställningar.",
      cardProfileTitle: "Min profil",
      cardProfileDesc: "Personliga uppgifter och kontaktinformation.",
      cardOrgTitle: "Organisation",
      cardOrgDesc: "Organisation, enheter och EU-information.",
      cardUsersTitle: "Användare & behörigheter",
      cardUsersDesc: (count, admins) => `${count} användare · ${admins} administratörer`,
      cardWatchTitle: "Bevakningar & notifieringar",
      cardWatchDesc: "Utlysningar, matchningar och deadlines.",
      cardFundingProfileTitle: "Finansieringsprofil",
      cardFundingProfileDesc: "Vad organisationen söker finansiering för — används av matchningsmotorn.",
      securityTitle: "🔐 Säkerhet",
      integrationsTitle: "🔗 Integrationer",
      dataTitle: "🛡 Data & integritet",
      comingSoon: "Kommer senare",
    },
    profileSettings: {
      title: "Min profil",
      subtitle: "Personliga uppgifter och kontaktinformation.",
      back: "← Tillbaka till Inställningar",
      firstName: "Förnamn",
      lastName: "Efternamn",
      email: "E-post",
      emailVerified: "✓ Verifierad",
      ssoManaged: "Hanteras via er inloggningslösning (SSO)",
      phone: "Telefon",
      jobTitle: "Befattning",
      unit: "Avdelning/enhet",
      wholeOrgUnitLabel: (name) => `${name} (hela organisationen)`,
      save: "Spara ändringar",
      savedIndicator: "Sparat i din webbläsare",
      notFound: "Din användare hittades inte längre i katalogen. Den kan ha tagits bort under Användare & behörigheter.",
    },
    usersSettings: {
      title: "Användare & behörigheter",
      subtitle: "Bjud in användare och hantera roller på organisations- och projektnivå.",
      back: "← Tillbaka till Inställningar",
      searchPlaceholder: "🔎 Sök användare...",
      roleFilterAll: "Alla roller",
      invite: "+ Bjud in användare",
      columnUser: "Användare",
      columnUnit: "Organisation/enhet",
      columnRole: "Roll",
      columnStatus: "Status",
      statusActive: "● Aktiv",
      statusInvited: "○ Inbjuden",
      inviteTitle: "Bjud in användare",
      inviteFirstName: "Förnamn",
      inviteLastName: "Efternamn",
      inviteEmail: "E-post",
      inviteUnit: "Enhet",
      inviteRole: "Organisationsroll",
      inviteSubmit: "Skicka inbjudan",
      inviteCancel: "Avbryt",
      remove: "Ta bort användare",
      confirmRemove: (name) => `Ta bort ${name} från organisationen?`,
      thatsYou: "Det här är du",
      wholeOrgUnitLabel: (name) => `${name} (hela organisationen)`,
      detailBack: "← Tillbaka till användare",
      detailOrgRole: "Organisationsroll",
      detailProjectRoles: "Projektbehörigheter",
      addProjectRole: "+ Lägg till projekt",
      projectRolePlaceholder: "Välj projekt...",
      removeRole: "Ta bort",
      noProjectRoles: "Inga projektbehörigheter tilldelade ännu.",
      permissionMatrixTitle: "Vad respektive organisationsroll ger rätt till",
      permView: "Visa",
      permEdit: "Redigera",
      permSubmit: "Skicka in",
      permApprove: "Godkänna",
      permManageUsers: "Hantera användare",
    },
    watchSettings: {
      title: "Bevakningar & notifieringar",
      subtitle: "Vad vill du bevaka, och när vill du bli meddelad?",
      back: "← Tillbaka till Inställningar",
      sectorsTitle: "Ämnesområden",
      programsTitle: "EU-program",
      notifyTitle: "Meddela mig när...",
      notifyNewCallOrg: "En ny utlysning matchar vår organisation",
      notifyCallProject: "En utlysning matchar något av mina projekt",
      notifyHighRelevance: "En projektmatchning får hög relevans",
      notifyDeadline: "Deadline närmar sig",
      notifyComment: "Någon kommenterar min ansökan",
      notifyReportingDeadline: "En rapporteringsdeadline närmar sig",
      digestTitle: "Sammanställning",
      digestInstant: "Direkt",
      digestDaily: "Dagligen",
      digestWeekly: "Veckovis",
      savedIndicator: "Sparat i din webbläsare",
      resetAll: "Återställ till exempeldata",
      watchedCallsTitle: "Bevakade utlysningar",
      watchedCallsHint: "Utlysningar du flaggat direkt från Bevakning eller EU-databasen.",
      noWatchedCalls: "Inga enskilda utlysningar bevakas ännu.",
      removeWatchedCall: "Sluta bevaka",
    },
    fundingProfileSettings: {
      title: "Finansieringsprofil",
      subtitle: "Hjälp EU Navigator att hitta relevanta finansieringsmöjligheter åt er.",
      back: "← Tillbaka till Inställningar",
      focusAreasLabel: "Organisationens fokusområden",
      focusAreasPlaceholder: "Lägg till fokusområde...",
      addTag: "Lägg till",
      projectSizeLabel: "Vanlig projektstorlek",
      sizeLt1m: "< 1 MSEK",
      size1to10: "1–10 MSEK",
      size10to50: "10–50 MSEK",
      sizeGt50: "> 50 MSEK",
      geoLabel: "Geografiskt intresse",
      geoSweden: "Sverige",
      geoNordic: "Norden",
      geoBaltic: "Östersjöregionen",
      geoEu: "EU-samarbeten",
      partnerLabel: "Projekt där partnerskap är möjligt",
      leadLabel: "Kan organisationen vara projektledare?",
      coFinancingLabel: "Medfinansiering organisationen klarar",
      coFinancing10: "Upp till 10 %",
      coFinancing30: "Upp till 30 %",
      coFinancing50: "Upp till 50 %",
      coFinancingOver50: "Över 50 %",
      savedIndicator: "Sparat i din webbläsare",
      resetAll: "Återställ till exempeldata",
    },
    oversikt: {
      title: "Översikt",
      subtitle: "Samma data, olika vy beroende på vad du behöver se.",
      roleLabel: "Visa som",
      roleLedning: "Kommunledning / ekonomi",
      roleLedningDesc: "Portföljekonomi och status över hela investeringsplanen.",
      roleSamordnare: "EU-/finansieringssamordnare",
      roleSamordnareDesc: "Alla projekt rankade efter matchning, kommande deadlines och dokument som behöver ses över.",
      roleVerksamhet: "Verksamhetsutvecklare",
      roleVerksamhetDesc: "Dina förvaltningens projekt och vad som saknas för bästa matchning.",
      sectionTopMatches: "Starkaste matchningarna just nu",
      sectionStatusBreakdown: "Projekt per status",
      sectionUpcomingDeadlines: "Närmaste deadlines",
      sectionDocumentsNeedingUpdate: "Dokument som behöver ses över",
      sectionYourProjects: "Projekt",
      departmentFilterLabel: "Förvaltning",
      allDepartments: "Alla förvaltningar",
      noDocumentsNeedingUpdate: "Inga dokument behöver ses över just nu.",
      noProjectsInDepartment: "Inga projekt i denna förvaltning ännu.",
      fieldsMissingForBestMatch: (n) => `${n} fält saknas för bästa matchning`,
      describeNewProject: "Beskriv ett nytt projekt",
      viewAllInPortfolio: "Se hela projektbanken →",
      viewAllInBevakning: "Se all bevakning →",
      ongoingApplicationsTitle: "Pågående ansökningar",
      ongoingApplicationsHint: "Hoppa direkt tillbaka till en ansökan du redan börjat skriva på.",
      ongoingApplicationsNone: "Inga pågående ansökningar just nu — de dyker upp här så fort du börjar skriva i Ansökningsstudion.",
      ongoingApplicationsResume: "Fortsätt →",
      ongoingApplicationsUpdatedAt: (date) => `Senast redigerad ${date}`,
      ongoingApplicationsVersions: (n) => (n === 1 ? "1 sparad version" : `${n} sparade versioner`),
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
      referenceProjects: "Reference projects",
      myProjects: "My projects",
      datacenter: "Datacenter",
      overview: "Overview",
      monitoring: "Monitoring",
      settings: "Settings",
      menu: "Menu",
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
        fillExample: "Fill example",
        prefilledFromBank: "Pre-filled from the project bank — review and complete before continuing.",
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
        logicHint: "AI-generated draft — edit directly in the fields below.",
        resetField: "Reset to AI suggestion",
        reviewerTitle: "AI review",
        reviewerSubtitle: "Checkpoints before submitting the application",
        budgetTitle: "Budget & co-financing",
        totalBudget: "Total project budget",
        estEuShare: "Estimated EU contribution",
        coFinancing: "Municipal co-financing (estimated)",
        nextStepsTitle: "Next steps",
        tabApplication: "Application",
        tabAssessment: "Assessment",
        tabProcess: "Process & review",
        topPriorityLabel: "Top priority",
        topPriorityNone: "No urgent action items — the application looks strong.",
        draftSavedNote: "This draft is saved automatically in your browser.",
        draftNotSavedNote: "Save this project to the project bank so its draft is kept between visits.",
        templateSourceNote: (callTitle) => `Structured according to ${callTitle}'s own application form.`,
        templateGenericNote: "Generic project logic — this call has no predefined application structure in the system yet.",
        exportButton: "Export application (.docx)",
        versionsTitle: "Versions",
        versionsHint: "Save named versions of the application, e.g. a draft and a final version.",
        versionNamePlaceholder: "Version name",
        versionQuickDraft: "Draft",
        versionQuickFinal: "Final draft",
        saveVersionButton: "Save version",
        noVersions: "No saved versions yet.",
        restoreVersionButton: "Restore this version",
        deleteVersionButton: "Delete",
        versionSavedAt: (date) => `Saved ${date}`,
        nextSteps: [
          "Address the points flagged by the AI review",
          "Confirm partnership/consortium if required",
          "Add measurable baselines to indicators",
          "Describe how the project addresses horizontal principles (gender equality, accessibility, sustainability)",
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
      columnBestMatch: "Best match",
      statTotal: "Projects in portfolio",
      statAvgMatch: "Average best match",
      statProceedReady: "Ready to proceed",
      statusLabels: {
        idea: "Idea",
        assessing: "Under assessment",
        "funding-search": "Searching for funding",
        application: "Applying",
        submitted: "Submitted",
        approved: "Awarded",
        rejected: "Rejected",
        running: "Delivering",
        completed: "Closed",
      },
      detailOwner: "Project owner",
      editButton: "✎ Edit",
      editCancel: "Cancel",
      editSave: "Save changes",
      editSavedIndicator: "Saved in your browser",
      editFieldTitle: "Project name",
      editFieldPartnership: "We have (or can secure) an international partner organisation",
      plusOthers: (n) => `+${n} more`,
      assignedRolesTitle: "Assigned roles",
      noAssignedRoles: "No one has been assigned a role on this project yet.",
      detailNotFound: "No project found with that id.",
      detailThemeLabel: "Theme",
      detailDescriptionLabel: "Description",
      detailMissingInfoTitle: "Information missing for optimal EU matching",
      detailMissingInfoBody:
        "The project information isn't sufficient for optimal EU matching. Complete it as below before selecting a specific call.",
      detailMatchesTitle: "Matches against open and upcoming calls",
      detailNoMatches: "No calls to match against right now.",
      similarProjectsTitle: "Similar funded projects",
      similarProjectsIntro:
        "Based on the project description — compared against previously funded EU projects (see the caveats under Reference projects).",
      similarProjectsNone: "No sufficiently similar funded projects found yet — add more detail to the description for matches.",
      similarProjectsSharedLabel: "Shared terms",
      detailFindFunding: "Find funding for this project",
      back: "Back to the project bank",
      importButton: "Import projects (CSV)",
      downloadTemplate: "Download template",
      importHint:
        "Columns: Titel, Förvaltning, Ägare, Budget, Startår, Slutår, Sektor, Beskrivning, Internationell partner. Saved in your browser (not shared between users in this demo).",
      clearImported: "Clear imported projects",
      removeImportedRow: "Remove imported project",
      economicsTitle: "Portfolio economics",
      statPortfolioBudget: "Total portfolio budget",
      statFundingPotential: "Identified EU funding potential",
      statCoFinancingNeed: "Estimated co-financing need",
    },
    euDatabase: {
      title: "EU database",
      subtitle: "Programmes, funds, calls, and the documents the AI actually works from.",
      programsBack: "All programmes",
      callsCount: (n) => `${n} calls`,
      documentsCount: (n) => `${n} documents`,
      deadlineLabel: "Deadline",
      statusOpen: "Open",
      closedProgrammeBadge: "Closed programme",
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
      patternTitle: "What tends to get funded under this programme?",
      patternIntro: "Recurring terms across previously funded projects in this programme — not a guarantee, but a hint at what its calls actually tend to fund.",
      patternNone: "Not enough funded projects in this programme yet to see a clear pattern.",
      helpMeApplyButton: "Help me apply",
      backToProgram: "Back to the programme",
      backToPrograms: "Back to the EU database",
      noCallsForProgram: "No active calls under this programme right now.",
    },
    referenceProjects: {
      title: "Awarded reference projects",
      subtitle: "What has actually been funded before — and why?",
      disclaimer:
        "Real data: an anonymised municipality's actual register of EU-funded projects 2014-2027, drawn from its own documentation (organisation names replaced with \"Exempelstad\"). Not every project has published a full budget figure.",
      filterAll: "All programmes",
      statsTitle: "Statistics for the selected programme",
      statsIntro: (n) => `${n} awarded projects`,
      statOwnerShare: "The municipality was project owner in",
      statAvgBudget: "Average project budget",
      statTopTheme: "Most common theme",
      statCurrentVsLegacy: (current, legacy) => `${current} ongoing/current (2021-2027), ${legacy} closed (2014-2020)`,
      fieldOrganisation: "Organisation",
      fieldFund: "Fund/programme",
      fieldPeriod: "Project period",
      fieldRole: "Municipality's role",
      fieldBudget: "Total budget",
      fieldEuFunding: "Of which EU funding",
      roleOwner: "Project owner",
      rolePartner: "Project partner",
      periodLegacyBadge: "Closed 2014-2020",
      noBudgetDisclosed: "Not disclosed",
      indicatorTargetLabel: "target",
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
      viewCallLink: "View call →",
      fieldsMissing: (n) => `${n} fields missing`,
      openLink: "Open →",
    },
    awardedProjects: {
      title: "My projects",
      subtitle: "All your projects regardless of status — and reporting on what's been awarded.",
      nextReportDue: (m) => `Next report due in ${m} months`,
      nextReportDueLabel: "Next report",
      awardedAmount: "Awarded amount",
      commitmentsTitle: "Application commitments vs. outturn",
      promised: "Promised",
      reported: "Reported",
      back: "Back to my projects",
      statusFilterAll: "All",
      noProjectsForStatus: "No projects with this status.",
      reportingSectionTitle: "Reporting on awarded projects",
      reportingSectionSubtitle: "Commitments made in the application are tracked against reported outturn.",
    },
    orgProcess: {
      title: "Organisation's internal process",
      subtitle: "The municipality's internal process runs alongside the EU's external requirements.",
      dualComplianceTitle: "Dual compliance",
      dualComplianceReady: "The application is ready from both the EU call's and the municipality's internal process perspective.",
      dualComplianceBlocked:
        "The application is ready from the EU call's perspective, but one or more steps are missing according to the municipality's internal project process.",
      exampleDisclaimer: (orgName) =>
        `Example: this is how ${orgName} divides internal responsibility at this step. Every organisation configures its own process — this is not a system default.`,
      documentsLabel: "Supporting material for this step",
      rolesLabel: "Roles and responsibilities",
      customiseLabel: "Customise for your organisation",
      customisedLabel: "Customised for your organisation",
    },
    bevakning: {
      title: "Monitoring",
      subtitle: "Upcoming deadlines, and which portfolio projects fit them best.",
      disclaimer:
        "In a production version this would be sent as a recurring weekly digest to the EU coordinator. Here it's shown directly in the interface instead.",
      columnCall: "Call",
      columnDeadline: "Deadline",
      deadlineInMonths: (n) => `Deadline: ${n} mo`,
      matchingProjectsLabel: (n) => `${n} matching projects in the portfolio`,
      noMatchingProjects: "No projects in the portfolio match this call yet.",
      viewCall: "View call",
      startApplication: "Start application",
      watchedBadge: "★ Watched",
      onlyWatchedToggle: "Show only my watchlist",
      noWatchedCalls: "No watched calls. Click \"Watch\" on a call, or adjust your watchlist under Settings → Watchlists & notifications.",
      watchCallButton: "☆ Watch",
      watchingCallButton: "★ Watching",
    },
    orgSettings: {
      title: "Organisation",
      subtitle: "The organisation's registry info, units, and the EU process's roles.",
      back: "← Back to Settings",
      orgNameLabel: "Organisation name",
      orgNamePlaceholder: "E.g. Example City Municipality",
      registryTitle: "Registry info",
      orgNumberLabel: "Organisation number",
      orgTypeLabel: "Organisation type",
      countryLabel: "Country",
      websiteLabel: "Website",
      picLabel: "PIC number (EU Funding & Tenders Portal)",
      contactNameLabel: "Main contact",
      contactEmailLabel: "Main contact's email",
      structureTitle: "Organisation structure",
      structureHint: "Units/departments. Used to link users to the right part of the organisation.",
      addUnitPlaceholder: "New unit name",
      addUnitButton: "+ Add unit",
      removeUnitLabel: "Remove",
      confirmRemoveUnit: (name) => `Remove the unit "${name}"?`,
      confirmRemoveUnitCascade: (name, count) =>
        `Remove the unit "${name}"? This will also remove its ${count} sub-unit${count === 1 ? "" : "s"}.`,
      rolesProcessTitle: "Roles and responsibilities in the EU process",
      rolesProcessHint:
        "The internal roles that share responsibility for an EU project across its phases (idea → application → delivery → closure).",
      rolesSectionTitle: "Roles",
      rolesSectionHint:
        "The labels below are an example. Rename the roles to match your own organisation — the name updates everywhere it's shown.",
      roleNamePlaceholder: (defaultName) => `E.g. ${defaultName}`,
      tasksHint: "One task per line.",
      resetAll: "Reset everything to the example data",
      savedIndicator: "Saved in your browser",
    },
    settingsHub: {
      title: "Settings",
      subtitle: "Manage your profile, organisation and system settings.",
      cardProfileTitle: "My profile",
      cardProfileDesc: "Personal details and contact information.",
      cardOrgTitle: "Organisation",
      cardOrgDesc: "Organisation, units and EU information.",
      cardUsersTitle: "Users & permissions",
      cardUsersDesc: (count, admins) => `${count} users · ${admins} administrators`,
      cardWatchTitle: "Watchlists & notifications",
      cardWatchDesc: "Calls, matches and deadlines.",
      cardFundingProfileTitle: "Funding profile",
      cardFundingProfileDesc: "What the organisation seeks funding for — used by the matching engine.",
      securityTitle: "🔐 Security",
      integrationsTitle: "🔗 Integrations",
      dataTitle: "🛡 Data & privacy",
      comingSoon: "Coming later",
    },
    profileSettings: {
      title: "My profile",
      subtitle: "Personal details and contact information.",
      back: "← Back to Settings",
      firstName: "First name",
      lastName: "Last name",
      email: "Email",
      emailVerified: "✓ Verified",
      ssoManaged: "Managed by your organisation's login (SSO)",
      phone: "Phone",
      jobTitle: "Job title",
      unit: "Department/unit",
      wholeOrgUnitLabel: (name) => `${name} (whole organisation)`,
      save: "Save changes",
      savedIndicator: "Saved in your browser",
      notFound: "Your user could not be found in the directory anymore. It may have been removed under Users & permissions.",
    },
    usersSettings: {
      title: "Users & permissions",
      subtitle: "Invite users and manage roles at organisation and project level.",
      back: "← Back to Settings",
      searchPlaceholder: "🔎 Search users...",
      roleFilterAll: "All roles",
      invite: "+ Invite user",
      columnUser: "User",
      columnUnit: "Organisation/unit",
      columnRole: "Role",
      columnStatus: "Status",
      statusActive: "● Active",
      statusInvited: "○ Invited",
      inviteTitle: "Invite user",
      inviteFirstName: "First name",
      inviteLastName: "Last name",
      inviteEmail: "Email",
      inviteUnit: "Unit",
      inviteRole: "Organisation role",
      inviteSubmit: "Send invite",
      inviteCancel: "Cancel",
      remove: "Remove user",
      confirmRemove: (name) => `Remove ${name} from the organisation?`,
      thatsYou: "That's you",
      wholeOrgUnitLabel: (name) => `${name} (whole organisation)`,
      detailBack: "← Back to users",
      detailOrgRole: "Organisation role",
      detailProjectRoles: "Project permissions",
      addProjectRole: "+ Add project",
      projectRolePlaceholder: "Select project...",
      removeRole: "Remove",
      noProjectRoles: "No project permissions assigned yet.",
      permissionMatrixTitle: "What each organisation role grants",
      permView: "View",
      permEdit: "Edit",
      permSubmit: "Submit",
      permApprove: "Approve",
      permManageUsers: "Manage users",
    },
    watchSettings: {
      title: "Watchlists & notifications",
      subtitle: "What do you want to watch, and when should we notify you?",
      back: "← Back to Settings",
      sectorsTitle: "Subject areas",
      programsTitle: "EU programmes",
      notifyTitle: "Notify me when...",
      notifyNewCallOrg: "A new call matches our organisation",
      notifyCallProject: "A call matches one of my projects",
      notifyHighRelevance: "A project match reaches high relevance",
      notifyDeadline: "A deadline is approaching",
      notifyComment: "Someone comments on my application",
      notifyReportingDeadline: "A reporting deadline is approaching",
      digestTitle: "Digest",
      digestInstant: "Instant",
      digestDaily: "Daily",
      digestWeekly: "Weekly",
      savedIndicator: "Saved in your browser",
      resetAll: "Reset to the example data",
      watchedCallsTitle: "Watched calls",
      watchedCallsHint: "Calls you've flagged directly from Watchlist or the EU database.",
      noWatchedCalls: "No individual calls watched yet.",
      removeWatchedCall: "Stop watching",
    },
    fundingProfileSettings: {
      title: "Funding profile",
      subtitle: "Help EU Navigator find relevant funding opportunities for you.",
      back: "← Back to Settings",
      focusAreasLabel: "The organisation's focus areas",
      focusAreasPlaceholder: "Add focus area...",
      addTag: "Add",
      projectSizeLabel: "Typical project size",
      sizeLt1m: "< 1M SEK",
      size1to10: "1–10M SEK",
      size10to50: "10–50M SEK",
      sizeGt50: "> 50M SEK",
      geoLabel: "Geographic interest",
      geoSweden: "Sweden",
      geoNordic: "Nordics",
      geoBaltic: "Baltic Sea region",
      geoEu: "EU-wide collaboration",
      partnerLabel: "Projects where partnership is possible",
      leadLabel: "Can the organisation be project lead?",
      coFinancingLabel: "Co-financing the organisation can cover",
      coFinancing10: "Up to 10%",
      coFinancing30: "Up to 30%",
      coFinancing50: "Up to 50%",
      coFinancingOver50: "Over 50%",
      savedIndicator: "Saved in your browser",
      resetAll: "Reset to the example data",
    },
    oversikt: {
      title: "Overview",
      subtitle: "The same data, arranged differently depending on what you need to see.",
      roleLabel: "View as",
      roleLedning: "Municipal leadership / finance",
      roleLedningDesc: "Portfolio economics and status across the whole investment plan.",
      roleSamordnare: "EU / funding coordinator",
      roleSamordnareDesc: "Every project ranked by match, upcoming deadlines, and documents needing a review.",
      roleVerksamhet: "Service developer",
      roleVerksamhetDesc: "Your department's projects and what's missing for the best possible match.",
      sectionTopMatches: "Strongest matches right now",
      sectionStatusBreakdown: "Projects by status",
      sectionUpcomingDeadlines: "Nearest deadlines",
      sectionDocumentsNeedingUpdate: "Documents needing a review",
      sectionYourProjects: "Projects",
      departmentFilterLabel: "Department",
      allDepartments: "All departments",
      noDocumentsNeedingUpdate: "No documents need a review right now.",
      noProjectsInDepartment: "No projects in this department yet.",
      fieldsMissingForBestMatch: (n) => `${n} fields missing for the best match`,
      describeNewProject: "Describe a new project",
      viewAllInPortfolio: "See the full project bank →",
      viewAllInBevakning: "See all monitoring →",
      ongoingApplicationsTitle: "Ongoing applications",
      ongoingApplicationsHint: "Jump straight back into an application you've already started writing.",
      ongoingApplicationsNone: "No ongoing applications right now — they'll show up here as soon as you start writing in the Application workspace.",
      ongoingApplicationsResume: "Resume →",
      ongoingApplicationsUpdatedAt: (date) => `Last edited ${date}`,
      ongoingApplicationsVersions: (n) => (n === 1 ? "1 saved version" : `${n} saved versions`),
    },
  },
};

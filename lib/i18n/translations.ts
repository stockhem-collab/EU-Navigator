import { ApplicationStatus, Lang } from "@/lib/types";

export interface TranslationTree {
  confirm: {
    yesRemove: string;
    yesReset: string;
    yesRestore: string;
    yesLeave: string;
    yesCreate: string;
    yesRegister: string;
    cancel: string;
  };
  login: {
    title: string;
    subtitle: string;
    email: string;
    password: string;
    remember: string;
    submit: string;
    submitting: string;
    errorInvalid: string;
    errorNotConfigured: string;
    errorGeneric: string;
    logout: string;
    loggedInAs: (email: string) => string;
  };
  nav: {
    home: string;
    workflow: string;
    personas: string;
    pricing: string;
    demo: string;
    projects: string;
    apply: string;
    report: string;
    knowledgeBank: string;
    euDatabase: string;
    referenceProjects: string;
    datacenter: string;
    overview: string;
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
    quickLinksTitle: string;
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
      fieldActivityType: string;
      activityTypePlaceholder: string;
      activityTypeHint: string;
      fieldSecondarySectors: string;
      fieldTargetGroups: string;
      targetGroupsHint: string;
      fieldRequestedGrant: string;
      requestedGrantHint: string;
      requestedGrantOverBudget: string;
      fieldRegion: string;
      regionPlaceholder: string;
      fieldApplicantType: string;
      applicantTypeFromProfile: string;
      applicantTypeDefault: string;
      fieldTags: string;
      tagsHint: string;
      tagsSuggestedLabel: string;
      tagsAddAllLabel: string;
      tagsAddNewPlaceholder: string;
      tagsAddNewButton: string;
      tagsNudge: (n: number) => string;
      tagsNudgeButton: string;
      submit: string;
      fillExample: string;
      prefilledFromBank: string;
      existingProjectTitle: string;
      existingProjectHint: string;
      existingProjectPlaceholder: string;
      existingProjectGo: string;
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
      viewCallDetails: string;
      viewCallDetailsHint: string;
      recommendationProceed: string;
      recommendationConsider: string;
      recommendationLow: string;
      startApplication: string;
      back: string;
      monthsSuffix: string;
      recommendedSectionTitle: string;
      lowRelevanceSectionTitle: (n: number) => string;
      showLowRelevanceButton: (n: number) => string;
      hideLowRelevanceButton: string;
      noRecommendedMatches: string;
    };
    workspace: {
      back: string;
      title: string;
      logicTitle: string;
      logicHint: string;
      resetField: string;
      confirmResetField: string;
      fieldSourceTemplate: string;
      fieldSourceEdited: string;
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
      confirmLeaveUnsavedDraft: string;
      saveAsNewProjectButton: string;
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
      confirmRestoreVersion: (name: string) => string;
      exportVersionButton: string;
      deleteVersionButton: string;
      confirmDeleteVersion: (name: string) => string;
      versionSavedAt: (date: string) => string;
      backToPrevious: string;
      estEuShareNote: string;
      notAssessedNote: string;
      signalQuantified: string;
      signalIndicator: string;
      signalBaseline: string;
      signalHorizontal: string;
      sectionMissing: (dimension: string) => string;
      goToSection: (section: string) => string;
      changeSinceOpened: (delta: number) => string;
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
      lowConfidenceNote: string;
      requestAiReviewButton: string;
      requestAiReviewDisabledReason: string;
      requestAiReviewComingSoonBadge: string;
    };
  };
  projectBank: {
    title: string;
    subtitle: string;
    lifecycleTitle: string;
    lifecycleProject: string;
    lifecycleApplications: string;
    lifecycleGrants: string;
    lifecycleReporting: string;
    lifecycleApplicationsSummary: (active: number, closed: number, awarded: number) => string;
    lifecycleGrantsSummary: (n: number) => string;
    lifecycleNone: string;
    grantsSectionTitle: string;
    grantsSectionHint: string;
    grantsNone: string;
    columnApplications: string;
    applicationsSummary: (active: number, awarded: number) => string;
    searchPlaceholder: string;
    noProjectsMatch: string;
    columnTitle: string;
    columnDepartment: string;
    columnStatus: string;
    columnCost: string;
    columnPeriod: string;
    columnReadiness: string;
    readinessAgainst: (callTitle: string) => string;
    columnBestMatch: string;
    statTotal: string;
    statAvgMatch: string;
    statProceedReady: string;
    statusLabels: Record<
      "idea" | "assessing" | "funding-search" | "funded" | "running" | "completed",
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
    peopleAndSharingTitle: string;
    assignedRolesTitle: string;
    noAssignedRoles: string;
    shareTitle: string;
    shareHint: string;
    tasksTitle: string;
    tasksHint: string;
    taskAddPlaceholder: string;
    taskDueDateLabel: string;
    taskAddButton: string;
    noTasks: string;
    taskEditLabel: string;
    taskSaveButton: string;
    taskCancelButton: string;
    taskRemoveLabel: string;
    taskDueLabel: (date: string) => string;
    attachmentsTitle: string;
    attachmentsHint: string;
    attachmentUploadButton: string;
    noAttachments: string;
    attachmentTooLarge: (maxMB: number) => string;
    attachmentRemoveLabel: string;
    confirmRemoveAttachment: (fileName: string) => string;
    attachmentUploadedAt: (date: string) => string;
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
    confirmRemoveProject: (title: string) => string;
    confirmClearImported: string;
    deletedProjectsTitle: string;
    deletedProjectsHint: string;
    restoreProjectButton: string;
    economicsTitle: string;
    statPortfolioBudget: string;
    statFundingPotential: string;
    statCoFinancingNeed: string;
    linkedAwardedProjectLabel: string;
    linkedAwardedProjectLink: string;
    markAsAwardedButton: string;
    markAsAwardedHint: string;
    confirmMarkAsAwarded: string;
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
    fundingRateLabel: (pct: number) => string;
    eligibleApplicantsTitle: string;
    activityTypesLabel: string;
    targetGroupsLabel: string;
    eligibleRegionsLabel: string;
    minPartnerCountriesLabel: (n: number) => string;
    prioritiesTitle: string;
    evaluationCriteriaTitle: string;
    documentsTitle: string;
    documentNeedsUpdate: string;
    documentUpdated: (date: string) => string;
    reportingRequirementsHint: string;
    searchProgramsPlaceholder: string;
    noProgramsMatch: string;
    searchCallsPlaceholder: string;
    noCallsMatch: string;
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
    startApplicationCta: string;
    searchPlaceholder: string;
    noProjectsMatch: string;
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
    portfolioTitle: string;
    portfolioHint: string;
    applicationsByStatusTitle: string;
    grantsTotalLabel: string;
    grantsCountLabel: string;
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
    statUpcomingReports: string;
    statReportsNeedingRevision: string;
    statStructuredEligibility: string;
    documentsNeedingUpdateTitle: string;
    incompleteProjectsTitle: string;
    incompleteProjectsBody: string;
    viewCallLink: string;
    fieldsMissing: (n: number) => string;
    openLink: string;
    importCallButton: string;
    reportingAttentionTitle: string;
    reportingAttentionBody: string;
    noReportingAttention: string;
    viewProjectLink: string;
  };
  callImport: {
    title: string;
    subtitle: string;
    back: string;
    pasteLabel: string;
    pastePlaceholder: string;
    parseButton: string;
    parsedNote: string;
    detectedBadge: string;
    defaultBadge: string;
    fieldProgram: string;
    fieldTitleSv: string;
    fieldTitleEn: string;
    fieldStatus: string;
    statusOpen: string;
    statusUpcoming: string;
    fieldDeadline: string;
    fieldDeadlineHint: string;
    fieldBudget: string;
    fieldMinGrant: string;
    fieldMaxGrant: string;
    fieldPartnership: string;
    fieldEligibleSv: string;
    fieldEligibleEn: string;
    fieldApplicantTypes: string;
    fieldActivityTypes: string;
    fieldTargetGroups: string;
    fieldTargetGroupsHint: string;
    fieldEligibleRegions: string;
    fieldEligibleRegionsHint: string;
    fieldMinPartnerCountries: string;
    fieldCoFinancing: string;
    fieldCoFinancingHint: (programmePct: number | null) => string;
    fieldCriteria: string;
    fieldCriteriaHint: string;
    criterionNamePlaceholder: string;
    criterionPointsLabel: string;
    addCriterion: string;
    removeCriterion: string;
    completenessTitle: string;
    completenessIntro: string;
    completenessAllGood: string;
    missingApplicantTypes: string;
    missingActivityTypes: string;
    missingCriteria: string;
    missingTags: string;
    missingGrantRange: string;
    missingDeadline: string;
    deadlinePassed: string;
    fieldPriorities: string;
    fieldPrioritiesHint: string;
    fieldPrioritiesSv: string;
    fieldPrioritiesEn: string;
    criterionNameEnPlaceholder: string;
    fieldTags: string;
    noTagsWarning: string;
    fieldPeriodicity: string;
    fieldInterimReports: string;
    fieldAuditThreshold: string;
    noAuditThreshold: string;
    saveButton: string;
    requiredFieldsError: string;
    importedListTitle: string;
    noImportedCalls: string;
    removeButton: string;
    confirmRemoveImportedCall: (title: string) => string;
    provenanceAssisted: string;
    provenanceManual: string;
    importedAtLabel: (date: string) => string;
  };
  grants: {
    title: string;
    subtitle: string;
    nextReportDue: (months: number) => string;
    nextReportDueLabel: string;
    awardedAmount: string;
    commitmentsTitle: string;
    promised: string;
    reported: string;
    noLatestOutcome: string;
    back: string;
    statusFilterAll: string;
    noProjectsForStatus: string;
    onlyMineAndSharedToggle: string;
    reportingRequirementsTitle: string;
    periodicityLabel: string;
    periodicityQuarterly: string;
    periodicityBiannual: string;
    periodicityAnnual: string;
    interimReportsRequiredLabel: (n: number) => string;
    auditRequiredAboveLabel: string;
    interimDocumentsLabel: string;
    finalReportDocumentsLabel: string;
    viewReportingInstructionsLink: string;
    reportingTimelineTitle: string;
    reportingTimelineHint: string;
    reportTypeInterim: string;
    reportTypeFinal: string;
    reportStatusUpcoming: string;
    reportStatusSubmitted: string;
    reportStatusApproved: string;
    reportStatusRevisionRequested: string;
    reportStatusEditLabel: string;
    reportDueInMonths: (n: number) => string;
    reportOverdueBy: (n: number) => string;
    noOutcomesYet: string;
    reportNoteLabel: string;
    reportFormTitle: string;
    reportFormNoteLabel: string;
    reportFormNotePlaceholder: string;
    reportFormSubmitButton: string;
    reportFormCorrectButton: string;
    reportSubmittedIndicator: string;
    reportingCompleteLabel: string;
    reportTypeSustainability: string;
    reportHistoryToggle: (n: number) => string;
    reportHistoryEntryLabel: (date: string) => string;
    reportHistoryOriginalLabel: string;
    trendChartTitle: string;
    trendChartTarget: string;
    exportReportButton: string;
    reportAttachmentsLabel: string;
    reportAttachmentUploadButton: string;
    reportAttachmentRemoveLabel: string;
    confirmRemoveReportAttachment: (fileName: string) => string;
    reportAttachmentTooLarge: (maxMB: number) => string;
    addSustainabilityButton: string;
    addSustainabilityHint: string;
    healthGoodLabel: string;
    healthAttentionLabel: string;
    healthBlockedLabel: string;
    linkedProjectBankLabel: string;
    euProjectName: (name: string) => string;
    linkedApplicationLabel: string;
    openApplicationLink: string;
    linkedProjectStatusAutoSyncNote: string;
    financialSummaryTitle: string;
    financialSpentLabel: string;
    financialRemainingLabel: string;
    financialHistoryTitle: string;
    reportFormFinancialLabel: string;
    reportFinancialLine: (amount: string) => string;
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
    reportingWatchTitle: string;
    reportingWatchHint: string;
    noReportingWatched: string;
    portfolioMatchSectionTitle: string;
    otherCallsSectionTitle: (n: number) => string;
    showOtherCallsButton: (n: number) => string;
    hideOtherCallsButton: string;
    noPortfolioMatches: string;
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
    resetAll: string;
    confirmResetAll: string;
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
    savedIndicator: string;
    resetAll: string;
    confirmResetAll: string;
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
    confirmResetAll: string;
  };
  oversikt: {
    title: string;
    subtitle: string;
    statActiveApplications: string;
    statReportsAttention: string;
    statReportsUpcoming: string;
    statOpenTasks: string;
    statUnread: string;
    myApplicationsTitle: string;
    myApplicationsNone: string;
    viewAllApplications: string;
    myReportsTitle: string;
    myReportsNone: string;
    viewAllReports: string;
    latestNotificationsTitle: string;
    latestNotificationsNone: string;
    sectionStatusBreakdown: string;
    describeNewProject: string;
    ongoingApplicationsResume: string;
    ongoingApplicationsUpdatedAt: (date: string) => string;
    ongoingApplicationsVersions: (n: number) => string;
    currentTasksTitle: string;
    currentTasksHint: string;
    currentTasksNone: string;
    currentTasksViewAll: string;
  };
  applications: {
    statusLabels: Record<ApplicationStatus, string>;
    sectionTitle: string;
    sectionHint: string;
    none: string;
    statusLabel: string;
    resume: string;
    open: string;
    deleteButton: string;
    confirmDelete: string;
    createAwardedButton: string;
    confirmCreateAwarded: string;
    viewAwardedLink: string;
    updatedAt: (date: string) => string;
    roundLabel: (n: number) => string;
    continueApplication: string;
    workspaceStatusLabel: string;
    newApplicationButton: string;
    confirmNewApplication: string;
    allApplicationsLink: string;
    otherApplicationsNote: (n: number) => string;
  };
  apply: {
    title: string;
    subtitle: string;
    myApplicationsTitle: string;
    filterActive: string;
    filterDecided: string;
    filterAll: string;
    statActive: string;
    statWithFunder: string;
    statAwarded: string;
    statClosed: string;
    columnProjectCall: string;
    columnStatus: string;
    columnDeadline: string;
    columnUpdated: string;
    noApplications: string;
    noApplicationsHint: string;
    registerGrant: string;
    findFundingTitle: string;
    browseEuDatabase: string;
  };
  report: {
    title: string;
    subtitle: string;
    statAttention: string;
    statUpcoming: string;
    statDone: string;
    statGrants: string;
    attentionTitle: string;
    attentionHint: string;
    upcomingTitle: string;
    doneTitle: (n: number) => string;
    showDone: (n: number) => string;
    hideDone: string;
    noAttention: string;
    noUpcoming: string;
    noGrants: string;
    grantsTitle: string;
    grantsHint: string;
    euProjectName: (name: string) => string;
    open: string;
    overdueLabel: (n: number) => string;
  };
  notifications: {
    title: string;
    bellLabel: (unread: number) => string;
    markAllRead: string;
    none: string;
    settingsLink: string;
    unreadMarker: (n: number) => string;
    categoryLabels: Record<"deadlines" | "calls" | "applications" | "reporting" | "projects" | "system", string>;
    categoryHints: Record<"deadlines" | "calls" | "applications" | "reporting" | "projects" | "system", string>;
    settingsTitle: string;
    settingsIntro: string;
    columnCategory: string;
    columnInApp: string;
    columnEmail: string;
    emailModes: Record<"off" | "instant" | "daily" | "weekly", string>;
    emailNote: string;
    scopeTitle: string;
    scopeMine: string;
    scopeAll: string;
    leadTitle: string;
    leadOption: (n: number) => string;
    resetDefaults: string;
    watchTitle: string;
    watchIntro: string;
  };
}

export const translations: Record<Lang, TranslationTree> = {
  sv: {
    confirm: {
      yesRemove: "Ja, ta bort",
      yesReset: "Ja, återställ",
      yesRestore: "Ja, återställ versionen",
      yesLeave: "Ja, lämna utan att spara",
      yesCreate: "Ja, skapa",
      yesRegister: "Ja, registrera",
      cancel: "Avbryt",
    },
    login: {
      title: "Logga in",
      subtitle: "Logga in för att komma till systemet. Lösenordet får du av din EU-samordnare.",
      email: "E-post",
      password: "Lösenord",
      remember: "Kom ihåg mig i 30 dagar",
      submit: "Logga in",
      submitting: "Loggar in…",
      errorInvalid: "Fel e-post eller lösenord.",
      errorNotConfigured: "Inloggningen är inte konfigurerad — lösenordet (DEMO_PASSWORD) saknas i driftmiljön.",
      errorGeneric: "Något gick fel. Försök igen.",
      logout: "Logga ut",
      loggedInAs: (email) => `Inloggad som ${email}`,
    },
    nav: {
      home: "Hem",
      workflow: "Så fungerar det",
      personas: "För vem",
      pricing: "Prismodell",
      demo: "Ny ansökan",
      projects: "Projekt",
      apply: "Ansöka",
      report: "Rapportera",
      knowledgeBank: "Kunskapsbank",
      euDatabase: "EU-databas",
      referenceProjects: "Referensprojekt",
      datacenter: "Datacenter",
      overview: "Översikt",
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
      quickLinksTitle: "Alla delar av systemet",
    },
    hero: {
      eyebrow: "Kommunens operativsystem för extern finansiering",
      title: "Från kommunens behov till finansierat projekt",
      subtitle:
        "EU Navigator kopplar samman kommunens investeringsplaner med EU:s finansieringsmöjligheter — automatiskt, kontinuerligt och med AI-driven matchning och ansökningsstöd.",
      ctaPrimary: "Starta ansökan",
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
      subtitle: "Beskriv ett eget projekt och se matchande utlysningar — ingen inloggning krävs.",
      button: "Starta ansökan",
    },
    footer: {
      disclaimer:
        "Demo med illustrativa exempeldata. Matchning baseras på en transparent poängmodell, inte live-data från EU:s system. Se EU:s Funding & Tenders Portal för aktuella utlysningar.",
      rights: "EU Navigator — koncept och demo.",
    },
    demo: {
      intake: {
        title: "Ny ansökan – beskriv projektet",
        subtitle:
          "Beskriv projektet ni vill söka finansiering för, så matchas det mot EU-utlysningarna. Fyll i så mycket ni kan — matchningen blir bättre ju mer konkret beskrivningen är.",
        fieldTitle: "Projektnamn",
        fieldTitlePlaceholder: "T.ex. Energieffektivisering av 14 skolor",
        fieldDescription: "Beskrivning",
        fieldDescriptionPlaceholder:
          "Beskriv vad ni vill genomföra, varför, och vilka aktiviteter som ingår (t.ex. solceller, styrsystem, ventilation, energilagring)...",
        fieldSector: "Huvudsakligt område",
        fieldBudget: "Total projektbudget (kr)",
        fieldStartYear: "Startår",
        fieldEndYear: "Slutår",
        fieldMunicipality: "Kommun/organisation",
        fieldMunicipalityPlaceholder: "T.ex. Exempelstad kommun",
        fieldPartnership: "Partnerskap (befintligt eller möjligt att skaffa)",
        fieldActivityType: "Typ av insats",
        activityTypePlaceholder: "Välj typ av insats…",
        activityTypeHint: "Avgör vilka program som passar – t.ex. finansierar ERUF investeringar, ESF+ kompetensinsatser och Horisont Europa forskning.",
        fieldSecondarySectors: "Övriga områden som projektet berör (valfritt)",
        fieldTargetGroups: "Målgrupp (valfritt)",
        targetGroupsHint: "Ange om projektet riktar sig till specifika personer – avgörande för bl.a. ESF+ och Erasmus+.",
        fieldRequestedGrant: "Sökt EU-bidrag (kr, valfritt)",
        requestedGrantHint: "Lämna tomt så uppskattas bidraget utifrån programmets typiska stödnivå.",
        requestedGrantOverBudget: "Sökt bidrag kan inte vara större än totalbudgeten.",
        fieldRegion: "Län där projektet genomförs",
        regionPlaceholder: "Välj län…",
        fieldApplicantType: "Sökande organisationstyp",
        applicantTypeFromProfile: "Hämtat från organisationsprofilen. Styr vilka utlysningar ni är behöriga att söka.",
        applicantTypeDefault: "Styr vilka utlysningar ni är behöriga att söka. Ange typen i organisationsprofilen så fylls den i automatiskt.",
        fieldTags: "Taggar (för säkrare matchning)",
        tagsHint: "Välj de taggar som beskriver projektet — taggar matchas exakt mot utlysningarnas teman och missar inte synonymer på samma sätt som fritextsökning.",
        tagsSuggestedLabel: "Förslag baserat på beskrivningen:",
        tagsAddAllLabel: "Lägg till alla",
        tagsAddNewPlaceholder: "Ny tagg som saknas…",
        tagsAddNewButton: "Lägg till ny tagg",
        tagsNudge: (n) =>
          `Inga taggar valda. Taggarna väger tungt i matchningen – ${n} ${n === 1 ? "tagg föreslås" : "taggar föreslås"} utifrån beskrivningen.`,
        tagsNudgeButton: "Lägg till föreslagna",
        submit: "Hitta finansieringsmöjligheter",
        fillExample: "Fyll i exempel",
        prefilledFromBank: "Förifyllt från projektet — granska och komplettera innan ni fortsätter.",
        existingProjectTitle: "Finns projektet redan?",
        existingProjectHint: "Välj det så slipper du beskriva det igen. Projektsidan visar vilka utlysningar det matchar, var och en med Starta ansökan.",
        existingProjectPlaceholder: "Välj ett befintligt projekt",
        existingProjectGo: "Till projektets matchningar",
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
        viewCallDetails: "Läs mer om utlysningen",
        viewCallDetailsHint: "Öppnas i en ny flik",
        recommendationProceed: "GÅ VIDARE",
        recommendationConsider: "ÖVERVÄG",
        recommendationLow: "LÅG PRIORITET",
        startApplication: "Starta ansökan",
        back: "Ändra projekt",
        monthsSuffix: "månader",
        recommendedSectionTitle: "Rekommenderade matchningar",
        lowRelevanceSectionTitle: (n) => `Lägre matchning (${n})`,
        showLowRelevanceButton: (n) => `Visa fler / lägre matchning (${n})`,
        hideLowRelevanceButton: "Dölj lägre matchning",
        noRecommendedMatches:
          "Inga starka matchningar hittades. Här är samtliga utlysningar ändå, sorterade efter relevans.",
      },
      workspace: {
        back: "Tillbaka till matchningar",
        title: "AI-stödd ansökningsyta",
        logicTitle: "Projektlogik",
        logicHint: "AI-genererat förslag — redigera direkt i fälten nedan.",
        resetField: "Återställ AI-förslag",
        confirmResetField: "Återställa till AI-förslaget? Din redigerade text i det här fältet går förlorad.",
        fieldSourceTemplate: "Mallförslag",
        fieldSourceEdited: "Redigerat av dig",
        reviewerTitle: "AI-granskning",
        reviewerSubtitle: "Kontrollpunkter innan ansökan lämnas in",
        budgetTitle: "Budget & medfinansiering",
        totalBudget: "Total projektbudget",
        estEuShare: "Beräknat EU-bidrag",
        coFinancing: "Kommunal medfinansiering (uppskattad)",
        nextStepsTitle: "Nästa steg",
        tabApplication: "Ansökan",
        tabAssessment: "Bedömning",
        tabProcess: "Process & granskning",
        topPriorityLabel: "Viktigast att åtgärda",
        topPriorityNone: "Inga akuta åtgärder — ansökan ser stark ut.",
        draftSavedNote: "Utkastet sparas automatiskt i din webbläsare.",
        draftNotSavedNote:
          "Ansökan är inte sparad. När du sparar den skapas också projektet under Projekt, så att ansökan och projektet hör ihop.",
        confirmLeaveUnsavedDraft:
          "Den här ansökan är inte sparad — går du tillbaka nu försvinner det du skrivit. Fortsätt ändå?",
        saveAsNewProjectButton: "Spara ansökan",
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
        confirmRestoreVersion: (name) =>
          `Återställa till versionen "${name}"? Alla ändringar i det nuvarande utkastet som inte sparats som en version går förlorade.`,
        exportVersionButton: "Exportera (.docx)",
        deleteVersionButton: "Ta bort",
        confirmDeleteVersion: (name) => `Ta bort versionen "${name}"? Det går inte att ångra.`,
        versionSavedAt: (date) => `Sparad ${date}`,
        backToPrevious: "Tillbaka",
        estEuShareNote: "Samma belopp som i matchningen: sökt belopp, eller utlysningens stödnivå av budgeten, högst utlysningens maxbelopp.",
        notAssessedNote: "Förslag — räknas in i bedömningen när du har skrivit eller redigerat texten.",
        signalQuantified: "Kvantifierad effekt",
        signalIndicator: "Indikator",
        signalBaseline: "Utgångsvärde",
        signalHorizontal: "Horisontella principer",
        sectionMissing: (dimension) => `Saknas: ${dimension}`,
        goToSection: (section) => `Gå till ${section}`,
        changeSinceOpened: (delta) => `${delta > 0 ? "↑ +" : "↓ "}${delta} sedan du öppnade ansökan`,
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
        noGaps: "Inga gap i matchningen mot utlysningen. Det som återstår i själva texten står under Ansökningsberedskap ovan.",
      },
      readiness: {
        title: "Ansökningsberedskap",
        disclaimer:
          "Detta är inte en förutsägelse om EU:s beslut, utan AI:ns bedömning av hur väl ansökan möter dokumenterade krav och bedömningskriterier.",
        overallLabel: "Total poäng",
        recommendedActions: "Rekommenderade åtgärder före inlämning",
      },
      coach: {
        title: "Application Coach",
        subtitle: "Granskning av ansökans text — projektbeskrivningen och de avsnitt du har skrivit — mot just denna utlysnings krav",
        relevance: "Relevans",
        impact: "Impact",
        evidence: "Evidence",
        suggestionLabel: "Föreslagen komplettering",
        lowConfidenceNote:
          "Texten är för kort eller saknar tydliga mönster — regelmotorns bedömning ovan är därför ospecifik. Det här är precis den situation där en riktig AI-granskning (inte aktiverad i denna demo) skulle tillföra mest.",
        requestAiReviewButton: "Begär AI-bedömning",
        requestAiReviewDisabledReason: "Kräver en AI-tjänst kopplad till systemet — inte aktiverad i denna demo.",
        requestAiReviewComingSoonBadge: "Kommande funktion",
      },
    },
    projectBank: {
      title: "Projekt",
      subtitle:
        "Verksamhetens projekt – idéer, behov och planerade investeringar. Varje projekt samlar sina ansökningar, beviljade stöd och rapporter.",
      columnApplications: "Ansökningar och rapportering",
      applicationsSummary: (active, awarded) =>
        [active > 0 ? `${active} pågående` : "", awarded > 0 ? `${awarded} beviljad${awarded > 1 ? "e" : ""}` : ""]
          .filter(Boolean)
          .join(" · "),
      searchPlaceholder: "Sök bland projekten…",
      noProjectsMatch: "Inga projekt matchar filtret.",
      columnTitle: "Projekt",
      columnDepartment: "Förvaltning",
      columnStatus: "Status",
      columnCost: "Uppskattad kostnad",
      columnPeriod: "Period",
      columnReadiness: "Ansökningsberedskap",
      readinessAgainst: (callTitle) => `Mot bästa matchning: ${callTitle}`,
      columnBestMatch: "Bästa matchning",
      statTotal: "Projekt i portföljen",
      statAvgMatch: "Genomsnittlig bästa matchning",
      statProceedReady: "Redo att gå vidare",
      statusLabels: {
        idea: "Idé",
        assessing: "Under utredning",
        "funding-search": "Söker finansiering",
        funded: "Finansierat",
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
      peopleAndSharingTitle: "Vem ser och äger projektet",
      assignedRolesTitle: "Tilldelade roller",
      noAssignedRoles: "Ingen har tilldelats en roll för detta projekt ännu.",
      shareTitle: "Dela projekt",
      shareHint: "Gör projektet synligt för fler än de som har en tilldelad roll — för hela organisationen eller en specifik förvaltning. Den som projektet delas med får en avisering.",
      tasksTitle: "Uppgifter",
      tasksHint: "Konkreta att-göra-punkter för just detta projekt, oavsett fas.",
      taskAddPlaceholder: "Ny uppgift, t.ex. \"Boka avstämning med ekonomi\"",
      taskDueDateLabel: "Förfaller",
      taskAddButton: "Lägg till uppgift",
      noTasks: "Inga uppgifter tillagda än.",
      taskEditLabel: "Redigera",
      taskSaveButton: "Spara",
      taskCancelButton: "Avbryt",
      taskRemoveLabel: "Ta bort",
      taskDueLabel: (date) => `Förfaller ${date}`,
      attachmentsTitle: "Bilagor",
      attachmentsHint: "Spara ned underlag som hör till projektet, t.ex. budget, avsiktsförklaring eller tidigare beslut.",
      attachmentUploadButton: "Ladda upp bilaga",
      noAttachments: "Inga bilagor sparade än.",
      attachmentTooLarge: (maxMB) => `Filen är för stor — max ${maxMB} MB per bilaga i den här demoversionen.`,
      attachmentRemoveLabel: "Ta bort",
      confirmRemoveAttachment: (fileName) => `Ta bort bilagan "${fileName}"? Filen försvinner ur systemet.`,
      attachmentUploadedAt: (date) => `Uppladdad ${date}`,
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
      back: "Tillbaka till Projekt",
      lifecycleTitle: "Projektets väg",
      lifecycleProject: "Projekt",
      lifecycleApplications: "Ansökningar",
      lifecycleGrants: "Beviljat stöd",
      lifecycleReporting: "Rapportering",
      lifecycleApplicationsSummary: (active, closed, awarded) =>
        [active > 0 ? `${active} pågående` : "", awarded > 0 ? `${awarded} beviljad${awarded > 1 ? "e" : ""}` : "", closed > 0 ? `${closed} avslutad${closed > 1 ? "e" : ""} utan stöd` : ""]
          .filter(Boolean)
          .join(" · "),
      lifecycleGrantsSummary: (n) => `${n} beviljat stöd`,
      lifecycleNone: "Inget ännu",
      grantsSectionTitle: "Beviljat stöd och rapportering",
      grantsSectionHint: "Varje beviljad ansökan får ett eget beviljat stöd med egen rapportering. Rapporterna hanteras under Rapportera.",
      grantsNone: "Inget beviljat stöd ännu. När en ansökan beviljas registrerar du stödet på ansökan ovan.",
      importButton: "Importera projekt (CSV)",
      downloadTemplate: "Ladda ner mall",
      importHint:
        "Kolumner: Titel, Förvaltning, Ägare, Budget, Startår, Slutår, Sektor, Beskrivning, Internationell partner. Sparas i din webbläsare (ingen delning mellan användare i den här demon).",
      clearImported: "Rensa importerade projekt",
      removeImportedRow: "Ta bort importerat projekt",
      confirmRemoveProject: (title) => `Ta bort projektet "${title}"? Det kan återställas senare under "Borttagna projekt".`,
      confirmClearImported: "Ta bort alla importerade projekt? De kan återställas senare under \"Borttagna projekt\".",
      deletedProjectsTitle: "Borttagna projekt",
      deletedProjectsHint: "Sparas här tills du återställer dem.",
      restoreProjectButton: "Återställ",
      economicsTitle: "Portföljekonomi",
      statPortfolioBudget: "Total portföljbudget",
      statFundingPotential: "Identifierad EU-finansieringspotential",
      statCoFinancingNeed: "Uppskattat medfinansieringsbehov",
      linkedAwardedProjectLabel: "Har beviljat stöd under rapportering",
      linkedAwardedProjectLink: "Visa rapportering →",
      markAsAwardedButton: "Markera som beviljad",
      markAsAwardedHint: "Skapar rapporteringsspårning för projektet baserat på bäst matchande utlysning.",
      confirmMarkAsAwarded:
        "Markera som beviljad? Detta registrerar ett beviljat stöd med egen rapportering. Det går inte att ångra.",
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
      deadlineIn: (m) => (m < 0 ? "Deadline har passerat" : `Deadline om ${m} månader`),
      budgetLabel: "Utlysningens totala budget",
      grantRangeLabel: "Bidragsstorlek",
      fundingRateLabel: (pct) => `Stödnivå upp till ${pct} %`,
      eligibleApplicantsTitle: "Behöriga sökande",
      activityTypesLabel: "Finansierar",
      targetGroupsLabel: "Målgrupper",
      eligibleRegionsLabel: "Programområde",
      minPartnerCountriesLabel: (n) => `Kräver partner från minst ${n} länder.`,
      prioritiesTitle: "Prioriteringar",
      evaluationCriteriaTitle: "Bedömningskriterier",
      documentsTitle: "Dokument (AI-kontextpaket)",
      documentNeedsUpdate: "Behöver uppdateras",
      documentUpdated: (date) => `Uppdaterad ${date}`,
      reportingRequirementsHint: "Vad rapporteringen kommer innebära om ni beviljas medel för den här utlysningen.",
      searchProgramsPlaceholder: "Sök program…",
      noProgramsMatch: "Inga program matchar sökningen.",
      searchCallsPlaceholder: "Sök utlysningar…",
      noCallsMatch: "Inga utlysningar matchar sökningen.",
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
      startApplicationCta: "Har du ett liknande projekt? Starta en ansökan →",
      searchPlaceholder: "Sök bland projekten…",
      noProjectsMatch: "Inga projekt matchar din sökning.",
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
      portfolioTitle: "Portfölj",
      portfolioHint: "Ledningens bild av hela investeringsplanen: ekonomi, projekt per status, ansökningar och beviljat stöd.",
      applicationsByStatusTitle: "Ansökningar per status",
      grantsTotalLabel: "Beviljat totalt",
      grantsCountLabel: "Beviljade stöd",
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
      statUpcomingReports: "Kommande rapporteringar",
      statReportsNeedingRevision: "Rapporter som kräver komplettering",
      statStructuredEligibility: "Utlysningar med strukturerad behörighet",
      documentsNeedingUpdateTitle: "Dokument som behöver uppdateras",
      incompleteProjectsTitle: "Projekt med ofullständig information",
      incompleteProjectsBody:
        "Dessa projekt saknar information som krävs för en tillförlitlig EU-matchning.",
      viewCallLink: "Visa utlysning →",
      fieldsMissing: (n) => `${n} fält saknas`,
      openLink: "Öppna →",
      importCallButton: "Importera ny utlysning",
      reportingAttentionTitle: "Rapporteringar som kräver uppmärksamhet",
      reportingAttentionBody: "Kommande rapporter och rapporter som skickats tillbaka för komplettering, i ett och samma flöde.",
      noReportingAttention: "Inga rapporter kräver uppmärksamhet just nu.",
      viewProjectLink: "Visa beviljat stöd →",
    },
    callImport: {
      title: "Importera ny utlysning",
      subtitle:
        "Klistra in utlysningstexten. Ett regelbaserat förslag (inte en AI-tjänst — se resonemanget om att minska AI-beroendet) föreslår fält att fylla i, men inget sparas förrän du har granskat och godkänt varje fält.",
      back: "Tillbaka till Datacenter",
      pasteLabel: "Utlysningstext",
      pastePlaceholder: "Klistra in hela eller delar av utlysningstexten här…",
      parseButton: "Tolka texten",
      parsedNote: "Förslag inläst nedan — kontrollera särskilt de fält som är märkta \"Standardvärde\".",
      detectedBadge: "Hittat i texten",
      defaultBadge: "Standardvärde — kontrollera",
      fieldProgram: "Program/fond",
      fieldTitleSv: "Titel (svenska)",
      fieldTitleEn: "Titel (engelska)",
      fieldStatus: "Status",
      statusOpen: "Öppen",
      statusUpcoming: "Kommande",
      fieldDeadline: "Sista ansökningsdag",
      fieldDeadlineHint: "Utlysningens faktiska datum — används för att räkna ut tid kvar och om projektets start passar beslutet.",
      fieldBudget: "Total budget (SEK)",
      fieldMinGrant: "Lägsta bidrag (SEK)",
      fieldMaxGrant: "Högsta bidrag (SEK)",
      fieldPartnership: "Kräver partnerskap/konsortium",
      fieldEligibleSv: "Behöriga sökande (svenska)",
      fieldEligibleEn: "Behöriga sökande (engelska)",
      fieldApplicantTypes: "Sökandekategorier",
      fieldActivityTypes: "Typ av insats som finansieras",
      fieldTargetGroups: "Målgrupper",
      fieldTargetGroupsHint: "Bara för utlysningar som riktar sig till specifika personer (t.ex. ESF+). Lämna tomt annars.",
      fieldEligibleRegions: "Programområde (län)",
      fieldEligibleRegionsHint: "Bara för regionalt avgränsade utlysningar. Lämna tomt om hela Sverige kan söka.",
      fieldMinPartnerCountries: "Minsta antal länder i partnerskapet",
      fieldCoFinancing: "Stödnivå (% av stödberättigande kostnader)",
      fieldCoFinancingHint: (pct) =>
        pct === null
          ? "Lämna tomt för att använda programmets typiska stödnivå."
          : `Lämna tomt för att använda programmets typiska stödnivå (${pct} %).`,
      fieldCriteria: "Bedömningskriterier",
      fieldCriteriaHint: "Styr hur matchningen väger tematisk passform mot genomförbarhet. Utan kriterier används en standardfördelning (60/40). Utan engelskt namn visas det svenska.",
      criterionNamePlaceholder: "Kriterium, t.ex. Relevans",
      criterionPointsLabel: "Poäng",
      addCriterion: "Lägg till kriterium",
      removeCriterion: "Ta bort kriterium",
      completenessTitle: "Underlag för matchning",
      completenessIntro: "Följande saknas. Utlysningen kan sparas ändå, men matchningen blir mindre träffsäker:",
      completenessAllGood: "Allt som matchningen använder är ifyllt.",
      missingApplicantTypes: "Sökandekategorier – behörighet kan inte kontrolleras, bara fritexten visas",
      missingActivityTypes: "Typ av insats – räknas som okänd (halva poängen) för alla projekt",
      missingCriteria: "Bedömningskriterier – standardviktning 60/40 används",
      missingTags: "Taggar – den viktigaste tematiska signalen saknas",
      missingGrantRange: "Bidragsintervall – sökta belopp kan inte jämföras",
      missingDeadline: "Sista ansökningsdag",
      deadlinePassed: "Sista ansökningsdag har redan passerat – utlysningen kommer att visas som stängd i matchningen.",
      fieldPriorities: "Prioriteringar",
      fieldPrioritiesHint: "En prioritering per rad. Lämnas den engelska tom används den svenska texten även på engelska.",
      fieldPrioritiesSv: "Prioriteringar på svenska",
      fieldPrioritiesEn: "Prioriteringar på engelska (valfritt)",
      criterionNameEnPlaceholder: "Engelskt namn (valfritt)",
      fieldTags: "Taggar",
      noTagsWarning: "Utlysningen har inga taggar valda — matchningen mot projekt blir mindre träffsäker utan dem.",
      fieldPeriodicity: "Rapporteringsfrekvens",
      fieldInterimReports: "Antal delrapporter som krävs",
      fieldAuditThreshold: "Revisionsintyg krävs över (SEK, lämna tomt om ej tillämpligt)",
      noAuditThreshold: "Inget krav på revisionsintyg",
      saveButton: "Spara utlysning",
      requiredFieldsError: "Program, titel (båda språk) och en unik utlysnings-id krävs.",
      importedListTitle: "Tidigare importerade utlysningar",
      noImportedCalls: "Inga utlysningar har importerats ännu.",
      removeButton: "Ta bort",
      confirmRemoveImportedCall: (title) => `Ta bort den importerade utlysningen "${title}"?`,
      provenanceAssisted: "Inläst via granskat importflöde",
      provenanceManual: "Manuellt inlagd",
      importedAtLabel: (date) => `Importerad ${date}`,
    },
    grants: {
      title: "Beviljat stöd",
      subtitle: "Beslut om finansiering, med rapportering per period.",
      nextReportDue: (m) => `Nästa rapportering om ${m} månader`,
      nextReportDueLabel: "Nästa rapportering",
      awardedAmount: "Beviljat belopp",
      commitmentsTitle: "Åtaganden från ansökan vs. utfall",
      promised: "Utlovat",
      reported: "Rapporterat",
      noLatestOutcome: "Ej rapporterat än",
      back: "Tillbaka till Rapportera",
      statusFilterAll: "Alla",
      noProjectsForStatus: "Inga projekt med denna status.",
      onlyMineAndSharedToggle: "Visa endast mina och delade projekt",
      reportingRequirementsTitle: "Rapporteringskrav för utlysningen",
      periodicityLabel: "Rapporteringsfrekvens",
      periodicityQuarterly: "Kvartalsvis",
      periodicityBiannual: "Halvårsvis",
      periodicityAnnual: "Årsvis",
      interimReportsRequiredLabel: (n) => `${n} delrapporter krävs innan slutrapport`,
      auditRequiredAboveLabel: "Revisionsintyg krävs för beviljat belopp över",
      interimDocumentsLabel: "Underlag som krävs vid delrapportering",
      finalReportDocumentsLabel: "Underlag som krävs vid slutrapportering",
      viewReportingInstructionsLink: "Se utlysningens rapporteringsanvisningar →",
      reportingTimelineTitle: "Rapporteringstillfällen",
      reportingTimelineHint: "Delrapporter och slutrapport i kronologisk ordning, med utfall per tillfälle.",
      reportTypeInterim: "Delrapport",
      reportTypeFinal: "Slutrapport",
      reportStatusUpcoming: "Kommande",
      reportStatusSubmitted: "Inlämnad",
      reportStatusApproved: "Godkänd",
      reportStatusRevisionRequested: "Komplettering begärd",
      reportStatusEditLabel: "Ändra status för rapporteringstillfället",
      reportDueInMonths: (n) => (n === 0 ? "Förfaller denna månad" : `Förfaller om ${n} ${n === 1 ? "månad" : "månader"}`),
      reportOverdueBy: (n) => (n === 0 ? "Försenad" : `Försenad med ${n} ${n === 1 ? "månad" : "månader"}`),
      noOutcomesYet: "Inget utfall rapporterat ännu.",
      reportNoteLabel: "Kommentar",
      reportFormTitle: "Rapportera utfall",
      reportFormNoteLabel: "Kommentar till rapporten",
      reportFormNotePlaceholder: "Kort kommentar till utfallet, t.ex. avvikelser mot plan.",
      reportFormSubmitButton: "Markera som inlämnad",
      reportFormCorrectButton: "Skicka in korrigering",
      reportSubmittedIndicator: "Sparat i din webbläsare — ersätter inte en faktisk inlämning till finansiären.",
      reportingCompleteLabel: "All rapportering avslutad.",
      reportTypeSustainability: "Hållbarhetsuppföljning",
      reportHistoryToggle: (n) => `Tidigare inlämningar (${n})`,
      reportHistoryEntryLabel: (date) => `Inlämnad ${date}`,
      reportHistoryOriginalLabel: "Ursprunglig rapport",
      trendChartTitle: "Utveckling över tid",
      trendChartTarget: "Mål",
      exportReportButton: "Exportera rapport (.docx)",
      reportAttachmentsLabel: "Bilagor",
      reportAttachmentUploadButton: "+ Ladda upp bilaga",
      reportAttachmentRemoveLabel: "Ta bort",
      confirmRemoveReportAttachment: (fileName) => `Ta bort bilagan "${fileName}"? Filen försvinner ur systemet.`,
      reportAttachmentTooLarge: (maxMB) => `Filen är för stor — max ${maxMB} MB per bilaga i den här demoversionen.`,
      addSustainabilityButton: "Lägg till hållbarhetsuppföljning",
      addSustainabilityHint: "För fonder som kräver uppföljning av resultatens hållbarhet flera år efter projektslut.",
      healthGoodLabel: "Enligt plan",
      healthAttentionLabel: "Kräver uppmärksamhet",
      healthBlockedLabel: "Komplettering begärd",
      linkedProjectBankLabel: "Projekt",
      euProjectName: (name) => `EU-projektets namn: ${name}`,
      linkedApplicationLabel: "Beviljad ansökan",
      openApplicationLink: "Öppna ansökan",
      linkedProjectStatusAutoSyncNote: "Projektets status följer rapporteringen här: genomförs medan rapporteringen pågår, avslutat när den är klar.",
      financialSummaryTitle: "Ekonomisk uppföljning",
      financialSpentLabel: "Förbrukat / beviljat",
      financialRemainingLabel: "Kvarstående budget",
      financialHistoryTitle: "Förbrukning per rapport",
      reportFormFinancialLabel: "Förbrukat denna period (kr, valfritt)",
      reportFinancialLine: (amount) => `Förbrukat denna period: ${amount}`,
    },
    bevakning: {
      title: "Hitta finansiering",
      subtitle: "Öppna och kommande utlysningar, och vilka av organisationens projekt som passar bäst.",
      disclaimer:
        "I en skarp version skulle detta skickas som ett återkommande veckobrev till EU-samordnaren. Här visas samma information direkt i gränssnittet.",
      columnCall: "Utlysning",
      columnDeadline: "Deadline",
      deadlineInMonths: (n) => (n < 0 ? "Deadline passerad" : `Deadline: ${n} mån`),
      matchingProjectsLabel: (n) => `${n} matchande projekt i portföljen`,
      noMatchingProjects: "Inga projekt i portföljen matchar denna utlysning ännu.",
      viewCall: "Visa utlysning",
      startApplication: "Starta ansökan",
      watchedBadge: "★ Bevakad",
      onlyWatchedToggle: "Visa endast mina bevakningar",
      noWatchedCalls: "Inga bevakade utlysningar. Klicka \"Bevaka\" på en utlysning, eller justera dina bevakningar under Inställningar → Bevakningar.",
      watchCallButton: "☆ Bevaka",
      watchingCallButton: "★ Bevakas",
      reportingWatchTitle: "Rapporteringsdeadlines (beviljade projekt)",
      reportingWatchHint:
        "Alla utestående rapporteringstillfällen för redan beviljade projekt, visas automatiskt — inget behöver bevakas för att synas här. Detta är skilt från utlysningarna nedan.",
      noReportingWatched: "Inga utestående rapporteringsdeadlines just nu — alla beviljade projekts rapporter är inskickade.",
      portfolioMatchSectionTitle: "Utlysningar som matchar din portfölj",
      otherCallsSectionTitle: (n) => `Övriga utlysningar (${n})`,
      showOtherCallsButton: (n) => `Visa fler / övriga utlysningar (${n})`,
      hideOtherCallsButton: "Dölj övriga utlysningar",
      noPortfolioMatches:
        "Inga utlysningar matchar din portfölj ännu. Här är samtliga utlysningar ändå, sorterade efter deadline.",
    },
    orgSettings: {
      title: "Organisation",
      subtitle: "Organisationens grunduppgifter och enheter.",
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
      resetAll: "Återställ allt till exempeldata",
      confirmResetAll: "Återställa organisationsuppgifter och enhetsstruktur till exempeldata? Dina egna ändringar går förlorade.",
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
      cardWatchTitle: "Aviseringar & bevakningar",
      cardWatchDesc: "Vad du får aviseringar om, var och när – och vilka utlysningar du bevakar.",
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
      title: "Aviseringar & bevakningar",
      subtitle: "Vad du vill få aviseringar om, och vilka utlysningar, program och ämnesområden du bevakar.",
      back: "← Tillbaka till Inställningar",
      sectorsTitle: "Ämnesområden",
      programsTitle: "EU-program",
      savedIndicator: "Sparat i din webbläsare",
      resetAll: "Återställ bevakningar",
      confirmResetAll: "Återställa alla bevakningar till exempeldata? Dina egna val går förlorade.",
      watchedCallsTitle: "Bevakade utlysningar",
      watchedCallsHint: "Utlysningar du flaggat under Ansöka → Hitta finansiering eller i EU-databasen.",
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
      confirmResetAll: "Återställa hela finansieringsprofilen till exempeldata? Dina egna val går förlorade.",
    },
    oversikt: {
      title: "Översikt",
      subtitle: "Det du behöver göra nu – dina ansökningar, rapporter och uppgifter.",
      statActiveApplications: "Pågående ansökningar",
      statReportsAttention: "Rapporter som kräver åtgärd",
      statReportsUpcoming: "Kommande rapporter",
      statOpenTasks: "Öppna uppgifter",
      statUnread: "Olästa aviseringar",
      myApplicationsTitle: "Ansökningar",
      myApplicationsNone: "Inga pågående ansökningar. Starta en ny, eller hitta en utlysning under Ansöka.",
      viewAllApplications: "Alla ansökningar under Ansöka →",
      myReportsTitle: "Rapportering",
      myReportsNone: "Ingen rapportering att göra just nu.",
      viewAllReports: "All rapportering under Rapportera →",
      latestNotificationsTitle: "Olästa aviseringar",
      latestNotificationsNone: "Inga olästa aviseringar.",
      sectionStatusBreakdown: "Projekt per status",
      describeNewProject: "Ny ansökan",
      ongoingApplicationsResume: "Fortsätt",
      ongoingApplicationsUpdatedAt: (date) => `Senast redigerad ${date}`,
      ongoingApplicationsVersions: (n) => (n === 1 ? "1 sparad version" : `${n} sparade versioner`),
      currentTasksTitle: "Uppgifter",
      currentTasksHint: "Öppna uppgifter i projekten, snarast förfallande först.",
      currentTasksNone: "Inga öppna uppgifter just nu. Lägg till uppgifter på ett projekts sida.",
      currentTasksViewAll: "Visa projekt →",
    },
    applications: {
      statusLabels: {
        draft: "Utkast",
        submitted: "Inskickad",
        "under-review": "Under bedömning",
        awarded: "Beviljad",
        rejected: "Avslag",
        withdrawn: "Återtagen",
      },
      sectionTitle: "Ansökningar",
      sectionHint:
        "Varje ansökan har egen status och eget utkast. Ett projekt kan söka flera utlysningar – och samma utlysning igen i en ny omgång. Projektets status följer ansökningarna.",
      none: "Inga ansökningar påbörjade ännu – starta en från matchningarna nedan.",
      statusLabel: "Status",
      resume: "Fortsätt",
      open: "Öppna",
      deleteButton: "Ta bort",
      confirmDelete: "Ta bort ansökan med dess utkast och sparade versioner?",
      createAwardedButton: "Registrera beviljat stöd",
      confirmCreateAwarded: "Registrera beviljat stöd för den här ansökan? Då skapas rapporteringen för stödet under Rapportera.",
      viewAwardedLink: "Visa beviljat stöd",
      updatedAt: (date) => `Uppdaterad ${date}`,
      roundLabel: (n) => `Ansökan ${n}`,
      continueApplication: "Fortsätt ansökan",
      workspaceStatusLabel: "Ansökans status",
      newApplicationButton: "Ny ansökan till samma utlysning",
      confirmNewApplication:
        "Starta en ny, tom ansökan till samma utlysning? Den nuvarande ansökan finns kvar under projektet.",
      allApplicationsLink: "Alla ansökningar för projektet",
      otherApplicationsNote: (n) => `Projektet har ${n} ${n === 1 ? "annan ansökan" : "andra ansökningar"} till samma utlysning.`,
    },
    apply: {
      title: "Ansöka",
      subtitle: "Alla ansökningar oavsett projekt – och var ni kan hitta ny finansiering.",
      myApplicationsTitle: "Ansökningar",
      filterActive: "Pågående",
      filterDecided: "Beslut",
      filterAll: "Alla",
      statActive: "Utkast",
      statWithFunder: "Hos finansiären",
      statAwarded: "Beviljade",
      statClosed: "Avslag eller återtagna",
      columnProjectCall: "Projekt och utlysning",
      columnStatus: "Status",
      columnDeadline: "Deadline",
      columnUpdated: "Uppdaterad",
      noApplications: "Inga ansökningar här.",
      noApplicationsHint: "Starta en ny ansökan, eller välj en utlysning under Hitta finansiering nedan.",
      registerGrant: "Registrera beviljat stöd",
      findFundingTitle: "Hitta finansiering",
      browseEuDatabase: "Bläddra i hela EU-databasen →",
    },
    report: {
      title: "Rapportera",
      subtitle: "All rapportering för beviljat stöd, oavsett projekt – vad som ska göras och när.",
      statAttention: "Kräver åtgärd",
      statUpcoming: "Kommande",
      statDone: "Inlämnade eller godkända",
      statGrants: "Beviljade stöd",
      attentionTitle: "Kräver åtgärd",
      attentionHint: "Rapporter som returnerats för komplettering eller vars deadline har passerat.",
      upcomingTitle: "Kommande rapporter",
      doneTitle: (n) => `Inlämnade och godkända (${n})`,
      showDone: (n) => `Visa inlämnade och godkända (${n})`,
      hideDone: "Dölj inlämnade och godkända",
      noAttention: "Inget kräver åtgärd just nu.",
      noUpcoming: "Inga kommande rapporter.",
      noGrants: "Inget beviljat stöd ännu. När en ansökan beviljas registreras stödet på projektets sida, och rapporteringen visas här.",
      grantsTitle: "Beviljade stöd",
      grantsHint: "Varje beviljat stöd med sin rapporteringsstatus.",
      euProjectName: (name) => `EU-projektets namn: ${name}`,
      open: "Öppna",
      overdueLabel: (n) => (n === 0 ? "Försenad" : `Försenad ${n} ${n === 1 ? "månad" : "månader"}`),
    },
    notifications: {
      title: "Aviseringar",
      bellLabel: (n) => (n === 0 ? "Aviseringar" : `Aviseringar, ${n} olästa`),
      markAllRead: "Markera alla som lästa",
      none: "Inga aviseringar just nu.",
      settingsLink: "Inställningar för aviseringar",
      unreadMarker: (n) => `${n} ${n === 1 ? "oläst avisering" : "olästa aviseringar"}`,
      categoryLabels: {
        deadlines: "Deadlines och påminnelser",
        calls: "Utlysningar",
        applications: "Ansökningar",
        reporting: "Rapportering",
        projects: "Projekt",
        system: "System",
      },
      categoryHints: {
        deadlines: "Ansökningar och rapporter som ska lämnas, bevakade utlysningar som stänger, uppgifter som förfaller.",
        calls: "Nya utlysningar som passar ett projekt, och bevakade utlysningar som ändrats.",
        applications: "Ändrad status på en ansökan, och beviljade ansökningar vars stöd ska registreras.",
        reporting: "Rapporter som returnerats eller är försenade, och nya beviljade stöd.",
        projects: "Projekt som delas med din enhet.",
        system: "Importerade utlysningar och dokument i EU-databasen som behöver uppdateras.",
      },
      settingsTitle: "Aviseringar",
      settingsIntro: "Välj vad du vill få aviseringar om, var, och hur långt i förväg. Aviseringarna samlas under klockan uppe till höger.",
      columnCategory: "Typ av händelse",
      columnInApp: "I systemet",
      columnEmail: "E-post",
      emailModes: { off: "Av", instant: "Direkt", daily: "Daglig sammanfattning", weekly: "Veckosammanfattning" },
      emailNote: "E-postvalen sparas, men i den här demoversionen skickas inga e-postmeddelanden – det kräver en koppling till en e-posttjänst.",
      scopeTitle: "Vilka projekt",
      scopeMine: "Bara projekt där jag har en roll eller som delats med min enhet",
      scopeAll: "Hela organisationens projekt",
      leadTitle: "Påminn om deadlines",
      leadOption: (n) => `${n} ${n === 1 ? "månad" : "månader"} i förväg`,
      resetDefaults: "Återställ standardval",
      watchTitle: "Bevakningar",
      watchIntro: "Bevakade utlysningar och program ger påminnelser om deadlines och ändringar. De visas också under Ansöka → Hitta finansiering.",
    },
  },
  en: {
    confirm: {
      yesRemove: "Yes, remove",
      yesReset: "Yes, reset",
      yesRestore: "Yes, restore the version",
      yesLeave: "Yes, leave without saving",
      yesCreate: "Yes, create",
      yesRegister: "Yes, register",
      cancel: "Cancel",
    },
    login: {
      title: "Log in",
      subtitle: "Log in to reach the system. Your EU coordinator gives you the password.",
      email: "Email",
      password: "Password",
      remember: "Remember me for 30 days",
      submit: "Log in",
      submitting: "Logging in…",
      errorInvalid: "Wrong email or password.",
      errorNotConfigured: "Login isn't configured — the password (DEMO_PASSWORD) is missing in the hosting environment.",
      errorGeneric: "Something went wrong. Please try again.",
      logout: "Log out",
      loggedInAs: (email) => `Logged in as ${email}`,
    },
    nav: {
      home: "Home",
      workflow: "How it works",
      personas: "Who it's for",
      pricing: "Pricing",
      demo: "New application",
      projects: "Projects",
      apply: "Apply",
      report: "Report",
      knowledgeBank: "Knowledge bank",
      euDatabase: "EU database",
      referenceProjects: "Reference projects",
      datacenter: "Datacenter",
      overview: "Overview",
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
      quickLinksTitle: "Every part of the system",
    },
    hero: {
      eyebrow: "The operating system for external funding",
      title: "From municipal need to funded project",
      subtitle:
        "EU Navigator connects a municipality's investment plans with EU funding opportunities — automatically, continuously, with AI-driven matching and application support.",
      ctaPrimary: "Start an application",
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
      subtitle: "Describe your own project and see matching calls — no login required.",
      button: "Start an application",
    },
    footer: {
      disclaimer:
        "Demo with illustrative example data. Matching is based on a transparent scoring model, not live data from EU systems. See the EU's Funding & Tenders Portal for current calls.",
      rights: "EU Navigator — concept and demo.",
    },
    demo: {
      intake: {
        title: "New application — describe the project",
        subtitle:
          "Describe the project you want funding for, and it's matched against the EU calls. Fill in as much as you can — the more concrete the description, the better the matching.",
        fieldTitle: "Project name",
        fieldTitlePlaceholder: "E.g. Energy efficiency upgrade of 14 schools",
        fieldDescription: "Description",
        fieldDescriptionPlaceholder:
          "Describe what you want to do, why, and which activities are included (e.g. solar panels, control systems, ventilation, energy storage)...",
        fieldSector: "Primary area",
        fieldBudget: "Total project budget (SEK)",
        fieldStartYear: "Start year",
        fieldEndYear: "End year",
        fieldMunicipality: "Municipality / organisation",
        fieldMunicipalityPlaceholder: "E.g. Example City Municipality",
        fieldPartnership: "Partnership (existing or possible to secure)",
        fieldActivityType: "Type of activity",
        activityTypePlaceholder: "Choose type of activity…",
        activityTypeHint: "Decides which programmes fit — e.g. ERDF funds investment, ESF+ skills measures and Horizon Europe research.",
        fieldSecondarySectors: "Other areas the project touches (optional)",
        fieldTargetGroups: "Target group (optional)",
        targetGroupsHint: "State whether the project is aimed at specific people — decisive for ESF+ and Erasmus+, among others.",
        fieldRequestedGrant: "EU grant requested (SEK, optional)",
        requestedGrantHint: "Leave empty to estimate the grant from the programme's typical co-financing rate.",
        requestedGrantOverBudget: "The requested grant can't exceed the total budget.",
        fieldRegion: "County where the project takes place",
        regionPlaceholder: "Choose county…",
        fieldApplicantType: "Applicant organisation type",
        applicantTypeFromProfile: "Taken from the organisation profile. Decides which calls you're eligible for.",
        applicantTypeDefault: "Decides which calls you're eligible for. Set the type in the organisation profile to have it filled in automatically.",
        fieldTags: "Tags (for more accurate matching)",
        tagsHint: "Pick the tags that describe the project — tags are matched exactly against the calls' themes, and don't miss synonyms the way free-text search does.",
        tagsSuggestedLabel: "Suggestions based on the description:",
        tagsAddAllLabel: "Add all",
        tagsAddNewPlaceholder: "New tag that's missing…",
        tagsAddNewButton: "Add new tag",
        tagsNudge: (n) =>
          `No tags selected. Tags carry a lot of weight in matching — ${n} ${n === 1 ? "tag is" : "tags are"} suggested from the description.`,
        tagsNudgeButton: "Add suggested",
        submit: "Find funding opportunities",
        fillExample: "Fill example",
        prefilledFromBank: "Pre-filled from the project — review and complete before continuing.",
        existingProjectTitle: "Is the project already here?",
        existingProjectHint: "Pick it so you don't have to describe it again. The project page shows the calls it matches, each with Start application.",
        existingProjectPlaceholder: "Choose an existing project",
        existingProjectGo: "To the project's matches",
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
        viewCallDetails: "Read more about the call",
        viewCallDetailsHint: "Opens in a new tab",
        recommendationProceed: "PROCEED",
        recommendationConsider: "CONSIDER",
        recommendationLow: "LOW PRIORITY",
        startApplication: "Start application",
        back: "Edit project",
        monthsSuffix: "months",
        recommendedSectionTitle: "Recommended matches",
        lowRelevanceSectionTitle: (n) => `Lower relevance (${n})`,
        showLowRelevanceButton: (n) => `Show more / lower relevance (${n})`,
        hideLowRelevanceButton: "Hide lower relevance",
        noRecommendedMatches: "No strong matches were found. Here are all the calls anyway, sorted by relevance.",
      },
      workspace: {
        back: "Back to matches",
        title: "AI-assisted application workspace",
        logicTitle: "Project logic",
        logicHint: "AI-generated draft — edit directly in the fields below.",
        resetField: "Reset to AI suggestion",
        confirmResetField: "Reset to the AI suggestion? Your edited text in this field will be lost.",
        fieldSourceTemplate: "Template suggestion",
        fieldSourceEdited: "Edited by you",
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
        draftNotSavedNote:
          "This application isn't saved. Saving it also creates the project under Projects, so the application and the project belong together.",
        confirmLeaveUnsavedDraft:
          "This application isn't saved — going back now will lose what you've written. Continue anyway?",
        saveAsNewProjectButton: "Save application",
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
        confirmRestoreVersion: (name) =>
          `Restore the version "${name}"? Any changes in the current draft that aren't saved as a version will be lost.`,
        exportVersionButton: "Export (.docx)",
        deleteVersionButton: "Delete",
        confirmDeleteVersion: (name) => `Delete the version "${name}"? This can't be undone.`,
        versionSavedAt: (date) => `Saved ${date}`,
        backToPrevious: "Back",
        estEuShareNote: "The same amount as in the match: the grant requested, or the call's funding rate of the budget, at most the call's maximum.",
        notAssessedNote: "Suggestion — counted in the assessment once you have written or edited the text.",
        signalQuantified: "Quantified effect",
        signalIndicator: "Indicator",
        signalBaseline: "Baseline",
        signalHorizontal: "Horizontal principles",
        sectionMissing: (dimension) => `Missing: ${dimension}`,
        goToSection: (section) => `Go to ${section}`,
        changeSinceOpened: (delta) => `${delta > 0 ? "↑ +" : "↓ "}${delta} since you opened the application`,
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
        noGaps: "No gaps in the match against the call. What remains in the text itself is listed under Application readiness above.",
      },
      readiness: {
        title: "Application readiness",
        disclaimer:
          "This is not a prediction of the EU's decision, but the AI's assessment of how well the application meets documented requirements and evaluation criteria.",
        overallLabel: "Overall score",
        recommendedActions: "Recommended actions before submission",
      },
      coach: {
        title: "Application Coach",
        subtitle: "Review of the application's text — the project description and the sections you have written — against this specific call's requirements",
        relevance: "Relevance",
        impact: "Impact",
        evidence: "Evidence",
        suggestionLabel: "Suggested addition",
        lowConfidenceNote:
          "The text is too short or lacks clear patterns — the rule engine's assessment above is therefore unspecific. This is exactly the situation where a real AI review (not enabled in this demo) would add the most value.",
        requestAiReviewButton: "Request AI review",
        requestAiReviewDisabledReason: "Requires an AI service connected to the system — not enabled in this demo.",
        requestAiReviewComingSoonBadge: "Coming feature",
      },
    },
    projectBank: {
      title: "Projects",
      subtitle:
        "The organisation's projects — ideas, needs and planned investments. Each project brings together its applications, grants and reports.",
      columnApplications: "Applications and reporting",
      applicationsSummary: (active, awarded) =>
        [active > 0 ? `${active} in progress` : "", awarded > 0 ? `${awarded} awarded` : ""].filter(Boolean).join(" · "),
      searchPlaceholder: "Search projects…",
      noProjectsMatch: "No projects match the filter.",
      columnTitle: "Project",
      columnDepartment: "Department",
      columnStatus: "Status",
      columnCost: "Estimated cost",
      columnPeriod: "Period",
      columnReadiness: "Application readiness",
      readinessAgainst: (callTitle) => `Against the best match: ${callTitle}`,
      columnBestMatch: "Best match",
      statTotal: "Projects in portfolio",
      statAvgMatch: "Average best match",
      statProceedReady: "Ready to proceed",
      statusLabels: {
        idea: "Idea",
        assessing: "Being scoped",
        "funding-search": "Searching for funding",
        funded: "Funded",
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
      peopleAndSharingTitle: "Who sees and owns the project",
      assignedRolesTitle: "Assigned roles",
      noAssignedRoles: "No one has been assigned a role on this project yet.",
      shareTitle: "Share project",
      shareHint: "Makes the project visible to more than just its assigned roles — for the whole organisation or a specific department. Those it's shared with get a notification.",
      tasksTitle: "Tasks",
      tasksHint: "Concrete to-dos for this specific project, whatever phase it's in.",
      taskAddPlaceholder: "New task, e.g. \"Book a check-in with finance\"",
      taskDueDateLabel: "Due",
      taskAddButton: "Add task",
      noTasks: "No tasks added yet.",
      taskEditLabel: "Edit",
      taskSaveButton: "Save",
      taskCancelButton: "Cancel",
      taskRemoveLabel: "Remove",
      taskDueLabel: (date) => `Due ${date}`,
      attachmentsTitle: "Attachments",
      attachmentsHint: "Save supporting documents for this project, e.g. a budget, letter of intent, or a previous decision.",
      attachmentUploadButton: "Upload attachment",
      noAttachments: "No attachments saved yet.",
      attachmentTooLarge: (maxMB) => `File is too large — max ${maxMB} MB per attachment in this demo version.`,
      attachmentRemoveLabel: "Remove",
      confirmRemoveAttachment: (fileName) => `Remove the attachment "${fileName}"? The file will be gone from the system.`,
      attachmentUploadedAt: (date) => `Uploaded ${date}`,
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
      back: "Back to Projects",
      lifecycleTitle: "The project's path",
      lifecycleProject: "Project",
      lifecycleApplications: "Applications",
      lifecycleGrants: "Grants",
      lifecycleReporting: "Reporting",
      lifecycleApplicationsSummary: (active, closed, awarded) =>
        [active > 0 ? `${active} in progress` : "", awarded > 0 ? `${awarded} awarded` : "", closed > 0 ? `${closed} closed without funding` : ""]
          .filter(Boolean)
          .join(" · "),
      lifecycleGrantsSummary: (n) => `${n} ${n === 1 ? "grant" : "grants"}`,
      lifecycleNone: "None yet",
      grantsSectionTitle: "Grants and reporting",
      grantsSectionHint: "Each awarded application gets its own grant with its own reporting. Reports are handled under Report.",
      grantsNone: "No grant yet. When an application is awarded, register the grant on the application above.",
      importButton: "Import projects (CSV)",
      downloadTemplate: "Download template",
      importHint:
        "Columns: Titel, Förvaltning, Ägare, Budget, Startår, Slutår, Sektor, Beskrivning, Internationell partner. Saved in your browser (not shared between users in this demo).",
      clearImported: "Clear imported projects",
      removeImportedRow: "Remove imported project",
      confirmRemoveProject: (title) => `Remove the project "${title}"? It can be restored later under "Deleted projects".`,
      confirmClearImported: "Remove all imported projects? They can be restored later under \"Deleted projects\".",
      deletedProjectsTitle: "Deleted projects",
      deletedProjectsHint: "Kept here until you restore them.",
      restoreProjectButton: "Restore",
      economicsTitle: "Portfolio economics",
      statPortfolioBudget: "Total portfolio budget",
      statFundingPotential: "Identified EU funding potential",
      statCoFinancingNeed: "Estimated co-financing need",
      linkedAwardedProjectLabel: "Has a grant under reporting",
      linkedAwardedProjectLink: "View reporting →",
      markAsAwardedButton: "Mark as awarded",
      markAsAwardedHint: "Creates reporting tracking for the project based on its best-matching call.",
      confirmMarkAsAwarded:
        "Mark as awarded? This registers a grant with its own reporting. This can't be undone.",
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
      deadlineIn: (m) => (m < 0 ? "Deadline has passed" : `Deadline in ${m} months`),
      budgetLabel: "Call's total budget",
      grantRangeLabel: "Grant size",
      fundingRateLabel: (pct) => `Funding rate up to ${pct}%`,
      eligibleApplicantsTitle: "Eligible applicants",
      activityTypesLabel: "Funds",
      targetGroupsLabel: "Target groups",
      eligibleRegionsLabel: "Programme area",
      minPartnerCountriesLabel: (n) => `Requires partners from at least ${n} countries.`,
      prioritiesTitle: "Priorities",
      evaluationCriteriaTitle: "Evaluation criteria",
      documentsTitle: "Documents (AI context package)",
      documentNeedsUpdate: "Needs update",
      documentUpdated: (date) => `Updated ${date}`,
      reportingRequirementsHint: "What reporting will involve if you're awarded funding under this call.",
      searchProgramsPlaceholder: "Search programmes…",
      noProgramsMatch: "No programmes match your search.",
      searchCallsPlaceholder: "Search calls…",
      noCallsMatch: "No calls match your search.",
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
      startApplicationCta: "Have a similar project? Start an application →",
      searchPlaceholder: "Search the projects…",
      noProjectsMatch: "No projects match your search.",
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
      portfolioTitle: "Portfolio",
      portfolioHint: "Leadership's view of the whole investment plan: economics, projects by status, applications and grants.",
      applicationsByStatusTitle: "Applications by status",
      grantsTotalLabel: "Awarded in total",
      grantsCountLabel: "Grants",
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
      statUpcomingReports: "Upcoming reports",
      statReportsNeedingRevision: "Reports needing revision",
      statStructuredEligibility: "Calls with structured eligibility",
      documentsNeedingUpdateTitle: "Documents needing an update",
      incompleteProjectsTitle: "Projects with incomplete information",
      incompleteProjectsBody: "These project-bank entries are missing information required for reliable EU matching.",
      viewCallLink: "View call →",
      fieldsMissing: (n) => `${n} fields missing`,
      openLink: "Open →",
      importCallButton: "Import a new call",
      reportingAttentionTitle: "Reports needing attention",
      reportingAttentionBody: "Upcoming reports and reports sent back for revision, in one place.",
      noReportingAttention: "No reports need attention right now.",
      viewProjectLink: "View grant →",
    },
    callImport: {
      title: "Import a new call",
      subtitle:
        "Paste the call text. A rule-based first pass (not an AI service — see the AI-dependency discussion this tool grew out of) suggests fields to fill in, but nothing is saved until every field has been reviewed and approved by you.",
      back: "Back to Datacenter",
      pasteLabel: "Call text",
      pastePlaceholder: "Paste all or part of the call text here…",
      parseButton: "Parse text",
      parsedNote: "Suggestions loaded below — check the fields marked \"Default value\" especially closely.",
      detectedBadge: "Found in the text",
      defaultBadge: "Default value — check this",
      fieldProgram: "Programme/fund",
      fieldTitleSv: "Title (Swedish)",
      fieldTitleEn: "Title (English)",
      fieldStatus: "Status",
      statusOpen: "Open",
      statusUpcoming: "Upcoming",
      fieldDeadline: "Application deadline",
      fieldDeadlineHint: "The call's real date — used to work out time left and whether a project's start fits the decision.",
      fieldBudget: "Total budget (SEK)",
      fieldMinGrant: "Minimum grant (SEK)",
      fieldMaxGrant: "Maximum grant (SEK)",
      fieldPartnership: "Requires partnership/consortium",
      fieldEligibleSv: "Eligible applicants (Swedish)",
      fieldEligibleEn: "Eligible applicants (English)",
      fieldApplicantTypes: "Applicant categories",
      fieldActivityTypes: "Type of activity funded",
      fieldTargetGroups: "Target groups",
      fieldTargetGroupsHint: "Only for calls aimed at specific people (e.g. ESF+). Leave empty otherwise.",
      fieldEligibleRegions: "Programme area (counties)",
      fieldEligibleRegionsHint: "Only for regionally limited calls. Leave empty if all of Sweden can apply.",
      fieldMinPartnerCountries: "Minimum number of countries in the partnership",
      fieldCoFinancing: "Funding rate (% of eligible costs)",
      fieldCoFinancingHint: (pct) =>
        pct === null
          ? "Leave empty to use the programme's typical funding rate."
          : `Leave empty to use the programme's typical funding rate (${pct}%).`,
      fieldCriteria: "Evaluation criteria",
      fieldCriteriaHint: "Decides how matching weighs thematic fit against feasibility. Without criteria a default split (60/40) is used. Without an English name, the Swedish one is shown.",
      criterionNamePlaceholder: "Criterion, e.g. Relevance",
      criterionPointsLabel: "Points",
      addCriterion: "Add criterion",
      removeCriterion: "Remove criterion",
      completenessTitle: "Matching data",
      completenessIntro: "The following is missing. The call can still be saved, but matching will be less accurate:",
      completenessAllGood: "Everything matching uses is filled in.",
      missingApplicantTypes: "Applicant categories — eligibility can't be checked, only the free text is shown",
      missingActivityTypes: "Type of activity — counted as unknown (half points) for every project",
      missingCriteria: "Evaluation criteria — the default 60/40 weighting is used",
      missingTags: "Tags — the most important thematic signal is missing",
      missingGrantRange: "Grant range — requested amounts can't be compared",
      missingDeadline: "Application deadline",
      deadlinePassed: "The application deadline has already passed — the call will show as closed in matching.",
      fieldPriorities: "Priorities",
      fieldPrioritiesHint: "One priority per line. If the English list is left empty, the Swedish text is shown in English too.",
      fieldPrioritiesSv: "Priorities in Swedish",
      fieldPrioritiesEn: "Priorities in English (optional)",
      criterionNameEnPlaceholder: "English name (optional)",
      fieldTags: "Tags",
      noTagsWarning: "This call has no tags selected — matching against projects will be less accurate without them.",
      fieldPeriodicity: "Reporting frequency",
      fieldInterimReports: "Interim reports required",
      fieldAuditThreshold: "Auditor's certificate required above (SEK, leave blank if not applicable)",
      noAuditThreshold: "No auditor's certificate requirement",
      saveButton: "Save call",
      requiredFieldsError: "Programme, title (both languages) and a unique call id are required.",
      importedListTitle: "Previously imported calls",
      noImportedCalls: "No calls have been imported yet.",
      removeButton: "Remove",
      confirmRemoveImportedCall: (title) => `Remove the imported call "${title}"?`,
      provenanceAssisted: "Added via reviewed import flow",
      provenanceManual: "Manually entered",
      importedAtLabel: (date) => `Imported ${date}`,
    },
    grants: {
      title: "Grant",
      subtitle: "A funding decision, with reporting per period.",
      nextReportDue: (m) => `Next report due in ${m} months`,
      nextReportDueLabel: "Next report",
      awardedAmount: "Awarded amount",
      commitmentsTitle: "Application commitments vs. outturn",
      promised: "Promised",
      reported: "Reported",
      noLatestOutcome: "Not reported yet",
      back: "Back to Report",
      statusFilterAll: "All",
      noProjectsForStatus: "No projects with this status.",
      onlyMineAndSharedToggle: "Show only my and shared projects",
      reportingRequirementsTitle: "Call reporting requirements",
      periodicityLabel: "Reporting frequency",
      periodicityQuarterly: "Quarterly",
      periodicityBiannual: "Biannual",
      periodicityAnnual: "Annual",
      interimReportsRequiredLabel: (n) => `${n} interim report${n === 1 ? "" : "s"} required before the final report`,
      auditRequiredAboveLabel: "An auditor's certificate is required for awards above",
      interimDocumentsLabel: "Evidence required for an interim report",
      finalReportDocumentsLabel: "Evidence required for the final report",
      viewReportingInstructionsLink: "View this call's reporting instructions →",
      reportingTimelineTitle: "Reporting timeline",
      reportingTimelineHint: "Interim reports and the final report in chronological order, with the outturn reported at each.",
      reportTypeInterim: "Interim report",
      reportTypeFinal: "Final report",
      reportStatusUpcoming: "Upcoming",
      reportStatusSubmitted: "Submitted",
      reportStatusApproved: "Approved",
      reportStatusRevisionRequested: "Revision requested",
      reportStatusEditLabel: "Change the reporting event's status",
      reportDueInMonths: (n) => (n === 0 ? "Due this month" : `Due in ${n} month${n === 1 ? "" : "s"}`),
      reportOverdueBy: (n) => (n === 0 ? "Overdue" : `Overdue by ${n} month${n === 1 ? "" : "s"}`),
      noOutcomesYet: "No outturn reported yet.",
      reportNoteLabel: "Note",
      reportFormTitle: "Report outturn",
      reportFormNoteLabel: "Note on this report",
      reportFormNotePlaceholder: "A short note on the outturn, e.g. deviations from plan.",
      reportFormSubmitButton: "Mark as submitted",
      reportFormCorrectButton: "Submit correction",
      reportSubmittedIndicator: "Saved in your browser — this does not replace an actual submission to the funder.",
      reportingCompleteLabel: "All reporting complete.",
      reportTypeSustainability: "Sustainability follow-up",
      reportHistoryToggle: (n) => `Previous submissions (${n})`,
      reportHistoryEntryLabel: (date) => `Submitted ${date}`,
      reportHistoryOriginalLabel: "Original report",
      trendChartTitle: "Trend over time",
      trendChartTarget: "Target",
      exportReportButton: "Export report (.docx)",
      reportAttachmentsLabel: "Attachments",
      reportAttachmentUploadButton: "+ Upload attachment",
      reportAttachmentRemoveLabel: "Remove",
      confirmRemoveReportAttachment: (fileName) => `Remove the attachment "${fileName}"? The file will be gone from the system.`,
      reportAttachmentTooLarge: (maxMB) => `File is too large — max ${maxMB} MB per attachment in this demo version.`,
      addSustainabilityButton: "Add sustainability follow-up",
      addSustainabilityHint: "For funds requiring follow-up on the sustainability of results years after project end.",
      healthGoodLabel: "On track",
      healthAttentionLabel: "Needs attention",
      healthBlockedLabel: "Revision requested",
      linkedProjectBankLabel: "Project",
      euProjectName: (name) => `EU project name: ${name}`,
      linkedApplicationLabel: "Awarded application",
      openApplicationLink: "Open application",
      linkedProjectStatusAutoSyncNote: "The project's status follows this reporting: running while reporting is ongoing, closed once it's done.",
      financialSummaryTitle: "Financial tracking",
      financialSpentLabel: "Spent / awarded",
      financialRemainingLabel: "Remaining budget",
      financialHistoryTitle: "Spend per report",
      reportFormFinancialLabel: "Spent this period (SEK, optional)",
      reportFinancialLine: (amount) => `Spent this period: ${amount}`,
    },
    bevakning: {
      title: "Find funding",
      subtitle: "Open and upcoming calls, and which of the organisation's projects fit them best.",
      disclaimer:
        "In a production version this would be sent as a recurring weekly digest to the EU coordinator. Here it's shown directly in the interface instead.",
      columnCall: "Call",
      columnDeadline: "Deadline",
      deadlineInMonths: (n) => (n < 0 ? "Deadline passed" : `Deadline: ${n} mo`),
      matchingProjectsLabel: (n) => `${n} matching projects in the portfolio`,
      noMatchingProjects: "No projects in the portfolio match this call yet.",
      viewCall: "View call",
      startApplication: "Start application",
      watchedBadge: "★ Watched",
      onlyWatchedToggle: "Show only my watchlist",
      noWatchedCalls: "No watched calls. Click \"Watch\" on a call, or adjust your watchlist under Settings → Watchlists & notifications.",
      watchCallButton: "☆ Watch",
      watchingCallButton: "★ Watching",
      reportingWatchTitle: "Reporting deadlines (awarded projects)",
      reportingWatchHint:
        "Every outstanding reporting event for already-awarded projects, shown automatically — nothing needs to be watched to appear here. Separate from the calls below.",
      noReportingWatched: "No outstanding reporting deadlines right now — every awarded project's reports are submitted.",
      portfolioMatchSectionTitle: "Calls that match your portfolio",
      otherCallsSectionTitle: (n) => `Other calls (${n})`,
      showOtherCallsButton: (n) => `Show more / other calls (${n})`,
      hideOtherCallsButton: "Hide other calls",
      noPortfolioMatches: "No calls match your portfolio yet. Here are all the calls anyway, sorted by deadline.",
    },
    orgSettings: {
      title: "Organisation",
      subtitle: "The organisation's registry info and units.",
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
      resetAll: "Reset everything to the example data",
      confirmResetAll: "Reset organisation details and the unit structure to the example data? Your own changes will be lost.",
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
      cardWatchTitle: "Notifications & watchlists",
      cardWatchDesc: "What you're notified about, where and when — and which calls you watch.",
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
      title: "Notifications & watchlists",
      subtitle: "What you want to be notified about, and which calls, programmes and subject areas you watch.",
      back: "← Back to Settings",
      sectorsTitle: "Subject areas",
      programsTitle: "EU programmes",
      savedIndicator: "Saved in your browser",
      resetAll: "Reset watchlists",
      confirmResetAll: "Reset all watchlists to the example data? Your own choices will be lost.",
      watchedCallsTitle: "Watched calls",
      watchedCallsHint: "Calls you've flagged under Apply → Find funding or in the EU database.",
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
      confirmResetAll: "Reset the whole funding profile to the example data? Your own choices will be lost.",
    },
    oversikt: {
      title: "Overview",
      subtitle: "What you need to do now — your applications, reports and tasks.",
      statActiveApplications: "Applications in progress",
      statReportsAttention: "Reports needing action",
      statReportsUpcoming: "Upcoming reports",
      statOpenTasks: "Open tasks",
      statUnread: "Unread notifications",
      myApplicationsTitle: "Applications",
      myApplicationsNone: "No applications in progress. Start a new one, or find a call under Apply.",
      viewAllApplications: "All applications under Apply →",
      myReportsTitle: "Reporting",
      myReportsNone: "No reporting to do right now.",
      viewAllReports: "All reporting under Report →",
      latestNotificationsTitle: "Unread notifications",
      latestNotificationsNone: "No unread notifications.",
      sectionStatusBreakdown: "Projects by status",
      describeNewProject: "New application",
      ongoingApplicationsResume: "Continue",
      ongoingApplicationsUpdatedAt: (date) => `Last edited ${date}`,
      ongoingApplicationsVersions: (n) => (n === 1 ? "1 saved version" : `${n} saved versions`),
      currentTasksTitle: "Tasks",
      currentTasksHint: "Open tasks in the projects, soonest due first.",
      currentTasksNone: "No open tasks right now. Add tasks on a project's page.",
      currentTasksViewAll: "View project →",
    },
    applications: {
      statusLabels: {
        draft: "Draft",
        submitted: "Submitted",
        "under-review": "Under review",
        awarded: "Awarded",
        rejected: "Rejected",
        withdrawn: "Withdrawn",
      },
      sectionTitle: "Applications",
      sectionHint:
        "Each application has its own status and draft. A project can apply to several calls — and to the same call again in a new round. The project's status follows its applications.",
      none: "No applications started yet — start one from the matches below.",
      statusLabel: "Status",
      resume: "Continue",
      open: "Open",
      deleteButton: "Delete",
      confirmDelete: "Delete this application with its draft and saved versions?",
      createAwardedButton: "Register grant",
      confirmCreateAwarded: "Register the grant for this application? Its reporting is then set up under Report.",
      viewAwardedLink: "View grant",
      updatedAt: (date) => `Updated ${date}`,
      roundLabel: (n) => `Application ${n}`,
      continueApplication: "Continue application",
      workspaceStatusLabel: "Application status",
      newApplicationButton: "New application to the same call",
      confirmNewApplication:
        "Start a new, empty application to the same call? The current application stays under the project.",
      allApplicationsLink: "All applications for the project",
      otherApplicationsNote: (n) => `The project has ${n} other ${n === 1 ? "application" : "applications"} to the same call.`,
    },
    apply: {
      title: "Apply",
      subtitle: "Every application regardless of project — and where to find new funding.",
      myApplicationsTitle: "Applications",
      filterActive: "In progress",
      filterDecided: "Decided",
      filterAll: "All",
      statActive: "Drafts",
      statWithFunder: "With the funder",
      statAwarded: "Awarded",
      statClosed: "Rejected or withdrawn",
      columnProjectCall: "Project and call",
      columnStatus: "Status",
      columnDeadline: "Deadline",
      columnUpdated: "Updated",
      noApplications: "No applications here.",
      noApplicationsHint: "Start a new application, or pick a call under Find funding below.",
      registerGrant: "Register grant",
      findFundingTitle: "Find funding",
      browseEuDatabase: "Browse the whole EU database →",
    },
    report: {
      title: "Report",
      subtitle: "All reporting on grants regardless of project — what's due and when.",
      statAttention: "Needs action",
      statUpcoming: "Upcoming",
      statDone: "Submitted or approved",
      statGrants: "Grants",
      attentionTitle: "Needs action",
      attentionHint: "Reports returned for revision, or past their deadline.",
      upcomingTitle: "Upcoming reports",
      doneTitle: (n) => `Submitted and approved (${n})`,
      showDone: (n) => `Show submitted and approved (${n})`,
      hideDone: "Hide submitted and approved",
      noAttention: "Nothing needs action right now.",
      noUpcoming: "No upcoming reports.",
      noGrants: "No grants yet. When an application is awarded, the grant is registered on the project's page and its reporting shows up here.",
      grantsTitle: "Grants",
      grantsHint: "Each grant with its reporting status.",
      euProjectName: (name) => `EU project name: ${name}`,
      open: "Open",
      overdueLabel: (n) => (n === 0 ? "Overdue" : `Overdue by ${n} ${n === 1 ? "month" : "months"}`),
    },
    notifications: {
      title: "Notifications",
      bellLabel: (n) => (n === 0 ? "Notifications" : `Notifications, ${n} unread`),
      markAllRead: "Mark all as read",
      none: "No notifications right now.",
      settingsLink: "Notification settings",
      unreadMarker: (n) => `${n} unread ${n === 1 ? "notification" : "notifications"}`,
      categoryLabels: {
        deadlines: "Deadlines and reminders",
        calls: "Calls",
        applications: "Applications",
        reporting: "Reporting",
        projects: "Projects",
        system: "System",
      },
      categoryHints: {
        deadlines: "Applications and reports coming due, watched calls closing, tasks falling due.",
        calls: "New calls that fit a project, and watched calls that changed.",
        applications: "An application's status changing, and awarded applications whose grant needs registering.",
        reporting: "Reports returned or overdue, and new grants.",
        projects: "Projects shared with your unit.",
        system: "Imported calls and EU database documents that need updating.",
      },
      settingsTitle: "Notifications",
      settingsIntro: "Choose what to be notified about, where, and how far ahead. Notifications collect under the bell at the top right.",
      columnCategory: "Kind of event",
      columnInApp: "In the system",
      columnEmail: "E-mail",
      emailModes: { off: "Off", instant: "Immediately", daily: "Daily digest", weekly: "Weekly digest" },
      emailNote: "E-mail choices are saved, but this demo sends no e-mail — that needs a connection to an e-mail service.",
      scopeTitle: "Which projects",
      scopeMine: "Only projects where I have a role or that are shared with my unit",
      scopeAll: "All of the organisation's projects",
      leadTitle: "Remind me of deadlines",
      leadOption: (n) => `${n} ${n === 1 ? "month" : "months"} ahead`,
      resetDefaults: "Reset to defaults",
      watchTitle: "Watchlists",
      watchIntro: "Watched calls and programmes produce deadline and change reminders. They also show under Apply → Find funding.",
    },
  },
};

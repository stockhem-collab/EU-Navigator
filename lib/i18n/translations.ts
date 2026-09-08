import { Lang } from "@/lib/types";

export interface TranslationTree {
  nav: {
    home: string;
    workflow: string;
    personas: string;
    pricing: string;
    demo: string;
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
    },
  },
  en: {
    nav: {
      home: "Home",
      workflow: "How it works",
      personas: "Who it's for",
      pricing: "Pricing",
      demo: "Try the demo",
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
    },
  },
};

import { FundedProject } from "@/lib/types";

// Level: real awarded-project register.
//
// REAL DATA extracted from Exempelstads own documentation
// ("Projekt med beviljade medel", start.exempelstad) covering the city's
// actual EU-funded projects across both the 2021-2027 and 2014-2020
// programme periods. Budget/funding figures are as published by the
// city; a small number of projects did not publish a figure (null).
export const fundedProjects: FundedProject[] = [
  {
    id: "ai-driven-atervinning",
    title: `AI-driven återvinning`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "erdf",
    fundName: `Europeiska regionala utvecklingsfonden -- Tillväxtverket`,
    period: "2021-2027",
    periodLabel: `2026-01-12 till 2029-01-12`,
    role: "owner",
    description_sv: `Projektet ska förbättra matavfallssorteringen i Exempelstad genom att
minska felsortering, öka incitamenten och förbättra kommunikationen.

Många boende felanvänder idag den gröna påsen, som enbart ska användas
för matavfall. Detta ökar kostnaderna och den miljömässiga påverkan.

Genom röntgenteknik och AI-baserat datorseende kan felsorterat avfall
identifieras och matavfall återvinnas på rätt sätt. Ett PAYT-
(Pay-As-You-Throw) eller GAYT-system (Gain-As-You-Throw) införs för att
belöna korrekt sortering och minska felhantering.

Projektet omfattar tekniska förstudier, installation av
övervakningssystem, informationskampanjer och beteendeanalyser.`,
    totalBudgetSEK: 21851994,
    euFundingSEK: 8180604,
  },
  {
    id: "anchor",
    title: `ANCHOR`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "interreg-north-sea",
    fundName: `Interreg North Sea`,
    period: "2021-2027",
    periodLabel: `2023--2026`,
    role: "partner",
    description_sv: `Projektets mål är att bidra i omställningen till mer resurseffektivitet
i VA-sektorn.

Syftet är att ta fram kunskapsunderlag kring sorterande avloppssystem
och vatteneffektiva samhällen riktat till beslutsfattare inom
stadsutveckling.

Detta ska göras genom att utvärdera pilotprojekt samt att ta fram
verktyg och handböcker baserat på resultat som skapas inom projektet.

Samverkanspartners är

Hamburg Wasser

Waternet

NSVA

Weimar Universitet

DuCoop

Exempelstads exploateringskontor.
`,
    totalBudgetSEK: 49473742,
    euFundingSEK: 1794000,
  },
  {
    id: "ascend",
    title: `ASCEND`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "horizon",
    fundName: `EU Horizon Europe`,
    period: "2021-2027",
    periodLabel: `2023-01-01 till 2028-01-01`,
    role: "partner",
    description_sv: `Projektet syftar till att skapa PED (Positive Energy District) i städer
i Europa.

Lyon och München är Lighthouse-städer i denna ansökan till PED-projekt,
och kommer att demonstrera hur ett Positive Energy District utformas i
dessa städer.

Miljöförvaltningen i kommunen ansvarar för workshops samt att
arrangemanget, upplägget och innehållet genomförs i samarbete med
nyckelpersoner i de två JPI-projekten i Sjöstaden och Bryggkvarteren.

Miljöförvaltningen genomför fördjupade utredningar avseende möjligheten
att utveckla upp till 5 PED i Exempelstad. 
`,
    totalBudgetSEK: 28886350,
    euFundingSEK: 1776880,
  },
  {
    id: "chemclimcircle1",
    title: `ChemClimCircle1`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "interreg-baltic-sea",
    fundName: `Interreg Baltic Sea Region`,
    period: "2021-2027",
    periodLabel: `2022-10-01 till 2024-09-30`,
    role: "owner",
    description_sv: `Projektet Integrating criteria for chemicals, climate and circularity in
procurement processes (ChemClimCircle) fokuserar på kopplingen mellan
kemikalier, klimat och cirkularitetsfrågor i offentlig upphandling.

För att fungera i en cirkulär ekonomi behöver varor och material vara
designade som cirkulära, vilket innebär att de också behöver vara
klimatneutrala och giftfria. Att säkerställa detta i
upphandlingsprocesser inom kommuner ger en större möjlighet att uppfylla
olika mål, till exempel i Agenda 2030, samt är en nyckel för att säkra
möjligheten till en cirkulär framtid.

Projektet kartlägger hur kommuner i olika länder runt Östersjön arbetar
med frågorna i dagsläget.`,
    totalBudgetSEK: 5562716,
    euFundingSEK: 1232000,
  },
  {
    id: "chemclimcircle2",
    title: `ChemClimCircle2`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "interreg-baltic-sea",
    fundName: `Interreg Baltic Sea Region`,
    period: "2021-2027",
    periodLabel: `2025-03-01 till 2028-02-29`,
    role: "partner",
    description_sv: `Projektet är en fortsättning på ChemClimCircle1 (2022--2024) där
Miljöförvaltningen i kommunen var Lead partner. ChemClimCircle1
syftade till att utveckla processer för koordinering av hållbarhetskrav
i upphandlingar.

Det är viktigt att inte arbeta i parallella processer utan istället
hantera krav inom kemikalier, klimat och cirkularitet med koppling till
varandra i organisationers inköpsprocesser. I detta ingår att
identifiera synergier och eventuella målkonflikter mellan de olika
områdena.

Det större projektet "Fostering implementation of the ChemClimCircle
approach to Green Public Procurement in the Baltic Sea Region"
(ChemClimCircle -2) leds av Litauens upphandlingsmyndighet.`,
    totalBudgetSEK: 47804628,
    euFundingSEK: 2109000,
  },
  {
    id: "cityam",
    title: `CITYAM`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "interreg-baltic-sea",
    fundName: `Interreg Baltic Sea Region.`,
    period: "2021-2027",
    periodLabel: `Projektet är avslutat per 31 december 2025.`,
    role: "partner",
    description_sv: `Projektet undersöker vilken roll städer kan spela i framtidens planering
och utveckling av det undre luftrummet i staden och hur drönare kan
integreras i stadsmiljön och stadstransportsystemet på ett effektivt och
hållbart sätt.

Den snabba utvecklingen av drönare öppnar upp nya möjligheter för en
mängd tjänster och samhällsnyttor i stadsmiljö. CITYAM syftar till att
ge städer kunskap och verktyg för hur luftrummet ska utformas utifrån
gällande regelverk, fysiska förutsättningar och framtida behov.`,
    totalBudgetSEK: 42000000,
    euFundingSEK: null,
  },
  {
    id: "deploy-emds",
    title: `Deploy EMDS`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "digital-europe",
    fundName: `The Digital Europe Programme (DIGITAL)`,
    period: "2021-2027",
    periodLabel: `2023-11-01 till 2026-10-31`,
    role: "partner",
    description_sv: `Projektet ska stödja skapandet av en teknisk infrastruktur och juridiska
direktiv för datadelning med syfte att underlätta enkel och
gränsöverskridande tillgång till viktiga data inom området mobilitet.

Inom ramen för projektet kommer ett antal use cases att genomföras i
städer/regioner som ska ge input till det övergripande arbetet med
harmonisering inom EU.

Exempelstads use case har sitt ursprung i de mål staden har satt vad
gäller miljö och framkomlighet. Införandet av miljözon 3 är ett exempel
på hur staden jobbar för att uppfylla de högt uppsatta målen och
projektet ämnar skapa förutsättningar för att följa upp effekterna av
miljözonen.`,
    totalBudgetSEK: 84000000,
    euFundingSEK: 5411500,
  },
  {
    id: "eureka-european-urban-exchange-knowledge",
    title: `EUREKA -- European URban Exchange Knowledge on climAte neutrality`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "interreg-europe",
    fundName: `Interreg Europe-projekt`,
    period: "2021-2027",
    periodLabel: `2025-05-01 till 2028-04-30`,
    role: "partner",
    description_sv: `Projektet ska genomföra, följa upp och förbättra arbete med CCC (City
Climate Contract) och Klimathandlingsplan. Syftet är att testa olika
arbetssätt och lära av varandra.

I projektet sker utbyte av erfarenheter med andra städer i projektet. En
plan ska tas fram för hur utvecklingsarbete och genomförande ska ske för
arbetet med Klimathandlingsplan och CCC i Exempelstad, med inspiration och
lärdomar från andra och inspel från andra aktörer i Exempelstad.

En utvärdering kommer att ske av genomförda åtgärder och genom att
utvärdera effekterna av genomförda förändringar och förbättringar.`,
    totalBudgetSEK: null,
    euFundingSEK: 2280000,
  },
  {
    id: "fossilfritt-2030-del-2",
    title: `Fossilfritt 2030 -- del 2`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "erdf",
    fundName: `Europeiska Regionala Utvecklingsfonden (ERUF)`,
    period: "2021-2027",
    periodLabel: `2023-04-03 till 2026-07-01`,
    role: "partner",
    description_sv: `Projektet Fossilfritt 2030 är en storregional samverkan som
    accelererar omställningen till fossilfria transporter.

Miljöfordon: expertkompetens kring miljöfordon och upphandling och
    laddinfrastruktur samt stöd till andra kommuner i omställning.

Nätverk för omställning arbetsmaskiner.

Miljöförvaltningen stödjer övriga medverkande kommuner.
`,
    totalBudgetSEK: 4600000,
    euFundingSEK: 1855000,
  },
  {
    id: "kompetensutveckling-for-hallbara-skolmal",
    title: `Kompetensutveckling för hållbara skolmåltider`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "esf",
    fundName: `Europeiska socialfonden`,
    period: "2021-2027",
    periodLabel: `2025-10-01 till 2028-09-30`,
    role: "owner",
    description_sv: `Projektet syftar till att säkerställa en mer hållbar och klimatsmart
måltidsverksamhet i kommunens kommunala skolor.

För att nå syftet ska kompetenshöjande åtgärder riktas mot olika nivåer
i utbildningsnämndens organisation.

Den kökspersonal som planerar och tillagar måltiderna ska utbildas och
stärkas i sin kompetens, men även skolledning, pedagogisk personal och
tjänstepersoner på central förvaltning ska inkluderas i
kompetensutvecklingsinsatser.`,
    totalBudgetSEK: 27288522,
    euFundingSEK: 14735802,
  },
  {
    id: "klimatpaverkan-i-detaljplaneringsprocess",
    title: `Klimatpåverkan i detaljplaneringsprocessen`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "erdf",
    fundName: `Europeiska regionala utvecklingsfonden. Stödet avser Exempelstad, Främja övergången till en cirkulär och resurseffektiv ekonomi`,
    period: "2021-2027",
    periodLabel: `2025-11-01 till 2026-09-30`,
    role: "owner",
    description_sv: `Förstudien ska resultera i ett konkret förslag på nya rutiner och en
    modell för hur stadens ordinarie detaljplaneprocess kan utvecklas
    för att hantera klimatpåverkan mer systematiskt.

Stadsutvecklingen, särskilt bygg- och anläggningssektorn, står för
    en stor del av de utsläpp som påverkar klimatet. Idag saknar
    Exempelstad etablerade arbetssätt för att systematiskt bedöma
    klimatpåverkan i den fysiska planeringen.

Det här förstudieprojektet använder flera pågående
    detaljplaneprojekt som pilotprojekt. Syftet är att testa och
    utvärdera verktyg och arbetssätt för att kunna beräkna och analysera
    klimatpåverkan redan i detaljplaneskedet.`,
    totalBudgetSEK: 1613700,
    euFundingSEK: 645480,
  },
  {
    id: "nonhazcity3",
    title: `NonHazCity3`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "interreg-baltic-sea",
    fundName: `Interreg Baltic Sea Region`,
    period: "2021-2027",
    periodLabel: `2023-01-01 till 2026-01-01`,
    role: "partner",
    description_sv: `Projektet ska minska andelen skadliga ämnen i byggnader och byggmaterial
samt på byggarbetsplatser, ämnen som i längden når den yttre
vattenmiljön, inklusive Östersjön.

Projektet Reducing hazardous substances in construction to safeguard the
aquatic environment, protect human health and achieve more sustainable
buildings (NonHazCity3) kommer att testa åtta olika pilotlösningar och
vänder sig till både kommuner, privata företagare och invånare.

Idag betraktas många aspekter av hållbara byggnader var för sig. Det
behövs mer välgrundade beslut för att undvika farliga ämnen i byggnader
och byggmaterial. Detta gör att materialen i sin tur ska kunna gå att
återanvändas eller materialåtervinnas.`,
    totalBudgetSEK: 54474720,
    euFundingSEK: 2816000,
  },
  {
    id: "npets",
    title: `nPETS`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "horizon",
    fundName: `EU Horizon`,
    period: "2021-2027",
    periodLabel: `2021-06-01 till 2024-11-30`,
    role: "partner",
    description_sv: `Projektet undersöker utsläpp av nanopartiklar i transportsektorn.

Målsättningen med det föreslagna projektet med arbetsnamnet nPETS
    (Nano Particle Emissions from the Transport Sector) är att
    kvantifiera utsläppen från olika delar av transportsektorn --
    vägtrafik, tåg, flyg och sjöfart.

Kommunens miljöanalysenhet medverkar i en EU-ansökan inom ramen för Horisont
    2020-programmet.
`,
    totalBudgetSEK: 50000000,
    euFundingSEK: 3500000,
  },
  {
    id: "refocus",
    title: `Refocus`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "interreg-baltic-sea",
    fundName: `Interreg Baltic`,
    period: "2021-2027",
    periodLabel: `2024-04-01 till 2028-03-31`,
    role: "partner",
    description_sv: `Projektet ska stärka städers mobilitetsplanering för att säkerställa
miljönyttan i transport- och trafikplanering. Möjliga åtgärder ska
identifieras och effekterna av dessa ska uppskattas.

Syftet är att förse städer och regioner med verktyg och kunskap om hur
de kan prioritera, mäta och följa upp komplexa frågor. Det ska bidra
till att förstärka policyverktyg, till exempel städernas framkomlighets-
eller klimatstrategier.

Projektmål:

Förbättra arbetet med publik laddning och betalningstjänster.

Förbättra datainsamling och datadelning avseende laddning och
    elfordon.`,
    totalBudgetSEK: 19000000,
    euFundingSEK: 2000000,
  },
  {
    id: "rev-eu-regenerative-vital-water-for-euro",
    title: `REV:EU -- REgenerative Vital water for EUropean cities`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "driving-urban-transitions",
    fundName: `Driving Urban Transitions/Formas`,
    period: "2021-2027",
    periodLabel: `2026 till 2028`,
    role: "partner",
    description_sv: `Projektets mål är att bidra i omställningen till mer resurseffektivitet
i vatten- och avloppssektorn.

Vattenbrist och övergödning visar tydligt behovet av att gå från linjär
avloppshantering till cirkulära urbana vattensystem.

REV:EU-projektet driver utvecklingen av källsorterande avloppslösningar
som möjliggör vattenåteranvändning och näringsåtervinning, stärker
resiliensen och ökar hållbarheten.

Projektet tar fram teknisk, organisatorisk och policyinriktad vägledning
som stöd för en mer cirkulär och framtidssäker urban vattenförvaltning.`,
    totalBudgetSEK: 16000000,
    euFundingSEK: 2900000,
  },
  {
    id: "samordning-av-skyddsjakt-pa-skarv-samt-s",
    title: `Samordning av skyddsjakt på skarv samt sälskyddade åtgärder`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "havs-fiskeri",
    fundName: `Havs-, fiskeri- och vattenbruksprogrammet 2021--2027`,
    period: "2021-2027",
    periodLabel: `2022-12-06 till 2026-02-28`,
    role: "owner",
    description_sv: `Projektet ska säkerställa måluppfyllnad i regionens
förvaltningsplan för skarv, vilket innefattar att reducera antalet
aktiva skarvbon till planens slutdatum nås år 2030.

Projektets partners är

Idrottsförvaltningen i kommunen

Jordbruksverket inom havs-, fiskeri- och vattenbruksprogrammet
    2021--2027.
`,
    totalBudgetSEK: 830550,
    euFundingSEK: 581385,
  },
  {
    id: "scale-exempelstad",
    title: `Scale Exempelstad`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "horizon2020",
    fundName: `Scale Exempelstad ingår i den europeiska satsningen NetZeroCities som finansieras inom EU:s program Horizon 2020.`,
    period: "2021-2027",
    periodLabel: `2024-05-02 till 2026-04-30`,
    role: "owner",
    description_sv: `EU-projektet Scale Exempelstad ska bidra till att stadens ambitiösa
klimatmål nås 2030 och till att förbättra kommuninvånarnas hälsa. I Scale
Exempelstad involverar staden invånare, föreningar och lokala företag för
att accelerera klimatomställningen i Exempelstad.

Exempelstadsdelsförvaltningar, fackförvaltningar och bolag arbetar i
projektet tillsammans med invånare, föreningar och företag för att
utveckla delaktighet, samverkan och lokala åtgärder för att uppnå målet.`,
    totalBudgetSEK: null,
    euFundingSEK: 4684200,
  },
  {
    id: "exempelstads-havsoringsaar-iv",
    title: `Exempelstads Havsöringsåar IV`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "havs-fiskeri",
    fundName: `Havs, fiskeri- och vattenbruksprogrammet 2021--2027`,
    period: "2021-2027",
    periodLabel: `2022-12-03 till 2027-01-25`,
    role: "owner",
    description_sv: `Projektet syftar till bättre kunskap om länets havsöringsförande
vattendrag. Ett underlag för framtida åtgärder ska tas fram.

Målen med projektet är att

genomföra möten och workshops

göra inventeringar

genomföra lekgropsräkning

utveckla och testa skydd mot rovdjur

kartlägga bäverförekomst i vattendrag

restaurera Åvaåns fiskräknare

ta fram ett underlag för framtida åtgärder i havsöringsförande
    vattendrag. 

Projektets partners är

idrottsförvaltningen i kommunen

Jordbruksverket inom havs-, fiskeri- och vattenbruksprogrammet
    2021--2027.
`,
    totalBudgetSEK: 1485337,
    euFundingSEK: 1039736,
  },
  {
    id: "exempelstads-stad-bygger-cirkulart-forstud",
    title: `Exempelstad bygger cirkulärt (förstudie -- ESF)`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "esf",
    fundName: `ESF-rådet`,
    period: "2021-2027",
    periodLabel: `2024-08-12 till 2025-08-11`,
    role: "owner",
    description_sv: `Projektet var en förstudie som kartlade stadens behov kring
kompetensutveckling inom cirkulärt och klimateffektivt byggande.

Förstudien kartlade kompetensutvecklingsbehoven bland medverkande bolag
och förvaltningar med målet om att öka kunskapen och kompetensen inom
stadens organisationer, vilket är en förutsättning för att accelerera
omställning till cirkulärt och klimateffektivt bygganden för att kunna
nå stadens klimatmål.

Resultaten visade att fler yrkesgrupper är relevanta, utöver bygg- och
miljöstöd.`,
    totalBudgetSEK: 1810000,
    euFundingSEK: 1004400,
  },
  {
    id: "taas-tourism-as-a-service",
    title: `TAAS -- Tourism as a Service`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "interreg-europe",
    fundName: `Interreg Europe`,
    period: "2021-2027",
    periodLabel: `2024-04-01 till 2028-03-31`,
    role: "partner",
    description_sv: `I TAAS samverkar bland annat städer, turistbyråer och
forskningsinstitutet. De täcker in hela kedjan av resenärers behov, från
planering till genomförande och reflektion efter resan.

Syftet med projektet är att identifiera åtgärder som kan minska utsläpp
från transporter orsakade av turistaktiviteter i Exempelstad.

TAAS ska också bidra till besöksnäringen i Exempelstads arbete med
klimatomställningen.

Det kan till exempel ske genom

kartläggning av goda exempel och befintliga hinder och barriärer

inventering av möjliga åtgärder och mobilisering av aktörer

workshoppar, studiebesök och andra lokala- och europeiska utbyten.`,
    totalBudgetSEK: 21400000,
    euFundingSEK: 1740000,
  },
  {
    id: "tango-w",
    title: `TANGO-W`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "jpi-urban-europe",
    fundName: `JPI Europe/Energimyndigheten`,
    period: "2021-2027",
    periodLabel: `2022--2025`,
    role: "partner",
    description_sv: `TANGO-W (Transformative cApacity in eNerGy fOod and Water) är ett
tillämpat forsknings- och samverkansprojekt som utforskar vilka
kompetenser som behövs i omställningen till ett mer hållbart samhälle.

I projektet studeras framförallt synergier i gränssnittet mellan energi,
mat och vatten.

Syftet för Sjöstaden är att i en förstudie undersöka hur
urban odling kan öka, genom att identifiera plats och utrymmen för både
stadsbönder och fritidsodlare.

Målet är att få ökad förståelse för hur stadsplaneringen ska kunna ta
höjd för odling.`,
    totalBudgetSEK: null,
    euFundingSEK: 1030000,
  },
  {
    id: "aktiv-fritid-jarva",
    title: `Aktiv Fritid Nordkvarteren`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Svenska ESF-rådet`,
    period: "2021-2027",
    periodLabel: `2026-01-15 till 2028-05-15`,
    role: "owner",
    description_sv: `Aktiv Fritid Nordkvarteren är ett projekt som hjälper barn och unga i Nordkvarteren
    till en meningsfull fritid. Hittills har fritidslotsarna hjälpt
    flera hundra barn att hitta strukturerade, trygga och meningsfulla
    fritidsaktiviteter som passar just dem.

Syftet med projektet Aktiv Fritid Nordkvarteren är att erbjuda en trygg och
    meningsfull fritid för barn och unga bosatta i Nordkvarterens
    stadsdelar i åldrarna 6--17 år som i dag saknar tillgång till
    strukturerade fritidsaktiviteter.`,
    totalBudgetSEK: 4990693,
    euFundingSEK: 4990693,
  },
  {
    id: "digitalt-kompetenslyft",
    title: `Digitalt kompetenslyft`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden`,
    period: "2021-2027",
    periodLabel: `2023-09-01 till 2026-03-31`,
    role: "owner",
    description_sv: `Kulturförvaltningen i kommunen låg vid en mätning i november 2022 tio procentenheter under genomsnittet för landets kommuner i digital mognad. Nästan en tredjedel av medarbetarna använde inte digitala verktyg i det dagliga arbetet, och var tionde medarbetare uppgav begränsade baskunskaper.

Digitalt kompetenslyft finansierades av Svenska ESF-rådet för att höja den digitala kompetensen hos medarbetare inom fem avdelningar och tre staber på kulturförvaltningen (bland annat Stadsbiblioteket, Kulturskolan och Museer och konst), samt en mindre målgrupp hos en grannkommun. Arbetet byggde på individuella självskattningar och utvecklingssamtal, och erbjöd ett brett, behovsanpassat utbud av läraktiviteter — från grundläggande stöd till avancerade utbildningar — inom ett agilt och utforskande arbetssätt.

Projektet överträffade sina kvantitativa mål: den digitala mognaden steg från 40 % till 50,1 % (i nivå med det nationella snittet), och fler medarbetare än planerat deltog med fler utbildningstimmar än väntat. Identifierade framgångsfaktorer var det breda och behovsanpassade lärutbudet, det agila arbetssättet, tvärfunktionell samverkan och starkt engagemang från chefer. Kvarstående utmaningar var tidsbrist i vardagen, varierande digitala förutsättningar mellan medarbetare och tekniska begränsningar i upphandlade system.`,
    totalBudgetSEK: 28000000,
    euFundingSEK: null,
    indicators: [
      { label_sv: `Digital mognad (DiMiOS)`, label_en: `Digital maturity (DiMiOS)`, target: 45, actual: 50.1, unit_sv: `%`, unit_en: `%` },
      { label_sv: `Antal deltagare i kompetenshöjande aktiviteter`, label_en: `Participants in competence-building activities`, target: 1098, actual: 1224, unit_sv: `personer`, unit_en: `people` },
      { label_sv: `Totalt antal utbildningstimmar`, label_en: `Total training hours`, target: 18920, actual: 28237, unit_sv: `timmar`, unit_en: `hours` },
      { label_sv: `Timmar per deltagare (snitt)`, label_en: `Hours per participant (average)`, target: 18, actual: 26, unit_sv: `timmar`, unit_en: `hours` },
    ],
  },
  {
    id: "care-for-ukrainian-refugees",
    title: `Care For Ukrainian Refugees`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska Socialfonden`,
    period: "2021-2027",
    periodLabel: `2022-07-01 till 2023-09-30`,
    role: "owner",
    description_sv: `Projektet stärker stadens mottagande av flyktingar från Ukraina.

Deltagarna kommer att erbjudas frivilliga insatser och information,
exempelvis på boenden eller på Welcome house, stadens verksamhet där
nyanlända får ett samlat stöd.

Insatserna kommer att vara kopplade till arbetsmarknad, hälsa,
samhällsinformation och sociala aktiviteter för att öka deltagarnas
möjligheter att få ett arbete och uppleva en större inkludering i
samhället.

Ett urval av externa samverkanspartners:

Framtidståget

Frälsningsarmén

Rädda barnen

War Child

Care in Change.
`,
    totalBudgetSEK: 17700000,
    euFundingSEK: null,
  },
  {
    id: "kompetensutveckling-for-framtidens-socia",
    title: `Kompetensutveckling för framtidens socialtjänst`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden ESF+`,
    period: "2021-2027",
    periodLabel: `2026-02-02 till 2029-02-01`,
    role: "owner",
    description_sv: `Syftet med projektet är att rusta medarbetare och chefer med nödvändig
kompetens för att möta framtidens socialtjänst.

Socialtjänsten står inför en stor kompetensförsörjningsutmaning
samtidigt som införandet av en ny socialtjänstlag (1 juli 2025) ställer
nya krav på verksamheterna. 

I projektet planeras en utbildningsserie för medarbetare, fördjupade
insatser för nyckelfunktioner och riktad chefsutbildning.

Insatserna ska bidra till att socialtjänsten rustas för att i högre grad
arbeta förebyggande och utifrån individens behov, i enlighet med den nya
socialtjänstlagens intentioner.`,
    totalBudgetSEK: 26131836,
    euFundingSEK: 14238996,
  },
  {
    id: "kompetensutveckling-i-aldreomsorgen",
    title: `Kompetensutveckling i äldreomsorgen`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Socialfonden`,
    period: "2021-2027",
    periodLabel: `2023-09-01 till 2026-09-30`,
    role: "owner",
    description_sv: `Projektets mål är att ta fram en utbildningsmodell avsedd för att
    möta det utbildningsbehov som finns inom äldreomsorgen.

Bakgrunden till projektet är att undersköterska blev en skyddad
    yrkestitel 2023. Projektet består av en utbildningsdel riktad mot
    medarbetare och en del riktad mot chefer/organisationsansvariga.  

`,
    totalBudgetSEK: 60023732,
    euFundingSEK: 32618492,
  },
  {
    id: "kvinnors-etablering",
    title: `Kvinnors etablering`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden, ESF`,
    period: "2021-2027",
    periodLabel: `2023-09-01 till 2026-08-31`,
    role: "owner",
    description_sv: `Projektet Kvinnors etablering har som mål att underlätta inträdet på
    arbetsmarknaden för utrikes födda kvinnor med kort
    utbildningsbakgrund som saknar etablering på svensk arbetsmarknad
    eller har ett långvarigt utanförskap.

Projektet ska bidra till en stärkt samverkan mellan staden och
    Arbetsförmedlingen kring målgruppen och tillsammans med
    civilsamhället identifiera och utveckla insatser för målgruppen. 

Det operativa arbetet utgår från stadens jobbtorg i flera av kommunens ytterområden. Där stöttas varje deltagare av en
    jobbcoach, en arbetsförmedlare och en uppsökare på vägen mot arbete
    eller studier.`,
    totalBudgetSEK: 68870004,
    euFundingSEK: 37189804,
  },
  {
    id: "net-pes",
    title: `NET-PES`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "erasmus",
    fundName: `ERASMUS+`,
    period: "2021-2027",
    periodLabel: `2023-12-01 till 2026-12-01`,
    role: "partner",
    description_sv: `Projektet är ett fördjupat utvärderingsprojekt av arbetsmarknadsinsatser
mellan åtta europeiska partners.

Projektets partners är

Exempelstads arbetsmarknadsförvaltning

Helsingfors stad

Madrid stad

Barcelona stad

Lyon stad

regionen Veneto Lavoro

Arti i Florens

Le forem i Belgien.

Syftet med projektet är att lära av varandra när det gäller att ställa
om arbetsmarknadsinsatserna för att möta den digitala och gröna
omställningen.
`,
    totalBudgetSEK: 4600000,
    euFundingSEK: 632500,
  },
  {
    id: "ratt-kompetens-for-framtidens-socialtjan",
    title: `Rätt kompetens för framtidens socialtjänst`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden+`,
    period: "2021-2027",
    periodLabel: `2024-10-01 till 2025-09-30`,
    role: "owner",
    description_sv: `Projektet är en förstudie vars syfte är att precisera behovet av
kompetensutveckling inom socialtjänsten inför planerad ny
socialtjänstlag.

Bakgrunden till förstudien är att socialtjänsten möter olika utmaningar
och omställningsprocesser, till exempel nya socialtjänstlagen som
planeras träda i kraft den 1 juli 2025. Utifrån detta behöver de
anställda stärkas genom kompetensutveckling, för att skapa goda
förutsättningar för en långsiktigt god kompetensförsörjning.  

Syftet med förstudien är att precisera vilka
kompetensutvecklingsinsatser som behövs, vilka grupper av medarbetare
och chefer som kommer att behöva vilken typ av kompetensutveckling och
hur dessa ska genomföras och organiseras.`,
    totalBudgetSEK: 1844700,
    euFundingSEK: 996138,
  },
  {
    id: "starka-skyddsfaktorer-hos-nyanlanda-fami",
    title: `Stärka skyddsfaktorer hos nyanlända familjer i Västerkvarteren`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "amif",
    fundName: `AMIF, Asyl- Migrations- och Integrationsfonden, programperiod 2021--2027`,
    period: "2021-2027",
    periodLabel: `2025-01-01 till 2027-06-30`,
    role: "owner",
    description_sv: `Västerkvarteren stadsdelsförvaltning arbetar för att alla barn och
unga ska få en meningsfull fritid. Utöver fritidsaktiviteter och ett
rikt föreningsliv erbjuder stadsdelsförvaltningen ett stort utbud av
föräldrastödjande insatser för att stärka föräldrar.

Projektet Stärka skyddsfaktorer hos nyanlända familjer i
Västerkvarteren, som är medfinansierat av Europeiska unionen genom
Asyl-, migrations- och integrationsfonden (AMIF), ska stärka
skyddsfaktorer hos nyanlända barn i Västerkvarteren. Detta genom att
utveckla och implementera beprövade metoder för att tidigt nå nyanlända
familjer med föräldrastöd och fritidsaktiviteter.`,
    totalBudgetSEK: 8431829,
    euFundingSEK: 7588646,
  },
  {
    id: "triangle-for-ukrainian-artists",
    title: `Triangle for Ukrainian Artists`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "kreativa-europa",
    fundName: `Kreativa Europa`,
    period: "2021-2027",
    periodLabel: `Se projektsida`,
    role: "partner",
    description_sv: `Projektet syftar till att stötta ukrainska konstnärer, främst
dramatiker, under kriget och efter kriget genom att skapa långsiktiga
kontakter och samarbeten mellan Ukraina, Polen och Sverige.

Projektpartners är

Kulturhuset Stadsteatern (Sverige)

Theatre of Playwrights (Ukraina)

Rikstolvan (Sverige)

Villa Decius (Polen).

Projektet möjliggör att ukrainska dramatiker fortsätter sitt arbete
genom skrivarresidens hos Rikstolvan Konst i Skåne. De får ekonomiskt
stöd, möjligheter till nätverkande och mentorskap.

Inom projektet beställs nya pjäser av ukrainska dramatiker, som
översätts till svenska och sprids bland annat online.`,
    totalBudgetSEK: null,
    euFundingSEK: null,
  },
  {
    id: "ung-kraft-jarva-din-vag-mot-sysselsattni",
    title: `Ung kraft Nordkvarteren -- din väg mot sysselsättning`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `EFS-rådet (PO C -- Ekonomisk utsatthet -- Unga vuxna 18--29 år)`,
    period: "2021-2027",
    periodLabel: `2024-04-22 till 2027-04-21`,
    role: "owner",
    description_sv: `Projektmål: Stärkta möjligheter för unga vuxna 18--29 år i Nordkvarterens stadsdelar att ta aktiv del av samhällslivet inklusive studier och
arbete.

Projektets målgrupp är unga vuxna mellan 18 och 29 år som lever i
relativ fattigdom bosatta i Nordkvarterens stadsdelar.

Av dessa är följande särskilt prioriterade i projektet: 

Unga utrikes födda kvinnor/kvinnor med utomeuropeisk bakgrund.

Unga kvinnor med barn.

Unga individer med erfarenhet av samhällsvård.

unga individer med psykisk ohälsa och/eller nedsatt
    funktionsförmåga.

Projektet avser att undanröja hinder som finns för målgruppen att
tillgodogöra sig de möjligheter som finns för att ta steget mot arbete
eller studier.`,
    totalBudgetSEK: 9996311,
    euFundingSEK: null,
  },
  {
    id: "rescue",
    title: `RESCUE`,
    organisation: "Exempelstad",
    theme_sv: `Näringslivsfrämjande insatser`,
    theme_en: `Business development initiatives`,
    programId: "horizon",
    fundName: `HORIZON`,
    period: "2021-2027",
    periodLabel: `2025-09-01 till 2028-08-31`,
    role: "partner",
    description_sv: `RESCUE-projektet syftar till att stärka motståndskraften, säkerheten
    och anpassningsförmågan hos kritiska infrastruktursystem.

RESCUE står för "Resilient Edge Systems for Critical Infrastructure
    and Urban Environments". RESCUE-projektet använder avancerad edge
    computing, AI-driven avvikelsedetektering och robusta
    kommunikationsnätverk för att förbättra infrastrukturens säkerhet
    och flexibilitet.

Projektet leds av Sveriges forskningsinstitut RISE härifrån
    Sverige. 

Samarbetspartners: Exempelstad ingår i en grupp av 12 företag och organisationer
    från Tyskland, Nederländerna, Spanien och Schweiz. Från Sverige
    ingår också Västra Götalandsregionen.
`,
    totalBudgetSEK: null,
    euFundingSEK: null,
  },
  {
    id: "exempelstad-archipelago-trail",
    title: `Exempelstad Archipelago Trail`,
    organisation: "Exempelstad",
    theme_sv: `Näringslivsfrämjande insatser`,
    theme_en: `Business development initiatives`,
    programId: "landsbygdsprogrammet",
    fundName: `Landsbygdsprogrammet`,
    period: "2021-2027",
    periodLabel: `2023-04-01 till 2025-03-31`,
    role: "owner",
    description_sv: `Projektets mål är en vandringsled längs Nord-Sydlinjen genom Exempelstads
skärgård.

Syftet med projektet är att anlägga en vandringsled, SAT Exempelstad
Archipelago Trail, på öarna längs båtlinjen Nord-Sydlinjens sträckning
genom Exempelstads skärgård som förlänger säsongen för besöksnäringen på
öarna och skapar samverkan i närområdet.

Målet med projektet är att etablera en 270 kilometer lång led på 19
etapper/öar som kvalitetssäkras i enlighet med det nationella ramverket
för vandringsleder. Leden skapar en stark samverkan som ger hållbara
förutsättningar för att kunna förlänga säsongen för naturintresserade
besökare och därmed en mer levande skärgård året runt.`,
    totalBudgetSEK: 6941940,
    euFundingSEK: 6941940,
  },
  {
    id: "city-memories-visualizing-change-in-thre",
    title: `City Memories -- Visualizing change in three Europan capitals`,
    organisation: "Exempelstad",
    theme_sv: `Digitalisering och utveckling av stadens välfärdstjänster`,
    theme_en: `Digitalisation and development of city welfare services`,
    programId: "kreativa-europa",
    fundName: `Kreativa Europa`,
    period: "2021-2027",
    periodLabel: `2023-02-01 till 2024-11-30`,
    role: "owner",
    description_sv: `I projektet samarbetar experter inom stadshistoria, kulturarv och
arkitektur för att ta fram nya metoder att utforska och tillgängliggöra
historiska byggnadsritningar.

Medborgarinvolvering, hållbarhet och inkludering har varit viktiga
utgångspunkter i projektets arbete.

Stadsarkiven i Exempelstad är koordinator för projektet som drivs
tillsammans med

stadsarkiven i Köpenhamn

stadsarkiven i Budapest.

Projektet samverkar också med

Det Kongelige Akademi

Ybl Miklós Architectural Faculty vid Óbuda University

Contemporary Architecture Centre i Budapest (KÉK)

Università Politecnica delle Marche i Ancona.`,
    totalBudgetSEK: 2839823,
    euFundingSEK: 941816,
  },
  {
    id: "civitas-eccentric",
    title: `Civitas Eccentric`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "horizon2020",
    fundName: `Horisont 2020`,
    period: "2014-2020",
    periodLabel: `2016-09-01 till 2020-08-31`,
    role: "partner",
    description_sv: `Civitas Eccentric främjar innovativa lösningar inom mobilitetsområdet
som bidrar till stadens arbete för ett mer klimatsmart och hållbart
Exempelstad. Fokus är att utveckla formerna för att resa och transportera
varor.

Projektet lyfter fram åtgärder som främjar hållbar mobilitet och
transportlösningar i stadsnära ytterområden i fem europeiska städer.
Tolv demonstrationsprojekt genomförs i Exempelstad med syftet att stödja
utvecklingen av kommunikationslösningar, exempelvis

mobilitetstjänster

testflottar för el-lastcyklar och elskåpbilar

förbättringar inom kollektivtrafiken.`,
    totalBudgetSEK: 189602019,
    euFundingSEK: null,
  },
  {
    id: "fossilfritt-2030-exempelstad",
    title: `Fossilfritt 2030 Exempelstad`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "erdf",
    fundName: `Europeiska regionalfonden, ERUF, via Tillväxtverket`,
    period: "2014-2020",
    periodLabel: `2020-01-01 till 2023-10-21`,
    role: "partner",
    description_sv: `Fossilfritt 2030 är en kraftsamling i regionen som syftar till att
växla upp och underlätta omställningen till fossilfria transporter så
att 2030-målet för transportsektorn kan nås.

Målet för Fossilfritt 2030 är att de deltagande kommuner ska uppnå en
fossiloberoende fordonsflotta före år 2030 och därigenom även underlätta
näringslivets och allmänhetens omställning.

Inom projektet deltar miljöförvaltningen med operativt stöd och
rådgivning inom staden och till medverkande kommuner gällande

omställningen av fordon

drivmedel

infrastruktur för förnybara drivmedel

delad mobilitet.`,
    totalBudgetSEK: 7549000,
    euFundingSEK: null,
  },
  {
    id: "frevue-freight-electric-vehicles-in-urba",
    title: `Frevue, Freight Electric Vehicles in Urban Europe`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "fp7",
    fundName: `FP7`,
    period: "2014-2020",
    periodLabel: `2013-03-15 till 2017-09-14`,
    role: "partner",
    description_sv: `Frevue, Freight Electric Vehicles in Urban Europé, främjar innovativa
lösningar för elektrifieringen av logistikverksamhet i stadsmiljö.

I Exempelstad testas olika lösningar för tunga och lätta lastbilar.
Målsättningen är att de lösningar som projektet identifierar ska bidra
till stadens arbete för en hållbar urban utveckling.

Projektet ska visa på hur elgodstransporter kan bli en naturlig del av
en urban logistikverksamhet. I dagsläget är det få företag som har
kunskap om laddfordon och en målsättning med projektet är därför att
marknadsföra användningen av olika former av eltransporter för urbana
godsleveranser.`,
    totalBudgetSEK: 1353120574,
    euFundingSEK: null,
  },
  {
    id: "grow-smarter",
    title: `Grow Smarter`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "horizon2020",
    fundName: `Horisont 2020`,
    period: "2014-2020",
    periodLabel: `2015-01-01 till 2019-12-30`,
    role: "owner",
    description_sv: `GrowSmarter utvecklar smarta miljö- och klimatlösningar för att stärka
städers arbete för en hållbar stadsutveckling. Målsättningen är att
kommuninvånarnas livskvalitet förbättras samtidigt som akademi och
näringsliv får möjlighet att testa innovationer inom området.

Exempelstad leder och deltar i projektet med tolv smarta lösningar i
Årsta och Slakthusområdet.

Genom projektet samarbetar staden med ytterligare sju europeiska
storstäder för att erbjuda miljöteknikföretag testningsmöjligheter för
smarta lösningar som bidrar till hållbar urban tillväxt. Lösningarna ska
förbättra stadens arbete för att möta utmaningar inom energi-,
infrastruktur- och transporterområdet.`,
    totalBudgetSEK: 250000000,
    euFundingSEK: null,
  },
  {
    id: "life-aspire",
    title: `Life Aspire`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "life",
    fundName: `Life +`,
    period: "2014-2020",
    periodLabel: `2017-10-01 till 2021-09-30`,
    role: "partner",
    description_sv: `Life Aspire stärker stadens arbete med hållbara logistik och
mobilitetslösningar.

Genom att utveckla smarta system som gör det enkelt och
kostnadseffektivt för leverantörer att till exempel leverera på ett mer
miljövänligt sätt ska projektet bidra till stadens klimatambitioner.

Projektet leds av staden Lucca i Italien där ett
tillträdeskontrollsystem (app) ska implementeras och utvärderas.
Systemet ska göra det enklare att göra rätt.

Transportörer som kör in i en stads centrala delar får poäng baserat på

vilka tider de kör in

vilket typ av fordon de använder

hur de på andra sätt bidrar till bättre miljö/klimat/framkomlighet.`,
    totalBudgetSEK: null,
    euFundingSEK: null,
  },
  {
    id: "meister",
    title: `Meister`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "horizon2020",
    fundName: `Horizon 2020`,
    period: "2014-2020",
    periodLabel: `2018-09-01 till 2022-02-28`,
    role: "partner",
    description_sv: `Meister är ett project för utveckling av laddinfrastruktur för
elbilsladdning

Meister är en förkortning av:

Mobility

Environmentally-friendly,

Integrated and economically

Sustainable

Through innovative

Electromobility

Recharging infrastructure and new business models.

Projektet uppvisar lösningar och affärsmodeller som möjliggör
utvecklingen av laddinfrastruktur och bidrar till en elektrifierad
fordonsflotta i Europa. Projektet koordineras av ett spanskt
konsultbolag, ETRA, och har totalt 11 deltagare, däribland städerna
Berlin och Malaga samt forskningsinstitutet RISE Viktoria.`,
    totalBudgetSEK: null,
    euFundingSEK: null,
  },
  {
    id: "nextgenlink",
    title: `NextGenLink`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "cef",
    fundName: `Fonden för ett sammanlänkat Europa (CEF)`,
    period: "2014-2020",
    periodLabel: `2017-02-07 till 2020-06-30`,
    role: "partner",
    description_sv: `NextGenLink utvecklar den existerande maritima länken mellan Sverige och
Finland för att på så sätt bidra till mer klimatvänliga sjötransporter
på Östersjön.

Projektet uppgraderar sjöfartsförbindelsen mellan
Åbo-Mariehamn-Exempelstad med ett nytt LNG-fartyg samt förbättringar i
hamnarnas infrastruktur.

Förbindelsen Åbo-Exempelstad ligger på den så kallade
Scandinavian-Mediterranean Core Network Corridor, en korridor av
transportinfrastruktur som EU har pekat ut som särskilt prioriterad inom
ramen för det transeuropeiska transportnätverket, TEN-T.`,
    totalBudgetSEK: 7365000000,
    euFundingSEK: null,
  },
  {
    id: "nezer",
    title: `NeZeR`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "iee",
    fundName: `Intelligent Energi (IEE)`,
    period: "2014-2020",
    periodLabel: `2014-03-01 till 2017-02-28`,
    role: "partner",
    description_sv: `NeZeR stödjer genomförandet av omfattande energieffektiviseringar i
befintliga byggnader. På så sätt ska byggnader efter renovering nå en så
hög energiprestanda som möjligt, så kallad nära-noll-nivå.

Genom att visa upp tekniska lösningar och stödja varandra vid analyser
kan deltagande städer ta steg mot en mer hållbar stadsutveckling.

Projektet främjar samarbeten mellan olika aktörer under hela
byggprocessen för att öka medvetenheten om fördelarna med
energieffektiviseringar av byggnader till nära-noll-nivå. Under
projektets gång delar Exempelstad med sig av erfarenheterna från
energieffektiviseringsprojekt inom ramen för projekten Hållbara Nordkvarteren
och GrowSmarter.`,
    totalBudgetSEK: null,
    euFundingSEK: null,
  },
  {
    id: "nonhazcity",
    title: `NonHazCity`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "interreg-baltic-sea",
    fundName: `Östersjöprogrammet`,
    period: "2014-2020",
    periodLabel: `2016-03-01 till 2019-02-01`,
    role: "owner",
    description_sv: `NonHazCity bidrar till utvecklingen av den kemikaliesmarta staden där
projektet belyser hur kemikalieanvändningen ser ut bland olika aktörer i
en stad samt hur användningen kan minska.

Syftet är att sprida kunskap om farliga ämnen samt vad kommuner, företag
och enskilda kan göra för att minska utsläpp och exponering.

Målsättningen är att mängden skadliga ämnen som tillförs Östersjön ska
minska och projektet riktar sig bland annat till invånare samt små och
medelstora företag.

I Exempelstad genomförs exempelvis analyser av avloppsvatten och olika
informationskampanjer, men staden delar också lärande exempel kring hur
städer kan arbeta för en minskad kemikalieanvändning.`,
    totalBudgetSEK: 34780447,
    euFundingSEK: null,
  },
  {
    id: "prosfet",
    title: `Prosfet`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "horizon2020",
    fundName: `Horisont 2020`,
    period: "2014-2020",
    periodLabel: `2017-01-01 till 2019-12-31`,
    role: "partner",
    description_sv: `Prosfet bidrar till arbetet för att utveckla hållbara transporter i
urbana miljöer. Projektet identifierar lokala myndigheters
planeringsbehov och utvecklingsbehov när det gäller transporter och
stadslogistikaktiviteter.

Med en ökande befolkning i urbana områden kommer flera
hållbarhetsutmaningar inom transportområdet. Servicetjänster inom frakt
och leveranser står för en stor del av befintlig infrastruktur och
särskilda satsningar behöver därför riktas mot området för att nå målet
om en hållbar stadsutveckling.

Projektet identifierar lokala beslutsfattandes planeringsbehov samt
möjliggör ett erfarenhetsutbyte inom området tillsammans med andra
samverkanspartners.`,
    totalBudgetSEK: 2068092,
    euFundingSEK: null,
  },
  {
    id: "smartimpact",
    title: `SmartImpact`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "urbact",
    fundName: `URBACT`,
    period: "2014-2020",
    periodLabel: `2016-05-02 till 2018-06-01`,
    role: "partner",
    description_sv: `Genom SmartImpact kan tio städer dela erfarenheter av att arbeta med
Smart stad-konceptet, från planering till finansiering och
implementering.

Med hjälp av en smartare användning av data är målsättningen att
projektet ska bidra till en mer hållbar stadsutveckling där fler aktörer
kan vara del av beslutsprocessen.

Projektet ser bland annat över hur data tillhandahålls, vilka
beslutsprocesser som påverkar arbetet och hur städer kan underlätta
användningen genom olika finansieringsmodeller och upphandlingar.
Dessutom undersöker projektet hur tillståndsprocesser kan förenklas och
hur städer kan skapa lokala ekosystem för innovationsfrågor.`,
    totalBudgetSEK: 904382,
    euFundingSEK: null,
  },
  {
    id: "the-northern-scanmed-ports-sustainable-m",
    title: `The Northern ScanMed Ports -- Sustainable Maritime Links`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "cef",
    fundName: `Fonden för ett sammanlänkat Europa (CEF)`,
    period: "2014-2020",
    periodLabel: `2014-01-01 till 2016-12-31`,
    role: "partner",
    description_sv: `Projektet The Northern ScanMed Ports -- Sustainable Maritime Links
bidrar till en effektiviserad och förbättrad energianvändning i hamnar
och på båttransporter.

Staden samarbetar med flera internationella aktörer för att utveckla
miljötjänster riktade mot hamnverksamhet och minska miljöpåverkan från
trafiken på Östersjön. På så sätt ska resan från land till hav bli mer
hållbar.

Genom projektet undersöker deltagarna hur de på ett bättre sätt kan
tillhandahålla alternativa bränslen samt infrastruktur för att stimulera
användningen av just alternativt bränsle. Inom ramen för projektet
installeras el-anslutningar, så kallade Onshore power supply (OPS), samt
olika faciliteter för avloppsvatten.`,
    totalBudgetSEK: 79542000,
    euFundingSEK: null,
  },
  {
    id: "urban-learning",
    title: `Urban Learning`,
    organisation: "Exempelstad",
    theme_sv: `Klimat, miljö och mobilitet`,
    theme_en: `Climate, environment and mobility`,
    programId: "horizon2020",
    fundName: `Horisont 2020`,
    period: "2014-2020",
    periodLabel: `2015-03-01 till 2017-11-30`,
    role: "partner",
    description_sv: `Urban Learning är ett projekt där flera stora europeiska städer utbyter
erfarenheter och delar goda exempel kring olika
stadsplaneringsprocesser, bland annat kring integrerad energiplanering i
urbana områden.

Med en ökande befolkningstillväxt står många städer inför stora
utmaningar med att erbjuda hållbara och prisvärda bostäder och
infrastruktur. För att nå högt uppsatta energi- och klimatmål, och
samtidigt hålla nere kostnaderna, krävs därför ett fungerande samarbete
mellan viktiga aktörer inom energiförsörjningsområdet.

Målet är att utveckla tekniska energilösningar samt instrument och
verktyg för energifrågor i samband med stadsplanering.`,
    totalBudgetSEK: 20283210,
    euFundingSEK: null,
  },
  {
    id: "action-gallery",
    title: `Action Gallery`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "erasmus",
    fundName: `Erasmus+`,
    period: "2014-2020",
    periodLabel: `2016-09-17 till 2017-08-20`,
    role: "partner",
    description_sv: `Genom projektet Action Gallery får unga kommuninvånare i åldern 18--30
    år tillsammans med unga från andra europeiska städer använda kultur
    för att illustrera en europeisk gemenskap och de möjligheter som
    EU:s sektorsprogram Erasmus+ kan erbjuda.

Projektdeltagarna är medskapare vid en större utställning samt
    genomför olika aktiviteter på Exempelstads gymnasium och i samverkan
    med kulturorganisationer.

Målsättningen är att fler unga ska få kännedom om
    kulturförvaltningens verksamheter samt de möjligheter som EU:s
    program medför för Europas unga.
`,
    totalBudgetSEK: 324060,
    euFundingSEK: null,
  },
  {
    id: "battre-halsa",
    title: `Bättre hälsa`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `FEAD Europeiska socialfonden`,
    period: "2014-2020",
    periodLabel: `2015-10-10 till 2018-06-15`,
    role: "partner",
    description_sv: `Bättre Hälsa stärker utsatta kvinnors förutsättningar för social
delaktighet och egenmakt. Målgruppen är kvinnor som är EU-medborgare och
som befinner sig i Exempelstad, men som försörjer sig i gatumiljö.

Majoriteten av målgruppen är romska kvinnor från Central- och Östeuropa.

I mindre grupper kan kvinnorna dela personliga erfarenheter med andra
kvinnor. Samtalsgrupperna fungerar även som forum för deltagarna att
diskutera frågor som rör hälsa och andra behov som påverkar det egna
välbefinnandet.`,
    totalBudgetSEK: 8755663,
    euFundingSEK: null,
  },
  {
    id: "come-2-join-us",
    title: `Come 2 Join Us`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "erasmus",
    fundName: `Erasmus+`,
    period: "2014-2020",
    periodLabel: `2016-02-01 till 2017-11-30`,
    role: "owner",
    description_sv: `Come 2 Join Us följer upp stadens tidigare projekt Come Join Us, med
syfte att ge Exempelstads unga kulturella erfarenheter och möjlighet att
uttrycka sig genom olika konstformer oavsett bakgrund och hur deras
livssituation ser ut.

Deltagande städer utvecklar olika metoder och kommunikationsverktyg för
att nå ungdomar som vanligtvis inte tar del av den egna kulturella
verksamheten.

Den långsiktiga målsättningen är att stärka människors egenmakt och
deltagande i samhället samt inspirerar dem att vara del av kulturella
verksamheter.

Externa partners är

Ash Wales

Keski-Uudenmaan koulutuskuntayhtymä

Bochums Stadt

Maison de l\\'Europe Bordeaux-Aquitaine.
`,
    totalBudgetSEK: 1384129,
    euFundingSEK: null,
  },
  {
    id: "come-join-us",
    title: `Come Join Us`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "erasmus",
    fundName: `Erasmus+`,
    period: "2014-2020",
    periodLabel: `2016-02-01 till 2017-11-30`,
    role: "owner",
    description_sv: `Come Join Us utvecklar arbetsformerna hos olika yrkesgrupper inom
offentlig sektor som arbetar nära unga, exempelvis kulturskolans lärare
och ungdomsledare, i deras arbete med att stärka ungas egenmakt.

Genom olika former av erfarenhetsutbyten ska projektet bidra till att de
deltagande städerna utvecklar sitt arbete för att nå ungdomar i ålder
13--22 år från socioekonomiskt utsatta områden.

Aktiviteterna anpassas utifrån målgruppens behov och önskemål där den
långsiktiga målsättningen är att stärka människors deltagande i
samhället samt inspirera dem att vara del av olika kulturella
verksamheter. Projektet ska även utveckla de deltagande städernas
kapacitet att ta emot ungdomsvolontärer.`,
    totalBudgetSEK: 1557481,
    euFundingSEK: null,
  },
  {
    id: "creating-workshops-in-disadvantaged-area",
    title: `Creating workshops in disadvantaged areas`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "erasmus",
    fundName: `Erasmus+`,
    period: "2014-2020",
    periodLabel: `2016-05-02 till 2017-09-01`,
    role: "owner",
    description_sv: `Inom ramen för projektet Creating workshops in disadvantaged areas
    arbetar två volontärer med unga kommuninvånare i åldrarna 13--22 år
    från socioekonomiskt från utsatta områden.

Volontärerna genomför olika workshops för att stärka de deltagande
    ungdomars egenmakt. Arbetet sker i nära kontakt med lärare vid
    Kulturskolan Exempelstad.

Externa samverkanspartners är ungdomsorganisationer i de tyska
    städerna Karlsruhe och Wuerttemberg.
`,
    totalBudgetSEK: 139526,
    euFundingSEK: null,
  },
  {
    id: "entreprenor-i-sverige",
    title: `Entreprenör i Sverige`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden`,
    period: "2014-2020",
    periodLabel: `2018-01-02 till 2020-12-31`,
    role: "partner",
    description_sv: `Entreprenör i Sverige utvecklar stadens sfi-undervisningen på B-nivå för
att få ett tydligare fokus på entreprenöriella färdigheter och
kunskaper.

Deltagarna får ta del av olika förberedande insatser som utgår från
inspiration, idéutveckling samt förståelse för företagande.

Genom projektet förbereds deltagarna inför och slussas vidare till
affärs- och innovationsrådgivning under en tidig fas i etableringen för
nyanlända. Projektet har ett särskilt mål att nå nyanlända kvinnor.

Staden leder samverkansprojektet där åtta kommuner i regionen
samverkar för att stärka deltagarnas möjligheter till egenförsörjning.`,
    totalBudgetSEK: 11629785,
    euFundingSEK: null,
  },
  {
    id: "hallbar-etablering",
    title: `Hållbar etablering`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden, ESF`,
    period: "2014-2020",
    periodLabel: `2019-08-01 till 2022-06-30`,
    role: "owner",
    description_sv: `Hållbar Etablering utvecklar arbetet med att ge ett samlat och
holistiskt stöd för nyanlända.

Projektet drivs av arbetsmarknadsförvaltningen i kommunen i
samarbete med

socialförvaltningen (genom Intro Exempelstad)

Arbetsförmedlingen

Region Exempelstad.

Projektet medfinansieras av Europeiska socialfonden (ESF).

Lärdomar från projektet ska ligga till grund för ett Etableringscentrum
inom staden. Målsättningen är att projektdeltagarna ska fullfölja
aktiviteter som leder till en hållbar etablering och förankring på
arbetsmarknaden och i samhället. Ett fokusområde är digitalisering där
deltagarna erbjuds olika kompetenshöjningsinsatser.`,
    totalBudgetSEK: 38600000,
    euFundingSEK: null,
  },
  {
    id: "imotole",
    title: `IMoToLe`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "erasmus",
    fundName: `Erasmus+`,
    period: "2014-2020",
    periodLabel: `2017 till 2019`,
    role: "partner",
    description_sv: `IMoToLe bidrar till att utveckla kulturskolans arbete för att nå
    målgruppen nyanlända kommuninvånare samt utveckla den egna
    verksamheten i enlighet med målgruppens behov.

Målsättningen är att fler inom målgruppen ska delta i kulturskolans
    verksamheter samtidigt som individens egenmakt stärks.

Genom workshops riktade mot nyanlända och asylsökande boende i
    stadens socioekonomiskt utsatta ytterstadsområden ska projektet
    utarbeta nya metoder och arbetssätt. Projektet inleds med en studie
    kring vad som motiverade målgruppen vilket följds upp av en process
    för att ta fram en handlingsplan och en interaktiv plattform som
    samlar goda exempel på metoder inom området.`,
    totalBudgetSEK: null,
    euFundingSEK: null,
  },
  {
    id: "nystart-exempelstad",
    title: `Nystart Exempelstad`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden`,
    period: "2014-2020",
    periodLabel: `2018-01-02 till 2020-12-31`,
    role: "owner",
    description_sv: `Nystart Exempelstad stödjer nyanlända ungdomar i åldern 15--19 år med
bristfällig skolbakgrund under deras första år på
språkintroduktionsprogrammet på gymnasiet.

Syftet är att ta fram långsiktiga metoder för att stödja nyanlända
ungdomar att nå en gymnasieexamen.

Under projektet utarbetar staden en gemensam organisation för
mottagandet av nyanlända till grundskola och gymnasiet. Målet med en
sådan organisation är att stärka ett likvärdigt mottagande för den
enskilde och effektivisera stadens egen organisation.

Projektet har ett särskilt fokus på att arbeta utifrån ett
jämställdhetsperspektiv och ska vara extra tillgängligt för unga
kvinnor.`,
    totalBudgetSEK: 15002638,
    euFundingSEK: null,
  },
  {
    id: "ratt-stod-for-mig",
    title: `Rätt stöd för mig`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden/Svenska ESF-rådet`,
    period: "2014-2020",
    periodLabel: `2019-09-01 till 2022-06-30`,
    role: "partner",
    description_sv: `Rätt stöd för mig är till för ungdomar och vuxna (16-35 år) som står
    långt från arbetsmarknaden och behöver extra mycket stöd för att
    komma vidare.

I projektet ingår fem insatser inom regionen där personalen
    utgår från individens egna intressen i planeringen mot arbete eller
    studier.

Målsättningen är att bygga en förtroendefull relation och en
    planering som håller i längden. Projektidén handlar om att hitta
    välfungerande sätt att ge stöd och insatser och att skapa en hållbar
    och effektiv samverkansstruktur kring målgruppen.`,
    totalBudgetSEK: 48116682,
    euFundingSEK: null,
  },
  {
    id: "samverkan-for-okad-skolnarvaro",
    title: `Samverkan för ökad skolnärvaro`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden`,
    period: "2014-2020",
    periodLabel: `2020-02-01 till 2022-06-30`,
    role: "owner",
    description_sv: `Projektet bidrar till ökad samverkan och stöd till elever i årskurs 8
och 9 med upprepad eller längre skolfrånvaro.

Fler elever ska öka sin närvaro, nå utbildningsmålen i grundskolan och
få behörighet till gymnasiet. Totalt 200 elever kommer att erbjudas stöd
under projekttiden.

Stärkt samverkan ska leda till ökad samsyn kring vikten av tidiga
förebyggande närvarofrämjande insatser. Uppdraget är att i nära
samarbete med grundskolan, elevhälsan i grundskolan och befintliga
skolsociala team, förstärka och komplettera befintliga insatser för att
minska skolfrånvaro.`,
    totalBudgetSEK: 14786978,
    euFundingSEK: null,
  },
  {
    id: "sprakutveckling-granada",
    title: `Språkutveckling Granada`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "erasmus",
    fundName: `Erasmus+`,
    period: "2014-2020",
    periodLabel: `2016-06-01 till 2017-05-31`,
    role: "owner",
    description_sv: `Genom projektet Språkutveckling Granada utforskas vilken roll
    förskolor spelar i integrationsprocessen för nyanlända barn.

Med hjälp av olika former av erfarenhetsutbyten kan personal dela
    goda exempel på metoder och arbetssätt för att stärka det
    pedagogiska arbetet i flerspråkiga förskolegrupper.

Extern samverkanspartner är Granada stad.
`,
    totalBudgetSEK: 280459,
    euFundingSEK: null,
  },
  {
    id: "spangen",
    title: `Spången`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `ESF`,
    period: "2014-2020",
    periodLabel: `2018-09-01 till 2022-06-30`,
    role: "owner",
    description_sv: `Spången är ett jobbrotationsprojekt. Syftet är att kompetensutveckla
    medarbetare inom stadens identifierade bristyrkesområden med
    språklig och formell yrkeskompetens.

Bristyrkesområdena är förskola, äldreomsorg och
    funktionshinderomsorg. Arbetsgivare har möjlighet att utan kostnad
    utbilda medarbetarna som saknar formell utbildning till barnskötare
    eller vårdbiträde.

Inom ramen för projektet erbjuds kompetensutveckling motsvarande
    grundläggande barnskötarutbildning (900 poäng) alternativt
    vårdbiträdesutbildning (800 poäng).

Utbildningarna ges som uppdragsutbildningar med språk- och it-stöd
    inom den gymnasiala vuxenutbildningen på Campus Åsö.`,
    totalBudgetSEK: 30700000,
    euFundingSEK: null,
  },
  {
    id: "susa-exempelstads-unga-studerar-eller-arbe",
    title: `SUSA -- Exempelstads unga studerar eller arbetar`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden (ESF)`,
    period: "2014-2020",
    periodLabel: `2015-09-01 till 2019-08-30`,
    role: "owner",
    description_sv: `SUSA - Exempelstads unga studerar eller arbetar, samordnar riktade
insatser till unga i 15-19 åringar som står långt ifrån arbetsmarknaden
och riskerar att inte fullfölja studier på gymnasienivå.

Genom ett preventivt arbete är målsättningen att bygga broar mellan
grundskola och gymnasium för på så sätt minska antalet individer som
hoppar av gymnasiet utan fullständiga betyg.

SUSA ger kunskap om hur stort behovet är av förstärkta individuella
insatser för målgruppen samt vilka ytterligare insatser som kan bidra
till att fler ungdomar väljer ett gymnasieprogram som de har intresse
och förutsättningar för.`,
    totalBudgetSEK: 27407571,
    euFundingSEK: null,
  },
  {
    id: "suvas-exempelstads-unga-vuxna-arbetar-elle",
    title: `SUVAS - Exempelstads unga vuxna arbetar eller studerar`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden (ESF)`,
    period: "2014-2020",
    periodLabel: `2015-09-01 till 2019-08-30`,
    role: "owner",
    description_sv: `SUVAS - Exempelstads unga vuxna arbetar eller studerar utvecklar och
utökar Jobbtorg Exempelstads uppsökande och motiverande arbete.

Verksamheten riktas mot målgruppen personer som är 20--29 år och som
inte studerar, arbetar eller innehar en känd aktivitet. Målsättningen är
att unga kommuninvånare ska ta ett steg närmare arbetsmarknaden.

Det uppsökande arbetet riktar sig till samtliga i målgruppen i
Exempelstad, men med särskilt fokus på att utveckla och förstärka arbetet
i socioekonomiskt utsatta områden samt få fler unga kvinnor i
arbetsfrämjande insatser.

De insatser som erbjuds inom ramen för projektet kommer att anpassas
utifrån den deltagande individers behov.`,
    totalBudgetSEK: 39284854,
    euFundingSEK: null,
  },
  {
    id: "sverige-bygger-nytt",
    title: `Sverige bygger nytt`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden (ESF)`,
    period: "2014-2020",
    periodLabel: `2016-08-01 till 2019-07-31`,
    role: "partner",
    description_sv: `Byggindustrin i regionen är i stort behov av arbetskraft
samtidigt som det finns ett stort antal arbetssökande kommuninvånare.

Under projektet Sverige bygger nytt utvecklar berörda aktörer i
Exempelstad olika modeller för att erbjuda

kompetensvalidering

språkstöd på arbetsplatserna

arbetsplatsförlagt lärande

värdegrundsarbete

positiva förebilder.

Projektet har som målsättning att deltagarna kommer närmare
arbetsmarknaden samtidigt som staden och berörda myndigheter utvecklar
nya metoder och arbetssätt för en ökad inkludering på arbetsmarknaden.`,
    totalBudgetSEK: 65309394,
    euFundingSEK: null,
  },
  {
    id: "esf-projektet-syven",
    title: `ESF-projektet SYVen`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden (ESF)`,
    period: "2014-2020",
    periodLabel: `18-09-01 till 21-12-31`,
    role: "owner",
    description_sv: `ESF-projektet SYVen erbjöd kompetenshöjning för studie- och
    yrkesvägledare för att ge dem verktyg och kunskap för att anpassa
    vägledningsmetoder efter den sökandes behov.

Målet med ESF-projektet SYVen var att studie- och yrkesvägledare ska
    leda fler kortutbildade till studier vilket kan leda till en hållbar
    etablering på arbetsmarknaden.

Inom ramen för projektet studerades vägledningsmetoder från andra
    länder i Europa. Utifrån denna omvärldsanalys samt utifrån
    verksamheternas och individernas behov testades flera olika verktyg,
    exempelvis flera utbildningsinsatser och möjlighet till
    jobbskuggning.`,
    totalBudgetSEK: 5186856,
    euFundingSEK: null,
  },
  {
    id: "valj-inkludering-delaktighet-och-aktivit",
    title: `Välj inkludering delaktighet och aktivitet (VIDA)`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "amif",
    fundName: `Asyl-, migrations- och integrationsfonden (AMIF)`,
    period: "2014-2020",
    periodLabel: `2016-08-15 till 2019-02-15`,
    role: "partner",
    description_sv: `Välj inkludering delaktighet och aktivitet (VIDA) bidrar till social
inkludering och främjar möjligheter på arbetsmarknaden för nyanlända
kommuninvånare.

Stort fokus läggs på att använda civilsamhället som en arena för social
inkludering.

Det civila samhället är en central och kontaktskapande arena för nya
kommuninvånare och kan vara ett viktigt första steg in på arbetsmarknaden.`,
    totalBudgetSEK: 16094118,
    euFundingSEK: null,
  },
  {
    id: "vaxgo",
    title: `Växgo`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "erasmus",
    fundName: `Erasmus +`,
    period: "2014-2020",
    periodLabel: `2015-06-01 till 2017-05-31`,
    role: "owner",
    description_sv: `Projektet Växgo utvecklar samarbetet mellan Exempelstad stad,
    civilsamhället och lokala aktörer i Exempelstads ytterstadsområden med
    särskilt fokus på unga vuxna.

Genom kultur och kulturella aktiviteter ska målgruppens kontaktnät
    ökas samtidigt som den sociala inkluderingen stärks.

Projektet riktar sig mot områden med hög arbetslöshet och där
    majoriteten av invånarna är nyanlända eller andra generationens
    svenskar.

Målsättningen är att bidra till ett bättre och likvärdigt bemötande
    samtidigt som det kulturella utbudet blir tillgängligt för fler.
    Projektet ska även stärka ledarskapet och öka mångfalden bland
    stadens personal.
`,
    totalBudgetSEK: 179264,
    euFundingSEK: null,
  },
  {
    id: "yfi-yrkesutbildning-for-invandrare-med-i",
    title: `YFI -- Yrkesutbildning för invandrare med integrerad språkutbildning`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "esf",
    fundName: `Europeiska socialfonden (ESF)`,
    period: "2014-2020",
    periodLabel: `2015-09-01 till 2020-12-31`,
    role: "owner",
    description_sv: `YFI -- Yrkesutbildning för invandrare med integrerad språkutbildning, är
ett samverkansprojekt mellan stadens vuxenutbildning och ett antal
yrkesgymnasier i syftet att utveckla en integrerad språk- och
yrkesutbildning riktad till målgruppen vuxna utrikesfödda.

I dag tar det lång tid för vuxenstuderande utan yrkesutbildning att
komma ut i arbetslivet om de även behöver genomgå hela sfi-utbildningen,
därefter kursen svenska som andraspråk och sedan Komvux.

Projektet avser att korta tiden från utbildning till arbete genom att
integrera språk- och yrkesutbildningarna. Arbetet sker i nära samverkan
mellan olika branschföretag.`,
    totalBudgetSEK: 67296035,
    euFundingSEK: null,
  },
  {
    id: "alskade-barn-i-skolan",
    title: `Älskade barn i skolan`,
    organisation: "Exempelstad",
    theme_sv: `Arbetsmarknad, utbildning och social inkludering`,
    theme_en: `Labour market, education and social inclusion`,
    programId: "amif",
    fundName: `Asyl-, migrations- och integrationsfonden (AMIF)`,
    period: "2014-2020",
    periodLabel: `2016-07-01 till 2018-08-31`,
    role: "owner",
    description_sv: `Älskade barn i skolan stödjer nyanlända föräldrar genom att
    målgruppen får diskutera olika frågor som en vårdnadshavare kan ha.

Med hjälp av olika studiecirklar går deltagande föräldrar igenom ett
    diskussionsmaterial som har tagits fram i nära samarbete med
    civilsamhälle och föräldrarna själva.

Målsättningen är att fler föräldrar kan delta i den lokala
    demokratin samtidigt som fler elever får godkänt i fler ämnen i
    grundskolan.

Extern samverkanspartner är Studiefrämjandet.
`,
    totalBudgetSEK: 3597107,
    euFundingSEK: null,
  },
  {
    id: "omstallning-exempelstad",
    title: `Omställning Exempelstad`,
    organisation: "Exempelstad",
    theme_sv: `Näringslivsfrämjande insatser`,
    theme_en: `Business development initiatives`,
    programId: "erdf",
    fundName: `Europeiska regionala utvecklingsfonden (ERUF)`,
    period: "2014-2020",
    periodLabel: ``,
    role: "owner",
    description_sv: `Projektet Omställning Exempelstad bidrar till stärkt samverkan mellan
    besöksnäringens aktörer och en hållbar framtid för
    besöksdestinationen Exempelstad.

Företagen inom besöksnäringen i regionen drabbades hårt av
    effekter efter covid-19-pandemin. Marknaden har varit starkt
    begränsad där företagen tappade stora delar av sin omsättning.
    Merparten av företagen är små med begränsade möjligheter att hantera
    längre bortfall av besökare eller kunder. Pandemin har även skapat
    nya kundbeteenden och med det behov av anpassning inom
    besöksnäringen.`,
    totalBudgetSEK: null,
    euFundingSEK: null,
  },
  {
    id: "digit",
    title: `DigIt`,
    organisation: "Exempelstad",
    theme_sv: `Digitalisering och utveckling av stadens välfärdstjänster`,
    theme_en: `Digitalisation and development of city welfare services`,
    programId: "esf",
    fundName: `Europeiska socialfonden`,
    period: "2014-2020",
    periodLabel: `2015-12-01 till 2018-11-30`,
    role: "owner",
    description_sv: `DigIt är ett projekt som erbjuder kompetensutveckling kring digitala
arbetssätt för medarbetare inom äldreomsorg och funktionshinderomsorg
inklusive socialpsykiatri.

Staden har identifierat ett behov av att höja den digitala kompetensen
hos vård- och omsorgspersonal för att hålla jämna steg med den digitala
utvecklingen i samhället. Genom en ökad digital kompetens ökar även
chanserna för en tryggad kompetensförsörjning i framtiden.

Projektet analyserar medarbetares digitala kompetens och inställning
till den digitala utvecklingen.`,
    totalBudgetSEK: 63746503,
    euFundingSEK: null,
  },
  {
    id: "exempelstad-digital-care",
    title: `Exempelstad Digital Care`,
    organisation: "Exempelstad",
    theme_sv: `Digitalisering och utveckling av stadens välfärdstjänster`,
    theme_en: `Digitalisation and development of city welfare services`,
    programId: "erdf",
    fundName: `Europeiska regionala utvecklingsfonden (ERUF)`,
    period: "2014-2020",
    periodLabel: `2015-10-01 till 2020-12-31`,
    role: "owner",
    description_sv: `Exempelstad Digital Care är ett digitaliseringsprojekt med sikte på
framtidens äldreomsorg. Med ett större utbud av välfärdsteknik specifikt
utformad för äldre kommuninvånare ska projektet bidra till ett
självständigt liv och välbefinnande för äldre som bor kvar hemma i den
egna bostaden.

Staden bidrar i projektet bland annat med olika miljöer där innovatörer
kan testa sina produkter. Effekterna för målgruppen äldre förväntas
bland annat bestå i ökad trygghet, egenkontroll och delaktighet samt
bättre service i det egna hemmet.

Genom att projektet även stöttar små och medelstora företag som
utvecklar digital välfärdsteknik är målsättningen att bidra till en ökad
tillväxt i region.`,
    totalBudgetSEK: 38572205,
    euFundingSEK: null,
  },
  {
    id: "vux-2-0",
    title: `Vux 2.0`,
    organisation: "Exempelstad",
    theme_sv: `Digitalisering och utveckling av stadens välfärdstjänster`,
    theme_en: `Digitalisation and development of city welfare services`,
    programId: "esf",
    fundName: `Socialfonden 2014--2020. Programområde 1 - kompetensförsörjning`,
    period: "2014-2020",
    periodLabel: `2017-12-15 till 2022-06-30`,
    role: "owner",
    description_sv: `Vux 2.0 är ett kompetensutvecklings- och digitaliseringsprojekt.
    Målet är att bidra till en bred användning av digitala verktyg inom
    Vuxenutbildningen i egen regi inom Exempelstad.

Projektet arbetar med det genom att höja den digitala kompetensen på
    såväl individnivå som organisatorisk nivå.

För lärarens perspektiv handlar det om förbättrade möjligheter till
    överblick och kunna ge individuellt anpassad feedback samt få större
    möjligheter att använda digitala verktyg i undervisningen. Syftet är
    att förstärka flexibiliteten i undervisningen och ge utökade
    möjligheter för lärarna att möta eleverna där de befinner sig.`,
    totalBudgetSEK: 23369929,
    euFundingSEK: null,
  },
  {
    id: "okad-anvandning-av-oppna-data-i-stockhol",
    title: `Ökad användning av öppna data i regionen - ÖdiS`,
    organisation: "Exempelstad",
    theme_sv: `Digitalisering och utveckling av stadens välfärdstjänster`,
    theme_en: `Digitalisation and development of city welfare services`,
    programId: "erdf",
    fundName: `Europeiska regionala utvecklingsfonden (ERUF)`,
    period: "2014-2020",
    periodLabel: `2018-01-01 till 2020-12-31`,
    role: "owner",
    description_sv: `ÖdiS, Ökad användning av öppna data i regionen, utvecklar
    gemensamma standarder samt tillgängliggör och stimulerar
    användningen av öppna data bland företag i regionen.

Målsättningen är att stärka innovations- och
    utvecklingsmöjligheterna för företag i regionen samt förbereda
    offentlig sektor inför skärpta krav på öppna data-användning i EU
    efter 2021.

Genom nätverk, plattformar och samverkan ska sammanlagt 500 företag
    dra nytta av den data som produceras i regionen. ÖdiS
    identifierar och förvaltar öppna data både systematiskt och
    kontinuerlig vilket bidrar till en ökad transparens för frågorna
    inom de deltagande kommunerna.`,
    totalBudgetSEK: 35000000,
    euFundingSEK: null,
  },
];

export function fundedProjectsForProgram(programId: string): FundedProject[] {
  return fundedProjects.filter((r) => r.programId === programId);
}
export interface ProgramStats {
  total: number;
  ownerSharePct: number;
  avgBudgetSEK: number | null;
  disclosedBudgetCount: number;
  topTheme_sv: string | null;
  topTheme_en: string | null;
  legacyCount: number;
  currentCount: number;
}

export function computeProgramStats(projects: FundedProject[]): ProgramStats {
  const total = projects.length;
  if (total === 0) {
    return {
      total: 0,
      ownerSharePct: 0,
      avgBudgetSEK: null,
      disclosedBudgetCount: 0,
      topTheme_sv: null,
      topTheme_en: null,
      legacyCount: 0,
      currentCount: 0,
    };
  }

  const ownerCount = projects.filter((p) => p.role === "owner").length;
  const withBudget = projects.filter((p): p is FundedProject & { totalBudgetSEK: number } => p.totalBudgetSEK !== null);
  const avgBudgetSEK = withBudget.length > 0 ? Math.round(withBudget.reduce((s, p) => s + p.totalBudgetSEK, 0) / withBudget.length) : null;

  const themeCounts = new Map<string, { count: number; theme_en: string }>();
  for (const p of projects) {
    const existing = themeCounts.get(p.theme_sv);
    themeCounts.set(p.theme_sv, { count: (existing?.count ?? 0) + 1, theme_en: p.theme_en });
  }
  let topTheme_sv: string | null = null;
  let topTheme_en: string | null = null;
  let topCount = 0;
  for (const [theme_sv, { count, theme_en }] of themeCounts) {
    if (count > topCount) {
      topTheme_sv = theme_sv;
      topTheme_en = theme_en;
      topCount = count;
    }
  }

  return {
    total,
    ownerSharePct: Math.round((ownerCount / total) * 100),
    avgBudgetSEK,
    disclosedBudgetCount: withBudget.length,
    topTheme_sv,
    topTheme_en,
    legacyCount: projects.filter((p) => p.period === "2014-2020").length,
    currentCount: projects.filter((p) => p.period === "2021-2027").length,
  };
}

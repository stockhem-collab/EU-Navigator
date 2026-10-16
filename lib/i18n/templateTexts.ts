// Texts for the funders' application forms in the Ansökningsstudio
// (lib/data/callTemplates.ts): the form panel, each section's instructions
// and limits, the tables and the template-aware export. Reached as t.tpl.

export interface TemplateTexts {
  panelTitle: string;
  version: (v: string) => string;
  sourceLink: string;
  submittedIn: (where: string) => string;
  formatDocx: string;
  formatWebForm: (where: string) => string;
  pageEstimate: (pages: string, limit: number) => string;
  pageEstimateNoLimit: (pages: string) => string;
  pageLimitAlternative: (pages: number, when: string) => string;
  overPageLimit: string;
  estimateNote: string;
  funderFileTitle: string;
  funderFileHint: string;
  funderFileUpload: string;
  funderFileRemove: string;
  funderFileTooLarge: string;
  funderFileWrongType: string;
  funderFileRtf: string;
  funderFileBundled: (name: string) => string;
  funderFileBundledHint: string;
  funderFileInUse: (name: string) => string;
  criterion: (name: string) => string;
  indicativePages: (pages: number) => string;
  optional: string;
  instructionsToggle: string;
  charCount: (n: number) => string;
  charCountOf: (n: number, max: number) => string;
  overCharLimit: string;
  sectionPages: (pages: string) => string;
  addRow: string;
  removeRow: string;
  rowLabel: (n: number) => string;
  noRows: string;
  exportDocx: string;
  exportFilled: string;
  exportWebForm: string;
  exportFailed: string;
  fillResult: (filled: number) => string;
  fillMissing: (labels: string) => string;
  fillInstructionsNote: string;
  reportFormLabel: string;
  fromApplicationToggle: string;
  fromApplicationEmpty: string;
  useFromApplication: string;
  fillTableFromApplication: string;
  costsTitle: string;
  costsHint: (where: string) => string;
  flatRate: (percent: number) => string;
  flatRateEntered: string;
  costsTotal: string;
  inEur: (amount: string) => string;
  exportReportForm: string;
  budgetTitle: string;
  budgetHint: string;
  budgetTotal: string;
  budgetDiffers: (eligible: string) => string;
  exportBudget: string;
  /** Datacenter › Mallar. */
  library: {
    title: string;
    intro: string;
    uploadTitle: string;
    uploadHint: string;
    uploadButton: string;
    reading: string;
    readFailed: string;
    noSections: string;
    proposalTitle: (file: string) => string;
    proposalHint: string;
    fieldTitle: string;
    fieldKind: string;
    kindApplication: string;
    kindReport: string;
    fieldLanguage: string;
    fieldVersion: string;
    fieldPageLimit: string;
    fieldSource: string;
    include: string;
    sectionNumber: string;
    sectionLabel: string;
    sectionInstructions: string;
    sectionPages: string;
    sectionOptional: string;
    sectionGroup: (group: string) => string;
    tablesLabel: string;
    save: string;
    cancel: string;
    saved: (title: string) => string;
    fileTooLarge: string;
    listTitle: string;
    builtIn: string;
    added: string;
    sectionsCount: (n: number) => string;
    remove: string;
    removeConfirm: string;
    assignTitle: string;
    assignHint: string;
    columnCall: string;
    columnApplication: string;
    columnReport: string;
    standardForm: string;
    noForm: string;
  };
}

export const templateSv: TemplateTexts = {
  panelTitle: "Funderns ansökningsmall",
  version: (v) => `Version ${v}`,
  sourceLink: "Mallen hos fundern",
  submittedIn: (where) => `Lämnas in i ${where}.`,
  formatDocx: "Word-mall: exporten följer mallens rubriker, tabeller och format. Gör en PDF av den och ladda upp den hos fundern.",
  formatWebForm: (where) => `Webbformulär: exporten är ett underlag att klistra in i ${where} fält för fält, med tecken räknade.`,
  pageEstimate: (pages, limit) => `Uppskattat omfång: ${pages} av högst ${limit} sidor`,
  pageEstimateNoLimit: (pages) => `Uppskattat omfång: ${pages} sidor`,
  pageLimitAlternative: (pages, when) => `(${pages} sidor för ${when})`,
  overPageLimit: "Över sidgränsen – fundern läser inte sidorna efter gränsen.",
  estimateNote: "Uppskattat från antal ord och tabellrader i mallens format; figurer räknas inte.",
  funderFileTitle: "Funderns Word-fil",
  funderFileHint:
    "Ladda upp mallen du hämtat i funderns ansökningssystem (.docx), så fylls den i vid exporten i stället för att ett nytt dokument skapas. Den sparas i den här webbläsaren.",
  funderFileUpload: "Ladda upp Word-mall",
  funderFileRemove: "Ta bort",
  funderFileTooLarge: "Filen är för stor (högst 3 MB).",
  funderFileWrongType: "Välj en Word-fil (.docx).",
  funderFileRtf: "Mallen är en RTF-fil. Öppna den i Word, spara den som Word-dokument (.docx) och ladda upp den igen.",
  funderFileBundled: (name) => `Exporten fyller i funderns mall ${name}, som finns i EU Navigator.`,
  funderFileBundledHint: "Har utlysningen en annan version av mallen kan du ladda upp den i stället (.docx).",
  funderFileInUse: (name) => `Exporten fyller i ${name}.`,
  criterion: (name) => `Bedöms under ${name}`,
  indicativePages: (pages) => `ca ${pages.toLocaleString("sv-SE")} ${pages === 1 ? "sida" : "sidor"}`,
  optional: "Frivilligt",
  instructionsToggle: "Funderns instruktioner",
  charCount: (n) => `${n.toLocaleString("sv-SE")} tecken`,
  charCountOf: (n, max) => `${n.toLocaleString("sv-SE")} av ${max.toLocaleString("sv-SE")} tecken`,
  overCharLimit: "För långt för fältet",
  sectionPages: (pages) => `≈ ${pages} sidor`,
  addRow: "+ Lägg till rad",
  removeRow: "Ta bort rad",
  rowLabel: (n) => `Rad ${n}`,
  noRows: "Inga rader än.",
  exportDocx: "Exportera enligt mallen (.docx)",
  exportFilled: "Exportera i funderns Word-mall (.docx)",
  exportWebForm: "Exportera fält för fält (.docx)",
  exportFailed: "Exporten misslyckades. Kontrollera att Word-filen är funderns mall i .docx-format.",
  fillResult: (filled) => `${filled} avsnitt och tabeller fylldes i funderns mall.`,
  fillMissing: (labels) => `Hittades inte i mallen och fylldes inte i: ${labels}.`,
  fillInstructionsNote: "Funderns instruktionstext ligger kvar i dokumentet; ta bort den innan du gör PDF:en.",
  reportFormLabel: "Funderns rapportmall",
  fromApplicationToggle: "Det här skrev ni i ansökan",
  fromApplicationEmpty: "Avsnittet är inte skrivet i ansökan i det här systemet.",
  useFromApplication: "Använd som utgångspunkt",
  fillTableFromApplication: "Hämta arbetspaketen från ansökan",
  costsTitle: "Kostnader per kostnadsslag",
  costsHint: (where) => `Periodens kostnader i kronor, som ni redovisar dem i ${where}.`,
  flatRate: (percent) => `${percent} % schablon, räknas ut`,
  flatRateEntered: "Enligt schablonen i beslutet",
  costsTotal: "Summa för perioden",
  inEur: (amount) => `≈ ${amount} EUR`,
  exportReportForm: "Exportera enligt rapportmallen (.docx)",
  budgetTitle: "Budget per kostnadsslag",
  budgetHint: "Fyll i budgeten som fundern vill ha den. Schablonerna räknas ut, och Excel-filen har samma uppställning med formler.",
  budgetTotal: "Summa",
  budgetDiffers: (eligible) => `Stämmer inte med den stödberättigande budgeten (${eligible}).`,
  exportBudget: "Exportera budget (.xlsx)",
  library: {
    title: "Mallar",
    intro: "Funderns ansöknings- och rapportmallar. Ansökan och rapporterna följer den mall som gäller för utlysningen, och exporten fyller i funderns egen Word-fil.",
    uploadTitle: "Lägg till en mall",
    uploadHint: "Ladda upp funderns Word-mall (.docx). Systemet läser ut rubriker, instruktioner, tabeller och sidgränser som ett förslag, som ni granskar innan ni sparar.",
    uploadButton: "Välj Word-fil (.docx)",
    reading: "Läser mallen …",
    readFailed: "Det gick inte att läsa filen. Är det en Word-fil (.docx)?",
    noSections: "Hittade inga rubriker i filen. Mallen behöver rubrikformat eller numrerade rubriker (”1.1 Mål”).",
    proposalTitle: (file) => `Förslag från ${file}`,
    proposalHint: "Bocka ur det som inte ska fyllas i, och rätta rubriker och instruktioner där läsningen blev fel.",
    fieldTitle: "Namn på mallen",
    fieldKind: "Typ",
    kindApplication: "Ansökan",
    kindReport: "Rapport",
    fieldLanguage: "Mallens språk",
    fieldVersion: "Version",
    fieldPageLimit: "Sidgräns",
    fieldSource: "Länk till mallen hos fundern",
    include: "Ta med",
    sectionNumber: "Nr",
    sectionLabel: "Rubrik",
    sectionInstructions: "Instruktioner",
    sectionPages: "Sidor",
    sectionOptional: "Frivillig",
    sectionGroup: (g) => `Under ${g}`,
    tablesLabel: "Tabeller",
    save: "Spara mallen",
    cancel: "Avbryt",
    saved: (title) => `${title} är sparad. Välj nedan vilka utlysningar som ska använda den.`,
    fileTooLarge: "Mallen sparades, men Word-filen är för stor för att sparas i webbläsaren. Ladda upp den i ansökan när ni exporterar.",
    listTitle: "Mallar i systemet",
    builtIn: "Inbyggd",
    added: "Tillagd här",
    sectionsCount: (n) => `${n} avsnitt`,
    remove: "Ta bort",
    removeConfirm: "Ta bort mallen? Utlysningar som använder den går tillbaka till sin standardmall.",
    assignTitle: "Mall per utlysning",
    assignHint: "Välj vilken mall ansökan och rapporterna ska följa. Standard är den mall utlysningslistan anger.",
    columnCall: "Utlysning",
    columnApplication: "Ansökningsmall",
    columnReport: "Rapportmall",
    standardForm: "Standard",
    noForm: "Ingen",
  },
};

export const templateEn: TemplateTexts = {
  panelTitle: "The funder's application form",
  version: (v) => `Version ${v}`,
  sourceLink: "The form at the funder",
  submittedIn: (where) => `Submitted in ${where}.`,
  formatDocx: "Word template: the export follows the template's headings, tables and layout. Make a PDF of it and upload it to the funder.",
  formatWebForm: (where) => `Web form: the export is a document to paste into ${where} field by field, with characters counted.`,
  pageEstimate: (pages, limit) => `Estimated length: ${pages} of at most ${limit} pages`,
  pageEstimateNoLimit: (pages) => `Estimated length: ${pages} pages`,
  pageLimitAlternative: (pages, when) => `(${pages} pages for ${when})`,
  overPageLimit: "Over the page limit – the funder doesn't read pages beyond it.",
  estimateNote: "Estimated from the number of words and table rows in the template's layout; figures aren't counted.",
  funderFileTitle: "The funder's Word file",
  funderFileHint:
    "Upload the template you downloaded from the funder's submission system (.docx) and the export fills it in instead of creating a new document. It is stored in this browser.",
  funderFileUpload: "Upload Word template",
  funderFileRemove: "Remove",
  funderFileTooLarge: "The file is too large (at most 3 MB).",
  funderFileWrongType: "Choose a Word file (.docx).",
  funderFileRtf: "The template is an RTF file. Open it in Word, save it as a Word document (.docx) and upload it again.",
  funderFileBundled: (name) => `The export fills in the funder's template ${name}, kept in EU Navigator.`,
  funderFileBundledHint: "If the call has another version of the template, you can upload it instead (.docx).",
  funderFileInUse: (name) => `The export fills in ${name}.`,
  criterion: (name) => `Assessed under ${name}`,
  indicativePages: (pages) => `about ${pages.toLocaleString("en-US")} ${pages === 1 ? "page" : "pages"}`,
  optional: "Optional",
  instructionsToggle: "The funder's instructions",
  charCount: (n) => `${n.toLocaleString("en-US")} characters`,
  charCountOf: (n, max) => `${n.toLocaleString("en-US")} of ${max.toLocaleString("en-US")} characters`,
  overCharLimit: "Too long for the field",
  sectionPages: (pages) => `≈ ${pages} pages`,
  addRow: "+ Add row",
  removeRow: "Remove row",
  rowLabel: (n) => `Row ${n}`,
  noRows: "No rows yet.",
  exportDocx: "Export following the template (.docx)",
  exportFilled: "Export in the funder's Word template (.docx)",
  exportWebForm: "Export field by field (.docx)",
  exportFailed: "The export failed. Check that the Word file is the funder's template in .docx format.",
  fillResult: (filled) => `${filled} sections and tables were filled in the funder's template.`,
  fillMissing: (labels) => `Not found in the template and not filled in: ${labels}.`,
  fillInstructionsNote: "The funder's instruction text is still in the document; remove it before making the PDF.",
  reportFormLabel: "The funder's report form",
  fromApplicationToggle: "What you wrote in the application",
  fromApplicationEmpty: "This section isn't written in the application in this system.",
  useFromApplication: "Use as a starting point",
  fillTableFromApplication: "Take the work packages from the application",
  costsTitle: "Costs per cost category",
  costsHint: (where) => `The period's costs in SEK, as you declare them in ${where}.`,
  flatRate: (percent) => `${percent} % flat rate, calculated`,
  flatRateEntered: "Per the flat rate in the decision",
  costsTotal: "Total for the period",
  inEur: (amount) => `≈ ${amount} EUR`,
  exportReportForm: "Export following the report form (.docx)",
  budgetTitle: "Budget per cost category",
  budgetHint: "Fill in the budget the way the funder wants it. Flat rates are calculated, and the Excel file has the same layout with formulas.",
  budgetTotal: "Total",
  budgetDiffers: (eligible) => `Doesn't match the eligible budget (${eligible}).`,
  exportBudget: "Export budget (.xlsx)",
  library: {
    title: "Templates",
    intro: "The funders' application and report forms. The application and the reports follow the form that applies to the call, and the export fills in the funder's own Word file.",
    uploadTitle: "Add a template",
    uploadHint: "Upload the funder's Word template (.docx). The system reads its headings, instructions, tables and page limits as a proposal, which you review before saving.",
    uploadButton: "Choose a Word file (.docx)",
    reading: "Reading the template …",
    readFailed: "The file couldn't be read. Is it a Word file (.docx)?",
    noSections: "No headings found in the file. The template needs heading styles or numbered headings (“1.1 Objectives”).",
    proposalTitle: (file) => `Proposal from ${file}`,
    proposalHint: "Untick what isn't to be filled in, and correct headings and instructions where the reading went wrong.",
    fieldTitle: "Template name",
    fieldKind: "Type",
    kindApplication: "Application",
    kindReport: "Report",
    fieldLanguage: "Template language",
    fieldVersion: "Version",
    fieldPageLimit: "Page limit",
    fieldSource: "Link to the template at the funder",
    include: "Include",
    sectionNumber: "No.",
    sectionLabel: "Heading",
    sectionInstructions: "Instructions",
    sectionPages: "Pages",
    sectionOptional: "Optional",
    sectionGroup: (g) => `Under ${g}`,
    tablesLabel: "Tables",
    save: "Save template",
    cancel: "Cancel",
    saved: (title) => `${title} is saved. Choose below which calls use it.`,
    fileTooLarge: "The template was saved, but the Word file is too large to keep in the browser. Upload it in the application when you export.",
    listTitle: "Templates in the system",
    builtIn: "Built in",
    added: "Added here",
    sectionsCount: (n) => `${n} sections`,
    remove: "Remove",
    removeConfirm: "Remove the template? Calls using it go back to their standard form.",
    assignTitle: "Template per call",
    assignHint: "Choose the form the application and the reports follow. Standard is the form the call list names.",
    columnCall: "Call",
    columnApplication: "Application form",
    columnReport: "Report form",
    standardForm: "Standard",
    noForm: "None",
  },
};

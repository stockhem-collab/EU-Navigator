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
};

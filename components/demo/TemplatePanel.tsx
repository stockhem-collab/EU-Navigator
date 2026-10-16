"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { Attachment, CallTemplate } from "@/lib/types";

interface Props {
  template: CallTemplate;
  /** The whole application's estimated length in pages. */
  estimatedPages: number;
  /** The funder's own .docx the user uploaded for this call, if any. */
  funderFile?: Attachment;
  onUploadFunderFile: (file: File) => Promise<"too-large" | null>;
  onRemoveFunderFile: () => void;
}

const fmtPages = (pages: number, lang: "sv" | "en") =>
  pages.toLocaleString(lang === "sv" ? "sv-SE" : "en-US", { maximumFractionDigits: 1, minimumFractionDigits: 1 });

// What the funder's form is and how the application is taken in: its
// version and source, the estimated length against the page limit, and —
// for Word templates — the funder's own file to fill in at export.
export default function TemplatePanel({ template, estimatedPages, funderFile, onUploadFunderFile, onRemoveFunderFile }: Props) {
  const { t, lang } = useLanguage();
  const tp = t.tpl;
  const [uploadError, setUploadError] = useState<string | null>(null);
  const where = template.submittedIn ?? "";
  const formatting = lang === "sv" ? template.formatting_sv : template.formatting_en;
  const note = lang === "sv" ? template.note_sv : template.note_en;
  const over = template.pageLimit !== undefined && estimatedPages > template.pageLimit;

  const handleFile = async (file: File | undefined) => {
    if (!file) return;
    if (!/\.docx$/i.test(file.name)) {
      setUploadError(tp.funderFileWrongType);
      return;
    }
    setUploadError((await onUploadFunderFile(file)) === "too-large" ? tp.funderFileTooLarge : null);
  };

  return (
    <div className="mt-3 rounded-xl border border-navy-100 bg-white p-4" data-testid="template-panel">
      <p className="text-xs font-semibold uppercase text-navy-400">{tp.panelTitle}</p>
      <p className="mt-1 text-sm font-semibold text-navy-800">{lang === "sv" ? template.title_sv : template.title_en}</p>
      <p className="mt-0.5 text-xs text-navy-500">
        {template.version && tp.version(template.version)}
        {where && ` · ${tp.submittedIn(where)}`}
        {template.sourceUrl && (
          <>
            {" · "}
            <a href={template.sourceUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-navy-600 underline hover:text-navy-900">
              {tp.sourceLink}
            </a>
          </>
        )}
      </p>
      <p className="mt-2 text-sm text-navy-600">{template.format === "web-form" ? tp.formatWebForm(where || "formuläret") : tp.formatDocx}</p>
      {note && <p className="mt-1 text-xs text-navy-500">{note}</p>}

      {template.format === "docx" && (
        <div className="mt-3">
          <p className={`text-sm font-semibold ${over ? "text-red-700" : "text-navy-700"}`} data-testid="template-page-estimate">
            {template.pageLimit !== undefined
              ? tp.pageEstimate(fmtPages(estimatedPages, lang), template.pageLimit)
              : tp.pageEstimateNoLimit(fmtPages(estimatedPages, lang))}
            {template.pageLimitAlternative &&
              ` ${tp.pageLimitAlternative(
                template.pageLimitAlternative.pages,
                lang === "sv" ? template.pageLimitAlternative.when_sv : template.pageLimitAlternative.when_en
              )}`}
          </p>
          {over && <p className="text-xs font-semibold text-red-700">{tp.overPageLimit}</p>}
          <p className="mt-0.5 text-xs text-navy-400">
            {tp.estimateNote}
            {formatting && ` ${formatting}`}
          </p>

          <div className="mt-3 rounded-md bg-navy-50 p-3">
            <p className="text-sm font-semibold text-navy-700">{tp.funderFileTitle}</p>
            {funderFile ? (
              <div className="mt-1 flex flex-wrap items-center gap-3">
                <p className="text-sm text-navy-700" data-testid="funder-file-name">
                  {tp.funderFileInUse(funderFile.fileName)}
                </p>
                <button type="button" onClick={onRemoveFunderFile} className="text-xs font-semibold text-navy-500 hover:text-navy-800">
                  {tp.funderFileRemove}
                </button>
              </div>
            ) : (
              <>
                <p className="mt-1 text-xs text-navy-500">{tp.funderFileHint}</p>
                <label className="mt-2 inline-block cursor-pointer rounded-md border border-navy-200 bg-white px-3 py-1.5 text-sm font-semibold text-navy-700 hover:bg-navy-50">
                  {tp.funderFileUpload}
                  <input
                    type="file"
                    accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    className="sr-only"
                    data-testid="funder-file-input"
                    onChange={(e) => {
                      void handleFile(e.target.files?.[0]);
                      e.target.value = "";
                    }}
                  />
                </label>
              </>
            )}
            {uploadError && <p className="mt-1 text-xs font-semibold text-red-700">{uploadError}</p>}
          </div>
        </div>
      )}
    </div>
  );
}

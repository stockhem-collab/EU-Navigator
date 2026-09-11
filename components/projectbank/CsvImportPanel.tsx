"use client";

import { useRef, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageContext";
import { ProjectBankEntry } from "@/lib/types";
import { CSV_TEMPLATE, parseProjectsCsv } from "@/lib/matching/projectIntake";

interface Props {
  onImport: (entries: ProjectBankEntry[]) => void;
}

export default function CsvImportPanel({ onImport }: Props) {
  const { t, lang } = useLanguage();
  const pb = t.projectBank;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null);

  const downloadTemplate = () => {
    const blob = new Blob([CSV_TEMPLATE], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "eu-navigator-projektmall.csv";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const { entries, errors } = parseProjectsCsv(text);
      if (entries.length > 0) onImport(entries);
      setResult({ count: entries.length, errors });
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <div className="rounded-xl border border-navy-100 bg-white p-4">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="rounded-md bg-navy-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-navy-700"
        >
          {pb.importButton}
        </button>
        <button
          type="button"
          onClick={downloadTemplate}
          className="rounded-md border border-navy-200 px-4 py-2 text-sm font-semibold text-navy-600 hover:bg-navy-50"
        >
          {pb.downloadTemplate}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".csv,text/csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
        />
      </div>
      <p className="mt-2 text-xs text-navy-400">{pb.importHint}</p>

      {result && (
        <div className="mt-3 rounded-md bg-navy-50 p-3 text-sm">
          <p className="font-semibold text-navy-700">
            {lang === "sv" ? `${result.count} projekt importerade.` : `${result.count} projects imported.`}
          </p>
          {result.errors.length > 0 && (
            <ul className="mt-1 space-y-0.5 text-xs text-amber-700">
              {result.errors.map((err, i) => (
                <li key={i}>⚠ {err}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

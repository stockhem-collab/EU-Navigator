"use client";

import { useCallback, useEffect, useState } from "react";
import { Attachment } from "@/lib/types";

// Real supporting documents (budget files, decision letters, evidence for a
// report, …) a user saves against a project or reporting event during the
// process — as opposed to the docx files the system itself generates (see
// exportApplication.ts / exportReport.ts). Client-only demo, so a file's
// bytes are read into a data URL and kept in localStorage rather than on a
// real document server, keyed by an arbitrary caller-chosen subject key
// (e.g. "projectbank:pb-1" or "report:ap-2:ap-2-report-1") — the same
// composite-key convention already used for reporting submissions.
const STORAGE_KEY = "eu-navigator-attachments";

// A generous cap for a demo whose "storage" is one browser's localStorage,
// shared across every project's attachments at once — comfortably below
// the ~5-10MB-per-origin quota most browsers give even after base64's ~33%
// size inflation, but large enough for a real budget spreadsheet or letter.
export const MAX_ATTACHMENT_BYTES = 3 * 1024 * 1024;

type AttachmentsState = Record<string, Attachment[]>;

function read(): AttachmentsState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(state: AttachmentsState) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Over quota, or storage unavailable (private browsing, …) — the
    // attachment stays visible for the rest of this session but won't
    // survive a refresh. Nothing more graceful to do client-only.
  }
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

const CHANGED_EVENT = "eu-navigator-attachments-changed";

export function useAttachments() {
  const [state, setState] = useState<AttachmentsState>({});
  const [hydrated, setHydrated] = useState(false);

  // Several parts of a page can use this hook at once (a report's checklist
  // and its other attachments, the export) — each change is written from
  // what's stored, not from one instance's copy, and every instance is
  // told to re-read, so none of them can overwrite another's file.
  useEffect(() => {
    setState(read());
    setHydrated(true);
    const sync = () => setState(read());
    window.addEventListener(CHANGED_EVENT, sync);
    return () => window.removeEventListener(CHANGED_EVENT, sync);
  }, []);

  const attachmentsFor = useCallback((key: string): Attachment[] => state[key] ?? [], [state]);

  // Returns null on success, or "too-large" if the file exceeded
  // MAX_ATTACHMENT_BYTES and was rejected before ever touching storage.
  const addAttachment = useCallback(async (key: string, file: File): Promise<"too-large" | null> => {
    if (file.size > MAX_ATTACHMENT_BYTES) return "too-large";
    const dataUrl = await readFileAsDataUrl(file);
    const attachment: Attachment = {
      id: `att-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      sizeBytes: file.size,
      uploadedAt: new Date().toISOString(),
      dataUrl,
    };
    const stored = read();
    const next = { ...stored, [key]: [...(stored[key] ?? []), attachment] };
    write(next);
    setState(next);
    window.dispatchEvent(new Event(CHANGED_EVENT));
    return null;
  }, []);

  const removeAttachment = useCallback((key: string, id: string) => {
    const stored = read();
    const next = { ...stored, [key]: (stored[key] ?? []).filter((a) => a.id !== id) };
    write(next);
    setState(next);
    window.dispatchEvent(new Event(CHANGED_EVENT));
  }, []);

  return { hydrated, attachmentsFor, addAttachment, removeAttachment };
}

/** Re-downloads a saved attachment — same `<a download>` trick as
 * downloadBlob in exportApplication.ts, but pointed straight at the data
 * URL already in memory rather than a freshly built Blob. */
export function downloadAttachment(attachment: Attachment) {
  const a = document.createElement("a");
  a.href = attachment.dataUrl;
  a.download = attachment.fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

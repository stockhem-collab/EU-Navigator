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

export function useAttachments() {
  const [state, setState] = useState<AttachmentsState>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(read());
    setHydrated(true);
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
    setState((prev) => {
      const next = { ...prev, [key]: [...(prev[key] ?? []), attachment] };
      write(next);
      return next;
    });
    return null;
  }, []);

  const removeAttachment = useCallback((key: string, id: string) => {
    setState((prev) => {
      const next = { ...prev, [key]: (prev[key] ?? []).filter((a) => a.id !== id) };
      write(next);
      return next;
    });
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

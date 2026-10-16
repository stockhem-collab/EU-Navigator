"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { CallTemplate, FundingCall } from "@/lib/types";
import { applicationTemplateFor, callTemplates, reportTemplateFor, TemplateRegistry } from "@/lib/data/callTemplates";

// The forms added in Datacenter (Mallar) and the forms chosen there for
// calls, on top of the app's own library (lib/data/callTemplates.ts). Kept
// in this browser like the imported calls (useFundingCalls); the funder's
// original file of an added form is an attachment (customTemplateFileKey).
const TEMPLATES_KEY = "eu-navigator-custom-templates";
const ASSIGNMENTS_KEY = "eu-navigator-template-assignments";

/** Attachment key of an added form's original file. */
export const customTemplateFileKey = (templateId: string) => `custom-template:${templateId}`;

function read<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable — the change just won't persist.
  }
}

/** The registry as stored, outside React — for exports and scans. */
export function readTemplateRegistry(): TemplateRegistry {
  const custom = read<CallTemplate[]>(TEMPLATES_KEY, []);
  return {
    custom: Array.isArray(custom) ? custom.filter((t) => t && typeof t.id === "string" && Array.isArray(t.sections)) : [],
    assignments: read<TemplateRegistry["assignments"]>(ASSIGNMENTS_KEY, {}),
  };
}

export function useCallTemplates() {
  const [registry, setRegistry] = useState<TemplateRegistry>({ custom: [], assignments: {} });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setRegistry(readTemplateRegistry());
    setHydrated(true);
  }, []);

  const saveTemplate = useCallback((template: CallTemplate) => {
    setRegistry((prev) => {
      const custom = [...prev.custom.filter((t) => t.id !== template.id), { ...template, custom: true }];
      write(TEMPLATES_KEY, custom);
      return { ...prev, custom };
    });
  }, []);

  const removeTemplate = useCallback((id: string) => {
    setRegistry((prev) => {
      const custom = prev.custom.filter((t) => t.id !== id);
      const assignments = Object.fromEntries(
        Object.entries(prev.assignments).map(([callId, a]) => [
          callId,
          { ...(a.application !== id ? { application: a.application } : {}), ...(a.report !== id ? { report: a.report } : {}) },
        ])
      );
      write(TEMPLATES_KEY, custom);
      write(ASSIGNMENTS_KEY, assignments);
      return { custom, assignments };
    });
  }, []);

  /** Chooses (or, with "", clears) the form a call's applications or
   * reports follow. */
  const assign = useCallback((callId: string, kind: "application" | "report", templateId: string) => {
    setRegistry((prev) => {
      const current = { ...(prev.assignments[callId] ?? {}) };
      if (templateId) current[kind] = templateId;
      else delete current[kind];
      const assignments = { ...prev.assignments, [callId]: current };
      write(ASSIGNMENTS_KEY, assignments);
      return { ...prev, assignments };
    });
  }, []);

  const all = useMemo(() => [...callTemplates, ...registry.custom], [registry.custom]);

  return {
    registry,
    hydrated,
    /** The app's forms and the ones added here. */
    all,
    custom: registry.custom,
    assignments: registry.assignments,
    saveTemplate,
    removeTemplate,
    assign,
    applicationTemplateFor: (call: FundingCall) => applicationTemplateFor(call, registry),
    reportTemplateFor: (call: FundingCall | undefined) => reportTemplateFor(call, registry),
  };
}

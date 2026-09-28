"use client";

import { useCallback, useEffect, useState } from "react";
import { Tag } from "@/lib/types";
import { ALL_TAGS } from "@/lib/data/tags";
import { slugifyCallId } from "@/lib/matching/callExtraction";

// The tag vocabulary as actually offered to a user: the fixed, curated
// list plus anything added through the tag picker's own "add a new tag"
// affordance. Same no-backend, localStorage-overlay pattern as
// useFundingCalls' imported calls — this is the one place the merge
// happens so every picker (intake, Projektbank, the utlysningsimport tool)
// sees the same combined vocabulary and a tag added in one place is
// immediately selectable in the others.
const STORAGE_KEY = "eu-navigator-custom-tags";

function readCustom(): Tag[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeCustom(tags: Tag[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tags));
  } catch {
    // localStorage unavailable — the custom tag just won't persist.
  }
}

export function useTags() {
  const [custom, setCustom] = useState<Tag[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setCustom(readCustom());
    setHydrated(true);
  }, []);

  const all: Tag[] = [...ALL_TAGS, ...custom];

  // A custom tag's label is entered once, in whichever language the picker
  // is currently shown in — same "not professionally bilingual content, an
  // edit in either language replaces both" reasoning already used for a
  // Projektbank entry's own title/description.
  const addCustomTag = useCallback((label: string): Tag => {
    const trimmed = label.trim();
    const existingIds = [...ALL_TAGS, ...readCustom()].map((t) => t.id);
    const id = slugifyCallId(trimmed, existingIds);
    const tag: Tag = { id, label_sv: trimmed, label_en: trimmed };
    setCustom((prev) => {
      const next = [...prev, tag];
      writeCustom(next);
      return next;
    });
    return tag;
  }, []);

  return { all, custom, addCustomTag, hydrated };
}

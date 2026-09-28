"use client";

import { useState } from "react";
import { Lang, Tag } from "@/lib/types";

interface Props {
  /** The full vocabulary to render — the fixed list plus any custom tags
   * (see useTags), passed in rather than imported directly so this stays a
   * plain rendering component over whatever list its caller has merged. */
  tags: Tag[];
  selected: string[];
  onChange: (tags: string[]) => void;
  /** Tag ids suggested from the project's free-text description (see
   * lib/matching/tagSuggestions.ts) — shown separately, ahead of the full
   * list, so the user can accept them with one click rather than hunting
   * through all tags. Never applied automatically. */
  suggested?: string[];
  lang: Lang;
  labels: {
    hint: string;
    suggestedLabel: string;
    addAllLabel: string;
    addNewPlaceholder: string;
    addNewButton: string;
  };
  /** When provided, shows an inline "add a new tag" field — for when none
   * of the fixed vocabulary fits. The new tag is added to the shared pool
   * (see useTags) and auto-selected, same as picking an existing one. */
  onAddTag?: (label: string) => Tag;
}

export default function TagPicker({ tags, selected, onChange, suggested = [], lang, labels, onAddTag }: Props) {
  const [newTagLabel, setNewTagLabel] = useState("");

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);
  };

  const submitNewTag = () => {
    const trimmed = newTagLabel.trim();
    if (!trimmed || !onAddTag) return;
    const tag = onAddTag(trimmed);
    onChange([...selected, tag.id]);
    setNewTagLabel("");
  };

  const pendingSuggestions = suggested.filter((id) => !selected.includes(id));

  return (
    <div>
      <p className="mb-2 text-xs text-navy-500">{labels.hint}</p>

      {pendingSuggestions.length > 0 && (
        <div className="mb-3 rounded-md bg-gold-50 px-3 py-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-navy-700">{labels.suggestedLabel}</span>
            {pendingSuggestions.map((id) => {
              const tag = tags.find((t) => t.id === id);
              if (!tag) return null;
              return (
                <button
                  key={id}
                  type="button"
                  onClick={() => toggle(id)}
                  className="rounded-full border border-gold-400 bg-white px-2.5 py-1 text-xs font-medium text-navy-700 hover:bg-gold-100"
                >
                  + {lang === "sv" ? tag.label_sv : tag.label_en}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => onChange([...selected, ...pendingSuggestions])}
              className="ml-auto text-xs font-semibold text-navy-600 underline hover:text-navy-900"
            >
              {labels.addAllLabel}
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {tags.map((tag) => {
          const isSelected = selected.includes(tag.id);
          return (
            <button
              key={tag.id}
              type="button"
              onClick={() => toggle(tag.id)}
              aria-pressed={isSelected}
              className={`rounded-full border px-2.5 py-1 text-xs font-medium transition ${
                isSelected
                  ? "border-navy-800 bg-navy-800 text-white"
                  : "border-navy-200 bg-white text-navy-600 hover:bg-navy-50"
              }`}
            >
              {lang === "sv" ? tag.label_sv : tag.label_en}
            </button>
          );
        })}
      </div>

      {onAddTag && (
        <div className="mt-3 flex items-center gap-2">
          <input
            value={newTagLabel}
            onChange={(e) => setNewTagLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submitNewTag();
              }
            }}
            placeholder={labels.addNewPlaceholder}
            className="w-full max-w-xs rounded-md border border-navy-200 px-2.5 py-1.5 text-xs focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
          <button
            type="button"
            onClick={submitNewTag}
            disabled={!newTagLabel.trim()}
            className="shrink-0 rounded-md border border-navy-200 px-2.5 py-1.5 text-xs font-semibold text-navy-600 hover:bg-navy-50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {labels.addNewButton}
          </button>
        </div>
      )}
    </div>
  );
}

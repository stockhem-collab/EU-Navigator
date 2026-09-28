"use client";

import { ALL_TAGS } from "@/lib/data/tags";
import { Lang } from "@/lib/types";

interface Props {
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
  };
}

export default function TagPicker({ selected, onChange, suggested = [], lang, labels }: Props) {
  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((t) => t !== id) : [...selected, id]);
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
              const tag = ALL_TAGS.find((t) => t.id === id);
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
        {ALL_TAGS.map((tag) => {
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
    </div>
  );
}

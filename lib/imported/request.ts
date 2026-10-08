import type { Sector } from "@/lib/types";
import { ALL_SECTORS } from "./themes";
import type { IdeaInput } from "./types";

export function isSector(value: unknown): value is Sector {
  return typeof value === "string" && (ALL_SECTORS as string[]).includes(value);
}

const text = (value: unknown, max: number) => (typeof value === "string" ? value.slice(0, max) : "");

/** Reads a project idea sent from the browser, or null when it lacks the
 * fields the similarity search needs. Long texts are cut, not rejected. */
export function parseIdea(body: unknown): IdeaInput | null {
  if (!body || typeof body !== "object") return null;
  const b = body as Record<string, unknown>;
  if (!isSector(b.sector)) return null;
  const title = text(b.title, 500);
  const description = text(b.description, 10_000);
  if (!title.trim() && !description.trim()) return null;
  const own = b.ownOrganisation && typeof b.ownOrganisation === "object" ? (b.ownOrganisation as Record<string, unknown>) : null;
  return {
    title,
    description,
    sector: b.sector,
    secondarySectors: Array.isArray(b.secondarySectors) ? b.secondarySectors.filter(isSector) : [],
    tags: Array.isArray(b.tags) ? b.tags.filter((t): t is string => typeof t === "string").slice(0, 50) : [],
    ownOrganisation: own ? { name: text(own.name, 200) || null } : undefined,
  };
}

import { cleanText } from "@/lib/sanitize";
import type { Narrative } from "@/lib/types";

export function extractJson(text: string): unknown {
  const trimmed = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/i, "").trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
    throw new Error("Model output did not contain JSON.");
  }
}

function lines(value: unknown, max: number): string[] | null {
  if (!Array.isArray(value)) return null;
  const cleaned = value
    .map((item) => cleanText(item, 180))
    .filter((item) => item.length >= 3)
    .slice(0, max);
  return cleaned.length >= 2 ? cleaned : null;
}

export function parseNarrative(input: unknown): Narrative | null {
  let value = input;
  if (typeof input === "string") {
    try {
      value = extractJson(input);
    } catch {
      return null;
    }
  }
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const summary = cleanText(record.summary, 600);
  const invitationLine = cleanText(record.invitationLine, 180);
  const theme = cleanText(record.theme, 80);
  const decor = lines(record.decor, 6);
  const menu = lines(record.menu, 8);
  const activities = lines(record.activities, 6);
  const music = cleanText(record.music, 180);
  const moments = lines(record.moments, 6);
  const care = lines(record.care, 6);
  if (summary.length < 20 || invitationLine.length < 8 || theme.length < 3 || !decor || !menu || !activities || music.length < 3 || !moments || !care) {
    return null;
  }
  return { summary, invitationLine, theme, decor, menu, activities, music, moments, care };
}

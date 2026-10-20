const SCRIPT_BLOCK = /<script\b[^>]*>[\s\S]*?<\/script>/gi;
const TAG = /<[^>]+>/g;
const CONTROL = /[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g;

export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value
    .replace(SCRIPT_BLOCK, " ")
    .replace(TAG, " ")
    .replace(CONTROL, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

export function sanitizeBrief(input: unknown): unknown {
  if (!input || typeof input !== "object" || Array.isArray(input)) return {};
  const src = input as Record<string, unknown>;
  const dietary = Array.isArray(src.dietary) ? src.dietary.slice(0, 8) : [];
  const priorities = Array.isArray(src.priorities) ? src.priorities.slice(0, 2) : [];
  return {
    eventType: src.eventType,
    title: cleanText(src.title, 80),
    honoree: cleanText(src.honoree, 80),
    date: cleanText(src.date, 10),
    city: cleanText(src.city, 80),
    guests: src.guests,
    setting: src.setting,
    vibe: src.vibe,
    culture: cleanText(src.culture, 240),
    dietary,
    budget: src.budget,
    currency: src.currency,
    priorities,
    mustHaves: cleanText(src.mustHaves, 400),
    constraints: cleanText(src.constraints, 400),
    age: src.age === "" || src.age == null ? undefined : src.age,
  };
}

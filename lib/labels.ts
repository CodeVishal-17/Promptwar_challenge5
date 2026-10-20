import type { EventType, Priority, Setting, Source, VendorStatus, Vibe } from "@/lib/types";

export const EVENT_LABEL: Record<EventType, string> = {
  wedding: "Wedding",
  birthday: "Birthday",
  community: "Community gathering",
};

export const EVENT_BLURB: Record<EventType, string> = {
  wedding: "Vows, a meal, and a timetable that leaves room for the ceremony.",
  birthday: "A cake, a room, and a plan that fits the person and their age.",
  community: "A site, a program, and care for everyone who walks in.",
};

export const SETTING_LABEL: Record<Setting, string> = {
  indoor: "Indoors",
  outdoor: "Outdoors",
  mixed: "Indoor and outdoor",
};

export const VIBE_LABEL: Record<Vibe, string> = {
  intimate: "Intimate",
  grand: "Grand",
  playful: "Playful",
  cultural: "Cultural",
  eco: "Low-waste",
  formal: "Formal",
  casual: "Casual",
};

export const PRIORITY_LABEL: Record<Priority, string> = {
  venue: "The place",
  food: "The food",
  experience: "The experience",
  photos: "Photographs",
  decor: "Décor",
};

export const STATUS_LABEL: Record<VendorStatus, string> = {
  todo: "Not started",
  shortlist: "Shortlisted",
  booked: "Booked",
  paid: "Paid",
};

export const SOURCE_LABEL: Record<Source, string> = {
  gemini: "Gemini",
  openai: "OpenAI",
  atelier: "Atelier composer",
};

export function dietList(dietary: string[]): string {
  return dietary.map((diet) => DIET_LABEL[diet] ?? diet).join(", ");
}

export function placeLead(setting: "indoor" | "outdoor" | "mixed"): string {
  if (setting === "outdoor") return "An outdoor";
  if (setting === "indoor") return "An indoor";
  return "An indoor-and-outdoor";
}

export const DIET_LABEL: Record<string, string> = {
  vegetarian: "Vegetarian",
  vegan: "Vegan",
  jain: "Jain",
  halal: "Halal",
  kosher: "Kosher",
  "gluten-free": "Gluten-free",
  "nut-free": "Nut-free",
  "kids-menu": "A children's plate",
};

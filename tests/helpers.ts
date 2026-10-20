import type { Brief } from "@/lib/types";

export const NOW = new Date(2026, 9, 20);

export function makeBrief(overrides: Partial<Brief> = {}): Brief {
  return {
    eventType: "wedding",
    title: "Asha & Rohan",
    honoree: "Asha and Rohan",
    date: "2027-02-14",
    city: "Udaipur",
    guests: 180,
    setting: "mixed",
    vibe: "cultural",
    culture: "Rajasthani wedding with a quiet morning ceremony",
    dietary: ["vegetarian", "jain"],
    budget: 1_800_000,
    currency: "INR",
    priorities: ["food", "experience"],
    mustHaves: "Lakeside portraits in the late afternoon",
    constraints: "No disposable plastic décor",
    ...overrides,
  };
}

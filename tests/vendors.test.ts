import { describe, expect, it } from "vitest";
import { allocateBudget } from "@/lib/budget";
import { buildVendors } from "@/lib/vendors";
import { makeBrief, NOW } from "./helpers";

describe("buildVendors", () => {
  it("balances vendor estimates with contingency", () => {
    for (const eventType of ["wedding", "birthday", "community"] as const) {
      const brief = makeBrief({ eventType, guests: eventType === "birthday" ? 24 : 120 });
      const categories = allocateBudget({
        eventType,
        budget: brief.budget,
        guests: brief.guests,
        setting: brief.setting,
        priorities: brief.priorities,
        dietary: brief.dietary,
        city: brief.city,
      });
      const vendors = buildVendors(brief, categories, NOW);
      const contingency = categories.find((category) => category.id === "contingency")?.amount ?? 0;
      const estimated = vendors.reduce((sum, vendor) => sum + vendor.estimate, 0);
      expect(estimated + contingency).toBe(brief.budget);
      expect(vendors.every((vendor) => vendor.questions.length >= 3)).toBe(true);
    }
  });

  it("includes an access role for community gatherings", () => {
    const brief = makeBrief({ eventType: "community", guests: 300, priorities: ["experience", "venue"] });
    const categories = allocateBudget({
      eventType: brief.eventType,
      budget: brief.budget,
      guests: brief.guests,
      setting: "outdoor",
      priorities: brief.priorities,
      dietary: brief.dietary,
      city: brief.city,
    });
    const vendors = buildVendors(brief, categories, NOW);
    expect(vendors.some((vendor) => vendor.id === "access")).toBe(true);
  });
});

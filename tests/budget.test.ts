import { describe, expect, it } from "vitest";
import { allocateBudget } from "@/lib/budget";
import { makeBrief } from "./helpers";

function input(overrides: Parameters<typeof allocateBudget>[0] extends infer T ? Partial<T> : never = {}) {
  const brief = makeBrief();
  return {
    eventType: brief.eventType,
    budget: brief.budget,
    guests: brief.guests,
    setting: brief.setting,
    priorities: brief.priorities,
    dietary: brief.dietary,
    city: brief.city,
    ...overrides,
  };
}

describe("allocateBudget", () => {
  it("sums every category to the exact budget", () => {
    for (const budget of [5_000, 45_000, 250_000, 1_000_001, 1_800_000]) {
      const categories = allocateBudget(input({ budget }));
      const total = categories.reduce((sum, category) => sum + category.amount, 0);
      expect(total).toBe(budget);
    }
  });

  it("gives food a larger share when food is the priority", () => {
    const plain = allocateBudget(input({ priorities: [], guests: 80 }));
    const foodFirst = allocateBudget(input({ priorities: ["food"], guests: 80 }));
    const plainFood = plain.find((category) => category.id === "food")?.amount ?? 0;
    const boosted = foodFirst.find((category) => category.id === "food")?.amount ?? 0;
    expect(boosted).toBeGreaterThan(plainFood);
  });

  it("keeps shares between 0 and 1", () => {
    const categories = allocateBudget(input());
    for (const category of categories) {
      expect(category.amount).toBeGreaterThan(0);
      expect(category.share).toBeGreaterThan(0);
      expect(category.share).toBeLessThan(1);
    }
  });
});

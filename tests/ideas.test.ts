import { describe, expect, it } from "vitest";
import { lineConflicts } from "@/lib/diet";
import { buildIdeas } from "@/lib/ideas";
import { composePlan } from "@/lib/planner";
import { makeBrief, NOW } from "./helpers";

describe("ideas", () => {
  it("keeps restricted foods out of the local recommendations", () => {
    const cases = [
      makeBrief({ dietary: ["vegetarian", "jain"] }),
      makeBrief({ eventType: "birthday", dietary: ["nut-free", "vegan"], age: 8, guests: 20, vibe: "playful" }),
      makeBrief({
        eventType: "community",
        dietary: ["vegetarian", "gluten-free"],
        constraints: "Alcohol-free. Amplified sound ends at 8pm.",
        vibe: "eco",
        guests: 300,
      }),
    ];
    for (const brief of cases) {
      const ideas = buildIdeas(brief);
      const lines = [...ideas.menu, ...ideas.decor, ...ideas.activities, ...ideas.moments, ...ideas.care, ideas.music, ideas.theme];
      expect(lines.filter((line) => lineConflicts(line, brief))).toEqual([]);
    }
  });

  it("rejects model copy that breaks a dietary rule and keeps the safe menu", () => {
    const brief = makeBrief({ dietary: ["vegetarian"] });
    const local = buildIdeas(brief);
    const plan = composePlan(
      brief,
      {
        summary: "A lakeside wedding with a plated chicken supper for every guest and plenty of time.",
        invitationLine: "Join us by the lake for dinner.",
        theme: "Lake house",
        decor: local.decor,
        menu: ["Roast chicken", "Fish fry", "Paneer", "Fruit"],
        activities: local.activities,
        music: local.music,
        moments: local.moments,
        care: local.care,
      },
      { now: NOW },
    );
    expect(plan.ideas.menu.join(" ").toLowerCase()).not.toContain("chicken");
    expect(plan.summary.toLowerCase()).not.toContain("chicken");
  });

  it("treats negated restrictions as safe and real dishes as conflicts", () => {
    const jain = makeBrief({ dietary: ["jain"] });
    expect(lineConflicts("A dal with no onion or garlic", jain)).toBe(false);
    expect(lineConflicts("Onion pakora", jain)).toBe(true);
    const gluten = makeBrief({ dietary: ["gluten-free"] });
    expect(lineConflicts("Gluten-free bread", gluten)).toBe(false);
    expect(lineConflicts("Warm sourdough bread", gluten)).toBe(true);
    const nuts = makeBrief({ dietary: ["nut-free"] });
    expect(lineConflicts("A nut-free cake", nuts)).toBe(false);
    expect(lineConflicts("Peanut chutney", nuts)).toBe(true);
    const dry = makeBrief({ constraints: "Alcohol-free" });
    expect(lineConflicts("Serve the welcome drink without alcohol", dry)).toBe(false);
    expect(lineConflicts("A glass of wine at dinner", dry)).toBe(true);
  });
});

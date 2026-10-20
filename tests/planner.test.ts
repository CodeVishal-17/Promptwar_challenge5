import { describe, expect, it } from "vitest";
import { composePlan, withAdjustments } from "@/lib/planner";
import { makeBrief, NOW } from "./helpers";

describe("composePlan", () => {
  it("mentions the city, the non-negotiable, and a balanced budget", () => {
    const brief = makeBrief();
    const plan = composePlan(brief, null, { id: "plan_test", now: NOW, source: "atelier" });
    expect(plan.id).toBe("plan_test");
    expect(plan.summary).toContain("Udaipur");
    expect(plan.summary).toContain("Lakeside portraits");
    expect(plan.budget.categories.reduce((sum, category) => sum + category.amount, 0)).toBe(brief.budget);
    expect(plan.invitationLine.length).toBeGreaterThan(8);
    expect(plan.ideas.palette).toHaveLength(4);
  });

  it("keeps vendor status when the budget is recalculated", () => {
    const plan = composePlan(makeBrief(), null, { now: NOW });
    plan.vendors[0] = { ...plan.vendors[0], status: "booked" };
    const next = withAdjustments(plan, { budget: 900_000, guests: 90 }, NOW);
    expect(next.brief.budget).toBe(900_000);
    expect(next.brief.guests).toBe(90);
    expect(next.vendors[0]?.status).toBe("booked");
    expect(next.budget.categories.reduce((sum, category) => sum + category.amount, 0)).toBe(900_000);
    expect(next.id).toBe(plan.id);
  });
});

import { describe, expect, it } from "vitest";
import { buildTimeline } from "@/lib/timeline";
import { makeBrief, NOW } from "./helpers";

describe("buildTimeline", () => {
  it("orders milestones and includes the event plus a follow-up", () => {
    const brief = makeBrief();
    const timeline = buildTimeline(brief, NOW);
    const dates = timeline.milestones.map((milestone) => milestone.date);
    expect(timeline.rush).toBe(false);
    expect(dates).toEqual([...dates].sort());
    expect(dates).toContain(brief.date);
    expect(dates.some((date) => date > brief.date)).toBe(true);
    expect(timeline.milestones.every((milestone) => milestone.tasks.length > 0)).toBe(true);
    expect(timeline.milestones[0]?.tasks.join(" ")).toContain(brief.mustHaves);
  });

  it("compresses the plan when the event is only a few days away", () => {
    const brief = makeBrief({ date: "2026-10-24" });
    const timeline = buildTimeline(brief, NOW);
    expect(timeline.rush).toBe(true);
    expect(timeline.daysUntil).toBe(4);
    expect(timeline.milestones.map((milestone) => milestone.date)).toContain("2026-10-24");
    expect(timeline.milestones.every((milestone) => milestone.date >= "2026-10-20")).toBe(true);
  });

  it("builds a shorter arc for a birthday", () => {
    const timeline = buildTimeline(
      makeBrief({
        eventType: "birthday",
        date: "2027-06-21",
        title: "Maya turns 8",
        honoree: "Maya",
        age: 8,
        guests: 24,
        mustHaves: "A short treasure hunt",
      }),
      NOW,
    );
    expect(timeline.rush).toBe(false);
    expect(timeline.milestones.length).toBeGreaterThan(3);
  });
});

import { describe, expect, it } from "vitest";
import { cleanText } from "@/lib/sanitize";
import { readBrief } from "@/lib/schema";
import { makeBrief, NOW } from "./helpers";

describe("readBrief", () => {
  it("accepts a complete brief", () => {
    const result = readBrief(makeBrief(), NOW);
    expect(result.ok).toBe(true);
  });

  it("strips markup from names", () => {
    const result = readBrief({ ...makeBrief(), title: "<script>alert(1)</script><b>Asha & Rohan</b>" }, NOW);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.brief.title).toBe("Asha & Rohan");
    expect(cleanText("<img src=x onerror=alert(1)>Hello", 40)).toBe("Hello");
  });

  it("rejects a past date, a tiny INR budget, and an empty priority list", () => {
    const past = readBrief(makeBrief({ date: "2026-01-01" }), NOW);
    const tiny = readBrief(makeBrief({ budget: 1000 }), NOW);
    const priorities = readBrief({ ...makeBrief(), priorities: [] }, NOW);
    expect(past.ok).toBe(false);
    expect(tiny.ok).toBe(false);
    expect(priorities.ok).toBe(false);
    if (!past.ok) expect(past.errors.some((error) => error.field === "date")).toBe(true);
    if (!tiny.ok) expect(tiny.errors.some((error) => error.field === "budget")).toBe(true);
  });

  it("rejects a date that is not on the calendar", () => {
    const result = readBrief(makeBrief({ date: "2027-02-31" }), NOW);
    expect(result.ok).toBe(false);
  });
});

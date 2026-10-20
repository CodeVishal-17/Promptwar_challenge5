import { describe, expect, it } from "vitest";
import { extractJson, parseNarrative } from "@/lib/ai/parse";
import { buildPrompt } from "@/lib/ai/prompt";
import { makeBrief } from "./helpers";

const good = {
  summary: "Asha and Rohan gather 180 people in Udaipur for a quiet February wedding.",
  invitationLine: "Asha and Rohan invite you to Udaipur on 14 February 2027.",
  theme: "The ceremony first",
  decor: ["Low seating for the ceremony", "Brass vessels with seasonal flowers", "A covered walk to the lake", "Borrowed glass"],
  menu: ["Lime and soda", "Moong dal with rice", "Cucumber salad", "Chilled fruit"],
  activities: ["A twenty-minute welcome", "The ceremony, unhurried", "Dinner before speeches"],
  music: "A quiet ceremony and conversation-level dinner.",
  moments: ["Arrival", "The ceremony", "The first course"],
  care: ["A step-free route", "Labelled plates", "Water within reach"],
};

describe("narrative tools", () => {
  it("puts the city, the diet, and the JSON shape in the prompt", () => {
    const prompt = buildPrompt(makeBrief({ dietary: ["nut-free"], city: "Pune" }));
    expect(prompt).toContain("Pune");
    expect(prompt).toContain("nut-free");
    expect(prompt).toContain("invitationLine");
    expect(prompt.toLowerCase()).toContain("json");
  });

  it("reads fenced JSON and rejects junk", () => {
    const fenced = "```json\n" + JSON.stringify(good) + "\n```";
    expect(parseNarrative(fenced)?.theme).toBe("The ceremony first");
    expect(parseNarrative("not json")).toBeNull();
    expect(parseNarrative({ summary: "too short" })).toBeNull();
    expect(extractJson('noise {"theme":"Lake"} tail')).toMatchObject({ theme: "Lake" });
  });

  it("strips tags from model copy", () => {
    const parsed = parseNarrative({ ...good, theme: "<b>Lake light</b>" });
    expect(parsed?.theme).toBe("Lake light");
  });
});

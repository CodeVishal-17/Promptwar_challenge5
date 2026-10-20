import { describe, expect, it } from "vitest";
import { createLimiter } from "@/lib/rate-limit";

describe("createLimiter", () => {
  it("allows a burst and then refuses until the window passes", () => {
    const allow = createLimiter(3, 1_000);
    expect(allow("a", 0)).toBe(true);
    expect(allow("a", 10)).toBe(true);
    expect(allow("a", 20)).toBe(true);
    expect(allow("a", 30)).toBe(false);
    expect(allow("b", 30)).toBe(true);
    expect(allow("a", 1_200)).toBe(true);
  });
});

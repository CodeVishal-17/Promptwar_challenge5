import { beforeEach, describe, expect, it, vi } from "vitest";
import { generateNarrative } from "@/lib/ai/generate";
import { composePlan } from "@/lib/planner";
import { guardPlanRequest } from "@/lib/rate-limit";
import { makeBrief } from "@/tests/helpers";
import { POST } from "./route";

vi.mock("@/lib/ai/generate", () => ({
  generateNarrative: vi.fn(),
}));

vi.mock("@/lib/planner", () => ({
  composePlan: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
  guardPlanRequest: vi.fn(),
}));

function futureDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function post(body: string, headers: Record<string, string> = { "content-type": "application/json" }) {
  return POST(
    new Request("http://localhost/api/plan", {
      method: "POST",
      headers,
      body,
    }),
  );
}

describe("POST /api/plan", () => {
  beforeEach(() => {
    vi.mocked(guardPlanRequest).mockReset();
    vi.mocked(guardPlanRequest).mockResolvedValue({ ok: true });
    vi.mocked(generateNarrative).mockReset();
    vi.mocked(composePlan).mockReset();
  });

  it("returns 415 when the body is not JSON", async () => {
    const response = await post("hello", { "content-type": "text/plain" });

    expect(response.status).toBe(415);
    expect(await response.json()).toEqual({ error: "Send the brief as JSON." });
    expect(generateNarrative).not.toHaveBeenCalled();
  });

  it("returns 413 when the brief is over 20,000 characters", async () => {
    const response = await post(JSON.stringify({ title: "x".repeat(20_000) }));

    expect(response.status).toBe(413);
    expect(await response.json()).toEqual({ error: "That brief is too long." });
    expect(generateNarrative).not.toHaveBeenCalled();
  });

  it("returns 400 for malformed JSON and for a brief that fails the schema", async () => {
    const malformed = await post("{");
    expect(malformed.status).toBe(400);
    expect(await malformed.json()).toEqual({ error: "Send the brief as JSON." });

    const invalid = await post(JSON.stringify(makeBrief({ title: "A", date: futureDate() })));
    expect(invalid.status).toBe(400);
    const body = (await invalid.json()) as { errors: Array<{ field: string }> };
    expect(body.errors.some((error) => error.field === "title")).toBe(true);
    expect(generateNarrative).not.toHaveBeenCalled();
  });

  it("returns 429 before calling the model when the per-minute limit refuses", async () => {
    vi.mocked(guardPlanRequest).mockResolvedValue({
      ok: false,
      status: 429,
      error: "Too many plans just now. Wait a minute and try again.",
    });

    const response = await post(JSON.stringify(makeBrief({ date: futureDate() })));

    expect(response.status).toBe(429);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({
      error: "Too many plans just now. Wait a minute and try again.",
    });
    expect(generateNarrative).not.toHaveBeenCalled();
    expect(composePlan).not.toHaveBeenCalled();
  });

  it("returns 429 before calling the model when the shared daily budget is spent", async () => {
    vi.mocked(guardPlanRequest).mockResolvedValue({
      ok: false,
      status: 429,
      error: "The studio has reached its shared daily plan budget. Try again tomorrow.",
    });

    const response = await post(JSON.stringify(makeBrief({ date: futureDate() })));

    expect(response.status).toBe(429);
    expect(await response.json()).toEqual({
      error: "The studio has reached its shared daily plan budget. Try again tomorrow.",
    });
    expect(generateNarrative).not.toHaveBeenCalled();
    expect(composePlan).not.toHaveBeenCalled();
  });

  it("returns 503 before calling the model when the limiter cannot operate", async () => {
    vi.mocked(guardPlanRequest).mockResolvedValue({
      ok: false,
      status: 503,
      error: "Plans are paused until the limiter is available. Try again in a moment.",
    });

    const response = await post(JSON.stringify(makeBrief({ date: futureDate() })));

    expect(response.status).toBe(503);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(generateNarrative).not.toHaveBeenCalled();
    expect(composePlan).not.toHaveBeenCalled();
  });

  it("returns the composed plan for a valid brief and strips markup first", async () => {
    const brief = makeBrief({ title: "<b>Asha & Rohan</b>", date: futureDate() });
    vi.mocked(generateNarrative).mockResolvedValue({ source: "atelier", narrative: null });
    vi.mocked(composePlan).mockReturnValue({ id: "plan_test" } as ReturnType<typeof composePlan>);

    const response = await post(JSON.stringify(brief));

    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toEqual({ plan: { id: "plan_test" } });
    expect(generateNarrative).toHaveBeenCalledWith(expect.objectContaining({ title: "Asha & Rohan", city: "Udaipur" }));
    expect(composePlan).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Asha & Rohan", guests: 180 }),
      null,
      expect.objectContaining({ source: "atelier" }),
    );
  });

  it("returns a generic 500 and hides the internal error", async () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.mocked(generateNarrative).mockResolvedValue({ source: "gemini", narrative: null });
    vi.mocked(composePlan).mockImplementation(() => {
      throw new Error("provider secret sk-test-should-not-leak");
    });

    const response = await post(JSON.stringify(makeBrief({ date: futureDate() })));
    const body = (await response.json()) as { error: string };

    expect(response.status).toBe(500);
    expect(body.error).toBe("Fête could not compose a plan. Try again in a moment.");
    expect(body.error).not.toContain("sk-test-should-not-leak");
    expect(JSON.stringify(body)).not.toContain("sk-test-should-not-leak");
    errorSpy.mockRestore();
  });
});

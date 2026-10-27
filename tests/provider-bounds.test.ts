import { afterEach, describe, expect, it, vi } from "vitest";
import { generateNarrative, MAX_OUTPUT_TOKENS, PROVIDER_TIMEOUT_MS } from "@/lib/ai/generate";
import { makeBrief } from "./helpers";

const narrative = {
  summary: "Asha and Rohan gather 180 people in Udaipur for a quiet February wedding.",
  invitationLine: "Asha and Rohan invite you to Udaipur on 14 February 2027.",
  theme: "The ceremony first",
  decor: ["Low seating for the ceremony", "Brass vessels with seasonal flowers"],
  menu: ["Lime and soda", "Moong dal with rice"],
  activities: ["A twenty-minute welcome", "The ceremony, unhurried"],
  music: "A quiet ceremony and conversation-level dinner.",
  moments: ["Arrival", "The ceremony"],
  care: ["A step-free route", "Labelled plates"],
};

const previous = {
  gemini: process.env.GEMINI_API_KEY,
  geminiModel: process.env.GEMINI_MODEL,
  openai: process.env.OPENAI_API_KEY,
  openaiModel: process.env.OPENAI_MODEL,
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
  restore("GEMINI_API_KEY", previous.gemini);
  restore("GEMINI_MODEL", previous.geminiModel);
  restore("OPENAI_API_KEY", previous.openai);
  restore("OPENAI_MODEL", previous.openaiModel);
});

describe("provider bounds", () => {
  it("bounds Gemini output and aborts the request at the provider timeout", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    delete process.env.GEMINI_MODEL;
    delete process.env.OPENAI_API_KEY;
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const urls: string[] = [];
    const bodies: Array<Record<string, unknown>> = [];
    vi.stubGlobal("fetch", (url: string, init: RequestInit) => {
      urls.push(url);
      bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      return Promise.resolve(jsonResponse({ candidates: [{ content: { parts: [{ text: JSON.stringify(narrative) }] } }] }));
    });

    const result = await generateNarrative(makeBrief());

    expect(result.source).toBe("gemini");
    expect(urls[0]?.startsWith("https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash:generateContent?")).toBe(true);
    expect(timeout).toHaveBeenCalledWith(PROVIDER_TIMEOUT_MS);
    expect(bodies[0]?.generationConfig).toMatchObject({ maxOutputTokens: MAX_OUTPUT_TOKENS });
  });

  it("bounds OpenAI output with the same timeout", async () => {
    delete process.env.GEMINI_API_KEY;
    delete process.env.OPENAI_MODEL;
    process.env.OPENAI_API_KEY = "test-openai-key";
    const timeout = vi.spyOn(AbortSignal, "timeout");
    const bodies: Array<Record<string, unknown>> = [];
    vi.stubGlobal("fetch", (_url: string, init: RequestInit) => {
      const headers = new Headers(init.headers);
      expect(headers.get("authorization")).toBe("Bearer test-openai-key");
      bodies.push(JSON.parse(String(init.body)) as Record<string, unknown>);
      return Promise.resolve(jsonResponse({ choices: [{ message: { content: JSON.stringify(narrative) } }] }));
    });

    const result = await generateNarrative(makeBrief());

    expect(result.source).toBe("openai");
    expect(timeout).toHaveBeenCalledWith(PROVIDER_TIMEOUT_MS);
    expect(bodies[0]?.max_completion_tokens).toBe(MAX_OUTPUT_TOKENS);
  });

  it("keeps the plan local when the provider times out", async () => {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    delete process.env.OPENAI_API_KEY;
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    vi.stubGlobal("fetch", () => Promise.reject(new DOMException("The operation was aborted", "TimeoutError")));

    const result = await generateNarrative(makeBrief());

    expect(result.source).toBe("atelier");
    expect(result.narrative).toBeNull();
    expect(spy.mock.calls.flat().join(" ")).not.toContain("test-gemini-key");
  });
});

function jsonResponse(body: unknown) {
  return new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } });
}

function restore(name: "GEMINI_API_KEY" | "GEMINI_MODEL" | "OPENAI_API_KEY" | "OPENAI_MODEL", value: string | undefined) {
  if (value === undefined) delete process.env[name];
  else process.env[name] = value;
}

import { BRAND } from "@/lib/brand";
import { parseNarrative } from "@/lib/ai/parse";
import { buildPrompt } from "@/lib/ai/prompt";
import type { Brief, Narrative, Source } from "@/lib/types";

export type NarrativeResult = {
  source: Source;
  narrative: Narrative | null;
  notice?: string;
};

type Provider = {
  source: Exclude<Source, "atelier">;
  key: string;
  model: string;
};

function providers(): Provider[] {
  const list: Provider[] = [];
  const gemini = process.env.GEMINI_API_KEY?.trim();
  if (gemini) {
    list.push({
      source: "gemini",
      key: gemini,
      model: process.env.GEMINI_MODEL?.trim() || "gemini-2.5-flash",
    });
  }
  const openai = process.env.OPENAI_API_KEY?.trim();
  if (openai) {
    list.push({
      source: "openai",
      key: openai,
      model: process.env.OPENAI_MODEL?.trim() || "gpt-4o-mini",
    });
  }
  return list;
}

export function activeSource(): Source {
  return providers()[0]?.source ?? "atelier";
}

async function complete(provider: Provider, prompt: string): Promise<string> {
  if (provider.source === "gemini") {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(provider.model)}:generateContent?key=${encodeURIComponent(provider.key)}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: AbortSignal.timeout(20_000),
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.7, responseMimeType: "application/json" },
      }),
    });
    if (!response.ok) throw new Error(`Gemini returned ${response.status}`);
    const payload = (await response.json()) as {
      candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
    };
    const text = payload.candidates?.[0]?.content?.parts?.map((part) => part.text ?? "").join("\n") ?? "";
    if (!text.trim()) throw new Error("Gemini returned an empty plan.");
    return text;
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${provider.key}`,
    },
    signal: AbortSignal.timeout(20_000),
    body: JSON.stringify({
      model: provider.model,
      temperature: 0.7,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: "You return only valid JSON for a celebration plan." },
        { role: "user", content: prompt },
      ],
    }),
  });
  if (!response.ok) throw new Error(`OpenAI returned ${response.status}`);
  const payload = (await response.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const text = payload.choices?.[0]?.message?.content ?? "";
  if (!text.trim()) throw new Error("OpenAI returned an empty plan.");
  return text;
}

export async function generateNarrative(brief: Brief): Promise<NarrativeResult> {
  const available = providers();
  if (available.length === 0) return { source: "atelier", narrative: null };
  const prompt = buildPrompt(brief);
  let lastNotice = `The model did not return usable copy, so the ${BRAND.writer} wrote this plan.`;
  for (const provider of available) {
    try {
      const text = await complete(provider, prompt);
      const narrative = parseNarrative(text);
      if (!narrative) {
        lastNotice = `The model reply did not match the plan shape, so the ${BRAND.writer} wrote this plan.`;
        continue;
      }
      return { source: provider.source, narrative };
    } catch {
      console.error(`${BRAND.name} narrative provider ${provider.source} failed.`);
      lastNotice = `The model could not be reached, so the ${BRAND.writer} wrote this plan.`;
    }
  }
  return { source: "atelier", narrative: null, notice: lastNotice };
}

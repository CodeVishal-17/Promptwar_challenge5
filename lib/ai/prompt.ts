import { BRAND } from "@/lib/brand";
import type { Brief } from "@/lib/types";

export function buildPrompt(brief: Brief): string {
  return [
    `You are the copy editor for ${BRAND.name}, a celebration planning atelier.`,
    "Write practical, specific copy for this one event. No brand names, no hashtags, no clichés about making memories.",
    "Respect every dietary rule and constraint. Never recommend a restricted food or drink, even to say you are avoiding it.",
    "If alcohol is forbidden, do not mention wine, beer, cocktails, or a bar.",
    "Match the city, the guest count, and the budget. A modest budget should not sound like a palace, and a large one should not sound sparse.",
    "Do not invent vendor businesses. Describe the role and the question to ask.",
    "Return only JSON with this shape:",
    JSON.stringify(
      {
        summary: "Two or three sentences, under 500 characters.",
        invitationLine: "One sentence a host could send.",
        theme: "A short theme name.",
        decor: ["four practical décor notes"],
        menu: ["four dishes or service notes that respect the dietary rules"],
        activities: ["three things that fit the event and the age, if given"],
        music: "One sentence.",
        moments: ["three guest-experience beats"],
        care: ["three notes on access, food labelling, or comfort"],
      },
      null,
      2,
    ),
    "Brief:",
    JSON.stringify(brief),
  ].join("\n\n");
}

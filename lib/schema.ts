import { z } from "zod";
import { addDays, parseISODate, startOfDay } from "@/lib/dates";
import { sanitizeBrief } from "@/lib/sanitize";
import {
  CURRENCIES,
  DIETS,
  EVENT_TYPES,
  PRIORITIES,
  SETTINGS,
  VIBES,
  type Brief,
  type FieldError,
} from "@/lib/types";

const briefObject = z.object({
  eventType: z.enum(EVENT_TYPES, { message: "Choose a wedding, birthday, or community event." }),
  title: z.string().trim().min(2, "Give the event a name.").max(80, "Keep the name under 80 characters."),
  honoree: z.string().trim().min(2, "Say who the event is for.").max(80, "Keep that under 80 characters."),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use a real date."),
  city: z.string().trim().min(2, "Add a city or neighbourhood.").max(80),
  guests: z.coerce
    .number({ invalid_type_error: "Enter the number of guests." })
    .int("Use a whole number of guests.")
    .min(1, "Plan for at least one guest.")
    .max(5000, "Five thousand guests is the studio limit."),
  setting: z.enum(SETTINGS, { message: "Choose indoors, outdoors, or both." }),
  vibe: z.enum(VIBES, { message: "Choose the feeling of the day." }),
  culture: z.string().trim().max(240).default(""),
  dietary: z.array(z.enum(DIETS)).max(8).default([]),
  budget: z.coerce
    .number({ invalid_type_error: "Enter a budget as a whole number." })
    .int("Use a whole number for the budget.")
    .positive("Enter a budget above zero.")
    .max(100_000_000, "That budget is past what this studio plans."),
  currency: z.enum(CURRENCIES, { message: "Choose a currency." }),
  priorities: z.array(z.enum(PRIORITIES)).min(1, "Choose where the money should lean.").max(2, "Choose two priorities at most."),
  mustHaves: z.string().trim().max(400).default(""),
  constraints: z.string().trim().max(400).default(""),
  age: z.preprocess((value) => {
    if (value === "" || value == null) return undefined;
    return typeof value === "number" ? value : Number(value);
  }, z.number().int().min(1, "Age starts at 1.").max(120, "Check the age.").optional()),
});

export function createBriefSchema(now = new Date()) {
  const today = startOfDay(now);
  const latest = addDays(today, 365 * 3);
  return briefObject.superRefine((value, ctx) => {
    const date = parseISODate(value.date);
    if (!date) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "That date is not on the calendar." });
      return;
    }
    if (date < today) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["date"], message: "Choose today or a future date." });
    } else if (date > latest) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["date"],
        message: "Keep the date within the next three years.",
      });
    }
    const minimum = value.currency === "INR" ? 5000 : 50;
    if (value.budget < minimum) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["budget"],
        message:
          value.currency === "INR"
            ? "Use at least ₹5,000 so the category split is meaningful."
            : "Use at least 50 in this currency so the category split is meaningful.",
      });
    }
  });
}

function toFieldErrors(error: z.ZodError): FieldError[] {
  const seen = new Set<string>();
  const errors: FieldError[] = [];
  for (const issue of error.issues) {
    const field = issue.path.join(".") || "form";
    if (seen.has(field)) continue;
    seen.add(field);
    errors.push({ field, message: issue.message });
  }
  return errors;
}

export function readBrief(
  input: unknown,
  now = new Date(),
): { ok: true; brief: Brief } | { ok: false; errors: FieldError[] } {
  const parsed = createBriefSchema(now).safeParse(sanitizeBrief(input));
  if (!parsed.success) return { ok: false, errors: toFieldErrors(parsed.error) };
  const brief: Brief = {
    eventType: parsed.data.eventType,
    title: parsed.data.title,
    honoree: parsed.data.honoree,
    date: parsed.data.date,
    city: parsed.data.city,
    guests: parsed.data.guests,
    setting: parsed.data.setting,
    vibe: parsed.data.vibe,
    culture: parsed.data.culture,
    dietary: parsed.data.dietary,
    budget: parsed.data.budget,
    currency: parsed.data.currency,
    priorities: parsed.data.priorities,
    mustHaves: parsed.data.mustHaves,
    constraints: parsed.data.constraints,
    age: parsed.data.age,
  };
  return { ok: true, brief };
}

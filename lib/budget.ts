import { dietList } from "@/lib/labels";
import type { BudgetCategory, EventType, Priority, Setting } from "@/lib/types";

type Weight = {
  id: string;
  label: string;
  weight: number;
  priority?: Priority;
  note: (input: BudgetInput) => string;
};

export type BudgetInput = {
  eventType: EventType;
  budget: number;
  guests: number;
  setting: Setting;
  priorities: Priority[];
  dietary: string[];
  city: string;
};

const dietPhrase = (dietary: string[]) =>
  dietary.length > 0 ? dietList(dietary) : "the mix of guests you are inviting";

const TABLES: Record<EventType, Weight[]> = {
  wedding: [
    {
      id: "venue",
      label: "Place and rentals",
      weight: 28,
      priority: "venue",
      note: (input) =>
        `A room in ${input.city} that can hold ${input.guests} people, plus tables, power, and a backup if the weather turns.`,
    },
    {
      id: "food",
      label: "Food and drink",
      weight: 27,
      priority: "food",
      note: (input) =>
        `Price a tasting before the deposit. Every plate needs to work for ${dietPhrase(input.dietary)}.`,
    },
    {
      id: "photo",
      label: "Photographs",
      weight: 10,
      priority: "photos",
      note: () => "Book coverage for the ceremony and one honest hour of portraits. Skip a second shooter unless the site is split.",
    },
    {
      id: "attire",
      label: "Attire and grooming",
      weight: 8,
      note: () => "Alterations take longer than the outfit. Put the fitting on the calendar the week you order.",
    },
    {
      id: "decor",
      label: "Flowers and décor",
      weight: 9,
      priority: "decor",
      note: () => "Spend on the ceremony and the table people sit at. Leave the ceiling alone unless the room is bare.",
    },
    {
      id: "music",
      label: "Music",
      weight: 7,
      priority: "experience",
      note: () => "A quiet set for dinner and a louder one after the last speech. Confirm the sound cutoff in writing.",
    },
    {
      id: "paper",
      label: "Invitations",
      weight: 3,
      note: () => "Send a date people can trust. Digital is enough if the guest list is already in a chat.",
    },
    {
      id: "contingency",
      label: "Contingency",
      weight: 8,
      note: () => "Hold this back. The first invoice is rarely the last one.",
    },
  ],
  birthday: [
    {
      id: "place",
      label: "Place",
      weight: 18,
      priority: "venue",
      note: (input) => `Somewhere ${input.guests} people can arrive, celebrate, and leave without a second venue.`,
    },
    {
      id: "food",
      label: "Food",
      weight: 24,
      priority: "food",
      note: (input) => `Keep it to food people will actually finish, with ${dietPhrase(input.dietary)} covered on the same table.`,
    },
    {
      id: "cake",
      label: "Cake",
      weight: 8,
      note: () => "Order the cake for the number who will eat it, not the number on the invitation.",
    },
    {
      id: "decor",
      label: "Décor",
      weight: 12,
      priority: "decor",
      note: () => "One strong idea beats a shop full of matching plastic. Plan how it comes down the same day.",
    },
    {
      id: "entertainment",
      label: "Entertainment",
      weight: 16,
      priority: "experience",
      note: () => "Plan one arrival, one main activity, cake, and a wind-down. Cut anything that needs a rehearsal you do not have.",
    },
    {
      id: "photo",
      label: "Photographs",
      weight: 8,
      priority: "photos",
      note: () => "An hour around the cake is enough for most birthdays. Ask a guest only if they already offered.",
    },
    {
      id: "favors",
      label: "Favors",
      weight: 5,
      note: () => "If the budget is tight, a good goodbye beats a bag of things people leave on the chair.",
    },
    {
      id: "contingency",
      label: "Contingency",
      weight: 9,
      note: () => "Keep a slice for the extra guest and the thing you forgot until Thursday.",
    },
  ],
  community: [
    {
      id: "site",
      label: "Site and permits",
      weight: 20,
      priority: "venue",
      note: (input) => `Permits, power, water, and insurance for a gathering of ${input.guests} in ${input.city}.`,
    },
    {
      id: "food",
      label: "Food and water",
      weight: 22,
      priority: "food",
      note: (input) => `Water first, then food that can sit safely and still suit ${dietPhrase(input.dietary)}.`,
    },
    {
      id: "program",
      label: "Program",
      weight: 16,
      priority: "experience",
      note: () => "Pay the people running the program. Volunteers can help; they should not carry the whole day.",
    },
    {
      id: "decor",
      label: "Signage and décor",
      weight: 8,
      priority: "decor",
      note: () => "Wayfinding matters more than a backdrop. People should know where to enter, sit, and leave.",
    },
    {
      id: "access",
      label: "Access and care",
      weight: 12,
      note: () => "A step-free route, seating, shade or cover, a quiet corner, and a person whose only job is care.",
    },
    {
      id: "outreach",
      label: "Outreach",
      weight: 8,
      note: () => "Tell the neighbourhood in the languages it already uses. Posters alone will not fill the site.",
    },
    {
      id: "photo",
      label: "Documentation",
      weight: 6,
      priority: "photos",
      note: () => "Photograph the work and the crowd, and get consent before you publish faces.",
    },
    {
      id: "contingency",
      label: "Contingency",
      weight: 8,
      note: () => "Weather, a permit fee, and extra water usually arrive together. Keep this unspent until the week of the event.",
    },
  ],
};

function weightFor(item: Weight, input: BudgetInput): number {
  let weight = item.weight;
  if (item.priority && input.priorities.includes(item.priority)) weight *= 1.35;
  if (input.setting === "outdoor" && (item.id === "venue" || item.id === "place" || item.id === "site" || item.id === "decor")) {
    weight *= 1.1;
  }
  if (input.guests >= 150 && item.id === "food") weight *= 1.12;
  return weight;
}

export function allocateBudget(input: BudgetInput): BudgetCategory[] {
  if (!Number.isInteger(input.budget) || input.budget < 0) {
    throw new Error("Budget must be a non-negative integer.");
  }
  const rows = TABLES[input.eventType];
  const weights = rows.map((row) => weightFor(row, input));
  const sum = weights.reduce((total, weight) => total + weight, 0);
  const raw = weights.map((weight) => (input.budget * weight) / sum);
  const amounts = raw.map((value) => Math.floor(value));
  let leftover = input.budget - amounts.reduce((total, amount) => total + amount, 0);
  const order = raw
    .map((value, index) => ({ index, fraction: value - amounts[index] }))
    .sort((a, b) => b.fraction - a.fraction || a.index - b.index);
  let cursor = 0;
  while (leftover > 0 && order.length > 0) {
    amounts[order[cursor % order.length].index] += 1;
    leftover -= 1;
    cursor += 1;
  }
  return rows.map((row, index) => ({
    id: row.id,
    label: row.label,
    amount: amounts[index],
    share: input.budget === 0 ? 0 : amounts[index] / input.budget,
    note: row.note(input),
  }));
}

import { addDays, formatISODate, parseISODate, startOfDay } from "@/lib/dates";
import { dietList, placeLead } from "@/lib/labels";
import type { Brief, BudgetCategory, Vendor, VendorStatus } from "@/lib/types";

type VendorSeed = {
  id: string;
  categoryId: string;
  category: string;
  role: string;
  share: number;
  offset: number;
  brief: (input: Brief) => string;
  questions: (input: Brief) => string[];
};

const WEDDING: VendorSeed[] = [
  {
    id: "venue",
    categoryId: "venue",
    category: "Place",
    role: "Venue",
    share: 1,
    offset: 150,
    brief: (input) =>
      `${placeLead(input.setting)} place in ${input.city} for ${input.guests} guests. Ask what furniture, power, and overtime actually cost.`,
    questions: () => [
      "What is included, and what is a rental on top?",
      "Is there a step-free route from the drop-off to the ceremony seats?",
      "What is the rain plan, the noise cutoff, and the latest hour?",
    ],
  },
  {
    id: "caterer",
    categoryId: "food",
    category: "Food",
    role: "Caterer",
    share: 1,
    offset: 90,
    brief: (input) =>
      `A kitchen that can serve ${input.guests} in ${input.city}${input.dietary.length ? `, including ${dietList(input.dietary)}` : ""}. Get the per-plate number in writing.`,
    questions: (input) => [
      "Can the restricted plates look like the rest of the meal?",
      "What is the price if the count moves by ten people?",
      input.constraints.toLowerCase().includes("alcohol")
        ? "Show a zero-proof welcome drink, not a bar."
        : "What is included besides the plated meal?",
    ],
  },
  {
    id: "photo",
    categoryId: "photo",
    category: "Photographs",
    role: "Photographer",
    share: 1,
    offset: 120,
    brief: (input) =>
      `Coverage for the ceremony and portraits in ${input.city}. Ask to see a full wedding, including the ordinary minutes.`,
    questions: () => [
      "How many hours, and who edits?",
      "When do we receive the pictures?",
      "What happens if you are ill that week?",
    ],
  },
  {
    id: "attire",
    categoryId: "attire",
    category: "Attire",
    role: "Attire and grooming",
    share: 1,
    offset: 120,
    brief: () => "Outfit, alterations, and the person who helps you dress. Book the fitting, not just the clothes.",
    questions: () => ["When is the last alteration?", "Who is on call the morning of the wedding?", "What is the rush fee?"],
  },
  {
    id: "decor",
    categoryId: "decor",
    category: "Décor",
    role: "Flowers and décor",
    share: 1,
    offset: 75,
    brief: (input) =>
      `Décor for a ${input.vibe} wedding. Spend on the ceremony and the tables, and use flowers that survive the season in ${input.city}.`,
    questions: () => [
      "What is reused, and what is thrown away?",
      "Who strikes the room, and how late?",
      "Can you work without floral foam?",
    ],
  },
  {
    id: "music",
    categoryId: "music",
    category: "Music",
    role: "Music",
    share: 1,
    offset: 120,
    brief: () => "Ceremony music and dinner music are different jobs. Book the one that matches the promises you made about sound.",
    questions: (input) => [
      "What is the sound limit at this venue?",
      "Can you play the ceremony and then a quieter dinner?",
      input.culture ? `Have you worked inside a plan like this: ${input.culture}?` : "Who announces, if anyone?",
    ],
  },
  {
    id: "paper",
    categoryId: "paper",
    category: "Paper",
    role: "Invitations",
    share: 1,
    offset: 60,
    brief: () => "A clear invitation with the date, city, and a way to reply. Print only if the list needs paper.",
    questions: () => ["What is the proofing time?", "Can we correct a name without reprinting everything?", "When do they arrive?"],
  },
];

const BIRTHDAY: VendorSeed[] = [
  {
    id: "place",
    categoryId: "place",
    category: "Place",
    role: "Place",
    share: 1,
    offset: 40,
    brief: (input) => `${placeLead(input.setting)} spot in ${input.city} for ${input.guests} people, with a known end time.`,
    questions: () => ["What are the noise rules?", "Is there a toilet and a place to sit?", "What cleanup is ours?"],
  },
  {
    id: "caterer",
    categoryId: "food",
    category: "Food",
    role: "Food",
    share: 1,
    offset: 21,
    brief: (input) =>
      `Food for ${input.guests}${input.dietary.length ? ` with ${dietList(input.dietary)} on the same table` : ""}. Prefer one good thing over five trays.`,
    questions: () => ["Which allergens are in the kitchen that day?", "Can you label every tray?", "What time do you deliver?"],
  },
  {
    id: "cake",
    categoryId: "cake",
    category: "Cake",
    role: "Cake",
    share: 1,
    offset: 21,
    brief: (input) => `A cake for ${input.honoree}, sized for the people who will eat it.`,
    questions: (input) => [
      input.dietary.includes("nut-free") ? "Can you bake this in a nut-free kitchen?" : "What is in the filling?",
      "When do you deliver, and does it need a fridge?",
      "Can you write the name correctly?",
    ],
  },
  {
    id: "decor",
    categoryId: "decor",
    category: "Décor",
    role: "Décor",
    share: 1,
    offset: 14,
    brief: () => "One idea, executed. Plan the takedown when you plan the setup.",
    questions: () => ["What is rented versus bought?", "Who takes it down?", "Can it survive the weather or the room's ceiling?"],
  },
  {
    id: "entertainment",
    categoryId: "entertainment",
    category: "Program",
    role: "Entertainment",
    share: 1,
    offset: 30,
    brief: (input) =>
      input.age != null && input.age < 12
        ? "A host who can hold a young room for a short arc: arrive, play, cake, goodbye."
        : "Music or a host for the one part of the party that needs cueing. The rest can be conversation.",
    questions: () => ["How long is the set?", "What do you need from the room?", "What is the backup if a game fails?"],
  },
  {
    id: "photo",
    categoryId: "photo",
    category: "Photographs",
    role: "Photographer",
    share: 1,
    offset: 21,
    brief: () => "An hour or two around the people, not a staged shoot that eats the party.",
    questions: () => ["Are the pictures included in the fee?", "Will you stay out of the activity?", "When do we get them?"],
  },
  {
    id: "favors",
    categoryId: "favors",
    category: "Favors",
    role: "Favors",
    share: 1,
    offset: 10,
    brief: (input) => `A small goodbye for ${input.guests} guests, or nothing. Edible and easy to carry is enough.`,
    questions: () => ["Can you skip plastic packaging?", "Are the ingredients labelled?", "Will they survive the trip home?"],
  },
];

const COMMUNITY: VendorSeed[] = [
  {
    id: "site",
    categoryId: "site",
    category: "Site",
    role: "Site and permits",
    share: 1,
    offset: 90,
    brief: (input) => `Permission to gather ${input.guests} people in ${input.city}, plus power, water, and waste.`,
    questions: () => ["Which permit, and how long does it take?", "What must be cleared that night?", "Is there a noise clause?"],
  },
  {
    id: "caterer",
    categoryId: "food",
    category: "Food",
    role: "Food and water",
    share: 1,
    offset: 30,
    brief: (input) =>
      `Water for everyone and food that stays safe outdoors${input.dietary.length ? `, with ${dietList(input.dietary)} labelled` : ""}.`,
    questions: () => ["How will you keep food safe in this weather?", "Can you label allergens in large type?", "What is the water plan?"],
  },
  {
    id: "program",
    categoryId: "program",
    category: "Program",
    role: "Program lead",
    share: 1,
    offset: 45,
    brief: (input) => `A host for ${input.title} who can keep time and stop a segment that runs long.`,
    questions: () => ["Have you hosted a mixed-age crowd?", "What is your rain version?", "Who holds the microphone if you step away?"],
  },
  {
    id: "decor",
    categoryId: "decor",
    category: "Signage",
    role: "Signage and décor",
    share: 1,
    offset: 21,
    brief: () => "Signs for entry, water, toilets, the quiet corner, and the way out. Décor comes after that.",
    questions: () => ["Can the signs be read from a few metres?", "How are they mounted without damage?", "Who collects them?"],
  },
  {
    id: "access",
    categoryId: "access",
    category: "Care",
    role: "Access and care",
    share: 1,
    offset: 40,
    brief: () => "A person and a budget for step-free entry, seating, shade or cover, and a quiet place.",
    questions: () => [
      "Where is the step-free route, in practice?",
      "Who staffs the quiet corner?",
      "Where is first aid, and who knows how to use it?",
    ],
  },
  {
    id: "outreach",
    categoryId: "outreach",
    category: "Outreach",
    role: "Outreach",
    share: 1,
    offset: 30,
    brief: (input) => `Invitation work in ${input.city}: the channels neighbours already trust, plus a contact number.`,
    questions: () => ["Which languages does the notice need?", "How will people ask for access help?", "Who answers on the day?"],
  },
  {
    id: "photo",
    categoryId: "photo",
    category: "Documentation",
    role: "Documentation",
    share: 1,
    offset: 21,
    brief: () => "Pictures of the program with consent. Faces are not a backdrop.",
    questions: () => ["How will you ask before photographing children?", "Who may publish the pictures?", "When do we receive them?"],
  },
];

const SEEDS: Record<Brief["eventType"], VendorSeed[]> = {
  wedding: WEDDING,
  birthday: BIRTHDAY,
  community: COMMUNITY,
};

export function buildVendors(brief: Brief, categories: BudgetCategory[], now = new Date()): Vendor[] {
  const event = parseISODate(brief.date);
  if (!event) throw new Error("Event date is not valid.");
  const today = startOfDay(now);
  const amounts = new Map(categories.map((category) => [category.id, category.amount]));
  return SEEDS[brief.eventType].map((seed) => {
    const estimate = amounts.get(seed.categoryId) ?? 0;
    const ideal = addDays(event, -seed.offset);
    const book = ideal < today ? today : ideal;
    const status: VendorStatus = "todo";
    return {
      id: seed.id,
      categoryId: seed.categoryId,
      category: seed.category,
      role: seed.role,
      brief: seed.brief(brief),
      bookBy: formatISODate(book),
      urgent: formatISODate(book) === formatISODate(today),
      estimate,
      questions: seed.questions(brief),
      status,
    };
  });
}

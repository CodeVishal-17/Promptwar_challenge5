import { addDays, daysBetween, formatISODate, parseISODate, startOfDay } from "@/lib/dates";
import { dietList } from "@/lib/labels";
import type { Brief, Milestone } from "@/lib/types";

type Template = {
  id: string;
  title: string;
  offset: number;
  phase: string;
  detail: (brief: Brief) => string;
  tasks: (brief: Brief) => string[];
};

function ritualTasks(brief: Brief): string[] {
  if (brief.eventType !== "wedding" || !brief.culture) return [];
  const notes: string[] = [];
  if (/mehndi|mehendi/i.test(brief.culture)) {
    notes.push("Give the mehendi its own hour and a seat for anyone who wants to skip it.");
  }
  if (/sangeet/i.test(brief.culture)) {
    notes.push("Cap the sangeet lineup. Ten songs feel shorter in the room than they do on a spreadsheet.");
  }
  if (/phera|phere|mandap/i.test(brief.culture)) {
    notes.push("Walk the ceremony once with the person guiding it, including where elders sit.");
  }
  if (/nikah|walima/i.test(brief.culture)) {
    notes.push("Confirm the nikah timing separately from the reception so neither feels rushed.");
  }
  if (/chuppah|ketubah|jewish/i.test(brief.culture)) {
    notes.push("Reserve a quiet room before the ceremony and confirm who stands under the chuppah.");
  }
  if (/church|mass|nuptial/i.test(brief.culture)) {
    notes.push("Ask the church for its music rules and arrival time before you book a band.");
  }
  return notes;
}

const WEDDING: Template[] = [
  {
    id: "vision",
    title: "Set the spine of the day",
    offset: 180,
    phase: "Vision",
    detail: (brief) =>
      `Decide what ${brief.title} is actually for, then spend only in that direction. Guest count is ${brief.guests} in ${brief.city}.`,
    tasks: (brief) => [
      "Write the guest list in three rings: must, should, and if the room allows.",
      brief.mustHaves ? `Protect this non-negotiable: ${brief.mustHaves}` : "Name one thing the day must include.",
      brief.constraints ? `Write the limits where you will see them: ${brief.constraints}` : "Name one thing the day will not include.",
    ],
  },
  {
    id: "venue",
    title: "Hold the place",
    offset: 150,
    phase: "Book",
    detail: (brief) =>
      `Look at rooms that fit ${brief.guests} without using every fire-exit chair. ${brief.setting === "outdoor" ? "Ask about shade, rain cover, and toilets." : "Ask what is included after midnight."}`,
    tasks: () => [
      "Visit once in the light you will actually have.",
      "Get the cancellation date and the overtime rate in the same email.",
      "Check a step-free path from drop-off to the seats.",
    ],
  },
  {
    id: "people",
    title: "Book the people you cannot replace",
    offset: 120,
    phase: "Book",
    detail: () => "Photographer, music, and the ceremony guide go before décor. Their calendars close first.",
    tasks: (brief) => [
      "Share the ceremony order before you ask anyone for a quote.",
      ...ritualTasks(brief),
      "Ask photographers for a full wedding, not a styled shoot.",
    ],
  },
  {
    id: "food",
    title: "Taste the meal",
    offset: 90,
    phase: "Design",
    detail: (brief) =>
      brief.dietary.length
        ? `The kitchen has to cook for ${dietList(brief.dietary)} without making those plates an apology.`
        : "Taste the two dishes people will remember, and ask what happens when twenty extra guests appear.",
    tasks: () => [
      "Book a tasting for two and pay for it.",
      "Ask for a per-guest price that includes service, water, and the late plate.",
      "Confirm how allergens are kept off the line.",
    ],
  },
  {
    id: "paper",
    title: "Invite people to a date you can keep",
    offset: 45,
    phase: "Design",
    detail: (brief) => `Send word to ${brief.city} only after the place and the ceremony time are real.`,
    tasks: () => [
      "Collect addresses from the people who will actually chase them.",
      "Put the start time, the city, and a contact number on the invite.",
      "Leave a week for replies before you chase anyone.",
    ],
  },
  {
    id: "confirm",
    title: "Counts, seats, and the run of show",
    offset: 21,
    phase: "Confirm",
    detail: () => "This is the week the plan becomes a document other people can follow.",
    tasks: (brief) => [
      `Lock a working count near ${brief.guests} and tell the kitchen.`,
      "Seat people who travelled near someone they already know.",
      "Write a one-page run of show with times, not wishes.",
    ],
  },
  {
    id: "week",
    title: "Walk the site once",
    offset: 7,
    phase: "Confirm",
    detail: () => "Confirm payments, the rain plan, and who holds the vendor phone list.",
    tasks: () => [
      "Pay the balances that are due, and keep the contingency untouched.",
      "Pack a small kit: tape, pins, medicine, a charger, and a printed plan.",
      "Tell the family the one decision they no longer get to reopen.",
    ],
  },
  {
    id: "eve",
    title: "The day before",
    offset: 1,
    phase: "Celebrate",
    detail: () => "Rehearse the entrance and the exit. Eat a real meal. Stop redesigning the flowers.",
    tasks: () => ["Confirm tomorrow's call times.", "Charge the phones you will actually use.", "Lay out outfits tonight."],
  },
  {
    id: "day",
    title: "The wedding",
    offset: 0,
    phase: "Celebrate",
    detail: (brief) => `${brief.title} in ${brief.city}. The plan is now a hospitality job, not a design project.`,
    tasks: () => [
      "Feed the couple before the ceremony.",
      "Point one person at the timeline and one person at the guests.",
      "Start the meal when the ceremony ends, not when the photographs do.",
    ],
  },
  {
    id: "after",
    title: "Close the books",
    offset: -2,
    phase: "After",
    detail: () => "Pay what is left, return what you borrowed, and write the thank-yous while the day is still clear.",
    tasks: () => ["Settle the final invoices.", "Return rentals the next morning.", "Send the names you promised to send."],
  },
];

const BIRTHDAY: Template[] = [
  {
    id: "vision",
    title: "Decide the shape of the party",
    offset: 60,
    phase: "Vision",
    detail: (brief) =>
      `${brief.honoree}${brief.age ? `, turning ${brief.age},` : ""} gets a party of ${brief.guests} in ${brief.city}. Keep it short enough that the guest of honour is still glad at the end.`,
    tasks: (brief) => [
      brief.mustHaves ? `Build the party around this: ${brief.mustHaves}` : "Pick one activity that is the party, and let the rest support it.",
      brief.constraints ? `Respect this limit: ${brief.constraints}` : "Choose an end time and tell people when you invite them.",
      brief.age != null && brief.age < 12 ? "Plan for short attention and a grown-up in each corner." : "Ask the guest of honour what they want before you theme the room.",
    ],
  },
  {
    id: "place",
    title: "Book the room",
    offset: 40,
    phase: "Book",
    detail: (brief) =>
      brief.setting === "outdoor"
        ? "Outdoors needs shade, a toilet plan, and a time you will move inside or go home."
        : "Confirm the room can get messy in the way this party will, and that you can leave on time.",
    tasks: () => ["Check noise rules.", "Find a corner for gifts and a corner for coats.", "Ask what you must clean yourself."],
  },
  {
    id: "food",
    title: "Food, cake, and the candle",
    offset: 30,
    phase: "Design",
    detail: (brief) =>
      brief.dietary.length
        ? `Order food and a cake that can serve ${dietList(brief.dietary)} without a separate sad plate.`
        : "Order less variety and more of what this group eats.",
    tasks: () => ["Confirm the cake flavour with the guest of honour.", "Ask the baker about allergens in writing.", "Plan cake earlier than you think."],
  },
  {
    id: "invite",
    title: "Invite with an end time",
    offset: 21,
    phase: "Design",
    detail: () => "Parents and friends plan around a finish, not a vibe.",
    tasks: (brief) => [
      `Tell people the city, the start, and when ${brief.honoree} needs to go home.`,
      "Ask about allergies again, even if you asked once.",
      "Keep a small list of who is bringing what, if anyone is.",
    ],
  },
  {
    id: "prep",
    title: "Prepare the activity",
    offset: 10,
    phase: "Confirm",
    detail: () => "Buy or borrow only what the one activity needs. Test it once at home.",
    tasks: () => ["Write a three-line running order.", "Charge speakers and cameras.", "Pack water, wipes, and a spare knife for the cake."],
  },
  {
    id: "confirm",
    title: "Confirm the headcount",
    offset: 3,
    phase: "Confirm",
    detail: (brief) => `Call the place and the food with a number close to ${brief.guests}.`,
    tasks: () => ["Reconfirm delivery times.", "Lay out a welcome note if people are helping.", "Sleep."],
  },
  {
    id: "day",
    title: "The birthday",
    offset: 0,
    phase: "Celebrate",
    detail: (brief) => `Stay near ${brief.honoree}. The guests can find the food.`,
    tasks: () => ["Start on time.", "Do the main activity before people get hungry.", "End while everyone still likes each other."],
  },
  {
    id: "after",
    title: "The next morning",
    offset: -1,
    phase: "After",
    detail: () => "Return what you borrowed and send the two photos that are actually good.",
    tasks: () => ["Take the décor down.", "Pay anyone still waiting.", "Write down what you would skip next year."],
  },
];

const COMMUNITY: Template[] = [
  {
    id: "permit",
    title: "Secure the site and the permission",
    offset: 90,
    phase: "Vision",
    detail: (brief) =>
      `${brief.title} needs a legal place to gather ${brief.guests} people in ${brief.city}. Start with the permit, not the poster.`,
    tasks: (brief) => [
      "Confirm who owns the land and which permit office answers.",
      brief.mustHaves ? `Design the site around this: ${brief.mustHaves}` : "Walk the site and mark entry, water, and exit.",
      "Budget a real access route before you budget a backdrop.",
    ],
  },
  {
    id: "program",
    title: "Name the program and who runs it",
    offset: 60,
    phase: "Book",
    detail: () => "A gathering needs a host, a clock, and a person who can stop a segment that is running long.",
    tasks: (brief) => [
      "Write a program a stranger could follow.",
      brief.constraints ? `Put this constraint on the run of show: ${brief.constraints}` : "Set a sound and closing time.",
      "Pay facilitators. Thank volunteers, and give them a shift, not a whole day.",
    ],
  },
  {
    id: "care",
    title: "Food, water, and access",
    offset: 40,
    phase: "Design",
    detail: (brief) =>
      `Plan water for ${brief.guests}, food that matches ${brief.dietary.length ? dietList(brief.dietary) : "a mixed crowd"}, and a way to sit down.`,
    tasks: () => [
      "Mark a step-free route on the site map.",
      "Reserve seating for elders and anyone who asks.",
      "Give allergens a separate table and a person who knows the list.",
    ],
  },
  {
    id: "outreach",
    title: "Invite the people who live there",
    offset: 21,
    phase: "Design",
    detail: (brief) => `Tell ${brief.city} what time it starts, whether food is free, and how to get there without a car.`,
    tasks: () => ["Use the neighbourhood channels that already exist.", "Say whether children are expected.", "Publish a contact number."],
  },
  {
    id: "briefing",
    title: "Brief the crew",
    offset: 10,
    phase: "Confirm",
    detail: () => "Everyone working the event gets the same one-page plan and a person to call.",
    tasks: () => ["Assign shifts.", "Walk the toilets, water, and first-aid spot.", "Decide who talks to the permit officer if they visit."],
  },
  {
    id: "walk",
    title: "Walk the site",
    offset: 3,
    phase: "Confirm",
    detail: () => "Check the plan against the actual ground. Move anything that blocks a path.",
    tasks: () => ["Test power and sound at the permitted volume.", "Count chairs.", "Store water in the shade."],
  },
  {
    id: "day",
    title: "The gathering",
    offset: 0,
    phase: "Celebrate",
    detail: (brief) => `Open the gate on time. ${brief.title} should feel hosted, not improvised.`,
    tasks: () => [
      "Station someone at the entrance for the first hour.",
      "Keep a quiet corner staffed.",
      "Stop sound when you said you would.",
    ],
  },
  {
    id: "after",
    title: "Leave the place better",
    offset: -2,
    phase: "After",
    detail: () => "The last job is the site. Then thank the crew and note what the permit office will ask next time.",
    tasks: () => ["Audit waste and leftovers.", "Return every key and cable.", "Send thank-yous with the two numbers that mattered."],
  },
];

const TEMPLATES: Record<Brief["eventType"], Template[]> = {
  wedding: WEDDING,
  birthday: BIRTHDAY,
  community: COMMUNITY,
};

function materialize(template: Template, brief: Brief, event: Date, now: Date, order: number): Milestone & { order: number } {
  const ideal = addDays(event, -template.offset);
  const today = startOfDay(now);
  const date = template.offset > 0 && ideal < today ? today : ideal;
  return {
    order,
    id: template.id,
    title: template.title,
    date: formatISODate(date),
    phase: template.phase,
    detail: template.detail(brief),
    tasks: template.tasks(brief).filter((task) => task.trim().length > 0),
  };
}

export function buildTimeline(brief: Brief, now = new Date()): { rush: boolean; daysUntil: number; milestones: Milestone[] } {
  const event = parseISODate(brief.date);
  if (!event) throw new Error("Event date is not valid.");
  const today = startOfDay(now);
  const daysUntil = Math.max(0, daysBetween(today, event));
  const templates = TEMPLATES[brief.eventType];
  const upcoming = templates.filter((template) => template.offset <= daysUntil);
  const beforeOrOn = upcoming.filter((template) => template.offset >= 0).length;
  const rush = beforeOrOn < 4;

  if (!rush) {
    const milestones = upcoming
      .map((template, index) => materialize(template, brief, event, today, index))
      .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)
      .map(({ order: _order, ...milestone }) => milestone);
    if (milestones[0]) {
      const tasks = [...milestones[0].tasks];
      if (brief.mustHaves && !tasks.some((task) => task.includes(brief.mustHaves))) {
        tasks.unshift(`Protect this non-negotiable: ${brief.mustHaves}`);
      }
      if (brief.constraints && !tasks.some((task) => task.includes(brief.constraints))) {
        tasks.unshift(`Keep this limit in view: ${brief.constraints}`);
      }
      milestones[0] = { ...milestones[0], tasks };
    }
    return { rush, daysUntil, milestones };
  }

  const points = [
    {
      id: "start",
      title: "Start with what you can still book",
      phase: "Confirm",
      offset: daysUntil,
      detail: `${brief.title} is close. Book only what you can confirm, and cut anything that needs a long lead.`,
      tasks: [
        brief.mustHaves ? `Keep this if you can still do it well: ${brief.mustHaves}` : "Pick the one thing guests will remember.",
        "Call the place and the food today.",
        brief.constraints ? `Do not break this just because time is short: ${brief.constraints}` : "Tell guests the real end time.",
      ],
    },
    {
      id: "mid",
      title: "Confirm the people and the count",
      phase: "Confirm",
      offset: Math.min(2, daysUntil),
      detail: `Lock a headcount near ${brief.guests} and send it to anyone cooking or staffing.`,
      tasks: ["Reconfirm arrival times.", "Print the contact list.", "Pack water and a small first-aid kit."],
    },
    {
      id: "day",
      title: "The day itself",
      phase: "Celebrate",
      offset: 0,
      detail: `Host ${brief.title} in ${brief.city}. Follow the short plan and let small décor go.`,
      tasks: ["Open when you said you would.", "Feed people before the program runs long.", "Leave on time."],
    },
    {
      id: "after",
      title: "The day after",
      phase: "After",
      offset: -1,
      detail: "Pay, return, and thank. Write down the one thing you would not rush again.",
      tasks: ["Settle invoices.", "Return borrowed things.", "Thank the person who carried the day."],
    },
  ];
  const seen = new Set<string>();
  const milestones = points
    .filter((point) => {
      const key = `${point.offset}`;
      if (point.offset > daysUntil) return false;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((point, index) => ({
      id: point.id,
      title: point.title,
      date: formatISODate(addDays(event, -point.offset)),
      phase: point.phase,
      detail: point.detail,
      tasks: point.tasks,
      order: index,
    }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.order - b.order)
    .map(({ order: _order, ...milestone }) => milestone);

  return { rush: true, daysUntil, milestones };
}

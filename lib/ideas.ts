import { parseISODate, seasonFor, type Season } from "@/lib/dates";
import { lineConflicts } from "@/lib/diet";
import { dietList, EVENT_LABEL, PRIORITY_LABEL, VIBE_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import type { Brief, Ideas, Narrative, Swatch, Vibe } from "@/lib/types";

const PALETTES: Record<Vibe, Swatch[]> = {
  intimate: [
    { name: "Ink", hex: "#1c1915" },
    { name: "Ivory", hex: "#f4efe6" },
    { name: "Wine", hex: "#7a2f3b" },
    { name: "Brass", hex: "#b8893a" },
  ],
  grand: [
    { name: "Night", hex: "#14181f" },
    { name: "Pearl", hex: "#f7f4ee" },
    { name: "Gold", hex: "#c6a15b" },
    { name: "Forest", hex: "#1f3d34" },
  ],
  playful: [
    { name: "Cream", hex: "#fff6e8" },
    { name: "Coral", hex: "#ef6f4c" },
    { name: "Leaf", hex: "#2f5d4a" },
    { name: "Sun", hex: "#e2b43a" },
  ],
  cultural: [
    { name: "Marigold", hex: "#e39a2b" },
    { name: "Vermilion", hex: "#c4482d" },
    { name: "Indigo", hex: "#243456" },
    { name: "Milk", hex: "#f6f1e7" },
  ],
  eco: [
    { name: "Moss", hex: "#3d5c45" },
    { name: "Clay", hex: "#c46b4a" },
    { name: "Paper", hex: "#f3efe6" },
    { name: "Rain", hex: "#355c6b" },
  ],
  formal: [
    { name: "Black", hex: "#161616" },
    { name: "White", hex: "#fbfbf8" },
    { name: "Stone", hex: "#8d8478" },
    { name: "Wine", hex: "#6e2433" },
  ],
  casual: [
    { name: "Sand", hex: "#e7d7c1" },
    { name: "Sea", hex: "#3e6b73" },
    { name: "Clay", hex: "#c46b4a" },
    { name: "Ink", hex: "#1c1915" },
  ],
};

const THEMES: Record<Brief["eventType"], Record<Vibe, string>> = {
  wedding: {
    intimate: "A long table and an early night",
    grand: "Procession, then a full room",
    playful: "A formal promise and a loose dinner",
    cultural: "The ceremony first",
    eco: "Seasonal flowers, borrowed glass",
    formal: "Black ink and a quiet room",
    casual: "Shoes off after the vows",
  },
  birthday: {
    intimate: "A dinner with a cake at the center",
    grand: "One room, one entrance, one song",
    playful: "A short plot with cake in the middle",
    cultural: "The songs and food they already love",
    eco: "A party that packs back into one bag",
    formal: "A dressed table and an early toast",
    casual: "Come as you are, stay through cake",
  },
  community: {
    intimate: "A hosted hour, not a rally",
    grand: "A program the whole block can see",
    playful: "Stations, shade, and a shared song",
    cultural: "The neighbourhood's own calendar",
    eco: "A gathering that gives the place back",
    formal: "A clear opening and a clear close",
    casual: "Drop in, sit down, take part",
  },
};

const SEASON_LINE: Record<Season, string> = {
  winter: "Use the low sun. Have wraps nearby and keep the ceremony in the warm part of the afternoon.",
  spring: "Keep flowers in what is actually blooming, and have a light layer for the evening.",
  summer: "Plan shade, water, and a start time that is not the hottest hour.",
  monsoon: "Cover the walk from arrival to seat, and keep cables and cake out of the rain.",
  autumn: "The light goes early. Light the path, and move dinner up.",
};

type Dish = {
  label: string;
  slot: "welcome" | "main" | "side" | "sweet";
  events: Array<Brief["eventType"]>;
  avoid: Array<Brief["dietary"][number]>;
};

const DISHES: Dish[] = [
  { label: "Lime, mint, and soda in a short glass", slot: "welcome", events: ["wedding", "birthday", "community"], avoid: [] },
  { label: "Seasonal fruit cut to share", slot: "welcome", events: ["wedding", "birthday", "community"], avoid: [] },
  { label: "Roasted chana and cucumber spears", slot: "welcome", events: ["wedding", "community"], avoid: [] },
  { label: "Grilled paneer with pepper and lemon", slot: "main", events: ["wedding", "birthday"], avoid: ["vegan", "jain"] },
  { label: "Slow-roasted chicken with herbs and a green salad", slot: "main", events: ["wedding", "birthday", "community"], avoid: ["vegetarian", "vegan", "jain"] },
  { label: "Grilled fish with lemon and rice", slot: "main", events: ["wedding", "birthday"], avoid: ["vegetarian", "vegan", "jain"] },
  { label: "Moong dal with cumin, served with rice", slot: "main", events: ["wedding", "birthday", "community"], avoid: [] },
  { label: "A millet bowl with roasted seasonal vegetables and lentils", slot: "main", events: ["wedding", "birthday", "community"], avoid: [] },
  { label: "Cucumber, lemon, salt, and herbs", slot: "side", events: ["wedding", "birthday", "community"], avoid: [] },
  { label: "Steamed rice with a spoon of ghee on the side for those who want it", slot: "side", events: ["wedding", "community"], avoid: ["vegan"] },
  { label: "A pot of plain rice", slot: "side", events: ["wedding", "birthday", "community"], avoid: [] },
  { label: "Chilled fruit to end", slot: "sweet", events: ["wedding", "birthday", "community"], avoid: [] },
  { label: "A small cardamom milk sweet, with fruit beside it", slot: "sweet", events: ["wedding", "birthday"], avoid: ["vegan"] },
  { label: "Jaggery rice, served warm", slot: "sweet", events: ["wedding", "community"], avoid: [] },
  { label: "A single-layer cake sized to the people who will eat it", slot: "sweet", events: ["birthday"], avoid: [] },
];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function pickOne<T>(items: T[], seed: number): T {
  return items[seed % items.length];
}

function eligible(brief: Brief, slot: Dish["slot"]): Dish[] {
  return DISHES.filter(
    (dish) => dish.events.includes(brief.eventType) && dish.slot === slot && !dish.avoid.some((diet) => brief.dietary.includes(diet)),
  );
}

export function buildMenu(brief: Brief): string[] {
  const seed = hashString(`${brief.city}|${brief.title}|${brief.vibe}`);
  const slots: Dish["slot"][] = ["welcome", "main", "side", "sweet"];
  const menu = slots.map((slot, index) => {
    const young = brief.eventType === "birthday" && (brief.age ?? 99) < 13;
    const options = eligible(brief, slot).filter((dish) => !young || !/\b(chicken|fish|mutton|lamb)\b/i.test(dish.label));
    const fallback =
      slot === "welcome"
        ? "Lime and soda"
        : slot === "main"
          ? "Lentils, rice, and roasted seasonal vegetables"
          : slot === "side"
            ? "Cucumber with lemon and salt"
            : "Chilled seasonal fruit";
    return options.length > 0 ? pickOne(options, seed + index * 17).label : fallback;
  });
  if (brief.dietary.includes("kids-menu") || brief.eventType === "community" || (brief.age != null && brief.age < 13)) {
    menu.push("A plain plate of rice, fruit, and something familiar for children.");
  }
  return menu;
}

function decorFor(brief: Brief, season: Season): string[] {
  const lines = [SEASON_LINE[season]];
  if (brief.setting === "outdoor") {
    lines.push("Mark the entrance so people are not wandering the edge of the site.");
    lines.push("Put seating where there is shade or cover, not only where the photograph looks best.");
  } else if (brief.setting === "indoor") {
    lines.push("Leave the architecture alone and light the tables.");
    lines.push("One flower or branch per table is enough if the room already has a view.");
  } else {
    lines.push("Use the same materials inside and outside so the day feels like one place.");
    lines.push("Cover the threshold between the two, especially at night.");
  }
  if (brief.vibe === "eco" || /plastic/i.test(brief.constraints)) {
    lines.push("Borrow glass, skip confetti, and choose flowers that can be composted.");
  } else if (brief.vibe === "formal") {
    lines.push("Restrict the palette to two materials and let the printing do the rest.");
  } else {
    lines.push(`Keep the décor ${VIBE_LABEL[brief.vibe].toLowerCase()} and editable on the day. Do not install anything you cannot remove in an hour.`);
  }
  return lines.slice(0, 4);
}

function activitiesFor(brief: Brief): string[] {
  if (brief.eventType === "wedding") {
    const items = [
      "A receiving line that lasts twenty minutes, then dinner.",
      "One speech before the meal and one after, with a clock both speakers can see.",
      brief.culture
        ? `Give the ceremony you described its full time: ${brief.culture}.`
        : "Read the ceremony order out loud once, a week before, with the people in it.",
      "A portrait hour that does not hold the guests hostage.",
    ];
    return items.slice(0, 3);
  }
  if (brief.eventType === "birthday") {
    if (brief.age != null && brief.age < 12) {
      return [
        "A short hunt or game that ends in one place, so nobody is lost.",
        "Cake before energy drops, with the song kept to one verse.",
        "A quiet corner with books or drawing for anyone who needs to leave the noise.",
      ];
    }
    return [
      "A toast that takes three minutes, from someone who was asked in advance.",
      "One playlist for arrival and a different, quieter one for the meal.",
      brief.mustHaves ? `Schedule this before anything decorative: ${brief.mustHaves}` : "Leave an hour with no program at all.",
    ];
  }
  return [
    "An opening that says why the gathering exists, in under five minutes.",
    "Two or three stations so people can join without performing.",
    "A shared closing: a song, a cleanup, or a photograph of the crew, then the gate shuts.",
  ];
}

function musicFor(brief: Brief): string {
  const curfew = /sound|amplif|quiet|8\s?pm|noise/i.test(brief.constraints)
    ? " Put the amplifier curfew on the run of show."
    : "";
  if (brief.eventType === "wedding") {
    return `Quiet music for the ceremony, conversation-level music through dinner, and dancing only after the last speech.${curfew}`;
  }
  if (brief.eventType === "birthday") {
    return brief.age != null && brief.age < 12
      ? `A short playlist at a volume where adults can still talk, plus one song everyone knows for the cake.${curfew}`
      : `Music that covers arrival and then gets out of the way of conversation.${curfew}`;
  }
  return `Acoustic or low amplification, with a person who can turn it off on time.${curfew}`;
}

function momentsFor(brief: Brief): string[] {
  if (brief.eventType === "wedding") {
    return [
      `The first ten minutes in ${brief.city}, when people need a seat, a drink, and to find each other.`,
      "The ceremony, protected from photographs that walk in front of family.",
      "The first course, served before speeches multiply.",
    ];
  }
  if (brief.eventType === "birthday") {
    return [
      `${brief.honoree} arrives to a room that is already ready.`,
      "The candle, done once, with the lights planned.",
      "A real goodbye at the door, not a drift.",
    ];
  }
  return [
    "The first hour at the gate, staffed by someone who can answer access questions.",
    "The middle of the program, when water and shade matter more than another announcement.",
    "The last half hour, when the site has to return to itself.",
  ];
}

function careFor(brief: Brief): string[] {
  const care = [
    "Write a step-free route and say so on the invitation.",
    "Keep drinking water where people can find it without asking.",
  ];
  if (brief.dietary.length > 0) {
    care.push(`Label food for ${dietList(brief.dietary)} in type large enough to read while holding a plate.`);
  }
  if (brief.eventType === "community" || brief.guests >= 80) {
    care.push("Staff a quiet corner and a seat with a back, and tell people both exist.");
  }
  if (brief.vibe === "eco" || /plastic/i.test(brief.constraints)) {
    care.push("Skip single-use décor and plan where compost, recycling, and rubbish actually go.");
  }
  if (forbids(brief)) {
    care.push("Serve the welcome drink without alcohol and say that on the invitation.");
  }
  return care.slice(0, 4);
}

function forbids(brief: Brief): boolean {
  return /no alcohol|alcohol-free|dry event|dry wedding|alcohol free/i.test(brief.constraints);
}

export function writeSummary(brief: Brief): string {
  const date = parseISODate(brief.date);
  const when = date
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date)
    : brief.date;
  const money = formatMoney(brief.budget, brief.currency);
  const kind = EVENT_LABEL[brief.eventType].toLowerCase();
  const priority = brief.priorities.map((item) => PRIORITY_LABEL[item].toLowerCase()).join(" and ");
  const sentences = [
    `${brief.title} brings ${brief.guests} people to ${brief.city} on ${when} for a ${brief.vibe} ${kind}.`,
    `The working budget is ${money}, with extra weight on ${priority}.`,
  ];
  if (brief.dietary.length > 0) sentences.push(`The menu has to work for ${dietList(brief.dietary)}.`);
  if (brief.culture) sentences.push(`Keep this in the schedule, not as a footnote: ${brief.culture}.`);
  if (brief.mustHaves) sentences.push(`Do not lose this: ${brief.mustHaves}.`);
  return sentences.join(" ");
}

export function writeInvitation(brief: Brief): string {
  const date = parseISODate(brief.date);
  const when = date
    ? new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "long", year: "numeric" }).format(date)
    : brief.date;
  if (brief.eventType === "wedding") {
    return `${brief.honoree} invite you to ${brief.city} on ${when}.`;
  }
  if (brief.eventType === "birthday") {
    const years = brief.age ? `, turning ${brief.age}` : "";
    return `Come celebrate ${brief.honoree}${years} in ${brief.city} on ${when}.`;
  }
  return `${brief.title}. ${brief.city}, ${when}. Come if you live nearby, and tell a neighbour.`;
}

export function buildIdeas(brief: Brief): Ideas {
  const date = parseISODate(brief.date) ?? new Date();
  const season = seasonFor(date, brief.currency);
  return {
    theme: THEMES[brief.eventType][brief.vibe],
    palette: PALETTES[brief.vibe],
    decor: decorFor(brief, season),
    menu: buildMenu(brief),
    activities: activitiesFor(brief),
    music: musicFor(brief),
    moments: momentsFor(brief),
    care: careFor(brief),
  };
}

function safeLines(lines: string[] | undefined, fallback: string[], brief: Brief, min: number): string[] {
  if (!lines || lines.length < min) return fallback;
  const cleaned = lines.map((line) => line.trim()).filter(Boolean);
  if (cleaned.length < min) return fallback;
  if (cleaned.some((line) => lineConflicts(line, brief))) return fallback;
  return cleaned.slice(0, 6);
}

function safeLine(line: string | undefined, fallback: string, brief: Brief): string {
  if (!line || !line.trim()) return fallback;
  return lineConflicts(line, brief) ? fallback : line.trim();
}

export function mergeIdeas(brief: Brief, narrative: Narrative | null): { ideas: Ideas; summary: string; invitationLine: string; theme: string } {
  const local = buildIdeas(brief);
  const summary = safeLine(narrative?.summary, writeSummary(brief), brief);
  const invitationLine = safeLine(narrative?.invitationLine, writeInvitation(brief), brief);
  if (!narrative) {
    return { ideas: local, summary, invitationLine, theme: local.theme };
  }
  const ideas: Ideas = {
    theme: safeLine(narrative.theme, local.theme, brief),
    palette: local.palette,
    decor: safeLines(narrative.decor, local.decor, brief, 3),
    menu: safeLines(narrative.menu, local.menu, brief, 3),
    activities: safeLines(narrative.activities, local.activities, brief, 2),
    music: safeLine(narrative.music, local.music, brief),
    moments: safeLines(narrative.moments, local.moments, brief, 2),
    care: safeLines(narrative.care, local.care, brief, 2),
  };
  return { ideas, summary, invitationLine, theme: ideas.theme };
}

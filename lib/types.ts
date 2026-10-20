export const EVENT_TYPES = ["wedding", "birthday", "community"] as const;
export const SETTINGS = ["indoor", "outdoor", "mixed"] as const;
export const CURRENCIES = ["INR", "USD", "EUR", "GBP"] as const;
export const VIBES = ["intimate", "grand", "playful", "cultural", "eco", "formal", "casual"] as const;
export const PRIORITIES = ["venue", "food", "experience", "photos", "decor"] as const;
export const DIETS = [
  "vegetarian",
  "vegan",
  "jain",
  "halal",
  "kosher",
  "gluten-free",
  "nut-free",
  "kids-menu",
] as const;
export const VENDOR_STATUSES = ["todo", "shortlist", "booked", "paid"] as const;
export const SOURCES = ["gemini", "openai", "atelier"] as const;

export type EventType = (typeof EVENT_TYPES)[number];
export type Setting = (typeof SETTINGS)[number];
export type Currency = (typeof CURRENCIES)[number];
export type Vibe = (typeof VIBES)[number];
export type Priority = (typeof PRIORITIES)[number];
export type Diet = (typeof DIETS)[number];
export type VendorStatus = (typeof VENDOR_STATUSES)[number];
export type Source = (typeof SOURCES)[number];

export type Brief = {
  eventType: EventType;
  title: string;
  honoree: string;
  date: string;
  city: string;
  guests: number;
  setting: Setting;
  vibe: Vibe;
  culture: string;
  dietary: Diet[];
  budget: number;
  currency: Currency;
  priorities: Priority[];
  mustHaves: string;
  constraints: string;
  age?: number;
};

export type BudgetCategory = {
  id: string;
  label: string;
  amount: number;
  share: number;
  note: string;
};

export type Milestone = {
  id: string;
  title: string;
  date: string;
  phase: string;
  detail: string;
  tasks: string[];
};

export type Vendor = {
  id: string;
  categoryId: string;
  category: string;
  role: string;
  brief: string;
  bookBy: string;
  urgent: boolean;
  estimate: number;
  questions: string[];
  status: VendorStatus;
};

export type Swatch = {
  name: string;
  hex: string;
};

export type Ideas = {
  theme: string;
  palette: Swatch[];
  decor: string[];
  menu: string[];
  activities: string[];
  music: string;
  moments: string[];
  care: string[];
};

export type Narrative = {
  summary: string;
  invitationLine: string;
  theme: string;
  decor: string[];
  menu: string[];
  activities: string[];
  music: string;
  moments: string[];
  care: string[];
};

export type Plan = {
  id: string;
  createdAt: string;
  source: Source;
  notice?: string;
  brief: Brief;
  narrative: Narrative | null;
  summary: string;
  invitationLine: string;
  budget: {
    total: number;
    currency: Currency;
    perGuest: number;
    foodPerGuest: number;
    categories: BudgetCategory[];
  };
  timeline: {
    rush: boolean;
    daysUntil: number;
    milestones: Milestone[];
  };
  vendors: Vendor[];
  ideas: Ideas;
};

export type FieldError = {
  field: string;
  message: string;
};

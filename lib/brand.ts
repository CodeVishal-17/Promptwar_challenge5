export const BRAND = {
  name: "Fête",
  storageKey: "fete.plans.v1",
  legacyStorageKeys: ["northline.plans.v1"],
  idPrefix: "fete",
  writer: "atelier composer",
  description:
    "Fête plans weddings, birthdays, and community gatherings with a budget that adds up, a timeline, a vendor checklist, and ideas written for the people in the room.",
} as const;

export function fileSlug(value: string): string {
  const slug = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug || "plan";
}

import type { Brief, Diet } from "@/lib/types";

const MEAT = /\b(chicken|mutton|lamb|beef|pork|fish|prawn|shrimp|bacon|ham|meat|murgh|gosht|pepperoni)\b/i;
const DAIRY_EGG = /\b(paneer|ghee|yogurt|yoghurt|curd|cheese|butter|milk|cream|honey|egg|omelette|omelet)\b/i;
const JAIN = /\b(onion|garlic|potato|carrot|beet|radish)\b/i;
const PORK = /\b(pork|bacon|ham|pepperoni)\b/i;
const SHELLFISH = /\b(shrimp|prawn|shellfish|crab|lobster)\b/i;
const GLUTEN = /\b(bread|wheat|naan|roti|pasta|seitan|barley|rye|semolina|couscous)\b/i;
const NUTS = /\b(peanut|almond|cashew|walnut|pistachio|hazelnut|pecan)\b/i;
const ALCOHOL = /\b(alcohol|beer|wine|cocktail|whisky|whiskey|champagne|vodka|rum|open bar)\b/i;

export function forbidsAlcohol(constraints: string): boolean {
  return /no alcohol|alcohol-free|dry event|dry wedding|zero-proof only|alcohol free/i.test(constraints);
}

function stripNegations(line: string, words: string[]): string {
  let text = line.replace(/\b(no|without|avoid|avoiding|omit|omitted|free from)\b[^.]*/gi, " ");
  for (const word of words) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(`\\b${escaped}-free\\b`, "gi"), " ");
  }
  return text;
}

function conflicts(line: string, pattern: RegExp, words: string[]): boolean {
  return pattern.test(stripNegations(line, words));
}

export function lineConflicts(line: string, brief: Pick<Brief, "dietary" | "constraints">): boolean {
  const diets = new Set<Diet>(brief.dietary);
  const prepared = line.replace(/\b(almond|oat|coconut|soy)\s+milk\b/gi, "plant-drink");

  if (diets.has("vegetarian") || diets.has("vegan") || diets.has("jain")) {
    if (conflicts(prepared, MEAT, ["chicken", "mutton", "lamb", "beef", "pork", "fish", "prawn", "shrimp", "bacon", "ham", "meat"])) {
      return true;
    }
  }
  if (diets.has("vegan")) {
    if (conflicts(prepared, DAIRY_EGG, ["paneer", "ghee", "yogurt", "yoghurt", "curd", "cheese", "butter", "milk", "cream", "honey", "egg"])) {
      return true;
    }
  }
  if (diets.has("jain") && conflicts(prepared, JAIN, ["onion", "garlic", "potato", "carrot", "beet", "radish"])) {
    return true;
  }
  if ((diets.has("halal") || diets.has("kosher")) && conflicts(prepared, PORK, ["pork", "bacon", "ham", "pepperoni"])) {
    return true;
  }
  if (diets.has("kosher") && conflicts(prepared, SHELLFISH, ["shrimp", "prawn", "shellfish", "crab", "lobster"])) {
    return true;
  }
  if (diets.has("gluten-free") && !/gluten-free/i.test(line) && GLUTEN.test(prepared)) {
    return true;
  }
  if (diets.has("nut-free")) {
    const scrubbed = prepared.replace(/nut-free/gi, "");
    if (NUTS.test(scrubbed)) return true;
  }
  if (forbidsAlcohol(brief.constraints)) {
    const scrubbed = prepared.replace(/alcohol-free/gi, "").replace(/\b(no|without)\s+alcohol\b/gi, "");
    if (ALCOHOL.test(scrubbed)) return true;
  }
  return false;
}

export function linesAreSafe(lines: string[], brief: Pick<Brief, "dietary" | "constraints">): boolean {
  return lines.every((line) => !lineConflicts(line, brief));
}

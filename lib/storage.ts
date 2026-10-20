import { BRAND } from "@/lib/brand";
import type { Plan } from "@/lib/types";

function isPlan(value: unknown): value is Plan {
  if (!value || typeof value !== "object") return false;
  const plan = value as Partial<Plan>;
  return (
    typeof plan.id === "string" &&
    !!plan.brief &&
    !!plan.budget &&
    Array.isArray(plan.vendors) &&
    Array.isArray(plan.timeline?.milestones)
  );
}

function readPlans(key: string): Plan[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as { plans?: unknown };
    if (!Array.isArray(parsed.plans)) return [];
    return parsed.plans.filter(isPlan);
  } catch {
    return [];
  }
}

function writePlans(plans: Plan[]): void {
  window.localStorage.setItem(BRAND.storageKey, JSON.stringify({ plans: plans.slice(0, 24) }));
}

export function loadPlans(): Plan[] {
  const current = readPlans(BRAND.storageKey);
  const seen = new Set(current.map((plan) => plan.id));
  const older = BRAND.legacyStorageKeys.flatMap(readPlans).filter((plan) => !seen.has(plan.id));
  if (older.length === 0) return current;
  const merged = [...current, ...older].slice(0, 24);
  writePlans(merged);
  return merged;
}

export function getStoredPlan(id: string): Plan | null {
  return loadPlans().find((plan) => plan.id === id) ?? null;
}

export function savePlan(plan: Plan): void {
  const plans = loadPlans().filter((item) => item.id !== plan.id);
  plans.unshift(plan);
  writePlans(plans);
}

export function deletePlan(id: string): void {
  writePlans(loadPlans().filter((plan) => plan.id !== id));
}

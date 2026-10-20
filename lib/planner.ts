import { BRAND } from "@/lib/brand";
import { allocateBudget } from "@/lib/budget";
import { buildTimeline } from "@/lib/timeline";
import { buildVendors } from "@/lib/vendors";
import { mergeIdeas } from "@/lib/ideas";
import type { Brief, Narrative, Plan, Source } from "@/lib/types";

type ComposeOptions = {
  id?: string;
  now?: Date;
  source?: Source;
  createdAt?: string;
  notice?: string;
};

function createId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${BRAND.idPrefix}_${crypto.randomUUID()}`;
  return `${BRAND.idPrefix}_${Date.now().toString(36)}`;
}

export function composePlan(brief: Brief, narrative: Narrative | null, options: ComposeOptions = {}): Plan {
  const now = options.now ?? new Date();
  const categories = allocateBudget({
    eventType: brief.eventType,
    budget: brief.budget,
    guests: brief.guests,
    setting: brief.setting,
    priorities: brief.priorities,
    dietary: brief.dietary,
    city: brief.city,
  });
  const food = categories.find((category) => category.id === "food");
  const merged = mergeIdeas(brief, narrative);
  return {
    id: options.id ?? createId(),
    createdAt: options.createdAt ?? now.toISOString(),
    source: options.source ?? "atelier",
    notice: options.notice,
    brief,
    narrative,
    summary: merged.summary,
    invitationLine: merged.invitationLine,
    budget: {
      total: brief.budget,
      currency: brief.currency,
      perGuest: Math.floor(brief.budget / Math.max(1, brief.guests)),
      foodPerGuest: Math.floor((food?.amount ?? 0) / Math.max(1, brief.guests)),
      categories,
    },
    timeline: buildTimeline(brief, now),
    vendors: buildVendors(brief, categories, now),
    ideas: merged.ideas,
  };
}

export function withAdjustments(
  plan: Plan,
  patch: { budget?: number; guests?: number },
  now = new Date(),
): Plan {
  const brief: Brief = {
    ...plan.brief,
    budget: patch.budget ?? plan.brief.budget,
    guests: patch.guests ?? plan.brief.guests,
  };
  const next = composePlan(brief, plan.narrative, {
    id: plan.id,
    now,
    source: plan.source,
    createdAt: plan.createdAt,
    notice: plan.notice,
  });
  const status = new Map(plan.vendors.map((vendor) => [vendor.id, vendor.status]));
  next.vendors = next.vendors.map((vendor) => ({
    ...vendor,
    status: status.get(vendor.id) ?? vendor.status,
  }));
  return next;
}

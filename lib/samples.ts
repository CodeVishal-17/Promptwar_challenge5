import { composePlan } from "@/lib/planner";
import { sampleBriefs } from "@/lib/sample-briefs";
import type { Plan } from "@/lib/types";

export function buildSample(id: string, now = new Date()): Plan | null {
  const brief = sampleBriefs[id];
  if (!brief) return null;
  return composePlan(brief, null, { id, now, source: "atelier" });
}

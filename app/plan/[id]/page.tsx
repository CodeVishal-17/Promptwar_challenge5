import type { Metadata } from "next";
import { PlanStudio } from "@/components/PlanStudio";
import { sampleBriefs } from "@/lib/sample-briefs";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const brief = sampleBriefs[id];
  return { title: brief ? brief.title : "Plan" };
}

export default async function PlanPage({ params }: Props) {
  const { id } = await params;
  return <PlanStudio id={id} />;
}

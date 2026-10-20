import type { Metadata } from "next";
import { BriefForm } from "@/components/BriefForm";
import type { EventType } from "@/lib/types";

export const metadata: Metadata = { title: "New plan" };

type Props = { searchParams: Promise<{ type?: string }> };

export default async function NewPage({ searchParams }: Props) {
  const params = await searchParams;
  const initialType: EventType =
    params.type === "birthday" || params.type === "community" || params.type === "wedding" ? params.type : "wedding";
  return <BriefForm initialType={initialType} />;
}

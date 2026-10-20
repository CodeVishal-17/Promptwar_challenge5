import { activeSource } from "@/lib/ai/generate";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    { ok: true, ai: activeSource() },
    { headers: { "Cache-Control": "no-store" } },
  );
}

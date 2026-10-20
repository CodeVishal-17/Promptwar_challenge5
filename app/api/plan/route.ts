import { BRAND } from "@/lib/brand";
import { generateNarrative } from "@/lib/ai/generate";
import { allowPlanRequest } from "@/lib/rate-limit";
import { composePlan } from "@/lib/planner";
import { readBrief } from "@/lib/schema";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const MAX_BODY = 20_000;

function clientKey(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwarded || "local";
}

export async function POST(request: Request) {
  if (!allowPlanRequest(clientKey(request))) {
    return NextResponse.json(
      { error: "Too many plans just now. Wait a minute and try again." },
      { status: 429, headers: { "Cache-Control": "no-store" } },
    );
  }

  const contentType = request.headers.get("content-type") ?? "";
  if (!contentType.includes("application/json")) {
    return NextResponse.json(
      { error: "Send the brief as JSON." },
      { status: 415, headers: { "Cache-Control": "no-store" } },
    );
  }

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BODY) {
    return NextResponse.json(
      { error: "That brief is too long." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  let text = "";
  try {
    text = await request.text();
  } catch {
    return NextResponse.json(
      { error: "The brief could not be read." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }
  if (text.length > MAX_BODY) {
    return NextResponse.json(
      { error: "That brief is too long." },
      { status: 413, headers: { "Cache-Control": "no-store" } },
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch {
    return NextResponse.json(
      { error: "Send the brief as JSON." },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  const read = readBrief(payload);
  if (!read.ok) {
    return NextResponse.json(
      { errors: read.errors },
      { status: 400, headers: { "Cache-Control": "no-store" } },
    );
  }

  try {
    const narrative = await generateNarrative(read.brief);
    const plan = composePlan(read.brief, narrative.narrative, {
      source: narrative.source,
      notice: narrative.notice,
    });
    return NextResponse.json({ plan }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error(`${BRAND.name} could not compose a plan.`, error instanceof Error ? error.message : "unknown");
    return NextResponse.json(
      { error: `${BRAND.name} could not compose a plan. Try again in a moment.` },
      { status: 500, headers: { "Cache-Control": "no-store" } },
    );
  }
}

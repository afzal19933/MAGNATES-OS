import { NextResponse } from "next/server";
import { defaultScoringRules } from "@/lib/scoring";

export async function GET() {
  return NextResponse.json(defaultScoringRules);
}

export async function PUT() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Scoring rule updates require DB-backed models that are not present in the current Prisma schema.",
    },
    { status: 501 }
  );
}

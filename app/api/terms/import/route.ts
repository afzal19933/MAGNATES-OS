import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      message:
        "Term import is unavailable because the current Prisma schema does not include the required term and credential models.",
    },
    { status: 501 }
  );
}

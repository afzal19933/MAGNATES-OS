import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const activeTerm = await prisma.term.findFirst({
      where: {
        isActive: true,
      },
      include: {
        termUsers: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: activeTerm,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch active term.";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

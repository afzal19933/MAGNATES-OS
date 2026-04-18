import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createTermWithTransaction, normalizeCreateTermInput } from "@/lib/terms";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const terms = await prisma.term.findMany({
      orderBy: [
        { isActive: "desc" },
        { startDate: "desc" },
        { createdAt: "desc" },
      ],
    });

    return NextResponse.json({
      success: true,
      data: terms,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch terms.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = normalizeCreateTermInput(body);
    const term = await createTermWithTransaction(prisma, input);

    return NextResponse.json(
      {
        success: true,
        data: term,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            message: "Only one active term is allowed at a time.",
          },
          { status: 409 }
        );
      }

      if (error.code === "P2025") {
        return NextResponse.json(
          {
            success: false,
            message: "One or more users do not exist.",
          },
          { status: 400 }
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to create term.";
    const status =
      message.includes("required") ||
      message.includes("valid ISO date") ||
      message.includes("before")
        ? 400
        : 500;

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}

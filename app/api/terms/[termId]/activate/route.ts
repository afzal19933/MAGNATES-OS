import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { activateTermWithTransaction } from "@/lib/terms";

type RouteContext = {
  params: {
    termId?: string;
  };
};

export async function POST(
  _request: Request,
  context: RouteContext
) {
  try {
    const termId = context.params.termId?.trim();

    if (!termId) {
      return NextResponse.json(
        {
          success: false,
          message: "termId is required.",
        },
        { status: 400 }
      );
    }

    const activated = await activateTermWithTransaction(prisma, termId);
    if (!activated) {
      return NextResponse.json(
        {
          success: false,
          message: "Term not found.",
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: activated,
    });
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
    }

    const message =
      error instanceof Error ? error.message : "Failed to activate term.";
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 500 }
    );
  }
}

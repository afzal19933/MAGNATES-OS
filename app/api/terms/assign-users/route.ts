import { Prisma, TermUserRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AssignUserBody = {
  userId?: unknown;
  role?: unknown;
};

function parseAssignUserBody(body: AssignUserBody) {
  const userId = typeof body.userId === "string" ? body.userId.trim() : "";
  if (!userId) {
    throw new Error("userId is required.");
  }

  const role = body.role;
  if (
    role !== TermUserRole.ADMIN &&
    role !== TermUserRole.MEMBER &&
    role !== TermUserRole.VISITOR
  ) {
    throw new Error("role must be one of ADMIN, MEMBER, or VISITOR.");
  }

  return {
    userId,
    role,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as AssignUserBody;
    const { userId, role } = parseAssignUserBody(body);

    const activeTerm = await prisma.term.findFirst({
      where: {
        isActive: true,
      },
      select: {
        id: true,
      },
      orderBy: {
        updatedAt: "desc",
      },
    });

    if (!activeTerm) {
      return NextResponse.json(
        {
          success: false,
          message: "No active term found.",
        },
        { status: 400 }
      );
    }

    const existingAssignment = await prisma.termUser.findUnique({
      where: {
        userId_termId: {
          userId,
          termId: activeTerm.id,
        },
      },
    });

    if (existingAssignment) {
      return NextResponse.json(
        {
          success: false,
          message: "User is already assigned to the active term.",
        },
        { status: 409 }
      );
    }

    const user = await prisma.member.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "User not found.",
        },
        { status: 404 }
      );
    }

    const termUser = await prisma.termUser.create({
      data: {
        userId,
        termId: activeTerm.id,
        role,
      },
    });

    return NextResponse.json(
      {
        success: true,
        data: termUser,
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        return NextResponse.json(
          {
            success: false,
            message: "User is already assigned to the active term.",
          },
          { status: 409 }
        );
      }

      if (error.code === "P2003") {
        return NextResponse.json(
          {
            success: false,
            message: "User does not exist.",
          },
          { status: 400 }
        );
      }
    }

    const message =
      error instanceof Error ? error.message : "Failed to assign user.";
    const status =
      message.includes("required") || message.includes("must be one of")
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

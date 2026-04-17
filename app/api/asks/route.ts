import { NextResponse } from "next/server";
import { AskStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const asks = await prisma.ask.findMany({
      include: {
        owner: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      data: asks,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch asks";

    return NextResponse.json({
      success: false,
      message,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      title?: string;
      ownerId?: string;
    };

    const title = body.title?.trim();
    const ownerId = body.ownerId?.trim();

    if (!title) {
      return NextResponse.json({
        success: false,
        message: "Title is required",
      });
    }

    const ask = ownerId
      ? await prisma.ask.create({
          data: {
            title,
            owner: {
              connect: {
                id: ownerId,
              },
            },
          },
          include: {
            owner: true,
          },
        })
      : await prisma.ask.create({
          data: {
            title,
          },
          include: {
            owner: true,
          },
        });

    return NextResponse.json({
      success: true,
      data: ask,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create ask";

    return NextResponse.json({
      success: false,
      message,
    });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = (await request.json()) as {
      id?: string;
      status?: string;
    };

    const id = body.id?.trim();
    const status = body.status;

    if (!id) {
      return NextResponse.json({
        success: false,
        message: "Id is required",
      });
    }

    if (status !== AskStatus.PENDING && status !== AskStatus.FULFILLED) {
      return NextResponse.json({
        success: false,
        message: "Invalid status",
      });
    }

    const ask = await prisma.ask.update({
      where: {
        id,
      },
      data: {
        status,
      },
    });

    return NextResponse.json({
      success: true,
      data: ask,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to update ask";

    return NextResponse.json({
      success: false,
      message,
    });
  }
}

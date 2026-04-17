import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const members = await prisma.member.findMany({
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({
      success: true,
      data: members,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to fetch members";

    return NextResponse.json({
      success: false,
      message,
    });
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { name?: string };
    const name = body.name?.trim();

    if (!name) {
      return NextResponse.json({
        success: false,
        message: "Name is required",
      });
    }

    const member = await prisma.member.create({
      data: {
        name,
      },
    });

    return NextResponse.json({
      success: true,
      data: member,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to create member";

    return NextResponse.json({
      success: false,
      message,
    });
  }
}

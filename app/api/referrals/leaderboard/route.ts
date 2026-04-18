import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getScoringPointsMap } from "@/lib/scoring";

export const dynamic = "force-dynamic";

type LeaderboardType = "weekly" | "monthly" | "term";
type LeaderboardView = "member" | "team";

function resolveDateRangeForRollingViews(type: Exclude<LeaderboardType, "term">) {
  const now = new Date();

  if (type === "monthly") {
    return {
      gte: new Date(now.getFullYear(), now.getMonth(), 1),
      lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999),
    };
  }

  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  const startDate = new Date(now);
  startDate.setDate(now.getDate() - 6);
  startDate.setHours(0, 0, 0, 0);

  return {
    gte: startDate,
    lte: endDate,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = (searchParams.get("type") || "weekly") as LeaderboardType;
    const view = (searchParams.get("view") || "member") as LeaderboardView;
    const scoringMap = getScoringPointsMap();
    const referralGivenPoints = scoringMap.get("referralGiven") || 0;
    const referralReceivedPoints = scoringMap.get("referralReceived") || 0;
    let activeTerm:
      | {
          id: string;
          name: string;
          startDate: Date;
          endDate: Date;
        }
      | null = null;

    const createdAt =
      type === "term"
        ? undefined
        : resolveDateRangeForRollingViews(type);

    if (type === "term") {
      activeTerm = await prisma.term.findFirst({
        where: {
          isActive: true,
        },
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
        },
        orderBy: {
          updatedAt: "desc",
        },
      });

      if (!activeTerm) {
        return NextResponse.json({
          success: true,
          type,
          view,
          data: [],
          message: "No active term found.",
        });
      }
    }

    const effectiveCreatedAt =
      type === "term" && activeTerm
        ? {
            gte: activeTerm.startDate,
            lte: activeTerm.endDate,
          }
        : createdAt;

    const [members, referralsGiven, referralsReceived] = await Promise.all([
      prisma.member.findMany({
        select: {
          id: true,
          name: true,
        },
        orderBy: {
          name: "asc",
        },
      }),
      prisma.referral.groupBy({
        by: ["fromMemberId"],
        where: {
          createdAt: effectiveCreatedAt,
          fromMemberId: {
            not: null,
          },
        },
        _count: {
          fromMemberId: true,
        },
      }),
      prisma.referral.groupBy({
        by: ["toMemberId"],
        where: {
          createdAt: effectiveCreatedAt,
          toMemberId: {
            not: null,
          },
        },
        _count: {
          toMemberId: true,
        },
      }),
    ]);

    const givenMap = new Map<string, number>(
      referralsGiven
        .filter(
          (
            item
          ): item is typeof item & {
            fromMemberId: string;
          } => typeof item.fromMemberId === "string"
        )
        .map((item) => [item.fromMemberId, item._count.fromMemberId])
    );

    const receivedMap = new Map<string, number>(
      referralsReceived
        .filter(
          (
            item
          ): item is typeof item & {
            toMemberId: string;
          } => typeof item.toMemberId === "string"
        )
        .map((item) => [item.toMemberId, item._count.toMemberId])
    );

    const leaderboard = members
      .map((member) => {
        const referralsGivenCount = givenMap.get(member.id) || 0;
        const referralsReceivedCount = receivedMap.get(member.id) || 0;
        const referralPoints = referralsGivenCount * referralGivenPoints;
        const receivedPoints =
          referralsReceivedCount * referralReceivedPoints;
        const points = referralPoints + receivedPoints;

        return {
          id: member.id,
          memberId: member.id,
          name: member.name,
          team: "Chapter",
          referralsGiven: referralsGivenCount,
          referralsReceived: referralsReceivedCount,
          breakdown: {
            referralPoints,
            receivedPoints,
          },
          points,
        };
      })
      .sort((a, b) => {
        if (b.points !== a.points) {
          return b.points - a.points;
        }

        if (b.referralsGiven !== a.referralsGiven) {
          return b.referralsGiven - a.referralsGiven;
        }

        if (b.referralsReceived !== a.referralsReceived) {
          return b.referralsReceived - a.referralsReceived;
        }

        return a.name.localeCompare(b.name);
      });

    const memberResults = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    const teamResults =
      leaderboard.length === 0
        ? []
        : [
            {
              id: "chapter-team",
              rank: 1,
              team: "Chapter",
              points: leaderboard.reduce((sum, member) => sum + member.points, 0),
              referralsGiven: leaderboard.reduce(
                (sum, member) => sum + member.referralsGiven,
                0
              ),
              referralsReceived: leaderboard.reduce(
                (sum, member) => sum + member.referralsReceived,
                0
              ),
            },
          ];

    return NextResponse.json({
      success: true,
      type,
      view,
      activeTerm,
      data: view === "team" ? teamResults : memberResults,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const TERM_START = new Date("2026-09-01");
const TERM_END = new Date("2026-12-31");

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "weekly";
    const view = searchParams.get("view") || "member";

    const now = new Date();

    let startDate: Date | undefined;
    let endDate: Date | undefined;

    const config = await prisma.systemConfig.findFirst({
      where: { key: "meetingDay" },
    });

    const meetingDay =
      config && !isNaN(Number(config.value))
        ? Number(config.value)
        : 3;

    if (type === "weekly") {
      const today = new Date();
      const currentDay = today.getDay();

      let daysSinceMeeting = currentDay - meetingDay;

      if (daysSinceMeeting <= 0) {
        daysSinceMeeting += 7;
      }

      endDate = new Date(today);
      endDate.setDate(today.getDate() - daysSinceMeeting);
      endDate.setHours(23, 59, 59, 999);

      startDate = new Date(endDate);
      startDate.setDate(endDate.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
    }

    if (type === "monthly") {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      endDate.setHours(23, 59, 59, 999);
    }

    const dateFilter =
      type === "term"
        ? {
            createdAt: {
              gte: TERM_START,
              lte: TERM_END,
            },
          }
        : startDate && endDate
          ? {
              createdAt: {
                gte: startDate,
                lte: endDate,
              },
            }
          : undefined;

    const scoringRules = await prisma.scoringRule.findMany();

    const scoringMap = new Map(
      scoringRules.map((rule) => [rule.key, rule.points])
    );

    const pointsCache: Record<string, number> = {};

    function getPoints(key: string) {
      if (!(key in pointsCache)) {
        pointsCache[key] = scoringMap.get(key) || 0;
      }
      return pointsCache[key];
    }

    const members = await prisma.member.findMany({
      select: {
        id: true,
        name: true,
        powerTeam: true,
      },
    });

    const memberMap = new Map(
      members.map((m) => [m.id, m])
    );

    const referralsGiven = await prisma.referral.groupBy({
      by: ["fromMemberId"],
      where: dateFilter || undefined,
      _count: { fromMemberId: true },
    });

    const referralsReceived = await prisma.referral.groupBy({
      by: ["toMemberId"],
      where: dateFilter || undefined,
      _count: { toMemberId: true },
    });

    const activities = await prisma.activityLog.groupBy({
      by: ["memberId", "type"],
      where: dateFilter || undefined,
      _count: { type: true },
    });

    const activityMap = new Map<
      number,
      Record<string, number>
    >();

    for (const a of activities) {
      if (!activityMap.has(a.memberId)) {
        activityMap.set(a.memberId, {});
      }

      const memberActivity = activityMap.get(a.memberId)!;
      if (a.type) {
        memberActivity[a.type] = a._count.type;
      }
    }

    const inductions = await prisma.member.groupBy({
      by: ["powerTeam"],
      where: dateFilter || undefined,
      _count: { id: true },
    });

    const inductionMap = new Map(
      inductions.map((i) => [i.powerTeam || "Unassigned", i._count.id])
    );

    const inductionBonus = getPoints("teamInductionBonus") || 100;
    const inductionPenalty = getPoints("teamInductionPenalty") || -100;
    const inductionThreshold = getPoints("teamInductionThreshold") || 2;

    const givenMap = new Map<number, number>(
      referralsGiven.map((item) => [item.fromMemberId!, item._count.fromMemberId])
    );

    const receivedMap = new Map<number, number>(
      referralsReceived.map((item) => [item.toMemberId!, item._count.toMemberId])
    );

    const leaderboard = members.map((member) => {
      const referralsGivenCount = givenMap.get(member.id) || 0;
      const referralsReceivedCount = receivedMap.get(member.id) || 0;
      const referralPoints = referralsGivenCount * getPoints("referralGiven");
      const memberActivity = activityMap.get(member.id) || {};
      const visitorPoints =
        (memberActivity["visitor"] || 0) * getPoints("bringingVisitors");
      const meetingPoints =
        (memberActivity["meeting"] || 0) * getPoints("ptMeetingAttendance");
      const trainingPoints =
        (memberActivity["training"] || 0) * getPoints("attendingTrainings");
      const oneToOneWithinPTPoints =
        (memberActivity["oneToOneWithinPT"] || 0) * getPoints("oneToOneWithinPT");
      const oneToOneOtherPTPoints =
        (memberActivity["oneToOneOtherPT"] || 0) * getPoints("oneToOneOtherPT");
      const oneToOneCrossChapterPoints =
        (memberActivity["oneToOneCrossChapter"] || 0) * getPoints("oneToOneCrossChapter");
      const preNetworkingPoints =
        (memberActivity["preNetworking"] || 0) * getPoints("preNetworking");
      const specificAskPoints =
        (memberActivity["specificAskConnected"] || 0) * getPoints("specificAskConnected");
      const etiquettePoints =
        (memberActivity["etiquette"] || 0) * getPoints("etiquette");
      const groupPitchPoints =
        (memberActivity["groupPitch"] || 0) * getPoints("groupPitch");
      const breakdown: Record<string, number> = {
        referralPoints,
        visitorPoints,
        meetingPoints,
        trainingPoints,
        oneToOneWithinPTPoints,
        oneToOneOtherPTPoints,
        oneToOneCrossChapterPoints,
        preNetworkingPoints,
        specificAskPoints,
        etiquettePoints,
        groupPitchPoints,
      };
      const points = Object.values(breakdown).reduce(
        (sum, val) => sum + val,
        0
      );

      return {
        memberId: member.id,
        name: member.name,
        referralsGiven: referralsGivenCount,
        referralsReceived: referralsReceivedCount,
        breakdown,
        points,
      };
    });

    leaderboard.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.referralsGiven !== a.referralsGiven)
        return b.referralsGiven - a.referralsGiven;
      if (b.referralsReceived !== a.referralsReceived)
        return b.referralsReceived - a.referralsReceived;
      return a.name.localeCompare(b.name);
    });

    const ranked = leaderboard.map((item, index) => ({
      rank: index + 1,
      ...item,
    }));

    let result;

    if (view === "team") {
      const teamMap = new Map<
        string,
        {
          team: string;
          points: number;
          referralsGiven: number;
          referralsReceived: number;
        }
      >();

      for (const member of leaderboard) {
        const team =
          (memberMap.get(member.memberId)?.powerTeam || "Unassigned").trim() || "Unassigned";

        if (!teamMap.has(team)) {
          teamMap.set(team, {
            team,
            points: 0,
            referralsGiven: 0,
            referralsReceived: 0,
          });
        }

        const teamData = teamMap.get(team)!;

        teamData.points += member.points;
        teamData.referralsGiven += member.referralsGiven;
        teamData.referralsReceived += member.referralsReceived;
      }

      for (const team of teamMap.values()) {
        const count = inductionMap.get(team.team) || 0;

        if (count >= inductionThreshold) {
          team.points += inductionBonus;
        } else {
          team.points += inductionPenalty;
        }
      }

      const teamLeaderboard = Array.from(teamMap.values());

      teamLeaderboard.sort(
        (a, b) =>
          b.points - a.points ||
          b.referralsGiven - a.referralsGiven ||
          b.referralsReceived - a.referralsReceived
      );

      result = teamLeaderboard.map((team, index) => ({
        rank: index + 1,
        ...team,
      }));
    } else {
      result = ranked;
    }

    return NextResponse.json({
      success: true,
      type,
      view,
      data: result,
    });
  } catch {
    return NextResponse.json(
      { success: false, error: "Failed to fetch leaderboard" },
      { status: 500 }
    );
  }
}

"use client";

import { useMemo } from "react";

type LeaderboardItem = {
  id: string | number;
  rank: number;
  name?: string;
  team?: string;
  points: number;
  breakdown?: Record<string, number>;
};

type LeaderboardAnalyticsProps = {
  data: LeaderboardItem[];
  view: "member" | "team";
  loading?: boolean;
};

function formatNumericValue(value: number) {
  return `${value.toLocaleString()} pts`;
}

export default function LeaderboardAnalytics({
  data,
  view,
  loading = false,
}: LeaderboardAnalyticsProps) {
  const hasData = data.length > 0;

  const topPerformer = useMemo(
    () => data.find((item) => item.rank === 1),
    [data]
  );

  const totalPoints = useMemo(
    () => data.reduce((sum, item) => sum + item.points, 0),
    [data]
  );

  const totalActivities = useMemo(
    () =>
      data.reduce((sum, item) => {
        const breakdownTotal = Object.values(item.breakdown || {}).reduce(
          (breakdownSum, value) => breakdownSum + value,
          0
        );

        return sum + breakdownTotal;
      }, 0),
    [data]
  );

  const averageScore = useMemo(
    () => (hasData ? totalPoints / data.length : 0),
    [data.length, hasData, totalPoints]
  );

  const safeAverage = Number.isFinite(averageScore)
    ? Number(averageScore.toFixed(1))
    : 0;

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-20 animate-pulse rounded-xl bg-slate-100"
          />
        ))}
      </div>
    );
  }

  const topPerformerLabel =
    view === "team"
      ? topPerformer?.team || topPerformer?.name || "--"
      : topPerformer?.name || topPerformer?.team || "--";

  const cards = hasData
    ? [
        {
          title: "Top Performer",
          value: topPerformerLabel,
          subtitle: topPerformer ? formatNumericValue(topPerformer.points) : "No data yet",
          icon: "🏆",
          className: "bg-gradient-to-r from-yellow-50 to-yellow-100 ring-yellow-200",
          isNumeric: false,
        },
        {
          title: "Total Points",
          value: totalPoints,
          subtitle: "Across current results",
          icon: "📈",
          className: "bg-white",
          isNumeric: true,
        },
        {
          title: "Total Activities",
          value: totalActivities,
          subtitle: "Sum of breakdown metrics",
          icon: "⚡",
          className: "bg-white",
          isNumeric: true,
        },
        {
          title: "Average Score",
          value: safeAverage,
          subtitle: `Per ${view}`,
          icon: "📊",
          className: "bg-white",
          isNumeric: true,
        },
      ]
    : [
        {
          title: "Top Performer",
          value: "--",
          subtitle: "No data yet",
          icon: "🏆",
          className: "bg-gradient-to-r from-yellow-50 to-yellow-100 ring-yellow-200",
          isNumeric: false,
        },
        {
          title: "Total Points",
          value: "--",
          subtitle: "No data yet",
          icon: "📈",
          className: "bg-white",
          isNumeric: false,
        },
        {
          title: "Total Activities",
          value: "--",
          subtitle: "No data yet",
          icon: "⚡",
          className: "bg-white",
          isNumeric: false,
        },
        {
          title: "Average Score",
          value: "--",
          subtitle: "No data yet",
          icon: "📊",
          className: "bg-white",
          isNumeric: false,
        },
      ];

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <div
          key={card.title}
          aria-label="Analytics card"
          className={`rounded-xl p-4 shadow-sm ring-1 ring-slate-200 transition-all duration-200 hover:shadow-md ${card.className} ${
            !hasData ? "opacity-70" : ""
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-slate-500">{card.title}</p>
            <span className="rounded-full bg-slate-100 p-2 text-lg">
              {card.icon}
            </span>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {card.isNumeric && typeof card.value === "number"
              ? formatNumericValue(card.value)
              : card.value}
          </p>
          <p className="mt-1 text-xs text-slate-500">{card.subtitle}</p>
        </div>
      ))}
    </div>
  );
}

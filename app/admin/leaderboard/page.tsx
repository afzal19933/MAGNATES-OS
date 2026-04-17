"use client";

import clsx from "clsx";
import { Fragment, useEffect, useState } from "react";
import LeaderboardAnalytics from "@/components/admin/LeaderboardAnalytics";
import PageHeader from "@/components/admin/PageHeader";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";

type LeaderboardType = "weekly" | "monthly" | "term";
type LeaderboardView = "member" | "team";

type LeaderboardItem = {
  id: string | number;
  rank: number;
  name?: string;
  team?: string;
  points: number;
  breakdown?: Record<string, number>;
};

const typeOptions: Array<{ label: string; value: LeaderboardType }> = [
  { label: "Weekly", value: "weekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Term", value: "term" },
];

const viewOptions: Array<{ label: string; value: LeaderboardView }> = [
  { label: "Member", value: "member" },
  { label: "Team", value: "team" },
];

function getPositionLabel(rank: number) {
  if (rank === 1) return "🥇";
  if (rank === 2) return "🥈";
  if (rank === 3) return "🥉";
  return String(rank);
}

function formatBreakdownLabel(key: string) {
  return key
    .replace(/_/g, " ")
    .replace(/\b\w/g, (character) => character.toUpperCase());
}

export default function LeaderboardPage() {
  const [type, setType] = useState<LeaderboardType>("weekly");
  const [view, setView] = useState<LeaderboardView>("member");
  const [data, setData] = useState<LeaderboardItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRow, setExpandedRow] = useState<string | number | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchLeaderboard() {
      setLoading(true);
      setError("");
      setExpandedRow(null);

      try {
        const params = new URLSearchParams({
          type,
          view,
        });

        const response = await fetch(
          `/api/referrals/leaderboard?${params.toString()}`,
          {
            cache: "no-store",
            signal: controller.signal,
          }
        );

        const result = (await response.json()) as {
          success?: boolean;
          data?: LeaderboardItem[];
          error?: string;
        };

        if (controller.signal.aborted) {
          return;
        }

        if (!response.ok || !result.success) {
          setData([]);
          setError(result.error || "Failed to load leaderboard");
          return;
        }

        setData(Array.isArray(result.data) ? result.data : []);
      } catch (fetchError) {
        if (controller.signal.aborted) {
          return;
        }

        if (fetchError instanceof Error && fetchError.name === "AbortError") {
          return;
        }

        setData([]);
        setError("Failed to load leaderboard");
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    void fetchLeaderboard();

    return () => controller.abort();
  }, [type, view]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Leaderboard"
        description="Track member and team performance across the chapter."
      />

      {!loading && !error && data.length > 0 ? (
        <LeaderboardAnalytics data={data} view={view} />
      ) : null}

      <Card>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-slate-700">Time Filter</p>
            <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 p-2">
              {typeOptions.map((option) => {
                const isActive = type === option.value;

                return (
                  <Button
                    key={option.value}
                    className={
                      isActive
                        ? "cursor-pointer bg-slate-900 px-4 py-2 text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800"
                        : "cursor-pointer bg-slate-100 px-4 py-2 text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-200"
                    }
                    onClick={() => setType(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>

          <div className="space-y-2 lg:border-l lg:border-slate-200 lg:pl-6">
            <p className="text-sm font-medium text-slate-700">View</p>
            <div className="flex flex-wrap gap-2 rounded-xl bg-slate-50 p-2">
              {viewOptions.map((option) => {
                const isActive = view === option.value;

                return (
                  <Button
                    key={option.value}
                    className={
                      isActive
                        ? "cursor-pointer bg-slate-900 px-4 py-2 text-white shadow-sm transition-all duration-200 hover:scale-[1.02] hover:bg-slate-800"
                        : "cursor-pointer bg-slate-100 px-4 py-2 text-slate-700 transition-all duration-200 hover:scale-[1.02] hover:bg-slate-200"
                    }
                    onClick={() => setView(option.value)}
                  >
                    {option.label}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </Card>

      <Card>
        <div className="space-y-2">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">
              Leaderboard Results
            </h2>
            <p className="text-sm text-slate-500">
              Showing: {view === "team" ? "Team Leaderboard" : "Member Leaderboard"}
            </p>
          </div>

          <div className="min-h-[120px] rounded-xl bg-slate-50 p-4">
            {loading ? (
              <div className="flex min-h-[120px] items-center justify-center">
                <p className="text-sm text-slate-500">Loading leaderboard...</p>
              </div>
            ) : error ? (
              <div className="flex min-h-[120px] items-center justify-center">
                <p className="text-sm text-rose-600">{error}</p>
              </div>
            ) : data.length === 0 ? (
              <div className="flex min-h-[120px] items-center justify-center">
                <p className="text-sm text-slate-500">
                  {view === "team"
                    ? "No team leaderboard data available"
                    : "No leaderboard data available"}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 z-10 bg-white">
                    <tr className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
                      <th className="w-12 px-4 py-2 text-center">Rank</th>
                      <th className="px-4 py-2 text-left">
                        {view === "team" ? "Team" : "Name"}
                      </th>
                      <th className="px-4 py-2 text-right">Points</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((item, index) => {
                      const rowClassName =
                        item.rank === 1
                          ? "bg-yellow-50"
                          : item.rank === 2
                            ? "bg-slate-100"
                            : item.rank === 3
                              ? "bg-orange-50"
                              : index % 2 === 0
                                ? "bg-white"
                                : "bg-slate-50";

                      const label =
                        view === "team"
                          ? item.team || item.name || "Unnamed Team"
                          : item.name || item.team || "Unnamed Member";

                      return (
                        <Fragment key={item.id}>
                          <tr
                            onClick={() =>
                              setExpandedRow(expandedRow === item.id ? null : item.id)
                            }
                            className={`cursor-pointer select-none border-b border-slate-100 transition-all duration-150 hover:bg-slate-100 ${rowClassName}`}
                          >
                            <td className="w-12 px-4 py-3 text-center">
                              {getPositionLabel(item.rank)}
                            </td>
                            <td className="px-4 py-3 font-medium text-slate-900">
                              <span className="mr-2 text-slate-400">
                                {expandedRow === item.id ? "▼" : "▶"}
                              </span>
                              {label}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {item.points.toLocaleString()} pts
                            </td>
                          </tr>

                          {expandedRow === item.id && item.breakdown ? (
                            <tr>
                              <td colSpan={3}>
                                <div className="overflow-hidden transition-all duration-300 ease-in-out">
                                  <div
                                    className={`
                                      border-l-2 border-slate-200 bg-slate-50/70 pl-4
                                      transition-all duration-300 ease-in-out
                                      ${
                                        expandedRow === item.id
                                          ? "opacity-0 translate-y-1 animate-[fadeIn_0.25s_ease-out_forwards]"
                                          : "opacity-100 translate-y-0"
                                      }
                                    `}
                                  >
                                    <div className="space-y-2 px-6 py-4 text-sm text-slate-600">
                                      {Object.entries(item.breakdown).map(
                                        ([key, value], breakdownIndex, breakdownEntries) => {
                                          const valueClassName = key.includes("referral")
                                            ? "font-medium text-slate-900"
                                            : key.includes("visitor")
                                              ? "text-blue-600"
                                              : key.includes("meeting")
                                                ? "text-green-600"
                                                : "text-slate-600";

                                          const isLast =
                                            breakdownIndex === breakdownEntries.length - 1;

                                          return (
                                            <div
                                              key={key}
                                              className={clsx(
                                                "flex justify-between rounded-md px-2 py-1.5 transition-all duration-300 ease-in-out hover:bg-slate-100/50",
                                                !isLast && "border-b border-slate-100"
                                              )}
                                            >
                                              <span className="text-slate-700">
                                                {formatBreakdownLabel(key)}
                                              </span>
                                              <span
                                                className={`min-w-[40px] text-right ${valueClassName}`}
                                              >
                                                {value}
                                              </span>
                                            </div>
                                          );
                                        }
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ) : null}
                        </Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}

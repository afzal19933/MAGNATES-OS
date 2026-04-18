"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

type TopbarProps = {
  onMenuClick: () => void;
};

const pageTitles: Record<string, string> = {
  dashboard: "Dashboard",
  "scoring-rules": "Scoring Rules",
  configuration: "Configuration",
  leaderboard: "Leaderboard",
  "activity-upload": "Activity Upload",
};

type ActiveTermResponse = {
  success?: boolean;
  data?: {
    id?: string;
    name?: string;
    isActive?: boolean;
  } | null;
};

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
  const [activeTermName, setActiveTermName] = useState<string | null>(null);

  useEffect(() => {
    let isCancelled = false;

    async function fetchActiveTerm() {
      try {
        const response = await fetch("/api/terms/active", {
          cache: "no-store",
        });

        if (!response.ok || isCancelled) {
          return;
        }

        const result = (await response.json()) as ActiveTermResponse;
        const nextName =
          result.success && result.data?.isActive && result.data.name
            ? result.data.name
            : null;

        if (!isCancelled) {
          setActiveTermName(nextName);
        }
      } catch {
        if (!isCancelled) {
          setActiveTermName(null);
        }
      }
    }

    void fetchActiveTerm();

    return () => {
      isCancelled = true;
    };
  }, []);

  const segments = pathname.split("/").filter(Boolean);
  const activeSegment = segments[segments.length - 1] || "dashboard";
  const title = pageTitles[activeSegment] || "Dashboard";

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-4 backdrop-blur md:px-8">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-700 md:hidden"
          aria-label="Open sidebar"
        >
          <span className="text-lg leading-none">&#9776;</span>
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden text-xs text-slate-500 sm:block">
          Active Term:{" "}
          <span className="font-medium text-slate-700">
            {activeTermName || "None"}
          </span>
        </p>
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
          A
        </div>
      </div>
    </header>
  );
}

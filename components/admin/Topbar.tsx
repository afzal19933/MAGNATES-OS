"use client";

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

export default function Topbar({ onMenuClick }: TopbarProps) {
  const pathname = usePathname();
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
          <span className="text-lg leading-none">≡</span>
        </button>
        <h1 className="text-lg font-semibold text-slate-900">{title}</h1>
      </div>

      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-200 text-sm font-semibold text-slate-700">
        A
      </div>
    </header>
  );
}

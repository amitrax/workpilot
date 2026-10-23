"use client";

import { Info } from "lucide-react";

export default function AIUsageCard({ workspace }) {
  const used = workspace?.aiCreditsUsed || 0;
  const total = workspace?.aiCreditsTotal || 10000;
  const percentageUsed = Math.min(100, Math.round((used / total) * 100));

  const radius = 40;
  const circumference = 2 * Math.PI * radius; // ~251.2
  const strokeDashoffset = circumference - (circumference * percentageUsed) / 100;

  const formattedResetDate = workspace?.aiCreditsResetAt
    ? new Date(workspace.aiCreditsResetAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "Monthly reset";

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] mt-6">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">
            AI Usage & Credits
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Track your workspace AI usage and available credits.
          </p>
        </div>
        <button
          onClick={() => alert(`Plan: ${workspace?.plan || "Starter"}. 1 credit per AI agent resolution.`)}
          className="text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
          title="Credit policy"
        >
          <Info size={15} />
        </button>
      </div>

      {/* Main Content: Gauge on Left, Stats on Right */}
      <div className="flex flex-col sm:flex-row items-center gap-6 my-3">
        {/* Circular Gauge */}
        <div className="relative w-24 h-24 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            {/* Gray track */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#f1f5f9"
              strokeWidth="8"
              fill="transparent"
            />
            {/* Purple progress arc */}
            <circle
              cx="50"
              cy="50"
              r="40"
              stroke="#6366f1"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-sm font-extrabold text-gray-900 leading-none">
              {percentageUsed}%
            </span>
            <span className="text-[9px] text-gray-400 font-medium uppercase mt-0.5">
              Used
            </span>
          </div>
        </div>

        {/* Stats Column */}
        <div className="space-y-2.5 flex-1 w-full text-xs">
          <div className="flex items-center justify-between">
            <span className="text-gray-500">AI Credits Used</span>
            <span className="font-bold text-indigo-600">
              {used.toLocaleString()} / {total.toLocaleString()}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-gray-500">Resets on</span>
            <span className="font-semibold text-gray-800">
              {formattedResetDate}
            </span>
          </div>
        </div>
      </div>

      {/* Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={() => alert(`Credits allocated to ${workspace?.name || "current workspace"}.`)}
          className="w-full py-2 px-4 text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-2xs transition-all text-center cursor-pointer"
        >
          View Usage Details
        </button>
      </div>
    </div>
  );
}

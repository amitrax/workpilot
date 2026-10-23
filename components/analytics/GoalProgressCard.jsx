"use client";

import { ChevronDown, ArrowRight } from "lucide-react";

export default function GoalProgressCard({ goals = [] }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between mb-5">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <h3 className="text-xs font-bold text-gray-900 tracking-tight">Goals Progress</h3>
        <button className="flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md border border-gray-200">
          <span>This Month</span>
          <ChevronDown size={11} />
        </button>
      </div>

      {/* Progress Bars */}
      <div className="space-y-3.5">
        {goals.map((goal) => (
          <div key={goal.id}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="font-semibold text-gray-800">{goal.title}</span>
              <span className="font-bold text-gray-900">{goal.percentage}%</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${goal.barColor}`}
                style={{ width: `${goal.percentage}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
              <span>{goal.current}</span>
              <span>Target: {goal.target}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Link */}
      <button
        onClick={() => alert("Open goals setting dialog")}
        className="mt-3 pt-2.5 border-t border-gray-100 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors w-full justify-start"
      >
        <span>View all insights</span>
        <ArrowRight size={12} />
      </button>
    </div>
  );
}

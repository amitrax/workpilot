"use client";

import { Sparkles, TrendingUp, Users, Star, ArrowRight, BarChart2 } from "lucide-react";

const iconMap = {
  "trending-up": TrendingUp,
  users: Users,
  star: Star,
};

export default function AIInsightsCard({ insights = [] }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-purple-100/90 shadow-[0_1px_3px_rgba(147,51,234,0.05)] flex flex-col justify-between h-full">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <div className="w-5 h-5 rounded-lg bg-purple-600 text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
            <Sparkles size={12} />
          </div>
          <h3 className="text-sm font-bold text-gray-900 tracking-tight">AI Insights</h3>
        </div>

        {/* Insight Items or empty state */}
        {insights && insights.length > 0 ? (
          <div className="space-y-3">
            {insights.map((ins) => {
              const Icon = iconMap[ins.icon] || Sparkles;
              return (
                <div key={ins.id} className="flex items-start gap-2.5 group">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${ins.bgColor} ${ins.iconColor} transition-transform group-hover:scale-105`}
                  >
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-gray-900 leading-tight">
                      {ins.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 leading-relaxed mt-0.5">
                      {ins.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <BarChart2 size={22} className="text-gray-300" />
            <p className="text-xs text-gray-400 font-medium">Not enough data yet.</p>
            <p className="text-[11px] text-gray-400">Add leads, conversations, or revenue to see insights.</p>
          </div>
        )}
      </div>

      {/* Link */}
      <button
        onClick={() => alert("Opening AI Executive Report...")}
        className="mt-3 pt-2.5 border-t border-gray-100 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors w-full justify-start"
      >
        <span>View all insights</span>
        <ArrowRight size={12} />
      </button>
    </div>
  );
}

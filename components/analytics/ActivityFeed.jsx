"use client";

import { UserPlus, Calendar, MessageSquare, Wallet, GitBranch, ArrowRight, Activity } from "lucide-react";

const iconMap = {
  "user-plus": UserPlus,
  calendar: Calendar,
  "message-square": MessageSquare,
  wallet: Wallet,
  workflow: GitBranch,
};

export default function ActivityFeed({ activities = [] }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] flex flex-col justify-between">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
          <h3 className="text-xs font-bold text-gray-900 tracking-tight">Real-time Activity</h3>
          <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </div>

        {/* Activity items list or empty state */}
        {activities && activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((act) => {
              const Icon = iconMap[act.icon] || UserPlus;
              return (
                <div key={act.id} className="flex items-start gap-2.5 group">
                  <div
                    className={`w-7 h-7 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${act.bgColor} ${act.iconColor} transition-transform group-hover:scale-105`}
                  >
                    <Icon size={13} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="text-xs font-bold text-gray-900 leading-tight truncate">
                        {act.title}
                      </h4>
                      <span className="text-[10px] text-gray-400 flex-shrink-0">{act.time}</span>
                    </div>
                    <p className="text-[11px] text-gray-500 leading-tight mt-0.5 truncate">
                      {act.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-2">
            <Activity size={22} className="text-gray-300" />
            <p className="text-xs text-gray-400 font-medium">No recent activity.</p>
            <p className="text-[11px] text-gray-400">Activity will appear as your workspace gets data.</p>
          </div>
        )}
      </div>

      {/* Link */}
      <button
        onClick={() => alert("Opening full audit feed...")}
        className="mt-3 pt-2.5 border-t border-gray-100 text-xs font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors w-full justify-start"
      >
        <span>View all activity</span>
        <ArrowRight size={12} />
      </button>
    </div>
  );
}

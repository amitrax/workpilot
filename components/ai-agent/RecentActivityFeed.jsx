"use client";

import { Bot, Target, Calendar, FileText, Users } from "lucide-react";

const iconMap = {
  bot: Bot,
  target: Target,
  calendar: Calendar,
  "file-text": FileText,
  users: Users,
};

export default function RecentActivityFeed({ activities = [] }) {
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] mt-4">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100/80 mb-3">
        <h3 className="text-sm font-bold text-gray-900 tracking-tight">Recent Activity</h3>
        <span className="text-[11px] text-gray-400 font-medium">Live Feed</span>
      </div>

      {/* Activity List or Empty State */}
      {activities && activities.length > 0 ? (
        <div className="space-y-3.5">
          {activities.slice(0, 4).map((act) => {
            const Icon = iconMap[act.icon] || Bot;
            return (
              <div key={act.id} className="flex items-start gap-3 group">
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 ${act.color || "bg-indigo-50 text-indigo-600"} transition-transform group-hover:scale-105`}
                >
                  <Icon size={15} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-gray-900 leading-tight truncate">
                    {act.title}
                  </p>
                  <p className="text-[11px] text-gray-400 leading-tight mt-0.5 truncate">
                    {act.subtitle}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-6 text-center">
          <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 mx-auto mb-2">
            <Bot size={16} />
          </div>
          <p className="text-xs font-medium text-gray-600">No recent AI activity recorded</p>
          <p className="text-[11px] text-gray-400 mt-0.5">
            Agent events will appear here in real time.
          </p>
        </div>
      )}
    </div>
  );
}

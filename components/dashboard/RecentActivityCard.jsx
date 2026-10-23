import Link from "next/link";
import {
  MessageCircle, Calendar, Zap, Globe, UserCheck, Activity,
} from "lucide-react";

const iconConfig = {
  whatsapp: { Icon: MessageCircle, bg: "bg-green-50", color: "text-green-600" },
  calendar: { Icon: Calendar, bg: "bg-indigo-50", color: "text-indigo-600" },
  zap: { Icon: Zap, bg: "bg-amber-50", color: "text-amber-600" },
  globe: { Icon: Globe, bg: "bg-blue-50", color: "text-blue-600" },
  "user-check": { Icon: UserCheck, bg: "bg-purple-50", color: "text-purple-600" },
};

function ActivityItem({ activity }) {
  const config = iconConfig[activity.icon] || iconConfig.zap;
  const { Icon, bg, color } = config;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-gray-50 last:border-0">
      <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center flex-shrink-0 mt-0.5`}>
        <Icon size={14} className={color} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-800 truncate">{activity.title}</p>
        <p className="text-xs text-gray-400 mt-0.5">{activity.subtitle}</p>
      </div>
      <span className="text-xs text-gray-400 flex-shrink-0 mt-0.5">{activity.time}</span>
    </div>
  );
}

export default function RecentActivityCard({ activities = [] }) {
  const hasActivities = activities && activities.length > 0;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col justify-between">
      <div>
        {/* Header */}
        <div className="flex items-center justify-between mb-1">
          <h2 className="text-base font-semibold text-gray-900">Recent Activity</h2>
          <Link
            href="/conversations"
            className="text-xs text-indigo-600 font-medium hover:text-indigo-700 transition-colors"
          >
            View all
          </Link>
        </div>

        {/* Feed / Empty State */}
        {hasActivities ? (
          <div>
            {activities.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        ) : (
          <div className="py-8 text-center flex flex-col items-center justify-center">
            <div className="w-10 h-10 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 mb-2">
              <Activity size={18} />
            </div>
            <p className="text-sm font-medium text-gray-700">No recent activity</p>
            <p className="text-xs text-gray-400 mt-1 max-w-[220px]">
              New leads, appointments, and AI interactions will appear here in real time.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}


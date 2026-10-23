"use client";

import { MessageSquare, Target, Users, Star, ArrowUpRight, TrendingUp } from "lucide-react";

const iconMap = {
  "message-square": MessageSquare,
  target: Target,
  users: Users,
  star: Star,
};

export function SingleStatCard({ card }) {
  const Icon = iconMap[card.icon] || MessageSquare;
  const hasValidGrowth = card.growth && card.growth !== "—" && card.growth !== "0%";

  return (
    <div className="bg-white rounded-2xl p-4.5 border border-gray-100/90 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
      {/* Icon top row */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.accentBg} ${card.iconColor} transition-transform group-hover:scale-105`}>
          <Icon size={18} />
        </div>
      </div>

      {/* Label and Big Value */}
      <div>
        <p className="text-gray-500 text-xs font-medium">{card.title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className={`text-2xl font-bold tracking-tight ${card.value === "—" ? "text-gray-400" : "text-gray-900"}`}>
            {card.value}
          </span>
        </div>
      </div>

      {/* Growth comparison */}
      <div className="flex items-center gap-1.5 mt-2.5 text-xs">
        {hasValidGrowth ? (
          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md">
            <ArrowUpRight size={13} className="stroke-[2.5]" />
            {card.growth}
          </span>
        ) : (
          <span className="text-gray-400 font-normal">—</span>
        )}
        <span className="text-gray-400 font-normal">{card.comparison || "No comparison data"}</span>
      </div>
    </div>
  );
}

export default function AgentStatsCard({ cards = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <SingleStatCard key={card.id} card={card} />
      ))}
    </div>
  );
}

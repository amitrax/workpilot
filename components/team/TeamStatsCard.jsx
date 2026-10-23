"use client";

import { Users, UserCheck, Shield, Mail, ArrowUpRight, ArrowDownRight } from "lucide-react";

const iconMap = {
  users: Users,
  "user-check": UserCheck,
  shield: Shield,
  mail: Mail,
};

export function SingleTeamStat({ card }) {
  const Icon = iconMap[card.icon] || Users;

  return (
    <div className="bg-white rounded-2xl p-4.5 border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-200 group flex flex-col justify-between">
      {/* Icon top */}
      <div className="flex items-center justify-between mb-3">
        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${card.accentBg} ${card.iconColor} transition-transform group-hover:scale-105`}>
          <Icon size={18} />
        </div>
      </div>

      {/* Label and Value */}
      <div>
        <p className="text-gray-500 text-xs font-medium">{card.title}</p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold text-gray-900 tracking-tight">{card.value}</span>
        </div>
      </div>

      {/* Growth comparison */}
      <div className="flex items-center gap-1.5 mt-2.5 text-xs">
        {card.growthPositive === true && (
          <span className="inline-flex items-center gap-0.5 text-emerald-600 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded-md text-[11px]">
            <ArrowUpRight size={12} className="stroke-[2.5]" />
            {card.growth}
          </span>
        )}
        {card.growthPositive === false && (
          <span className="inline-flex items-center gap-0.5 text-rose-600 font-semibold bg-rose-50 px-1.5 py-0.5 rounded-md text-[11px]">
            <ArrowDownRight size={12} className="stroke-[2.5]" />
            {card.growth}
          </span>
        )}
        {card.growthPositive === null && (
          <span className="text-gray-400 font-medium text-[11px]">
            {card.growth}
          </span>
        )}
      </div>
    </div>
  );
}

export default function TeamStatsCard({ cards = [] }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card) => (
        <SingleTeamStat key={card.id} card={card} />
      ))}
    </div>
  );
}

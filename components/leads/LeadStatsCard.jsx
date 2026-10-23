"use client";

import {
  Users, UserPlus, UserCheck, TrendingUp, XCircle, TrendingDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { leadStats } from "@/lib/mockData";

const iconMap = {
  users: Users,
  "user-plus": UserPlus,
  "user-check": UserCheck,
  "trending-up": TrendingUp,
  "x-circle": XCircle,
};

const colorMap = {
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", ring: "ring-indigo-100" },
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   ring: "ring-blue-100" },
  green:  { bg: "bg-emerald-50",icon: "text-emerald-600",ring: "ring-emerald-100" },
  orange: { bg: "bg-orange-50", icon: "text-orange-500", ring: "ring-orange-100" },
  red:    { bg: "bg-red-50",    icon: "text-red-500",    ring: "ring-red-100" },
};

export default function LeadStatsCard({ card }) {
  const Icon = iconMap[card.icon] || Users;
  const colors = colorMap[card.color] || colorMap.indigo;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow duration-200 flex-1 min-w-0">
      <div className="flex items-start justify-between mb-3">
        <p className="text-gray-500 text-sm font-medium leading-tight">{card.label}</p>
        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center ring-1 flex-shrink-0", colors.bg, colors.ring)}>
          <Icon size={18} className={colors.icon} />
        </div>
      </div>
      <div className="flex items-end gap-2 mb-1">
        <span className="text-[26px] font-bold text-gray-900 leading-none tracking-tight">
          {card.value}
        </span>
        <span className={cn(
          "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full mb-0.5",
          card.growthPositive ? "text-emerald-700 bg-emerald-50" : "text-red-600 bg-red-50"
        )}>
          {card.growthPositive ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
          {card.growth}
        </span>
      </div>
      <p className="text-gray-400 text-xs">{card.subtitle}</p>
    </div>
  );
}

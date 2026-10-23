"use client";

import {
  Users, UserCheck, DollarSign, TrendingUp, TrendingDown, Activity,
} from "lucide-react";
import { cn } from "@/lib/utils";

const iconMap = {
  users:        Users,
  "user-check": UserCheck,
  dollar:       DollarSign,
  "dollar-sign":DollarSign,
  "trending-up":TrendingUp,
  activity:     Activity,
};

const colorMap = {
  indigo: { bg: "bg-indigo-50", icon: "text-indigo-600", ring: "ring-indigo-100" },
  green:  { bg: "bg-emerald-50",icon: "text-emerald-600",ring: "ring-emerald-100" },
  blue:   { bg: "bg-blue-50",   icon: "text-blue-600",   ring: "ring-blue-100" },
  orange: { bg: "bg-orange-50", icon: "text-orange-500", ring: "ring-orange-100" },
  purple: { bg: "bg-purple-50", icon: "text-purple-600", ring: "ring-purple-100" },
};

/**
 * CustomerStatsCard — reusable metric card for the customers header section.
 * Props: card: { label, value, growth, growthPositive, subtitle, icon, color }
 */
export default function CustomerStatsCard({ card }) {
  const Icon   = iconMap[card.icon]  || Users;
  const colors = colorMap[card.color]|| colorMap.indigo;
  const badgeText = card.badge || card.growth;
  const isPositive = card.badgePositive !== undefined ? card.badgePositive : (card.growthPositive !== false);

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
        {badgeText && (
          <span className={cn(
            "flex items-center gap-0.5 text-xs font-semibold px-1.5 py-0.5 rounded-full mb-0.5",
            isPositive ? "text-emerald-700 bg-emerald-50" : "text-amber-700 bg-amber-50"
          )}>
            {isPositive ? <TrendingUp size={10}/> : <TrendingDown size={10}/>}
            {badgeText}
          </span>
        )}
      </div>

      <p className="text-gray-400 text-xs">{card.subtitle}</p>
    </div>
  );
}
